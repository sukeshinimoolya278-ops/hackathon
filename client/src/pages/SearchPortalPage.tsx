import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { SearchResult, PriorityFlag } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Search,
  ShieldCheck,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  AlertTriangle,
  QrCode,
  Printer,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

export const SearchPortalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const priorityParam = (searchParams.get('priority') as PriorityFlag | 'ALL') || 'ALL';

  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFlag | 'ALL'>(priorityParam);
  const [sortByPriority, setSortByPriority] = useState<boolean>(true);

  const performSearch = async (searchTerm: string = '') => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await api.search(searchTerm);
      setResults(data.results);
    } catch (err: any) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    performSearch(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (priorityParam) {
      setPriorityFilter(priorityParam);
    }
  }, [priorityParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query.trim(), priority: priorityFilter });
    performSearch(query.trim());
  };

  const handlePrioritySelect = (p: PriorityFlag | 'ALL') => {
    setPriorityFilter(p);
    setSearchParams({ q: query.trim(), priority: p });
  };

  // Helper priority score for emergency triage
  const getPriorityScore = (flag: string): number => {
    switch (flag) {
      case 'CHILD_ALONE':
        return 100;
      case 'CRITICAL_MEDICAL':
        return 80;
      case 'ELDERLY':
        return 60;
      default:
        return 10;
    }
  };

  // Triage filter & sort
  const filteredResults = results
    .filter(item => {
      if (priorityFilter === 'ALL') return true;
      return item.priorityFlag === priorityFilter;
    })
    .sort((a, b) => {
      if (sortByPriority) {
        const diff = getPriorityScore(b.priorityFlag) - getPriorityScore(a.priorityFlag);
        if (diff !== 0) return diff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const countAll = results.length;
  const countChild = results.filter(r => r.priorityFlag === 'CHILD_ALONE').length;
  const countMedical = results.filter(r => r.priorityFlag === 'CRITICAL_MEDICAL').length;
  const countElderly = results.filter(r => r.priorityFlag === 'ELDERLY').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-900 text-xs font-bold uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          <span>Priority Triage Engine Active</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Family Verification & Search Portal
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Low-bandwidth, privacy-protected lookup. Verify official relief shelter registrations, track leads, and inspect urgent priority queues.
        </p>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto pt-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Full Name, Phone, or Report ID (e.g. MIS-7011)..."
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-600 focus:outline-none shadow-xs"
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary">
            <span>{isLoading ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-500">
          <span>Quick Demo Searches:</span>
          <button
            onClick={() => { setQuery('Aarav'); setSearchParams({ q: 'Aarav' }); performSearch('Aarav'); }}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-md font-bold"
          >
            "Aarav" (👶 Child Alone)
          </button>
          <button
            onClick={() => { setQuery('Devi'); setSearchParams({ q: 'Devi' }); performSearch('Devi'); }}
            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-md font-bold"
          >
            "Devi Prasad" (⚠️ Critical Medical)
          </button>
          <button
            onClick={() => { setQuery('Meenakshi'); setSearchParams({ q: 'Meenakshi' }); performSearch('Meenakshi'); }}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-md font-bold"
          >
            "Meenakshi" (👵 Elderly)
          </button>
          <button
            onClick={() => { setQuery('Murugan'); setSearchParams({ q: 'Murugan' }); performSearch('Murugan'); }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
          >
            "Murugan" (Fuzzy Lead)
          </button>
        </div>
      </div>

      {/* PRIORITY TRIAGE FILTER BAR & SORTING */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-violet-600" />
            <span>Triage Priority Filter:</span>
          </div>

          <button
            type="button"
            onClick={() => setSortByPriority(!sortByPriority)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
              sortByPriority
                ? 'bg-violet-50 text-violet-900 border-violet-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-violet-600" />
            <span>{sortByPriority ? 'Sort: Highest Urgency First' : 'Sort: Most Recent'}</span>
          </button>
        </div>

        {/* Priority Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handlePrioritySelect('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
              priorityFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>All Records</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityFilter === 'ALL' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
              {countAll}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handlePrioritySelect('CHILD_ALONE')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
              priorityFilter === 'CHILD_ALONE'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200'
                : 'bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className="flex items-center gap-1">
              <span>🚨 Child Alone</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${priorityFilter === 'CHILD_ALONE' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-900'}`}>
              {countChild}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handlePrioritySelect('CRITICAL_MEDICAL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
              priorityFilter === 'CRITICAL_MEDICAL'
                ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200'
                : 'bg-red-50/70 text-red-800 border-red-200 hover:bg-red-100'
            }`}
          >
            <span>🏥 Medical Need</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${priorityFilter === 'CRITICAL_MEDICAL' ? 'bg-red-700 text-white' : 'bg-red-200 text-red-900'}`}>
              {countMedical}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handlePrioritySelect('ELDERLY')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
              priorityFilter === 'ELDERLY'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-200'
                : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>👵 Elderly (65+)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${priorityFilter === 'ELDERLY' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-950'}`}>
              {countElderly}
            </span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card-clean text-center py-12 text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Querying verified shelter records & reports...</p>
        </div>
      ) : hasSearched && filteredResults.length === 0 ? (
        <div className="card-clean text-center py-12 space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
          <h3 className="text-lg font-bold text-slate-800">
            No records found for "{query || priorityFilter.replace('_', ' ')}"
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try switching the triage filter to "All Records" or file a priority missing person report immediately.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => handlePrioritySelect('ALL')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
            >
              Show All Records
            </button>
            <Link to="/report-missing" className="btn-primary text-xs">
              File Missing Person Report
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredResults.map((item) => (
            <div
              key={item.id}
              className={`card-clean border-2 space-y-5 transition-all ${
                item.priorityFlag === 'CHILD_ALONE'
                  ? 'border-rose-400 bg-rose-50/15 shadow-sm'
                  : item.priorityFlag === 'CRITICAL_MEDICAL'
                  ? 'border-red-400 bg-red-50/15 shadow-sm'
                  : item.priorityFlag === 'ELDERLY'
                  ? 'border-amber-300 bg-amber-50/15'
                  : 'border-slate-200'
              }`}
            >
              {/* Emergency Escalation Banners for High-Priority Cases */}
              {item.priorityFlag === 'CHILD_ALONE' && (
                <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 text-white flex items-center justify-between text-xs font-bold shadow-xs">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                    <span>🚨 ESCALATED TRIAGE: UNACCOMPANIED CHILD &bull; Assigned to Child Welfare Coordinator</span>
                  </span>
                  <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                    PRIORITY 1
                  </span>
                </div>
              )}

              {item.priorityFlag === 'CRITICAL_MEDICAL' && (
                <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white flex items-center justify-between text-xs font-bold shadow-xs">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>🏥 MEDICAL TRIAGE ALERT: Critical Condition &bull; Urgent Medication / Clinic Support</span>
                  </span>
                  <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                    PRIORITY 2
                  </span>
                </div>
              )}

              {item.priorityFlag === 'ELDERLY' && (
                <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between text-xs font-bold shadow-xs">
                  <span className="flex items-center gap-2">
                    <span>👵 SENIOR CARE ALERT: Elderly Citizen &bull; Assisted Mobility Support Required</span>
                  </span>
                  <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                    PRIORITY 3
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-slate-900">{item.fullName}</h2>
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      ID: {item.reportCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Age: <strong>{item.approxAge || 'Unknown'} yrs</strong></span>
                    <span>Gender: <strong>{item.gender}</strong></span>
                    <span>Last seen: <strong>{item.lastSeenLocation}</strong></span>
                  </div>
                </div>

                <StatusBadge status={item.status} priority={item.priorityFlag} size="md" />
              </div>

              {item.verificationBadge && (
                <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-300 text-emerald-950 flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-extrabold text-sm block">
                      OFFICIALLY VERIFIED SAFE AT {item.verificationBadge.campName.toUpperCase()}
                    </span>
                    <p className="text-xs text-emerald-800">
                      Located at: <strong>{item.verificationBadge.campLocation}</strong>. Verification timestamp: {new Date(item.verificationBadge.verifiedDate || Date.now()).toLocaleString()}. You may visit the shelter reception or contact camp officials.
                    </p>
                  </div>
                </div>
              )}

              {item.rumorControlNotice && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-800 block">
                      Rumor Control Notice: Active Lead Under Coordinator Review
                    </span>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      {item.rumorControlNotice.message}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Verification Timeline & Audit Trail
                </h4>
                <div className="relative border-l-2 border-teal-500 ml-3 pl-4 space-y-4">
                  {item.timeline.map((event: any, idx: number) => (
                    <div key={event.id || idx} className="relative text-xs">
                      <span className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                      <div className="flex flex-wrap items-center gap-2 font-bold text-slate-800">
                        <span className="text-teal-700">{event.status.replace(/_/g, ' ')}</span>
                        <span className="text-slate-400 font-normal">via {event.source.replace(/_/g, ' ')}</span>
                        <span className="text-slate-400 font-normal text-[10px]">
                          ({new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })})
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{event.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
                <div className="space-y-0.5">
                  <div>
                    <span>Registered by: </span>
                    <strong className="text-slate-700">{item.reporterName}</strong>
                    <span className="ml-2 font-mono">({item.reporterPhoneMasked})</span>
                  </div>
                  {item.familyGroup && (
                    <div className="text-teal-700 font-medium">
                      <span>Family Group Pass: </span>
                      <strong className="font-mono">{item.familyGroup.token}</strong>
                    </div>
                  )}
                </div>

                {item.familyGroup && (
                  <Link
                    to={`/family-token?token=${item.familyGroup.token}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold border border-teal-200 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Family QR Pass</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
