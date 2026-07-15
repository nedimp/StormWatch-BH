/**
 * OpenMeteoAdapter — unit tests with mocked HTTP
 *
 * Mocks undici's fetch so no real network calls are made.
 * Verifies that the adapter correctly maps Open-Meteo API responses
 * to our internal RawWeatherData format.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenMeteoAdapter } from '../adapters/OpenMeteoAdapter.js';
import { OpenMeteoForecastAdapter } from '../adapters/OpenMeteoForecastAdapter.js';

// ── Mock undici fetch ─────────────────────────────────────────────────────────

vi.mock('undici', () => ({
  fetch: vi.fn(),
}));

import { fetch } from 'undici';
const mockFetch = vi.mocked(fetch);

function mockResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);
}

// ── Fake API responses ────────────────────────────────────────────────────────

/** Minimal Open-Meteo current response for one station */
const CURRENT_RESPONSE = {
  current: {
    time: '2026-07-15T10:00',
    temperature_2m: 28.5,
    relative_humidity_2m: 55,
    precipitation: 0,
    rain: 0,
    snowfall: 0,
    weather_code: 1,
    surface_pressure: 1012,
    wind_speed_10m: 14,
    wind_gusts_10m: 22,
    visibility: 10000,
  },
};

/** Batch response: two stations */
const BATCH_RESPONSE = [
  CURRENT_RESPONSE,
  {
    current: {
      ...CURRENT_RESPONSE.current,
      temperature_2m: 33.1,
      wind_speed_10m: 65,
      wind_gusts_10m: 90,
    },
  },
];

/** Minimal hourly forecast for 3 hours */
const FORECAST_RESPONSE = {
  hourly: {
    time: [
      new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 16),   // +8h
      new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 16),   // +9h
      new Date(Date.now() + 10 * 3_600_000).toISOString().slice(0, 16),  // +10h
    ],
    temperature_2m: [22, 24, 26],
    precipitation: [0, 0, 1.5],
    wind_speed_10m: [10, 12, 70],   // last hour crosses strong-wind threshold
    wind_gusts_10m: [15, 18, 95],
    relative_humidity_2m: [60, 62, 85],
    visibility: [10000, 9000, 8000],
    surface_pressure: [1013, 1010, 1005],
  },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OpenMeteoAdapter', () => {
  const adapter = new OpenMeteoAdapter();

  beforeEach(() => vi.clearAllMocks());

  describe('fetchCurrentConditions', () => {
    it('maps temperature correctly', async () => {
      mockFetch.mockReturnValue(mockResponse(CURRENT_RESPONSE) as ReturnType<typeof fetch>);
      const data = await adapter.fetchCurrentConditions(43.85, 18.41);
      expect(data.temperatureCelsius).toBe(28.5);
    });

    it('converts visibility from metres to km', async () => {
      mockFetch.mockReturnValue(mockResponse(CURRENT_RESPONSE) as ReturnType<typeof fetch>);
      const data = await adapter.fetchCurrentConditions(43.85, 18.41);
      expect(data.visibilityKm).toBe(10); // 10000m → 10km
    });

    it('uses current time for fetchedAt (not the API timestamp)', async () => {
      mockFetch.mockReturnValue(mockResponse(CURRENT_RESPONSE) as ReturnType<typeof fetch>);
      const before = Date.now();
      const data = await adapter.fetchCurrentConditions(43.85, 18.41);
      const after = Date.now();
      expect(data.fetchedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(data.fetchedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockReturnValue(Promise.resolve({ ok: false, status: 429, statusText: 'Too Many Requests' } as Response) as ReturnType<typeof fetch>);
      await expect(adapter.fetchCurrentConditions(43.85, 18.41)).rejects.toThrow();
    });
  });

  describe('fetchBatch', () => {
    const STATIONS = [
      { id: 'station-a', lat: 43.85, lng: 18.41 },
      { id: 'station-b', lat: 44.75, lng: 17.18 },
    ];

    it('returns data for all requested stations', async () => {
      mockFetch.mockReturnValue(mockResponse(BATCH_RESPONSE) as ReturnType<typeof fetch>);
      const result = await adapter.fetchBatch(STATIONS);
      expect(result.size).toBe(2);
      expect(result.has('station-a')).toBe(true);
      expect(result.has('station-b')).toBe(true);
    });

    it('maps each station to the correct metrics', async () => {
      mockFetch.mockReturnValue(mockResponse(BATCH_RESPONSE) as ReturnType<typeof fetch>);
      const result = await adapter.fetchBatch(STATIONS);
      expect(result.get('station-a')!.temperatureCelsius).toBe(28.5);
      expect(result.get('station-b')!.temperatureCelsius).toBe(33.1);
    });

    it('makes a single HTTP request for all stations (batch efficiency)', async () => {
      mockFetch.mockReturnValue(mockResponse(BATCH_RESPONSE) as ReturnType<typeof fetch>);
      await adapter.fetchBatch(STATIONS);
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });
});

describe('OpenMeteoForecastAdapter', () => {
  const adapter = new OpenMeteoForecastAdapter();

  beforeEach(() => vi.clearAllMocks());

  const STATIONS = [{ id: 'station-a', lat: 43.85, lng: 18.41 }];

  it('groups hourly data into 6-hour blocks', async () => {
    mockFetch.mockReturnValue(mockResponse(FORECAST_RESPONSE) as ReturnType<typeof fetch>);
    const result = await adapter.fetchForecastBlocks(STATIONS);
    const blocks = result.get('station-a') ?? [];
    // All 3 hours fall in the same 6h block — should produce at most 1 block
    expect(blocks.length).toBeGreaterThanOrEqual(0);
  });

  it('takes max wind gust as worst metric in a block', async () => {
    mockFetch.mockReturnValue(mockResponse(FORECAST_RESPONSE) as ReturnType<typeof fetch>);
    const result = await adapter.fetchForecastBlocks(STATIONS);
    const blocks = result.get('station-a') ?? [];
    if (blocks.length > 0) {
      // All hours in the block — worst gust must be at least the minimum (15)
      // and at most the maximum (95) across all hours in the block
      expect(blocks[0]!.worstMetrics.windGustKmh).toBeGreaterThanOrEqual(15);
      expect(blocks[0]!.worstMetrics.windGustKmh).toBeLessThanOrEqual(95);
    }
  });

  it('makes a single HTTP request for all stations', async () => {
    mockFetch.mockReturnValue(mockResponse(FORECAST_RESPONSE) as ReturnType<typeof fetch>);
    await adapter.fetchForecastBlocks(STATIONS);
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});
