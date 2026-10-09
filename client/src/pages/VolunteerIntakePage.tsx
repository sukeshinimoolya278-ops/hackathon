import React, { useState, useEffect } from 'react';
import { useDisaster } from '../context/DisasterContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { VoiceInputButton } from '../components/common/VoiceInputButton';
import { Camp } from '../types';
import {
  ClipboardList,
  Wifi,
  WifiOff,
  CloudUpload,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  RefreshCw,
} from 'lucide-react';

interface QueuedEntry {
  offlineId: string;
  fullName: string;
  approxAge: string;
  gender: string;
  campId: string;
  priorityFlag: string;
  medicalNeeds: string;
  physicalDesc: string;
  groupNotes: string;
  offlineTimestamp: string;
}

const OFFLINE_KEY = 'reunitepath_offline_queue';

export const VolunteerIntakePage: React.FC = () => {
  const { camps } = useDisaster();
  const { user } = useAuth();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<QueuedEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastEntryCode, setLastEntryCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    approxAge: '',
    gender: 'MALE',
    campId: user?.campId || (camps[0]?.id || ''),
    priorityFlag: 'NONE',
    medicalNeeds: '',
    physicalDesc: '',
    groupNotes: '',
    familyToken: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOfflineQueue = () => {
    try {
      const data = localStorage.getItem(OFFLINE_KEY);
      if (data) {
        setOfflineQueue(JSON.parse(data));
      } else {
        setOfflineQueue([]);
      }
    } catch {
      setOfflineQueue([]);
    }
  };

  useEffect(() => {
    loadOfflineQueue();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!formData.campId && camps.length > 0) {
      setFormData(prev => ({ ...prev, campId: user?.campId || camps[0].id }));
    }
  }, [camps, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.campId) {
      alert('Survivor Full Name and Relief Camp are required.');
      return;
    }

    if (!isOnline) {
      const queuedItem: QueuedEntry = {
        offlineId: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...formData,
        offlineTimestamp: new Date().toISOString(),
      };
      const updatedQueue = [...offlineQueue, queuedItem];
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(updatedQueue));
      setOfflineQueue(updatedQueue);
      setLastEntryCode(`QUEUED-LOCAL-${updatedQueue.length}`);
      setFormData(prev => ({
        ...prev,
        fullName: '',
        approxAge: '',
        medicalNeeds: '',
        physicalDesc: '',
        groupNotes: '',
        priorityFlag: 'NONE',
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createIntake(formData);
      setLastEntryCode(res.entryCode);
      setFormData(prev => ({
        ...prev,
        fullName: '',
        approxAge: '',
        medicalNeeds: '',
        physicalDesc: '',
        groupNotes: '',
        priorityFlag: 'NONE',
      }));
    } catch (err: any) {
      alert(err.message || 'Error recording intake entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncOffline = async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);
    try {
      const res = await api.syncOfflineBatch(offlineQueue);
      alert(`🎉 Successfully synchronized ${res.syncedCount} offline survivor records! Relational matching triggered.`);
      localStorage.removeItem(OFFLINE_KEY);
      setOfflineQueue([]);
    } catch (err: any) {
      alert(err.message || 'Error syncing offline batch');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          isOnline
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-amber-100 text-amber-950 border-amber-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-emerald-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-600 animate-pulse" />
          )}
          <span>
            {isOnline
              ? 'Online Mode: Real-time sync with matching engine active'
              : 'Offline Mode: Zero internet detected. Intakes will be saved locally in IndexedDB/Storage'}
          </span>
        </div>

        {offlineQueue.length > 0 && isOnline && (
          <button
            onClick={handleSyncOffline}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 text-white rounded-lg font-bold shadow-xs hover:bg-teal-700"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Sync {offlineQueue.length} Offline Records</span>
          </button>
        )}
      </div>

      <div className="card-clean space-y-6">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Volunteer Camp Intake</h1>
              <p className="text-xs text-slate-500">Fast phone registration for arriving disaster survivors</p>
            </div>
          </div>

          {lastEntryCode && (
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Last Logged</span>
              <span className="font-mono font-black text-emerald-700 text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {lastEntryCode}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              Select Relief Camp / Shelter
            </label>
            <select
              value={formData.campId}
              onChange={(e) => setFormData({ ...formData, campId: e.target.value })}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-medium focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            >
              {camps.map((c: Camp) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.currentOccupancy}/{c.capacity} beds)
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-bold text-slate-800">
                Survivor Full Name <span className="text-rose-600">*</span>
              </label>
              <VoiceInputButton
                onTranscript={(text: string) =>
                  setFormData((prev) => ({
                    ...prev,
                    fullName: prev.fullName ? `${prev.fullName} ${text}` : text,
                  }))
                }
                label="Voice Dictate"
              />
            </div>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Murugesh Selvam / Arav Kumar"
              className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-lg font-medium focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Approx. Age</label>
              <input
                type="number"
                value={formData.approxAge}
                onChange={(e) => setFormData({ ...formData, approxAge: e.target.value })}
                placeholder="e.g. 43"
                className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              Priority Flags (Auto-escalates to Coordinator)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'NONE', label: 'Standard', color: 'border-slate-300 text-slate-700' },
                { id: 'CHILD_ALONE', label: '👶 Child Alone', color: 'border-rose-400 text-rose-700 bg-rose-50' },
                { id: 'CRITICAL_MEDICAL', label: '⚠️ Medical Need', color: 'border-red-400 text-red-700 bg-red-50' },
                { id: 'ELDERLY', label: '👵 Elderly', color: 'border-amber-400 text-amber-700 bg-amber-50' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, priorityFlag: p.id })}
                  className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all text-center min-h-[48px] ${
                    formData.priorityFlag === p.id
                      ? 'ring-2 ring-teal-600 bg-teal-50 border-teal-600 text-teal-900 shadow-xs'
                      : p.color
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              Medical & Immediate Health Needs
            </label>
            <input
              type="text"
              value={formData.medicalNeeds}
              onChange={(e) => setFormData({ ...formData, medicalNeeds: e.target.value })}
              placeholder="e.g. Diabetic insulin needed, dehydration, fractured arm"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              Group / Family Arrived With & Notes
            </label>
            <textarea
              rows={2}
              value={formData.groupNotes}
              onChange={(e) => setFormData({ ...formData, groupNotes: e.target.value })}
              placeholder="e.g. Arrived via NDRF tractor with wife taken by earlier boat; red backpack"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              Family QR Token (Optional if arrived with family code)
            </label>
            <input
              type="text"
              value={formData.familyToken}
              onChange={(e) => setFormData({ ...formData, familyToken: e.target.value })}
              placeholder="e.g. FAM-CHENNAI-8832"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-4 text-lg font-bold shadow-md flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>{isOnline ? 'Save & Run Matching Engine' : 'Save Locally (Offline Queue)'}</span>
          </button>
        </form>
      </div>

      {offlineQueue.length > 0 && (
        <div className="card-clean border-amber-300 bg-amber-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
              <CloudUpload className="w-4 h-4 text-amber-700" />
              <span>Offline Queue ({offlineQueue.length} records pending upload)</span>
            </h3>
            {isOnline && (
              <button
                onClick={handleSyncOffline}
                disabled={isSyncing}
                className="text-xs bg-amber-600 text-white px-2.5 py-1 rounded font-bold hover:bg-amber-700"
              >
                Sync Now
              </button>
            )}
          </div>
          <div className="divide-y divide-amber-200/60 max-h-48 overflow-y-auto text-xs">
            {offlineQueue.map((item) => (
              <div key={item.offlineId} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{item.fullName}</span>
                  <span className="text-slate-500 ml-2">({item.gender}, {item.approxAge || 'Age ?'})</span>
                </div>
                <span className="text-slate-500 text-[10px]">
                  {new Date(item.offlineTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
