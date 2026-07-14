import { Wind, Droplets, Gauge, Eye, MapPin } from 'lucide-react';
import type { ElementType } from 'react';
import type { CurrentConditionDto } from '../../types';
import { wmoToDisplay, inferWeatherCode, tempColor } from '../../utils/weather';

interface StationRowProps {
  obs: CurrentConditionDto;
  hasAlert: boolean;
  alertColor?: string;
  isNearest?: boolean;
}

/** Renders a single weather station row in the current conditions panel. */
export function StationRow({ obs, hasAlert, alertColor, isNearest }: StationRowProps) {
  const { Icon, label, color } = wmoToDisplay(inferWeatherCode(obs));
  const tColor = tempColor(obs.temperatureCelsius);

  return (
    <div
      className="rounded-lg border px-3 py-2.5 transition-colors bg-white"
      style={{
        borderColor: hasAlert ? alertColor + '50' : isNearest ? '#334155' : '#e2e8f0',
        boxShadow: isNearest ? '0 0 0 2px rgba(51,65,85,0.1)' : undefined,
      }}
    >
      {/* Station name + condition icon + temperature */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon size={13} style={{ color, flexShrink: 0 }} strokeWidth={1.5} />
          <span className="text-[11px] font-semibold text-slate-700 truncate">{obs.stationName}</span>
          {isNearest && (
            <span className="flex items-center gap-0.5 shrink-0 rounded px-1 py-0.5 text-[8px] font-black bg-slate-900 text-white">
              <MapPin size={7} />
              Vi ste tu
            </span>
          )}
          {hasAlert && (
            <span
              className="shrink-0 rounded px-1 py-0.5 text-[8px] font-black"
              style={{ backgroundColor: alertColor + '25', color: alertColor }}
            >
              UZBUNA
            </span>
          )}
        </div>
        <span className="text-lg font-black tabular-nums leading-none shrink-0" style={{ color: tColor }}>
          {Math.round(obs.temperatureCelsius)}
          <span className="text-[11px] font-normal text-slate-600">°C</span>
        </span>
      </div>

      <p className="text-[10px] text-slate-400 mb-2">{label}</p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {[
          { Icon: Wind,     value: Math.round(obs.windSpeedKmh),       unit: 'km/h', label: 'Vjetar'    },
          { Icon: Droplets, value: Math.round(obs.humidityPercent),    unit: '%',    label: 'Vlažnost'  },
          { Icon: Gauge,    value: Math.round(obs.pressureHpa),        unit: 'hPa',  label: 'Pritisak'  },
          { Icon: Eye,      value: Number(obs.visibilityKm.toFixed(1)), unit: 'km',  label: 'Vidljivost' },
        ].map(({ Icon: MI, value, unit, label: ml }) => (
          <div key={ml} className="flex items-center gap-1.5">
            <MI size={10} className="text-slate-400 shrink-0" />
            <span className="text-[10px] text-slate-500 tabular-nums">
              <span className="font-semibold text-slate-600">{value}</span>
              <span className="ml-0.5">{unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
