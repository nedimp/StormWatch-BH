import { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Thermometer, BellRing, Map as MapIcon, Home } from 'lucide-react';
import { TopNav } from '../components/dashboard/TopNav';
import { useWeatherSocket } from '../hooks/useWeatherSocket';
import { AlertList } from '../components/alerts/AlertList';
import { CurrentConditionsPanel } from '../components/dashboard/CurrentConditionsPanel';
import { useAlertStore } from '../store/alertStore';

const WeatherMap = lazy(() =>
  import('../components/map/WeatherMap').then((m) => ({ default: m.WeatherMap })),
);

type Tab = 'alerts' | 'conditions';

export function DashboardPage() {
  useWeatherSocket();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('alerts');
  const [mobileView, setMobileView] = useState<'map' | Tab>('conditions');
  const alerts = useAlertStore((s) => s.alerts);

  return (
    <div className="flex flex-col bg-white overflow-hidden" style={{ height: '100dvh' }}>
      {/* ── Desktop nav ── */}
      <TopNav page="dashboard" />

      {/* ── DESKTOP layout (md+): stations list + alerts sidebar ── */}
      <main className="hidden md:flex flex-1 overflow-hidden pt-16">
        {/* Stations — main content */}
        <div className="flex-1 overflow-hidden border-r border-slate-200">
          <CurrentConditionsPanel />
        </div>

        {/* Alerts sidebar */}
        <aside className="w-[360px] shrink-0 flex flex-col overflow-hidden bg-white">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 shrink-0">
            <Activity size={14} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Upozorenja</span>
            {alerts.length > 0 && (
              <span className="ml-auto rounded-full bg-black px-2 py-0.5 text-[10px] font-black text-white">
                {alerts.length}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <AlertList />
          </div>
        </aside>
      </main>

      {/* ── MOBILE layout (<md) ── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {mobileView === 'map' ? (
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Učitavanje...
              </div>
            }
          >
            <div className="flex-1 overflow-hidden">
              <WeatherMap />
            </div>
          </Suspense>
        ) : mobileView === 'alerts' ? (
          <div className="flex-1 overflow-y-auto p-3">
            <AlertList />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <CurrentConditionsPanel />
          </div>
        )}

        {/* Mobile bottom nav */}
        <nav
          className="shrink-0 flex border-t border-slate-200 bg-white"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold text-slate-400"
          >
            <Home size={20} strokeWidth={1.5} />
            Početna
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold ' +
              (mobileView === 'map' ? 'text-black' : 'text-slate-400')
            }
          >
            <MapIcon size={20} strokeWidth={1.5} />
            Karta
          </button>
          <button
            onClick={() => {
              setMobileView('alerts');
              setActiveTab('alerts');
            }}
            className={
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold relative ' +
              (mobileView === 'alerts' ? 'text-black' : 'text-slate-400')
            }
          >
            <div className="relative">
              <BellRing size={20} strokeWidth={1.5} />
              {alerts.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px] font-black text-white">
                  {alerts.length}
                </span>
              )}
            </div>
            Upozorenja
          </button>
          <button
            onClick={() => {
              setMobileView('conditions');
              setActiveTab('conditions');
            }}
            className={
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold ' +
              (mobileView === 'conditions' ? 'text-black' : 'text-slate-400')
            }
          >
            <Thermometer size={20} strokeWidth={1.5} />
            Uslovi
          </button>
        </nav>
      </div>
    </div>
  );
}
