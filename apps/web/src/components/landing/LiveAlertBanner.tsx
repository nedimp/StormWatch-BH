import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLiveAlerts } from '../../hooks/useLiveAlerts';

/**
 * Landing page alert banner.
 *
 * No alerts → subtle green "all clear" strip.
 * Active alerts → shows each alert as a coloured card with title + region,
 *   plus a "Pogledaj sve" link to the dashboard.
 */
export function LiveAlertBanner() {
  const navigate = useNavigate();
  const liveAlerts = useLiveAlerts();

  if (liveAlerts === null) return null;

  // All clear
  if (liveAlerts.count === 0) {
    return (
      <section className="border-b border-slate-100 bg-white px-6 py-3">
        <div className="mx-auto max-w-4xl flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-slate-500">Nema aktivnih upozorenja u BiH</span>
        </div>
      </section>
    );
  }

  const remaining = liveAlerts.count - liveAlerts.topAlerts.length;

  return (
    <section className="border-b border-slate-100 bg-slate-50 px-6 py-5">
      <div className="mx-auto max-w-4xl">

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-800">
              {liveAlerts.count === 1
                ? '1 aktivno upozorenje'
                : `${liveAlerts.count} aktivnih upozorenja`}
            </span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Pogledaj sve <ArrowRight size={12} />
          </button>
        </div>

        {/* Alert cards */}
        <div className="flex flex-col gap-2">
          {liveAlerts.topAlerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => navigate('/dashboard')}
              className="w-full text-left rounded-xl border bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3"
              style={{ borderColor: alert.severityColor + '40' }}
            >
              {/* Severity stripe */}
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: alert.severityColor }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800 truncate">{alert.title}</p>
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black text-white"
                    style={{ backgroundColor: alert.severityColor }}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{alert.regionName}</p>
              </div>
            </button>
          ))}
        </div>

        {/* "And N more" footer */}
        {remaining > 0 && (
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-2 w-full rounded-xl border border-dashed border-slate-200 py-2 text-xs text-slate-400 hover:text-slate-600 hover:border-slate-300 transition"
          >
            + još {remaining} upozorenje{remaining > 1 ? 'a' : ''} — otvori dashboard
          </button>
        )}
      </div>
    </section>
  );
}


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
