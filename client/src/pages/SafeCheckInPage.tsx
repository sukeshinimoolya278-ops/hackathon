import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { VoiceInputButton } from '../components/common/VoiceInputButton';
import {
  HeartHandshake,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const SafeCheckInPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    currentLocation: '',
    message: 'I am safe and uninjured at a rescue point.',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    notifiedFamiliesCount: number;
    notifiedFamilies: any[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      alert('Please enter your full name and contact phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.safeCheckIn(formData);
      setResult(res);
    } catch (err: any) {
      alert(err.message || 'Error completing safe check-in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="mb-2">
        <Link to="/" className="text-sm text-teal-700 hover:underline">
          &larr; Back to Home
        </Link>
      </div>

      {result ? (
        <div className="card-clean border-2 border-emerald-500 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Check-In Broadcast Successful!</h2>
              <p className="text-xs text-slate-500">Your status is now registered as SAFE in the relief registry</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 text-xs text-emerald-950">
            <span className="font-bold text-sm block">
              {result.notifiedFamiliesCount > 0
                ? `🎉 Notified ${result.notifiedFamiliesCount} Family Inquiries Searching For You!`
                : 'Checked in safely! Any matching missing reports registered by your family will be automatically upgraded to VERIFIED SAFE.'}
            </span>

            {result.notifiedFamilies.length > 0 && (
              <ul className="list-disc list-inside space-y-1 pt-1 text-slate-700">
                {result.notifiedFamilies.map((fam, i) => (
                  <li key={i}>
                    Alert SMS dispatched to {fam.reporterName} ({fam.reporterPhone}) for Report {fam.reportCode}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link to="/" className="btn-primary w-full text-center">
            <span>Back to Home</span>
          </Link>
        </div>
      ) : (
        <div className="card-clean space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">One-Tap "I am Safe" Check-In</h1>
                <p className="text-sm text-slate-500">
                  Tap once to alert all searching family members and relief databases
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-bold text-slate-800">
                  Your Full Name <span className="text-rose-600">*</span>
                </label>
                <VoiceInputButton
                  onTranscript={(text: string) =>
                    setFormData((prev) => ({
                      ...prev,
                      fullName: prev.fullName ? `${prev.fullName} ${text}` : text,
                    }))
                  }
                  label="Dictate Name"
                />
              </div>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Murugan Selvam / Priya Selvam"
                className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                Your Contact Phone Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98401 77889"
                className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                We match this number against reporter contacts to instantly notify your loved ones.
              </span>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                Current Location (Camp / Shelter / Landmark)
              </label>
              <input
                type="text"
                value={formData.currentLocation}
                onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                placeholder="e.g. Loyola College Shelter B / Triplicane High School"
                className="w-full px-4 py-3.5 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                Short Message to Loved Ones
              </label>
              <textarea
                rows={2}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="I am safe and sound with drinking water and food."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-lg font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-6 h-6" />
              <span>{isLoading ? 'Checking in & Notifying Families...' : 'Confirm "I am Safe" & Notify Family'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
