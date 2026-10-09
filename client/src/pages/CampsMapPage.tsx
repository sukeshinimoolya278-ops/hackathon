import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useDisaster } from '../context/DisasterContext';
import { useAuth } from '../context/AuthContext';
import { useDLEMesh } from '../context/DLEMeshContext';
import { TacticalRadarCanvas } from '../components/mesh/TacticalRadarCanvas';
import { api } from '../services/api';
import { Camp } from '../types';
import {
  MapPin,
  Building,
  Phone,
  User,
  Package,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Compass,
  Navigation,
  Radio,
  RefreshCw,
  Footprints,
  Zap,
  WifiOff,
  Layers,
  Crosshair,
  ArrowRight,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CampsMapPageProps {
  onOpenLocationPicker?: () => void;
  onOpenMeshControl?: () => void;
}

// Standard shelter pin icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom pulsing red radar icon for the Disaster Epicenter
const epicenterIcon = L.divIcon({
  className: 'custom-epicenter-marker',
  html: `<div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
    <div style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(225, 29, 72, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    <div style="position:relative; width:18px; height:18px; border-radius:50%; background:#e11d48; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Custom Waypoint Marker icon
const waypointIcon = (num: number, isHazard: boolean, isFinal: boolean) =>
  L.divIcon({
    className: 'custom-wp-marker',
    html: `<div style="display:flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:${
      isFinal ? '#059669' : isHazard ? '#d97706' : '#0d9488'
    }; color:white; font-size:11px; font-weight:800; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);">${num}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

// User live GPS location icon
const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center;">
    <div style="position:absolute; width:28px; height:28px; border-radius:50%; background:rgba(13, 148, 136, 0.4); animation: ping 1.5s infinite;"></div>
    <div style="position:relative; width:14px; height:14px; border-radius:50%; background:#0d9488; border:2.5px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Helper component that dynamically recenters & flies the Leaflet map smoothly
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 12, { duration: 1.2 });
  }, [center[0], center[1]]);
  return null;
}

