import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDisaster } from '../../context/DisasterContext';
import { useDLEMesh } from '../../context/DLEMeshContext';
import {
  Home,
  LayoutDashboard,
  Radio,
  MapPin,
  Search,
  HeartHandshake,
  ShieldCheck,
  Compass,
  Zap,
  Bell,
  X,
  UserX,
  UserPlus,
  FileText,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenLocationPicker: () => void;
  onOpenMeshControl: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLocationPicker, onOpenMeshControl }) => {
  const { activeDisaster, notifications, clearNotification } = useDisaster();
  const { isMeshActive, peers } = useDLEMesh();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home', icon: <Home className="w-3.5 h-3.5" /> },
    { to: '/reunion-intelligence', label: 'Reunion Intelligence', icon: <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" /> },
    { to: '/search', label: 'Find Loved Ones', icon: <Search className="w-3.5 h-3.5 text-violet-500" /> },
    { to: '/camps', label: 'Relief Camps', icon: <MapPin className="w-3.5 h-3.5 text-pink-500" /> },
    { to: '/safe-checkin', label: 'I Am Safe', icon: <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" /> },
    { to: '/report-missing', label: 'Report Missing', icon: <UserX className="w-3.5 h-3.5 text-rose-500" /> },
    { to: '/dashboard', label: 'Command Hub', icon: <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" /> },
  ];

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3 pb-2 transition-all">
      {/* Emergency notification toast bar */}
      {notifications.length > 0 && (
        <div className="max-w-7xl mx-auto mb-2 bg-gradient-to-r from-rose-600 via-pink-600 to-violet-600 text-white px-4 py-2 rounded-2xl text-xs flex items-center justify-between shadow-clay-pink">
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span className="font-bold uppercase tracking-wider text-[11px]">{notifications[0]}</span>
          </div>
          <button
            onClick={() => clearNotification(0)}
            className="text-white hover:text-rose-100 p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Modern Frosted Pill Navbar */}
      <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-xl border border-violet-100/90 rounded-3xl px-4 sm:px-6 py-2.5 shadow-clay flex items-center justify-between gap-3">
        {/* Brand Logo with 3D Claymorphic Squircle Badge matching photo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 text-white flex items-center justify-center font-black text-base shadow-3d-badge group-hover:scale-105 group-hover:shadow-glow-violet transition-all duration-300">
              GX
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-black tracking-tight bg-gradient-to-r from-violet-900 via-indigo-900 to-pink-600 bg-clip-text text-transparent">
                  GlobalX
                </span>
                <span className="text-[9px] font-black uppercase text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200 tracking-wider hidden sm:inline">
                  Zero Rumor
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block font-semibold -mt-0.5">
                Disaster Command &amp; Reunification
              </span>
            </div>
          </Link>

          {/* Active Disaster Location Telemetry Pill */}
          {activeDisaster && (
            <button
              type="button"
              onClick={onOpenLocationPicker}
              title="Click to choose active disaster sector"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 rounded-full border border-violet-200/80 text-xs text-violet-950 transition-all shadow-clay-sm group"
            >
              <Compass className="w-3.5 h-3.5 text-violet-600 group-hover:rotate-45 transition-transform" />
              <span className="text-slate-500 text-[10px] uppercase font-bold">Sector:</span>
              <span className="font-extrabold truncate max-w-[130px] text-xs text-violet-900">
                {activeDisaster.name}
              </span>
              <span className="font-mono text-[10px] font-bold text-pink-700 bg-white px-2 py-0.5 rounded-md border border-pink-200">
                📍 {activeDisaster.latitude.toFixed(2)}°, {activeDisaster.longitude.toFixed(2)}°
              </span>
            </button>
          )}
        </div>

        {/* Navigation Links with Modern Pill Highlighting */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map(link => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-clay-sm -translate-y-0.5'
                    : 'text-slate-600 hover:text-violet-900 hover:bg-violet-50/80'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Utilities (DLE Mesh & Emergency SOS) */}
        <div className="flex items-center gap-2">
          {/* DLE Offline Mesh Status Pill */}
          <button
            onClick={onOpenMeshControl}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-clay-sm active:scale-[0.98] ${
              isMeshActive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-violet-50 hover:text-violet-800'
            }`}
            title="Disaster Local Edge Mesh Mode"
          >
            <Zap className={`w-3.5 h-3.5 ${isMeshActive ? 'text-white' : 'text-violet-600'}`} />
            <span className="hidden sm:inline">DLE Mesh</span>
            {isMeshActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
          </button>

          {/* Emergency Report Missing CTA Button */}
          <Link
            to="/report-missing"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-clay-pink hover:shadow-glow-pink active:scale-[0.98]"
            title="Report a Missing Family Member"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Report Missing</span>
            <span className="sm:hidden">+ Report</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
