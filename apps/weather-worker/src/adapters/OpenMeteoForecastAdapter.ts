import { fetch } from 'undici';

/**
 * A single hour's worth of forecast data for one station.
 * All values are in metric units (km/h, °C, mm/h).
 */
export interface ForecastHour {
  /** UTC timestamp of this forecast hour */
  time: Date;
  temperatureCelsius: number;
  precipitationMmPerHour: number;
  windSpeedKmh: number;
  windGustKmh: number;
  humidityPercent: number;
  visibilityKm: number;
  pressureHpa: number;
}

/**
 * Represents the worst conditions found in a 6-hour block for a single station.
 * Used to decide whether a forecast alert should be created.
 */
export interface ForecastBlock {
  /** When this 6-hour block starts (UTC) */
  blockStart: Date;
  /** The worst (most severe) metrics across all hours in the block */
  worstMetrics: {
    temperatureCelsius: number;
    windSpeedKmh: number;
    windGustKmh: number;
    precipitationMmPerHour: number;
    humidityPercent: number;
    visibilityKm: number;
    pressureHpa: number;
  };
}

interface OpenMeteoHourlyResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
    relative_humidity_2m: number[];
    visibility: number[];
    surface_pressure: number[];
  };
}

/**
 * OpenMeteoForecastAdapter
 *
 * Fetches 5-day hourly forecasts for multiple BiH stations in a single
 * batch API call (Open-Meteo supports comma-separated lat/lon).
 *
 * Hourly forecast precision is ±20% for wind, ±15% for temperature.
 * This uncertainty is why forecast alerts are discounted by one severity level
 * in the domain service (assessForecast).
 */
export class OpenMeteoForecastAdapter {
  private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast';

  /**
   * Fetch 5-day hourly forecasts for all stations and return them grouped
   * into 6-hour blocks per station. Each block holds the worst (maximum)
   * value for each metric within that 6-hour window — because we want to
   * alert on the peak danger, not the average.
   *
   * @param stations  Array of station metadata with lat/lng
   * @returns Map of stationId → array of ForecastBlock (one per 6h period)
   */
  async fetchForecastBlocks(
    stations: Array<{ id: string; lat: number; lng: number }>,
  ): Promise<Map<string, ForecastBlock[]>> {
    const lats = stations.map((s) => s.lat.toFixed(4)).join(',');
    const lngs = stations.map((s) => s.lng.toFixed(4)).join(',');

    const url = new URL(this.baseUrl);
    url.searchParams.set('latitude', lats);
    url.searchParams.set('longitude', lngs);
    url.searchParams.set(
      'hourly',
      [
        'temperature_2m',
        'precipitation',
        'wind_speed_10m',
        'wind_gusts_10m',
        'relative_humidity_2m',
        'visibility',
        'surface_pressure',
      ].join(','),
    );
    url.searchParams.set('wind_speed_unit', 'kmh');
    url.searchParams.set('forecast_days', '5');
    url.searchParams.set('timezone', 'UTC');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo forecast error: ${response.status}`);
    }

    const raw = await response.json();
    const dataArray: OpenMeteoHourlyResponse[] = Array.isArray(raw) ? raw : [raw];

    const result = new Map<string, ForecastBlock[]>();

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      const data = dataArray[i];
      if (!station || !data?.hourly) continue;

      const hours = this.parseHourlyData(data);
      const blocks = this.groupInto6HourBlocks(hours);
      result.set(station.id, blocks);
    }

    return result;
  }

  /**
   * Parse the flat hourly arrays from Open-Meteo into structured ForecastHour objects.
   * Precipitation is given in mm per hour already in the hourly endpoint.
   */
  private parseHourlyData(data: OpenMeteoHourlyResponse): ForecastHour[] {
    const h = data.hourly;
    return h.time.map((timeStr, idx) => ({
      time: new Date(timeStr + 'Z'), // append Z to treat as UTC
      temperatureCelsius:   h.temperature_2m[idx]!,
      precipitationMmPerHour: h.precipitation[idx]!,
      windSpeedKmh:         h.wind_speed_10m[idx]!,
      windGustKmh:          h.wind_gusts_10m[idx]!,
      humidityPercent:      h.relative_humidity_2m[idx]!,
      visibilityKm:         (h.visibility[idx]! / 1000),
      pressureHpa:          h.surface_pressure[idx]!,
    }));
  }

  /**
   * Group hourly data into 6-hour blocks starting at 00:00, 06:00, 12:00, 18:00 UTC.
   * Within each block, keep the worst (most dangerous) value for each metric:
   * - Maximum for wind, precipitation, temperature
   * - Minimum for visibility and pressure (lower = worse)
   *
   * We skip the current hour and the next 6 hours since those are already
   * covered by the real-time polling (current conditions).
   */
  private groupInto6HourBlocks(hours: ForecastHour[]): ForecastBlock[] {
    const now = Date.now();
    // Skip anything in the past or within the next 6 hours (covered by current observations)
    const future = hours.filter((h) => h.time.getTime() > now + 6 * 3_600_000);

    const blockMap = new Map<string, ForecastHour[]>();
    for (const hour of future) {
      // Round down to the nearest 6h boundary (0, 6, 12, 18)
      const d = new Date(hour.time);
      d.setUTCHours(Math.floor(d.getUTCHours() / 6) * 6, 0, 0, 0);
      const key = d.toISOString();
      if (!blockMap.has(key)) blockMap.set(key, []);
      blockMap.get(key)!.push(hour);
    }

    const blocks: ForecastBlock[] = [];
    for (const [blockStartStr, blockHours] of blockMap) {
      if (blockHours.length === 0) continue;
      blocks.push({
        blockStart: new Date(blockStartStr),
        worstMetrics: {
          temperatureCelsius:      Math.max(...blockHours.map((h) => h.temperatureCelsius)),
          windSpeedKmh:            Math.max(...blockHours.map((h) => h.windSpeedKmh)),
          windGustKmh:             Math.max(...blockHours.map((h) => h.windGustKmh)),
          precipitationMmPerHour:  Math.max(...blockHours.map((h) => h.precipitationMmPerHour)),
          humidityPercent:         Math.max(...blockHours.map((h) => h.humidityPercent)),
          visibilityKm:            Math.min(...blockHours.map((h) => h.visibilityKm)),
          pressureHpa:             Math.min(...blockHours.map((h) => h.pressureHpa)),
        },
      });
    }

    // Sort blocks chronologically
    return blocks.sort((a, b) => a.blockStart.getTime() - b.blockStart.getTime());
  }
}
