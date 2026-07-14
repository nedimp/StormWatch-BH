import { Suspense, lazy, useState } from 'react';
import { CloudLightning, Activity, Thermometer, RefreshCw } from 'lucide-react';
import { useWeatherSocket } from '../hooks/useWeatherSocket';
import { AlertList } from '../components/alerts/AlertList';
import { StatsBar } from '../components/dashboard/StatsBar';
import { CurrentConditionsPanel } from '../components/dashboard/CurrentConditionsPanel';
import { useAlertStore } from '../store/alertStore';

const WeatherMap = lazy(() =>
  import('../components/map/WeatherMap').then((m) => ({ default: m.WeatherMap })),
);

type SidebarTab = 'alerts' | 'conditions';

export function DashboardPage() {
  useWeatherSocket();
  const [activeTab, setActiveTab] = useState<SidebarTab>('alerts');
  const alerts = useAlertStore((s) => s.alerts);

  return (
    <div className="flex h-screen flex-col bg-[#0f1117] overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-900/50">
            <CloudLightning size={16} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">StormWatch BH</h1>
            <p className="text-[10px] text-slate-500">Praćenje nevremena · Bosna i Hercegovina</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatsBar compact />
          <a
            href="http://localhost:3001/docs"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:border-indigo-600 hover:text-indigo-400"
          >
            API Docs
          </a>
        </div>
      </header>

      {/* ── Main layout ── */}
      <main className="flex flex-1 gap-3 overflow-hidden p-3">
        {/* Map — full height */}
        <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center bg-slate-900 text-slate-600 text-sm gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Učitavanje karte...
              </div>
            }
          >
            <WeatherMap />
          </Suspense>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-slate-700/60 bg-slate-900/80 px-3 py-1.5 backdrop-blur-sm">
            <p className="text-[10px] font-medium text-slate-500">Bosna i Hercegovina · Open-Meteo</p>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
          {/* Tab bar */}
          <div className="flex border-b border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('alerts')}
              className={
                'flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold transition border-b-2 ' +
                (activeTab === 'alerts'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/50'
                  : 'border-transparent text-slate-500 hover:text-slate-300')
              }
            >
              <Activity size={13} />
              Upozorenja
              {alerts.length > 0 && (
                <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-black text-white leading-none">
                  {alerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('conditions')}
              className={
                'flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold transition border-b-2 ' +
                (activeTab === 'conditions'
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/50'
                  : 'border-transparent text-slate-500 hover:text-slate-300')
              }
            >
              <Thermometer size={13} />
              Trenutni uslovi
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'alerts' ? (
              <div className="p-3">
                <AlertList />
              </div>
            ) : (
              <CurrentConditionsPanel />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
