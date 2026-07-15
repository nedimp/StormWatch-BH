import { useState, useId } from 'react';
import { Bell, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { subscriptionsApi } from '../../services/api';

/** Email subscription form shown on the landing page. */
export function SubscribeSection() {
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
    <section id="subscribe" className="px-6 py-20 border-t border-slate-100">
      <div className="mx-auto max-w-xl text-center">
        <div className="mb-5 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <Bell size={22} className="text-slate-600" />
          </div>
        </div>
        <h2 className="mb-3 text-2xl font-black text-slate-900">Primajte upozorenja na email</h2>
        <p className="mb-8 text-sm text-slate-500 leading-relaxed">
          Pretplatite se i odmah primite email čim se izda upozorenje o nevremenu u BiH —
          grmljavina, jak vjetar, poplave i više.
        </p>

        {state === 'success' ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <CheckCircle2 size={26} className="text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-emerald-600">{message}</p>
            <button onClick={() => setState('idle')} className="text-xs text-slate-500 underline">
              Pretplatiti još jednu adresu
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor={id} className="sr-only">
              Email adresa
            </label>
            <input
              id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vasa@email.com"
              required
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
            />
            <button
              type="submit"
              disabled={state === 'loading'}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {state === 'loading' ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Slanje...
                </>
              ) : (
                <>
                  <Mail size={15} /> Pretplatite se
                </>
              )}
            </button>
          </form>
        )}

        {state === 'error' && <p className="mt-3 text-xs text-red-500">{message}</p>}
        <p className="mt-4 text-xs text-slate-400">
          Bez spama. Otkažite u svakom trenutku jednim klikom.
        </p>
      </div>
    </section>
  );
}
