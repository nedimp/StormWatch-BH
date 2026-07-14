import type { AlertSeverity } from '../types';

/** Hex color for each severity level — single source of truth for the frontend. */
export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  CRITICAL: '#9C27B0',
  HIGH: '#F44336',
  MEDIUM: '#FF9800',
  LOW: '#4CAF50',
};

/** Background alpha variant used for severity badges (12% opacity). */
export const SEVERITY_BG: Record<AlertSeverity, string> = {
  CRITICAL: 'rgba(156,39,176,0.12)',
  HIGH: 'rgba(244,67,54,0.12)',
  MEDIUM: 'rgba(255,152,0,0.12)',
  LOW: 'rgba(76,175,80,0.12)',
};

/** Bosnian display label for each severity level. */
export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  CRITICAL: 'Kritično',
  HIGH: 'Visoko',
  MEDIUM: 'Srednje',
  LOW: 'Nisko',
};

/** Short badge label used in alert cards. */
export const SEVERITY_BADGE_LABELS: Record<AlertSeverity, string> = {
  CRITICAL: 'KRITIČNO',
  HIGH: 'VISOKO',
  MEDIUM: 'SREDNJE',
  LOW: 'NISKO',
};

/** Display order — CRITICAL first. */
export const SEVERITY_ORDER: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
