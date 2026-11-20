import React from 'react';
import { useNitroStore } from '../stores/useNitroStore';
import { CapabilityBadge } from '../components/CapabilityBadge';
import { Cpu, MonitorDot, ShieldCheck } from 'lucide-react';

export const HardwareInfoPage: React.FC = () => {
  const { systemInfo, capabilities, telemetry } = useNitroStore();

  const cpu = telemetry?.cpu;
  const gpu = telemetry?.gpu;

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Laptop & Motherboard Specs */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-nitro-red/10 border border-nitro-red/30 flex items-center justify-center text-nitro-red">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-white">
                Acer Device Platform
              </h2>
              <p className="text-xs text-nitro-muted font-mono">
                System identity, motherboard, and BIOS firmware verification
              </p>
            </div>
          </div>
          {capabilities && <CapabilityBadge status={capabilities.is_acer_nitro ? 'Supported' : 'Unsupported'} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs font-mono">
          <div className="p-3.5 bg-nitro-bg rounded-lg border border-nitro-border/70 space-y-1">
            <span className="text-nitro-muted text-[10px] uppercase font-sans">Laptop Model</span>
            <span className="text-white font-bold block text-sm">{systemInfo?.model || 'Detecting...'}</span>
          </div>
          <div className="p-3.5 bg-nitro-bg rounded-lg border border-nitro-border/70 space-y-1">
            <span className="text-nitro-muted text-[10px] uppercase font-sans">Manufacturer</span>
            <span className="text-white font-bold block text-sm">{systemInfo?.manufacturer || 'Detecting...'}</span>
          </div>
          <div className="p-3.5 bg-nitro-bg rounded-lg border border-nitro-border/70 space-y-1">
            <span className="text-nitro-muted text-[10px] uppercase font-sans">BIOS Version</span>
            <span className="text-white font-bold block text-sm">{systemInfo?.bios_version || 'Detecting...'}</span>
          </div>
          <div className="p-3.5 bg-nitro-bg rounded-lg border border-nitro-border/70 space-y-1">
            <span className="text-nitro-muted text-[10px] uppercase font-sans">Operating System</span>
            <span className="text-white font-bold block text-sm">{systemInfo?.os_name} {systemInfo?.os_version}</span>
          </div>
          <div className="p-3.5 bg-nitro-bg rounded-lg border border-nitro-border/70 space-y-1">
            <span className="text-nitro-muted text-[10px] uppercase font-sans">Acer Generation</span>
            <span className="text-nitro-red font-bold block text-sm">{capabilities?.detected_generation || 'Nitro Standard'}</span>
          </div>
          <div className="p-3.5 bg-nitro-bg rounded-lg border border-nitro-border/70 space-y-1">
            <span className="text-nitro-muted text-[10px] uppercase font-sans">Host Computer Name</span>
            <span className="text-white font-bold block text-sm">{systemInfo?.hostname || 'Localhost'}</span>
          </div>
        </div>
      </div>

      {/* CPU & GPU Hardware Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Detailed Card */}
        <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">Central Processing Unit</h3>
              <p className="text-xs text-nitro-muted font-mono">{cpu?.model || 'Detecting...'}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs font-mono pt-2">
            <div className="flex justify-between py-1.5 border-b border-nitro-border/50">
              <span className="text-nitro-muted">Physical Cores:</span>
              <span className="text-white font-semibold">{cpu?.cores_physical || 0} Cores</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-nitro-border/50">
              <span className="text-nitro-muted">Logical Threads:</span>
              <span className="text-white font-semibold">{cpu?.threads_logical || 0} Threads</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-nitro-border/50">
              <span className="text-nitro-muted">Base Frequency:</span>
              <span className="text-white font-semibold">{cpu?.frequency_mhz || 0} MHz</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-nitro-muted">Sensor Provider:</span>
              <span className="text-white font-semibold">{cpu?.source}</span>
            </div>
          </div>
        </div>

        {/* GPU Detailed Card */}
        <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MonitorDot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">Graphics Processing Unit</h3>
              <p className="text-xs text-nitro-muted font-mono">{gpu?.model || 'NVIDIA Dedicated GPU'}</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs font-mono pt-2">
            <div className="flex justify-between py-1.5 border-b border-nitro-border/50">
              <span className="text-nitro-muted">GPU Architecture:</span>
              <span className="text-white font-semibold">{gpu?.vendor || 'NVIDIA'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-nitro-border/50">
              <span className="text-nitro-muted">VRAM Total Capacity:</span>
              <span className="text-white font-semibold">{formatBytes(gpu?.memory_total_bytes)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-nitro-border/50">
              <span className="text-nitro-muted">Thermal Power Limit:</span>
              <span className="text-white font-semibold">
                {gpu?.power_limit_watts ? `${Math.round(gpu.power_limit_watts)} Watts TGP` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-nitro-muted">Driver Interface:</span>
              <span className="text-white font-semibold">{gpu?.source || 'NVML / nvidia-smi'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
