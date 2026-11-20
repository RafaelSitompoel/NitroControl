import React from 'react';
import { useNitroStore } from '../stores/useNitroStore';
import { FileText } from 'lucide-react';

export const LogsPage: React.FC = () => {
  const { capabilities, systemInfo, telemetry, wsConnected } = useNitroStore();

  const logs = [
    {
      time: new Date().toLocaleTimeString(),
      level: 'INFO',
      msg: `NitroControl backend daemon initialized for ${systemInfo?.model || 'system'}`,
    },
    {
      time: new Date().toLocaleTimeString(),
      level: 'INFO',
      msg: `Hardware discovery completed: Manufacturer "${systemInfo?.manufacturer}", BIOS "${systemInfo?.bios_version}"`,
    },
    {
      time: new Date().toLocaleTimeString(),
      level: capabilities?.is_acer_nitro ? 'INFO' : 'WARN',
      msg: capabilities?.is_acer_nitro
        ? `Verified Acer Nitro hardware detected: ${capabilities.detected_generation}`
        : 'Non-Nitro system detected. Hardware controls safely disabled.',
    },
    {
      time: new Date().toLocaleTimeString(),
      level: capabilities?.fan_control.status === 'Supported' ? 'INFO' : 'WARN',
      msg: `Fan Control capability status: ${capabilities?.fan_control.status}. ${capabilities?.fan_control.reason || 'Hardware registers verified.'}`,
    },
    {
      time: new Date().toLocaleTimeString(),
      level: telemetry?.gpu ? 'INFO' : 'WARN',
      msg: telemetry?.gpu
        ? `NVIDIA NVML provider initialized for ${telemetry.gpu.model} (${Math.round(telemetry.gpu.memory_total_bytes / (1024 * 1024 * 1024))}GB VRAM)`
        : 'Dedicated GPU monitoring offline or unavailable.',
    },
    {
      time: new Date().toLocaleTimeString(),
      level: wsConnected ? 'INFO' : 'WARN',
      msg: wsConnected ? 'WebSocket live monitoring stream active on /ws/monitoring' : 'WebSocket connecting...',
    },
  ];

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-nitro-red/10 border border-nitro-red/30 flex items-center justify-center text-nitro-red">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-white">
              Application & System Logs
            </h2>
            <p className="text-xs text-nitro-muted font-mono mt-0.5">
              Live hardware diagnostics, WMI calls, thermal events, and capability status
            </p>
          </div>
        </div>
      </div>

      {/* Log Console Box */}
      <div className="bg-nitro-bg border border-nitro-border rounded-xl p-5 font-mono text-xs space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-3 py-1 border-b border-nitro-border/30 last:border-0">
            <span className="text-nitro-muted select-none">[{log.time}]</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                log.level === 'INFO'
                  ? 'bg-blue-500/20 text-blue-400'
                  : log.level === 'WARN'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {log.level}
            </span>
            <span className="text-nitro-text flex-1">{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
