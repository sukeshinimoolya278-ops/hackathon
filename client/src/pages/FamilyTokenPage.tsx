import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import {
  QrCode,
  Printer,
  Users,
  Search,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const FamilyTokenPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenParam = searchParams.get('token') || 'FAM-CHENNAI-8832';

  const [inputToken, setInputToken] = useState(tokenParam);
  const [familyData, setFamilyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFamily = async (tkn: string) => {
    if (!tkn.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getFamilyByToken(tkn.trim());
      setFamilyData(data);
    } catch (err: any) {
      setError(err.message || 'Family token not found');
      setFamilyData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tokenParam) {
      fetchFamily(tokenParam);
    }
  }, [tokenParam]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputToken.trim()) {
      setSearchParams({ token: inputToken.trim() });
      fetchFamily(inputToken.trim());
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="mb-2">
        <Link to="/" className="text-sm text-teal-700 hover:underline">
          &larr; Back to Home
        </Link>
      </div>

      <div className="card-clean space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-teal-600" />
            <span>Family Group QR Pass</span>
          </h1>
          <p className="text-xs text-slate-500">
            Scanning this token at camp checkpoints links all relatives and records their arrival together.
          </p>
        </div>

        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            placeholder="Enter Family Token (e.g. FAM-CHENNAI-4091, FAM-CHENNAI-8832)..."
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
          <button type="submit" disabled={isLoading} className="btn-primary">
            <span>Lookup</span>
          </button>
        </form>
      </div>

      {error ? (
        <div className="card-clean border-rose-300 text-rose-800 text-center py-8">
          <p className="font-bold">{error}</p>
          <p className="text-xs text-slate-500 mt-1">Try demo tokens: FAM-CHENNAI-4091 or FAM-CHENNAI-8832</p>
        </div>
      ) : familyData ? (
        <div className="card-clean border-2 border-teal-600/60 space-y-6 print:border-none print:shadow-none">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Official Relief Intake Pass</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight font-mono">{familyData.token}</h2>
              <p className="text-xs text-slate-500">{familyData.disaster}</p>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
              <QRCodeSVG value={familyData.token} size={110} />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Head of Household / Contact: </span>
              <strong className="text-slate-900 text-sm block">{familyData.primaryContactName}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Primary Contact Phone: </span>
              <strong className="text-slate-900 text-sm block font-mono">{familyData.contactPhone}</strong>
            </div>
            {familyData.notes && (
              <div className="sm:col-span-2 text-slate-600">
                <span>Notes: </span>
                <span>{familyData.notes}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Registered Group Members ({familyData.members.length})</span>
            </h3>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
              {familyData.members.map((member: any) => (
                <div key={member.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <strong className="text-slate-900 text-sm">{member.fullName}</strong>
                    <div className="text-slate-500 space-x-2 mt-0.5">
                      <span>Age: {member.approxAge || 'N/A'}</span>
                      <span>&bull;</span>
                      <span>Gender: {member.gender}</span>
                      {member.medicalNeeds && (
                        <>
                          <span>&bull;</span>
                          <span className="text-rose-700 font-semibold">{member.medicalNeeds}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
                      <Building className="w-3.5 h-3.5 text-teal-600" />
                      <span>{member.currentShelter}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="btn-secondary flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              <span>Print Physical QR Pass</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
