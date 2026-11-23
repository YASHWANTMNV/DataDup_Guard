import React from 'react';
import { ShieldCheck, Server, Sparkles, Database, FileSpreadsheet } from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function Header() {
  const { backendStatus, datasetInfo, loadSampleDataset, resetDataset } = useDataset();

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Title & Project Subtitle */}
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 p-2 rounded-lg flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-100 tracking-wide m-0">DataDup Guard</h1>
            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded font-mono border border-slate-700">
              DEAI-10
            </span>
          </div>
          <p className="text-xs text-slate-400 m-0">
            Duplicate-Safe Incremental Merge Diagnostics & Repair
          </p>
        </div>
      </div>

      {/* Center/Right Actions: Backend Connection Status & Dataset Indicator */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Backend Connectivity Status Badge */}
        <div 
          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
            backendStatus.connected
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
          }`}
          title={backendStatus.reason}
        >
          <span className={`w-2 h-2 rounded-full ${backendStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <Server className="w-3.5 h-3.5" />
          <span className="font-medium">
            {backendStatus.connected ? 'PySpark Backend Connected' : 'Demo / Mock Mode'}
          </span>
        </div>

        {/* Active Dataset Badge (If Loaded) */}
        {datasetInfo ? (
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium max-w-[160px] truncate">{datasetInfo.name}</span>
            <button
              onClick={resetDataset}
              className="text-slate-400 hover:text-rose-400 ml-1 font-bold cursor-pointer"
              title="Change or upload different dataset"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={loadSampleDataset}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Sample Data</span>
          </button>
        )}
      </div>
    </header>
  );
}
