import { useAlertStore } from '../../store/alertStore';
import type { AlertSeverity } from '../../types';

const SEV_CONFIG: Record<AlertSeverity, { color: string; label: string; bg: string }> = {
  CRITICAL: { color: '#9C27B0', label: 'Kritično', bg: 'rgba(156,39,176,0.15)' },
  HIGH:     { color: '#F44336', label: 'Visoko',   bg: 'rgba(244,67,54,0.15)'  },
  MEDIUM:   { color: '#FF9800', label: 'Srednje',  bg: 'rgba(255,152,0,0.15)'  },
  LOW:      { color: '#4CAF50', label: 'Nisko',    bg: 'rgba(76,175,80,0.15)'  },
};

export function StatsBar() {
  const alerts = useAlertStore((s) => s.alerts);
  const connected = useAlertStore((s) => s.connected);

  const counts = alerts.reduce(
    (acc, a) => { acc[a.severity] = (acc[a.severity] ?? 0) + 1; return acc; },
    {} as Partial<Record<AlertSeverity, number>>,
  );

  const total = alerts.length;
  const hasCritical = (counts.CRITICAL ?? 0) > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5">
      <div className="flex items-center gap-2 pr-3 border-r border-surface-border">
        <span className="text-xl font-bold text-text-primary">{total}</span>
        <span className="text-xs text-text-muted leading-tight">aktivna<br/>upozorenja</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as AlertSeverity[]).map((sev) => {
          const cfg = SEV_CONFIG[sev];
          const count = counts[sev] ?? 0;
          return (
            <div
              key={sev}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: cfg.bg,
                color: cfg.color,
                border: "1px solid " + cfg.color + "30",
                opacity: count > 0 ? 1 : 0.35,
              }}
            >
              <span className="font-bold">{count}</span>
              <span>{cfg.label}</span>
            </div>
          );
        })}
      </div>
      {hasCritical && (
        <div className="ml-auto flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1 animate-pulse">
          <span className="text-xs">🚨</span>
          <span className="text-xs font-bold text-purple-400">KRITIČNA UZBUNA AKTIVA</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 ml-2">
        <span className={"h-2 w-2 rounded-full " + (connected ? "bg-emerald-400 animate-pulse" : "bg-red-500")} />
        <span className="text-xs text-text-muted">{connected ? "Live" : "Offline"}</span>
      </div>
    </div>
  );
}
