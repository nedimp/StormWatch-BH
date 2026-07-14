import { Suspense, lazy, useState } from 'react';
import { Activity } from 'lucide-react';
import { TopNav } from '../components/dashboard/TopNav';
import { useWeatherSocket } from '../hooks/useWeatherSocket';
import { AlertList } from '../components/alerts/AlertList';
import { CurrentConditionsPanel } from '../components/dashboard/CurrentConditionsPanel';
import { MobileDashboardNav } from '../components/dashboard/MobileDashboardNav';
import { useAlertStore } from '../store/alertStore';
import { ENTITY_COLORS, ENTITY_LABELS } from '../constants/entities';

const WeatherMap = lazy(() =>
  import('../components/map/WeatherMap').then((m) => ({ default: m.WeatherMap })),
);

type Tab = 'alerts' | 'conditions';

export function DashboardPage() {
  useWeatherSocket();
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
              <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
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
          <div className="flex-1 overflow-y-auto">
            {/* Framed map */}
            <div
              className="relative border-b border-slate-200"
              style={{ height: '55vh', minHeight: 280 }}
            >
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                    Učitavanje karte...
                  </div>
                }
              >
                <WeatherMap />
              </Suspense>
            </div>
            {/* Legend */}
            <div className="p-4 bg-white">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Legenda
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span
                      className="shrink-0 h-3 w-3 rounded-full"
                      style={{ backgroundColor: ENTITY_COLORS[key], opacity: 0.7 }}
                    />
                    <span className="text-xs text-slate-600">{label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span
                    className="shrink-0 h-5 w-5 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: '#ef4444' }}
                  />
                  <span className="text-xs text-slate-600">Aktivno upozorenje</span>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-slate-400">
                Kliknite na marker za detalje regije.
              </p>
            </div>
          </div>
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
        <MobileDashboardNav
          mobileView={mobileView}
          setMobileView={setMobileView}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}
