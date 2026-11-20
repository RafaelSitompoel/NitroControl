import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: 'red' | 'blue' | 'emerald' | 'amber';
  badge?: React.ReactNode;
  progressPercent?: number;
  source?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  accentColor = 'red',
  badge,
  progressPercent,
  source,
  onClick,
}) => {
  const colorMap = {
    red: {
      border: 'hover:border-nitro-red/50',
      iconBg: 'bg-nitro-red/10 text-nitro-red border-nitro-red/20',
      progress: 'bg-nitro-red',
    },
    blue: {
      border: 'hover:border-blue-500/50',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      progress: 'bg-blue-500',
    },
    emerald: {
      border: 'hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      progress: 'bg-emerald-500',
    },
    amber: {
      border: 'hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      progress: 'bg-amber-500',
    },
  };

  const c = colorMap[accentColor];

  return (
    <div
      onClick={onClick}
      className={`bg-nitro-card border border-nitro-border rounded-xl p-5 transition-all flex flex-col justify-between ${c.border} ${
        onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${c.iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-nitro-muted tracking-wider uppercase font-mono">
              {title}
            </span>
          </div>
          {badge}
        </div>

        <div className="flex items-baseline gap-1.5 my-2">
          <span className="text-3xl font-heading font-bold text-white tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-mono text-nitro-muted font-medium">
              {unit}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-nitro-muted truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      <div>
        {progressPercent !== undefined && (
          <div className="w-full bg-nitro-bg h-1.5 rounded-full overflow-hidden mt-3 border border-nitro-border/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${c.progress}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        )}

        {source && (
          <div className="mt-3 pt-2 border-t border-nitro-border/40 text-[10px] text-nitro-muted/70 font-mono truncate">
            Src: {source}
          </div>
        )}
      </div>
    </div>
  );
};
