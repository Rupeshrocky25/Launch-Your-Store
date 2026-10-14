import React from 'react';
import { Monitor, Smartphone, Sparkles } from 'lucide-react';

interface DeviceViewSwitcherProps {
  viewMode: 'desktop' | 'mobile';
  onToggleViewMode: (mode: 'desktop' | 'mobile') => void;
}

export const DeviceViewSwitcher: React.FC<DeviceViewSwitcherProps> = ({
  viewMode,
  onToggleViewMode,
}) => {
  return (
    <div className="fixed top-20 right-4 z-50 flex items-center bg-zinc-950/90 text-white backdrop-blur-md p-1 rounded-2xl shadow-xl border border-zinc-800 transition-all hover:scale-102">
      <button
        onClick={() => onToggleViewMode('desktop')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          viewMode === 'desktop'
            ? 'bg-white text-zinc-950 shadow-md'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
        }`}
        title="Switch to full Desktop View"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Desktop View</span>
        <span className="sm:hidden">Desktop</span>
      </button>

      <button
        onClick={() => onToggleViewMode('mobile')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          viewMode === 'mobile'
            ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
        }`}
        title="Switch to realistic Mobile Phone View (390px)"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mobile View</span>
        <span className="sm:hidden">Mobile</span>
      </button>
    </div>
  );
};
