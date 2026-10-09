import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useDisaster } from '../context/DisasterContext';
import { CapAlert, EarthquakeRecord } from '../types';
import {
  Compass,
  MapPin,
  AlertTriangle,
  Navigation,
  Globe,
  Radio,
  Search,
  Filter,
  Activity,
  Layers,
  Phone,
  PhoneCall,
  Shield,
  Zap,
  ArrowRight,
  RefreshCw,
  Maximize2,
  List,
  ArrowUp,
  ShieldAlert,
  LifeBuoy,
  HeartHandshake,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

// Custom weather alert divIcon matching storm cloud icons
const weatherIcon = (hazardType: string, severity: string) => {
  const bgColor =
    severity === 'RED_ALERT'
      ? '#dc2626'
      : severity === 'ORANGE_ALERT'
      ? '#ea580c'
      : '#f59e0b';

  return L.divIcon({
    className: 'custom-weather-marker',
    html: `<div style="position:relative; width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:${bgColor}; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.35); font-size:14px; cursor:pointer;">
      <span>⚠️</span>
      ${severity === 'RED_ALERT' ? '<div style="position:absolute; inset:-4px; border-radius:50%; background:rgba(220,38,38,0.35); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>' : ''}
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// User Live GPS Icon
const userGpsIcon = L.divIcon({
  className: 'custom-user-gps-marker',
  html: `<div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#7c3aed; border:2.5px solid white; box-shadow:0 0 12px rgba(124,58,237,0.8); font-size:14px;">
    <span>📍</span>
    <div style="position:absolute; inset:-6px; border-radius:50%; border:2px solid #a855f7; animation:ping 1.6s infinite;"></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Map recentering helper
function AlertMapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center[0], center[1], zoom]);
  return null;
}

// State Geographic Centers
const STATE_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  'PAN INDIA': { lat: 20.5937, lng: 78.9629, zoom: 5 },
  'Andhra Pradesh': { lat: 15.9129, lng: 79.7400, zoom: 7 },
  'Kerala': { lat: 10.8505, lng: 76.2711, zoom: 8 },
  'Tamil Nadu': { lat: 11.1271, lng: 78.6569, zoom: 7 },
  'Tripura': { lat: 23.8315, lng: 91.2868, zoom: 8 },
  'Assam': { lat: 26.2006, lng: 92.9376, zoom: 7 },
  'West Bengal': { lat: 22.9868, lng: 87.8550, zoom: 7 },
  'Maharashtra': { lat: 19.7515, lng: 75.7139, zoom: 7 },
  'Uttarakhand': { lat: 30.0668, lng: 79.0193, zoom: 8 },
  'Rajasthan': { lat: 27.0238, lng: 74.2179, zoom: 6 },
};

