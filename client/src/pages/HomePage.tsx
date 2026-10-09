import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDisaster } from '../context/DisasterContext';
import { Camp } from '../types';
import {
  Search,
  UserX,
  Eye,
  ShieldCheck,
  HeartHandshake,
  MapPin,
  QrCode,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Compass,
  Navigation,
  Radio,
  AlertTriangle,
  Activity,
  CloudRain,
  Zap,
  MousePointer,
  Layers,
  PenTool,
  Type,
  Sliders,
  Calendar,
  Heart,
  SlidersHorizontal,
} from 'lucide-react';

interface HomePageProps {
  onOpenLocationPicker?: () => void;
  onOpenMeshControl?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenLocationPicker, onOpenMeshControl }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeDisaster, camps } = useDisaster();
  const [searchQuery, setSearchQuery] = useState('');
  const [mockToggle, setMockToggle] = useState(true);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-12 pb-20 relative overflow-hidden bg-slate-50/60">
      {/* 1. HERO SECTION (INSPIRED DIRECTLY BY USER'S REFERENCE UI DESIGN) */}
      <section className="relative overflow-hidden pt-6 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Fluid Organic Wave Gradients from Photo */}
        <div className="absolute top-0 right-0 w-[580px] h-[580px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 rounded-bl-[160px] opacity-15 blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-[460px] h-[460px] bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-tr-[180px] opacity-10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* LEFT COLUMN: HERO CONTENT & 3D DESIGN BADGES */}
          <div className="lg:col-span-6 space-y-6 text-left relative z-10">
            {/* Decorative Dot Matrix from Photo (Top Left) */}
            <div className="grid grid-cols-3 gap-1.5 w-7 opacity-40">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
            </div>

            {/* High-Impact Headline (Matching Photo Typography) */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100/80 border border-violet-200 text-violet-800 text-xs font-black uppercase tracking-wider mb-3 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                <span>Zero-Rumor Mission Command</span>
              </div>
              <h1 className="font-display text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-[1.08] uppercase">
                REUNITE FAMILIES.{' '}
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 bg-clip-text text-transparent block sm:inline">
                  SHAPE IMPACT.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mt-3 max-w-xl font-normal leading-relaxed">
                India's next-generation disaster family reunification network. Instant bi-directional cross-matching, CAP early warnings, and offline mesh evacuation.
              </p>
            </div>

            {/* Row of 4 Colorful Squircle Tool Badges (From Reference Photo) */}
            <div className="flex items-center gap-3 pt-1">
              {/* Tool 1: Violet Pen/Vector Tool Badge */}
              <Link
                to="/camps"
                title="Geographic Telemetry & Relocation Map"
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-3d-badge hover:scale-110 hover:-translate-y-1 transition-all duration-300"
              >
                <PenTool className="w-5 h-5" />
              </Link>

              {/* Tool 2: Pink Typography / Missing Report Tool Badge */}
              <Link
                to="/report-missing"
                title="Report Missing Family Member"
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-3d-badge-pink hover:scale-110 hover:-translate-y-1 transition-all duration-300"
              >
                <Type className="w-5 h-5" />
              </Link>

              {/* Tool 3: Coral / Peach Layers Tool Badge */}
              <Link
                to="/camps"
                title="Shelter Rosters & Logistics"
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-400 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300"
              >
                <Layers className="w-5 h-5" />
              </Link>

              {/* Tool 4: Sky Blue Cursor / DLE Mesh Tool Badge */}
              <button
                type="button"
                onClick={onOpenMeshControl}
                title="DLE Offline Mesh Navigation Cursor"
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 hover:scale-110 hover:-translate-y-1 transition-all duration-300"
              >
                <MousePointer className="w-5 h-5" />
              </button>
            </div>

            {/* Circular Dial Widget + Search Bar (Matching Reference Layout) */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Circular Dial Progress Ring Widget (From Reference Photo) */}
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-3xl border border-violet-100 shadow-clay shrink-0">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 border-r-fuchsia-500 border-b-violet-600 animate-spin-slow" />
                  <div className="text-center">
                    <Calendar className="w-3.5 h-3.5 text-pink-500 mx-auto" />
                    <span className="font-display font-black text-sm text-slate-900 block leading-tight">
                      24/7
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    NETWORK STATUS
                  </span>
                  <strong className="text-xs font-black text-violet-950 block">
                    100% VERIFIED
                  </strong>
                  <span className="text-[10px] text-pink-600 font-bold block">
                    Zero False Rumors
                  </span>
                </div>
              </div>

              {/* Search Bar with 3D Primary Button */}
              <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search person name, phone, or token..."
                    className="w-full pl-10 pr-3 py-3 bg-white border border-violet-200/90 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-clay-sm placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-clay hover:shadow-glow-violet active:scale-[0.98] transition-all"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: 3D CLAYMORPHIC DASHBOARD WINDOW MOCKUP */}
          <div className="lg:col-span-6 relative flex items-center justify-center pt-6 lg:pt-0">
            {/* Angled Claymorphic Tablet Mockup Window (From Reference Image) */}
            <div className="relative w-full max-w-[480px] bg-white rounded-3xl border-2 border-white shadow-2xl shadow-violet-500/20 p-3 transform transition-all duration-500 hover:rotate-0 hover:scale-[1.02]">
              {/* Inner Dashboard Layout with Dark Left Dock */}
              <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 overflow-hidden flex shadow-inner">
                {/* Left Mini Dock (From Reference Image) */}
                <div className="w-12 bg-slate-900 flex flex-col items-center py-4 gap-3 text-slate-400">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-500 to-pink-500 text-white flex items-center justify-center text-[10px] font-black mb-1">
                    GX
                  </div>
                  <button type="button" className="p-1.5 rounded-lg bg-violet-600 text-white">
                    <Radio className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="p-1.5 rounded-lg hover:text-white">
                    <MapPin className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="p-1.5 rounded-lg hover:text-white">
                    <Activity className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" className="p-1.5 rounded-lg hover:text-white mt-auto">
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Main Mockup Canvas Area */}
                <div className="flex-1 p-3.5 space-y-3">
                  {/* Mock Search Bar */}
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 flex items-center justify-between text-[11px] text-slate-400 shadow-2xs">
                    <span className="flex items-center gap-1.5">
                      <Search className="w-3 h-3 text-violet-500" />
                      <span className="text-slate-600 font-medium">GlobalX Incident Command</span>
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      LIVE
                    </span>
                  </div>

                  {/* Active Disaster Preview Card with Gradient Button */}
                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50/80 p-3 rounded-2xl border border-violet-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="font-bold text-slate-900 truncate">
                        {activeDisaster?.name || 'Active Disaster Sector'}
                      </strong>
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        RED ALERT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Sector: <strong>{activeDisaster?.location}</strong> &bull; {camps.length} camps operational
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        to="/camps"
                        className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-xl text-[11px] font-black shadow-md flex items-center gap-1"
                      >
                        <span>Open Radar Map</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <span className="font-mono text-[10px] text-violet-900 font-bold">
                        📍 {activeDisaster?.latitude.toFixed(2)}°, {activeDisaster?.longitude.toFixed(2)}°
                      </span>
                    </div>
                  </div>

                  {/* Neumorphic Feature Chips (Matching Aa, Box, Gradient Circle from Photo) */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-2xs">
                      <span className="font-display font-black text-sm text-violet-700">Aa</span>
                      <span className="text-[9px] text-slate-400 font-semibold">Fuzzy Match</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-2xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 my-0.5" />
                      <span className="text-[9px] text-slate-400 font-semibold">Rumor Shield</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-2xs">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 my-0.5" />
                      <span className="text-[9px] text-slate-400 font-semibold">DLE Mesh</span>
                    </div>
                  </div>

                  {/* Neumorphic Toggle Switch (From Reference Image) */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 text-[11px]">
                      Offline Beacon Routing
                    </span>
                    <button
                      type="button"
                      onClick={() => setMockToggle(!mockToggle)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                        mockToggle ? 'bg-violet-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>
                </div>
              </div>

              {/* FOREGROUND 3D CLAYMORPHIC BADGES (MATCHING UI, UX, HEART IN PHOTO) */}
              {/* Badge 1: 3D Violet "GX" Squircle Badge */}
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-700 to-indigo-500 text-white font-display font-black text-xl flex items-center justify-center shadow-3d-badge transform -rotate-6 hover:rotate-0 transition-transform duration-300 cursor-pointer">
                GX
              </div>

              {/* Badge 2: 3D Pink "DLE" Squircle Badge */}
              <div className="absolute -bottom-4 left-16 w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white font-display font-black text-xl flex items-center justify-center shadow-3d-badge-pink transform rotate-3 hover:rotate-0 transition-transform duration-300 cursor-pointer">
                DLE
              </div>

              {/* Badge 3: 3D White Squircle with Pink Heart */}
              <div className="absolute -bottom-3 right-6 px-3 py-2 rounded-2xl bg-white border border-pink-100 text-pink-600 font-bold text-xs flex items-center gap-1.5 shadow-clay-pink transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                <span className="font-black text-slate-900">SAFE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOP 4 ACTION MODE CARDS (CLAYMORPHIC ELEVATION MATCHING REFERENCE) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <Link
            to="/alerts"
            className="clay-card p-4 flex flex-col items-center justify-center text-center group hover:border-violet-300"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform">
              <Navigation className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              CURRENT LOCATION CAP ALERT
            </span>
            <span className="text-[9px] text-rose-500 font-bold mt-0.5">Live GPS Sync</span>
          </Link>

          <Link
            to="/alerts"
            className="clay-card p-4 flex flex-col items-center justify-center text-center group hover:border-violet-300"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              ALL INDIA CAP ALERT
            </span>
            <span className="text-[9px] text-violet-600 font-bold mt-0.5">14 Active Warnings</span>
          </Link>

          <Link
            to="/alerts"
            className="clay-card p-4 flex flex-col items-center justify-center text-center group hover:border-violet-300"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              STATE WISE CAP ALERT
            </span>
            <span className="text-[9px] text-amber-600 font-bold mt-0.5">Filter by State</span>
          </Link>

          <Link
            to="/alerts"
            className="clay-card p-4 flex flex-col items-center justify-center text-center group hover:border-violet-300"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-white flex items-center justify-center mb-2 shadow-md group-hover:scale-110 transition-transform">
              <CloudRain className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              FORECAST &amp; PODCAST
            </span>
            <span className="text-[9px] text-blue-600 font-bold mt-0.5">Live Voice Bulletin</span>
          </Link>
        </div>
      </section>

      {/* 3. CORE DUAL-MODE INTAKE SECTION (VIBRANT CLAY CARDS) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Missing Person Intake */}
          <Link
            to="/report-missing"
            className="group relative overflow-hidden bg-white/95 rounded-3xl p-7 border border-violet-100 shadow-clay hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left min-h-[220px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center mb-4 shadow-3d-badge group-hover:scale-110 transition-transform">
                <UserX className="w-6 h-6" />
              </div>
              <h2 className="font-display text-2xl font-black text-slate-900 group-hover:text-violet-700 transition-colors">
                {t('btnLooking')}
              </h2>
              <p className="text-slate-600 mt-1.5 text-xs sm:text-sm leading-relaxed">
                {t('btnLookingSub')}. Continuous automated cross-matching with shelter intake records.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-violet-700 font-black text-xs uppercase tracking-wider">
              <span>File Missing Person Report</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Witness Sighting Submission */}
          <Link
            to="/report-sighting"
            className="group relative overflow-hidden bg-white/95 rounded-3xl p-7 border border-pink-100 shadow-clay-pink hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between text-left min-h-[220px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center mb-4 shadow-3d-badge-pink group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="font-display text-2xl font-black text-slate-900 group-hover:text-pink-600 transition-colors">
                {t('btnSaw')}
              </h2>
              <p className="text-slate-600 mt-1.5 text-xs sm:text-sm leading-relaxed">
                {t('btnSawSub')}. Report multiple survivors or persons moving toward safe zones.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider">
              <span>Submit Eyewitness Sighting</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* 4. QUICK ACCESS UTILITY ACTION STRIP */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/safe-checkin"
            className="clay-card p-4 flex items-center gap-4 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-slate-900 group-hover:text-emerald-700">One-Tap "I am Safe"</h3>
              <p className="text-[11px] text-slate-500">Check in to notify searching relatives</p>
            </div>
          </Link>

          <Link
            to="/camps"
            className="clay-card p-4 flex items-center gap-4 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-slate-900 group-hover:text-indigo-700">Relief Camps &amp; Needs</h3>
              <p className="text-[11px] text-slate-500">Capacity, live status &amp; supply rosters</p>
            </div>
          </Link>

          <Link
            to="/family-token"
            className="clay-card p-4 flex items-center gap-4 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-slate-900 group-hover:text-pink-700">Family QR Pass</h3>
              <p className="text-[11px] text-slate-500">Instant check-in token for families</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
};
