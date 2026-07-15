import { it, expect } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rateLimit from '@fastify/rate-limit';
import { alertRoutes } from '../presentation/routes/alertRoutes.js';
import { observationRoutes } from '../presentation/routes/observationRoutes.js';
import { regionRoutes } from '../presentation/routes/regionRoutes.js';
import { healthRoutes } from '../presentation/routes/healthRoutes.js';
import { subscriptionRoutes } from '../presentation/routes/subscriptionRoutes.js';
import { websocketRoutes } from '../presentation/websocket/weatherSocket.js';
import { InMemoryAlertRepository } from '../infrastructure/repositories/InMemoryAlertRepository.js';
import { WeatherAlertDomainService } from '@stormwatch/domain';
import { GetActiveAlertsUseCase, RecordObservationUseCase, ResolveAlertUseCase } from '@stormwatch/application';
import { InProcessEventBus } from '../infrastructure/events/InProcessEventBus.js';

it('manual buildApp steps', async () => {
  const t0 = Date.now();
  const log = (msg: string) => console.log(`[+${Date.now()-t0}ms] ${msg}`);
  
  const app = Fastify({ logger: false });
  log('Fastify created');
  await app.register(helmet, { contentSecurityPolicy: false }); log('helmet done');
  await app.register(cors, { origin: 'http://localhost:5173', credentials: true }); log('cors done');
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' }); log('rateLimit done');
  await app.register(websocket); log('websocket done');
  await app.register(swagger, { openapi: { info: { title: 'StormWatch BH API', description: 'Real-time severe weather monitoring API for Bosnia and Herzegovina', version: '1.0.0' }, tags: [{ name: 'alerts', description: 'Weather alert operations' }, { name: 'observations', description: 'Weather observation ingestion' }] } }); log('swagger done');
  await app.register(swaggerUi, { routePrefix: '/docs' }); log('swaggerUi done');
  
  const alertRepository = new InMemoryAlertRepository();
  const observationRepository = { findById: async () => null, findByStation: async () => [], findByRegion: async () => [], findLatestByStation: async () => null, findAllLatestPerStation: async () => [], save: async () => {} };
  const eventBus = new InProcessEventBus();
  const alertDomainService = new WeatherAlertDomainService();
  let n = 0;
  const container = {
    alertRepository,
    observationRepository,
    subscriptionRepository: { subscribe: async (email: string) => ({ email, subscribedAt: new Date(), regions: [] }), unsubscribe: async () => true, findByEmail: async () => null, count: async () => 0, getAllEmails: async () => [] },
    notificationService: { sendAlertCreated: async () => {}, sendAlertEscalated: async () => {}, sendAlertResolved: async () => {}, sendWelcomeEmail: async () => {} },
    eventBus,
    getActiveAlertsUseCase: new GetActiveAlertsUseCase(alertRepository),
    recordObservationUseCase: new RecordObservationUseCase({ alertRepository, observationRepository: observationRepository as any, alertDomainService, idGenerator: { generate: () => `test-${++n}` }, notificationService: { sendAlertCreated: async () => {}, sendAlertEscalated: async () => {}, sendAlertResolved: async () => {}, sendWelcomeEmail: async () => {} } as any, eventBus, regionNameResolver: { resolve: (id: string) => id } }),
    resolveAlertUseCase: new ResolveAlertUseCase(alertRepository, eventBus),
  };
  app.decorate('container', container as any);
  
  log('registering routes...');
  await app.register(healthRoutes, { prefix: '/health' }); log('health done');
  await app.register(alertRoutes, { prefix: '/api/v1/alerts' }); log('alerts done');
  await app.register(observationRoutes, { prefix: '/api/v1/observations' }); log('observations done');
  await app.register(regionRoutes, { prefix: '/api/v1/regions' }); log('regions done');
  await app.register(subscriptionRoutes, { prefix: '/api/v1/subscriptions' }); log('subscriptions done');
  await app.register(websocketRoutes, { prefix: '/ws' }); log('websocket routes done');
  
  log('calling app.ready()...');
  await app.ready(); log('app.ready() done!');
  await app.close(); log('app.close() done!');
  
  expect(true).toBe(true);
}, 30000);
