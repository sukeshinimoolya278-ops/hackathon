import React, { useState, useEffect } from 'react';
import { useDisaster } from '../context/DisasterContext';
import { api } from '../services/api';
import { DashboardStats, Disaster, Camp } from '../types';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  History,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { activeDisaster, disasters, switchDisaster, refreshData } = useDisaster();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardStats(activeDisaster?.id);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [activeDisaster]);

  const handleDisasterSwitch = async (disasterId: string) => {
    try {
      await switchDisaster(disasterId);
      alert('Active disaster context switched. All records and rosters now scoped.');
    } catch (err: any) {
      alert(err.message || 'Error switching disaster');
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm">Calculating disaster impact metrics...</p>
      </div>
    );
  }

  const { impact, camps, recentVerifiedReunions, recentAuditLogs } = stats;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Disaster Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-slate-900 text-teal-400 px-2.5 py-0.5 rounded-full">
              Command Center
            </span>
            <span className="text-xs text-slate-500">State Relief Executive Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            Emergency Operations & Impact Metrics
          </h1>
          <p className="text-sm text-slate-500">
            Real-time multi-camp telemetry, reunification speed, and coordinator audit trail.
          </p>
        </div>

        {/* DISASTER MODE SWITCHER */}
        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 text-xs">
          <Layers className="w-4 h-4 text-slate-500 ml-1" />
          <span className="font-bold text-slate-700">Disaster Scope:</span>
          <select
            value={activeDisaster?.id || ''}
            onChange={(e) => handleDisasterSwitch(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
          >
            {disasters.map((d: Disaster) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.isActive ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 CORE IMPACT TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Missing Reported */}
        <div className="card-clean space-y-2 border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Missing Reported</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900">{impact.totalReported}</div>
          <span className="text-xs text-slate-500">Inquiries submitted by families</span>
        </div>

        {/* Total In Shelter Rosters */}
        <div className="card-clean space-y-2 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-700 uppercase tracking-wider">
            <span>Located at Shelters</span>
            <Building className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{impact.totalShelterEntries}</div>
          <span className="text-xs text-slate-500">Logged on camp intake rosters</span>
        </div>

        {/* Verified Reunions */}
        <div className="card-clean space-y-2 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            <span>Verified Safe</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-700">{impact.verifiedSafeCount}</div>
          <span className="text-xs text-slate-500">Reunification Rate: {impact.reunificationRate}%</span>
        </div>

        {/* Average Time to Reunite */}
        <div className="card-clean space-y-2 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between text-xs font-semibold text-teal-700 uppercase tracking-wider">
            <span>Avg. Reunion Speed</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-3xl font-black text-teal-800">{impact.avgReunionHours} hrs</div>
          <span className="text-xs text-slate-500">Report submission to camp verification</span>
        </div>
      </div>

      {/* PRIORITY ALERTS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-rose-800">Priority Minor Alert</span>
              <h4 className="text-base font-extrabold text-rose-950">
                {impact.priorityAlerts.childrenAlone} Unaccompanied Children Tracked
              </h4>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-white px-2.5 py-1 rounded-md border border-rose-200">
            Priority Queue Pinned
          </span>
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-amber-800">Special Care Alert</span>
              <h4 className="text-base font-extrabold text-amber-950">
                {impact.priorityAlerts.elderlyAndMedical} Elderly & Critical Medical Needs
              </h4>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-white px-2.5 py-1 rounded-md border border-amber-200">
            Monitored
          </span>
        </div>
      </div>

      {/* CAMPS CAPACITY BREAKDOWN & RECENT AUDIT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-clean space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Building className="w-5 h-5 text-teal-600" />
            <span>Relief Camps Capacity Telemetry</span>
          </h3>

          <div className="space-y-4">
            {camps.map((camp: Camp) => {
              const pct = Math.round((camp.currentOccupancy / camp.capacity) * 100);
              return (
                <div key={camp.id} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{camp.name}</span>
                    <span className="font-semibold text-slate-600">
                      {camp.currentOccupancy} / {camp.capacity} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        pct >= 90 ? 'bg-amber-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-clean space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            <span>Relief Coordinator Verification Audit Trail</span>
          </h3>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1 text-xs">
            {recentAuditLogs.map((log: any) => (
              <div key={log.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-600">{log.details}</p>
                <div className="text-[10px] text-slate-400">
                  Officer: <strong>{log.user?.name || 'System Auto'}</strong> ({log.user?.role || 'SYSTEM'})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
