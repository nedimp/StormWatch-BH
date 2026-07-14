import 'dotenv/config';
import cron from 'node-cron';
import { OpenWeatherMapAdapter } from './adapters/OpenWeatherMapAdapter.js';
import { ApiObservationSubmitter } from './adapters/ApiObservationSubmitter.js';
import { BIH_STATIONS } from './config/stations.js';
import { logger } from './config/logger.js';

const owmAdapter = new OpenWeatherMapAdapter(
  process.env['OPENWEATHERMAP_API_KEY'] ?? '',
);
const submitter = new ApiObservationSubmitter(
  process.env['API_BASE_URL'] ?? 'http://localhost:3001',
);

async function pollAllStations(): Promise<void> {
  logger.info(`Polling ${BIH_STATIONS.length} stations...`);

  const results = await Promise.allSettled(
    BIH_STATIONS.map(async (station) => {
      const data = await owmAdapter.fetchCurrentConditions(
        station.lat,
        station.lng,
      );
      await submitter.submitObservation({
        stationId: station.id,
        regionId: station.regionId,
        latitude: station.lat,
        longitude: station.lng,
        ...data,
        source: 'API_PROVIDER',
        observedAt: data.fetchedAt,
      });
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  logger.info(`Poll complete — ${results.length - failed} ok, ${failed} failed`);
}

// Poll every 10 minutes
cron.schedule('*/10 * * * *', () => {
  void pollAllStations();
});

// Initial poll on startup
void pollAllStations();

logger.info('StormWatch BH weather-worker started');
