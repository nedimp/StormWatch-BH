import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { GetActiveAlertsQuery } from '@stormwatch/application';
import { AlertSeverityLevel } from '@stormwatch/domain';

const querySchema = z.object({
  regionId: z.string().optional(),
  severity: z.nativeEnum(AlertSeverityLevel).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export function alertRoutes(app: FastifyInstance): void {
  /**
   * GET /api/v1/alerts
   * Returns active alerts, optionally filtered.
   */
  app.get(
    '/',
    {
      schema: {
        tags: ['alerts'],
        summary: 'Get active weather alerts',
        querystring: {
          type: 'object',
          properties: {
            regionId: { type: 'string', description: 'Filter by BiH region ID' },
            severity: {
              type: 'string',
              enum: Object.values(AlertSeverityLevel),
              description: 'Minimum severity level',
            },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
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
    async (request, reply) => {
      const parsed = querySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'Invalid query parameters', details: parsed.error.flatten() });
      }

      const { regionId, severity, limit } = parsed.data;
      const query: GetActiveAlertsQuery = {
        ...(regionId !== undefined ? { regionId } : {}),
        ...(severity !== undefined ? { severity } : {}),
        ...(limit !== undefined ? { limit } : {}),
      };
      const useCase = app.container.getActiveAlertsUseCase;
      const alerts = await useCase.execute(query);

      return reply.code(200).send({ data: alerts, count: alerts.length });
    },
  );

  /**
   * GET /api/v1/alerts/:id
   */
  app.get(
    '/:id',
    {
      schema: {
        tags: ['alerts'],
        summary: 'Get alert by ID',
        params: { type: 'object', properties: { id: { type: 'string' } } },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const repo = app.container.alertRepository;
      const alert = await repo.findById(id);
      if (!alert) return reply.code(404).send({ error: 'Alert not found' });
      // Convert to DTO — never expose the domain entity directly
      const { toAlertDto } = await import('@stormwatch/application');
      return reply.code(200).send({ data: toAlertDto(alert) });
    },
  );

  /**
   * POST /api/v1/alerts/:id/resolve
   * Manually resolve an active alert.
   */
  app.post(
    '/:id/resolve',
    {
      schema: {
        tags: ['alerts'],
        summary: 'Manually resolve an active alert',
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: { type: 'string' },
            resolvedBy: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { reason: string; resolvedBy?: string };

      const useCase = app.container.resolveAlertUseCase;
      const resolved = await useCase.execute({
        alertId: id,
        resolvedBy: body.resolvedBy ?? 'manual',
        reason: body.reason,
      });
      return reply.code(200).send({ data: resolved });
    },
  );
}
