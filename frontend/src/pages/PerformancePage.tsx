import React, { useEffect, useState } from 'react';
import { useNitroStore } from '../stores/useNitroStore';
import { CapabilityBadge } from '../components/CapabilityBadge';
import { Zap, Shield, Flame, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../api/client';

export const PerformancePage: React.FC = () => {
  const { setPowerMode } = useNitroStore();
  const [schemesData, setSchemesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadSchemes = async () => {
    try {
      const data = await api.getPerformanceSchemes();
      setSchemesData(data);
    } catch (e) {
      console.error('Failed to load performance schemes:', e);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  const handleApply = async (mode: string) => {
    setLoading(true);
    await setPowerMode(mode);
    await loadSchemes();
    setLoading(false);
  };

  const activeScheme = schemesData?.active_scheme;
  const available = schemesData?.available_schemes || [];

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Current Active Scheme Card */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-nitro-red/10 border border-nitro-red/30 flex items-center justify-center text-nitro-red">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-heading font-bold text-white">
                {activeScheme?.name || 'Windows Power Configuration'}
              </h2>
              <CapabilityBadge status="Supported" />
            </div>
            <p className="text-xs text-nitro-muted font-mono mt-1">
              GUID: {activeScheme?.guid || 'Detecting active scheme...'}
            </p>
          </div>
        </div>

        <button
          onClick={loadSchemes}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-nitro-bg hover:bg-nitro-cardHover border border-nitro-border text-xs font-mono text-nitro-muted hover:text-white transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Scheme</span>
        </button>
      </div>

      {/* Power Modes Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Quiet Mode */}
        <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white">
              Quiet / Power Saver
            </h3>
            <p className="text-xs text-nitro-muted leading-relaxed">
              Throttles background task consumption, minimizes heat output, and enforces whisper-quiet fan speeds. Ideal for battery longevity and study environments.
            </p>
          </div>
          <button
            onClick={() => handleApply('quiet')}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-nitro-bg hover:bg-nitro-cardHover border border-nitro-border text-xs font-semibold text-white transition-all active:scale-95"
          >
            Activate Quiet Plan
          </button>
        </div>

        {/* Balanced Mode */}
        <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white">
              Balanced (Recommended)
            </h3>
            <p className="text-xs text-nitro-muted leading-relaxed">
              Standard Windows OEM balanced profile. Dynamic frequency scaling and energy-efficient performance for everyday productivity, coding, and web browsing.
            </p>
          </div>
          <button
            onClick={() => handleApply('balanced')}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-nitro-bg hover:bg-nitro-cardHover border border-nitro-border text-xs font-semibold text-white transition-all active:scale-95"
          >
            Activate Balanced Plan
          </button>
        </div>

        {/* High Performance Mode */}
        <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-nitro-red/10 border border-nitro-red/30 flex items-center justify-center text-nitro-red">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white">
              Maximum Performance
            </h3>
            <p className="text-xs text-nitro-muted leading-relaxed">
              Unlocks maximum CPU burst clocks, minimizes power gating latency, and maximizes PCIe bandwidth for competitive gaming and 3D rendering.
            </p>
          </div>
          <button
            onClick={() => handleApply('performance')}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-nitro-red hover:bg-nitro-redDark text-white text-xs font-semibold shadow-nitro-glow transition-all active:scale-95"
          >
            Activate Performance Plan
          </button>
        </div>
      </div>

      {/* Available Windows Power Schemes List */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-3">
        <h3 className="font-heading font-bold text-sm text-white">
          Installed Windows Power Schemes
        </h3>
        <div className="space-y-2">
          {available.map((scheme: any) => (
            <div
              key={scheme.guid}
              className={`p-3.5 rounded-lg border flex items-center justify-between text-xs font-mono ${
                scheme.is_active
                  ? 'bg-nitro-red/10 border-nitro-red/40 text-white'
                  : 'bg-nitro-bg border-nitro-border text-nitro-muted'
              }`}
            >
              <div>
                <span className="font-sans font-semibold text-white mr-2">
                  {scheme.name}
                </span>
                <span className="opacity-75">{scheme.guid}</span>
              </div>
              {scheme.is_active && (
                <span className="px-2 py-0.5 rounded bg-nitro-red text-white text-[10px] font-bold tracking-wider uppercase font-sans">
                  Active
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
