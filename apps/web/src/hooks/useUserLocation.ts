import { useEffect, useState } from 'react';
import type { CurrentConditionDto } from '../types';
import { GEOLOCATION_TIMEOUT_MS } from '../constants/api';

/** Reverse-geocode lat/lng → city name using the free Nominatim API. */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=bs`,
      { headers: { 'User-Agent': 'StormWatch-BH/1.0' } },
    );
    const data = await res.json() as { address?: { city?: string; town?: string; village?: string; municipality?: string } };
    const addr = data.address ?? {};
    return addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? null;
  } catch {
    return null;
  }
}

/** Return the station ID closest to the given coordinates. */
function nearestStation(stations: CurrentConditionDto[], lat: number, lng: number): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const s of stations) {
    const d = Math.hypot(s.latitude - lat, s.longitude - lng);
    if (d < bestDist) { bestDist = d; best = s.stationId; }
  }
  return best;
}

export interface UserLocationResult {
  cityName: string | null;
  nearestId: string | null;
}

/**
 * Requests browser geolocation, reverse-geocodes to a city name,
 * and finds the nearest weather station.
 */
export function useUserLocation(stations: CurrentConditionDto[]): UserLocationResult {
  const [cityName, setCityName] = useState<string | null>(null);
  const [nearestId, setNearestId] = useState<string | null>(null);

  useEffect(() => {
    if (stations.length === 0) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        setNearestId(nearestStation(stations, latitude, longitude));
        const city = await reverseGeocode(latitude, longitude);
        setCityName(city);
      },
      () => { /* permission denied — silent */ },
      { timeout: GEOLOCATION_TIMEOUT_MS },
    );
  }, [stations.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return { cityName, nearestId };
}
