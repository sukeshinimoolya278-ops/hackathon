import React from 'react';
import { useDLEMesh } from '../../context/DLEMeshContext';
import {
  Radio,
  Zap,
  Compass,
  Share2,
  Footprints,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface DLEMeshBannerProps {
  onOpenMeshControl: () => void;
}

export const DLEMeshBanner: React.FC<DLEMeshBannerProps> = ({ onOpenMeshControl }) => {
  const {
    isMeshActive,
    toggleMeshMode,
    localNode,
    peers,
    activeRoute,
    isRecordingTrail,
  } = useDLEMesh();

  if (!isMeshActive) {
    return (
      <div className="bg-slate-900 text-slate-300 px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-slate-400" />
          <span>DLE Mesh Mode is currently in standby.</span>
        </div>
        <button
          onClick={() => toggleMeshMode(true)}
          className="text-teal-400 hover:text-teal-300 font-bold underline flex items-center gap-1"
        >
          <span>Activate DLE Mesh Mode</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white px-4 py-2.5 border-b border-teal-500/30 text-xs shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left Side: Status & Node */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-emerald-400 tracking-wide uppercase text-[11px]">
              DLE Mesh Active
            </span>
          </div>

          <span className="text-slate-500 hidden sm:inline">&bull;</span>

          <div className="font-mono text-[11px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1 text-slate-200">
            <span className="text-slate-400">Node:</span>
            <strong className="text-teal-300">{localNode.id}</strong>
          </div>

          <span className="text-slate-500 hidden sm:inline">&bull;</span>

          <div className="flex items-center gap-1 text-[11px] text-teal-200">
            <Radio className="w-3.5 h-3.5 text-teal-400" />
            <span>
              <strong>{peers.length} Peers</strong> in direct RF/BLE range
            </span>
          </div>

          {isRecordingTrail && (
            <span className="bg-rose-500/30 text-rose-200 border border-rose-500/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse">
              <Footprints className="w-3 h-3" />
              Recording Breadcrumb Trail
            </span>
          )}
        </div>

        {/* Right Side: Traceable Route Summary & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 self-end md:self-auto">
          {activeRoute && (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] bg-teal-900/50 border border-teal-500/40 px-2.5 py-0.5 rounded-full text-teal-100">
              <Compass className="w-3 h-3 text-teal-300" />
              <span>Offline Route to <strong>{activeRoute.destination.campName}</strong>:</span>
              <strong className="text-emerald-300">{activeRoute.totalDistanceKm} km</strong>
              <span className="text-slate-400">({activeRoute.waypoints[0]?.bearingDegrees}° {activeRoute.waypoints[0]?.bearingCardinal})</span>
            </div>
          )}

          <button
            onClick={onOpenMeshControl}
            className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm hover:shadow-glow-teal active:scale-[0.98]"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Open Traceable Route & Mesh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
