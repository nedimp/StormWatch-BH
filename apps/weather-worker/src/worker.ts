import 'dotenv/config';
import cron from 'node-cron';
import { OpenMeteoAdapter, WMO_CODES } from './adapters/OpenMeteoAdapter.js';
import { ApiObservationSubmitter } from './adapters/ApiObservationSubmitter.js';
import { BIH_STATIONS } from './config/stations.js';
import { logger } from './config/logger.js';

const adapter = new OpenMeteoAdapter();
const submitter = new ApiObservationSubmitter(
  process.env['API_BASE_URL'] ?? 'http://localhost:3001',
);

async function pollAllStations(): Promise<void> {
  logger.info(`Polling ${BIH_STATIONS.length} BiH stations via Open-Meteo (batch)...`);

  let results: Map<string, Awaited<ReturnType<OpenMeteoAdapter['fetchCurrentConditions']>>>;

  try {
    results = await adapter.fetchBatch(BIH_STATIONS);
  } catch (err) {
    logger.error(err, 'Batch fetch failed, aborting poll cycle');
    return;
  }

  const submissions = await Promise.allSettled(
    BIH_STATIONS.map(async (station) => {
      const data = results.get(station.id);
      if (!data) {
        logger.warn({ stationId: station.id }, 'No data returned for station');
        return;
      }

      const wmoLabel = WMO_CODES[data.weatherCode] ?? `WMO ${data.weatherCode}`;
      logger.info(
        {
          station: station.name,
          temp: `${data.temperatureCelsius.toFixed(1)}°C`,
          wind: `${data.windSpeedKmh.toFixed(0)} km/h`,
          gusts: `${data.windGustKmh.toFixed(0)} km/h`,
          precip: `${data.precipitationMmPerHour.toFixed(1)} mm/h`,
          condition: wmoLabel,
        },
        `Fetched`,
      );

      await submitter.submitObservation({
        stationId: station.id,
        regionId: station.regionId,
        latitude: station.lat,
        longitude: station.lng,
        temperatureCelsius: data.temperatureCelsius,
        windSpeedKmh: data.windSpeedKmh,
        windGustKmh: data.windGustKmh,
        precipitationMmPerHour: data.precipitationMmPerHour,
        humidityPercent: data.humidityPercent,
        visibilityKm: data.visibilityKm,
        pressureHpa: data.pressureHpa,
        source: 'API_PROVIDER',
        observedAt: data.fetchedAt,
      });
    }),
  );

  const ok = submissions.filter((r) => r.status === 'fulfilled').length;
  const failed = submissions.filter((r) => r.status === 'rejected').length;
  logger.info(`Poll complete — ${ok} submitted, ${failed} failed`);
}

// Poll every 15 minutes (Open-Meteo updates current data every ~15 min)
cron.schedule('*/15 * * * *', () => {
  void pollAllStations();
});

// Initial poll on startup
void pollAllStations();

logger.info(
  {
    stations: BIH_STATIONS.length,
    provider: 'Open-Meteo (free, no API key)',
    interval: '15 min',
  },
  'StormWatch BH weather-worker started',
);
