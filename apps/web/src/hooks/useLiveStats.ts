import { useEffect, useState } from 'react';
import { observationsApi } from '../services/api';

export interface LiveStat {
  stationId: string;
  city: string;
  temp: number;
}

/** Fetch the latest temperature per city, deduped, capped at 6 entries. */
export function useLiveStats(): LiveStat[] {
  const [stats, setStats] = useState<LiveStat[]>([]);

  useEffect(() => {
    observationsApi
      .getCurrent()
      .then((res) => {
        const byCity = new Map<string, LiveStat>();
        for (const s of res.data) {
          const city = s.stationName.split(' (')[0] ?? s.stationName;
          const temp = Math.round(s.temperatureCelsius);
          const existing = byCity.get(city);
          if (!existing || temp > existing.temp) {
            byCity.set(city, { stationId: s.stationId, city, temp });
          }
        }
        setStats([...byCity.values()].slice(0, 6));
      })
      .catch(() => {});
  }, []);

  return stats;
}
