import { Suspense, lazy } from 'react';
import { useWeatherSocket } from '../hooks/useWeatherSocket';
import { AlertList } from '../components/alerts/AlertList';
import { StatsBar } from '../components/dashboard/StatsBar';

const WeatherMap = lazy(() =>
  import('../components/map/WeatherMap').then((m) => ({ default: m.WeatherMap })),
);

export function DashboardPage() {
  useWeatherSocket();

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⛈️</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">StormWatch BH</h1>
            <p className="text-xs text-gray-500">Praćenje nevremena — Bosna i Hercegovina</p>
          </div>
        </div>
        <a
          href="/api/v1/alerts"
          target="_blank"
          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          API →
        </a>
      </header>

      {/* Stats */}
      <div className="px-6 pt-4">
        <StatsBar />
      </div>

      {/* Main content */}
      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Map */}
        <div className="flex-1 overflow-hidden rounded-xl shadow-sm">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center bg-gray-100 text-gray-500">
                Učitavanje karte...
              </div>
            }
          >
            <WeatherMap />
          </Suspense>
        </div>

        {/* Alert sidebar */}
        <aside className="w-96 overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Aktivna upozorenja</h2>
          </div>
          <AlertList />
        </aside>
      </main>
    </div>
  );
}
