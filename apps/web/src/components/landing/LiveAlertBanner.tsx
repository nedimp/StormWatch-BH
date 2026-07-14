import { useNavigate } from 'react-router-dom';
import { useLiveAlerts } from '../../hooks/useLiveAlerts';
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_ORDER } from '../../constants/severity';
import type { AlertSeverity } from '../../types';

/**
 * Thin status bar shown between the hero and temperature strip.
 * Shows either "no active alerts" or a breakdown of active alerts by severity.
 */
export function LiveAlertBanner() {
  const navigate = useNavigate();
  const liveAlerts = useLiveAlerts();

  if (liveAlerts === null) return null;

  return (
    <section className="border-b border-slate-100 bg-white px-6 py-4">
      <div className="mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={
            'h-2 w-2 rounded-full ' +
            (liveAlerts.count > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500')
          } />
          <span className="text-sm font-semibold text-slate-700">
            {liveAlerts.count > 0
              ? `${liveAlerts.count} aktivno upozorenje${liveAlerts.count > 1 ? 'a' : ''}`
              : 'Nema aktivnih upozorenja'}
          </span>
        </div>

        {liveAlerts.count > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {SEVERITY_ORDER.map((sev) => {
              const n = liveAlerts.bySeverity[sev];
              if (!n) return null;
              return (
                <span
                  key={sev}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                  style={{ backgroundColor: SEVERITY_COLORS[sev as AlertSeverity] }}
                >
                  {n}× {SEVERITY_LABELS[sev as AlertSeverity]}
                </span>
              );
            })}
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800"
            >
              Pogledaj &rarr;
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
