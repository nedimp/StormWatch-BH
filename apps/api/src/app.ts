import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rateLimit from '@fastify/rate-limit';
import { alertRoutes } from './presentation/routes/alertRoutes.js';
import { observationRoutes } from './presentation/routes/observationRoutes.js';
import { regionRoutes } from './presentation/routes/regionRoutes.js';
import { healthRoutes } from './presentation/routes/healthRoutes.js';
import { websocketRoutes } from './presentation/websocket/weatherSocket.js';
import { buildContainer } from './infrastructure/container.js';
import { logger } from './infrastructure/logger.js';

export async function buildApp(): Promise<ReturnType<typeof Fastify>> {
  const app = Fastify({ logger });

  // ── Security ─────────────────────────────────────────────────────────────
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173',
    credentials: true,
  });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // ── WebSocket ─────────────────────────────────────────────────────────────
  await app.register(websocket);

  // ── Swagger ──────────────────────────────────────────────────────────────
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'StormWatch BH API',
        description: 'Real-time severe weather monitoring API for Bosnia and Herzegovina',
        version: '1.0.0',
      },
      tags: [
        { name: 'alerts', description: 'Weather alert operations' },
        { name: 'observations', description: 'Weather observation ingestion' },
        { name: 'regions', description: 'BiH geographic regions' },
        { name: 'health', description: 'Service health & readiness' },
      ],
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // ── DI Container ─────────────────────────────────────────────────────────
  const container = buildContainer();
  app.decorate('container', container);

  // ── Routes ───────────────────────────────────────────────────────────────
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(alertRoutes, { prefix: '/api/v1/alerts' });
  await app.register(observationRoutes, { prefix: '/api/v1/observations' });
  await app.register(regionRoutes, { prefix: '/api/v1/regions' });
  await app.register(websocketRoutes, { prefix: '/ws' });

  return app;
}
