import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Fan,
  Zap,
  Sliders,
  Layers,
  Cpu,
  FileText,
  Settings,
  Info,
} from 'lucide-react';
import { useNitroStore } from '../stores/useNitroStore';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, capabilities, systemInfo, wsConnected } =
    useNitroStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitor', label: 'System Monitor', icon: Activity },
    { id: 'fans', label: 'Fan Control', icon: Fan },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'curves', label: 'Fan Curves', icon: Sliders },
    { id: 'profiles', label: 'Profiles', icon: Layers },
    { id: 'hardware', label: 'Hardware Info', icon: Cpu },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <aside className="w-64 bg-nitro-card border-r border-nitro-border flex flex-col h-screen select-none">
      {/* Brand Logo & Name */}
      <div className="p-5 border-b border-nitro-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-nitro-red to-nitro-redDark flex items-center justify-center shadow-nitro-glow">
            <span className="font-heading text-lg font-bold text-white tracking-wider">
              NC
            </span>
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg text-white leading-tight">
              NITRO<span className="text-nitro-red">CONTROL</span>
            </h1>
            <p className="text-[10px] text-nitro-muted uppercase tracking-wider font-mono">
              Acer Hardware Engine
            </p>
          </div>
        </div>
      </div>

      {/* Model detection badge */}
      <div className="px-4 py-2.5 bg-nitro-bg/60 border-b border-nitro-border/60">
        <div className="text-[11px] text-nitro-muted flex items-center justify-between">
          <span className="truncate font-mono">
            {systemInfo?.model || 'Detecting...'}
          </span>
          {capabilities?.is_acer_nitro && (
            <span className="text-[10px] text-nitro-red bg-nitro-red/10 px-1.5 py-0.5 rounded border border-nitro-red/20 font-bold">
              {capabilities.detected_generation || 'NITRO'}
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-nitro-red text-white shadow-nitro-glow'
                  : 'text-nitro-muted hover:text-white hover:bg-nitro-cardHover'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Connection & Telemetry Status Footer */}
      <div className="p-4 border-t border-nitro-border bg-nitro-card/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-nitro-muted">Live Stream</span>
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
              }`}
            />
            <span className={wsConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {wsConnected ? 'Connected' : 'Offline'}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
};
