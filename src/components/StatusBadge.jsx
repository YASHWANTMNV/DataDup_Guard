import React from 'react';
import { CheckCircle, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

export default function StatusBadge({ type, text, size = 'normal' }) {
  const normalizedType = String(type || '').toUpperCase();

  let styleClasses = 'bg-slate-800 border-slate-700 text-slate-300';
  let IconComponent = Info;

  if (['KEEP'].includes(normalizedType)) {
    styleClasses = 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300';
    IconComponent = CheckCircle;
  } else if (['MERGE'].includes(normalizedType)) {
    styleClasses = 'bg-blue-950/70 border-blue-500/40 text-blue-300';
    IconComponent = Info;
  } else if (['QUARANTINE'].includes(normalizedType)) {
    styleClasses = 'bg-amber-950/70 border-amber-500/40 text-amber-300';
    IconComponent = AlertTriangle;
  } else if (['CONFIRMED', 'EXACT'].includes(normalizedType)) {
    styleClasses = 'bg-rose-950/70 border-rose-500/40 text-rose-300';
    IconComponent = ShieldAlert;
  } else if (['POSSIBLE', 'POTENTIAL', 'KEY-BASED'].includes(normalizedType)) {
    styleClasses = 'bg-purple-950/70 border-purple-500/40 text-purple-300';
    IconComponent = AlertTriangle;
  }

  const sizeClasses = size === 'small' 
    ? 'text-[11px] px-2 py-0.5 gap-1' 
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center font-semibold rounded-md border ${sizeClasses} ${styleClasses}`}>
      <IconComponent className="w-3 h-3 flex-shrink-0" />
      <span>{text || type}</span>
    </span>
  );
}
