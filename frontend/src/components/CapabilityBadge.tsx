import React from 'react';
import { CapabilityStatus } from '../types';

interface CapabilityBadgeProps {
  status: CapabilityStatus;
  showText?: boolean;
}

export const CapabilityBadge: React.FC<CapabilityBadgeProps> = ({
  status,
  showText = true,
}) => {
  const configs: Record<
    CapabilityStatus,
    { label: string; bg: string; text: string; dot: string }
  > = {
    Supported: {
      label: 'Supported',
      bg: 'bg-emerald-950/60 border-emerald-700/50',
      text: 'text-emerald-400',
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    },
    PermissionDenied: {
      label: 'Admin Required',
      bg: 'bg-amber-950/60 border-amber-700/50',
      text: 'text-amber-400',
      dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    },
    Unsupported: {
      label: 'Unsupported',
      bg: 'bg-rose-950/60 border-rose-800/50',
      text: 'text-rose-400',
      dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    },
    Unavailable: {
      label: 'Unavailable',
      bg: 'bg-zinc-900 border-zinc-700',
      text: 'text-zinc-400',
      dot: 'bg-zinc-500',
    },
    TemporarilyUnavailable: {
      label: 'Busy',
      bg: 'bg-orange-950/60 border-orange-700/50',
      text: 'text-orange-400',
      dot: 'bg-orange-500',
    },
    NotTested: {
      label: 'Untested',
      bg: 'bg-blue-950/60 border-blue-800/50',
      text: 'text-blue-400',
      dot: 'bg-blue-500',
    },
  };

  const c = configs[status] || configs.Unavailable;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text}`}
      title={`Capability status: ${c.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {showText && <span>{c.label}</span>}
    </span>
  );
};
