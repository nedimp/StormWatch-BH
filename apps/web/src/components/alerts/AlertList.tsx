import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';
import { AlertCard } from './AlertCard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../../services/api';
import type { AlertSeverity } from '../../types';

const SEVERITY_ORDER: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function AlertList() {
  const { alerts, setAlerts } = useAlertStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.getActive(),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (data?.data) setAlerts(data.data);
  }, [data, setAlerts]);

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id, 'Manual resolve from dashboard'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-slate-800/50 border border-slate-700/50"
          />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
          <CheckCircle2 size={26} className="text-emerald-500" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-slate-300">Nema aktivnih upozorenja</p>
        <p className="mt-1 text-xs text-slate-600">Trenutno nema nevremena u BiH</p>
      </div>
    );
  }

  const sorted = [...alerts].sort((a, b) => {
    const ai = SEVERITY_ORDER.indexOf(a.severity);
    const bi = SEVERITY_ORDER.indexOf(b.severity);
    if (ai !== bi) return ai - bi;
    return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
  });

  return (
    <div className="space-y-2">
      {sorted.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onResolve={(id) => resolveMutation.mutate(id)} />
      ))}
    </div>
  );
}
