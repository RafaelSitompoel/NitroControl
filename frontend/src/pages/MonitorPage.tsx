import React from 'react';
import { useNitroStore } from '../stores/useNitroStore';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Download, Trash2, Activity } from 'lucide-react';
import { api } from '../api/client';

export const MonitorPage: React.FC = () => {
  const { history, historyRange, setHistoryRange, clearHistory } = useNitroStore();

  const handleExportCsv = async () => {
    try {
      const blob = await api.exportHistoryCsv(historyRange);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nitrocontrol-telemetry-${historyRange}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export CSV:', e);
    }
  };

  const chartData = history.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    cpuUsage: Math.round(item.cpu_usage),
    gpuUsage: item.gpu_usage !== undefined && item.gpu_usage !== null ? Math.round(item.gpu_usage) : 0,
    ramUsage: Math.round(item.ram_usage),
    cpuTemp: item.cpu_temp ? Math.round(item.cpu_temp) : 0,
    gpuTemp: item.gpu_temp ? Math.round(item.gpu_temp) : 0,
  }));

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-nitro-card border border-nitro-border p-6 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-nitro-red/10 border border-nitro-red/30 flex items-center justify-center text-nitro-red">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-white">
              System Telemetry Monitor
            </h2>
            <p className="text-xs text-nitro-muted font-mono">
              Continuous SQLite hardware sensor logging & historical trends
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Range Buttons */}
          <div className="flex items-center bg-nitro-bg p-1 rounded-lg border border-nitro-border text-xs">
            {['5m', '30m', '1h', '24h'].map((r) => (
              <button
                key={r}
                onClick={() => setHistoryRange(r)}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  historyRange === r
                    ? 'bg-nitro-red text-white shadow-nitro-glow'
                    : 'text-nitro-muted hover:text-white'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-nitro-bg hover:bg-nitro-cardHover border border-nitro-border text-xs font-medium text-white transition-all active:scale-95"
            title="Export CSV telemetry"
          >
            <Download className="w-3.5 h-3.5 text-nitro-red" />
            <span>Export CSV</span>
          </button>

          {/* Clear History */}
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-nitro-bg hover:bg-rose-950/40 border border-nitro-border hover:border-rose-800/40 text-xs font-medium text-rose-400 transition-all active:scale-95"
            title="Clear database records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Utilization History Chart */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-nitro-red" />
            <span>Processor & Memory Utilization (%)</span>
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-nitro-red">
              <span className="w-2.5 h-2.5 rounded-sm bg-nitro-red" /> CPU
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> GPU
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> RAM
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff2e3b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff2e3b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="gpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232734" />
                <XAxis dataKey="time" stroke="#8b92a5" fontSize={11} tickLine={false} />
                <YAxis stroke="#8b92a5" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12141a',
                    borderColor: '#232734',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="cpuUsage" stroke="#ff2e3b" fill="url(#cpuGradient)" strokeWidth={2} name="CPU Usage (%)" />
                <Area type="monotone" dataKey="gpuUsage" stroke="#10b981" fill="url(#gpuGradient)" strokeWidth={2} name="GPU Usage (%)" />
                <Area type="monotone" dataKey="ramUsage" stroke="#3b82f6" fill="url(#ramGradient)" strokeWidth={1.5} strokeDasharray="3 3" name="RAM Usage (%)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-nitro-muted font-mono">
              Recording live hardware measurements to SQLite database...
            </div>
          )}
        </div>
      </div>

      {/* Temperature History Chart */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Thermal History (°C)</span>
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> CPU Temp
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> GPU Temp
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="cpuTempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="gpuTempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232734" />
                <XAxis dataKey="time" stroke="#8b92a5" fontSize={11} tickLine={false} />
                <YAxis stroke="#8b92a5" fontSize={11} domain={[30, 100]} unit="°C" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12141a',
                    borderColor: '#232734',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Area type="monotone" dataKey="cpuTemp" stroke="#f59e0b" fill="url(#cpuTempGradient)" strokeWidth={2} name="CPU Temp (°C)" />
                <Area type="monotone" dataKey="gpuTemp" stroke="#10b981" fill="url(#gpuTempGradient)" strokeWidth={2} name="GPU Temp (°C)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-nitro-muted font-mono">
              Waiting for thermal history data points...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
