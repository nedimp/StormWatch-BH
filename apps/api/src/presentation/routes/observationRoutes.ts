import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const observationBodySchema = z.object({
  stationId: z.string().min(1),
  regionId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  temperatureCelsius: z.number().min(-60).max(60),
  windSpeedKmh: z.number().min(0).max(400),
  windGustKmh: z.number().min(0).max(500),
  precipitationMmPerHour: z.number().min(0).max(500),
  humidityPercent: z.number().min(0).max(100),
  visibilityKm: z.number().min(0).max(100),
  pressureHpa: z.number().min(800).max(1100),
  source: z.enum(['AUTOMATIC_STATION', 'MANUAL', 'API_PROVIDER', 'RADAR']),
  observedAt: z.coerce.date(),
});

export async function observationRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/observations
   * Ingest a weather observation from a station or external provider.
   */
  app.post(
    '/',
    {
      schema: {
        tags: ['observations'],
        summary: 'Record a weather observation',
        body: {
          type: 'object',
          required: [
            'stationId', 'regionId', 'latitude', 'longitude',
            'temperatureCelsius', 'windSpeedKmh', 'windGustKmh',
            'precipitationMmPerHour', 'humidityPercent', 'visibilityKm',
            'pressureHpa', 'source', 'observedAt',
          ],
        },
      },
    },
    async (request, reply) => {
      const parsed = observationBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
      }

      const useCase = app.container.recordObservationUseCase;
      const result = await useCase.execute(parsed.data);

      return reply.code(201).send({
        data: result,
        message: result.alertCreated
          ? `Observation recorded — alert issued: ${result.alertCreated.title}`
          : 'Observation recorded — no alert triggered',
      });
    },
  );
}
