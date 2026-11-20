import React, { useState } from 'react';
import { useNitroStore } from '../stores/useNitroStore';
import { CapabilityBadge } from '../components/CapabilityBadge';
import { Sliders, Plus, Trash2, Download, AlertCircle } from 'lucide-react';
import { FanCurvePoint } from '../types';

export const FanCurvesPage: React.FC = () => {
  const { capabilities } = useNitroStore();

  const [points, setPoints] = useState<FanCurvePoint[]>([
    { temp_c: 40, speed_percent: 20 },
    { temp_c: 55, speed_percent: 40 },
    { temp_c: 70, speed_percent: 70 },
    { temp_c: 85, speed_percent: 100 },
  ]);

  const profileName = 'Custom Curve';

  const addPoint = () => {
    if (points.length >= 8) return;
    const last = points[points.length - 1] || { temp_c: 50, speed_percent: 50 };
    setPoints([
      ...points,
      {
        temp_c: Math.min(100, last.temp_c + 10),
        speed_percent: Math.min(100, last.speed_percent + 15),
      },
    ]);
  };

  const removePoint = (index: number) => {
    if (points.length <= 2) return;
    setPoints(points.filter((_, i) => i !== index));
  };

  const updatePoint = (index: number, field: 'temp_c' | 'speed_percent', value: number) => {
    const updated = [...points];
    updated[index][field] = Math.max(0, Math.min(100, value));
    setPoints(updated);
  };

  const exportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ name: profileName, curve: points }, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `fancurve-${profileName.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Capability Notification */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-heading font-bold text-white">
                Fan Curve Designer
              </h2>
              {capabilities && <CapabilityBadge status={capabilities.fan_curves.status} />}
            </div>
            <p className="text-xs text-nitro-muted font-mono mt-0.5">
              Programmable temperature-to-speed PWM duty cycle profile mapping
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-nitro-bg hover:bg-nitro-cardHover border border-nitro-border text-xs font-medium text-white transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {capabilities?.fan_curves.status !== 'Supported' && (
        <div className="bg-zinc-900 border border-zinc-700/80 rounded-xl p-4 flex items-start gap-3 text-xs text-zinc-300">
          <AlertCircle className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
          <p>
            <span className="font-semibold text-white">Notice: </span>
            Custom curve visual editor is fully available for designing, testing, and saving curves. Direct hardware execution requires verified manual fan hardware control capability. Saved curves are safely preserved in your profile database without executing unsafe EC commands.
          </p>
        </div>
      )}

      {/* Interactive Curve Point Controls */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm text-white">
              Curve Profile Points ({points.length}/8)
            </h3>
            <p className="text-xs text-nitro-muted">
              Configure trigger temperature (°C) and target blower speed (%)
            </p>
          </div>
          <button
            onClick={addPoint}
            disabled={points.length >= 8}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-nitro-red/20 hover:bg-nitro-red text-white text-xs font-semibold border border-nitro-red/40 transition-all active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Point</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {points.map((pt, idx) => (
            <div
              key={idx}
              className="p-4 bg-nitro-bg rounded-lg border border-nitro-border space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-bold text-white">
                  Point #{idx + 1}
                </span>
                {points.length > 2 && (
                  <button
                    onClick={() => removePoint(idx)}
                    className="text-nitro-muted hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-nitro-muted font-mono">
                  <span>Temp:</span>
                  <span className="text-white font-bold">{pt.temp_c}°C</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={pt.temp_c}
                  onChange={(e) => updatePoint(idx, 'temp_c', Number(e.target.value))}
                  className="w-full accent-nitro-red h-1.5 bg-nitro-card rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-nitro-muted font-mono">
                  <span>Fan Speed:</span>
                  <span className="text-white font-bold">{pt.speed_percent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pt.speed_percent}
                  onChange={(e) => updatePoint(idx, 'speed_percent', Number(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-nitro-card rounded-lg cursor-pointer"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
