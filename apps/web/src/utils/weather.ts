/**
 * Shared weather utility functions used across the frontend.
 */

import type { ElementType } from 'react';
import {
  Sun, CloudSun, Cloud, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudHail, CloudLightning,
} from 'lucide-react';
import type { CurrentConditionDto } from '../types';

/** Map temperature to a color for visual display. */
export function tempColor(t: number): string {
  if (t >= 38) return '#ef4444';
  if (t >= 32) return '#f97316';
  if (t >= 25) return '#eab308';
  if (t >= 15) return '#22c55e';
  if (t >= 5)  return '#60a5fa';
  return '#818cf8';
}

/** Map a WMO weather code to a Lucide icon, Bosnian label, and color. */
export function wmoToDisplay(code: number): { Icon: ElementType; label: string; color: string } {
  if (code === 0)  return { Icon: Sun,            label: 'Vedro',           color: '#eab308' };
  if (code <= 2)   return { Icon: CloudSun,       label: 'Pretežno vedro',  color: '#f59e0b' };
  if (code === 3)  return { Icon: Cloud,          label: 'Oblačno',         color: '#94a3b8' };
  if (code <= 48)  return { Icon: CloudFog,       label: 'Magla',           color: '#94a3b8' };
  if (code <= 57)  return { Icon: CloudDrizzle,   label: 'Rosulja',         color: '#60a5fa' };
  if (code <= 65)  return { Icon: CloudRain,      label: 'Kiša',            color: '#3b82f6' };
  if (code <= 77)  return { Icon: CloudSnow,      label: 'Snijeg',          color: '#bfdbfe' };
  if (code <= 82)  return { Icon: CloudRain,      label: 'Pljusak',         color: '#2563eb' };
  if (code <= 86)  return { Icon: CloudSnow,      label: 'Snj. pljusak',    color: '#bfdbfe' };
  if (code === 95) return { Icon: CloudLightning, label: 'Grmljavina',      color: '#a78bfa' };
  return            { Icon: CloudHail,            label: 'Grmlj. + tuča',   color: '#8b5cf6' };
}

/**
 * Infer a WMO-like code from observation metrics when the actual
 * WMO code is unavailable (fallback for older data).
 */
export function inferWeatherCode(obs: CurrentConditionDto): number {
  if (obs.precipitationMmPerHour >= 30) return 82;
  if (obs.precipitationMmPerHour >= 10) return 63;
  if (obs.precipitationMmPerHour > 0)   return 51;
  if (obs.windSpeedKmh >= 60)           return 3;
  if (obs.visibilityKm < 0.5)           return 45;
  return 1;
}
