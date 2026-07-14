import { useEffect, useRef } from 'react';
import { useAlertStore } from '../store/alertStore';

export function useWeatherSocket(): { connected: boolean } {
  const wsRef = useRef<WebSocket | null>(null);
  const addAlert = useAlertStore((s) => s.addAlert);
  const updateAlert = useAlertStore((s) => s.updateAlert);
  const removeAlert = useAlertStore((s) => s.removeAlert);
  const setAlerts = useAlertStore((s) => s.setAlerts);
  const setConnected = useAlertStore((s) => s.setConnected);
  const connected = useAlertStore((s) => s.connected);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/alerts`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event: MessageEvent<string>) => {
      const msg = JSON.parse(event.data) as {
        type: string;
        payload: unknown;
      };

      switch (msg.type) {
        case 'INITIAL_ALERTS':
          setAlerts(msg.payload as Parameters<typeof setAlerts>[0]);
          break;
        case 'ALERT_CREATED':
          addAlert(msg.payload as Parameters<typeof addAlert>[0]);
          break;
        case 'ALERT_ESCALATED':
          updateAlert(msg.payload as Parameters<typeof updateAlert>[0]);
          break;
        case 'ALERT_RESOLVED':
          removeAlert((msg.payload as { aggregateId: string }).aggregateId);
          break;
      }
    };

    return () => ws.close();
  }, [addAlert, updateAlert, removeAlert, setAlerts, setConnected]);

  return { connected };
}
