import React from 'react';
import { ShieldCheck, Clock, Eye, FileText, AlertTriangle } from 'lucide-react';
import { ReportStatus, PriorityFlag } from '../../types';

interface StatusBadgeProps {
  status: ReportStatus | 'PENDING';
  priority?: PriorityFlag;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, priority, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-3 py-1 font-semibold',
    lg: 'text-sm px-4 py-1.5 font-bold',
  };

  const getStatusContent = () => {
    switch (status) {
      case 'VERIFIED_SAFE':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-emerald-700" />,
          label: 'Verified Safe',
          className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'PENDING':
        return {
          icon: <Clock className="w-4 h-4 text-amber-700" />,
          label: 'Pending Verification',
          className: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'LOCATED_AT_CAMP':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-teal-700" />,
          label: 'Located at Camp',
          className: 'bg-teal-100 text-teal-800 border-teal-300',
        };
      case 'SIGHTED':
        return {
          icon: <Eye className="w-4 h-4 text-blue-700" />,
          label: 'Sighted',
          className: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'REPORTED':
      default:
        return {
          icon: <FileText className="w-4 h-4 text-slate-600" />,
          label: 'Reported',
          className: 'bg-slate-100 text-slate-700 border-slate-300',
        };
    }
  };

  const { icon, label, className } = getStatusContent();

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs ${className} ${sizeClasses[size]}`}
      >
        {icon}
        <span>{label}</span>
      </span>

      {priority === 'CHILD_ALONE' && (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-bold animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Child Traveling Alone
        </span>
      )}
      {priority === 'CRITICAL_MEDICAL' && (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 font-bold">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          Urgent Medical Need
        </span>
      )}
      {priority === 'ELDERLY' && (
        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold">
          Elderly
        </span>
      )}
    </div>
  );
};
