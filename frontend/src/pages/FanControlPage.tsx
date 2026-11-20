import React from 'react';
import { useNitroStore } from '../stores/useNitroStore';
import { CapabilityBadge } from '../components/CapabilityBadge';
import { Fan, ShieldAlert, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

export const FanControlPage: React.FC = () => {
  const { telemetry, capabilities, setFanMode, toggleCoolBoost, requestElevation } = useNitroStore();

  const fans = telemetry?.fans || [];
  const fan1 = fans[0];
  const fan2 = fans[1];
  const fanControlCap = capabilities?.fan_control;
  const coolboostCap = capabilities?.coolboost;

  const isSupported = fanControlCap?.status === 'Supported';
  const isPermissionDenied = fanControlCap?.status === 'PermissionDenied';

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Capability Warning / Status Banner */}
      {!isSupported && (
        <div
          className={`p-5 rounded-xl border flex items-start gap-3.5 ${
            isPermissionDenied
              ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
              : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
          }`}
        >
          {isPermissionDenied ? (
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-sm">
              {isPermissionDenied
                ? 'Elevated Privileges Required for Hardware Fan Control'
                : 'Fan Control Not Supported on this Hardware'}
            </h4>
            <p className="text-xs opacity-90 leading-relaxed font-sans">
              {fanControlCap?.reason ||
                'NitroControl connects directly to official Acer ACPI WMI BIOS registers without unsafe EC register modification. Run the application as Administrator to enable live fan speed control.'}
            </p>
            {isPermissionDenied && (
              <button
                onClick={requestElevation}
                className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-black" />
                <span>Aktifkan Hak Administrator (Run as Admin)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fan Tachometer Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fan 1 (CPU) Card */}
        <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-nitro-red/10 border border-nitro-red/30 flex items-center justify-center text-nitro-red">
                <Fan className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-white">
                  Fan 1 (CPU Fan)
                </h3>
                <p className="text-xs text-nitro-muted font-mono">
                  {fan1?.source || 'Acer Gaming WMI'}
                </p>
              </div>
            </div>
            {fanControlCap && <CapabilityBadge status={fanControlCap.status} />}
          </div>

          <div className="py-4 text-center bg-nitro-bg rounded-lg border border-nitro-border/60">
            <div className="text-4xl font-heading font-bold text-white tracking-tight">
              {fan1?.current_rpm ? fan1.current_rpm : 'Auto Active'}
            </div>
            <div className="text-xs text-nitro-muted font-mono mt-1">
              {fan1?.current_rpm ? 'Rotations Per Minute (RPM)' : fan1?.status || 'Tachometer Active'}
            </div>
          </div>

          <div className="text-xs text-nitro-muted flex items-center justify-between font-mono pt-1">
            <span>Operating Mode:</span>
            <span className="text-white font-semibold">{fan1?.mode || 'Automatic'}</span>
          </div>
        </div>

        {/* Fan 2 (GPU) Card */}
        <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-nitro-red/10 border border-nitro-red/30 flex items-center justify-center text-nitro-red">
                <Fan className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-white">
                  Fan 2 (GPU Fan)
                </h3>
                <p className="text-xs text-nitro-muted font-mono">
                  {fan2?.source || 'Acer Gaming WMI'}
                </p>
              </div>
            </div>
            {fanControlCap && <CapabilityBadge status={fanControlCap.status} />}
          </div>

          <div className="py-4 text-center bg-nitro-bg rounded-lg border border-nitro-border/60">
            <div className="text-4xl font-heading font-bold text-white tracking-tight">
              {fan2?.current_rpm ? fan2.current_rpm : 'Auto Active'}
            </div>
            <div className="text-xs text-nitro-muted font-mono mt-1">
              {fan2?.current_rpm ? 'Rotations Per Minute (RPM)' : fan2?.status || 'Tachometer Active'}
            </div>
          </div>

          <div className="text-xs text-nitro-muted flex items-center justify-between font-mono pt-1">
            <span>Operating Mode:</span>
            <span className="text-white font-semibold">{fan2?.mode || 'Automatic'}</span>
          </div>
        </div>
      </div>

      {/* Control Actions & Safety Verification */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-5">
        <div>
          <h3 className="font-heading font-bold text-base text-white">
            Fan Operation Modes
          </h3>
          <p className="text-xs text-nitro-muted mt-0.5">
            Verified hardware mode switching via Acer ACPI Gaming interface
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setFanMode('Auto')}
            disabled={!isSupported && !isPermissionDenied}
            className="p-5 bg-nitro-bg hover:bg-nitro-cardHover border border-nitro-border rounded-xl text-left space-y-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-white text-sm">
                Automatic Mode
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-nitro-muted leading-relaxed">
              Firmware dynamic thermal regulation. Restores safe OEM cooling profile.
            </p>
          </button>

          <button
            onClick={() => setFanMode('Max')}
            disabled={!isSupported && !isPermissionDenied}
            className="p-5 bg-nitro-bg hover:bg-nitro-red/10 border border-nitro-border hover:border-nitro-red/50 rounded-xl text-left space-y-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-nitro-glow"
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-white text-sm">
                Maximum Cooling
              </span>
              <Flame className="w-4 h-4 text-nitro-red" />
            </div>
            <p className="text-xs text-nitro-muted leading-relaxed">
              Forces peak RPM across all blower fans for intense gaming and rendering workloads.
            </p>
          </button>

          <button
            onClick={() => setFanMode('Custom')}
            disabled={!isSupported && !isPermissionDenied}
            className="p-5 bg-nitro-bg hover:bg-nitro-cardHover border border-nitro-border rounded-xl text-left space-y-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-white text-sm">
                Custom Manual Mode
              </span>
              <Fan className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs text-nitro-muted leading-relaxed">
              Applies manual fan curve speeds if safely validated by laptop firmware.
            </p>
          </button>
        </div>

        {/* Acer CoolBoost Section */}
        <div className="pt-4 border-t border-nitro-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-bold text-sm text-white">
                Acer CoolBoost™ Technology
              </h4>
              {coolboostCap && <CapabilityBadge status={coolboostCap.status} />}
            </div>
            <p className="text-xs text-nitro-muted">
              Dynamically boosts fan speeds by up to 10% when system detects extreme CPU/GPU loads.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleCoolBoost(true)}
              className="px-4 py-2 rounded-lg bg-nitro-bg hover:bg-nitro-cardHover border border-nitro-border text-xs font-semibold text-white transition-all active:scale-95"
            >
              Enable CoolBoost
            </button>
            <button
              onClick={() => toggleCoolBoost(false)}
              className="px-4 py-2 rounded-lg bg-nitro-bg hover:bg-nitro-cardHover border border-nitro-border text-xs font-semibold text-nitro-muted hover:text-white transition-all active:scale-95"
            >
              Disable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
