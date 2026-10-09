import React, { useState } from 'react';
import { useDLEMesh } from '../../context/DLEMeshContext';
import { useDisaster } from '../../context/DisasterContext';
import {
  Radio,
  Navigation,
  Compass,
  Footprints,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Zap,
  Layers,
  Battery,
  Send,
  X,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  Eye,
  Crosshair,
  Volume2,
} from 'lucide-react';

interface DLEMeshControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DLEMeshControlModal: React.FC<DLEMeshControlModalProps> = ({ isOpen, onClose }) => {
  const {
    isMeshActive,
    toggleMeshMode,
    localNode,
    peers,
    packets,
    activeRoute,
    breadcrumbs,
    isRecordingTrail,
    toggleRecordingTrail,
    dropBreadcrumb,
    clearBreadcrumbs,
    broadcastSOS,
    broadcastCheckIn,
    generateRouteToCamp,
  } = useDLEMesh();

  const { camps, activeDisaster } = useDisaster();

  const [activeTab, setActiveTab] = useState<'route' | 'topology' | 'packets' | 'broadcast'>('route');
  const [selectedCampId, setSelectedCampId] = useState<string>(camps[0]?.id || '');
  const [sosReason, setSosReason] = useState('Medical assistance required - Elderly family member separated');
  const [sosPriority, setSosPriority] = useState('URGENT');
  const [sosCount, setSosCount] = useState(2);
  const [broadcastSentNotice, setBroadcastSentNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectCampForRoute = (campId: string) => {
    setSelectedCampId(campId);
    const target = camps.find((c) => c.id === campId);
    if (target) {
      generateRouteToCamp(target);
    }
  };

  const handleSendSOS = (e: React.FormEvent) => {
    e.preventDefault();
    const packet = broadcastSOS({
      reason: sosReason,
      priority: sosPriority,
      peopleCount: Number(sosCount),
    });
    setBroadcastSentNotice(`🚀 Emergency SOS packet #${packet.id} dispatched across DLE Mesh! Relaying through local peers...`);
    setActiveTab('packets');
    setTimeout(() => setBroadcastSentNotice(null), 8000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header with Mesh Activation Toggle */}
        <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isMeshActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                Disaster Local Edge (DLE) Mesh Network
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isMeshActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}
              >
                {isMeshActive ? 'MESH ACTIVE' : 'MESH STANDBY'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Offline Mesh & Traceable Evacuation Routing
            </h2>
            <p className="text-xs text-slate-400">
              Zero-cell-tower peer-to-peer relaying, local store-and-forward pings, and hazard-avoiding offline walkable navigation.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Mesh Mode Toggle Button */}
            <button
              onClick={() => toggleMeshMode()}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                isMeshActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isMeshActive ? 'Mesh: ON' : 'Mesh: OFF'}</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('route')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'route'
                ? 'bg-white text-teal-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            <span>Traceable Route (Without Net)</span>
            {activeRoute && (
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('topology')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'topology'
                ? 'bg-white text-teal-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-teal-600" />
            <span>Mesh Topology & Peers ({peers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('packets')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'packets'
                ? 'bg-white text-teal-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Hop-by-Hop Packet Tracer ({packets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === 'broadcast'
                ? 'bg-white text-teal-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Offline SOS Beacon Broadcast</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {broadcastSentNotice && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{broadcastSentNotice}</span>
            </div>
          )}

          {/* TAB 1: TRACEABLE ROUTE WITHOUT NET */}
          {activeTab === 'route' && (
            <div className="space-y-6">
              {/* Camp Destination Selection & Header HUD */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-teal-600" />
                      <span>Select Target Relief Shelter for Offline Navigation:</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Route is computed locally via vector geometry without requesting remote map APIs.
                    </p>
                  </div>

                  <select
                    value={selectedCampId}
                    onChange={(e) => handleSelectCampForRoute(e.target.value)}
                    className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                  >
                    {camps.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.name} ({camp.currentOccupancy}/{camp.capacity} beds)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Telemetry Strip for Route */}
                {activeRoute && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Distance</span>
                      <strong className="text-slate-900 text-base font-extrabold text-teal-700">
                        📍 {activeRoute.totalDistanceKm} km
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Est. Walk Time</span>
                      <strong className="text-slate-900 text-base font-extrabold text-sky-700 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        ~{activeRoute.estimatedMinutes} mins
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Initial Compass Bearing</span>
                      <strong className="text-slate-900 text-base font-extrabold text-emerald-700 flex items-center gap-1 font-mono">
                        <Compass className="w-4 h-4" />
                        {activeRoute.waypoints[0]?.bearingDegrees}° {activeRoute.waypoints[0]?.bearingCardinal}
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Hazard Bypass Mode</span>
                      <strong className="text-slate-900 text-xs font-bold text-rose-700 line-clamp-1">
                        {activeRoute.hazardAvoidanceNotice.includes('Applied') ? '⚠️ Bypass Active' : '✅ Safe Direct'}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Hazard avoidance notice banner */}
                {activeRoute && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span>{activeRoute.hazardAvoidanceNotice}</span>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Generated 100% offline at {activeRoute.generatedOfflineAt} using local device telemetry.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Turn-by-Turn Offline Waypoint Walkable Guidance */}
              {activeRoute && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Footprints className="w-4 h-4 text-teal-600" />
                      <span>Step-by-Step Offline Turn Guidance:</span>
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {activeRoute.waypoints.length} Checkpoints
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeRoute.waypoints.map((wp, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition-colors ${
                          wp.isHazardAvoidance
                            ? 'bg-amber-50/70 border-amber-300'
                            : idx === activeRoute.waypoints.length - 1
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                                  wp.isHazardAvoidance
                                    ? 'bg-amber-600 text-white'
                                    : idx === activeRoute.waypoints.length - 1
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-teal-600 text-white'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <strong className="text-slate-900 text-xs font-bold">
                                {wp.title}
                              </strong>
                              {wp.isHazardAvoidance && (
                                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                                  Hazard Avoidance Embankment
                                </span>
                              )}
                              {idx === activeRoute.waypoints.length - 1 && (
                                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                                  Final Relief Shelter
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-700 pl-8">{wp.instruction}</p>

                            {wp.safetyNote && (
                              <p className="text-[11px] text-slate-500 italic pl-8">
                                ℹ️ {wp.safetyNote}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0 space-y-0.5 font-mono text-[11px]">
                            <div className="font-bold text-teal-800">
                              🧭 {wp.bearingDegrees}° {wp.bearingCardinal}
                            </div>
                            {wp.distanceFromPrevMeters > 0 && (
                              <div className="text-slate-500">
                                +{wp.distanceFromPrevMeters}m
                              </div>
                            )}
                            <div className="text-slate-400 text-[10px]">
                              Elev: +{wp.elevationMeters}m
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Breadcrumb Trail Tracker (Offline Traceability) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <Footprints className="w-4 h-4 text-emerald-600" />
                      <span>Traceable Breadcrumb Trail (Survivor Path Recorder):</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Record an offline GPS breadcrumb path point-by-point so search & rescue teams can retrace your steps.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleRecordingTrail}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                        isRecordingTrail
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>{isRecordingTrail ? 'Stop Recording Trail' : 'Start Recording Trail'}</span>
                    </button>

                    <button
                      onClick={() => dropBreadcrumb('Manual Checkpoint Saved')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                    >
                      <span>Drop Checkpoint</span>
                    </button>

                    {breadcrumbs.length > 0 && (
                      <button
                        onClick={clearBreadcrumbs}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-rose-600"
                        title="Clear Breadcrumbs"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {breadcrumbs.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {breadcrumbs.map((crumb, i) => (
                      <span
                        key={crumb.id}
                        className="text-[10px] font-mono bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-700 flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>#{i + 1} {crumb.timestamp}</span>
                        <span className="text-slate-400">({crumb.latitude.toFixed(3)}, {crumb.longitude.toFixed(3)})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No breadcrumbs recorded yet. Click "Start Recording Trail" or "Drop Checkpoint" to begin tracing your path.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MESH TOPOLOGY & LOCAL PEERS */}
          {activeTab === 'topology' && (
            <div className="space-y-6">
              {/* Local Device Identity */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider">
                    Your Local DLE Mesh Terminal
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span>{localNode.name}</span>
                    <span className="font-mono text-xs bg-white text-teal-800 px-2 py-0.5 rounded border border-teal-300">
                      {localNode.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    Role: <strong>{localNode.role}</strong> &bull; Protocol: <strong>BroadcastChannel + BLE DLE Low Energy</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-center">
                    <span className="text-slate-400 text-[10px] block">BATTERY</span>
                    <strong className="text-slate-900 flex items-center gap-1 font-bold">
                      <Battery className="w-3.5 h-3.5 text-emerald-600" />
                      {localNode.batteryLevel}%
                    </strong>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400 text-[10px] block">SIGNAL</span>
                    <strong className="text-emerald-700 font-bold">{localNode.rssi} dBm</strong>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400 text-[10px] block">STATUS</span>
                    <strong className="text-emerald-700 font-bold">{localNode.status}</strong>
                  </div>
                </div>
              </div>

              {/* Active Local Relay Peers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-teal-600" />
                    <span>Discovered Local Mesh Peers ({peers.length}):</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-mono">
                    Ad-hoc RF/BLE Store-and-Forward Reach
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {peers.map((peer) => (
                    <div
                      key={peer.id}
                      className="card-clean p-4 space-y-3 border border-slate-200 hover:border-teal-400 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-slate-900 text-xs block font-bold">
                            {peer.name}
                          </strong>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            ID: {peer.id}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            peer.role === 'SHELTER_GATEWAY'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : peer.role === 'RELAY_ROUTER'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {peer.role}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-lg font-mono">
                        <div>
                          <span className="text-[9px] text-slate-400 block">DISTANCE</span>
                          <strong className="text-slate-800 font-bold">{peer.distanceMeters}m</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">HOPS</span>
                          <strong className="text-teal-700 font-bold">{peer.hops} hop</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">RSSI</span>
                          <strong className="text-emerald-700 font-bold">{peer.rssi} dBm</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Last Contact: {peer.lastSeen}</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          {peer.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOP-BY-HOP PACKET TRACER */}
          {activeTab === 'packets' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-teal-600" />
                  <span>Traceable Multi-Hop Packet Log:</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Visual proof of offline packet progression hopping between nodes without cellular towers.
                </p>
              </div>

              {packets.length === 0 ? (
                <div className="card-clean text-center py-12 text-slate-400 text-xs">
                  No packets generated yet. Go to the "Offline SOS Beacon Broadcast" tab to transmit your first mesh packet.
                </div>
              ) : (
                <div className="space-y-4">
                  {packets.map((pkt) => (
                    <div
                      key={pkt.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md text-white ${
                              pkt.type === 'SOS_BEACON'
                                ? 'bg-rose-600'
                                : pkt.type === 'SAFE_CHECKIN'
                                ? 'bg-emerald-600'
                                : 'bg-teal-600'
                            }`}
                          >
                            {pkt.type}
                          </span>
                          <strong className="text-slate-900 font-mono text-xs">{pkt.id}</strong>
                          <span className="text-slate-400 text-xs">&bull; from {pkt.senderName}</span>
                        </div>

                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            pkt.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}
                        >
                          {pkt.status === 'DELIVERED' ? '✅ DELIVERED TO CAMP GATEWAY' : '⏳ IN-TRANSIT (HOPPING)'}
                        </span>
                      </div>

                      {/* Payload preview */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700">
                        {pkt.payload?.reason && (
                          <p><strong>Reason:</strong> {pkt.payload.reason}</p>
                        )}
                        {pkt.payload?.fullName && (
                          <p><strong>Survivor:</strong> {pkt.payload.fullName} (Phone: {pkt.payload.phone})</p>
                        )}
                        {pkt.payload?.coordinates && (
                          <p className="font-mono text-slate-500 text-[11px]">
                            GPS Origin: {pkt.payload.coordinates.latitude.toFixed(4)}° N, {pkt.payload.coordinates.longitude.toFixed(4)}° E
                          </p>
                        )}
                      </div>

                      {/* Hop Progression Path */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                          Traceable Hop Relay Breadcrumbs:
                        </span>
                        <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-teal-500">
                          {pkt.hopTrace.map((hop, hIdx) => (
                            <div
                              key={hIdx}
                              className="text-xs text-slate-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-teal-700 text-[11px]">
                                  Hop #{hIdx + 1}:
                                </span>
                                <span className="font-semibold">{hop.nodeName}</span>
                                <span className="text-slate-400 font-mono text-[10px]">
                                  ({hop.nodeId})
                                </span>
                              </div>
                              <div className="font-mono text-slate-500 text-[11px]">
                                {hop.signalDbm} dBm &bull; {hop.timestamp}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OFFLINE SOS BROADCAST */}
          {activeTab === 'broadcast' && (
            <form onSubmit={handleSendSOS} className="space-y-4 max-w-xl mx-auto">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  Offline Emergency Beacon Transmitter
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Broadcast Emergency SOS Packet to Nearby Mesh Nodes
                </h3>
                <p className="text-xs text-slate-500">
                  This message will travel hop-by-hop through volunteer and responder phones to the nearest relief shelter base station.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Urgency / Priority Category
                </label>
                <select
                  value={sosPriority}
                  onChange={(e) => setSosPriority(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="CRITICAL_MEDICAL">Critical Medical - Life Threatening</option>
                  <option value="URGENT">Urgent - Trapped / Stranded</option>
                  <option value="FOOD_WATER">Emergency Water & Food Needed</option>
                  <option value="REUNIFICATION">Family Separated - Lost Child</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Persons in Group Needing Evacuation
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={sosCount}
                  onChange={(e) => setSosCount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Details / Needs
                </label>
                <textarea
                  rows={3}
                  value={sosReason}
                  onChange={(e) => setSosReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Broadcast SOS Packet Across DLE Mesh</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            <span>DLE Mesh Protocol operates 100% locally on device &bull; Zero remote internet required</span>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary py-1.5 px-4 text-xs font-bold self-end sm:self-auto"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
