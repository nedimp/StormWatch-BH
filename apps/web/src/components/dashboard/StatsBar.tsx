import { useAlertStore } from '../../store/alertStore';
import type { AlertSeverity } from '../../types';

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  CRITICAL: '#9C27B0',
  HIGH: '#F44336',
  MEDIUM: '#FF9800',
  LOW: '#4CAF50',
};

export function StatsBar() {
  const alerts = useAlertStore((s) => s.alerts);
  const connected = useAlertStore((s) => s.connected);

  const counts = alerts.reduce(
    (acc, a) => {
      acc[a.severity] = (acc[a.severity] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<AlertSeverity, number>>,
  );

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}
        />
        <span className="text-sm font-medium text-gray-600">
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>

      <div className="mx-2 h-5 w-px bg-gray-200" />

      <span className="text-sm text-gray-500">
        <span className="font-bold text-gray-800">{alerts.length}</span> aktivna upozorenja
      </span>

      {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as AlertSeverity[]).map((sev) =>
        counts[sev] ? (
          <span
            key={sev}
            className="rounded-full px-3 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: SEVERITY_COLORS[sev] }}
          >
            {counts[sev]} {sev}
          </span>
        ) : null,
      )}
    </div>
  );
}
