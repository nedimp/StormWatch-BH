import { useNavigate } from 'react-router-dom';
import { Home, Activity, Bell } from 'lucide-react';

/** Fixed mobile bottom navigation shown on the landing page. */
export function MobileLandingNav() {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex sm:hidden border-t border-slate-200 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold text-blue-600"
      >
        <Home size={20} strokeWidth={1.5} />
        Početna
      </button>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition"
      >
        <Activity size={20} strokeWidth={1.5} />
        Dashboard
      </button>
      <a
        href="#subscribe"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition"
      >
        <Bell size={20} strokeWidth={1.5} />
        Pretplata
      </a>
    </nav>
  );
}
