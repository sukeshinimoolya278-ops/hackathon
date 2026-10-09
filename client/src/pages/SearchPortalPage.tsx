import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { SearchResult } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Search,
  ShieldCheck,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  QrCode,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const SearchPortalPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
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
    if (queryParam) {
      performSearch(queryParam);
    }
  }, [queryParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      performSearch(query.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Family Verification & Search Portal
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Low-bandwidth, privacy-protected lookup. Verify official relief shelter registrations and track lead progress.
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
            onClick={() => { setQuery('Murugan'); setSearchParams({ q: 'Murugan' }); performSearch('Murugan'); }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
          >
            "Murugan" (Fuzzy Lead)
          </button>
          <button
            onClick={() => { setQuery('Aarav'); setSearchParams({ q: 'Aarav' }); performSearch('Aarav'); }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
          >
            "Aarav" (Child Alone)
          </button>
          <button
            onClick={() => { setQuery('Meenakshi'); setSearchParams({ q: 'Meenakshi' }); performSearch('Meenakshi'); }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
          >
            "Meenakshi" (Fallback)
          </button>
          <button
            onClick={() => { setQuery('Rajesh'); setSearchParams({ q: 'Rajesh' }); performSearch('Rajesh'); }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
          >
            "Rajesh" (Verified Safe)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card-clean text-center py-12 text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm">Querying verified shelter records & reports...</p>
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="card-clean text-center py-12 space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
          <h3 className="text-lg font-bold text-slate-800">No Verified Records Found for "{query}"</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            If you are searching for a missing relative, please file a report immediately so field volunteers can track them across camps.
          </p>
          <Link to="/report-missing" className="btn-primary mt-2">
            File Missing Person Report
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((item) => (
            <div key={item.id} className="card-clean border-2 border-slate-200 space-y-5">
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
