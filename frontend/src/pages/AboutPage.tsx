import React from 'react';
import { Shield } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Brand Hero */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-8 flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nitro-red to-nitro-redDark flex items-center justify-center shadow-nitro-glow-lg">
          <span className="font-heading text-3xl font-bold text-white tracking-wider">
            NC
          </span>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-heading font-bold text-white">
            NitroControl <span className="text-nitro-red">v0.1.0</span>
          </h2>
          <p className="text-xs text-nitro-muted max-w-md mx-auto">
            Open-Source, Lightweight, Genuine Hardware Alternative to Acer NitroSense for Windows 10 & 11
          </p>
        </div>
      </div>

      {/* Independent Project Disclaimer */}
      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-6 space-y-2 text-xs text-amber-200">
        <div className="flex items-center gap-2 font-heading font-bold text-sm text-amber-300">
          <Shield className="w-4 h-4" />
          <span>Independent Community Project & Disclaimer</span>
        </div>
        <p className="leading-relaxed opacity-90 font-sans">
          NitroControl is an independent, open-source community software project released under the MIT License. NitroControl is NOT affiliated with, sponsored by, or endorsed by Acer Inc. "Acer", "Nitro", "NitroSense", and "CoolBoost" are trademarks or registered trademarks of Acer Inc. All hardware control operations interact strictly via documented Windows and ACPI WMI BIOS interfaces. NitroControl never executes arbitrary or unsafe embedded controller (EC) memory register modifications.
        </p>
      </div>

      {/* Hardware Target Matrix */}
      <div className="bg-nitro-card border border-nitro-border rounded-xl p-6 space-y-3">
        <h3 className="font-heading font-bold text-sm text-white">
          Hardware Compatibility Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-nitro-bg rounded-lg border border-nitro-border space-y-1">
            <span className="text-white font-bold block">Acer Nitro V</span>
            <span className="text-emerald-400 text-[10px]">ANV15-51 (Verified)</span>
          </div>
          <div className="p-3 bg-nitro-bg rounded-lg border border-nitro-border space-y-1">
            <span className="text-white font-bold block">Acer Nitro 5</span>
            <span className="text-emerald-400 text-[10px]">AN515 / AN517</span>
          </div>
          <div className="p-3 bg-nitro-bg rounded-lg border border-nitro-border space-y-1">
            <span className="text-white font-bold block">Acer Nitro 16</span>
            <span className="text-blue-400 text-[10px]">AN16 Series</span>
          </div>
          <div className="p-3 bg-nitro-bg rounded-lg border border-nitro-border space-y-1">
            <span className="text-white font-bold block">Acer Nitro 17</span>
            <span className="text-blue-400 text-[10px]">AN17 Series</span>
          </div>
        </div>
      </div>
    </div>
  );
};