// Haversine distance calculator
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export const CampsMapPage: React.FC<CampsMapPageProps> = ({
  onOpenLocationPicker,
  onOpenMeshControl,
}) => {
  const { camps, refreshData, activeDisaster } = useDisaster();
  const { role } = useAuth();
  const {
    isMeshActive,
    activeRoute,
    breadcrumbs,
    isRecordingTrail,
    toggleRecordingTrail,
    dropBreadcrumb,
    generateRouteToCamp,
  } = useDLEMesh();

  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editNeeds, setEditNeeds] = useState('');
  const [editCapacity, setEditCapacity] = useState(0);

  // Map view mode: Standard Leaflet vs Tactical Radar Vector Grid (zero internet)
  const [mapViewMode, setMapViewMode] = useState<'STANDARD' | 'TACTICAL_RADAR'>('STANDARD');
  const [isGuidanceExpanded, setIsGuidanceExpanded] = useState(false);

  // User live GPS telemetry
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  const canEdit = role === 'COORDINATOR' || role === 'ADMIN';

  // Dynamic Center: focus on the active disaster coordinates or active route
  const mapCenter: [number, number] = activeRoute
    ? [activeRoute.coordinates[0][0], activeRoute.coordinates[0][1]]
    : activeDisaster
    ? [activeDisaster.latitude, activeDisaster.longitude]
    : camps.length > 0
    ? [camps[0].latitude, camps[0].longitude]
    : [13.0827, 80.2707];

  const handleOpenEdit = (camp: Camp) => {
    setSelectedCamp(camp);
    setEditNeeds(camp.needs || '');
    setEditCapacity(camp.capacity);
    setIsEditing(true);
  };

  const handleSaveCamp = async () => {
    if (!selectedCamp) return;
    try {
      await api.updateCamp(selectedCamp.id, {
        needs: editNeeds,
        capacity: Number(editCapacity),
      });
      alert('Camp needs and capacity updated. Dispatched to real-time network.');
      setIsEditing(false);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Error updating camp');
    }
  };

  const handleDetectUserGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(coords);
        setIsLocatingUser(false);

        // If route exists, regenerate from user's live position
        if (camps.length > 0) {
          const target = camps.find((c) => c.id === activeRoute?.destination.campId) || camps[0];
          generateRouteToCamp(target, coords);
        }
      },
      (err) => {
        alert(`Could not acquire GPS: ${err.message}`);
        setIsLocatingUser(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSelectRouteToCamp = (camp: Camp) => {
    generateRouteToCamp(camp, userLocation || undefined);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
              Live Relief Network Map
            </span>
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              DLE Mesh Mode Active
            </span>
            <span className="text-xs text-slate-500">Traceable Offline Routes &bull; Zero Net Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Relief Camps & Traceable Evacuation Routes
          </h1>
          <p className="text-sm text-slate-500">
            Real-time occupancy status, emergency nodal contacts, and hazard-avoiding offline walkable navigation.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenMeshControl && (
            <button
              type="button"
              onClick={onOpenMeshControl}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-teal-300 hover:bg-slate-800 border border-teal-500/30 flex items-center gap-1.5 shadow-xs"
            >
              <Radio className="w-3.5 h-3.5 text-teal-400" />
              <span>DLE Mesh & Routing Hub</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenLocationPicker}
            className="btn-primary text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 shadow-xs"
          >
            <Compass className="w-4 h-4" />
            <span>Choose Disaster Location</span>
          </button>
        </div>
      </div>

      {/* LIVE LOCATION TELEMETRY STRIP */}
      {activeDisaster && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Selected Disaster Epicenter
              </span>
              <span className="text-[10px] font-bold uppercase bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/40">
                {activeDisaster.alertLevel || 'RED ALERT'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              {activeDisaster.name}
            </h2>
            <p className="text-xs text-slate-300">
              Sector: <strong>{activeDisaster.location}</strong> ({activeDisaster.state}) &bull; {camps.length} camps operational
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono">
              <span className="text-slate-400 block text-[10px] uppercase">Live Coordinates</span>
              <strong className="text-teal-300 text-sm">
                📍 {activeDisaster.latitude.toFixed(4)}° N, {activeDisaster.longitude.toFixed(4)}° E
              </strong>
            </div>

            {userLocation && (
              <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono">
                <span className="text-slate-400 block text-[10px] uppercase">Distance from your device</span>
                <strong className="text-emerald-300 text-sm">
                  {getDistanceKm(userLocation.latitude, userLocation.longitude, activeDisaster.latitude, activeDisaster.longitude)} km away
                </strong>
              </div>
            )}

            <button
              onClick={handleDetectUserGps}
              disabled={isLocatingUser}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Detect device GPS location"
            >
              <Navigation className={`w-3.5 h-3.5 text-teal-400 ${isLocatingUser ? 'animate-spin' : ''}`} />
              <span>{userLocation ? 'Update GPS Distance' : 'Calculate Distance from My GPS'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TRACEABLE ROUTE HUD BAR (WITHOUT NET) */}
      {activeRoute && (
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-teal-500/40 shadow-md space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-300">
                  Traceable Walkable Evacuation Route (Zero-Net Vector Corridor)
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                  OFFLINE ROUTING ACTIVE
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Destination:</span>
                <span className="text-emerald-300 underline underline-offset-4">
                  {activeRoute.destination.campName}
                </span>
              </h3>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="bg-slate-800/90 px-3 py-1.5 rounded-xl border border-teal-500/30">
                <span className="text-slate-400 text-[10px] block">DISTANCE</span>
                <strong className="text-teal-300 text-sm">{activeRoute.totalDistanceKm} km</strong>
              </div>

              <div className="bg-slate-800/90 px-3 py-1.5 rounded-xl border border-teal-500/30">
                <span className="text-slate-400 text-[10px] block">WALK TIME</span>
                <strong className="text-sky-300 text-sm">~{activeRoute.estimatedMinutes} min</strong>
              </div>

              <div className="bg-slate-800/90 px-3 py-1.5 rounded-xl border border-teal-500/30">
                <span className="text-slate-400 text-[10px] block">COMPASS BEARING</span>
                <strong className="text-emerald-300 text-sm">
                  {activeRoute.waypoints[0]?.bearingDegrees}° {activeRoute.waypoints[0]?.bearingCardinal}
                </strong>
              </div>

              {/* View mode toggle */}
              <button
                onClick={() => setMapViewMode(mapViewMode === 'STANDARD' ? 'TACTICAL_RADAR' : 'STANDARD')}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Switch between Leaflet map and offline vector radar"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{mapViewMode === 'STANDARD' ? 'Switch to Offline Radar' : 'Switch to OpenStreetMap'}</span>
              </button>
            </div>
          </div>

          {/* Hazard note */}
          <div className="flex items-center justify-between pt-1 border-t border-teal-800/60 text-xs">
            <span className="text-teal-200/90">{activeRoute.hazardAvoidanceNotice}</span>
            <button
              onClick={() => setIsGuidanceExpanded(!isGuidanceExpanded)}
              className="text-xs text-teal-300 hover:text-white font-bold flex items-center gap-1"
            >
              <span>{isGuidanceExpanded ? 'Hide Step Directions' : `View ${activeRoute.waypoints.length} Turn Directions`}</span>
              {isGuidanceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expandable Step-by-Step Directions */}
          {isGuidanceExpanded && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-3">
              {activeRoute.waypoints.map((wp, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border ${
                    wp.isHazardAvoidance
                      ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                      : i === activeRoute.waypoints.length - 1
                      ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                    <span>
                      Step {i + 1}: {wp.title}
                    </span>
                    <span className="font-mono text-teal-400">
                      {wp.bearingDegrees}° {wp.bearingCardinal}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{wp.instruction}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map & Camps Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEAFLET / TACTICAL VECTOR MAP CONTAINER */}
        <div className="lg:col-span-2 card-clean p-2 h-[560px] relative overflow-hidden shadow-sm border border-slate-200">
          {mapViewMode === 'TACTICAL_RADAR' ? (
            <TacticalRadarCanvas
              route={activeRoute}
              camps={camps}
              epicenter={
                activeDisaster
                  ? {
                      latitude: activeDisaster.latitude,
                      longitude: activeDisaster.longitude,
                      name: activeDisaster.name,
                    }
                  : null
              }
              userCoords={userLocation}
              breadcrumbs={breadcrumbs}
            />
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={12}
              scrollWheelZoom={false}
              className="w-full h-full rounded-xl z-0"
            >
              {/* Dynamic recentering when disaster coordinates change */}
              <MapRecenter center={mapCenter} />

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Pulsing Radar Circle & Marker for Disaster Epicenter */}
              {activeDisaster && (
                <>
                  <Circle
                    center={[activeDisaster.latitude, activeDisaster.longitude]}
                    radius={4500}
                    pathOptions={{
                      color: '#e11d48',
                      fillColor: '#e11d48',
                      fillOpacity: 0.12,
                      weight: 2,
                      dashArray: '6, 6',
                    }}
                  />
                  <Marker
                    position={[activeDisaster.latitude, activeDisaster.longitude]}
                    icon={epicenterIcon}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs">
                        <strong className="text-rose-700 text-sm block font-extrabold uppercase">
                          🚨 {activeDisaster.name}
                        </strong>
                        <p className="text-slate-700 font-semibold">{activeDisaster.location}</p>
                        <div className="font-mono text-slate-600">
                          Coordinates: {activeDisaster.latitude.toFixed(4)}° N, {activeDisaster.longitude.toFixed(4)}° E
                        </div>
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded inline-block">
                          Active Emergency Epicenter
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {/* User Live GPS Marker */}
              {userLocation && (
                <Marker
                  position={[userLocation.latitude, userLocation.longitude]}
                  icon={userLocationIcon}
                >
                  <Popup>
                    <div className="p-1 text-xs space-y-1">
                      <strong className="text-teal-700 font-bold block">📍 Your Live Position</strong>
                      <div className="font-mono text-slate-600">
                        {userLocation.latitude.toFixed(4)}° N, {userLocation.longitude.toFixed(4)}° E
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* TRACEABLE OFFLINE EVACUATION ROUTE POLYLINE */}
              {activeRoute && (
                <>
                  <Polyline
                    positions={activeRoute.coordinates}
                    pathOptions={{
                      color: '#0d9488',
                      weight: 5,
                      className: 'offline-route-line',
                    }}
                  />

                  {/* Route Waypoints Markers */}
                  {activeRoute.waypoints.map((wp, idx) => (
                    <Marker
                      key={`wp-${idx}`}
                      position={[wp.latitude, wp.longitude]}
                      icon={waypointIcon(
                        idx + 1,
                        wp.isHazardAvoidance,
                        idx === activeRoute.waypoints.length - 1
                      )}
                    >
                      <Popup>
                        <div className="p-1 text-xs space-y-1">
                          <strong className="text-slate-900 block font-bold">
                            Checkpoint #{idx + 1}: {wp.title}
                          </strong>
                          <p className="text-slate-600">{wp.instruction}</p>
                          <div className="font-mono text-teal-700 font-bold">
                            Compass Heading: {wp.bearingDegrees}° {wp.bearingCardinal}
                          </div>
                          {wp.safetyNote && (
                            <p className="text-[11px] text-amber-700 italic">
                              ℹ️ {wp.safetyNote}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </>
              )}

              {/* BREADCRUMB TRAIL CHECKPOINTS */}
              {breadcrumbs.map((crumb, idx) => (
                <Circle
                  key={crumb.id || idx}
                  center={[crumb.latitude, crumb.longitude]}
                  radius={18}
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong className="text-emerald-700 font-bold">
                        Breadcrumb #{idx + 1}
                      </strong>
                      <p className="text-slate-600">{crumb.note}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {crumb.timestamp}
                      </span>
                    </div>
                  </Popup>
                </Circle>
              ))}

              {/* Relief Camps Markers */}
              {camps.map((camp: Camp) => (
                <Marker
                  key={camp.id}
                  position={[camp.latitude, camp.longitude]}
                  icon={defaultIcon}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <strong className="text-slate-900 text-sm block font-bold">{camp.name}</strong>
                      <p className="text-slate-600">{camp.location}</p>
                      <div className="font-bold text-teal-700">
                        Occupancy: {camp.currentOccupancy} / {camp.capacity} ({camp.status})
                      </div>
                      {activeDisaster && (
                        <div className="text-slate-500 font-mono text-[11px]">
                          Distance from Epicenter: {getDistanceKm(activeDisaster.latitude, activeDisaster.longitude, camp.latitude, camp.longitude)} km
                        </div>
                      )}
                      {camp.needs && (
                        <div className="text-rose-700 font-semibold pt-1">
                          Needs: {camp.needs}
                        </div>
                      )}
                      <div className="text-slate-500 pt-1">
                        Contact: {camp.contactPerson} ({camp.contactPhone})
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleSelectRouteToCamp(camp)}
                          className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-[11px] font-bold flex items-center justify-center gap-1"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Generate Offline Route to this Camp</span>
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* CAMPS LIST WITH NEEDS & DISTANCE */}
        <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
          {camps.length === 0 ? (
            <div className="card-clean text-center py-12 text-slate-400 text-xs">
              No registered camps in this sector yet. Click "Choose Disaster Location" or add a new camp.
            </div>
          ) : (
            camps.map((camp: Camp) => {
              const occupancyPct = Math.round((camp.currentOccupancy / camp.capacity) * 100);
              const isNearFull = occupancyPct >= 90;
              const distFromEpicenter = activeDisaster
                ? getDistanceKm(activeDisaster.latitude, activeDisaster.longitude, camp.latitude, camp.longitude)
                : null;
              const isRouteTarget = activeRoute?.destination.campId === camp.id;

              return (
                <div
                  key={camp.id}
                  className={`card-clean p-4 space-y-3 transition-colors ${
                    isRouteTarget ? 'border-2 border-teal-600 bg-teal-50/20' : 'hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{camp.name}</span>
                        {isRouteTarget && (
                          <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded font-bold">
                            Active Destination
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{camp.location}</span>
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        camp.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>

                  {distFromEpicenter !== null && (
                    <div className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                      📍 {distFromEpicenter} km from Disaster Epicenter
                    </div>
                  )}

                  {/* Occupancy bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Bed Occupancy</span>
                      <span className="font-bold">
                        {camp.currentOccupancy} / {camp.capacity} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${isNearFull ? 'bg-amber-500' : 'bg-teal-600'}`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Urgent Needs */}
                  <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1">
                    <div className="flex items-center gap-1 font-bold text-amber-800">
                      <Package className="w-3.5 h-3.5" />
                      <span>Urgent Relief Needs:</span>
                    </div>
                    <p className="text-slate-700 font-medium">{camp.needs || 'Supplies currently stocked'}</p>
                  </div>

                  {/* Actions & Offline Route Button */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSelectRouteToCamp(camp)}
                      className={`text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors ${
                        isRouteTarget
                          ? 'bg-teal-700 text-white'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{isRouteTarget ? 'Target Route Active' : 'Navigate Offline Here'}</span>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(camp)}
                        className="text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* UPDATE CAMP MODAL (COORDINATOR / ADMIN) */}
      {isEditing && selectedCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900">
              Update {selectedCamp.name} Needs & Capacity
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Shelter Capacity (Beds)
              </label>
              <input
                type="number"
                value={editCapacity}
                onChange={(e) => setEditCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Urgent Relief Supplies Needed (Food, Water, Medicine, Blankets)
              </label>
              <textarea
                rows={3}
                value={editNeeds}
                onChange={(e) => setEditNeeds(e.target.value)}
                placeholder="e.g. Diapers, Baby Food, ORS, Blankets, Insulin"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCamp}
                className="btn-primary text-xs font-bold px-4 py-2"
              >
                Save & Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
