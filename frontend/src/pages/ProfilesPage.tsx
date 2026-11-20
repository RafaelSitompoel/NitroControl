import React from 'react';
import { useNitroStore } from '../stores/useNitroStore';
import { Layers, CheckCircle, Shield, Zap, Flame, Sliders } from 'lucide-react';

export const ProfilesPage: React.FC = () => {
  const { profiles, activateProfile } = useNitroStore();

  const getProfileIcon = (id: string) => {
    switch (id) {
      case 'silent':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'balanced':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'gaming':
        return <Zap className="w-5 h-5 text-nitro-red" />;
      case 'max_cooling':
        return <Flame className="w-5 h-5 text-nitro-red" />;
      default:
        return <Sliders className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-nitro-red/10 border border-nitro-red/30 flex items-center justify-center text-nitro-red">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-white">
              Hardware Profile Management
            </h2>
            <p className="text-xs text-nitro-muted font-mono mt-0.5">
              Coordinated power plans, fan modes, polling intervals, and thermal policies
            </p>
          </div>
        </div>
      </div>

      {/* Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`p-6 rounded-xl border transition-all flex flex-col justify-between ${
              profile.is_active
                ? 'bg-nitro-card border-nitro-red/50 shadow-nitro-glow'
                : 'bg-nitro-card border-nitro-border hover:border-nitro-borderLight'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-nitro-bg flex items-center justify-center border border-nitro-border">
                    {getProfileIcon(profile.id)}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-white">
                      {profile.name}
                    </h3>
                    <span className="text-[10px] text-nitro-muted font-mono uppercase">
                      {profile.is_builtin ? 'Built-in Profile' : 'Custom Profile'}
                    </span>
                  </div>
                </div>

                {profile.is_active && (
                  <span className="px-2.5 py-1 rounded bg-nitro-red text-white text-xs font-bold font-mono tracking-wider uppercase">
                    Active
                  </span>
                )}
              </div>

              <p className="text-xs text-nitro-muted leading-relaxed">
                {profile.description || 'Configured hardware cooling and performance preset.'}
              </p>

              <div className="pt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-nitro-bg p-2 rounded border border-nitro-border/60">
                  <span className="text-nitro-muted block text-[10px]">Power Plan:</span>
                  <span className="text-white font-semibold uppercase">{profile.power_mode}</span>
                </div>
                <div className="bg-nitro-bg p-2 rounded border border-nitro-border/60">
                  <span className="text-nitro-muted block text-[10px]">Fan Mode:</span>
                  <span className="text-white font-semibold uppercase">{profile.fan_mode}</span>
                </div>
                <div className="bg-nitro-bg p-2 rounded border border-nitro-border/60">
                  <span className="text-nitro-muted block text-[10px]">CoolBoost:</span>
                  <span className="text-white font-semibold">
                    {profile.coolboost_enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <div className="bg-nitro-bg p-2 rounded border border-nitro-border/60">
                  <span className="text-nitro-muted block text-[10px]">Telemetry Polling:</span>
                  <span className="text-white font-semibold">{profile.refresh_rate_ms}ms</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-nitro-border/60 flex items-center justify-between">
              {!profile.is_active ? (
                <button
                  onClick={() => activateProfile(profile.id)}
                  className="w-full py-2 rounded-lg bg-nitro-red/20 hover:bg-nitro-red text-white text-xs font-semibold border border-nitro-red/40 transition-all active:scale-95 shadow-nitro-glow"
                >
                  Activate Profile
                </button>
              ) : (
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Currently applied to hardware
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
