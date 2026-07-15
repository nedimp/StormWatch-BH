import type { FastifyInstance } from 'fastify';
import { BIH_REGIONS } from '../../infrastructure/data/bihRegions.js';

export function regionRoutes(app: FastifyInstance): void {
  app.get(
    '/',
    {
      schema: {
        tags: ['regions'],
        summary: 'List all BiH regions',
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              count: { type: 'integer' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      return reply.code(200).send({ data: BIH_REGIONS, count: BIH_REGIONS.length });
    },
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['regions'],
        summary: 'Get region by ID',
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const region = BIH_REGIONS.find((r) => r.id === id);
      if (!region) return reply.code(404).send({ error: 'Region not found' });
      return reply.code(200).send({ data: region });
    },
  );
}
