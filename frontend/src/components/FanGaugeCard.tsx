import React from 'react';

interface FanGaugeCardProps {
  title: string; // e.g. "CPU fan" or "GPU fan"
  rpm?: number | null;
  mode?: string; // e.g. "Auto", "Max", "Custom"
  percent?: number; // e.g. 0 - 100%
  statusText?: string; // e.g. "Auto + 100%" or "Auto (Firmware)"
  accentColor?: string; // e.g. "#f43f5e" or "#fb923c"
  onClick?: () => void;
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
  // Calculate display RPM and progress percent
  const displayRpm = rpm ? rpm.toLocaleString('id-ID') : mode === 'Max' ? '5 200' : '3 850';
  const effectivePercent =
    percent !== undefined
      ? percent
      : mode === 'Max'
      ? 100
      : rpm
      ? Math.min(100, Math.round((rpm / 5500) * 100))
      : 72;

  // Calculate dynamic spin speed
  let spinDuration = '0.9s';
  if (mode === 'Max' || effectivePercent >= 90) {
    spinDuration = '0.35s';
  } else if (effectivePercent >= 65) {
    spinDuration = '0.65s';
  } else if (effectivePercent >= 40) {
    spinDuration = '1.1s';
  } else {
    spinDuration = '1.8s';
  }

  // SVG circular gauge calculations (radius = 48)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (effectivePercent / 100) * circumference;

  // Generate 12 curved turbine blades for the fan
  const bladeCount = 12;
  const blades = Array.from({ length: bladeCount }, (_, i) => {
    const angle = (i * 360) / bladeCount;
    return (
      <path
        key={i}
        d="M50 50 Q 58 32, 50 14 Q 44 28, 50 50 Z"
        fill="url(#bladeGradient)"
        transform={`rotate(${angle} 50 50)`}
        opacity={0.9}
      />
    );
  });

  return (
    <div
      onClick={onClick}
      className={`bg-nitro-card border border-nitro-border hover:border-nitro-red/50 rounded-xl p-5 transition-all flex items-center justify-between select-none ${
        onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
      }`}
    >
      {/* Left side: RPM numbers & status */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-nitro-muted tracking-wider">
          {title}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-heading font-bold text-white tracking-tight">
            {displayRpm}
          </span>
          <span className="text-sm font-mono text-nitro-muted font-medium">rpm</span>
        </div>

        <div className="text-xs font-medium text-nitro-muted/90 flex items-center gap-1.5 font-mono">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <span>
            {statusText ||
              (mode === 'Max'
                ? 'Max • 100%'
                : mode === 'Custom'
                ? `Custom • ${effectivePercent}%`
                : `Auto • ${effectivePercent}%`)}
          </span>
        </div>
      </div>

      {/* Right side: Animated Rotating Turbine Blower Gauge */}
      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
        {/* Outer Circular Ring Progress Track */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
          {/* Background Track Circle */}
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth="3.5"
          />
          {/* Active Accent Colored Ring */}
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke={accentColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Inner Turbine Housing Well */}
        <div className="absolute w-20 h-20 rounded-full bg-zinc-950 border border-zinc-800 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
          {/* Rotating Blades */}
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            style={{
              animation: `spin ${spinDuration} linear infinite`,
            }}
          >
            <defs>
              <linearGradient id="bladeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>

            {/* Render 12 curved turbine blades */}
            {blades}

            {/* Inner Hub Circle */}
            <circle cx="50" cy="50" r="14" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            {/* Center Orange Accent Cap */}
            <circle cx="50" cy="50" r="7.5" fill={accentColor} />
            <circle cx="50" cy="50" r="3" fill="#ffffff" opacity={0.6} />
          </svg>
        </div>
      </div>
    </div>
  );
};
