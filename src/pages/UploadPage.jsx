import React from 'react';
import FileUploader from '../components/FileUploader';
import { ShieldCheck, Database, Layers, CheckCircle2 } from 'lucide-react';

export default function UploadPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs px-3 py-1 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>DataDup Guard Platform</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight m-0">
            Duplicate-Safe Incremental Merge Diagnostics
          </h1>
          <p className="text-sm text-slate-400 m-0 leading-relaxed">
            DataDup Guard scans datasets to detect duplicates, diagnose root causes in data pipelines (such as repeated batch processing or incorrect merge keys), and recommend safe actions (KEEP, MERGE, QUARANTINE) without blindly deleting records.
          </p>
        </div>

        {/* Capstone Badge Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-shrink-0 text-xs text-slate-300 space-y-2 w-full md:w-64">
          <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase font-bold tracking-wider">
          </div>
          <p className="font-semibold text-slate-200 m-0">Capstone DEAI-10</p>
          <p className="text-slate-400 text-[11px] m-0">Incremental Data Lake Diagnostics & Non-Destructive Reconciliation</p>
        </div>
      </div>

      {/* Main File Upload Area */}
      <FileUploader />

      {/* Workflow Steps Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h3 className="text-sm font-semibold text-slate-200 m-0">Upload Dataset</h3>
          <p className="text-xs text-slate-400 m-0">Select CSV or Excel files containing incremental data rows (up to 200MB).</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h3 className="text-sm font-semibold text-slate-200 m-0">Detect Duplicates</h3>
          <p className="text-xs text-slate-400 m-0">Identify exact, key-based, and potential fuzzy duplicate groups.</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h3 className="text-sm font-semibold text-slate-200 m-0">Diagnose Root Cause</h3>
          <p className="text-xs text-slate-400 m-0">Analyze batch failures, join fanouts, or key mismatches.</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center font-bold text-xs">
            4
          </div>
          <h3 className="text-sm font-semibold text-slate-200 m-0">Safe Actions & Report</h3>
          <p className="text-xs text-slate-400 m-0">Review non-destructive KEEP, MERGE, QUARANTINE recommendations.</p>
        </div>
      </div>
    </div>
  );
}
