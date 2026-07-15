/**
 * API route integration tests — uses Fastify's inject() so no real HTTP server
 * is started and no database connection is needed (in-memory container injected).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { InMemoryAlertRepository } from '../infrastructure/repositories/InMemoryAlertRepository.js';
import { WeatherAlertDomainService, IWeatherObservationRepository, WeatherObservation } from '@stormwatch/domain';

/** Minimal in-memory observation repo for tests (production uses DrizzleObservationRepository). */
class FakeObservationRepository implements IWeatherObservationRepository {
  private store = new Map<string, WeatherObservation>();
  async findById(id: string) { return this.store.get(id) ?? null; }
  async findByStation() { return []; }
  async findByRegion() { return []; }
  async findLatestByStation() { return null; }
  async findAllLatestPerStation() { return [...this.store.values()]; }
  async save(obs: WeatherObservation) { this.store.set(obs.id, obs); }
}
import {
  GetActiveAlertsUseCase,
  RecordObservationUseCase,
  ResolveAlertUseCase,
} from '@stormwatch/application';
import type { AppContainer } from '../infrastructure/container.js';
import { InProcessEventBus } from '../infrastructure/events/InProcessEventBus.js';

// ── In-memory test container (no DB, no email) ────────────────────────────────

function buildTestContainer(): AppContainer {
  const alertRepository = new InMemoryAlertRepository();
  const observationRepository = new FakeObservationRepository();
  const eventBus = new InProcessEventBus();
  const alertDomainService = new WeatherAlertDomainService();
  let n = 0;
  const idGenerator = { generate: () => `test-${++n}` };

  const notificationService = {
    sendAlertCreated: async () => {},
    sendAlertEscalated: async () => {},
    sendAlertResolved: async () => {},
    sendWelcomeEmail: async () => {},
  };

  const subscriptionRepository = {
    subscribe: async (email: string) => ({ email, subscribedAt: new Date(), regions: [] }),
    unsubscribe: async () => true,
    findByEmail: async () => null,
    count: async () => 0,
    getAllEmails: async () => [],
  } as unknown as AppContainer['subscriptionRepository'];

  return {
    alertRepository,
    observationRepository,
    subscriptionRepository,
    notificationService,
    eventBus,
    getActiveAlertsUseCase: new GetActiveAlertsUseCase(alertRepository),
    recordObservationUseCase: new RecordObservationUseCase({
      alertRepository,
      observationRepository,
      alertDomainService,
      idGenerator,
      notificationService,
      eventBus,
      regionNameResolver: { resolve: (id) => id },
    }),
    resolveAlertUseCase: new ResolveAlertUseCase(alertRepository, eventBus),
  };
}

// ── Test setup ────────────────────────────────────────────────────────────────

let app: FastifyInstance;

beforeAll(async () => {
  // Set a known secret so the auth check passes in route tests
  process.env['WORKER_SECRET'] = 'test-secret';
  app = await buildApp(buildTestContainer());
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });

  it('includes service name', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.json().service).toBe('stormwatch-bh-api');
  });
});

describe('GET /api/v1/regions', () => {
  it('returns 200 with all 10 BiH regions', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/regions' });
    expect(res.statusCode).toBe(200);
    expect(res.json().count).toBe(10);
  });

  it('each region has required fields', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/regions' });
    const region = res.json().data[0];
    expect(region).toHaveProperty('id');
    expect(region).toHaveProperty('localName');
    expect(region).toHaveProperty('entity');
    expect(region).toHaveProperty('centroid');
  });
});

describe('GET /api/v1/alerts', () => {
  it('returns 200 with empty list when no alerts', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/alerts' });
    expect(res.statusCode).toBe(200);
    expect(res.json().count).toBe(0);
    expect(res.json().data).toEqual([]);
  });
});

describe('POST /api/v1/observations', () => {
  const validObservation = {
    stationId: 'test-station',
    regionId: 'sarajevo',
    latitude: 43.85,
    longitude: 18.41,
    temperatureCelsius: 22,
    windSpeedKmh: 10,
    windGustKmh: 15,
    precipitationMmPerHour: 0,
    humidityPercent: 60,
    visibilityKm: 10,
    pressureHpa: 1013,
    source: 'AUTOMATIC_STATION',
    observedAt: new Date().toISOString(),
  };

  const AUTH = { 'x-worker-token': process.env['WORKER_SECRET'] ?? 'test-secret' };

  it('returns 401 when X-Worker-Token is missing', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/observations', payload: validObservation });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when X-Worker-Token is wrong', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/observations',
      headers: { 'x-worker-token': 'wrong-secret' },
      payload: validObservation,
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 201 for a valid observation with correct token', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/observations',
      headers: AUTH,
      payload: validObservation,
    });
    expect(res.statusCode).toBe(201);
  });

  it('no alert for calm conditions', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/observations',
      headers: AUTH,
      payload: validObservation,
    });
    expect(res.json().data.alertCreated).toBeNull();
  });

  it('creates alert for extreme wind', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/observations',
      headers: AUTH,
      payload: { ...validObservation, windSpeedKmh: 95, windGustKmh: 130 },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.alertCreated.severity).toBe('CRITICAL');
  });

  it('returns 400 for invalid payload', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/v1/observations',
      headers: AUTH,
      payload: { stationId: 'only-id' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/v1/subscriptions', () => {
  it('returns 201 for a valid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/subscriptions',
      payload: { email: 'test@example.com' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().subscriber.email).toBe('test@example.com');
  });

  it('returns 400 for invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/subscriptions',
      payload: { email: 'not-an-email' },
    });
    expect(res.statusCode).toBe(400);
  });
});
