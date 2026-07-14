import { fetch } from 'undici';
import type { RawWeatherData } from '@stormwatch/application';

interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    rain: number;
    snowfall: number;
    weather_code: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    visibility: number;
  };
}

/**
 * WMO weather interpretation codes → human label
 * https://open-meteo.com/en/docs#weathervariables
 */
export const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  85: 'Slight snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

/**
 * OpenMeteoAdapter
 *
 * Adapts the Open-Meteo API (https://open-meteo.com) to the IWeatherDataProvider port.
 * ✅ Completely free — no API key required
 * ✅ High accuracy over BiH (ECMWF/DWD models)
 * ✅ Up to 10,000 requests/day
 *
 * Units returned are already in metric (km/h for wind, °C for temp, mm for precip).
 */
export class OpenMeteoAdapter {
  private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast';

  async fetchCurrentConditions(lat: number, lng: number): Promise<RawWeatherData & { weatherCode: number }> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('latitude', lat.toFixed(4));
    url.searchParams.set('longitude', lng.toFixed(4));
    url.searchParams.set('current', [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'rain',
      'snowfall',
      'weather_code',
      'surface_pressure',
      'wind_speed_10m',
      'wind_gusts_10m',
      'visibility',
    ].join(','));
    url.searchParams.set('wind_speed_unit', 'kmh');
    url.searchParams.set('timezone', 'Europe/Sarajevo');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as OpenMeteoResponse;
    const c = data.current;

    // Open-Meteo gives precipitation in mm for current period (~15 min).
    // Extrapolate to mm/hour for our domain model.
    const precipMmPerHour = c.precipitation * 4;

    return {
      temperatureCelsius: c.temperature_2m,
      windSpeedKmh: c.wind_speed_10m,
      windGustKmh: c.wind_gusts_10m,
      precipitationMmPerHour: precipMmPerHour,
      humidityPercent: c.relative_humidity_2m,
      visibilityKm: c.visibility / 1000,
      pressureHpa: c.surface_pressure,
      fetchedAt: new Date(c.time),
      weatherCode: c.weather_code,
    };
  }

  /**
   * Fetch current conditions for multiple stations in a single API call.
   * Open-Meteo supports batch requests via comma-separated lat/lon arrays.
   */
  async fetchBatch(
    stations: Array<{ id: string; lat: number; lng: number }>,
  ): Promise<Map<string, RawWeatherData & { weatherCode: number }>> {
    const lats = stations.map((s) => s.lat.toFixed(4)).join(',');
    const lngs = stations.map((s) => s.lng.toFixed(4)).join(',');

    const url = new URL(this.baseUrl);
    url.searchParams.set('latitude', lats);
    url.searchParams.set('longitude', lngs);
    url.searchParams.set('current', [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
      'surface_pressure',
      'wind_speed_10m',
      'wind_gusts_10m',
      'visibility',
    ].join(','));
    url.searchParams.set('wind_speed_unit', 'kmh');
    url.searchParams.set('timezone', 'Europe/Sarajevo');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Open-Meteo batch error: ${response.status}`);
    }

    // Batch response is an array when multiple locations are requested
    const raw = await response.json();
    const dataArray: OpenMeteoResponse[] = Array.isArray(raw) ? raw : [raw];

    const result = new Map<string, RawWeatherData & { weatherCode: number }>();
    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      const data = dataArray[i];
      if (!station || !data) continue;

      const c = data.current;
      result.set(station.id, {
        temperatureCelsius: c.temperature_2m,
        windSpeedKmh: c.wind_speed_10m,
        windGustKmh: c.wind_gusts_10m,
        precipitationMmPerHour: c.precipitation * 4,
        humidityPercent: c.relative_humidity_2m,
        visibilityKm: c.visibility / 1000,
        pressureHpa: c.surface_pressure,
        fetchedAt: new Date(c.time),
        weatherCode: c.weather_code,
      });
    }

    return result;
  }
}
