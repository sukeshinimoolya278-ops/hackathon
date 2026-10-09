import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Lead } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  CheckCircle2,
  XCircle,
  Undo2,
  ShieldAlert,
  Sparkles,
  Users,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowRight,
  Phone,
  MapPin,
  Calendar,
  Building,
} from 'lucide-react';

export const CoordinatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'DUPLICATES'>('PENDING');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [retractionModalLead, setRetractionModalLead] = useState<Lead | null>(null);
  const [retractionReason, setRetractionReason] = useState('');

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'DUPLICATES') {
        const dups = await api.detectDuplicates();
        setDuplicates(dups);
      } else {
        const data = await api.getLeads(activeTab);
        setLeads(data);
      }
    } catch (err) {
      console.error('Error fetching coordinator queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [activeTab]);

  const handleApprove = async (leadId: string) => {
    try {
      await api.approveLead(leadId, reviewNotes || 'Identity verified at camp gate');
      alert(`✅ Lead approved! Status upgraded to VERIFIED SAFE. Family reporter notified via SMS.`);
      setReviewNotes('');
      setSelectedLeadId(null);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Error approving lead');
    }
  };

  const handleReject = async (leadId: string) => {
    const reason = prompt('Please enter rejection reason (e.g. Identity mismatch / Different person):');
    if (reason === null) return;
    try {
      await api.rejectLead(leadId, reason || 'Rejected by coordinator');
      alert('Lead rejected.');
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Error rejecting lead');
    }
  };

  const handleRetract = async () => {
    if (!retractionModalLead || !retractionReason.trim()) {
      alert('Retraction reason is mandatory for audit trail compliance.');
      return;
    }
    try {
      await api.retractLead(retractionModalLead.id, retractionReason.trim());
      alert('Lead successfully retracted. Public status reverted to REPORTED to preserve rumor control.');
      setRetractionModalLead(null);
      setRetractionReason('');
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Error retracting lead');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
              Camp Coordinator Station
            </span>
            <span className="text-xs text-slate-500">Zero-Rumor Verification Gate</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Lead Verification Queue
          </h1>
          <p className="text-sm text-slate-500">
            Review algorithmic matches before information is publicly visible to families.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PENDING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'APPROVED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verified History
          </button>
          <button
            onClick={() => setActiveTab('DUPLICATES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'DUPLICATES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Duplicate Detection
          </button>
          <button
            onClick={fetchLeads}
            title="Refresh queue"
            className="p-2 text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'DUPLICATES' ? (
        <div className="space-y-4">
          <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900">
            <strong>Duplicate Detection Engine:</strong> Automatically detects survivors logged multiple times across different camps or reports due to regional spelling variations.
          </div>

          {duplicates.length === 0 ? (
            <div className="card-clean text-center py-12 text-slate-400">
              No duplicate person candidates detected in the current active scope.
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map((dup, i) => (
                <div key={i} className="card-clean space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-teal-700">
                      Match Confidence: {dup.nameScore}% ({dup.reason})
                    </span>
                    <button
                      onClick={() => alert(`Merge simulated for ${dup.personA.fullName} and ${dup.personB.fullName}. Records consolidated.`)}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                    >
                      Merge Records
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="font-bold text-slate-800 block">{dup.personA.fullName}</span>
                      <span className="text-slate-500">Age: {dup.personA.approxAge || 'N/A'} | {dup.personA.gender}</span>
                      <p className="mt-1 text-slate-600">{dup.personA.physicalDesc || 'No desc'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="font-bold text-slate-800 block">{dup.personB.fullName}</span>
                      <span className="text-slate-500">Age: {dup.personB.approxAge || 'N/A'} | {dup.personB.gender}</span>
                      <p className="mt-1 text-slate-600">{dup.personB.physicalDesc || 'No desc'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="text-center py-16 space-y-2 text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-teal-600" />
          <p className="text-sm">Loading coordinator review queue...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="card-clean text-center py-16 space-y-2 text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
          <h3 className="text-lg font-bold text-slate-700">Queue is Clear!</h3>
          <p className="text-xs text-slate-500">No {activeTab.toLowerCase()} leads currently requiring coordinator action.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {leads.map((lead) => {
            const isUrgent = lead.priority === 'URGENT' || lead.priority === 'HIGH';
            const missingPerson = lead.missingReport.person;
            const shelterPerson = lead.shelterEntry?.person;
            const camp = lead.shelterEntry?.camp;
            const sighting = lead.sighting;

            return (
              <div
                key={lead.id}
                className={`card-clean border-2 space-y-5 transition-all ${
                  isUrgent ? 'border-rose-400/80 shadow-md bg-rose-50/10' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-black font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      LEAD: {lead.missingReport.reportCode}
                    </span>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        lead.confidenceScore >= 80
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : lead.confidenceScore >= 60
                          ? 'bg-teal-100 text-teal-800 border-teal-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {lead.confidenceScore}% Confidence Match
                    </span>

                    {lead.isFallback && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                        ⚡ Fallback Eyewitness Lead (Heading to Shelter B)
                      </span>
                    )}

                    {missingPerson.priorityFlag === 'CHILD_ALONE' && (
                      <span className="badge-urgent">
                        🚨 UNACCOMPANIED CHILD (PRIORITY 1)
                      </span>
                    )}
                    {missingPerson.priorityFlag === 'CRITICAL_MEDICAL' && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300">
                        ⚠️ URGENT MEDICAL CARE
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400">
                    Logged: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 text-xs text-teal-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                    <span>Why the Matching Engine flagged this lead:</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{lead.explanation}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-600" />
                        <span>Source A: Missing Person Report</span>
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500 font-bold">
                        {lead.missingReport.reportCode}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Name: </span>
                        <strong className="text-slate-900 text-sm">{missingPerson.fullName}</strong>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-slate-500">Age: </span>
                          <strong className="text-slate-800">{missingPerson.approxAge || 'Unknown'} yrs</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Gender: </span>
                          <strong className="text-slate-800">{missingPerson.gender}</strong>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Last Seen: </span>
                        <strong className="text-slate-800">{lead.missingReport.lastSeenLocation}</strong>
                      </div>
                      {missingPerson.physicalDesc && (
                        <div>
                          <span className="text-slate-500">Description: </span>
                          <span className="text-slate-700">{missingPerson.physicalDesc}</span>
                        </div>
                      )}
                      {missingPerson.medicalNeeds && (
                        <div className="text-rose-700 font-semibold">
                          <span>Medical Need: </span>
                          <span>{missingPerson.medicalNeeds}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-200 text-slate-600">
                        <span>Reporter: </span>
                        <strong>{lead.missingReport.reporterName}</strong> ({lead.missingReport.reporterRelationship}) - {lead.missingReport.reporterPhone}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-teal-200 bg-white space-y-3">
                    <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                      <h4 className="font-bold text-teal-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-teal-700" />
                        <span>
                          {camp ? `Source B: Camp Intake (${camp.name})` : 'Source B: Eyewitness Sighting'}
                        </span>
                      </h4>
                      <span className="text-[11px] font-mono text-teal-700 font-bold">
                        {lead.shelterEntry?.entryCode || lead.sighting?.sightingCode}
                      </span>
                    </div>

                    {shelterPerson && camp ? (
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">Logged Name: </span>
                          <strong className="text-teal-900 text-sm">{shelterPerson.fullName}</strong>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <span className="text-slate-500">Age: </span>
                            <strong className="text-slate-800">{shelterPerson.approxAge || 'Unknown'} yrs</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Gender: </span>
                            <strong className="text-slate-800">{shelterPerson.gender}</strong>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Sheltered At: </span>
                          <strong className="text-teal-800">{camp.name}</strong> ({camp.location})
                        </div>
                        {shelterPerson.physicalDesc && (
                          <div>
                            <span className="text-slate-500">Intake Notes: </span>
                            <span className="text-slate-700">{shelterPerson.physicalDesc}</span>
                          </div>
                        )}
                        {lead.shelterEntry?.groupNotes && (
                          <div className="text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200">
                            <span>Arrival info: </span>
                            <span>{lead.shelterEntry.groupNotes}</span>
                          </div>
                        )}
                      </div>
                    ) : sighting ? (
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-slate-500 font-medium">Sighted Name: </span>
                          <strong className="text-sky-900 text-sm">{sighting.sightedName || 'Unknown'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Sighting Location: </span>
                          <strong className="text-slate-800">{sighting.sightingLocation}</strong>
                        </div>
                        {sighting.directionHeading && (
                          <div className="text-sky-800 font-bold bg-sky-50 p-2 rounded border border-sky-200">
                            <span>Heading Towards: </span>
                            <span>{sighting.directionHeading}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500">Witness: </span>
                          <strong>{sighting.witnessName}</strong> ({sighting.witnessPhone})
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {activeTab === 'PENDING' ? (
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>
                        Approving officially marks survivor as <strong>VERIFIED SAFE</strong> and sends automated SMS to family.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleReject(lead.id)}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
                      >
                        <XCircle className="w-4 h-4 text-slate-500" />
                        <span>Reject Mismatch</span>
                      </button>

                      <button
                        onClick={() => handleApprove(lead.id)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs flex-1 sm:flex-initial"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Confirm Safe</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-emerald-900">
                        Verified by Coordinator ({lead.reviewNotes || 'Approved'})
                      </span>
                    </div>

                    <button
                      onClick={() => setRetractionModalLead(lead)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Retract Lead (Rumor Shield)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {retractionModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-700 border-b border-slate-200 pb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-lg">Retract Verified Lead</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If an approved lead was mistakenly matched, retracting immediately restores the missing report status to <strong>REPORTED</strong> and logs an immutable audit trail.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Reason for Retraction <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={retractionReason}
                onChange={(e) => setRetractionReason(e.target.value)}
                placeholder="e.g. Identity discrepancy discovered upon arrival of relatives; individual is not Murugan Selvam"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRetractionModalLead(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRetract}
                className="btn-danger text-xs font-bold px-4 py-2"
              >
                Confirm Retraction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
