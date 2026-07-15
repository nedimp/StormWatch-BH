import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import staticFiles from '@fastify/static';
import { existsSync } from 'node:fs';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import rateLimit from '@fastify/rate-limit';
import { alertRoutes } from './presentation/routes/alertRoutes.js';
import { observationRoutes } from './presentation/routes/observationRoutes.js';
import { regionRoutes } from './presentation/routes/regionRoutes.js';
import { healthRoutes } from './presentation/routes/healthRoutes.js';
import { subscriptionRoutes } from './presentation/routes/subscriptionRoutes.js';
import { websocketRoutes } from './presentation/websocket/weatherSocket.js';
import { buildContainer } from './infrastructure/container.js';
import type { AppContainer } from './infrastructure/container.js';
import { migrate } from './infrastructure/database/migrate.js';
import { logger } from './infrastructure/logger.js';

/**
 * Build the Fastify application.
 *
 * @param testContainer  Optional DI container override for tests.
 *   When provided, DB migrations are skipped so tests run without a real DB.
 */
export async function buildApp(testContainer?: AppContainer): Promise<ReturnType<typeof Fastify>> {
  const app = Fastify({ logger: testContainer ? false : (logger as unknown as import('fastify').FastifyBaseLogger) });

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

  // ── DB migrations (skipped when a testContainer is injected) ────────────
  if (!testContainer) {
    try {
      await migrate();
    } catch (err) {
      logger.error(err, 'Database migration failed');
      throw err;
    }
  }

  // ── DI Container ─────────────────────────────────────────────────────────
  const container = testContainer ?? buildContainer();
  app.decorate('container', container);

  // ── Routes ───────────────────────────────────────────────────────────────
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(alertRoutes, { prefix: '/api/v1/alerts' });
  await app.register(observationRoutes, { prefix: '/api/v1/observations' });
  await app.register(regionRoutes, { prefix: '/api/v1/regions' });
  await app.register(subscriptionRoutes, { prefix: '/api/v1/subscriptions' });
  await app.register(websocketRoutes, { prefix: '/ws' });

  // ── Static frontend (production) ─────────────────────────────────────────
  // Registered AFTER API routes so @fastify/static wildcard cannot shadow them
  const staticPath = process.env['STATIC_PATH'];
  if (staticPath && existsSync(staticPath)) {
    await app.register(staticFiles, { root: staticPath, prefix: '/' });
    app.setNotFoundHandler((req, reply) => {
      const url = req.url.split('?')[0] ?? req.url;
      if (
        url.startsWith('/assets/') ||
        url.startsWith('/api/') ||
        url.startsWith('/ws') ||
        url.startsWith('/docs')
      ) {
        void reply.code(404).send({ error: 'Not found' });
      } else {
        void reply.sendFile('index.html');
      }
    });
  }

  return app;
}
