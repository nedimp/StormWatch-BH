import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useId } from 'react';
import {
  Activity, Thermometer, Map as MapIcon,
  Bell, Home, ArrowRight, Shield, Zap, Clock, CheckCircle2, Loader2, Mail,
} from 'lucide-react';
import { observationsApi, subscriptionsApi } from '../services/api';
import { TopNav } from '../components/dashboard/TopNav';

interface LiveStat { stationId: string; city: string; temp: number; }

function tempColor(t: number): string {
  if (t >= 38) return '#ef4444';
  if (t >= 32) return '#f97316';
  if (t >= 25) return '#eab308';
  if (t >= 15) return '#22c55e';
  return '#60a5fa';
}

function useLiveStats() {
  const [stats, setStats] = useState<LiveStat[]>([]);
  useEffect(() => {
    observationsApi.getCurrent().then((res) => {
      const byCity = new Map<string, LiveStat>();
      for (const s of res.data) {
        const city = s.stationName.split(' (')[0] ?? s.stationName;
        const temp = Math.round(s.temperatureCelsius);
        const ex = byCity.get(city);
        if (!ex || temp > ex.temp) byCity.set(city, { stationId: s.stationId, city, temp });
      }
      setStats([...byCity.values()].slice(0, 6));
    }).catch(() => {});
  }, []);
  return stats;
}

function SubscribeSection() {
  const id = useId();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    try {
      const res = await subscriptionsApi.subscribe(email.trim());
      setMessage(res.message);
      setState('success');
      setEmail('');
    } catch {
      setMessage('Greška pri slanju. Pokušajte ponovo.');
      setState('error');
    }
  };

  return (
    <section id="subscribe" className="px-6 py-20 border-t border-slate-800/60">
      <div className="mx-auto max-w-xl text-center">
        <div className="mb-5 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
            <Bell size={22} className="text-indigo-400" />
          </div>
        </div>
        <h2 className="mb-3 text-2xl font-black text-white">Primajte upozorenja na email</h2>
        <p className="mb-8 text-sm text-slate-400 leading-relaxed">
          Pretplatite se i odmah primite email čim se izda upozorenje o nevremenu u BiH —
          grmljavina, jak vjetar, poplave i više.
        </p>

        {state === 'success' ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 size={26} className="text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-emerald-400">{message}</p>
            <button onClick={() => setState('idle')} className="text-xs text-slate-600 underline">
              Pretplatiti još jednu adresu
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor={id} className="sr-only">Email adresa</label>
            <input
              id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vasa@email.com"
              required
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={state === 'loading'}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {state === 'loading'
                ? <><Loader2 size={15} className="animate-spin" /> Slanje...</>
                : <><Mail size={15} /> Pretplatite se</>}
            </button>
          </form>
        )}

        {state === 'error' && (
          <p className="mt-3 text-xs text-red-400">{message}</p>
        )}

        <p className="mt-4 text-xs text-slate-700">
          Bez spama. Otkažite u svakom trenutku jednim klikom.
        </p>
      </div>
    </section>
  );
}

const FEATURES = [
  { Icon: Zap,    color: '#818cf8', title: 'Automatska detekcija',    desc: 'Prag vrijednosti za grmljavinu, jak vjetar, obilne padavine i ekstremnu vrućinu primjenjen na svaku stanicu.' },
  { Icon: MapIcon, color: '#34d399', title: '14 stanica u BiH',       desc: 'Kontinuirano praćenje u Sarajevu, Banja Luci, Tuzli, Mostaru, Zenici, Brčkom i 8 ostalih tačaka.' },
  { Icon: Bell,   color: '#f97316', title: 'Email upozorenja',        desc: 'Pretplatite se i odmah primite email čim se izda upozorenje — bez potrebe da pratite stranicu.' },
  { Icon: Clock,  color: '#60a5fa', title: 'Ažuriranje svakih 15 min',desc: 'Open-Meteo API pruža meteorološke podatke visoke rezolucije bez naknade, bez ograničenja.' },
  { Icon: Shield, color: '#a78bfa', title: 'WebSocket notifikacije',  desc: 'Real-time push uzbune u pretraživač čim se stanje promijeni — bez ručnog osvježavanja.' },
  { Icon: Activity, color: '#fb7185', title: 'REST + Swagger API',    desc: 'Sve uzbune i mjerenja dostupni putem REST API-ja, Swagger dokumentacija uključena.' },
];

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#4CAF50', MEDIUM: '#FF9800', HIGH: '#F44336', CRITICAL: '#9C27B0',
};

