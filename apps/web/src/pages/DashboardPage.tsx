import { Suspense, lazy } from 'react';
import { useWeatherSocket } from '../hooks/useWeatherSocket';
import { AlertList } from '../components/alerts/AlertList';
import { StatsBar } from '../components/dashboard/StatsBar';
import { useAlertStore } from '../store/alertStore';

const WeatherMap = lazy(() =>
  import('../components/map/WeatherMap').then((m) => ({ default: m.WeatherMap })),
);

export function DashboardPage() {
  useWeatherSocket();
  const connected = useAlertStore((s) => s.connected);

  return (
    <div className="flex h-screen flex-col bg-[#0f1117] overflow-hidden">
      <header className="flex items-center justify-between border-b border-surface-border bg-surface-raised px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg shadow-lg">
            ⛈️
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary tracking-tight">StormWatch BH</h1>
            <p className="text-[11px] text-text-muted">Praćenje nevremena — Bosna i Hercegovina</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1">
            <span className={"h-2 w-2 rounded-full " + (connected ? "bg-emerald-400 animate-pulse" : "bg-red-500")} />
            <span className="text-xs font-medium text-text-secondary">
              {connected ? "Live" : "Offline"}
            </span>
          </div>
          <a
            href="http://localhost:3001/docs"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-indigo-500 hover:text-indigo-400"
          >
            Swagger API ↗
          </a>
        </div>
      </header>

      <div className="px-4 pt-3 shrink-0">
        <StatsBar />
      </div>

      <main className="flex flex-1 gap-3 overflow-hidden p-4 pt-3">
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-surface-border shadow-2xl">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center bg-surface text-text-muted text-sm gap-2">
                Učitavanje karte...
              </div>
            }
          >
            <WeatherMap />
          </Suspense>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-surface-border bg-surface-raised/90 px-3 py-1.5 backdrop-blur-sm">
            <p className="text-[11px] font-medium text-text-muted">Bosna i Hercegovina</p>
          </div>
        </div>

        <aside className="flex w-96 shrink-0 flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface-raised shadow-xl">
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text-primary">Aktivna upozorenja</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <AlertList />
          </div>
        </aside>
      </main>
    </div>
  );
}
