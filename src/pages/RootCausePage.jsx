import React, { useState, useMemo } from 'react';
import { useDataset } from '../context/DatasetContext';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import Table from '../components/Table';
import {
  BrainCircuit,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  Layers,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code2,
  Lightbulb,
  CheckCircle2,
  Lock,
  Info
} from 'lucide-react';

const REMEDIATION_MAP = {
  'Repeated Batch Processing': {
    action: 'Enable Delta Lake Idempotent Writes',
    code: 'spark.conf.set("spark.databricks.delta.write.txnAppId", appId)\nspark.conf.set("spark.databricks.delta.write.txnVersion", batchId)',
    tip: 'Configure idempotent transaction tracking in PySpark write streams so repeated batches are recognized and deduplicated by Delta Lake transaction logs.'
  },
  'Incorrect Merge Keys': {
    action: 'Define Compound Primary Key in MERGE Clause',
    code: 'MERGE INTO target t USING source s\nON t.order_id = s.order_id AND t.customer_id = s.customer_id\nWHEN MATCHED THEN UPDATE SET t.payment_status = s.payment_status',
    tip: 'Ensure the ON clause matches the complete compound primary key grain so state updates update existing entities in-place rather than inserting duplicate rows.'
  },
  'Source Inconsistency': {
    action: 'Enforce Upstream Entity Resolution & Crosswalk',
    code: 'spark.read.table("raw_events")\n  .join(broadcast(master_identity_crosswalk), "customer_email")\n  .write.format("delta").mode("append").saveAsTable("unified_events")',
    tip: 'Deploy unified customer/transaction identity resolution prior to Delta Lake ingestion to harmonize records originating from multiple upstream systems.'
  },
  'JOIN Multiplication': {
    action: 'Deduplicate Dimension Lookup Grain',
    code: 'WITH unique_rates AS (\n  SELECT currency_id, MAX(rate) as rate FROM exchange_rates GROUP BY currency_id\n)\nSELECT f.*, r.rate FROM fact_orders f JOIN unique_rates r ON f.currency_id = r.currency_id',
    tip: 'Verify that lookup dimension tables satisfy 1-to-1 primary key uniqueness constraints before joining to avoid Cartesian fanout multiplication.'
  },
  'Late-Arriving Records': {
    action: 'Configure Streaming Watermark Window',
    code: 'streaming_df.withWatermark("transaction_date", "24 hours")\n  .dropDuplicates(["order_id", "transaction_date"])',
    tip: 'Set an explicit watermark window in PySpark structured streaming, routing events arriving outside the window to a dedicated late-arriving reconciliation table.'
  },
  'Unknown': {
    action: 'Data Steward Reconciliation & Quarantine',
    code: '-- Safe isolation to Delta quarantine table\nINSERT INTO delta_quarantine_records SELECT * FROM pending_stream WHERE quality_flag = \'DISCREPANT\';',
    tip: 'Preserve all original raw records safely without deletion. Quarantine ambiguous records for human steward inspection.'
  }
};

const CATEGORY_DEFINITIONS = [
  { name: 'Repeated Batch Processing', desc: 'Re-ingesting same raw file or batch without idempotency checks.' },
  { name: 'Incorrect Merge Keys', desc: 'Incomplete compound primary key defined in incremental MERGE clauses.' },
  { name: 'Source Inconsistency', desc: 'Disparate upstream CRM or webhook APIs emitting duplicates.' },
  { name: 'JOIN Multiplication', desc: '1-to-many fanout caused by non-unique lookup table in dimension join.' },
  { name: 'Late-Arriving Records', desc: 'Out-of-order offline events arriving after the processing watermark.' },
];