export function LandingPage() {
  const navigate = useNavigate();
  const liveStats = useLiveStats();

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 overflow-x-hidden pb-16 sm:pb-0">

      {/* ── Shared floating nav (desktop only) ── */}
      <TopNav page="landing" />

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-20 sm:pt-40 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-indigo-300">Live praćenje · Bosna i Hercegovina</span>
        </div>

        <h1 className="mb-4 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
          Nevrijeme u BiH —{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            uvijek na oku
          </span>
        </h1>
        <p className="mb-10 max-w-2xl text-base text-slate-400 sm:text-lg leading-relaxed">
          StormWatch BH prati meteorološke stanice širom Bosne i Hercegovine i automatski izdaje
          upozorenja za grmljavinu, jak vjetar, obilne padavine i ekstremnu vrućinu.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500">
            Otvori Dashboard <ArrowRight size={15} />
          </button>
          <a href="#subscribe"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-indigo-500/50 hover:text-indigo-400">
            <Bell size={14} /> Pretplatite se
          </a>
        </div>
      </section>

      {/* ── Live temps ── */}
      {liveStats.length > 0 && (
        <section className="border-y border-slate-800/60 bg-slate-900/40 px-6 py-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
            Trenutne temperature · Open-Meteo · live
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {liveStats.map((s) => (
              <div key={s.stationId} className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5">
                <Thermometer size={13} className="text-slate-600" />
                <span className="text-xs font-medium text-slate-400">{s.city}</span>
                <span className="text-sm font-black tabular-nums" style={{ color: tempColor(s.temp) }}>{s.temp}°C</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Kako funkcioniše</h2>
            <p className="text-slate-500 text-sm">Arhitektura za praćenje nevremena — od mjerenja do upozorenja</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, color, title, desc }) => (
              <div key={title} className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700 hover:bg-slate-900">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: color + '20' }}>
                  <Icon size={17} style={{ color }} strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-sm font-bold text-slate-100">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Severity legend ── */}
      <section className="border-t border-slate-800/60 bg-slate-900/30 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-2 text-xl font-bold text-white">Nivoi upozorenja</h2>
          <p className="mb-10 text-sm text-slate-500">Svako upozorenje je klasifikovano prema intenzitetu</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { level: 'NISKO',    key: 'LOW',      desc: 'Praćenje, bez neposredne opasnosti' },
              { level: 'SREDNJE',  key: 'MEDIUM',   desc: 'Opreznost, moguće smetnje' },
              { level: 'VISOKO',   key: 'HIGH',     desc: 'Reagujte, opasnost po imovinu' },
              { level: 'KRITIČNO', key: 'CRITICAL', desc: 'Hitno djelovanje, opasnost po život' },
            ].map(({ level, key, desc }) => (
              <div key={key} className="flex flex-col items-center gap-2 rounded-xl border p-4"
                style={{ borderColor: SEVERITY_COLORS[key] + '40', backgroundColor: SEVERITY_COLORS[key] + '0a' }}>
                <span className="rounded-md px-2.5 py-1 text-[11px] font-black text-white" style={{ backgroundColor: SEVERITY_COLORS[key] }}>
                  {level}
                </span>
                <p className="text-[11px] text-slate-500 text-center leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Email subscription ── */}
      <SubscribeSection />

      {/* ── CTA banner ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 p-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/50">
              <CloudLightning size={22} className="text-white" strokeWidth={2} />
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-black text-white">Provjerite stanje sada</h2>
          <p className="mb-8 text-sm text-slate-400">
            Pratite live podatke za 14 stanica, pregledajte aktivna upozorenja i pratite situaciju na mapi.
          </p>
          <button onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500">
            Otvori Dashboard <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
            <CloudLightning size={11} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-xs font-bold text-slate-400">StormWatch BH</span>
        </div>
        <p className="text-[11px] text-slate-700">
          Meteorološki podaci: Open-Meteo · Karte: CartoDB / OpenStreetMap
        </p>
      </footer>

      {/* ── Mobile bottom nav (landing page) ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex sm:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold text-indigo-400"
        >
          <Home size={20} strokeWidth={1.5} />
          Početna
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold text-slate-500 hover:text-slate-300 transition"
        >
          <Activity size={20} strokeWidth={1.5} />
          Dashboard
        </button>
        <a
          href="#subscribe"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold text-slate-500 hover:text-slate-300 transition"
        >
          <Bell size={20} strokeWidth={1.5} />
          Pretplata
        </a>
      </nav>

    </div>
  );
}
