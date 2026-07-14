import type { AlertDto, RegionDto, CurrentConditionDto } from '../types';

const BASE = '/api/v1';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error((error as { error: string }).error ?? 'API error');
  }
  return response.json() as Promise<T>;
}

export const alertsApi = {
  getActive: (params?: { regionId?: string; severity?: string }) =>
    apiFetch<{ data: AlertDto[]; count: number }>(
      `/alerts?${new URLSearchParams(params as Record<string, string>).toString()}`,
    ),
  getById: (id: string) => apiFetch<{ data: AlertDto }>(`/alerts/${id}`),
  resolve: (id: string, reason: string) =>
    apiFetch<{ data: AlertDto }>(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

export const regionsApi = {
  getAll: () => apiFetch<{ data: RegionDto[]; count: number }>('/regions'),
};

export const observationsApi = {
  getCurrent: () =>
    apiFetch<{ data: CurrentConditionDto[]; count: number; fetchedAt: string }>('/observations/current'),
};
