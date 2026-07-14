import { useEffect } from 'react';
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
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface border border-surface-border" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-3xl">
          ✅
        </div>
        <p className="text-sm font-semibold text-text-primary">Nema aktivnih upozorenja</p>
        <p className="mt-1 text-xs text-text-muted">Trenutno nema nevremena u BiH</p>
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
        <AlertCard
          key={alert.id}
          alert={alert}
          onResolve={(id) => resolveMutation.mutate(id)}
        />
      ))}
    </div>
  );
}
