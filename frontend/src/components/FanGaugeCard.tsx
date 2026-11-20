import React from 'react';

interface FanGaugeCardProps {
  title: string;
  rpm?: number | null;
  mode?: string;          // 'Auto' | 'Max' | 'Custom'
  percent?: number;       // 0–100, overrides auto-computed value
  statusText?: string;
  accentColor?: string;
  onClick?: () => void;
}

/** Map effective fan percent → CSS animation class */
function spinClass(mode: string, pct: number): string {
  if (mode === 'Max' || pct >= 95) return 'fan-turbo';
  if (pct >= 80)                   return 'fan-max';
  if (pct >= 60)                   return 'fan-high';
  if (pct >= 40)                   return 'fan-normal';
  if (pct >= 20)                   return 'fan-low';
  return 'fan-idle';
}

export const FanGaugeCard: React.FC<FanGaugeCardProps> = ({
  title,
  rpm,
  mode = 'Auto',
  percent,
  statusText,
  accentColor = '#f43f5e',
  onClick,
}) => {
  /* ── 1. Derive effective percent ──────────────────────────── */
  const effectivePercent =
    percent !== undefined
      ? percent
      : mode === 'Max'
      ? 100
      : rpm
      ? Math.min(100, Math.round((rpm / 5500) * 100))
      : mode === 'Auto' ? 65 : 50;   // sensible visual fallback

  /* ── 2. Display RPM (real value or mode-based estimate) ───── */
  const hasRealRpm = rpm !== null && rpm !== undefined && rpm > 0;
  const displayRpm = hasRealRpm
    ? rpm!.toLocaleString('id-ID')
    : mode === 'Max'
    ? '5.200'
    : mode === 'Auto'
    ? '3.850'
    : '2.400';

  /* ── 3. Fan spin CSS class (always animates) ──────────────── */
  const fanClass = spinClass(mode, effectivePercent);

  /* ── 4. Circular gauge math ───────────────────────────────── */
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (effectivePercent / 100) * circumference;

  /* ── 5. Build 12 curved turbine blades ───────────────────── */
  const blades = Array.from({ length: 12 }, (_, i) => (
    <path
      key={i}
      d="M50 50 Q 58 32, 50 14 Q 44 28, 50 50 Z"
      fill="url(#bladeGrad)"
      transform={`rotate(${(i * 360) / 12} 50 50)`}
      opacity={0.9}
    />
  ));

  /* ── 6. Status line ───────────────────────────────────────── */
  const resolvedStatus =
    statusText ||
    (mode === 'Max'
      ? `Max • 100%`
      : mode === 'Custom'
      ? `Custom • ${effectivePercent}%`
      : `Auto • ${effectivePercent}%`);

  return (
    <div
      onClick={onClick}
      className={`bg-nitro-card border border-nitro-border hover:border-nitro-red/50
        rounded-xl p-5 transition-all flex items-center justify-between select-none
        ${onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''}`}
    >
      {/* ── Left: numbers & status ─────────────────────────── */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-nitro-muted tracking-wider uppercase">
          {title}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-heading font-bold text-white tracking-tight">
            {displayRpm}
          </span>
          <span className="text-sm font-mono text-nitro-muted font-medium">rpm</span>
          {!hasRealRpm && (
            <span className="text-[10px] font-mono text-nitro-muted/60 italic">est.</span>
          )}
        </div>

        <div className="text-xs font-medium text-nitro-muted/90 flex items-center gap-1.5 font-mono">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span>{resolvedStatus}</span>
        </div>
      </div>

      {/* ── Right: animated turbine gauge ─────────────────── */}
      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">

        {/* Circular ring progress track */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
          <circle
            cx="55" cy="55" r={radius}
            fill="none" stroke="#27272a" strokeWidth="3.5"
          />
          <circle
            cx="55" cy="55" r={radius}
            fill="none"
            stroke={accentColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Inner housing well */}
        <div className="absolute w-20 h-20 rounded-full bg-zinc-950 border border-zinc-800
          shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">

          {/* ★ Rotating blades — uses CSS class defined in index.css ★ */}
          <svg
            className={`w-full h-full ${fanClass}`}
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#e2e8f0" />
                <stop offset="50%"  stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>

            {blades}

            {/* Hub */}
            <circle cx="50" cy="50" r="14" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            {/* Accent cap */}
            <circle cx="50" cy="50" r="7.5" fill={accentColor} />
            {/* Glint */}
            <circle cx="50" cy="50" r="3" fill="#ffffff" opacity={0.55} />
          </svg>
        </div>
      </div>
    </div>
  );
};
