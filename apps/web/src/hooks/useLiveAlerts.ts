import { useEffect, useState } from 'react';
import { alertsApi } from '../services/api';
import type { AlertSeverity } from '../types';

export interface LiveAlertSummary {
  count: number;
  bySeverity: Partial<Record<AlertSeverity, number>>;
}

/** Fetch a live summary of active alert counts grouped by severity. */
export function useLiveAlerts(): LiveAlertSummary | null {
  const [data, setData] = useState<LiveAlertSummary | null>(null);

  useEffect(() => {
    alertsApi
      .getActive()
      .then((res) => {
        const bySeverity: Partial<Record<AlertSeverity, number>> = {};
        for (const a of res.data) {
          bySeverity[a.severity] = (bySeverity[a.severity] ?? 0) + 1;
        }
        setData({ count: res.count, bySeverity });
      })
      .catch(() => setData({ count: 0, bySeverity: {} }));
  }, []);

  return data;
}
