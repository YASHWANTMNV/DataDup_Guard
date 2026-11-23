import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = 'indigo', badge }) {
  const colorMap = {
    indigo: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
    emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    amber: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    rose: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    blue: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    slate: 'border-slate-700 text-slate-400 bg-slate-800/50'
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${selectedColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-100 tracking-tight">
            {value}
          </span>
          {badge && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
              {badge}
            </span>
          )}
        </div>
        {subtext && (
          <p className="text-xs text-slate-400 mt-1">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
