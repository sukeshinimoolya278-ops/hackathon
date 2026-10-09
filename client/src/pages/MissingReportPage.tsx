import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { VoiceInputButton } from '../components/common/VoiceInputButton';
import {
  UserX,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Printer,
  Smartphone,
  Lock,
} from 'lucide-react';

export const MissingReportPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    approxAge: '',
    gender: 'UNKNOWN',
    physicalDesc: '',
    medicalNeeds: '',
    priorityFlag: 'NONE',
    lastSeenLocation: '',
    reporterName: '',
    reporterPhone: '',
    reporterRelationship: 'Family',
    familyToken: '',
    notes: '',
    consent: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    reportCode: string;
    familyToken: string;
    fullName: string;
    reporterPhone: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.reporterName || !formData.reporterPhone || !formData.lastSeenLocation) {
      alert('Please fill all mandatory fields (Name, Reporter Name, Reporter Phone, Last Seen Location).');
      return;
    }

    if (!formData.consent) {
      alert('You must provide consent for emergency coordination.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.createMissingReport(formData);
      setSubmittedData({
        reportCode: res.reportCode,
        familyToken: res.familyToken,
        fullName: formData.fullName,
        reporterPhone: formData.reporterPhone,
      });
    } catch (err: any) {
      alert(err.message || 'Error submitting missing person report');
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

      {submittedData ? (
        <div className="card-clean border-2 border-emerald-500 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Missing Person Report Registered</h2>
              <p className="text-xs text-slate-500">Relational matching engine is actively cross-referencing records</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Unique Report ID</span>
                <span className="text-3xl font-black text-slate-900 font-mono tracking-wider">{submittedData.reportCode}</span>
                <p className="text-xs text-slate-500 mt-1">Use this ID to search status online or via SMS helpline.</p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Family QR Token</span>
                <span className="text-base font-bold text-teal-700 font-mono">{submittedData.familyToken}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Simulated SMS confirmation sent to {submittedData.reporterPhone}</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 text-center">
              <QRCodeSVG value={submittedData.reportCode} size={130} />
              <span className="text-xs font-semibold text-slate-600 mt-2">Family Verification Token</span>
              <span className="text-[11px] text-slate-400">Scan at any camp gate for instant intake</span>
            </div>
          </div>

          <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>What happens next?</span>
            </div>
            <p>
              1. Our fuzzy matching algorithm evaluates incoming shelter rosters every 60 seconds.<br />
              2. When a potential lead is discovered, camp coordinators verify identity before notifying you.<br />
              3. You can track this report at any time using your Report ID.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate(`/search?q=${encodeURIComponent(submittedData.reportCode)}`)}
              className="btn-primary flex-1"
            >
              <span>Track Status on Search Portal</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
            <button
              onClick={() => window.print()}
              className="btn-secondary"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              <span>Print Token</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="card-clean space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">I'm Looking for Someone</h1>
                <p className="text-sm text-slate-500">File a missing person report for relief shelter cross-matching</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center justify-between">
                <span>1. Missing Person Details</span>
                <VoiceInputButton
                  onTranscript={(text: string) =>
                    setFormData((prev) => ({
                      ...prev,
                      fullName: prev.fullName ? `${prev.fullName} ${text}` : text,
                    }))
                  }
                  label="Voice Input Name"
                />
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Murugan Selvam / Priya Sharma"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Our fuzzy engine handles regional spelling variants (Tamil/Hindi transliteration).
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Approx. Age</label>
                    <input
                      type="number"
                      value={formData.approxAge}
                      onChange={(e) => setFormData({ ...formData, approxAge: e.target.value })}
                      placeholder="e.g. 42"
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
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Urgent Triage Priority Level</span>
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    High-priority records escalate to field dispatch
                  </span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'NONE',
                      title: 'Standard Urgency',
                      desc: 'Regular adult survivor or adult report',
                      icon: '🛡️',
                      activeBorder: 'border-slate-800 bg-slate-50 ring-2 ring-slate-800',
                      badge: 'Standard Queue',
                      badgeColor: 'bg-slate-200 text-slate-800',
                    },
                    {
                      id: 'CHILD_ALONE',
                      title: 'Unaccompanied Child',
                      desc: 'Minor separated from parents / traveling alone',
                      icon: '👶',
                      activeBorder: 'border-rose-500 bg-rose-50 ring-2 ring-rose-500',
                      badge: 'Priority 1 • Welfare Alert',
                      badgeColor: 'bg-rose-600 text-white',
                    },
                    {
                      id: 'CRITICAL_MEDICAL',
                      title: 'Critical Medical Need',
                      desc: 'Insulin, dialysis, heart condition, severe trauma',
                      icon: '🏥',
                      activeBorder: 'border-red-500 bg-red-50 ring-2 ring-red-500',
                      badge: 'Priority 2 • Clinic Dispatch',
                      badgeColor: 'bg-red-600 text-white',
                    },
                    {
                      id: 'ELDERLY',
                      title: 'Elderly Citizen (65+)',
                      desc: 'Senior citizen needing mobility or memory care',
                      icon: '👵',
                      activeBorder: 'border-amber-500 bg-amber-50 ring-2 ring-amber-500',
                      badge: 'Priority 3 • Assisted Care',
                      badgeColor: 'bg-amber-600 text-white',
                    },
                  ].map((p) => {
                    const isSelected = formData.priorityFlag === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, priorityFlag: p.id })}
                        className={`text-left p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? p.activeBorder + ' shadow-clay-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{p.icon}</span>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{p.title}</div>
                              <div className="text-xs text-slate-500">{p.desc}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                          )}
                        </div>
                        <div className="pt-1 flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                            {p.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-slate-700">
                    Physical Description / Clothing
                  </label>
                  <VoiceInputButton
                    onTranscript={(text: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        physicalDesc: prev.physicalDesc ? `${prev.physicalDesc} ${text}` : text,
                      }))
                    }
                    label="Dictate Description"
                  />
                </div>
                <textarea
                  rows={2}
                  value={formData.physicalDesc}
                  onChange={(e) => setFormData({ ...formData, physicalDesc: e.target.value })}
                  placeholder="e.g. 5ft 9in, mustache, wearing blue shirt and black pants"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Medical or Special Needs
                </label>
                <input
                  type="text"
                  value={formData.medicalNeeds}
                  onChange={(e) => setFormData({ ...formData, medicalNeeds: e.target.value })}
                  placeholder="e.g. Mild diabetic, requires daily tablets, walking stick"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-800">2. Separation Details</h3>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-slate-700">
                    Last Seen Location <span className="text-rose-600">*</span>
                  </label>
                  <VoiceInputButton
                    onTranscript={(text: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastSeenLocation: prev.lastSeenLocation ? `${prev.lastSeenLocation} ${text}` : text,
                      }))
                    }
                    label="Dictate Location"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={formData.lastSeenLocation}
                  onChange={(e) => setFormData({ ...formData, lastSeenLocation: e.target.value })}
                  placeholder="e.g. Velachery Bus Stand Junction / Madipakkam Lake Road"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Separation Circumstances / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Separated during boat rescue when volunteers took women and children first"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-800">3. Your Contact Details (Family Reporter)</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Your Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reporterName}
                    onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                    placeholder="e.g. Priya Selvam"
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
                    value={formData.reporterPhone}
                    onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                    placeholder="+91 98401 77889"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Phone numbers are strictly masked on public search to protect privacy.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Relationship to Missing Person
                </label>
                <select
                  value={formData.reporterRelationship}
                  onChange={(e) => setFormData({ ...formData, reporterRelationship: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
                >
                  <option value="Wife">Wife / Husband (Spouse)</option>
                  <option value="Parent">Parent (Mother / Father)</option>
                  <option value="Child">Son / Daughter</option>
                  <option value="Sibling">Brother / Sister</option>
                  <option value="Relative">Relative</option>
                  <option value="Neighbor">Neighbor / Friend</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <span>
                  <strong>Emergency Consent:</strong> I authorize disaster relief coordinators and shelter teams to cross-reference these details against shelter registers. I understand that public search results mask personal contact details to safeguard privacy.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-lg font-bold shadow-md"
            >
              {isLoading ? 'Registering & Running Matching Engine...' : 'Register Missing Person Report'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
