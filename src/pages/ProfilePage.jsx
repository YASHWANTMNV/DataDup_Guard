import React from 'react';
import { useDataset } from '../context/DatasetContext';
import EmptyState from '../components/EmptyState';
import Table from '../components/Table';
import StatCard from '../components/StatCard';
import { Layers, Database, ShieldCheck, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { analysisResults, datasetInfo } = useDataset();

  if (!analysisResults || !datasetInfo) {
    return <EmptyState title="Profile Unavailable" description="Please upload or select a dataset to view schema profile and data quality metrics." />;
  }

  const { profile } = analysisResults;

  // Use raw uploaded dataset rows or fallback preview sample rows
  const previewRows = datasetInfo.rawRows && datasetInfo.rawRows.length > 0
    ? datasetInfo.rawRows
    : analysisResults.duplicateGroups[0]?.records || [];

  const previewColumns = datasetInfo.rawColumns && datasetInfo.rawColumns.length > 0
    ? datasetInfo.rawColumns
    : profile.columns.map(c => c.name);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 m-0">Dataset Profile & Schema</h2>
          <p className="text-xs text-slate-400 m-0">
            Schema details, null value counts, and data quality metrics for <strong className="text-slate-200">{datasetInfo.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <Database className="w-4 h-4 text-indigo-400" />
          <span>Dimensions: <strong className="text-slate-100">{profile.dimensions}</strong></span>
        </div>
      </div>

      {/* Quality Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Completeness Score"
          value={`${profile.completenessScore}%`}
          subtext="Percentage of non-null field values"
          icon={ShieldCheck}
          color={profile.completenessScore > 90 ? 'emerald' : 'amber'}
        />

        <StatCard
          title="Uniqueness Score"
          value={`${profile.uniquenessScore}%`}
          subtext="Unique entity primary key ratio"
          icon={Layers}
          color="indigo"
        />

        <StatCard
          title="Total Columns"
          value={profile.columns.length.toString()}
          subtext="Schema attribute fields count"
          icon={FileSpreadsheet}
          color="blue"
        />
      </div>

      {/* Schema Attributes & Null Value Distribution Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 m-0">Schema Attributes & Data Quality</h3>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <th className="px-4 py-2.5">Column Name</th>
                <th className="px-4 py-2.5">Data Type</th>
                <th className="px-4 py-2.5">Null Count</th>
                <th className="px-4 py-2.5">Null %</th>
                <th className="px-4 py-2.5">Uniqueness</th>
                <th className="px-4 py-2.5">Sample Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {profile.columns.map((col) => (
                <tr key={col.name} className="hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-mono font-medium text-slate-100">{col.name}</td>
                  <td className="px-4 py-2.5 font-mono text-indigo-300">{col.dataType}</td>
                  <td className="px-4 py-2.5 font-mono">{col.nullCount}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${Math.min(col.nullPercentage, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px]">{col.nullPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono">{col.uniquenessScore}%</td>
                  <td className="px-4 py-2.5 font-mono text-slate-400 truncate max-w-[150px]">{col.sample}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Preview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 m-0">Dataset Data Preview</h3>
            <p className="text-xs text-slate-400 m-0">Inspect initial records with search & pagination.</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Showing raw rows</span>
        </div>

        <Table columns={previewColumns} data={previewRows} />
      </div>
    </div>
  );
}
