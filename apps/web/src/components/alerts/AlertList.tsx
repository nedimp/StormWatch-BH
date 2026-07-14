import { useAlertStore } from '../../store/alertStore';
import { AlertCard } from './AlertCard';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../../services/api';
import type { AlertSeverity } from '../../types';

const SEVERITY_ORDER: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function AlertList() {
  const alerts = useAlertStore((s) => s.alerts);
  const qc = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id, 'Manual resolve from dashboard'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl">✅</span>
        <p className="mt-4 text-lg font-medium text-gray-700">Nema aktivnih upozorenja</p>
        <p className="text-sm text-gray-400">Trenutno nema nevremena u BiH</p>
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
    <div className="space-y-3">
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
