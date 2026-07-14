import { useNavigate } from 'react-router-dom';
import { CloudLightning, Thermometer, Home, ArrowRight, Bell, Activity } from 'lucide-react';
import { TopNav } from '../components/dashboard/TopNav';
import { SubscribeSection } from '../components/landing/SubscribeSection';
import { useLiveStats } from '../hooks/useLiveStats';
import { useLiveAlerts } from '../hooks/useLiveAlerts';
import { tempColor } from '../utils/weather';
import { FEATURES, SEVERITY_LEGEND } from '../constants/landingContent';
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_ORDER } from '../constants/severity';
import type { AlertSeverity } from '../types';

export function LandingPage() {
  const navigate = useNavigate();
  const liveStats = useLiveStats();
  const liveAlerts = useLiveAlerts();

  return (
    <div
      className="min-h-screen bg-white text-slate-800 overflow-x-hidden pb-16 sm:pb-0"
      style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
    >
      {/* ── Shared floating nav (desktop only) ── */}
      <TopNav page="landing" />

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-20 pb-20 sm:pt-40 text-center overflow-hidden">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-900">
            Live praćenje · Bosna i Hercegovina
          </span>
        </div>

        <h1 className="mb-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          Nevrijeme u BiH — <span className="text-slate-600">uvijek na oku</span>
        </h1>
        <p className="mb-10 max-w-2xl text-base text-slate-500 sm:text-lg leading-relaxed">
          StormWatch BH prati meteorološke stanice širom Bosne i Hercegovine i automatski izdaje
          upozorenja za grmljavinu, jak vjetar, obilne padavine i ekstremnu vrućinu.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-500"
          >
            Otvori Dashboard <ArrowRight size={15} />
          </button>
          <a
            href="#subscribe"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
          >
            <Bell size={14} /> Pretplatite se
          </a>
        </div>
      </section>

      {/* ── Live alert status banner ── */}
      {liveAlerts !== null && (
        <section className="border-b border-slate-100 bg-white px-6 py-4">
          <div className="mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={
                  'h-2 w-2 rounded-full ' +
                  (liveAlerts.count > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500')
                }
              />
              <span className="text-sm font-semibold text-slate-700">
                {liveAlerts.count > 0
                  ? `${liveAlerts.count} aktivno upozorenje${liveAlerts.count > 1 ? 'a' : ''}`
                  : 'Nema aktivnih upozorenja'}
              </span>
            </div>
            {liveAlerts.count > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => {
                  const n = liveAlerts.bySeverity[sev];
                  if (!n) return null;
                  return (
                    <span
                      key={sev}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                      style={{ backgroundColor: SEVERITY_COLORS[sev] }}
                    >
                      {n}× {SEVERITY_LABELS[sev as AlertSeverity]}
                    </span>
                  );
                })}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800"
                >
                  Pogledaj &rarr;
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Live temps ── */}
      {liveStats.length > 0 && (
        <section className="border-y border-slate-100 bg-slate-50 px-6 py-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400 text-center">
            Trenutne temperature · Open-Meteo · live
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {liveStats.map((s) => (
              <div
                key={s.stationId}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm"
              >
                <Thermometer size={13} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500">{s.city}</span>
                <span
                  className="text-sm font-black tabular-nums"
                  style={{ color: tempColor(s.temp) }}
                >
                  {s.temp}°C
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">Kako funkcioniše</h2>
            <p className="text-slate-400 text-sm">
              Arhitektura za praćenje nevremena — od mjerenja do upozorenja
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, color, title, desc }) => (
              <div
                key={title}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300"
              >
                <div
                  className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: color + '15' }}
                >
                  <Icon size={17} style={{ color }} strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-sm font-bold text-slate-800">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Severity legend ── */}
      <section className="border-t border-slate-100 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-2 text-xl font-bold text-slate-900">Nivoi upozorenja</h2>
          <p className="mb-10 text-sm text-slate-500">
            Svako upozorenje je klasifikovano prema intenzitetu
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SEVERITY_LEGEND.map(({ level, key, desc }) => (
              <div
                key={key}
                className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 shadow-sm"
                style={{ borderColor: SEVERITY_COLORS[key] + '30' }}
              >
                <span
                  className="rounded-md px-2.5 py-1 text-[11px] font-black text-white"
                  style={{ backgroundColor: SEVERITY_COLORS[key] }}
                >
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
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-100">
              <CloudLightning size={22} className="text-white" strokeWidth={2} />
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-black text-slate-900">Provjerite stanje sada</h2>
          <p className="mb-8 text-sm text-slate-500">
            Pratite live podatke za 14 stanica, pregledajte aktivna upozorenja i pratite situaciju
            na mapi.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-500"
          >
            Otvori Dashboard <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center bg-white">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
            <CloudLightning size={11} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-xs font-bold text-slate-600">StormWatch BH</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Meteorološki podaci: Open-Meteo · Karte: CartoDB / OpenStreetMap
        </p>
      </footer>

      {/* ── Mobile bottom nav (landing page) ── */}
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
    </div>
  );
}
