import {
  ApiResponse,
  AppSettings,
  HardwareCapabilities,
  HistoricalDataPoint,
  Profile,
  SystemInfo,
  TelemetrySnapshot,
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const json: ApiResponse<T> = await res.json();
  if (!json.success || !res.ok) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }

  return json.data as T;
}

export const api = {
  elevate: () => request<string>('/system/elevate', { method: 'POST' }),
  getSystemInfo: () => request<SystemInfo>('/system'),
  getCapabilities: () => request<HardwareCapabilities>('/capabilities'),
  getSensors: () => request<TelemetrySnapshot>('/sensors'),
  getFans: () => request<any>('/fans'),
  getHistory: (range: string = '30m') =>
    request<HistoricalDataPoint[]>(`/history?range=${range}`),
  exportHistoryCsv: async (range: string = '1h'): Promise<Blob> => {
    const res = await fetch(`${API_BASE}/history/export?range=${range}`);
    if (!res.ok) throw new Error('Failed to export CSV');
    return res.blob();
  },
  clearHistory: () =>
    request<string>('/history/clear', { method: 'POST' }),

  getPerformanceSchemes: () => request<any>('/performance'),
  setPerformanceMode: (mode: string) =>
    request<any>('/performance/mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    }),

  setFanMode: (mode: string, speed_percent?: number) =>
    request<string>('/fans/mode', {
      method: 'POST',
      body: JSON.stringify({ mode, speed_percent }),
    }),

  setCoolBoost: (enabled: boolean) =>
    request<string>('/coolboost', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  // Battery Limiter
  getBatteryLimit: () => request<{ enabled: boolean; limit_percent: number; description: string }>('/battery/limit'),
  setBatteryLimit: (enabled: boolean) =>
    request<string>('/battery/limit', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  getProfiles: () => request<Profile[]>('/profiles'),
  saveProfile: (profile: Profile) =>
    request<Profile>('/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),
  activateProfile: (profile_id: string) =>
    request<Profile>('/profiles/activate', {
      method: 'POST',
      body: JSON.stringify({ profile_id }),
    }),
  deleteProfile: (id: string) =>
    request<string>(`/profiles/${id}`, { method: 'DELETE' }),

  getSettings: () => request<AppSettings>('/settings'),
  updateSettings: (settings: AppSettings) =>
    request<AppSettings>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
};