export default function RootCausePage() {
  const { analysisResults, setActiveTab } = useDataset();

  // State for filtering and group inspection
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null); // groupId currently being inspected

  if (!analysisResults) {
    return (
      <EmptyState
        title="Root Cause Insights Unavailable"
        description="Please upload a dataset and run duplicate analysis to view root-cause diagnostic findings."
      />
    );
  }

  const { rootCauses = [], duplicateGroups = [] } = analysisResults;

  // Filter root causes based on category, status, and search query
  const filteredCauses = useMemo(() => {
    return rootCauses.filter(cause => {
      // Category filter
      if (selectedCategory !== 'ALL' && cause.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && cause.statusType !== statusFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = cause.title.toLowerCase().includes(q);
        const matchesExplanation = cause.explanation.toLowerCase().includes(q);
        const matchesEvidence = cause.evidence.toLowerCase().includes(q);
        const matchesGroups = (cause.affectedGroups || []).some(g => g.toLowerCase().includes(q));
        if (!matchesTitle && !matchesExplanation && !matchesEvidence && !matchesGroups) {
          return false;
        }
      }
      return true;
    });
  }, [rootCauses, selectedCategory, statusFilter, searchQuery]);

  // Find records for the currently expanded group
  const activeGroupRecords = useMemo(() => {
    if (!expandedGroup) return null;
    return duplicateGroups.find(g => g.groupId === expandedGroup);
  }, [expandedGroup, duplicateGroups]);

  // Categories list with counts for pill buttons
  const availableCategories = useMemo(() => {
    const cats = new Set(rootCauses.map(c => c.category));
    return ['ALL', ...Array.from(cats)];
  }, [rootCauses]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 m-0">Root-Cause Diagnostic Engine</h2>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3" />
              Non-Destructive Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 m-0">
            Empirical diagnostic engine identifying pipeline root causes behind detected duplicate records with verified evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-950/70 border border-indigo-800 text-indigo-300 text-xs px-3 py-1.5 rounded-lg">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <span>Diagnostic Models Evaluated: <strong>5 Pipeline Categories</strong></span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by root cause, evidence keyword, or group (e.g. DG-001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
            <span className="text-[11px] text-slate-500 font-semibold uppercase">Status:</span>
            {['ALL', 'Confirmed', 'Possible'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-500 font-semibold uppercase flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            Category:
          </span>
          {availableCategories.map((cat) => {
            const count = cat === 'ALL'
              ? rootCauses.length
              : rootCauses.filter(c => c.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-950 border border-indigo-700 text-indigo-300 font-semibold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{cat === 'ALL' ? 'All Findings' : cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-800 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Root Causes Findings List */}
      <div className="space-y-4">
        {filteredCauses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300 m-0">No Diagnostic Findings Match Filters</h3>
            <p className="text-xs text-slate-500 m-0">Try clearing the search query or adjusting your category/status filters.</p>
          </div>
        ) : (
          filteredCauses.map((cause) => {
            const isConfirmed = cause.statusType === 'Confirmed';
            const remediation = REMEDIATION_MAP[cause.category] || REMEDIATION_MAP['Unknown'];

            return (
              <div
                key={cause.id}
                className={`bg-slate-900 border rounded-xl p-5 space-y-4 transition ${
                  isConfirmed ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/80 bg-slate-900/80'
                }`}
              >
                {/* Cause Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg border ${
                        isConfirmed
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                          : 'bg-purple-950/60 text-purple-400 border-purple-800/60'
                      }`}
                    >
                      {isConfirmed ? <ShieldCheck className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 font-bold bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded">
                          {cause.id}
                        </span>
                        <h3 className="text-base font-bold text-slate-100 m-0">{cause.title}</h3>
                      </div>
                      <span className="text-xs text-indigo-400 font-medium">{cause.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Confidence</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              cause.confidenceScore >= 85 ? 'bg-emerald-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${cause.confidenceScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {cause.confidenceScore}%
                        </span>
                      </div>
                    </div>

                    <StatusBadge
                      type={isConfirmed ? 'CONFIRMED' : 'POSSIBLE'}
                      text={isConfirmed ? 'Confirmed Cause' : 'Possible Cause'}
                    />
                  </div>
                </div>

                {/* Explanation & Empirical Evidence Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Explanation */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Diagnostic Mechanism
                    </span>
                    <p className="text-slate-300 leading-relaxed m-0">{cause.explanation}</p>
                  </div>

                  {/* Supporting Empirical Evidence */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-indigo-400">
                      Supporting Empirical Evidence
                    </span>
                    <p className="text-slate-200 leading-relaxed font-mono text-[11px] m-0 bg-slate-900/90 p-2.5 rounded border border-slate-800">
                      {cause.evidence}
                    </p>
                  </div>
                </div>

                {/* Recommended Remediation Strategy */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Recommended PySpark & Delta Lake Remediation:</span>
                      <span className="text-indigo-400 font-mono text-[11px]">{remediation.action}</span>
                    </div>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300 bg-slate-950 p-2.5 rounded border border-slate-800/90 overflow-x-auto m-0">
                    {remediation.code}
                  </pre>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span>{remediation.tip}</span>
                  </div>
                </div>

                {/* Affected Records & Interactive Group Inspector */}
                <div className="pt-2 border-t border-slate-800/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>Affected Records: <strong className="text-rose-400 font-mono">{cause.affectedCount}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>Impacted Groups (Click to Inspect Records):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(cause.affectedGroups || []).map(g => {
                          const isExpanded = expandedGroup === g;
                          return (
                            <button
                              key={g}
                              onClick={() => setExpandedGroup(isExpanded ? null : g)}
                              className={`font-mono text-[10px] px-2 py-0.5 rounded border transition flex items-center gap-1 ${
                                isExpanded
                                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                              }`}
                            >
                              <span>{g}</span>
                              {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-500 italic">
                      {isConfirmed ? 'Empirically verified from dataset attributes' : 'Candidate driver identified based on attribute heuristics'}
                    </span>
                  </div>

                  {/* Inline Group Record Inspector if one of this cause's groups is expanded */}
                  {expandedGroup && (cause.affectedGroups || []).includes(expandedGroup) && activeGroupRecords && (
                    <div className="bg-slate-950 border border-indigo-900/60 rounded-xl p-4 space-y-3 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-bold text-slate-200 m-0">
                            Inline Record Inspector: Group {activeGroupRecords.groupId} ({activeGroupRecords.recordCount} duplicate rows)
                          </h4>
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 border border-indigo-800 px-1.5 py-0.5 rounded">
                            {activeGroupRecords.matchType}
                          </span>
                        </div>

                        <button
                          onClick={() => setActiveTab('duplicates')}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/60 border border-indigo-800/80 px-2 py-1 rounded"
                        >
                          <span>Open in Duplicate Analysis Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 m-0">{activeGroupRecords.reason}</p>

                      {/* Records Table */}
                      <Table
                        columns={Object.keys(activeGroupRecords.records[0] || {})}
                        data={activeGroupRecords.records}
                        highlightKeys={activeGroupRecords.keyColumns}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5 Pipeline Category Reference Guide Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold">
          <Info className="w-4 h-4" />
          <span>Supported Diagnostic Cause Categories</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORY_DEFINITIONS.map((cat) => (
            <div key={cat.name} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 space-y-1">
              <span className="text-xs font-semibold text-slate-200 block">{cat.name}</span>
              <p className="text-[11px] text-slate-400 m-0">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
