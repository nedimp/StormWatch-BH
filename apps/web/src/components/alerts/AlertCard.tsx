import type { AlertDto } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  alert: AlertDto;
  onResolve?: (id: string) => void;
}

const CONDITION_EMOJI: Record<string, string> = {
  THUNDERSTORM: '⛈️',
  HEAVY_RAIN: '🌧️',
  HAIL: '🌨️',
  STRONG_WIND: '💨',
  HEAVY_SNOW: '❄️',
  FOG: '🌫️',
  EXTREME_HEAT: '🌡️',
  FROST: '🧊',
  TORNADO_RISK: '🌪️',
};

const SEV_LABEL: Record<string, string> = {
  CRITICAL: 'KRITIČNO',
  HIGH: 'VISOKO',
  MEDIUM: 'SREDNJE',
  LOW: 'NISKO',
};

export function AlertCard({ alert, onResolve }: AlertCardProps) {
  const timeAgo = formatDistanceToNow(new Date(alert.issuedAt), { addSuffix: true });
  const isCritical = alert.severity === 'CRITICAL';
  const isEscalated = alert.status === 'ESCALATED';

  return (
    <div
      className={"relative overflow-hidden rounded-xl border p-4 transition-all " + (isCritical ? "alert-critical-pulse" : "")}
      style={{
        borderColor: alert.severityColor + "40",
        background: "linear-gradient(135deg, #1a1f2e 0%, " + alert.severityColor + "08 100%)",
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: alert.severityColor }}
      />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-xl leading-none">{CONDITION_EMOJI[alert.condition] ?? '⚠️'}</span>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-snug text-text-primary">{alert.title}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{alert.regionName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-black tracking-wide text-white"
            style={{ backgroundColor: alert.severityColor }}
          >
            {SEV_LABEL[alert.severity] ?? alert.severity}
          </span>
          {isEscalated && (
            <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/30">
              ESKALIRANO
            </span>
          )}
        </div>
      </div>
      <p className="mt-2.5 pl-2 text-xs text-text-secondary leading-relaxed">{alert.description}</p>
      {alert.recommendations.length > 0 && (
        <ul className="mt-2 pl-2 space-y-1">
          {alert.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-text-muted">
              <span className="mt-0.5 shrink-0" style={{ color: alert.severityColor }}>›</span>
              {rec}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between pl-2">
        <span className="text-[11px] text-text-muted">{timeAgo}</span>
        {onResolve && (
          <button
            onClick={() => onResolve(alert.id)}
            className="rounded-lg border border-surface-border bg-surface-raised px-2.5 py-1 text-[11px] font-medium text-text-secondary transition hover:border-red-500/40 hover:text-red-400"
          >
            Označi riješenim
          </button>
        )}
      </div>
    </div>
  );
}
