import React from 'react';
import { useDataset } from '../context/DatasetContext';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { 
  Rows3, 
  Columns3, 
  FileQuestion, 
  CopyCheck, 
  Percent, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  Server
} from 'lucide-react';

export default function OverviewPage() {
  const { analysisResults, datasetInfo, backendStatus, setActiveTab } = useDataset();

  if (!analysisResults || !datasetInfo) {
    return <EmptyState title="Overview Unavailable" description="Please upload or select a dataset and run analysis to view the diagnostic summary." />;
  }

  const { summary } = analysisResults;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Backend & Real/Mock Mode Notice Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${backendStatus.connected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200 m-0">
              {backendStatus.connected ? 'Live PySpark / Delta Lake Backend Active' : 'Demo Diagnostic Pipeline Active'}
            </h2>
            <p className="text-xs text-slate-400 m-0">
              {backendStatus.connected 
                ? 'Results returned directly from PySpark distributed execution engine.'
                : 'Using browser client-side parser & pre-packaged synthetic incremental diagnostic models.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Dataset:</span>
          <span className="text-xs font-semibold text-indigo-300 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            {datasetInfo.name}
          </span>
        </div>
      </div>

      {/* 6 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Rows"
          value={summary.totalRows.toLocaleString()}
          subtext="Total records in dataset"
          icon={Rows3}
          color="indigo"
        />

        <StatCard
          title="Total Columns"
          value={summary.totalColumns.toString()}
          subtext="Schema fields count"
          icon={Columns3}
          color="blue"
        />

        <StatCard
          title="Missing Values"
          value={summary.missingValuesCount.toLocaleString()}
          subtext="Null or empty attributes"
          icon={FileQuestion}
          color="amber"
        />

        <StatCard
          title="Duplicate Records"
          value={summary.duplicateRecordsCount.toLocaleString()}
          subtext={`Across ${summary.duplicateGroupsCount} duplicate groups`}
          icon={CopyCheck}
          color="rose"
        />

        <StatCard
          title="Duplicate Percentage"
          value={`${summary.duplicatePercentage}%`}
          subtext="Of total dataset volume"
          icon={Percent}
          color={summary.duplicatePercentage > 5 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Analysis Status"
          value={summary.status}
          subtext={`Completed at ${summary.lastAnalyzed}`}
          icon={Activity}
          color="emerald"
        />
      </div>

      {/* Short Analysis Summary Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Info className="w-4 h-4" />
          <span>Analysis Summary & Findings</span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed m-0 bg-slate-950 p-4 rounded-lg border border-slate-800/80">
          {summary.summaryText}
        </p>

        {/* Quick Navigation Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <button
            onClick={() => setActiveTab('profile')}
            className="bg-slate-950 hover:bg-slate-800/60 border border-slate-800 p-4 rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
          >
            <div>
              <p className="text-xs text-slate-400 font-medium m-0">Step 1</p>
              <h3 className="text-sm font-semibold text-slate-200 m-0 group-hover:text-indigo-300">
                Inspect Dataset Profile
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setActiveTab('duplicates')}
            className="bg-slate-950 hover:bg-slate-800/60 border border-slate-800 p-4 rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
          >
            <div>
              <p className="text-xs text-slate-400 font-medium m-0">Step 2</p>
              <h3 className="text-sm font-semibold text-slate-200 m-0 group-hover:text-indigo-300">
                View Duplicate Groups ({summary.duplicateGroupsCount})
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setActiveTab('root-causes')}
            className="bg-slate-950 hover:bg-slate-800/60 border border-slate-800 p-4 rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
          >
            <div>
              <p className="text-xs text-slate-400 font-medium m-0">Step 3</p>
              <h3 className="text-sm font-semibold text-slate-200 m-0 group-hover:text-indigo-300">
                Diagnose Root Causes
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
