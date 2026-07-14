import { fetch } from 'undici';
import type { RawWeatherData } from '@stormwatch/application';

interface OWMCurrentResponse {
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
    gust?: number;
  };
  rain?: { '1h'?: number };
  visibility?: number;
}

/**
 * OpenWeatherMapAdapter
 *
 * Adapts the OpenWeatherMap API to the IWeatherDataProvider port.
 * Converts OWM units (m/s, meters) to domain units (km/h, km).
 */
export class OpenWeatherMapAdapter {
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private readonly apiKey: string) {}

  async fetchCurrentConditions(lat: number, lng: number): Promise<RawWeatherData> {
    const url = new URL(`${this.baseUrl}/weather`);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lng.toString());
    url.searchParams.set('appid', this.apiKey);
    url.searchParams.set('units', 'metric');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`OWM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as OWMCurrentResponse;

    return {
      temperatureCelsius: data.main.temp,
      windSpeedKmh: data.wind.speed * 3.6,
      windGustKmh: (data.wind.gust ?? data.wind.speed) * 3.6,
      precipitationMmPerHour: data.rain?.['1h'] ?? 0,
      humidityPercent: data.main.humidity,
      visibilityKm: (data.visibility ?? 10000) / 1000,
      pressureHpa: data.main.pressure,
      fetchedAt: new Date(),
    };
  }
}
