import { useNavigate } from 'react-router-dom';
import { Home, Map as MapIcon, BellRing, Thermometer } from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';

type MobileView = 'map' | 'alerts' | 'conditions';

interface MobileDashboardNavProps {
  mobileView: MobileView;
  setMobileView: (v: MobileView) => void;
}

/** Fixed-height mobile bottom navigation for the dashboard (4 tabs). */
export function MobileDashboardNav({ mobileView, setMobileView }: MobileDashboardNavProps) {
  const navigate = useNavigate();
  const alerts = useAlertStore((s) => s.alerts);

  const tabClass = (view: MobileView) =>
    'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold ' +
    (mobileView === view ? 'text-blue-600' : 'text-slate-400');

  return (
    <nav
      className="shrink-0 flex border-t border-slate-200 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button onClick={() => navigate('/')} className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold text-slate-400">
        <Home size={20} strokeWidth={1.5} />
        Početna
      </button>

      <button onClick={() => setMobileView('map')} className={tabClass('map')}>
        <MapIcon size={20} strokeWidth={1.5} />
        Karta
      </button>

      <button
        onClick={() => { setMobileView('alerts'); }}
        className={tabClass('alerts') + ' relative'}
      >
        <div className="relative">
          <BellRing size={20} strokeWidth={1.5} />
          {alerts.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white">
              {alerts.length}
            </span>
          )}
        </div>
        Upozorenja
      </button>

      <button
        onClick={() => { setMobileView('conditions'); }}
        className={tabClass('conditions')}
      >
        <Thermometer size={20} strokeWidth={1.5} />
        Uslovi
      </button>
    </nav>
  );
}
