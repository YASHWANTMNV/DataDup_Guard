import React from 'react';
import { Database, UploadCloud, Sparkles } from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function EmptyState({ title, description }) {
  const { setActiveTab, loadSampleDataset } = useDataset();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center mx-auto shadow-inner">
        <Database className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-100 m-0">{title || 'No Dataset Analyzed Yet'}</h3>
        <p className="text-xs text-slate-400 m-0">
          {description || 'Upload a CSV or Excel dataset file on the upload page, or load our pre-packaged sample dataset to view duplicate detection and root-cause diagnostic findings.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => setActiveTab('upload')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition cursor-pointer shadow-md"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Dataset</span>
        </button>

        <button
          onClick={loadSampleDataset}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition cursor-pointer border border-slate-700"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Load Demo Sample Data</span>
        </button>
      </div>
    </div>
  );
}
