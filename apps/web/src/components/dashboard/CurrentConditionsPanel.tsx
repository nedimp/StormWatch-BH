import {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudHail, CloudLightning,
  Wind, Droplets, Gauge, Eye, Thermometer, Clock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { observationsApi } from '../../services/api';
import { useAlertStore } from '../../store/alertStore';
import type { CurrentConditionDto } from '../../types';
import { formatDistanceToNow } from 'date-fns';

function wmoToDisplay(code: number): { Icon: React.ElementType; label: string; color: string } {
  if (code === 0)  return { Icon: Sun,           label: 'Vedro',             color: '#eab308' };
  if (code <= 2)   return { Icon: CloudSun,      label: 'Pretežno vedro',    color: '#f59e0b' };
  if (code === 3)  return { Icon: Cloud,         label: 'Oblačno',           color: '#94a3b8' };
  if (code <= 48)  return { Icon: CloudFog,      label: 'Magla',             color: '#94a3b8' };
  if (code <= 57)  return { Icon: CloudDrizzle,  label: 'Rosulja',           color: '#60a5fa' };
  if (code <= 65)  return { Icon: CloudRain,     label: 'Kiša',              color: '#3b82f6' };
  if (code <= 77)  return { Icon: CloudSnow,     label: 'Snijeg',            color: '#bfdbfe' };
  if (code <= 82)  return { Icon: CloudRain,     label: 'Pljusak',           color: '#2563eb' };
  if (code <= 86)  return { Icon: CloudSnow,     label: 'Snj. pljusak',      color: '#bfdbfe' };
  if (code === 95) return { Icon: CloudLightning,label: 'Grmljavina',        color: '#a78bfa' };
  return            { Icon: CloudHail,           label: 'Grmlj. + tuča',     color: '#8b5cf6' };
}

function inferCode(obs: CurrentConditionDto): number {
  if (obs.precipitationMmPerHour >= 30) return 82;
  if (obs.precipitationMmPerHour >= 10) return 63;
  if (obs.precipitationMmPerHour > 0)   return 51;
  if (obs.windSpeedKmh >= 60)           return 3;
  if (obs.visibilityKm < 0.5)           return 45;
  return 1;
}

function tempColor(t: number): string {
  if (t >= 38) return '#ef4444';
  if (t >= 32) return '#f97316';
  if (t >= 25) return '#eab308';
  if (t >= 15) return '#22c55e';
  if (t >= 5)  return '#60a5fa';
  return '#818cf8';
}

function StationRow({ obs, hasAlert, alertColor }: {
  obs: CurrentConditionDto;
  hasAlert: boolean;
  alertColor?: string;
}) {
  const { Icon, label, color } = wmoToDisplay(inferCode(obs));
  const tColor = tempColor(obs.temperatureCelsius);

  return (
    <div
      className="rounded-lg border px-3 py-2.5 transition-colors"
      style={{
        borderColor: hasAlert ? alertColor + '50' : '#1e293b',
        backgroundColor: hasAlert ? alertColor + '08' : 'transparent',
      }}
    >
      {/* Row 1: name + condition + temperature */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={13} style={{ color, flexShrink: 0 }} strokeWidth={1.5} />
          <span className="text-[11px] font-semibold text-slate-300 truncate">{obs.stationName}</span>
          {hasAlert && (
            <span className="shrink-0 rounded px-1 py-0.5 text-[8px] font-black"
              style={{ backgroundColor: alertColor + '25', color: alertColor }}>
              UZBUNA
            </span>
          )}
        </div>
        <span className="text-lg font-black tabular-nums leading-none shrink-0" style={{ color: tColor }}>
          {Math.round(obs.temperatureCelsius)}<span className="text-[11px] font-normal text-slate-600">°C</span>
        </span>
      </div>

      {/* Row 2: condition label */}
      <p className="text-[10px] text-slate-600 mb-2">{label}</p>

      {/* Row 3: metrics — 2 columns, inline value+unit */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {[
          { Icon: Wind,     value: Math.round(obs.windSpeedKmh),      unit: 'km/h',  label: 'Vjetar'    },
          { Icon: Droplets, value: Math.round(obs.humidityPercent),   unit: '%',     label: 'Vlažnost'  },
          { Icon: Gauge,    value: Math.round(obs.pressureHpa),        unit: 'hPa',   label: 'Pritisak'  },
          { Icon: Eye,      value: Number(obs.visibilityKm.toFixed(1)), unit: 'km',  label: 'Vidljivost' },
        ].map(({ Icon: MI, value, unit, label: ml }) => (
          <div key={ml} className="flex items-center gap-1.5">
            <MI size={10} className="text-slate-700 shrink-0" />
            <span className="text-[10px] text-slate-500 tabular-nums">
              <span className="font-semibold text-slate-400">{value}</span>
              <span className="ml-0.5">{unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CurrentConditionsPanel() {
  const alerts = useAlertStore((s) => s.alerts);
  const alertsByRegion = new Map(alerts.map((a) => [a.regionId, a]));

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['conditions'],
    queryFn: () => observationsApi.getCurrent(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const observations = data?.data ?? [];

  if (isLoading && observations.length === 0) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border border-slate-800 bg-slate-800/30" />
        ))}
      </div>
    );
  }

  if (observations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Thermometer size={28} className="text-slate-700 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-slate-500">Nema podataka</p>
        <p className="mt-1 text-xs text-slate-700">Pokrenite weather-worker</p>
      </div>
    );
  }

  const updatedLabel = dataUpdatedAt
    ? formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })
    : '';

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock size={10} />
          <span className="text-[10px]">ažurirano {updatedLabel}</span>
        </div>
        <span className="text-[10px] text-slate-700">{observations.length} stanica · Open-Meteo</span>
      </div>
      <div className="divide-y divide-slate-800/60">
        {observations.map((obs) => {
          const alert = alertsByRegion.get(obs.regionId);
          return (
            <StationRow key={obs.stationId} obs={obs} hasAlert={!!alert} alertColor={alert?.severityColor} />
          );
        })}
      </div>
    </div>
  );
}
