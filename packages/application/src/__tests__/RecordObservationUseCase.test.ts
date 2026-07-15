/**
 * RecordObservationUseCase — unit tests
 *
 * Uses in-memory fakes for all infrastructure dependencies.
 * No real database, no real email, no real event bus — pure business logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordObservationUseCase } from '../use-cases/RecordObservationUseCase.js';
import { WeatherAlertDomainService, IWeatherAlertRepository, IWeatherObservationRepository } from '@stormwatch/domain';
import type { IIdGenerator, INotificationService, IEventBus } from '../ports/index.js';

// ── Fakes ──────────────────────────────────────────────────────────────────────

class FakeAlertRepository implements IWeatherAlertRepository {
  private store = new Map<string, import('@stormwatch/domain').WeatherAlert>();

  async findById(id: string) { return this.store.get(id) ?? null; }
  async findActiveByRegion(regionId: string) {
    return [...this.store.values()].filter(
      (a) => a.regionId === regionId && (a.status === 'ACTIVE' || a.status === 'ESCALATED'),
    );
  }
  async findAllActive() {
    return [...this.store.values()].filter(
      (a) => a.status === 'ACTIVE' || a.status === 'ESCALATED',
    );
  }
  async save(alert: import('@stormwatch/domain').WeatherAlert) {
    this.store.set(alert.id, alert);
  }
  count() { return this.store.size; }
}

class FakeObservationRepository implements IWeatherObservationRepository {
  async findById() { return null; }
  async findByStation() { return []; }
  async findByRegion() { return []; }
  async findLatestByStation() { return null; }
  async findAllLatestPerStation() { return []; }
  async save() {}
}

const fakeEventBus: IEventBus = { publish: vi.fn() };
const fakeNotification: INotificationService = {
  sendAlertCreated: vi.fn(),
  sendAlertEscalated: vi.fn(),
  sendAlertResolved: vi.fn(),
  sendWelcomeEmail: vi.fn(),
};
const fakeIdGen: IIdGenerator = { generate: (() => {
  let n = 0;
  return () => `id-${++n}`;
})() };

/** Base observation payload for Sarajevo with calm conditions. */
const CALM_CMD = {
  stationId: 'station-sarajevo',
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
  source: 'API_PROVIDER' as const,
  // Use current time so the "not in future" validation always passes
  observedAt: new Date(),
};

/** Observation with extreme wind — should trigger a CRITICAL alert. */
const EXTREME_WIND_CMD = {
  ...CALM_CMD,
  windSpeedKmh: 95,
  windGustKmh: 130,
};

/** Forecast observation — same wind but forecastFor is 2 days ahead. */
const FORECAST_WIND_CMD = {
  ...EXTREME_WIND_CMD,
  forecastFor: new Date('2026-07-17T12:00:00Z'),
};

// ── Helper ────────────────────────────────────────────────────────────────────

function makeUseCase(alertRepo = new FakeAlertRepository()) {
  return {
    useCase: new RecordObservationUseCase({
      alertRepository: alertRepo,
      observationRepository: new FakeObservationRepository(),
      alertDomainService: new WeatherAlertDomainService(),
      idGenerator: fakeIdGen,
      notificationService: fakeNotification,
      eventBus: fakeEventBus,
      regionNameResolver: { resolve: () => 'Kanton Sarajevo' },
    }),
    alertRepo,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RecordObservationUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('observed conditions — no alert', () => {
    it('returns null alertCreated for normal conditions', async () => {
      const { useCase } = makeUseCase();
      const result = await useCase.execute(CALM_CMD);
      expect(result.alertCreated).toBeNull();
    });

    it('does not persist an alert for calm conditions', async () => {
      const { useCase, alertRepo } = makeUseCase();
      await useCase.execute(CALM_CMD);
      expect(alertRepo.count()).toBe(0);
    });
  });

  describe('observed conditions — alert created', () => {
    it('creates a CRITICAL alert for extreme wind', async () => {
      const { useCase } = makeUseCase();
      const result = await useCase.execute(EXTREME_WIND_CMD);
      expect(result.alertCreated).not.toBeNull();
      expect(result.alertCreated!.severity).toBe('CRITICAL');
    });

    it('sets the human-readable region name (not raw regionId)', async () => {
      const { useCase } = makeUseCase();
      const result = await useCase.execute(EXTREME_WIND_CMD);
      expect(result.alertCreated!.regionName).toBe('Kanton Sarajevo');
    });

    it('fires a welcome/alert notification', async () => {
      const { useCase } = makeUseCase();
      await useCase.execute(EXTREME_WIND_CMD);
      expect(fakeNotification.sendAlertCreated).toHaveBeenCalledOnce();
    });

    it('publishes domain events to the event bus', async () => {
      const { useCase } = makeUseCase();
      await useCase.execute(EXTREME_WIND_CMD);
      expect(fakeEventBus.publish).toHaveBeenCalled();
    });

    it('does not create a second alert for the same region+condition', async () => {
      const { useCase, alertRepo } = makeUseCase();
      await useCase.execute(EXTREME_WIND_CMD);
      await useCase.execute(EXTREME_WIND_CMD); // second identical observation
      expect(alertRepo.count()).toBe(1); // still just one alert
    });
  });

  describe('forecast conditions', () => {
    it('creates a forecast alert with isForecasted=true', async () => {
      const { useCase } = makeUseCase();
      const result = await useCase.execute(FORECAST_WIND_CMD);
      expect(result.alertCreated).not.toBeNull();
      expect(result.alertCreated!.isForecasted).toBe(true);
    });

    it('discounts forecast severity (CRITICAL → HIGH)', async () => {
      const { useCase } = makeUseCase();
      const result = await useCase.execute(FORECAST_WIND_CMD);
      // Extreme wind is CRITICAL observed, but forecast → HIGH
      expect(result.alertCreated!.severity).toBe('HIGH');
    });

    it('forecast title starts with "Prognoza"', async () => {
      const { useCase } = makeUseCase();
      const result = await useCase.execute(FORECAST_WIND_CMD);
      expect(result.alertCreated!.title).toMatch(/^Prognoza/);
    });

    it('keeps observed and forecast alerts separate (different condition match)', async () => {
      const { useCase, alertRepo } = makeUseCase();
      await useCase.execute(EXTREME_WIND_CMD);   // observed
      await useCase.execute(FORECAST_WIND_CMD);  // forecast — should not reuse observed alert
      expect(alertRepo.count()).toBe(2);
    });
  });
});
