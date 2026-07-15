import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { STATION_NAMES } from '../../infrastructure/data/stationNames.js';
import type { RecordObservationCommand } from '@stormwatch/application';

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
  /** Optional: when set, this is a forecast observation for a future time. */
  forecastFor: z.coerce.date().optional(),
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
  // Protected by X-Worker-Token — only the weather-worker should call this.
  app.post(
    '/',
    {
      schema: {
        tags: ['observations'],
        summary: 'Record a weather observation',
        security: [{ workerToken: [] }],
      },
    },
    async (request, reply) => {
      // Verify shared secret between API and weather-worker
      const token = request.headers['x-worker-token'];
      const expected = process.env['WORKER_SECRET'];
      if (!expected || token !== expected) {
        return reply.code(401).send({ error: 'Unauthorized — missing or invalid X-Worker-Token' });
      }
      const parsed = observationBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: 'Validation failed', details: parsed.error.flatten() });
      }
      const useCase = app.container.recordObservationUseCase;
      const { forecastFor, ...rest } = parsed.data;
      const command: RecordObservationCommand = {
        ...rest,
        ...(forecastFor !== undefined ? { forecastFor } : {}),
      };
      const result = await useCase.execute(command);
      return reply.code(201).send({
        data: result,
        message: result.alertCreated
          ? `Observation recorded — alert issued: ${result.alertCreated.title}`
          : 'Observation recorded — no alert triggered',
      });
    },
  );
}
