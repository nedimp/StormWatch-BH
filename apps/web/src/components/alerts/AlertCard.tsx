import {
  Wind,
  CloudRain,
  CloudHail,
  CloudSnow,
  CloudFog,
  Thermometer,
  Snowflake,
  Zap,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import type { AlertDto } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { SEVERITY_BADGE_LABELS } from '../../constants/severity';

interface AlertCardProps {
  alert: AlertDto;
}

const CONDITION_ICON: Record<string, React.ElementType> = {
  THUNDERSTORM: Zap,
  HEAVY_RAIN: CloudRain,
  HAIL: CloudHail,
  STRONG_WIND: Wind,
  HEAVY_SNOW: CloudSnow,
  FOG: CloudFog,
  EXTREME_HEAT: Thermometer,
  FROST: Snowflake,
  TORNADO_RISK: Wind,
};

export function AlertCard({ alert }: AlertCardProps) {
  const timeAgo = formatDistanceToNow(new Date(alert.issuedAt), { addSuffix: true });
  const isCritical = alert.severity === 'CRITICAL';
  const isEscalated = alert.status === 'ESCALATED';
  const Icon = CONDITION_ICON[alert.condition] ?? AlertTriangle;

  return (
    <div
      className={
        'relative overflow-hidden rounded-xl border bg-white p-4 transition-all shadow-sm ' +
        (isCritical ? 'alert-critical-pulse' : '')
      }
      style={{ borderColor: alert.severityColor + '40' }}
    >
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: alert.severityColor }}
      />

      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="flex items-start gap-2.5">
          <div
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: alert.severityColor + '15' }}
          >
            <Icon size={16} style={{ color: alert.severityColor }} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {alert.isForecasted && alert.forecastFor && (
                <span className="rounded px-1.5 py-0.5 text-[9px] font-black bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                  PROGNOZA · {new Date(alert.forecastFor).toLocaleDateString('bs-BA', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs font-bold leading-snug text-slate-800">{alert.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{alert.regionName}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-black tracking-wide text-white"
            style={{ backgroundColor: alert.severityColor }}
          >
            {SEVERITY_BADGE_LABELS[alert.severity] ?? alert.severity}
          </span>
          {isEscalated && (
            <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-600 border border-orange-200">
              ESKALIRANO
            </span>
          )}
        </div>
      </div>

      <p className="mt-2.5 pl-2 text-xs text-slate-600 leading-relaxed">{alert.description}</p>

      {alert.recommendations.length > 0 && (
        <ul className="mt-2 pl-2 space-y-1">
          {alert.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500">
              <ChevronRight
                size={10}
                className="mt-0.5 shrink-0"
                style={{ color: alert.severityColor }}
              />
              {rec}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 pl-2">
        <span className="text-[11px] text-slate-400">{timeAgo}</span>
      </div>
    </div>
  );
}
