import React, { useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import Table from '../components/Table';
import { CopyCheck, Eye, Layers, ShieldAlert, Sparkles, Filter, Info } from 'lucide-react';

export default function DuplicateAnalysisPage() {
  const { analysisResults } = useDataset();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  if (!analysisResults) {
    return <EmptyState title="Duplicate Analysis Unavailable" description="Upload a dataset and run analysis to view detected duplicate groups and records." />;
  }

  const { summary, duplicateCategories, duplicateGroups } = analysisResults;

  // Filter groups by category if filter selected
  const filteredGroups = categoryFilter === 'all'
    ? duplicateGroups
    : duplicateGroups.filter(g => g.category === categoryFilter);

  // Selected group object for record inspector
  const activeGroup = duplicateGroups.find(g => g.groupId === selectedGroupId) || filteredGroups[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 m-0">Duplicate Detection & Record Inspection</h2>
          <p className="text-xs text-slate-400 m-0">
            Detected {summary.duplicateRecordsCount} duplicate records across {summary.duplicateGroupsCount} duplicate groups.
          </p>
        </div>
      </div>

      {/* Duplicate Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Exact Duplicates */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === 'exact' ? 'all' : 'exact')}
          className={`bg-slate-900 border rounded-xl p-4 transition cursor-pointer ${
            categoryFilter === 'exact' ? 'border-rose-500 bg-rose-950/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <StatusBadge type="EXACT" text="Exact Duplicates" />
            <span className="text-xs font-mono font-semibold text-rose-400">
              {duplicateCategories.exactCount} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 m-0">
            100% field value identity across all columns. Indicates repeated batch ingestion or double insertion.
          </p>
        </div>

        {/* Key-Based Duplicates */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === 'key-based' ? 'all' : 'key-based')}
          className={`bg-slate-900 border rounded-xl p-4 transition cursor-pointer ${
            categoryFilter === 'key-based' ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <StatusBadge type="KEY-BASED" text="Key-Based Duplicates" />
            <span className="text-xs font-mono font-semibold text-blue-400">
              {duplicateCategories.keyBasedCount} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 m-0">
            Same primary business key (e.g. order_id) but containing updated attributes or state timestamps.
          </p>
        </div>

        {/* Potential Duplicates */}
        <div 
          onClick={() => setCategoryFilter(categoryFilter === 'potential' ? 'all' : 'potential')}
          className={`bg-slate-900 border rounded-xl p-4 transition cursor-pointer ${
            categoryFilter === 'potential' ? 'border-amber-500 bg-amber-950/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <StatusBadge type="POTENTIAL" text="Potential Duplicates" />
            <span className="text-xs font-mono font-semibold text-amber-400">
              {duplicateCategories.potentialCount} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 m-0">
            High natural key similarity (name, email, phone) with minor variations or key formatting discrepancies.
          </p>
        </div>
      </div>

      {/* Main Grid: Groups List (Left) and Record Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Duplicate Groups List */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200 m-0">Duplicate Groups</h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded text-slate-200 px-2 py-1 text-xs"
              >
                <option value="all">All Categories</option>
                <option value="exact">Exact Only</option>
                <option value="key-based">Key-Based Only</option>
                <option value="potential">Potential Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredGroups.map((group) => {
              const isSelected = activeGroup?.groupId === group.groupId;
              return (
                <div
                  key={group.groupId}
                  onClick={() => setSelectedGroupId(group.groupId)}
                  className={`p-3 rounded-lg border text-xs space-y-2 cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">{group.groupId}</span>
                    <StatusBadge type={group.recommendation} size="small" />
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="text-indigo-300 font-medium">{group.matchType}</span>
                    <span>{group.recordCount} Records</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 flex-wrap">
                    <span className="text-slate-500 font-semibold">Key Columns:</span>
                    {group.keyColumns.map(col => (
                      <span key={col} className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Record Inspector & Action Recommendation */}
        <div className="lg:col-span-7 space-y-4">
          {activeGroup ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              {/* Active Group Title & Action Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100 m-0">
                      Group Inspector: {activeGroup.groupId}
                    </h3>
                    <span className="bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs px-2 py-0.5 rounded font-mono">
                      {activeGroup.matchType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 m-0">
                    Comparing {activeGroup.recordCount} duplicate records in group.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400">Recommended Action:</span>
                  <StatusBadge type={activeGroup.recommendation} text={activeGroup.recommendation} />
                </div>
              </div>

              {/* Justification & Recommendation Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <Info className="w-4 h-4" />
                  <span>Recommendation & Justification</span>
                </div>
                <p className="text-xs text-slate-300 m-0">{activeGroup.recommendationText}</p>
                <div className="pt-1 text-[11px] text-slate-400 italic">
                  Note: All actions in DataDup Guard frontend are non-destructive recommendations. Data is preserved safely.
                </div>
              </div>

              {/* Highlighted Key Columns Banner */}
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-lg">
                <span className="font-semibold text-amber-300">Matching Key Columns:</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeGroup.keyColumns.map(col => (
                    <span key={col} className="bg-amber-900/60 text-amber-200 border border-amber-700/60 font-mono px-2 py-0.5 rounded text-[11px] font-bold">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Record Rows Comparison Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider m-0">
                  Duplicate Rows Breakdown
                </h4>
                <Table
                  columns={Object.keys(activeGroup.records[0] || {})}
                  data={activeGroup.records}
                  highlightKeys={activeGroup.keyColumns}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              Select a duplicate group from the left list to inspect its records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
