import 'dotenv/config';
import cron from 'node-cron';
import { OpenMeteoAdapter, WMO_CODES } from './adapters/OpenMeteoAdapter.js';
import { OpenMeteoForecastAdapter } from './adapters/OpenMeteoForecastAdapter.js';
import { ApiObservationSubmitter } from './adapters/ApiObservationSubmitter.js';
import { BIH_STATIONS } from './config/stations.js';
import { logger } from './config/logger.js';

const adapter = new OpenMeteoAdapter();
const forecastAdapter = new OpenMeteoForecastAdapter();
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

/**
 * ForecastPoller
 *
 * Fetches a 5-day hourly forecast for all 14 stations and submits
 * "forecast observations" for any 6-hour block that exceeds alert thresholds.
 *
 * Strategy:
 * 1. Fetch hourly forecast, grouped into 6-hour blocks per station
 * 2. For each block, submit the worst metrics as a forecastFor observation
 * 3. The API's RecordObservationUseCase calls assessForecast() which applies
 *    a severity discount (CRITICAL→HIGH etc.) and a Bosnian lead-time title
 * 4. Only the worst block per calendar day per station is submitted to avoid
 *    spamming the dashboard with dozens of forecast alerts
 *
 * Runs every 6 hours (at 00:00, 06:00, 12:00, 18:00 UTC) to stay aligned
 * with Open-Meteo's forecast update cycle.
 */
async function pollForecast(): Promise<void> {
  logger.info('Polling 5-day forecast for all BiH stations...');

  let forecastBlocks: Map<string, Awaited<ReturnType<OpenMeteoForecastAdapter['fetchForecastBlocks']> extends Map<string, infer V> ? Map<string, V> : never>>;

  let allBlocks: Awaited<ReturnType<typeof forecastAdapter.fetchForecastBlocks>>;
  try {
    allBlocks = await forecastAdapter.fetchForecastBlocks(BIH_STATIONS);
  } catch (err) {
    logger.error(err, 'Forecast fetch failed, aborting forecast poll');
    return;
  }

  let totalSubmitted = 0;
  let totalSkipped = 0;

  // Process each station
  for (const station of BIH_STATIONS) {
    const blocks = allBlocks.get(station.id) ?? [];
    if (blocks.length === 0) continue;

    // Only submit the worst block per calendar day to avoid dashboard spam.
    // "Worst" = highest wind gust, as wind tends to be the most dangerous metric.
    const bestPerDay = new Map<string, typeof blocks[0]>();
    for (const block of blocks) {
      const dayKey = block.blockStart.toISOString().slice(0, 10); // YYYY-MM-DD
      const existing = bestPerDay.get(dayKey);
      if (!existing || block.worstMetrics.windGustKmh > existing.worstMetrics.windGustKmh) {
        bestPerDay.set(dayKey, block);
      }
    }

    // Submit the worst block for each future day
    const submissions = await Promise.allSettled(
      [...bestPerDay.values()].map(async (block) => {
        const leadHours = Math.round((block.blockStart.getTime() - Date.now()) / 3_600_000);

        await submitter.submitObservation({
          stationId: station.id,
          regionId: station.regionId,
          latitude: station.lat,
          longitude: station.lng,
          ...block.worstMetrics,
          source: 'API_PROVIDER',
          observedAt: new Date(),   // when the forecast was made (now)
          forecastFor: block.blockStart, // when the conditions are predicted
        });

        logger.debug({
          station: station.name,
          forecastFor: block.blockStart.toISOString(),
          leadHours,
          wind: `${block.worstMetrics.windGustKmh.toFixed(0)} km/h gusts`,
        }, 'Forecast block submitted');
      }),
    );

    const ok = submissions.filter((r) => r.status === 'fulfilled').length;
    const failed = submissions.filter((r) => r.status === 'rejected').length;
    totalSubmitted += ok;
    totalSkipped += failed;
  }

  logger.info(
    { submitted: totalSubmitted, failed: totalSkipped },
    'Forecast poll complete',
  );
}

// ── Cron schedules ────────────────────────────────────────────────────────────

// Current conditions: every 15 minutes (Open-Meteo updates every ~15 min)
cron.schedule('*/15 * * * *', () => {
  void pollAllStations();
});

// Forecast: every 6 hours aligned to 00:00, 06:00, 12:00, 18:00 UTC
// This matches Open-Meteo's forecast model run schedule.
cron.schedule('0 */6 * * *', () => {
  void pollForecast();
});

// ── Initial polls on startup ──────────────────────────────────────────────────
void pollAllStations();
void pollForecast(); // Run immediately so forecast alerts are visible on first launch

logger.info(
  {
    stations: BIH_STATIONS.length,
    provider: 'Open-Meteo (free, no API key)',
    interval: '15 min',
  },
  'StormWatch BH weather-worker started',
);
