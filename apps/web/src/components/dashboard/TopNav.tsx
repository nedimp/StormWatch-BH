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
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-800"
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 shadow-sm transition group-hover:bg-slate-700">
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
                className="hidden md:block text-xs font-medium text-slate-500 transition hover:text-slate-900"
              >
                Pretplata
              </a>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistem aktivan
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
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
                className="hidden lg:block rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-900"
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
