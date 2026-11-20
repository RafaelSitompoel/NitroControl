import React from 'react';
import { useNitroStore } from '../stores/useNitroStore';
import { Power, ShieldAlert, CheckCircle2, AlertTriangle, Download } from 'lucide-react';

export const Header: React.FC = () => {
  const { telemetry, profiles, activateProfile, notification, setNotification } =
    useNitroStore();

  const activeProfile = profiles.find((p) => p.is_active);

  return (
    <header className="h-16 bg-nitro-card border-b border-nitro-border px-6 flex items-center justify-between">
      {/* Active Profile Quick Indicator */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-nitro-muted font-medium">Active Profile:</span>
        <div className="flex items-center gap-1.5 bg-nitro-bg px-3 py-1.5 rounded-lg border border-nitro-border">
          <span className="w-2 h-2 rounded-full bg-nitro-red animate-pulse-subtle" />
          <span className="text-xs font-semibold text-white">
            {activeProfile?.name || 'Balanced'}
          </span>
        </div>

        {/* Quick Profile Switcher */}
        <div className="flex items-center gap-1 ml-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => activateProfile(p.id)}
              className={`px-2.5 py-1 text-xs rounded transition-all ${
                p.is_active
                  ? 'bg-nitro-red/20 text-nitro-red border border-nitro-red/40 font-medium'
                  : 'text-nitro-muted hover:text-white hover:bg-nitro-cardHover'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications and System Clock / Battery */}
      <div className="flex items-center gap-4">
        {notification && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border animate-fadeIn cursor-pointer ${
              notification.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300'
                : notification.type === 'error'
                ? 'bg-rose-950/60 border-rose-700/50 text-rose-300'
                : 'bg-blue-950/60 border-blue-700/50 text-blue-300'
            }`}
            onClick={() => setNotification(null)}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {notification.type === 'error' && <ShieldAlert className="w-3.5 h-3.5" />}
            {notification.type === 'info' && <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Battery Indicator */}
        {telemetry?.battery?.present && (
          <div className="flex items-center gap-2 bg-nitro-bg px-3 py-1.5 rounded-lg border border-nitro-border text-xs font-mono">
            <Power
              className={`w-3.5 h-3.5 ${
                telemetry.battery.is_charging ? 'text-amber-400' : 'text-emerald-400'
              }`}
            />
            <span className="text-white font-medium">
              {telemetry.battery.percentage !== undefined
                ? `${Math.round(telemetry.battery.percentage)}%`
                : 'AC'}
            </span>
            {telemetry.battery.is_charging && (
              <span className="text-[10px] text-amber-400 font-sans font-medium">
                (Charging)
              </span>
            )}
          </div>
        )}

        {/* Download Portable App Button */}
        <a
          href="/NitroControl-v0.1.0-win-x64.zip"
          download="NitroControl-v0.1.0-win-x64.zip"
          className="flex items-center gap-1.5 bg-nitro-red/20 hover:bg-nitro-red text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-nitro-red/40 transition-all cursor-pointer group shadow-sm"
          title="Download NitroControl Standalone Portable ZIP"
        >
          <Download className="w-3.5 h-3.5 text-nitro-red group-hover:text-white transition-colors" />
          <span>Download App (.zip)</span>
        </a>
      </div>
    </header>
  );
};