export const AlertPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchDisaster, disasters } = useDisaster();

  // Top Action Tabs
  const [capMode, setCapMode] = useState<'CURRENT' | 'ALL_INDIA' | 'STATE_WISE' | 'EVACUATION'>('ALL_INDIA');
  const [selectedState, setSelectedState] = useState<string>('PAN INDIA');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'RED_ALERT' | 'ORANGE_ALERT'>('ALL');

  const [alerts, setAlerts] = useState<CapAlert[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeRecord[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<CapAlert | null>(null);

  // Live Location Tracking
  const [userLiveCoords, setUserLiveCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState<number>(5);

  const statesList = [
    'PAN INDIA',
    'Andhra Pradesh',
    'Kerala',
    'Tamil Nadu',
    'Tripura',
    'Assam',
    'West Bengal',
    'Maharashtra',
    'Uttarakhand',
    'Rajasthan',
  ];

  // Initial and state-based data loading
  const fetchAlertsData = async () => {
    setIsLoading(true);
    try {
      const [alertsRes, eqRes] = await Promise.all([
        api.getCapAlerts({ state: selectedState }),
        api.getEarthquakes(),
      ]);
      setAlerts(alertsRes.alerts);
      setEarthquakes(eqRes.earthquakes);

      const stateMeta = STATE_CENTERS[selectedState] || STATE_CENTERS['PAN INDIA'];
      setMapCenter([stateMeta.lat, stateMeta.lng]);
      setMapZoom(stateMeta.zoom);

      if (alertsRes.alerts.length > 0) {
        setSelectedAlert(alertsRes.alerts[0]);
      } else {
        setSelectedAlert(null);
      }
    } catch (err) {
      console.error('Error fetching alerts feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [selectedState]);

  const handleAlertClick = (alert: CapAlert) => {
    setSelectedAlert(alert);
    setMapCenter([alert.latitude, alert.longitude]);
    setMapZoom(9);
  };

  const handleEarthquakeClick = (eq: EarthquakeRecord) => {
    setMapCenter([eq.latitude, eq.longitude]);
    setMapZoom(8);
  };

  const handleCurrentLocationAlert = () => {
    setCapMode('CURRENT');
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLiveCoords({ lat: latitude, lng: longitude, accuracy });
        setMapCenter([latitude, longitude]);
        setMapZoom(10);
      },
      err => {
        console.warn('GPS location error:', err);
        alert('Could not acquire GPS coordinates. Showing Pan-India.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleActivateDisasterFromAlert = (alert: CapAlert) => {
    const matchedDisaster = disasters.find(
      d =>
        d.state?.toLowerCase() === alert.state.toLowerCase() ||
        d.location.toLowerCase().includes(alert.district.toLowerCase()) ||
        alert.locationName.toLowerCase().includes(d.location.toLowerCase())
    );

    if (matchedDisaster) {
      switchDisaster(matchedDisaster.id);
      navigate('/camps');
    } else {
      navigate('/camps');
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-10 font-sans text-slate-800">
      {/* 1. TOP HEADER BAR */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-950 to-purple-900 text-white px-4 py-3 shadow-md border-b-2 border-pink-500">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Portal Title on Left with 3D GX Badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-violet-500 text-white font-black text-xs flex items-center justify-center shadow-3d-badge-pink">
              GX
            </div>
            <div>
              <span className="font-display text-lg sm:text-xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-pink-100 to-violet-200 bg-clip-text text-transparent">
                GLOBALX NATIONAL DISASTER ALERT PORTAL
              </span>
              <span className="text-[10px] text-pink-300 font-bold block sm:inline sm:ml-2">
                (Common Alerting Protocol)
              </span>
            </div>
          </div>

          {/* Nav Links on Right */}
          <nav className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-100">
            <Link to="/" className="flex items-center gap-1 hover:text-pink-300 transition-colors">
              <span>🏠</span> HOME
            </Link>
            <Link to="/camps" className="flex items-center gap-1 hover:text-pink-300 transition-colors">
              <span>🏕️</span> RELIEF CAMPS
            </Link>
            <Link to="/search" className="flex items-center gap-1 hover:text-pink-300 transition-colors">
              <span>🔍</span> FIND LOVED ONES
            </Link>
            <Link to="/safe-checkin" className="flex items-center gap-1 hover:text-pink-300 transition-colors">
              <span>🛡️</span> ONE-TAP SAFE
            </Link>
            <button
              type="button"
              onClick={() => fetchAlertsData()}
              className="bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors shadow-clay-sm"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 pt-3.5 space-y-3.5">
        {/* 2. TOP 4 TAB BUTTONS (CLAYMORPHIC ELEVATION WITH GRADIENT BADGES) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: CURRENT LOCATION CAP ALERT */}
          <button
            type="button"
            onClick={handleCurrentLocationAlert}
            className={`bg-white/95 hover:bg-white border border-violet-100 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-clay hover:shadow-xl hover:-translate-y-0.5 ${
              capMode === 'CURRENT' ? 'ring-2 ring-pink-500 border-pink-400 bg-pink-50/20' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mb-1.5 shadow-3d-badge-pink">
              <Navigation className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              CURRENT LOCATION CAP ALERT
            </span>
            <span className="text-[9px] text-pink-600 font-bold mt-0.5">Live GPS Sync</span>
          </button>

          {/* Card 2: ALL INDIA CAP ALERT */}
          <button
            type="button"
            onClick={() => {
              setCapMode('ALL_INDIA');
              setSelectedState('PAN INDIA');
            }}
            className={`bg-white/95 hover:bg-white border border-violet-100 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-clay hover:shadow-xl hover:-translate-y-0.5 ${
              capMode === 'ALL_INDIA' ? 'ring-2 ring-violet-500 border-violet-400 bg-violet-50/20' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center mb-1.5 shadow-3d-badge">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              ALL INDIA CAP ALERT
            </span>
            <span className="text-[9px] text-violet-600 font-bold mt-0.5">Pan-India Radar</span>
          </button>

          {/* Card 3: STATE WISE CAP ALERT */}
          <button
            type="button"
            onClick={() => setCapMode('STATE_WISE')}
            className={`bg-white/95 hover:bg-white border border-violet-100 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-clay hover:shadow-xl hover:-translate-y-0.5 ${
              capMode === 'STATE_WISE' ? 'ring-2 ring-amber-500 border-amber-400 bg-amber-50/20' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mb-1.5 shadow-md shadow-amber-500/25">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              STATE WISE CAP ALERT
            </span>
            <span className="text-[9px] text-amber-600 font-bold mt-0.5">Regional Zones</span>
          </button>

          {/* Card 4: EVACUATION PROTOCOL */}
          <button
            type="button"
            onClick={() => setCapMode('EVACUATION')}
            className={`bg-white/95 hover:bg-white border border-violet-100 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-clay hover:shadow-xl hover:-translate-y-0.5 ${
              capMode === 'EVACUATION' ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/20' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-1.5 shadow-md shadow-emerald-500/25">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              EVACUATION PROTOCOL
            </span>
            <span className="text-[9px] text-emerald-600 font-bold mt-0.5">Civil Defense Guidelines</span>
          </button>
        </div>

        {/* 3. SUB-FILTER BAR */}
        <div className="bg-white/90 backdrop-blur-md border border-violet-100 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-clay-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                severityFilter === 'ALL'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-3d-badge'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Alerts ({alerts.length})
            </button>

            <button
              onClick={() => setSeverityFilter('RED_ALERT')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                severityFilter === 'RED_ALERT'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-3d-badge-pink'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Red Alerts
            </button>

            <button
              onClick={() => setSeverityFilter('ORANGE_ALERT')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                severityFilter === 'ORANGE_ALERT'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Orange Warnings
            </button>

            {/* State selector dropdown */}
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="px-3 py-1.5 bg-white border border-violet-200 rounded-xl text-xs font-black text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-2xs"
            >
              {statesList.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-200/60 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live CAP Telemetry Feed &bull; 0 Rumors
            </span>
          </div>
        </div>

        {/* 4. MAIN THREE-COLUMN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* COLUMN 1: INTERACTIVE GEOGRAPHIC MAP (7 COLS / ~58%) */}
          <div className="lg:col-span-7 bg-white border border-violet-100/90 rounded-3xl p-2 h-[680px] relative overflow-hidden shadow-clay flex flex-col">
            {/* Floating Tools on Left of Map */}
            <div className="absolute left-4 top-20 z-10 flex flex-col gap-2">
              <Link
                to="/camps"
                className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                title="Relief Camps"
              >
                🏕️
              </Link>
              <Link
                to="/safe-checkin"
                className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center font-black text-xs shadow-lg hover:scale-105 transition-transform"
                title="I Am Safe"
              >
                🛡️
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMapCenter([20.5937, 78.9629]);
                  setMapZoom(5);
                }}
                className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-600 to-slate-800 text-white flex flex-col items-center justify-center text-[8px] font-black shadow-lg hover:scale-105 transition-transform"
                title="Reset to Top View"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>TOP</span>
              </button>
            </div>

            {/* Floating Fullscreen button on Top Right */}
            <div className="absolute right-4 top-4 z-10">
              <button
                type="button"
                onClick={() => {
                  setMapCenter([20.5937, 78.9629]);
                  setMapZoom(mapZoom === 5 ? 7 : 5);
                }}
                className="bg-white/95 hover:bg-white border border-violet-200 p-2 rounded-2xl shadow-clay-sm text-slate-700 hover:text-violet-700 transition-colors"
                title="Toggle Zoom"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden relative border border-slate-200/60">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                className="w-full h-full rounded-2xl z-0"
              >
                <AlertMapRecenter center={mapCenter} zoom={mapZoom} />

                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Plot User Live GPS Location */}
                {userLiveCoords && (
                  <>
                    <Circle
                      center={[userLiveCoords.lat, userLiveCoords.lng]}
                      radius={userLiveCoords.accuracy || 250}
                      pathOptions={{
                        color: '#7c3aed',
                        fillColor: '#a855f7',
                        fillOpacity: 0.15,
                        weight: 2,
                      }}
                    />
                    <Marker
                      position={[userLiveCoords.lat, userLiveCoords.lng]}
                      icon={userGpsIcon}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 text-xs">
                          <strong className="block text-slate-900 font-bold">
                            📍 Your Live GPS Location
                          </strong>
                          <div className="font-mono text-[11px] text-slate-600">
                            {userLiveCoords.lat.toFixed(5)}° N, {userLiveCoords.lng.toFixed(5)}° E
                          </div>
                          <Link
                            to="/safe-checkin"
                            className="block w-full mt-1.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center rounded-xl font-bold text-[10px] shadow-sm"
                          >
                            Mark Safe at This Location
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}

                {/* Plot active CAP storm warnings */}
                {filteredAlerts.map(alert => (
                  <Marker
                    key={alert.id}
                    position={[alert.latitude, alert.longitude]}
                    icon={weatherIcon(alert.hazardType, alert.severity)}
                  >
                    <Popup>
                      <div className="p-1 space-y-1.5 text-xs max-w-[240px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg text-white ${
                            alert.severity === 'RED_ALERT' ? 'bg-red-600' : 'bg-amber-600'
                          }`}>
                            {alert.severity.replace('_', ' ')}
                          </span>
                          <span className="font-bold text-slate-500 font-mono text-[10px]">
                            {alert.hazardType}
                          </span>
                        </div>

                        <strong className="text-slate-900 block font-bold leading-tight">
                          {alert.headline}
                        </strong>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {alert.description}
                        </p>

                        <div className="text-slate-500 text-[10px]">
                          📍 <strong>{alert.locationName}</strong>, {alert.district} ({alert.state})
                        </div>

                        <div className="pt-1 flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleActivateDisasterFromAlert(alert)}
                            className="w-full py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold text-[10px] shadow-sm flex items-center justify-center gap-1"
                          >
                            <span>Open Sector Relief Camps</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <Link
                            to="/report-sighting"
                            className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-center rounded-xl font-bold text-[10px] border border-slate-300"
                          >
                            Report Sighting in Zone
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Plot recent earthquakes on map */}
                {earthquakes.map(eq => (
                  <Marker
                    key={eq.id}
                    position={[eq.latitude, eq.longitude]}
                    icon={L.divIcon({
                      className: 'eq-marker',
                      html: `<div style="width:26px; height:26px; border-radius:50%; background:#10b981; border:2.5px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:900; box-shadow:0 3px 8px rgba(0,0,0,0.3);">${eq.magnitude}</div>`,
                      iconSize: [26, 26],
                      iconAnchor: [13, 13],
                    })}
                  >
                    <Popup>
                      <div className="p-1 text-xs space-y-1">
                        <strong className="block text-slate-900 text-sm">
                          {eq.magnitude} Magnitude Earthquake
                        </strong>
                        <p className="text-slate-600">{eq.locationName}</p>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {eq.depthKm} km depth &bull; {eq.timestamp}
                        </div>
                        <Link
                          to="/camps"
                          className="block w-full mt-1.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center rounded-xl font-bold text-[10px] shadow-sm"
                        >
                          Check Shelters Near Epicenter
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* COLUMN 2: ACTIVE HAZARD BULLETINS (2 COLS) */}
          <div className="lg:col-span-2 bg-white/95 border border-violet-100 rounded-3xl overflow-hidden flex flex-col h-[680px] shadow-clay">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-violet-800 via-indigo-900 to-purple-800 text-white px-3.5 py-3 text-center text-xs font-black uppercase tracking-wider border-b border-pink-500/40 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-pink-300" />
              <span>Hazard Bulletins ({filteredAlerts.length})</span>
            </div>

            {/* Vertical List of Alert Cards */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs px-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <strong>No Active Hazards</strong>
                  <p className="text-[11px] mt-1 text-slate-500">All sectors currently operating under normal status.</p>
                </div>
              ) : (
                filteredAlerts.map(a => {
                  const isSelected = selectedAlert?.id === a.id;
                  const isRed = a.severity === 'RED_ALERT';
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleAlertClick(a)}
                      className={`w-full text-left p-3 rounded-2xl transition-all text-xs border ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-3d-badge-pink ring-2 ring-pink-300 border-pink-400'
                          : isRed
                          ? 'bg-red-50 hover:bg-red-100/80 border-red-200 text-slate-900 shadow-xs'
                          : 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-slate-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isRed
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}>
                          {a.severity.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-pink-100' : 'text-slate-500'}`}>
                          {a.hazardType}
                        </span>
                      </div>
                      <div className="font-bold text-[12px] leading-tight">
                        {a.headline}
                      </div>
                      <div className={`text-[11px] mt-1 font-medium ${isSelected ? 'text-pink-100' : 'text-slate-600'}`}>
                        📍 {a.locationName}, {a.state}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: RIGHT SIDEBAR (DIRECTIVES, HELPLINES, & RECENT SEISMIC) */}
          <div className="lg:col-span-3 space-y-3">
            {/* 1. SELECTED HAZARD DIRECTIVE CARD */}
            {selectedAlert ? (
              <div className="bg-white/95 border border-violet-100 rounded-3xl overflow-hidden shadow-clay p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertOctagon className={`w-4 h-4 ${selectedAlert.severity === 'RED_ALERT' ? 'text-red-600' : 'text-amber-500'}`} />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Evacuation Directive
                    </span>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white ${
                    selectedAlert.severity === 'RED_ALERT' ? 'bg-red-600' : 'bg-amber-500'
                  }`}>
                    {selectedAlert.severity.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-sm text-slate-950 leading-snug">
                    {selectedAlert.headline}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {selectedAlert.description}
                  </p>
                </div>

                {/* Official Directive instruction */}
                <div className="bg-gradient-to-br from-violet-50 to-pink-50/50 p-3 rounded-2xl border border-violet-200/80 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-violet-800 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-violet-600" />
                    <span>Official Civil Defense Directive:</span>
                  </span>
                  <p className="text-[11px] font-semibold text-slate-800 leading-relaxed">
                    {selectedAlert.instruction || 'Follow local authorities evacuation orders. Proceed immediately to designated emergency shelters.'}
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleActivateDisasterFromAlert(selectedAlert)}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-3d-badge flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Locate Nearest Relief Camps</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    to="/safe-checkin"
                    className="block w-full py-2 px-3 bg-white hover:bg-slate-50 border border-violet-200 text-violet-800 text-center rounded-xl font-bold text-xs shadow-xs"
                  >
                    Mark Myself Safe in This Sector
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white/95 border border-violet-100 rounded-3xl p-5 text-center text-xs text-slate-500 shadow-clay">
                Select any active hazard warning on the map or list to read immediate civil defense directives.
              </div>
            )}

            {/* 2. EMERGENCY HELPLINES & CONTROL ROOMS */}
            <div className="bg-white/95 border border-violet-100 rounded-3xl overflow-hidden shadow-clay">
              <div className="bg-gradient-to-r from-violet-800 via-indigo-900 to-purple-800 text-white px-3.5 py-2.5 text-xs font-black uppercase tracking-wider border-b border-pink-500/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-pink-300" />
                  <span>24/7 Emergency Helplines</span>
                </div>
                <span className="text-[9px] bg-pink-500/30 text-pink-200 border border-pink-400/40 px-2 py-0.5 rounded-full font-bold">
                  TOLL-FREE
                </span>
              </div>

              <div className="p-3 space-y-2">
                <a
                  href="tel:112"
                  className="p-2.5 bg-slate-50 hover:bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 block">National Emergency Number</span>
                    <span className="text-[10px] text-slate-500">Police &bull; Fire &bull; Ambulance</span>
                  </div>
                  <strong className="text-sm font-black text-pink-600 font-mono">112</strong>
                </a>

                <a
                  href="tel:01124363260"
                  className="p-2.5 bg-slate-50 hover:bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 block">NDRF HQ Disaster Control</span>
                    <span className="text-[10px] text-slate-500">Search &amp; Rescue Deployments</span>
                  </div>
                  <strong className="text-xs font-black text-violet-700 font-mono">011-24363260</strong>
                </a>

                <a
                  href="tel:1070"
                  className="p-2.5 bg-slate-50 hover:bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 block">State Disaster Authority (SDMA)</span>
                    <span className="text-[10px] text-slate-500">Regional Emergency Desk</span>
                  </div>
                  <strong className="text-xs font-black text-violet-700 font-mono">1070</strong>
                </a>

                <a
                  href="tel:1077"
                  className="p-2.5 bg-slate-50 hover:bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 block">District Operations (DEOC)</span>
                    <span className="text-[10px] text-slate-500">Local Relief Camp Officers</span>
                  </div>
                  <strong className="text-xs font-black text-violet-700 font-mono">1077</strong>
                </a>
              </div>
            </div>

            {/* 3. RECENT SEISMIC MONITOR */}
            <div className="bg-white/95 border border-violet-100 rounded-3xl overflow-hidden shadow-clay">
              <div className="bg-gradient-to-r from-violet-800 via-indigo-900 to-purple-800 text-white px-3.5 py-2.5 text-xs font-black uppercase tracking-wider border-b border-pink-500/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-pink-300" />
                  <span>Recent Earthquakes</span>
                </div>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">NCS / USGS</span>
              </div>

              <div className="p-3 grid grid-cols-2 gap-2.5">
                {earthquakes.slice(0, 2).map((eq, i) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => handleEarthquakeClick(eq)}
                    className={`p-3 rounded-2xl text-left transition-all shadow-sm ${
                      i === 0
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20'
                        : 'bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white'
                    }`}
                  >
                    <div className="font-black text-xs">
                      {eq.magnitude} Magnitude
                    </div>
                    <div className="text-[10px] truncate mt-0.5 font-bold">
                      📍 {eq.locationName.split(',')[0]}
                    </div>
                    <div className="text-[9px] opacity-80 font-mono mt-0.5">
                      {eq.timestamp.slice(0, 11)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
