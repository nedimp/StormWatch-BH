import { Suspense, lazy, useState } from 'react';
import { Activity } from 'lucide-react';
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_ORDER } from '../constants/severity';
import { TopNav } from '../components/shared/TopNav';
import { useWeatherSocket } from '../hooks/useWeatherSocket';
import { AlertList } from '../components/alerts/AlertList';
import { CurrentConditionsPanel } from '../components/dashboard/CurrentConditionsPanel';
import { MobileDashboardNav } from '../components/dashboard/MobileDashboardNav';
import { useAlertStore } from '../store/alertStore';

const WeatherMap = lazy(() =>
  import('../components/map/WeatherMap').then((m) => ({ default: m.WeatherMap })),
);

type Tab = 'alerts' | 'conditions';

export function DashboardPage() {
  useWeatherSocket();
  const [activeTab, setActiveTab] = useState<Tab>('alerts');
  const [mobileView, setMobileView] = useState<'map' | Tab>('conditions');
  const [desktopView, setDesktopView] = useState<'list' | 'map'>('list');
  const alerts = useAlertStore((s) => s.alerts);

  return (
    <div className="flex flex-col bg-white overflow-hidden" style={{ height: '100dvh' }}>
      {/* ── Desktop nav (with Karta/Lista toggle) ── */}
      <TopNav
        page="dashboard"
        desktopView={desktopView}
        onToggleDesktopView={() => setDesktopView((v) => v === 'list' ? 'map' : 'list')}
      />

      {/* ── DESKTOP layout (md+): stations list + alerts sidebar ── */}
      <main className="hidden md:flex flex-1 overflow-hidden pt-16">
        {/* Left panel: stations list OR framed map with legend */}
        <div className="flex-1 overflow-hidden border-r border-slate-200">
          {desktopView === 'list' ? (
            <CurrentConditionsPanel />
          ) : (
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Framed map — matches mobile 55vh pattern */}
              <div className="relative shrink-0" style={{ height: '60vh', minHeight: 320 }}>
                <Suspense fallback={
                  <div className="flex h-full items-center justify-center text-slate-400 text-sm">Učitavanje karte...</div>
                }>
                  <WeatherMap />
                </Suspense>
              </div>
              {/* Severity legend */}
              <div className="p-5 border-t border-slate-100 bg-white">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Legenda upozorenja</p>
                <div className="grid grid-cols-2 gap-3">
                  {SEVERITY_ORDER.map((sev) => (
                    <div key={sev} className="flex items-center gap-2">
                      <span className="shrink-0 h-4 w-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: SEVERITY_COLORS[sev] }} />
                      <span className="text-xs text-slate-600">{SEVERITY_LABELS[sev]}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-slate-400">Veći krug = veća ozbiljnost. Kliknite na marker za detalje.</p>
              </div>
            </div>
          )}
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
            {/* Severity legend — entity colors removed (map now shows only active alerts) */}
            <div className="p-4 bg-white">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Legenda upozorenja
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {SEVERITY_ORDER.map((sev) => (
                  <div key={sev} className="flex items-center gap-2">
                    <span
                      className="shrink-0 h-4 w-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: SEVERITY_COLORS[sev] }}
                    />
                    <span className="text-xs text-slate-600">{SEVERITY_LABELS[sev]}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-slate-400">
                Veći krug = veća ozbiljnost. Kliknite na marker za detalje.
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
