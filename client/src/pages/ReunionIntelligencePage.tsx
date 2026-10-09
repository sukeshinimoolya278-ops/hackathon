import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ReunionCase,
  ReunionCaseStatus,
  ReunionSourceRecord,
  MatchEvidenceBreakdown,
  ReunionIntelligenceStats,
  MeetingPointRecommendation,
} from '../types/reunionIntelligence';
import { reunionIntelligenceService } from '../services/reunionIntelligenceService';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  RefreshCw,
  Send,
  MapPin,
  HeartHandshake,
  UserCheck,
  XCircle,
  Eye,
  FileText,
  Radio,
  ChevronRight,
  X,
  Compass,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

export const ReunionIntelligencePage: React.FC = () => {
  const [cases, setCases] = useState<ReunionCase[]>([]);
  const [stats, setStats] = useState<ReunionIntelligenceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<ReunionCase | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Action States
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isNotifying, setIsNotifying] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchCasesAndStats = async () => {
    setIsLoading(true);
    try {
      const [casesData, statsData] = await Promise.all([
        reunionIntelligenceService.getCases({
          status: statusFilter,
          reviewBand: priorityFilter,
          query: searchQuery,
        }),
        reunionIntelligenceService.getStats(),
      ]);
      setCases(casesData);
      setStats(statsData);

      // Keep selected case synced
      if (selectedCase) {
        const updated = casesData.find(c => c.id === selectedCase.id);
        if (updated) setSelectedCase(updated);
      }
    } catch (err: any) {
      console.error('Error fetching reunion cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCasesAndStats();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCasesAndStats();
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo cases back to initial test scenario?')) {
      setIsLoading(true);
      await reunionIntelligenceService.resetDemoData();
      await fetchCasesAndStats();
      setSelectedCase(null);
      showFeedback('Demo scenario cleanly reset to initial state.', 'success');
    }
  };

  const handleSeedArjunDemo = async () => {
    setIsLoading(true);
    const demoCase = await reunionIntelligenceService.seedDemoScenario();
    await fetchCasesAndStats();
    setSelectedCase(demoCase);
    showFeedback('Loaded Arjun Kumar & Arjun Kumra candidate cross-match demo scenario.', 'success');
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Human-in-the-loop actions
  const handleRequestVerification = async () => {
    if (!selectedCase) return;
    const note = prompt('Enter field verification request instructions (e.g. "Dispatch volunteer to inspect birthmark/inhaler"):');
    if (!note) return;

    setIsActionLoading(true);
    try {
      const updated = await reunionIntelligenceService.transitionStatus(
        selectedCase.id,
        'VERIFICATION_REQUIRED',
        'Command Coordinator',
        'COORDINATOR',
        note
      );
      setSelectedCase(updated);
      await fetchCasesAndStats();
      showFeedback('Verification requested. Assigned to field responder queue.', 'success');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!selectedCase) return;
    if (!verificationNotes.trim()) {
      showFeedback('Please provide verification details/notes.', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const updated = await reunionIntelligenceService.verifyIdentity(
        selectedCase.id,
        'Senior Coordinator',
        verificationNotes.trim()
      );
      // Auto recommend meeting point
      const withMeetingPoint = await reunionIntelligenceService.recommendMeetingPoint(selectedCase.id);
      setSelectedCase(withMeetingPoint);
      setIsVerifying(false);
      setVerificationNotes('');
      await fetchCasesAndStats();
      showFeedback('✅ Identity confirmed & verified! Meeting point generated.', 'success');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!selectedCase) return;
    if (!rejectionReason.trim()) {
      showFeedback('Please provide a rejection reason.', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const updated = await reunionIntelligenceService.rejectMatch(
        selectedCase.id,
        'Command Coordinator',
        rejectionReason.trim()
      );
      setSelectedCase(updated);
      setIsRejecting(false);
      setRejectionReason('');
      await fetchCasesAndStats();
      showFeedback('Candidate match rejected and archived.', 'success');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDispatchNotification = async () => {
    if (!selectedCase) return;
    setIsActionLoading(true);
    try {
      const res = await reunionIntelligenceService.dispatchNotification(
        selectedCase.id,
        'Relief Operations Nodal'
      );
      setSelectedCase(res.case);
      setIsNotifying(false);
      await fetchCasesAndStats();
      showFeedback('Safe in-app family notification dispatched with privacy protections.', 'success');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteReunion = async () => {
    if (!selectedCase) return;
    const note = prompt('Enter closure notes (e.g. "Family reunited at St. Joseph Relief Camp gate in person"):');
    if (!note) return;

    setIsActionLoading(true);
    try {
      const updated = await reunionIntelligenceService.transitionStatus(
        selectedCase.id,
        'REUNITED_CLOSED',
        'Field Officer',
        'COORDINATOR',
        note
      );
      setSelectedCase(updated);
      await fetchCasesAndStats();
      showFeedback('🎉 Reunion confirmed! Case officially closed.', 'success');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: ReunionCaseStatus) => {
    switch (status) {
      case 'OPEN_REPORT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-300">1. Open Report</span>;
      case 'CANDIDATE_FOUND':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-pink-100 text-pink-800 border border-pink-300 animate-pulse">2. Candidate Found</span>;
      case 'AWAITING_REVIEW':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-violet-100 text-violet-800 border border-violet-300">3. Awaiting Review</span>;
      case 'VERIFICATION_REQUIRED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">4. Verification Required</span>;
      case 'IDENTITY_VERIFIED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-teal-100 text-teal-800 border border-teal-300">5. Identity Verified</span>;
      case 'FAMILY_CONTACT_PENDING':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-300">6. Contact Pending</span>;
      case 'REUNION_COORDINATING':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-300">7. Coordinating</span>;
      case 'REUNITED_CLOSED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold">8. Reunited (Closed)</span>;
      case 'REJECTED_MATCH':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">9. Rejected Match</span>;
      case 'UNRESOLVED_ESCALATED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-red-100 text-red-900 border border-red-300 font-black">10. Escalated</span>;
      default:
        return null;
    }
  };

  const getReviewBandBadge = (band?: string) => {
    switch (band) {
      case 'HIGH_PRIORITY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white shadow-xs">High-Priority Review (80+)</span>;
      case 'POSSIBLE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white shadow-xs">Possible Match (55-79)</span>;
      case 'WEAK':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-700">Weak Match (&lt;55)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-clay ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-white hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-black uppercase tracking-wider mb-2 border border-violet-200">
            <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-spin-slow" />
            <span>Zero-Rumor Verified Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-slate-950 uppercase tracking-tight">
            Reunion Intelligence Engine
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mt-1">
            Explainable cross-source survivor matching connecting Safe Check-Ins, Missing Reports, Eyewitness Sightings, Shelter Intake, and DLE Mesh SOS into a coordinated verification workflow.
          </p>
        </div>

        {/* Demo Mode Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSeedArjunDemo}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-clay flex items-center gap-1.5 transition-all"
            title="Load judge demo scenario: Arjun Kumar vs Arjun Kumra"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Arjun Kumar Demo</span>
          </button>
          <button
            onClick={handleResetDemo}
            className="px-3 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            title="Reset simulated test records"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* DETERMINISTIC DEMO BANNER */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-violet-50 via-pink-50 to-amber-50 border border-violet-200 shadow-clay-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black shrink-0">
            GX
          </span>
          <div>
            <strong className="text-slate-900 font-bold block text-sm">
              Demonstration Mode: Arjun Kumar &amp; Arjun Kumra Cross-Match Scenario
            </strong>
            <span className="text-slate-600 text-xs">
              Simulated cross-matching between <strong>Missing Report (08:30 AM)</strong> and <strong>Safe Check-In (10:15 AM)</strong>. All actions are human-reviewed with full explainability.
            </span>
          </div>
        </div>
        <span className="bg-white px-3 py-1 rounded-full border border-violet-200 text-violet-800 font-extrabold text-[11px] shrink-0">
          Deterministic Test Active
        </span>
      </div>

      {/* METRICS STRIP (Calculated from Stored Records) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-violet-100 shadow-clay-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Open Reports</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.openCasesCount}</div>
            <span className="text-[10px] text-slate-500 font-medium">Unlinked inquiries</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-clay-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 block">Candidate Matches</span>
            <div className="text-2xl font-black text-pink-700 mt-1">{stats.unreviewedCandidatesCount}</div>
            <span className="text-[10px] text-pink-600/80 font-medium">Requires triage</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-clay-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">Awaiting Verification</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{stats.awaitingVerificationCount}</div>
            <span className="text-[10px] text-amber-600/80 font-medium">Human sign-off</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-clay-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 block">Verified Reunions</span>
            <div className="text-2xl font-black text-teal-700 mt-1">{stats.verifiedReunionsCount}</div>
            <span className="text-[10px] text-teal-600/80 font-medium">Positively confirmed</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-clay-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">Pending Alerts</span>
            <div className="text-2xl font-black text-indigo-700 mt-1">{stats.pendingNotificationsCount}</div>
            <span className="text-[10px] text-indigo-600/80 font-medium">Safe in-app queue</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-violet-100 shadow-clay-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 block">Avg Match Score</span>
            <div className="text-2xl font-black text-violet-700 mt-1">{stats.avgMatchScore}%</div>
            <span className="text-[10px] text-violet-600/80 font-medium">Confidence index</span>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-3xl border border-violet-100 shadow-clay space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'ALL', label: 'All Cases' },
              { id: 'CANDIDATE_FOUND', label: 'Candidates (Found)' },
              { id: 'AWAITING_REVIEW', label: 'Awaiting Review' },
              { id: 'VERIFICATION_REQUIRED', label: 'Field Verification' },
              { id: 'IDENTITY_VERIFIED', label: 'Identity Verified' },
              { id: 'REUNION_COORDINATING', label: 'Coordinating' },
              { id: 'REUNITED_CLOSED', label: 'Reunited' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-violet-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Query */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:w-72">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search case, name..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Review Band Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-violet-600" />
            <span>Review Priority Band:</span>
          </span>
          <button
            onClick={() => setPriorityFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
              priorityFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPriorityFilter('HIGH_PRIORITY')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
              priorityFilter === 'HIGH_PRIORITY' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            🚨 High-Priority (80-100)
          </button>
          <button
            onClick={() => setPriorityFilter('POSSIBLE')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
              priorityFilter === 'POSSIBLE' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            🟡 Possible Match (55-79)
          </button>
          <button
            onClick={() => setPriorityFilter('WEAK')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
              priorityFilter === 'WEAK' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            Weak (&lt;55)
          </button>
        </div>
      </div>

      {/* CASES QUEUE LIST */}
      {isLoading ? (
        <div className="card-clean text-center py-12 text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-xs">Evaluating cross-source survivor records...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="card-clean text-center py-12 space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
          <h3 className="text-base font-bold text-slate-800">No Reunion Cases Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No records matched your active filters. Try clicking "Load Arjun Kumar Demo" above to inspect the end-to-end reunification workflow.
          </p>
          <button onClick={handleSeedArjunDemo} className="btn-primary text-xs">
            Load Demo Scenario
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Reunion Cases Queue ({cases.length} records)</span>
            <span>Click any record to inspect side-by-side evidence</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {cases.map(item => {
              const evidence = item.matchEvidence;
              const hasCandidate = !!item.candidateRecord;
              const isSelected = selectedCase?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCase(item)}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-violet-600 bg-violet-50/20 shadow-clay'
                      : 'border-white bg-white hover:border-violet-200 shadow-clay-sm'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Case Info & Matched Person Names */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.caseCode}
                        </span>
                        {getStatusBadge(item.status)}
                        {evidence && getReviewBandBadge(evidence.reviewBand)}
                        {item.isDemoCase && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                            Demo Mode
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Missing Report</span>
                          <h2 className="text-lg font-black text-slate-900">{item.missingReport.personName}</h2>
                          <span className="text-xs text-slate-500">
                            Age: <strong>{item.missingReport.approxAge || 'Unknown'}</strong> &bull; Sector: <strong>{item.missingReport.lastKnownLocation || 'Unknown'}</strong>
                          </span>
                        </div>

                        {hasCandidate && (
                          <>
                            <div className="hidden sm:flex items-center text-violet-400">
                              <ArrowRight className="w-5 h-5" />
                            </div>

                            <div className="pl-3 sm:pl-0 sm:border-l sm:border-slate-200 sm:pl-3">
                              <span className="text-[10px] font-bold text-pink-500 uppercase block">
                                Matched Candidate ({item.candidateRecord!.sourceType.replace('_', ' ')})
                              </span>
                              <h2 className="text-lg font-black text-pink-900">{item.candidateRecord!.personName}</h2>
                              <span className="text-xs text-slate-500">
                                Age: <strong>{item.candidateRecord!.approxAge || 'Unknown'}</strong> &bull; Location: <strong>{item.candidateRecord!.currentReportedLocation || item.candidateRecord!.campName || 'Not specified'}</strong>
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Conflicting Evidence Alert Badge */}
                      {evidence && evidence.conflictingEvidence.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold mt-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Conflicting details: {evidence.conflictingEvidence[0]}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Match Score Meter & Action CTA */}
                    <div className="flex items-center gap-4 lg:self-center shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                      {evidence && (
                        <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Match Score</span>
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="font-display text-3xl font-black bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                              {evidence.matchScore}%
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">Weighted confidence</span>
                        </div>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedCase(item); }}
                        className="px-4 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-900 font-bold text-xs flex items-center gap-1.5 border border-violet-200 transition-all"
                      >
                        <span>Inspect Evidence</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE MATCH INSPECTION MODAL */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl border-2 border-white shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 text-white flex items-center justify-center font-black text-sm shadow-3d-badge">
                  GX
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">
                      Reunion Case: {selectedCase.caseCode}
                    </h2>
                    {getStatusBadge(selectedCase.status)}
                  </div>
                  <p className="text-xs text-slate-500">
                    Human-in-the-loop review station &bull; Last updated {new Date(selectedCase.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setSelectedCase(null); setIsVerifying(false); setIsRejecting(false); setIsNotifying(false); }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SIDE-BY-SIDE RECORD COMPARISON */}
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-3">
                Side-by-Side Record Comparison
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RECORD 1: MISSING PERSON REPORT */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      MISSING PERSON REPORT
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {selectedCase.missingReport.sourceReferenceCode}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Reported Name</span>
                      <strong className="text-base text-slate-900">{selectedCase.missingReport.personName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Age &amp; Gender</span>
                      <span>{selectedCase.missingReport.approxAge || 'Unknown'} yrs &bull; {selectedCase.missingReport.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Last Known Area</span>
                      <span>{selectedCase.missingReport.lastKnownLocation || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Reported Time</span>
                      <span>{new Date(selectedCase.missingReport.timestamp).toLocaleTimeString()} ({new Date(selectedCase.missingReport.timestamp).toLocaleDateString()})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Physical Description</span>
                      <span>{selectedCase.missingReport.physicalDescription || 'None recorded'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Medical Needs</span>
                      <span className="text-rose-700 font-semibold">{selectedCase.missingReport.medicalNeeds || 'None reported'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Family Contact</span>
                      <span>{selectedCase.missingReport.reporterOrContactName} ({selectedCase.missingReport.relationshipToPerson}) &bull; {selectedCase.missingReport.reporterOrContactPhone}</span>
                    </div>
                  </div>
                </div>

                {/* RECORD 2: MATCHED CANDIDATE */}
                {selectedCase.candidateRecord ? (
                  <div className="p-5 rounded-2xl bg-violet-50/40 border border-violet-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-violet-200/80 pb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-violet-800 bg-violet-100 px-2 py-0.5 rounded-md border border-violet-200">
                        {selectedCase.candidateRecord.sourceType.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-violet-700 font-bold">
                        {selectedCase.candidateRecord.sourceReferenceCode}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div>
                        <span className="text-violet-400 text-[10px] uppercase font-bold block">Recorded Name</span>
                        <strong className="text-base text-violet-950">{selectedCase.candidateRecord.personName}</strong>
                      </div>
                      <div>
                        <span className="text-violet-400 text-[10px] uppercase font-bold block">Age &amp; Gender</span>
                        <span>{selectedCase.candidateRecord.approxAge || 'Unknown'} yrs &bull; {selectedCase.candidateRecord.gender}</span>
                      </div>
                      <div>
                        <span className="text-violet-400 text-[10px] uppercase font-bold block">Reported Location / Shelter</span>
                        <strong className="text-violet-900">{selectedCase.candidateRecord.currentReportedLocation || selectedCase.candidateRecord.campName || 'Not specified'}</strong>
                      </div>
                      <div>
                        <span className="text-violet-400 text-[10px] uppercase font-bold block">Check-In / Intake Timestamp</span>
                        <span>{new Date(selectedCase.candidateRecord.timestamp).toLocaleTimeString()} ({new Date(selectedCase.candidateRecord.timestamp).toLocaleDateString()})</span>
                      </div>
                      <div>
                        <span className="text-violet-400 text-[10px] uppercase font-bold block">Recorded Description</span>
                        <span>{selectedCase.candidateRecord.physicalDescription || 'None recorded'}</span>
                      </div>
                      <div>
                        <span className="text-violet-400 text-[10px] uppercase font-bold block">Medical Needs</span>
                        <span>{selectedCase.candidateRecord.medicalNeeds || 'None reported'}</span>
                      </div>
                      <div>
                        <span className="text-violet-400 text-[10px] uppercase font-bold block">Source Notes</span>
                        <span className="italic text-slate-600">{selectedCase.candidateRecord.notes}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                    No candidate record matched yet.
                  </div>
                )}
              </div>
            </div>

            {/* EXPLAINABLE MATCH EVIDENCE BREAKDOWN */}
            {selectedCase.matchEvidence && (
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Explainable Match Evidence Analysis
                    </h3>
                    <p className="text-xs text-slate-500">
                      Strictly labeled as "Match Score" &bull; High score never auto-notifies without authorization
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Match Score:</span>
                    <span className="text-2xl font-black text-violet-700">
                      {selectedCase.matchEvidence.matchScore}%
                    </span>
                    {getReviewBandBadge(selectedCase.matchEvidence.reviewBand)}
                  </div>
                </div>

                {/* Signal Weights Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Name (30%)</span>
                    <strong className="text-sm text-slate-900">{selectedCase.matchEvidence.nameSimilarityScore}%</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Age (15%)</span>
                    <strong className="text-sm text-slate-900">{selectedCase.matchEvidence.ageScore}%</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Location (20%)</span>
                    <strong className="text-sm text-slate-900">{selectedCase.matchEvidence.geographicScore}%</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Time (15%)</span>
                    <strong className="text-sm text-slate-900">{selectedCase.matchEvidence.timeScore}%</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Shelter (10%)</span>
                    <strong className="text-sm text-slate-900">{selectedCase.matchEvidence.shelterScore}%</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">Details (10%)</span>
                    <strong className="text-sm text-slate-900">{selectedCase.matchEvidence.identifyingDetailsScore}%</strong>
                  </div>
                </div>

                {/* Positive, Conflicting & Missing Evidence Lists */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Positive Evidence */}
                  <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-1.5">
                    <strong className="text-emerald-900 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Positive Corroboration</span>
                    </strong>
                    <ul className="space-y-1 text-slate-700">
                      {selectedCase.matchEvidence.positiveEvidence.map((e, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-emerald-600 font-bold">&bull;</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Conflicting Evidence */}
                  <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-1.5">
                    <strong className="text-amber-900 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Conflicting Details</span>
                    </strong>
                    {selectedCase.matchEvidence.conflictingEvidence.length > 0 ? (
                      <ul className="space-y-1 text-slate-700">
                        {selectedCase.matchEvidence.conflictingEvidence.map((e, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-amber-600 font-bold">&bull;</span>
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 italic">No significant conflicts detected.</p>
                    )}
                  </div>

                  {/* Missing Evidence */}
                  <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                    <strong className="text-slate-800 font-bold flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>Missing Information</span>
                    </strong>
                    <ul className="space-y-1 text-slate-600">
                      {selectedCase.matchEvidence.missingEvidence.map((e, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-slate-400 font-bold">&bull;</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                  <strong className="text-slate-900 block font-bold mb-0.5">Why candidate was suggested:</strong>
                  {selectedCase.matchEvidence.whySuggested}
                </div>
              </div>
            )}

            {/* RECOMMENDED MEETING POINT & ROUTING */}
            {selectedCase.recommendedMeetingPoint && (
              <div className="p-5 rounded-3xl bg-teal-50/60 border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    <h3 className="text-sm font-black text-teal-950 uppercase tracking-wider">
                      Reunion Meeting Point Recommendation
                    </h3>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider bg-teal-600 text-white px-2.5 py-0.5 rounded-full">
                    Hazard-Aware Route
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Designated Safe Shelter</span>
                    <strong className="text-sm text-slate-900 block">{selectedCase.recommendedMeetingPoint.campName}</strong>
                    <span className="text-slate-600">{selectedCase.recommendedMeetingPoint.campLocation}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Capacity &amp; Distance</span>
                    <span>
                      Available Beds: <strong>{selectedCase.recommendedMeetingPoint.availableBeds} beds</strong> &bull; Distance: <strong>{selectedCase.recommendedMeetingPoint.distanceKm} km ({selectedCase.recommendedMeetingPoint.estimatedWalkingMinutes} min walk)</strong>
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-teal-200 text-xs text-slate-700 space-y-1">
                  <strong className="text-teal-900 font-bold block">Reasoning &amp; Safety Corridor:</strong>
                  <p>{selectedCase.recommendedMeetingPoint.rationale}</p>
                  <p className="text-teal-800 font-semibold">{selectedCase.recommendedMeetingPoint.hazardNotice}</p>
                </div>
              </div>
            )}

            {/* SAFE FAMILY NOTIFICATION DISPATCH PANEL */}
            {isNotifying && (
              <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                  <strong className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-indigo-600" />
                    <span>Safe Family Notification Review</span>
                  </strong>
                  <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                    Pre-Dispatch Preview
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">Recipient:</span>
                    <strong>{selectedCase.missingReport.reporterOrContactName}</strong> (Masked Phone: {selectedCase.missingReport.reporterOrContactPhone ? selectedCase.missingReport.reporterOrContactPhone.slice(0, 4) + '****' + selectedCase.missingReport.reporterOrContactPhone.slice(-2) : '***'})
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block">Neutral Template Message (Redacted until in-person verification):</span>
                    <div className="p-3 bg-white rounded-xl border border-indigo-200 font-mono text-[11px] text-slate-800">
                      "GlobalX Disaster Relief Notification: An authorized match for your inquiry regarding '{selectedCase.missingReport.personName}' has been positively verified at {selectedCase.candidateRecord?.campName || 'authorized relief station'}. Please connect with the On-Site Camp Coordinator to coordinate safe reunification."
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsNotifying(false)}
                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDispatchNotification}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isActionLoading ? 'Dispatching...' : 'Confirm & Dispatch Notification'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* VERIFICATION NOTES INPUT PANEL */}
            {isVerifying && (
              <div className="p-5 rounded-3xl bg-teal-50 border border-teal-200 space-y-3 animate-in fade-in duration-200">
                <strong className="text-sm font-black text-teal-950 uppercase tracking-wider block">
                  Responder Identity Verification Sign-Off
                </strong>
                <p className="text-xs text-slate-600">
                  Record positive verification evidence (e.g. "Identity verified by physical check at St. Joseph Camp Gate by Father Mathew; survivor holds inhaler matching description.")
                </p>
                <textarea
                  value={verificationNotes}
                  onChange={e => setVerificationNotes(e.target.value)}
                  placeholder="Enter detailed verification notes and physical evidence..."
                  rows={3}
                  className="w-full p-3 bg-white border border-teal-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsVerifying(false)} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmVerification}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isActionLoading ? 'Signing...' : 'Sign & Confirm Identity'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* REJECTION INPUT PANEL */}
            {isRejecting && (
              <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in duration-200">
                <strong className="text-sm font-black text-rose-950 uppercase tracking-wider block">
                  Reject Candidate Match
                </strong>
                <p className="text-xs text-slate-600">
                  State why candidate does not match (e.g. "Survivor at Camp A confirmed different individual with matching name; age is 45 not 29.")
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={2}
                  className="w-full p-3 bg-white border border-rose-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-600 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsRejecting(false)} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRejection}
                    disabled={isActionLoading}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </div>
            )}

            {/* CASE TIMELINE & AUDIT TRAIL */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
              <strong className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Case Progression Audit Timeline ({selectedCase.timeline.length} events)
              </strong>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                {selectedCase.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="flex items-start gap-3 text-xs">
                    <span className="w-2 h-2 rounded-full bg-violet-600 mt-1.5 shrink-0" />
                    <div className="flex-1 bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>{event.actorName} ({event.actorRole})</span>
                        <span>{new Date(event.timestamp).toLocaleTimeString()} &bull; {new Date(event.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">{event.actionTitle}</div>
                      <div className="text-slate-600 mt-0.5">{event.notes}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HUMAN REVIEW WORKFLOW ACTION BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRejecting(true)}
                  disabled={selectedCase.status === 'REUNITED_CLOSED'}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-all disabled:opacity-40"
                >
                  Reject Match
                </button>
                <button
                  onClick={handleRequestVerification}
                  disabled={selectedCase.status === 'REUNITED_CLOSED' || selectedCase.status === 'IDENTITY_VERIFIED'}
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all disabled:opacity-40"
                >
                  Request Verification
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Step 1: Verify */}
                {selectedCase.status !== 'IDENTITY_VERIFIED' &&
                  selectedCase.status !== 'FAMILY_CONTACT_PENDING' &&
                  selectedCase.status !== 'REUNION_COORDINATING' &&
                  selectedCase.status !== 'REUNITED_CLOSED' && (
                    <button
                      onClick={() => setIsVerifying(true)}
                      className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm Identity</span>
                    </button>
                  )}

                {/* Step 2: Notify Family */}
                {(selectedCase.status === 'IDENTITY_VERIFIED' || selectedCase.status === 'FAMILY_CONTACT_PENDING') && (
                  <button
                    onClick={() => setIsNotifying(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-clay flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Initiate Family Alert</span>
                  </button>
                )}

                {/* Step 3: Complete Reunion */}
                {selectedCase.status === 'REUNION_COORDINATING' && (
                  <button
                    onClick={handleCompleteReunion}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-clay flex items-center gap-1.5"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Mark Reunited &amp; Close</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
