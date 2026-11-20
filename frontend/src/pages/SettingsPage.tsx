import React, { useState, useEffect } from 'react';
import { useNitroStore } from '../stores/useNitroStore';
import { Settings, Save } from 'lucide-react';
import { AppSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, saveSettings } = useNitroStore();
  const [form, setForm] = useState<AppSettings | null>(null);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  if (!form) {
    return (
      <div className="p-8 text-xs font-mono text-nitro-muted">
        Loading configuration...
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(form);
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-nitro-red/10 border border-nitro-red/30 flex items-center justify-center text-nitro-red">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-white">
              Application Settings
            </h2>
            <p className="text-xs text-nitro-muted font-mono mt-0.5">
              Customize polling intervals, thermal warning thresholds, and local API binding
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Monitoring & Refresh Interval */}
        <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-bold text-sm text-white">
            Sensor Polling Frequency
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-nitro-muted font-mono">
              <span>Telemetry Refresh Interval:</span>
              <span className="text-white font-bold">{form.refresh_interval_ms} ms</span>
            </div>
            <input
              type="range"
              min="250"
              max="5000"
              step="250"
              value={form.refresh_interval_ms}
              onChange={(e) =>
                setForm({ ...form, refresh_interval_ms: Number(e.target.value) })
              }
              className="w-full accent-nitro-red h-1.5 bg-nitro-bg rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-nitro-muted">
              Lower values (e.g. 500ms) provide ultra-responsive live charts; higher values (e.g. 2000ms) reduce background CPU consumption to near zero.
            </p>
          </div>
        </div>

        {/* High Temperature Alerts */}
        <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-white">
              High Temperature Notification Guard
            </h3>
            <input
              type="checkbox"
              checked={form.high_temp_alerts_enabled}
              onChange={(e) =>
                setForm({ ...form, high_temp_alerts_enabled: e.target.checked })
              }
              className="accent-nitro-red w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-nitro-muted font-mono">
              <span>Alert Threshold:</span>
              <span className="text-white font-bold">{form.high_temp_alert_celsius}°C</span>
            </div>
            <input
              type="range"
              min="70"
              max="100"
              value={form.high_temp_alert_celsius}
              onChange={(e) =>
                setForm({ ...form, high_temp_alert_celsius: Number(e.target.value) })
              }
              className="w-full accent-amber-500 h-1.5 bg-nitro-bg rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Local API & Desktop Service */}
        <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-bold text-sm text-white">
            Local Security & Networking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-nitro-bg rounded-lg border border-nitro-border space-y-1">
              <span className="text-nitro-muted font-mono">Local API Port:</span>
              <span className="text-white font-bold block">{form.api_port}</span>
            </div>
            <div className="p-3.5 bg-nitro-bg rounded-lg border border-nitro-border space-y-1">
              <span className="text-nitro-muted font-mono">Loopback Bind:</span>
              <span className="text-emerald-400 font-bold block">127.0.0.1 (Localhost Only)</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-nitro-red hover:bg-nitro-redDark text-white text-xs font-semibold shadow-nitro-glow transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </form>
    </div>
  );
};
