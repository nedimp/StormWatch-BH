import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { STATION_NAMES } from '../../infrastructure/data/stationNames.js';

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
  // GET /api/v1/observations/current
  app.get(
    '/current',
    {
      schema: {
        tags: ['observations'],
        summary: 'Get latest weather conditions per station',
      },
    },
    async (_request, reply) => {
      const repo = app.container.observationRepository;
      const observations = await repo.findAllLatestPerStation();
      const data = observations.map((obs) => ({
        id: obs.id,
        stationId: obs.stationId,
        stationName: STATION_NAMES[obs.stationId] ?? obs.stationId,
        regionId: obs.regionId,
        latitude: obs.coordinates.latitude,
        longitude: obs.coordinates.longitude,
        temperatureCelsius: obs.metrics.temperature,
        windSpeedKmh: obs.metrics.windSpeed,
        windGustKmh: obs.metrics.windGust,
        precipitationMmPerHour: obs.metrics.precipitation,
        humidityPercent: obs.metrics.humidity,
        visibilityKm: obs.metrics.visibility,
        pressureHpa: obs.metrics.pressure,
        observedAt: obs.observedAt.toISOString(),
        source: obs.source,
      }));
      return reply
        .code(200)
        .send({ data, count: data.length, fetchedAt: new Date().toISOString() });
    },
  );

  // POST /api/v1/observations
  app.post(
    '/',
    {
      schema: {
        tags: ['observations'],
        summary: 'Record a weather observation',
      },
    },
    async (request, reply) => {
      const parsed = observationBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'Validation failed', details: parsed.error.flatten() });
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
