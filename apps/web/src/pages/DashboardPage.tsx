import { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Thermometer, RefreshCw,
  BellRing, Map as MapIcon, Home,
} from 'lucide-react';
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
  const [mobileView, setMobileView] = useState<'map' | Tab>('map');
  const alerts = useAlertStore((s) => s.alerts);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('alerts')}
          className={
            'flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold transition border-b-2 ' +
            (activeTab === 'alerts'
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
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
              ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
              : 'border-transparent text-slate-500 hover:text-slate-300')
          }
        >
          <Thermometer size={13} />
          Trenutni uslovi
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'alerts' ? (
          <div className="p-3"><AlertList /></div>
        ) : (
          <CurrentConditionsPanel />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-[#0f1117] overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── Shared floating nav (desktop only) ── */}
      <TopNav page="dashboard" />

      {/* ── DESKTOP layout (md+) ── */}
      <main className="hidden md:flex flex-1 gap-3 overflow-hidden p-3 pt-20">
        {/* Map */}
        <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
          <Suspense fallback={
            <div className="flex h-full items-center justify-center bg-slate-900 text-slate-600 text-sm gap-2">
              <RefreshCw size={14} className="animate-spin" />
              Učitavanje karte...
            </div>
          }>
            <WeatherMap />
          </Suspense>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-slate-700/60 bg-slate-900/80 px-3 py-1.5 backdrop-blur-sm">
            <p className="text-[10px] font-medium text-slate-500">Bosna i Hercegovina · Open-Meteo</p>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
          {sidebarContent}
        </aside>
      </main>

      {/* ── MOBILE layout (<md) ── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {mobileView === 'map' ? (
          <div className="relative flex-1 overflow-hidden">
            <Suspense fallback={
              <div className="flex h-full items-center justify-center bg-slate-900 text-slate-600 text-sm gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Učitavanje...
              </div>
            }>
              <WeatherMap />
            </Suspense>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden bg-slate-900">
            {sidebarContent}
          </div>
        )}

        {/* Mobile bottom nav */}
        <nav className="shrink-0 flex border-t border-slate-800 bg-slate-900" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {/* Home → landing page */}
          <button
            onClick={() => navigate('/')}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold transition text-slate-600 hover:text-slate-400"
          >
            <Home size={20} strokeWidth={1.5} />
            Početna
          </button>

          {/* Map */}
          <button
            onClick={() => setMobileView('map')}
            className={
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold transition ' +
              (mobileView === 'map' ? 'text-indigo-400' : 'text-slate-600')
            }
          >
            <MapIcon size={20} strokeWidth={1.5} />
            Karta
          </button>

          {/* Alerts */}
          <button
            onClick={() => { setMobileView('alerts'); setActiveTab('alerts'); }}
            className={
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold transition relative ' +
              (mobileView === 'alerts' ? 'text-indigo-400' : 'text-slate-600')
            }
          >
            <div className="relative">
              <BellRing size={20} strokeWidth={1.5} />
              {alerts.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-black text-white">
                  {alerts.length}
                </span>
              )}
            </div>
            Upozorenja
          </button>

          {/* Conditions */}
          <button
            onClick={() => { setMobileView('conditions'); setActiveTab('conditions'); }}
            className={
              'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold transition ' +
              (mobileView === 'conditions' ? 'text-indigo-400' : 'text-slate-600')
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
