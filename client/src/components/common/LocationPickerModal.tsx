import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext';
import { api } from '../../services/api';
import { Disaster } from '../../types';
import {
  MapPin,
  Navigation,
  X,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Compass,
  Radio,
  Building,
  RefreshCw,
} from 'lucide-react';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { disasters, activeDisaster, switchDisaster, refreshData } = useDisaster();

  const [activeTab, setActiveTab] = useState<'SELECT' | 'GPS' | 'CUSTOM'>('SELECT');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsData, setGpsData] = useState<{
    userCoordinates: { latitude: number; longitude: number };
    nearestDisaster: any;
    allDisastersRanked: any[];
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Custom location form state
  const [customForm, setCustomForm] = useState({
    name: '',
    location: '',
    state: '',
    latitude: '',
    longitude: '',
    alertLevel: 'RED_ALERT',
  });
  const [customLoading, setCustomLoading] = useState(false);

  // Quick preset Indian coordinates helper
  const presetCities = [
    { name: 'Bengaluru Floods Sector', location: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
    { name: 'Mumbai Monsoon High Tide', location: 'Mumbai Coastal', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
    { name: 'Kolkata Cyclone Delta', location: 'Kolkata & Sundarbans', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
    { name: 'Uttarakhand Flash Flood Area', location: 'Rishikesh & Chamoli', state: 'Uttarakhand', lat: 30.0869, lng: 78.2676 },
  ];

  const handleSelectDisaster = async (id: string) => {
    try {
      await switchDisaster(id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error switching location');
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await api.getNearestDisasterByGps(latitude, longitude);
          setGpsData(res);
        } catch (err: any) {
          setGpsError(err.message || 'Failed to match nearest disaster');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(`GPS Access Denied: ${err.message}. You can manually choose a location from the presets.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.name || !customForm.location || !customForm.latitude || !customForm.longitude) {
      alert('Please fill name, location, latitude and longitude.');
      return;
    }

    setCustomLoading(true);
    try {
      await api.createCustomDisaster({
        name: customForm.name,
        location: customForm.location,
        state: customForm.state,
        latitude: parseFloat(customForm.latitude),
        longitude: parseFloat(customForm.longitude),
        alertLevel: customForm.alertLevel,
      });
      await refreshData();
      alert(`🎉 New disaster location set: ${customForm.name}! Map and rosters scoped.`);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error creating custom disaster');
    } finally {
      setCustomLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>Select Disaster Location & Live Coordinates</span>
                <span className="text-[10px] font-bold uppercase bg-teal-500/30 text-teal-300 px-2 py-0.5 rounded-full">
                  Live GPS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose the active emergency epicenter to load local relief camps and live coordinates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Location Bar */}
        {activeDisaster && (
          <div className="bg-teal-50/80 border-b border-teal-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-teal-950">
              <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>Current Active Place: </span>
              <strong className="text-teal-900 font-bold">{activeDisaster.name}</strong>
            </div>
            <div className="font-mono text-teal-800 font-semibold bg-white px-2 py-0.5 rounded border border-teal-200">
              📍 {activeDisaster.latitude.toFixed(4)}° N, {activeDisaster.longitude.toFixed(4)}° E
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('SELECT')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all ${
              activeTab === 'SELECT'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Disaster Zones ({disasters.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('GPS');
              if (!gpsData) handleDetectGPS();
            }}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'GPS'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-teal-600" />
            <span>Detect My Live GPS</span>
          </button>
          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'CUSTOM'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Place</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[420px] overflow-y-auto">
          {/* TAB 1: PRESET DISASTER ZONES */}
          {activeTab === 'SELECT' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Click any emergency location to instantly focus the entire system, live map, and relief rosters on that area:
              </p>

              {disasters.map((d: Disaster) => {
                const isCurrent = activeDisaster?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDisaster(d.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-teal-400 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{d.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active Sector
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            d.alertLevel === 'CRITICAL_ALERT' || d.alertLevel === 'RED_ALERT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {d.alertLevel || 'RED ALERT'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{d.location} ({d.state})</span>
                      </p>

                      <p className="text-[11px] text-slate-500 leading-relaxed">{d.description}</p>
                    </div>

                    <div className="sm:text-right shrink-0 space-y-1">
                      <div className="font-mono text-xs font-bold text-teal-800 bg-white sm:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 inline-block">
                        📍 {d.latitude.toFixed(4)}° N, {d.longitude.toFixed(4)}° E
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {d.camps?.length || d._count?.camps || 0} relief shelters logged
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: DETECT LIVE GPS LOCATION */}
          {activeTab === 'GPS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Your Current Device Location (GPS)</h3>
                  <p className="text-xs text-slate-500">Uses HTML5 Geolocation to calculate distance to relief shelters</p>
                </div>
                <button
                  onClick={handleDetectGPS}
                  disabled={gpsLoading}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>Re-detect GPS</span>
                </button>
              </div>

              {gpsLoading ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Navigation className="w-8 h-8 text-teal-600 animate-bounce mx-auto" />
                  <p className="text-xs">Acquiring live satellite coordinates...</p>
                </div>
              ) : gpsError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>GPS Access Notice</span>
                  </div>
                  <p>{gpsError}</p>
                </div>
              ) : gpsData ? (
                <div className="space-y-4">
                  {/* User Coordinates display */}
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Live Device Telemetry:</span>
                      <span className="text-teal-400 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                        GPS Locked
                      </span>
                    </div>
                    <div className="text-lg font-mono font-bold text-teal-300">
                      {gpsData.userCoordinates.latitude.toFixed(5)}° N, {gpsData.userCoordinates.longitude.toFixed(5)}° E
                    </div>
                  </div>

                  {/* Nearest Disaster Highlight */}
                  {gpsData.nearestDisaster && (
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                          Closest Active Disaster Zone
                        </span>
                        <span className="text-xs font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          📍 {gpsData.nearestDisaster.distanceToEpicenterKm} km from you
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">
                          {gpsData.nearestDisaster.name}
                        </h4>
                        <p className="text-xs text-slate-600">{gpsData.nearestDisaster.location}</p>
                      </div>

                      {gpsData.nearestDisaster.nearestCamp && (
                        <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-xs text-slate-700">
                          <span className="text-slate-500">Closest Relief Shelter: </span>
                          <strong className="text-emerald-900">{gpsData.nearestDisaster.nearestCamp.name}</strong>
                          <span className="ml-1 text-slate-500">({gpsData.nearestDisaster.nearestCamp.distanceKm} km away)</span>
                        </div>
                      )}

                      <button
                        onClick={() => handleSelectDisaster(gpsData.nearestDisaster.id)}
                        className="btn-primary w-full py-2.5 text-xs font-bold"
                      >
                        Set Active to {gpsData.nearestDisaster.name}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: ADD CUSTOM LOCATION */}
          {activeTab === 'CUSTOM' && (
            <form onSubmit={handleCreateCustom} className="space-y-4 text-xs">
              <p className="text-slate-500">
                Register a new emergency zone anywhere in the country. The system will create an active command scope and initialize a central relief shelter at these coordinates.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Disaster Event Title *</label>
                <input
                  type="text"
                  required
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  placeholder="e.g. Cuddalore Flood Relief 2024"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location / Town *</label>
                  <input
                    type="text"
                    required
                    value={customForm.location}
                    onChange={(e) => setCustomForm({ ...customForm, location: e.target.value })}
                    placeholder="e.g. Cuddalore Old Town"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={customForm.state}
                    onChange={(e) => setCustomForm({ ...customForm, state: e.target.value })}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude (Decimal) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customForm.latitude}
                    onChange={(e) => setCustomForm({ ...customForm, latitude: e.target.value })}
                    placeholder="e.g. 11.7480"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude (Decimal) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={customForm.longitude}
                    onChange={(e) => setCustomForm({ ...customForm, longitude: e.target.value })}
                    placeholder="e.g. 79.7714"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="pt-2">
                <span className="text-slate-500 font-semibold block mb-1.5">Or Choose Fast Preset Coordinates:</span>
                <div className="flex flex-wrap gap-1.5">
                  {presetCities.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCustomForm({
                        name: c.name,
                        location: c.location,
                        state: c.state,
                        latitude: c.lat.toString(),
                        longitude: c.lng.toString(),
                        alertLevel: 'RED_ALERT',
                      })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={customLoading}
                className="btn-primary w-full py-3 text-xs font-bold mt-2"
              >
                {customLoading ? 'Registering Location...' : 'Register & Switch to This Disaster Location'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
