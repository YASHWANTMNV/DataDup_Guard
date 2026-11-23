import React from 'react';
import { 
  UploadCloud, 
  LayoutDashboard, 
  Database, 
  CopyCheck, 
  BrainCircuit, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function Sidebar() {
  const { activeTab, setActiveTab, datasetInfo, analysisResults } = useDataset();

  const navItems = [
    { id: 'upload', label: 'Dataset Upload', icon: UploadCloud, subtitle: 'File Selection & Import' },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, subtitle: 'Summary & Key Metrics' },
    { id: 'profile', label: 'Dataset Profile', icon: Database, subtitle: 'Schema & Data Quality' },
    { id: 'duplicates', label: 'Duplicate Analysis', icon: CopyCheck, subtitle: 'Group Detection & Records' },
    { id: 'root-causes', label: 'Root-Cause Insights', icon: BrainCircuit, subtitle: 'Diagnostic Causes & Evidence' },
    { id: 'reports', label: 'Reports', icon: FileText, subtitle: 'Audit & Recommendation Strategy' },
  ];

  const hasResults = Boolean(analysisResults);

  return (
    <aside className="w-full lg:w-64 bg-slate-900/90 border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0 p-4">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase mb-2">
          Dashboard Navigation
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isDisabled = item.id !== 'upload' && !datasetInfo;

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && setActiveTab(item.id)}
              disabled={isDisabled}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/20'
                  : isDisabled
                  ? 'text-slate-600 cursor-not-allowed opacity-60'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div className="truncate">
                  <div className="text-sm font-medium leading-tight truncate">{item.label}</div>
                  <div className={`text-[11px] truncate ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {/* Status indicator badge */}
              {hasResults && item.id !== 'upload' && (
                <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-200' : 'text-emerald-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Dataset quick info card at bottom of sidebar */}
      {datasetInfo && (
        <div className="mt-8 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold uppercase text-[10px] text-slate-500">Active Dataset</span>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.2 rounded font-mono">
              {datasetInfo.type}
            </span>
          </div>
          <p className="font-medium text-slate-200 truncate">{datasetInfo.name}</p>
          <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Rows: <strong className="text-slate-200">{datasetInfo.rowCount ? datasetInfo.rowCount.toLocaleString() : '1,250'}</strong></span>
            <span>Cols: <strong className="text-slate-200">{datasetInfo.columnCount || '10'}</strong></span>
          </div>
        </div>
      )}
    </aside>
  );
}
