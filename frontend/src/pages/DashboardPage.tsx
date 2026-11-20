import React from 'react';
import { useNitroStore } from '../stores/useNitroStore';
import { StatCard } from '../components/StatCard';
import { CapabilityBadge } from '../components/CapabilityBadge';
import {
  Cpu,
  MonitorDot,
  HardDrive,
  Fan,
  Flame,
  Zap,
  ShieldAlert,
  Clock,
  Laptop,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    telemetry,
    capabilities,
    systemInfo,
    setFanMode,
    toggleCoolBoost,
    setPowerMode,
    requestElevation,
    activeFanMode,
    activePowerMode,
    coolboostEnabled,
    setActiveTab,
  } = useNitroStore();

  const cpu = telemetry?.cpu;
  const gpu = telemetry?.gpu;
  const ram = telemetry?.ram;
  const fans = telemetry?.fans || [];
  const fan1 = fans[0];
  const fan2 = fans[1];

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 GB';
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatUptime = (secs?: number) => {
    if (!secs) return '0m';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Top Banner / System Summary */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-nitro-red/10 border border-nitro-red/30 flex items-center justify-center text-nitro-red">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-heading font-bold text-white">
                {systemInfo?.model || 'Acer Gaming System'}
              </h2>
              {capabilities && (
                <CapabilityBadge status={capabilities.is_acer_nitro ? 'Supported' : 'Unsupported'} />
              )}
            </div>
            <p className="text-xs text-nitro-muted font-mono mt-0.5">
              {systemInfo?.manufacturer} • BIOS: {systemInfo?.bios_version} • OS: {systemInfo?.os_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-nitro-bg px-3.5 py-2 rounded-lg border border-nitro-border text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-nitro-muted" />
            <span className="text-nitro-muted">Uptime:</span>
            <span className="text-white font-medium">
              {formatUptime(systemInfo?.uptime_secs)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Hardware Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CPU Stat Card */}
        <StatCard
          title="CPU Usage"
          value={cpu ? Math.round(cpu.usage_percent) : 0}
          unit="%"
          subtitle={`${cpu?.model || 'Detecting...'} (${cpu?.cores_physical || 0}C / ${cpu?.threads_logical || 0}T @ ${cpu?.frequency_mhz || 0} MHz)`}
          icon={Cpu}
          accentColor="red"
          progressPercent={cpu?.usage_percent}
          source={cpu?.source}
          onClick={() => setActiveTab('monitor')}
          badge={
            capabilities && (
              <CapabilityBadge status={capabilities.cpu_monitoring.status} showText={false} />
            )
          }
        />

        {/* CPU Temperature Card */}
        <StatCard
          title="CPU Temperature"
          value={
            cpu?.temperature_celsius !== undefined && cpu.temperature_celsius !== null
              ? Math.round(cpu.temperature_celsius)
              : 'N/A'
          }
          unit={cpu?.temperature_celsius ? '°C' : ''}
          subtitle={
            cpu?.temperature_celsius
              ? 'ACPI ThermalZone Active'
              : 'Requires elevated hardware sensor provider'
          }
          icon={Flame}
          accentColor={
            (cpu?.temperature_celsius || 0) > 85
              ? 'red'
              : (cpu?.temperature_celsius || 0) > 70
              ? 'amber'
              : 'emerald'
          }
          progressPercent={cpu?.temperature_celsius ? (cpu.temperature_celsius / 105) * 100 : 0}
          source="Windows ACPI / Kernel Sensors"
          onClick={() => setActiveTab('monitor')}
        />

        {/* GPU Stat Card */}
        <StatCard
          title="GPU Usage"
          value={
            gpu?.usage_percent !== undefined && gpu.usage_percent !== null
              ? Math.round(gpu.usage_percent)
              : 'N/A'
          }
          unit={gpu?.usage_percent !== undefined ? '%' : ''}
          subtitle={`${gpu?.model || 'NVIDIA Dedicated GPU'} (${formatBytes(gpu?.memory_used_bytes)} / ${formatBytes(gpu?.memory_total_bytes)} VRAM)`}
          icon={MonitorDot}
          accentColor="emerald"
          progressPercent={gpu?.usage_percent || 0}
          source={gpu?.source || 'NVIDIA NVML'}
          onClick={() => setActiveTab('monitor')}
          badge={
            capabilities && (
              <CapabilityBadge status={capabilities.gpu_monitoring.status} showText={false} />
            )
          }
        />

        {/* GPU Temperature Card */}
        <StatCard
          title="GPU Temperature"
          value={
            gpu?.temperature_celsius !== undefined && gpu.temperature_celsius !== null
              ? Math.round(gpu.temperature_celsius)
              : 'N/A'
          }
          unit={gpu?.temperature_celsius !== undefined ? '°C' : ''}
          subtitle={
            gpu
              ? `Core Clock: ${gpu.frequency_mhz || 0} MHz | Power: ${gpu.power_watts ? Math.round(gpu.power_watts) : 'N/A'}W / ${gpu.power_limit_watts ? Math.round(gpu.power_limit_watts) : 'N/A'}W`
              : 'GPU Offline / Power Managed'
          }
          icon={Flame}
          accentColor={
            (gpu?.temperature_celsius || 0) > 80
              ? 'red'
              : (gpu?.temperature_celsius || 0) > 65
              ? 'amber'
              : 'emerald'
          }
          progressPercent={gpu?.temperature_celsius ? (gpu.temperature_celsius / 95) * 100 : 0}
          source="NVIDIA NVML (nvidia-smi)"
          onClick={() => setActiveTab('monitor')}
        />
      </div>

      {/* Second Row: RAM & Fans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* RAM Stat Card */}
        <StatCard
          title="System Memory"
          value={ram ? Math.round(ram.usage_percent) : 0}
          unit="%"
          subtitle={`${formatBytes(ram?.used_bytes)} used of ${formatBytes(ram?.total_bytes)} (${formatBytes(ram?.available_bytes)} free)`}
          icon={HardDrive}
          accentColor="blue"
          progressPercent={ram?.usage_percent}
          source={ram?.source}
          badge={
            capabilities && (
              <CapabilityBadge status={capabilities.ram_monitoring.status} showText={false} />
            )
          }
        />

        {/* CPU Fan Card */}
        <StatCard
          title="Fan 1 (CPU)"
          value={fan1?.current_rpm ? fan1.current_rpm : 'Active'}
          unit={fan1?.current_rpm ? 'RPM' : ''}
          subtitle={`Status: ${fan1?.status || 'Auto Mode'}`}
          icon={Fan}
          accentColor="red"
          source={fan1?.source || 'Acer Gaming WMI'}
          onClick={() => setActiveTab('fans')}
          badge={
            capabilities && (
              <CapabilityBadge status={capabilities.fan_control.status} />
            )
          }
        />

        {/* GPU Fan Card */}
        <StatCard
          title="Fan 2 (GPU)"
          value={fan2?.current_rpm ? fan2.current_rpm : 'Active'}
          unit={fan2?.current_rpm ? 'RPM' : ''}
          subtitle={`Status: ${fan2?.status || 'Auto Mode'}`}
          icon={Fan}
          accentColor="red"
          source={fan2?.source || 'Acer Gaming WMI'}
          onClick={() => setActiveTab('fans')}
          badge={
            capabilities && (
              <CapabilityBadge status={capabilities.fan_control.status} />
            )
          }
        />
      </div>

      {/* Hardware Control Strip */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-nitro-red" />
            <h3 className="font-heading font-bold text-base text-white">
              Hardware Control Deck
            </h3>
          </div>
          {capabilities?.fan_control.status === 'PermissionDenied' && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/40">
              <ShieldAlert className="w-4 h-4" />
              <span>Run NitroControl as Administrator to control fans directly</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Fan Mode Controls */}
          <div className="p-4 bg-nitro-bg rounded-lg border border-nitro-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-nitro-muted font-mono uppercase">
                Fan Operating Mode
              </span>
              {capabilities && (
                <CapabilityBadge status={capabilities.fan_control.status} />
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFanMode('Auto')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeFanMode === 'Auto'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/50 font-bold'
                    : 'bg-nitro-card hover:bg-nitro-cardHover border-nitro-border text-white'
                }`}
              >
                {activeFanMode === 'Auto' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                <span>Auto</span>
              </button>
              <button
                onClick={() => setFanMode('Max')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeFanMode === 'Max'
                    ? 'bg-nitro-red border-red-500 text-white shadow-nitro-glow ring-1 ring-red-400/50 font-bold animate-pulse-subtle'
                    : 'bg-nitro-red/20 hover:bg-nitro-red/40 border-nitro-red/40 text-white'
                }`}
              >
                {activeFanMode === 'Max' && <Flame className="w-3.5 h-3.5 text-white animate-pulse" />}
                <span>Max Fans</span>
              </button>
              <button
                onClick={() => setFanMode('Custom')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeFanMode === 'Custom'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] ring-1 ring-blue-400/50 font-bold'
                    : 'bg-nitro-card hover:bg-nitro-cardHover border-nitro-border text-white'
                }`}
              >
                {activeFanMode === 'Custom' && <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />}
                <span>Custom</span>
              </button>
            </div>
            {capabilities?.fan_control.status === 'PermissionDenied' && (
              <button
                onClick={requestElevation}
                className="w-full py-1.5 px-3 mt-2 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Izinkan akses Administrator untuk mengontrol kecepatan kipas Acer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Buka Hak Akses Admin (Aktifkan Kipas)</span>
              </button>
            )}
          </div>

          {/* Windows Power Mode Controls */}
          <div className="p-4 bg-nitro-bg rounded-lg border border-nitro-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-nitro-muted font-mono uppercase">
                Windows Power Plan
              </span>
              <CapabilityBadge status="Supported" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPowerMode('quiet')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                  activePowerMode === 'quiet'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/50 font-bold'
                    : 'bg-nitro-card hover:bg-nitro-cardHover border-nitro-border text-white'
                }`}
              >
                Quiet
              </button>
              <button
                onClick={() => setPowerMode('balanced')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                  activePowerMode === 'balanced'
                    ? 'bg-blue-950/70 border-blue-500 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/50 font-bold'
                    : 'bg-nitro-card hover:bg-nitro-cardHover border-nitro-border text-white'
                }`}
              >
                Balanced
              </button>
              <button
                onClick={() => setPowerMode('performance')}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                  activePowerMode === 'performance'
                    ? 'bg-nitro-red border-red-500 text-white shadow-nitro-glow ring-1 ring-red-400/50 font-bold'
                    : 'bg-nitro-red/20 hover:bg-nitro-red/40 border-nitro-red/40 text-white'
                }`}
              >
                Performance
              </button>
            </div>
          </div>

          {/* CoolBoost Toggle */}
          <div className="p-4 bg-nitro-bg rounded-lg border border-nitro-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-nitro-muted font-mono uppercase">
                Acer CoolBoost
              </span>
              {capabilities && (
                <CapabilityBadge status={capabilities.coolboost.status} />
              )}
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-nitro-muted">
                Accelerate fan response on peak thermal load
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleCoolBoost(true)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                    coolboostEnabled
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400 font-bold'
                      : 'bg-nitro-card hover:bg-nitro-cardHover border-nitro-border text-nitro-muted hover:text-white'
                  }`}
                >
                  Enable
                </button>
                <button
                  onClick={() => toggleCoolBoost(false)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                    !coolboostEnabled
                      ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                      : 'bg-nitro-card hover:bg-nitro-cardHover border-nitro-border text-nitro-muted hover:text-white'
                  }`}
                >
                  Disable
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
