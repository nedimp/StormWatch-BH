import { useNavigate } from 'react-router-dom';
import { CloudLightning, ArrowRight, Home } from 'lucide-react';
import { StatsBar } from './StatsBar';

interface TopNavProps {
  page: 'landing' | 'dashboard';
}

export function TopNav({ page }: TopNavProps) {
  const navigate = useNavigate();
  const isLanding = page === 'landing';

  return (
    <div className="fixed top-4 inset-x-0 z-50 px-4 hidden sm:flex justify-center pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-lg shadow-slate-200/60 backdrop-blur-xl w-full max-w-2xl">

        {/* Left */}
        <div className="flex items-center gap-2.5">
          {!isLanding && (
            <>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                <Home size={12} />
                Početna
              </button>
              <div className="h-4 w-px bg-slate-200" />
            </>
          )}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-sm transition group-hover:bg-indigo-500">
              <CloudLightning size={13} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-sm font-bold text-slate-800 tracking-tight">StormWatch BH</span>
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {isLanding ? (
            <>
              <a
                href="#subscribe"
                className="hidden md:block text-xs font-medium text-slate-500 transition hover:text-indigo-600"
              >
                Pretplata
              </a>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistem aktivan
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
              >
                Dashboard <ArrowRight size={11} />
              </button>
            </>
          ) : (
            <>
              <StatsBar compact />
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:block rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                API Docs
              </a>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

interface TopNavProps {
  /** Which page is active — determines right-side actions */
  page: 'landing' | 'dashboard';
}

/**
 * Shared floating top navbar used on both the landing page and the dashboard.
 *
 * - Landing:   shows "Pretplata" link + "Dashboard →" button
 * - Dashboard: shows compact StatsBar + Home button on the left + API Docs
 *
 * Hidden on mobile (sm breakpoint) — mobile uses bottom nav instead.
 */
export function TopNav({ page }: TopNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isLanding = page === 'landing';

  return (
    <div className="fixed top-4 inset-x-0 z-50 px-4 hidden sm:flex justify-center pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-4 rounded-2xl border border-slate-700/50 bg-slate-900/80 px-4 py-2.5 shadow-xl shadow-black/30 backdrop-blur-xl w-full max-w-2xl">

        {/* Left: optional Home button (dashboard only) + logo */}
        <div className="flex items-center gap-2.5">
          {!isLanding && (
            <>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:border-indigo-600 hover:text-indigo-400"
              >
                <Home size={12} />
                Početna
              </button>
              <div className="h-4 w-px bg-slate-700" />
            </>
          )}

          <button
            onClick={() => navigate(isLanding ? '/' : '/')}
            className="flex items-center gap-2 group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-900/60 transition group-hover:bg-indigo-500">
              <CloudLightning size={13} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-sm font-bold text-slate-100 tracking-tight">StormWatch BH</span>
          </button>
        </div>

        {/* Right: page-specific actions */}
        <div className="flex items-center gap-3">
          {isLanding ? (
            <>
              <a
                href="#subscribe"
                className="hidden md:block text-xs font-medium text-slate-400 transition hover:text-indigo-400"
              >
                Pretplata
              </a>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistem aktivan
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
              >
                Dashboard <ArrowRight size={11} />
              </button>
            </>
          ) : (
            <>
              <StatsBar compact />
              <a
                href="http://localhost:3001/docs"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:block rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:border-indigo-600 hover:text-indigo-400"
              >
                API Docs
              </a>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
