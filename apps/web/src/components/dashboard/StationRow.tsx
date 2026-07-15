import { useState } from 'react';
import { Wind, Droplets, Gauge, Eye, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { CurrentConditionDto, AlertDto } from '../../types';
import { wmoToDisplay, inferWeatherCode, tempColor } from '../../utils/weather';
import { SEVERITY_BADGE_LABELS } from '../../constants/severity';
import { formatDistanceToNow } from 'date-fns';

interface StationRowProps {
  obs: CurrentConditionDto;
  /** The active alert for this station's region, if any. */
  alert?: AlertDto | undefined;
  isNearest?: boolean;
}

/** Renders a single weather station row with an expandable alert detail panel. */
export function StationRow({ obs, alert, isNearest }: StationRowProps) {
  const { Icon, label, color } = wmoToDisplay(inferWeatherCode(obs));
  const tColor = tempColor(obs.temperatureCelsius);
  const [expanded, setExpanded] = useState(false);

  const hasAlert = !!alert;

  return (
    <div
      className="rounded-lg border bg-white transition-colors"
      style={{
        borderColor: hasAlert ? alert.severityColor + '50' : isNearest ? '#2563eb' : '#e2e8f0',
        boxShadow: isNearest ? '0 0 0 2px rgba(37,99,235,0.1)' : undefined,
      }}
    >
      {/* Main row */}
      <div className="px-3 py-2.5">
        {/* Station name + condition icon + temperature */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon size={13} style={{ color, flexShrink: 0 }} strokeWidth={1.5} />
            <span className="text-[11px] font-semibold text-slate-700 truncate">{obs.stationName}</span>
            {isNearest && (
              <span className="flex items-center gap-0.5 shrink-0 rounded px-1 py-0.5 text-[8px] font-black bg-blue-600 text-white">
                <MapPin size={7} />
                Vi ste tu
              </span>
            )}
            {hasAlert && (
              /* Clickable badge: shows condition type + chevron to expand details */
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-0.5 shrink-0 rounded px-1.5 py-0.5 text-[8px] font-black transition hover:opacity-80"
                style={{ backgroundColor: alert.severityColor + '20', color: alert.severityColor, border: `1px solid ${alert.severityColor}40` }}
                title="Prikaži detalje upozorenja"
              >
                {SEVERITY_BADGE_LABELS[alert.severity]}
                {expanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
              </button>
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

      {/* Expandable alert detail panel */}
      {hasAlert && expanded && (
        <div
          className="px-3 pb-3 border-t mx-3 pt-2.5"
          style={{ borderColor: alert.severityColor + '30' }}
        >
          <p
            className="text-[11px] font-bold mb-1"
            style={{ color: alert.severityColor }}
          >
            {alert.title}
          </p>
          <p className="text-[10px] text-slate-500 leading-relaxed mb-1.5">
            {alert.description}
          </p>
          {alert.recommendations.length > 0 && (
            <ul className="space-y-0.5">
              {alert.recommendations.slice(0, 2).map((rec, i) => (
                <li key={i} className="text-[10px] text-slate-400 flex gap-1">
                  <span style={{ color: alert.severityColor }}>·</span>
                  {rec}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[9px] text-slate-300 mt-1.5">
            {alert.isForecasted && alert.forecastFor
              ? `Prognoza za ${new Date(alert.forecastFor).toLocaleDateString('de-DE')}`  /* de-DE gives dd.mm.yyyy */
              : `Izdano ${formatDistanceToNow(new Date(alert.issuedAt), { addSuffix: true })}`}
          </p>
        </div>
      )}
    </div>
  );
}
