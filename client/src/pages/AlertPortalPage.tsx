import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useDisaster } from '../context/DisasterContext';
import { CapAlert, EarthquakeRecord, WeatherOverviewData } from '../types';
import {
  Compass,
  MapPin,
  AlertTriangle,
  CloudRain,
  Navigation,
  Globe,
  Radio,
  Search,
  Filter,
  Activity,
  Layers,
  Thermometer,
  Wind,
  Droplets,
  Calendar,
  ExternalLink,
  ChevronRight,
  Shield,
  Zap,
  ArrowRight,
  RefreshCw,
  Play,
  Square,
  Volume2,
  FileText,
  Headphones,
  Maximize2,
  Info,
  List,
  Share2,
  ArrowUp,
  Sun,
  Cloud,
  CloudLightning,
} from 'lucide-react';

// Custom weather alert divIcon matching storm cloud icons in photo
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
      <span>⛈️</span>
      ${severity === 'RED_ALERT' ? '<div style="position:absolute; inset:-4px; border-radius:50%; background:rgba(220,38,38,0.35); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>' : ''}
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// User Live GPS Icon
const userGpsIcon = L.divIcon({
  className: 'custom-user-gps-marker',
  html: `<div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#1e4b88; border:2.5px solid white; box-shadow:0 0 12px rgba(30,75,136,0.8); font-size:14px;">
    <span>📍</span>
    <div style="position:absolute; inset:-6px; border-radius:50%; border:2px solid #3b82f6; animation:ping 1.6s infinite;"></div>
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

  // Top 4 Action Tabs matching photo
  const [capMode, setCapMode] = useState<'CURRENT' | 'ALL_INDIA' | 'STATE_WISE' | 'FORECAST'>('ALL_INDIA');
  const [selectedState, setSelectedState] = useState<string>('PAN INDIA');
  const [activeCategory, setActiveCategory] = useState<'IMD_FORECAST' | 'WEATHER'>('IMD_FORECAST');

  const [alerts, setAlerts] = useState<CapAlert[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeRecord[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherOverviewData | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<CapAlert | null>(null);

  // Live Location & Weather Tracking
  const [userLiveCoords, setUserLiveCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [activeLocationLabel, setActiveLocationLabel] = useState<string>('National Weather Monitor');
  const [locationSearchInput, setLocationSearchInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState<number>(5);

  // Live Meteorological Podcast / Audio Broadcast State
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [podcastSpeed, setPodcastSpeed] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  // Fetch real-time live weather for specific coordinates
  const fetchWeatherForLocation = async (lat: number, lng: number, locLabel: string) => {
    setWeatherLoading(true);
    setActiveLocationLabel(locLabel);
    try {
      const data = await api.getWeatherOverview(lat, lng, locLabel);
      setWeatherData(data);
    } catch (err) {
      console.error('Failed to fetch live weather:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

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
        const first = alertsRes.alerts[0];
        setSelectedAlert(first);
        await fetchWeatherForLocation(first.latitude, first.longitude, `${first.locationName}, ${first.state}`);
      } else {
        setSelectedAlert(null);
        await fetchWeatherForLocation(stateMeta.lat, stateMeta.lng, `${selectedState} Weather Center`);
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

  // Audio Podcast Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle clicking an alert from the middle column
  const handleAlertClick = (alert: CapAlert) => {
    setSelectedAlert(alert);
    setMapCenter([alert.latitude, alert.longitude]);
    setMapZoom(9);
    fetchWeatherForLocation(alert.latitude, alert.longitude, `${alert.locationName}, ${alert.state}`);
  };

  // Handle clicking an earthquake record
  const handleEarthquakeClick = (eq: EarthquakeRecord) => {
    setMapCenter([eq.latitude, eq.longitude]);
    setMapZoom(9);
    fetchWeatherForLocation(eq.latitude, eq.longitude, `Epicenter: ${eq.locationName}`);
  };

  // Handle 1-Click Disaster Sector Activation
  const handleActivateDisasterFromAlert = async (targetAlert: CapAlert) => {
    const match = disasters.find(
      d =>
        d.name.toLowerCase().includes(targetAlert.district.toLowerCase()) ||
        d.location.toLowerCase().includes(targetAlert.state.toLowerCase()) ||
        d.name.toLowerCase().includes(targetAlert.hazardType.toLowerCase())
    );

    if (match) {
      await switchDisaster(match.id);
      navigate('/camps');
    } else {
      try {
        await api.createCustomDisaster({
          name: `${targetAlert.hazardType} Emergency - ${targetAlert.locationName}`,
          description: targetAlert.description,
          location: `${targetAlert.locationName}, ${targetAlert.district}`,
          state: targetAlert.state,
          latitude: targetAlert.latitude,
          longitude: targetAlert.longitude,
          alertLevel: targetAlert.severity,
        });
        navigate('/camps');
      } catch (err: any) {
        alert(err.message || 'Error activating disaster sector');
      }
    }
  };

  // Handle Accurate Current Live GPS Location
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
        setMapZoom(11);
        fetchWeatherForLocation(latitude, longitude, 'Your Live GPS Location');
      },
      err => {
        console.warn('GPS location error:', err);
        alert('Could not acquire accurate GPS coordinates. Showing Pan-India.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle Live Meteorological Audio Podcast Playback
  const handleTogglePodcast = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Web Speech Synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingPodcast) {
      window.speechSynthesis.cancel();
      setIsPlayingPodcast(false);
      return;
    }

    const script =
      weatherData?.audioPodcastScript ||
      `GlobalX live meteorological broadcast for ${weatherData?.locationName || activeLocationLabel}. Current temperature is ${weatherData?.current.tempCelsius} degrees Celsius with ${weatherData?.current.condition}. Wind is blowing at ${weatherData?.current.windKmph} kilometers per hour from the ${weatherData?.current.windDirection}. Relative humidity is ${weatherData?.current.humidityPercent} percent. All emergency responders, monitor GlobalX updates.`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = podcastSpeed;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('India') || v.name.includes('English'))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => setIsPlayingPodcast(true);
    utterance.onend = () => setIsPlayingPodcast(false);
    utterance.onerror = () => setIsPlayingPodcast(false);

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleSearchLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationSearchInput.trim()) return;
    const term = locationSearchInput.trim().toLowerCase();
    const matched = alerts.find(
      a =>
        a.locationName.toLowerCase().includes(term) ||
        a.district.toLowerCase().includes(term) ||
        a.state.toLowerCase().includes(term)
    );
    if (matched) {
      handleAlertClick(matched);
    } else {
      alert(`Location "${locationSearchInput}" not found in current alert zones.`);
    }
  };

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
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-pink-300 transition-colors">
              <span>📊</span> DASHBOARD
            </Link>
            <Link to="/alerts" className="flex items-center gap-1 hover:text-pink-300 text-pink-300 transition-colors">
              <span>📡</span> RSS FEED
            </Link>
            <Link to="/camps" className="flex items-center gap-1 hover:text-pink-300 transition-colors">
              <span>ℹ️</span> ABOUT
            </Link>
            <Link to="/safe-checkin" className="flex items-center gap-1 hover:text-pink-300 transition-colors">
              <span>🛡️</span> DOS &amp; DON'TS
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

          {/* Card 4: FORECAST */}
          <button
            type="button"
            onClick={() => setCapMode('FORECAST')}
            className={`bg-white/95 hover:bg-white border border-violet-100 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-clay hover:shadow-xl hover:-translate-y-0.5 ${
              capMode === 'FORECAST' ? 'ring-2 ring-cyan-500 border-cyan-400 bg-cyan-50/20' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-white flex items-center justify-center mb-1.5 shadow-md shadow-cyan-500/25">
              <CloudRain className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              FORECAST &amp; RADAR
            </span>
            <span className="text-[9px] text-blue-600 font-bold mt-0.5">Live Meteorological Feed</span>
          </button>
        </div>

        {/* 3. SUB-FILTER BAR (MATCHING LAPTOP PHOTO) */}
        <div className="bg-white/90 backdrop-blur-md border border-violet-100 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-clay-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCategory('IMD_FORECAST')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'IMD_FORECAST'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-3d-badge'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              IMD Forecast
            </button>

            <button
              onClick={() => setActiveCategory('WEATHER')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'WEATHER'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-3d-badge-pink'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Live Weather
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
              Live CAP Telemetry Feed
            </span>
          </div>
        </div>

        {/* 4. MAIN THREE-COLUMN SECTION (MATCHING PHOTO LAYOUT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          {/* COLUMN 1: INTERACTIVE GEOGRAPHIC MAP (7 COLS / ~58%) */}
          <div className="lg:col-span-7 bg-white border border-violet-100/90 rounded-3xl p-2 h-[680px] relative overflow-hidden shadow-clay flex flex-col">
            {/* Floating Tools on Left of Map matching photo */}
            <div className="absolute left-4 top-20 z-10 flex flex-col gap-2">
              <button
                type="button"
                className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                title="Map Tools"
              >
                🛠️
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-lg hover:scale-105 transition-transform"
                title="Share"
              >
                f
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-600 text-white flex items-center justify-center font-bold text-xs shadow-lg hover:scale-105 transition-transform"
                title="Broadcast Feed"
              >
                ▶
              </button>
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

            {/* Floating Fullscreen button on Top Right matching photo */}
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
                          <button
                            type="button"
                            onClick={() =>
                              fetchWeatherForLocation(userLiveCoords.lat, userLiveCoords.lng, 'Your Live GPS Location')
                            }
                            className="w-full mt-1.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-[10px] shadow-sm"
                          >
                            Sync Weather &amp; Podcast Here
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}

                {/* Plot active CAP storm warnings matching yellow cloud icons in photo */}
                {alerts.map(alert => (
                  <Marker
                    key={alert.id}
                    position={[alert.latitude, alert.longitude]}
                    icon={weatherIcon(alert.hazardType, alert.severity)}
                  >
                    <Popup>
                      <div className="p-1 space-y-1.5 text-xs max-w-[240px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-lg bg-[#e67e22] text-white">
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
                            onClick={() =>
                              fetchWeatherForLocation(
                                alert.latitude,
                                alert.longitude,
                                `${alert.locationName}, ${alert.state}`
                              )
                            }
                            className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-[10px] shadow-sm"
                          >
                            Sync Weather &amp; Podcast Here
                          </button>
                          <button
                            type="button"
                            onClick={() => handleActivateDisasterFromAlert(alert)}
                            className="w-full py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold text-[10px] shadow-sm"
                          >
                            Activate Sector &amp; Relief Camps
                          </button>
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
                          {eq.depthKm} km &bull; {eq.timestamp}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            fetchWeatherForLocation(eq.latitude, eq.longitude, `Epicenter: ${eq.locationName}`)
                          }
                          className="w-full mt-1.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-[10px] shadow-sm"
                        >
                          Sync Epicenter Weather &amp; Podcast
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* COLUMN 2: WEATHER FORECAST (MIDDLE COLUMN MATCHING PHOTO) */}
          <div className="lg:col-span-2 bg-white/95 border border-violet-100 rounded-3xl overflow-hidden flex flex-col h-[680px] shadow-clay">
            {/* Header Bar matching photo with gradient */}
            <div className="bg-gradient-to-r from-violet-800 via-indigo-900 to-purple-800 text-white px-3.5 py-3 text-center text-xs font-black uppercase tracking-wider border-b border-pink-500/40 flex items-center justify-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-pink-300" />
              <span>Weather Forecast</span>
            </div>

            {/* Vertical List of Warm Amber Cards matching photo */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {alerts.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No active warnings.
                </div>
              ) : (
                alerts.map(a => {
                  const isSelected = selectedAlert?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleAlertClick(a)}
                      className={`w-full text-center p-3 rounded-2xl transition-all text-xs ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-3d-badge-pink ring-2 ring-pink-300'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
                      }`}
                    >
                      <div className="font-black text-[12px] leading-tight">
                        {a.hazardType === 'THUNDERSTORM' ? 'Thunderstorm' : a.hazardType}
                      </div>
                      <div className="text-[11px] font-semibold mt-0.5 opacity-95">
                        {a.locationName}, {a.state}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 3: RIGHT SIDEBAR (RECENT EARTHQUAKES & WEATHER OVERVIEW) */}
          <div className="lg:col-span-3 space-y-3">
            {/* 1. RECENT EARTHQUAKES WIDGET (MATCHING PHOTO) */}
            <div className="bg-white/95 border border-violet-100 rounded-3xl overflow-hidden shadow-clay">
              {/* Header Bar */}
              <div className="bg-gradient-to-r from-violet-800 via-indigo-900 to-purple-800 text-white px-3.5 py-2.5 text-xs font-black uppercase tracking-wider border-b border-pink-500/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-pink-300" />
                  <span>Recent Earthquakes</span>
                </div>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">USGS / NCS</span>
              </div>

              {/* Grid with Green & Dark Cards matching photo */}
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

            {/* 2. WEATHER OVERVIEW WIDGET (MATCHING PHOTO) */}
            <div className="bg-white/95 border border-violet-100 rounded-3xl overflow-hidden shadow-clay">
              {/* Header Bar */}
              <div className="bg-gradient-to-r from-violet-800 via-indigo-900 to-purple-800 text-white px-3.5 py-2.5 text-xs font-black uppercase tracking-wider border-b border-pink-500/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>Weather Overview</span>
                </div>
                <span className="text-[10px] bg-pink-500/30 text-pink-200 border border-pink-400/40 px-2 py-0.5 rounded-full font-bold">OPEN-METEO LIVE</span>
              </div>

              <div className="p-3.5 space-y-3">
                {/* Search input with location pin on left and magnifying glass on right */}
                <form onSubmit={handleSearchLocation} className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    📍
                  </span>
                  <input
                    type="text"
                    value={locationSearchInput}
                    onChange={e => setLocationSearchInput(e.target.value)}
                    placeholder={weatherData?.locationName || 'Search location...'}
                    className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-violet-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Main Temperature Display matching photo (32°C haze) */}
                {weatherData && (
                  <div className="flex items-center justify-between px-1 bg-gradient-to-br from-violet-50 to-pink-50/50 p-2.5 rounded-2xl border border-violet-100">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">⛅</div>
                      <div>
                        <div className="text-3xl font-black text-slate-900 tracking-tight">
                          {weatherData.current.tempCelsius}&deg;C
                        </div>
                        <div className="text-xs text-violet-700 font-bold capitalize">
                          {weatherData.current.condition}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[10px] font-mono font-bold text-slate-600 space-y-0.5">
                      <div>💧 {weatherData.current.humidityPercent}%</div>
                      <div>💨 {weatherData.current.windKmph} km/h</div>
                      <div>🧭 {weatherData.current.windDirection}</div>
                    </div>
                  </div>
                )}

                {/* Hourly Forecast Section matching photo */}
                {weatherData && (
                  <div className="border-t border-slate-100 pt-2">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                      Hourly Forecast
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                      {weatherData.hourly.slice(0, 3).map((h, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 p-2 rounded-xl border border-violet-100"
                        >
                          <div className="text-[9px] text-slate-500 font-bold">{h.time}</div>
                          <div className="text-xs my-0.5">🌧️</div>
                          <div className="text-xs font-black text-slate-800">
                            {h.tempCelsius}&deg;
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Forecast Section matching photo */}
                {weatherData && (
                  <div className="border-t border-slate-100 pt-2">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      Daily Forecast
                    </div>
                    <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50 rounded-xl border border-violet-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 text-[11px]">Today</span>
                        <span>🌧️</span>
                      </div>
                      <div className="font-mono text-right text-[11px]">
                        <span className="text-slate-800 font-black">{weatherData.daily.today.high}&deg; High</span>
                        <span className="text-slate-400 mx-1.5">|</span>
                        <span className="text-slate-500 font-bold">{weatherData.daily.today.low}&deg; Low</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🎙️ METEOROLOGICAL PODCAST & BROADCAST AUDIO PLAYER */}
                <div className="bg-gradient-to-br from-violet-950 via-indigo-950 to-purple-950 text-white p-3.5 rounded-2xl border border-pink-500/40 space-y-2.5 shadow-clay">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Headphones className="w-4 h-4 text-pink-400 animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-pink-300">
                        LIVE WEATHER PODCAST
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                      {isPlayingPodcast ? 'ON AIR' : 'SYNTHESIZED'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTogglePodcast}
                      className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-3d-badge ${
                        isPlayingPodcast
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-3d-badge-pink'
                          : 'bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 hover:brightness-105 text-slate-950'
                      }`}
                    >
                      {isPlayingPodcast ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop Broadcast</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Listen to Live Podcast</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPodcastSpeed(podcastSpeed === 1.0 ? 1.25 : 1.0)}
                      className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-slate-200 border border-white/10"
                    >
                      {podcastSpeed}x
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="w-full text-center text-[10px] text-pink-200/90 hover:text-white flex items-center justify-center gap-1 pt-0.5 font-bold"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{showTranscript ? 'Hide Broadcast Script' : 'Read Live Podcast Script'}</span>
                  </button>

                  {showTranscript && weatherData && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-[10px] leading-relaxed text-slate-200 max-h-28 overflow-y-auto">
                      {weatherData.audioPodcastScript}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
