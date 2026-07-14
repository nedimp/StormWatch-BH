import { Thermometer } from 'lucide-react';
import { useLiveStats } from '../../hooks/useLiveStats';
import { tempColor } from '../../utils/weather';

/** Horizontal strip of live temperature chips, one per city. */
export function LiveTempsStrip() {
  const liveStats = useLiveStats();

  if (liveStats.length === 0) return null;

  return (
    <section className="border-y border-slate-100 bg-slate-50 px-6 py-5">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center">
        Trenutne temperature · Open-Meteo · live
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {liveStats.map((s) => (
          <div
            key={s.stationId}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm"
          >
            <Thermometer size={13} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500">{s.city}</span>
            <span className="text-sm font-black tabular-nums" style={{ color: tempColor(s.temp) }}>
              {s.temp}°C
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
