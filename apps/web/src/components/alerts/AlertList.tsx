import { useEffect, useState } from 'react';
import { CheckCircle2, Search, X } from 'lucide-react';
import { SEVERITY_ORDER, SEVERITY_COLORS, SEVERITY_LABELS } from '../../constants/severity';
import { ALERTS_REFETCH_MS } from '../../constants/api';
import { useAlertStore } from '../../store/alertStore';
import { AlertCard } from './AlertCard';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../../services/api';
import type { AlertSeverity } from '../../types';

export function AlertList() {
  const { alerts, setAlerts } = useAlertStore();
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.getActive(),
    refetchInterval: ALERTS_REFETCH_MS,
  });

  useEffect(() => {
    if (data?.data) setAlerts(data.data);
  }, [data, setAlerts]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100 border border-slate-200" />
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

  // Sort: observed first (by severity), then forecast (soonest first)
  const sorted = [...alerts].sort((a, b) => {
    if (a.isForecasted !== b.isForecasted) return a.isForecasted ? 1 : -1;
    if (!a.isForecasted) {
      const ai = SEVERITY_ORDER.indexOf(a.severity);
      const bi = SEVERITY_ORDER.indexOf(b.severity);
      if (ai !== bi) return ai - bi;
    }
    if (a.isForecasted && a.forecastFor && b.forecastFor) {
      return new Date(a.forecastFor).getTime() - new Date(b.forecastFor).getTime();
    }
    return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
  });

  const filtered = sorted.filter((a) => {
    const matchesText = !query.trim() ||
      a.regionName.toLowerCase().includes(query.toLowerCase()) ||
      a.title.toLowerCase().includes(query.toLowerCase());
    const matchesSeverity = !severityFilter || a.severity === severityFilter;
    return matchesText && matchesSeverity;
  });

  // Which severities actually exist in the current list (to show only relevant pills)
  const presentSeverities = SEVERITY_ORDER.filter((s) => alerts.some((a) => a.severity === s));

  return (
    <div className="flex flex-col gap-2">
      {/* Text search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pretraži upozorenja..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
        />
      </div>

      {/* Severity filter pills — only shown when multiple severities present */}
      {presentSeverities.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {presentSeverities.map((sev) => {
            const active = severityFilter === sev;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(active ? null : sev)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition"
                style={{
                  backgroundColor: active ? SEVERITY_COLORS[sev] : SEVERITY_COLORS[sev] + '15',
                  color: active ? '#fff' : SEVERITY_COLORS[sev],
                  border: `1px solid ${SEVERITY_COLORS[sev]}40`,
                }}
              >
                {SEVERITY_LABELS[sev]}
                {active && <X size={9} />}
              </button>
            );
          })}
          {severityFilter && (
            <button
              onClick={() => setSeverityFilter(null)}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition"
            >
              Poništi filter
            </button>
          )}
        </div>
      )}

      {/* No results */}
      {filtered.length === 0 ? (
        <p className="text-center text-xs text-slate-400 py-8">
          Nema upozorenja za odabrane filtere
        </p>
      ) : (
        <>
          {/* Observed alerts */}
          {filtered.filter((a) => !a.isForecasted).map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}

          {/* Divider */}
          {filtered.some((a) => !a.isForecasted) && filtered.some((a) => a.isForecasted) && (
            <div className="flex items-center gap-2 pt-1">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Prognoza</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
          )}

          {/* Forecast alerts */}
          {filtered.filter((a) => a.isForecasted).map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </>
      )}
    </div>
  );
}
