import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { VoiceInputButton } from '../components/common/VoiceInputButton';
import {
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Navigation,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

export const SightingPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    sightedName: '',
    approxAge: '',
    gender: 'UNKNOWN',
    sightingLocation: '',
    directionHeading: '',
    witnessName: '',
    witnessPhone: '',
    notes: '',
  });

  const [additionalPeople, setAdditionalPeople] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  const addPersonField = () => {
    setAdditionalPeople([...additionalPeople, '']);
  };

  const updatePersonField = (index: number, val: string) => {
    const updated = [...additionalPeople];
    updated[index] = val;
    setAdditionalPeople(updated);
  };

  const removePersonField = (index: number) => {
    setAdditionalPeople(additionalPeople.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sightingLocation || !formData.witnessName || !formData.witnessPhone) {
      alert('Please fill location, your name, and phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const filteredAdditional = additionalPeople.map(p => p.trim()).filter(Boolean);
      const res = await api.createSighting({
        ...formData,
        groupSize: 1 + filteredAdditional.length,
        additionalPeople: filteredAdditional,
      });
      setSubmittedCode(res.sightingCode);
    } catch (err: any) {
      alert(err.message || 'Error submitting sighting');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-sm text-teal-700 hover:underline">
          &larr; Back to Home
        </Link>
      </div>

      {submittedCode ? (
        <div className="card-clean border-2 border-sky-500 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Eyewitness Sighting Logged</h2>
              <p className="text-xs text-slate-500">Thank you for reporting. Matching engine is connecting leads.</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Sighting Reference Code</span>
              <span className="text-3xl font-black text-slate-900 font-mono tracking-wider">{submittedCode}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-sky-800 bg-sky-50 p-2.5 rounded-lg border border-sky-200">
              <Smartphone className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Simulated confirmation text sent to {formData.witnessPhone}</span>
            </div>
          </div>

          <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>How this helps separated families:</span>
            </div>
            <p>
              Your sighting will be cross-referenced against all open missing reports. If the person was heading towards a specific shelter, our fallback engine generates a prioritized lead for camp volunteers.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="btn-primary flex-1"
            >
              <span>Return to Home</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="card-clean space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">I Saw Someone</h1>
                <p className="text-sm text-slate-500">Report an eyewitness sighting or separated group in the relief area</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center justify-between">
                <span>1. Person You Sighted</span>
                <VoiceInputButton
                  onTranscript={(text: string) =>
                    setFormData((prev) => ({
                      ...prev,
                      sightedName: prev.sightedName ? `${prev.sightedName} ${text}` : text,
                    }))
                  }
                  label="Voice Input Name"
                />
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Name (If known or heard)
                  </label>
                  <input
                    type="text"
                    value={formData.sightedName}
                    onChange={(e) => setFormData({ ...formData, sightedName: e.target.value })}
                    placeholder="e.g. Meenakshi Amma / Unknown boy"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Approx. Age</label>
                    <input
                      type="number"
                      value={formData.approxAge}
                      onChange={(e) => setFormData({ ...formData, approxAge: e.target.value })}
                      placeholder="e.g. 60"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                    >
                      <option value="UNKNOWN">Unknown</option>
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-slate-700">
                    Sighting Location <span className="text-rose-600">*</span>
                  </label>
                  <VoiceInputButton
                    onTranscript={(text: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        sightingLocation: prev.sightingLocation ? `${prev.sightingLocation} ${text}` : text,
                      }))
                    }
                    label="Dictate Location"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={formData.sightingLocation}
                  onChange={(e) => setFormData({ ...formData, sightingLocation: e.target.value })}
                  placeholder="e.g. Madipakkam Main Road Police Booth / Velachery Flyover"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-sky-900 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-sky-700" />
                    <span>Direction Heading / Destination Observed</span>
                  </label>
                  <VoiceInputButton
                    onTranscript={(text: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        directionHeading: prev.directionHeading ? `${prev.directionHeading} ${text}` : text,
                      }))
                    }
                    label="Voice Input Direction"
                  />
                </div>
                <input
                  type="text"
                  value={formData.directionHeading}
                  onChange={(e) => setFormData({ ...formData, directionHeading: e.target.value })}
                  placeholder='e.g. "Boarded NDRF evacuation bus heading towards St. Thomas Community Hall Relief Camp"'
                  className="w-full px-4 py-2.5 bg-white border border-sky-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-600 focus:outline-none"
                />
                <span className="text-[11px] text-sky-800 block">
                  💡 <strong>Fallback Engine:</strong> If no camp entry exists yet, mentions of shelters (e.g. "heading towards St. Thomas Camp") generate proactive leads for families.
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Did you see anyone else who was separated?
                  </h3>
                  <p className="text-xs text-slate-500">Add other individuals or family members seen together in the group.</p>
                </div>
                <button
                  type="button"
                  onClick={addPersonField}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Person</span>
                </button>
              </div>

              {additionalPeople.map((personDesc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={personDesc}
                    onChange={(e) => updatePersonField(idx, e.target.value)}
                    placeholder={`Person ${idx + 2} description (e.g. "Elderly man with umbrella", "Girl in red frock")`}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                  {additionalPeople.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePersonField(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Additional Observations / Physical Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Wearing green saree with walking stick. Assisted safely by volunteers."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-800">2. Your Contact Information (Witness)</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Your Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.witnessName}
                    onChange={(e) => setFormData({ ...formData, witnessName: e.target.value })}
                    placeholder="e.g. Karthik Subramanian"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Your Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.witnessPhone}
                    onChange={(e) => setFormData({ ...formData, witnessPhone: e.target.value })}
                    placeholder="+91 98408 99887"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-accent w-full py-4 text-lg font-bold shadow-md"
            >
              {isLoading ? 'Submitting & Evaluating Leads...' : 'Submit Eyewitness Sighting Report'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
