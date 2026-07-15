import { useEffect, useState } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import { SEVERITY_ORDER } from '../../constants/severity';
import { ALERTS_REFETCH_MS } from '../../constants/api';
import { useAlertStore } from '../../store/alertStore';
import { AlertCard } from './AlertCard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../../services/api';
import type { AlertSeverity } from '../../types';

const SEVERITY_ORDER: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function AlertList() {
  const { alerts, setAlerts } = useAlertStore();
  const [query, setQuery] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.getActive(),
    refetchInterval: ALERTS_REFETCH_MS,
  });

  useEffect(() => {
    if (data?.data) setAlerts(data.data);
  }, [data, setAlerts]);

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id, 'Manual resolve from dashboard'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-slate-100 border border-slate-200"
          />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
          <CheckCircle2 size={26} className="text-emerald-500" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-slate-700">Nema aktivnih upozorenja</p>
        <p className="mt-1 text-xs text-slate-400">Trenutno nema nevremena u BiH</p>
      </div>
    );
  }

  // Sort: observed alerts first (by severity), then forecast alerts (by forecastFor date)
  const sorted = [...alerts].sort((a, b) => {
    // Observed always before forecast
    if (a.isForecasted !== b.isForecasted) return a.isForecasted ? 1 : -1;
    // Within observed: by severity
    if (!a.isForecasted) {
      const ai = SEVERITY_ORDER.indexOf(a.severity);
      const bi = SEVERITY_ORDER.indexOf(b.severity);
      if (ai !== bi) return ai - bi;
    }
    // Within forecast: by forecastFor date (soonest first)
    if (a.isForecasted && a.forecastFor && b.forecastFor) {
      return new Date(a.forecastFor).getTime() - new Date(b.forecastFor).getTime();
    }
    return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
  });

  const filtered = query.trim()
    ? sorted.filter(
        (a) =>
          a.regionName.toLowerCase().includes(query.toLowerCase()) ||
          a.title.toLowerCase().includes(query.toLowerCase()),
      )
    : sorted;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pretraži upozorenja..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
        />
      </div>
      {filtered.length === 0 && query ? (
        <p className="text-center text-xs text-slate-400 py-8">
          Nema rezultata za &ldquo;{query}&rdquo;
        </p>
      ) : (
        <>
          {/* Current (observed) alerts */}
          {filtered.filter((a) => !a.isForecasted).map((alert) => (
            <AlertCard key={alert.id} alert={alert} onResolve={(id) => resolveMutation.mutate(id)} />
          ))}

          {/* Divider between observed and forecast sections */}
          {filtered.some((a) => !a.isForecasted) && filtered.some((a) => a.isForecasted) && (
            <div className="flex items-center gap-2 pt-1">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Prognoza</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
          )}

          {/* Forecast alerts */}
          {filtered.filter((a) => a.isForecasted).map((alert) => (
            <AlertCard key={alert.id} alert={alert} onResolve={(id) => resolveMutation.mutate(id)} />
          ))}
        </>
      )}
    </div>
  );
}
