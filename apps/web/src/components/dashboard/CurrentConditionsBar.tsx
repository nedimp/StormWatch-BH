import { useQuery } from '@tanstack/react-query';
import { observationsApi } from '../../services/api';
import { useAlertStore } from '../../store/alertStore';
import type { CurrentConditionDto } from '../../types';
import { formatDistanceToNow } from 'date-fns';

/** WMO weather code → emoji + label */
function wmoToDisplay(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: 'Vedro' };
  if (code <= 2) return { emoji: '🌤️', label: 'Pretežno vedro' };
  if (code === 3) return { emoji: '☁️', label: 'Oblačno' };
  if (code <= 48) return { emoji: '🌫️', label: 'Magla' };
  if (code <= 57) return { emoji: '🌦️', label: 'Rosulja' };
  if (code <= 65) return { emoji: '🌧️', label: 'Kiša' };
  if (code <= 77) return { emoji: '❄️', label: 'Snijeg' };
  if (code <= 82) return { emoji: '🌧️', label: 'Pljusak' };
  if (code <= 86) return { emoji: '🌨️', label: 'Snježni pljusak' };
  if (code === 95) return { emoji: '⛈️', label: 'Grmljavina' };
  if (code >= 96) return { emoji: '⛈️', label: 'Grmljavina s tučom' };
  return { emoji: '🌡️', label: 'Nepoznato' };
}

function tempColor(t: number): string {
  if (t >= 38) return '#ef4444'; // red-500
  if (t >= 32) return '#f97316'; // orange-500
  if (t >= 25) return '#eab308'; // yellow-500
  if (t >= 15) return '#22c55e'; // green-500
  if (t >= 5) return '#60a5fa'; // blue-400
  return '#818cf8'; // indigo-400 (cold)
}

interface ConditionCardProps {
  obs: CurrentConditionDto;
  hasAlert: boolean;
  alertColor?: string;
}

function ConditionCard({ obs, hasAlert, alertColor }: ConditionCardProps) {
  // We don't receive WMO code in the obs DTO (it's not stored yet),
  // so infer a rough display from precipitation + wind
  const code =
    obs.precipitationMmPerHour >= 10
      ? 63
      : obs.precipitationMmPerHour > 0
        ? 51
        : obs.windSpeedKmh >= 60
          ? 3
          : obs.visibilityKm < 1
            ? 45
            : 1;

  const { emoji, label } = wmoToDisplay(code);
  const tColor = tempColor(obs.temperatureCelsius);

  return (
    <div
      className="relative flex shrink-0 flex-col gap-2 rounded-xl border p-3 transition-all hover:scale-[1.02]"
      style={{
        width: 140,
        backgroundColor: hasAlert ? `${alertColor}10` : '#1a1f2e',
        borderColor: hasAlert ? `${alertColor}50` : '#2d3748',
        boxShadow: hasAlert ? `0 0 12px ${alertColor}25` : undefined,
      }}
    >
      {/* Alert indicator */}
      {hasAlert && (
        <span
          className="absolute right-2 top-2 h-2 w-2 rounded-full animate-pulse"
          style={{ backgroundColor: alertColor }}
        />
      )}

      {/* Station name */}
      <p
        className="text-[11px] font-semibold leading-tight"
        style={{ color: hasAlert ? alertColor : '#94a3b8' }}
      >
        {obs.stationName}
      </p>

      {/* Temperature — big focal point */}
      <div className="flex items-end gap-1">
        <span className="text-3xl font-black leading-none tabular-nums" style={{ color: tColor }}>
          {Math.round(obs.temperatureCelsius)}
        </span>
        <span className="mb-0.5 text-sm font-medium text-slate-500">°C</span>
      </div>

      {/* Condition */}
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{emoji}</span>
        <span className="text-[10px] text-slate-400 leading-tight">{label}</span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-1 border-t border-slate-700/60 pt-2">
        <div>
          <p className="text-[9px] uppercase tracking-wide text-slate-600">Vjetar</p>
          <p className="text-[11px] font-semibold text-slate-300">
            {Math.round(obs.windSpeedKmh)} <span className="text-[9px] text-slate-500">km/h</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-slate-600">Vlažnost</p>
          <p className="text-[11px] font-semibold text-slate-300">
            {Math.round(obs.humidityPercent)}
            <span className="text-[9px] text-slate-500">%</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-slate-600">Pritisak</p>
          <p className="text-[11px] font-semibold text-slate-300">
            {Math.round(obs.pressureHpa)}
            <span className="text-[9px] text-slate-500"> hPa</span>
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-slate-600">Padavine</p>
          <p className="text-[11px] font-semibold text-slate-300">
            {obs.precipitationMmPerHour.toFixed(1)}
            <span className="text-[9px] text-slate-500"> mm/h</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function CurrentConditionsBar() {
  const alerts = useAlertStore((s) => s.alerts);

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['conditions'],
    queryFn: () => observationsApi.getCurrent(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const alertsByRegion = new Map(alerts.map((a) => [a.regionId, a]));
  const observations = data?.data ?? [];

  if (isLoading && observations.length === 0) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[152px] shrink-0 animate-pulse rounded-xl border border-slate-800 bg-slate-900"
            style={{ width: 140 }}
          />
        ))}
      </div>
    );
  }

  if (observations.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
        <span className="text-slate-600 text-sm">
          Nema podataka o trenutnim uslovima — čeka se polling radnik...
        </span>
      </div>
    );
  }

  const updatedLabel = dataUpdatedAt
    ? formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })
    : '';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-600">
          Trenutni uslovi — {observations.length} stanica
        </span>
        <span className="text-[10px] text-slate-700">Open-Meteo · ažurirano {updatedLabel}</span>
      </div>

      {/* Horizontally scrollable strip */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {observations.map((obs) => {
          const alert = alertsByRegion.get(obs.regionId);
          return (
            <ConditionCard
              key={obs.stationId}
              obs={obs}
              hasAlert={!!alert}
              alertColor={alert?.severityColor}
            />
          );
        })}
      </div>
    </div>
  );
}
