import { Suspense, lazy, useState, useMemo } from 'react';
import type { ElementType } from 'react';
import { Activity, Thermometer, Map as MapIcon } from 'lucide-react';
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

/** View options for the mobile bottom navigation. */
type MobileTab = 'alerts' | 'conditions';

/** View options for the desktop tab bar. */
type DesktopTab = 'alerts' | 'conditions' | 'map';

/** Framed map height — same value used on both desktop and mobile. */
const MAP_FRAME_HEIGHT = { height: '60vh', minHeight: 320 } as const;
const MAP_FRAME_HEIGHT_MOBILE = { height: '55vh', minHeight: 280 } as const;

export function DashboardPage() {
  useWeatherSocket();
  const [mobileView, setMobileView] = useState<'map' | MobileTab>('conditions');
  const [desktopTab, setDesktopTab] = useState<DesktopTab>('alerts');
  const alerts = useAlertStore((s) => s.alerts);

  // Memoised so the array reference is stable — avoids unnecessary re-renders of tab buttons
  const observedAlertCount = useMemo(() => alerts.filter((a) => !a.isForecasted).length, [alerts]);
  const desktopTabs: { id: DesktopTab; label: string; Icon: ElementType; count?: number | undefined }[] =
    useMemo(
      () => [
        {
          id: 'alerts',
          label: 'Upozorenja',
          Icon: Activity as ElementType,
          ...(observedAlertCount ? { count: observedAlertCount } : {}),
        },
        { id: 'conditions', label: 'Trenutni uslovi', Icon: Thermometer },
        { id: 'map', label: 'Karta', Icon: MapIcon },
      ],
      [observedAlertCount],
    );

  return (
    <div className="flex flex-col bg-white overflow-hidden" style={{ height: '100dvh' }}>
      {/* ── Desktop nav ── */}
      <TopNav page="dashboard" />

      {/* ── DESKTOP layout (md+): full-width tabbed panel ── */}
      <main className="hidden md:flex flex-col flex-1 overflow-hidden pt-16">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 shrink-0 bg-white">
          {desktopTabs.map(({ id, label, Icon, count }) => (
            <button
              key={id}
              onClick={() => setDesktopTab(id)}
              className={
                'flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition ' +
                (desktopTab === id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600')
              }
            >
              <Icon size={14} />
              {label}
              {count != null && count > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-black text-white leading-none">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content — max-width centered for readability */}
        <div className="flex-1 overflow-hidden">
          {desktopTab === 'alerts' && (
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-2xl px-6 py-4">
                <AlertList />
              </div>
            </div>
          )}
          {desktopTab === 'conditions' && <CurrentConditionsPanel />}
          {desktopTab === 'map' && (
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="relative shrink-0" style={MAP_FRAME_HEIGHT}>
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
              <div className="p-5 border-t border-slate-100 bg-white">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Legenda upozorenja
                </p>
                <div className="grid grid-cols-4 gap-3">
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
          )}
        </div>
      </main>

      {/* ── MOBILE layout (<md) ── */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden">
        {mobileView === 'map' ? (
          <div className="flex-1 overflow-y-auto">
            {/* Framed map */}
            <div className="relative border-b border-slate-200" style={MAP_FRAME_HEIGHT_MOBILE}>
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
            {/* Severity legend */}
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
        />
      </div>
    </div>
  );
}
