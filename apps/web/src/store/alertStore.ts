import { create } from 'zustand';
import type { AlertDto } from '../types';

interface AlertStore {
  alerts: AlertDto[];
  connected: boolean;
  setAlerts: (alerts: AlertDto[]) => void;
  addAlert: (alert: AlertDto) => void;
  updateAlert: (alert: AlertDto) => void;
  removeAlert: (id: string) => void;
  setConnected: (connected: boolean) => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  connected: false,
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts.filter((a) => a.id !== alert.id)],
    })),
  updateAlert: (alert) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alert.id ? alert : a)),
    })),
  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),
  setConnected: (connected) => set({ connected }),
}));
