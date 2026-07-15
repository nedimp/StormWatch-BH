import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance): void {
  app.get('/', async (_req, reply) => {
    return reply.code(200).send({
      status: 'ok',
      service: 'stormwatch-bh-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', async (_req, reply) => {
    // In production: check DB connection, Redis, etc.
    return reply.code(200).send({ status: 'ready' });
  });
}
