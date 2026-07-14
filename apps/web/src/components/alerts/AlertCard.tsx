import type { AlertDto } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface AlertCardProps {
  alert: AlertDto;
  onResolve?: (id: string) => void;
}

const conditionEmoji: Record<string, string> = {
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

export function AlertCard({ alert, onResolve }: AlertCardProps) {
  const timeAgo = formatDistanceToNow(new Date(alert.issuedAt), { addSuffix: true });
  const isEscalated = alert.status === 'ESCALATED';

  return (
    <div
      className={clsx(
        'rounded-xl border-l-4 bg-white shadow-md p-4 transition-all',
        isEscalated && 'animate-pulse',
      )}
      style={{ borderLeftColor: alert.severityColor }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={alert.condition}>
            {conditionEmoji[alert.condition] ?? '⚠️'}
          </span>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{alert.title}</h3>
            <p className="text-xs text-gray-500">{alert.regionName}</p>
          </div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
          style={{ backgroundColor: alert.severityColor }}
        >
          {alert.severity}
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-700">{alert.description}</p>

      {alert.recommendations.length > 0 && (
        <ul className="mt-2 space-y-1">
          {alert.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-1 text-xs text-gray-600">
              <span className="mt-0.5 text-amber-500">›</span>
              {rec}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{timeAgo}</span>
        {onResolve && (
          <button
            onClick={() => onResolve(alert.id)}
            className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Označi riješenim
          </button>
        )}
      </div>
    </div>
  );
}
