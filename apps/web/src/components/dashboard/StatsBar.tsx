import { Siren, Wifi, WifiOff } from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';
import {
  SEVERITY_COLORS,
  SEVERITY_BG,
  SEVERITY_LABELS,
  SEVERITY_ORDER,
} from '../../constants/severity';
import type { AlertSeverity } from '../../types';

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
        {SEVERITY_ORDER.map((sev) => {
          const count = counts[sev] ?? 0;
          if (count === 0) return null;
          const color = SEVERITY_COLORS[sev];
          const bg = SEVERITY_BG[sev];
          const label = SEVERITY_LABELS[sev];
          return (
            <span
              key={sev}
              className="rounded-md px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: bg,
                color: color,
                border: '1px solid ' + color + '30',
              }}
            >
              {count} {label}
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
        {SEVERITY_ORDER.map((sev) => {
          const color = SEVERITY_COLORS[sev];
          const bg = SEVERITY_BG[sev];
          const label = SEVERITY_LABELS[sev];
          const count = counts[sev] ?? 0;
          return (
            <div
              key={sev}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
              style={{
                backgroundColor: bg,
                color: color,
                border: '1px solid ' + color + '25',
                opacity: count > 0 ? 1 : 0.3,
              }}
            >
              <span className="font-black tabular-nums">{count}</span>
              <span>{label}</span>
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
