import { Siren, Wifi, WifiOff } from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';
import type { AlertSeverity } from '../../types';

const SEV_CONFIG: Record<AlertSeverity, { color: string; label: string; bg: string }> = {
  CRITICAL: { color: '#9C27B0', label: 'Kritično', bg: 'rgba(156,39,176,0.12)' },
  HIGH: { color: '#F44336', label: 'Visoko', bg: 'rgba(244,67,54,0.12)' },
  MEDIUM: { color: '#FF9800', label: 'Srednje', bg: 'rgba(255,152,0,0.12)' },
  LOW: { color: '#4CAF50', label: 'Nisko', bg: 'rgba(76,175,80,0.12)' },
};

interface StatsBarProps {
  compact?: boolean;
}

export function StatsBar({ compact = false }: StatsBarProps) {
  const alerts = useAlertStore((s) => s.alerts);
  const connected = useAlertStore((s) => s.connected);

  const counts = alerts.reduce(
    (acc, a) => {
      acc[a.severity] = (acc[a.severity] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<AlertSeverity, number>>,
  );

  const hasCritical = (counts.CRITICAL ?? 0) > 0;

  // Compact mode: single-line pill row used inside header
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as AlertSeverity[]).map((sev) => {
          const count = counts[sev] ?? 0;
          if (count === 0) return null;
          const cfg = SEV_CONFIG[sev];
          return (
            <span
              key={sev}
              className="rounded-md px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: cfg.bg,
                color: cfg.color,
                border: '1px solid ' + cfg.color + '30',
              }}
            >
              {count} {cfg.label}
            </span>
          );
        })}
        {hasCritical && (
          <span className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 animate-pulse">
            <Siren size={10} className="text-red-500" />
            <span className="text-[10px] font-bold text-red-600">UZBUNA</span>
          </span>
        )}
        <div className="flex items-center gap-1 ml-1">
          {connected ? (
            <Wifi size={12} className="text-emerald-500" />
          ) : (
            <WifiOff size={12} className="text-red-500" />
          )}
          <span
            className={
              'text-[11px] font-medium ' + (connected ? 'text-emerald-500' : 'text-red-500')
            }
          >
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    );
  }

  // Full mode (not currently used — kept for flexibility)
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
        <span className="text-xl font-bold text-slate-100">{alerts.length}</span>
        <span className="text-xs text-slate-500 leading-tight">
          aktivna
          <br />
          upozorenja
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as AlertSeverity[]).map((sev) => {
          const cfg = SEV_CONFIG[sev];
          const count = counts[sev] ?? 0;
          return (
            <div
              key={sev}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor: cfg.bg,
                color: cfg.color,
                border: '1px solid ' + cfg.color + '25',
                opacity: count > 0 ? 1 : 0.3,
              }}
            >
              <span className="font-black tabular-nums">{count}</span>
              <span>{cfg.label}</span>
            </div>
          );
        })}
      </div>
      {hasCritical && (
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 animate-pulse">
          <Siren size={13} className="text-red-500" />
          <span className="text-xs font-bold text-red-600 tracking-wide">KRITIČNA UZBUNA</span>
        </div>
      )}
      <div className={'flex items-center gap-1.5 ' + (hasCritical ? '' : 'ml-auto')}>
        {connected ? (
          <Wifi size={13} className="text-emerald-500" />
        ) : (
          <WifiOff size={13} className="text-red-500" />
        )}
        <span
          className={'text-xs font-medium ' + (connected ? 'text-emerald-500' : 'text-red-500')}
        >
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>
    </div>
  );
}
