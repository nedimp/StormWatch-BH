import { useState } from 'react';
import { Thermometer, Clock, MapPin, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { observationsApi } from '../../services/api';
import { useAlertStore } from '../../store/alertStore';
import { useUserLocation } from '../../hooks/useUserLocation';
import { StationRow } from './StationRow';
import { CONDITIONS_REFETCH_MS, CONDITIONS_STALE_MS } from '../../constants/api';

export function CurrentConditionsPanel() {
  const alerts = useAlertStore((s) => s.alerts);
  const alertsByRegion = new Map(alerts.map((a) => [a.regionId, a]));
  const [query, setQuery] = useState('');

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['conditions'],
    queryFn: () => observationsApi.getCurrent(),
    refetchInterval: CONDITIONS_REFETCH_MS,
    staleTime: CONDITIONS_STALE_MS,
  });

  const observations = data?.data ?? [];
  const { cityName, nearestId } = useUserLocation(observations);

  if (isLoading && observations.length === 0) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-slate-200 bg-slate-50"
          />
        ))}
      </div>
    );
  }

  if (observations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Thermometer size={28} className="text-slate-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-slate-500">Nema podataka</p>
        <p className="mt-1 text-xs text-slate-400">Pokrenite weather-worker</p>
      </div>
    );
  }

  const updatedLabel = dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm') : '';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock size={10} />
          <span className="text-[10px]">ažurirano u {updatedLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {cityName && (
            <span className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
              <MapPin size={9} />
              {cityName}
            </span>
          )}
          <span className="text-[10px] text-slate-400">{observations.length} stanica</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-slate-100 shrink-0">
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretraži grad..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Station rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-3 py-1 space-y-1.5">
        {observations
          .filter(
            (obs) => !query.trim() || obs.stationName.toLowerCase().includes(query.toLowerCase()),
          )
          .map((obs) => {
            const alert = alertsByRegion.get(obs.regionId);
            return (
              <StationRow
                key={obs.stationId}
                obs={obs}
                alert={alert}
                isNearest={obs.stationId === nearestId}
              />
            );
          })}
      </div>
    </div>
  );
}
