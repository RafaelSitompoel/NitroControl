import { create } from 'zustand';
import { api } from '../api/client';
import {
  AppSettings,
  HardwareCapabilities,
  HistoricalDataPoint,
  Profile,
  SystemInfo,
  TelemetrySnapshot,
} from '../types';

interface NitroStore {
  // State
  telemetry: TelemetrySnapshot | null;
  capabilities: HardwareCapabilities | null;
  systemInfo: SystemInfo | null;
  profiles: Profile[];
  settings: AppSettings | null;
  history: HistoricalDataPoint[];
  historyRange: string;
  activeTab: string;
  activeFanMode: string;
  activePowerMode: string;
  coolboostEnabled: boolean;
  batteryLimitEnabled: boolean;   // 80% BattCare limit
  batteryLimitLoading: boolean;
  wsConnected: boolean;
  connectionError: string | null;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;

  // Actions
  setActiveTab: (tab: string) => void;
  setHistoryRange: (range: string) => void;
  setNotification: (notif: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
  fetchInitialData: () => Promise<void>;
  initWebSocket: () => void;
  activateProfile: (id: string) => Promise<void>;
  setPowerMode: (mode: string) => Promise<void>;
  setFanMode: (mode: string, speed?: number) => Promise<void>;
  toggleCoolBoost: (enabled: boolean) => Promise<void>;
  setBatteryLimit: (enabled: boolean) => Promise<void>;
  fetchBatteryLimit: () => Promise<void>;
  loadHistory: (range?: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  requestElevation: () => Promise<void>;
}

export const useNitroStore = create<NitroStore>((set, get) => {
  let ws: WebSocket | null = null;
  let reconnectTimer: any = null;

  return {
    telemetry: null,
    capabilities: null,
    systemInfo: null,
    profiles: [],
    settings: null,
    history: [],
    historyRange: '30m',
    activeTab: 'dashboard',
    activeFanMode: 'Auto',
    activePowerMode: 'balanced',
    coolboostEnabled: false,
    batteryLimitEnabled: false,
    batteryLimitLoading: false,
    wsConnected: false,
    connectionError: null,
    notification: null,

    setActiveTab: (tab: string) => set({ activeTab: tab }),
    setHistoryRange: (range: string) => {
      set({ historyRange: range });
      get().loadHistory(range);
    },
    setNotification: (notif) => set({ notification: notif }),

    fetchInitialData: async () => {
      try {
        const [sys, caps, profs, sets] = await Promise.all([
          api.getSystemInfo().catch(() => null),
          api.getCapabilities().catch(() => null),
          api.getProfiles().catch(() => []),
          api.getSettings().catch(() => null),
        ]);

        set({
          systemInfo: sys,
          capabilities: caps,
          profiles: profs,
          settings: sets,
          connectionError: null,
        });

        // Load history and battery limit state
        get().loadHistory('30m');
        get().fetchBatteryLimit();
      } catch (err: any) {
        set({ connectionError: err.message || 'Failed to connect to backend' });
      }
    },

    initWebSocket: () => {
      if (ws) {
        ws.close();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/monitoring`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          set({ wsConnected: true, connectionError: null });
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }
        };

        ws.onmessage = (event) => {
          try {
            const snapshot: TelemetrySnapshot = JSON.parse(event.data);
            set({ telemetry: snapshot });
          } catch (e) {
            console.error('Failed to parse WebSocket telemetry:', e);
          }
        };

        ws.onclose = () => {
          set({ wsConnected: false });
          if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              get().initWebSocket();
            }, 2000);
          }
        };

        ws.onerror = () => {
          set({ wsConnected: false });
        };
      } catch (e) {
        set({ wsConnected: false });
      }
    },

    activateProfile: async (id: string) => {
      try {
        const activated = await api.activateProfile(id);
        const updatedProfs = get().profiles.map((p) => ({
          ...p,
          is_active: p.id === id,
        }));
        set({
          profiles: updatedProfs,
          notification: {
            message: `Profile "${activated.name}" activated successfully`,
            type: 'success',
          },
        });
      } catch (err: any) {
        set({
          notification: {
            message: err.message || 'Failed to activate profile',
            type: 'error',
          },
        });
      }
    },

    setPowerMode: async (mode: string) => {
      set({ activePowerMode: mode.toLowerCase() });
      try {
        const active = await api.setPerformanceMode(mode);
        set({
          notification: {
            message: `Skema daya diatur ke: ${active?.name || mode}`,
            type: 'success',
          },
        });
      } catch (err: any) {
        set({
          notification: {
            message: err.message || 'Gagal mengubah skema daya',
            type: 'error',
          },
        });
      }
    },

    setFanMode: async (mode: string, speed?: number) => {
      set({ activeFanMode: mode });
      try {
        await api.setFanMode(mode, speed);
        set({
          notification: {
            message: `Mode kipas berhasil diubah ke: ${mode}`,
            type: 'success',
          },
        });
      } catch (err: any) {
        if (err.message && (err.message.includes('Administrator') || err.message.includes('Permission'))) {
          get().requestElevation();
        }
        set({
          notification: {
            message: err.message || 'Gagal memperbarui mode kipas',
            type: 'error',
          },
        });
      }
    },

    toggleCoolBoost: async (enabled: boolean) => {
      set({ coolboostEnabled: enabled });
      try {
        await api.setCoolBoost(enabled);
        set({
          notification: {
            message: `CoolBoost berhasil ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`,
            type: 'success',
          },
        });
      } catch (err: any) {
        if (err.message && (err.message.includes('Administrator') || err.message.includes('Permission'))) {
          get().requestElevation();
        }
        set({
          notification: {
            message: err.message || 'Gagal memperbarui CoolBoost',
            type: 'error',
          },
        });
      }
    },

    fetchBatteryLimit: async () => {
      try {
        const data = await api.getBatteryLimit();
        set({ batteryLimitEnabled: data.enabled });
      } catch {
        // Not accessible without admin — keep false
      }
    },

    setBatteryLimit: async (enabled: boolean) => {
      set({ batteryLimitLoading: true });
      try {
        await api.setBatteryLimit(enabled);
        set({
          batteryLimitEnabled: enabled,
          batteryLimitLoading: false,
          notification: {
            message: enabled
              ? '🔋 Battery limit 80% diaktifkan — BattCare melindungi baterai Anda'
              : '🔋 Battery limit dinonaktifkan — pengisian penuh (100%)',
            type: 'success',
          },
        });
      } catch (err: any) {
        set({ batteryLimitLoading: false });
        if (err.message && (err.message.includes('Administrator') || err.message.includes('Permission'))) {
          get().requestElevation();
        }
        set({
          notification: {
            message: err.message || 'Gagal mengubah battery limit',
            type: 'error',
          },
        });
      }
    },

    loadHistory: async (range: string = '30m') => {
      try {
        const history = await api.getHistory(range);
        set({ history });
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    },

    clearHistory: async () => {
      try {
        await api.clearHistory();
        set({
          history: [],
          notification: {
            message: 'Monitoring history cleared',
            type: 'info',
          },
        });
      } catch (err: any) {
        set({
          notification: {
            message: err.message || 'Failed to clear history',
            type: 'error',
          },
        });
      }
    },

    saveSettings: async (settings: AppSettings) => {
      try {
        const updated = await api.updateSettings(settings);
        set({
          settings: updated,
          notification: {
            message: 'Settings saved successfully',
            type: 'success',
          },
        });
      } catch (err: any) {
        set({
          notification: {
            message: err.message || 'Failed to save settings',
            type: 'error',
          },
        });
      }
    },

    requestElevation: async () => {
      try {
        await api.elevate();
        set({
          notification: {
            message: 'Meminta hak akses Administrator... Klik "Yes" pada jendela konfirmasi Windows.',
            type: 'info',
          },
        });
      } catch (err: any) {
        set({
          notification: {
            message: err.message || 'Gagal meminta hak akses Administrator',
            type: 'error',
          },
        });
      }
    },
  };
});
