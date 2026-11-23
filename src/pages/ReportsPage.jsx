import React, { useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Printer,
  CopyCheck,
  Server
} from 'lucide-react';

export default function ReportsPage() {
  const { analysisResults, datasetInfo, backendStatus } = useDataset();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!analysisResults || !datasetInfo) {
    return <EmptyState title="Report Unavailable" description="Please upload a dataset and run duplicate analysis to generate an audit report." />;
  }

  const { summary, report, rootCauses, duplicateGroups } = analysisResults;

  // Export report as JSON file
  const handleDownloadJSON = () => {
    const reportData = {
      title: 'DataDup Guard Audit & Reconciliation Report',
      project: 'Capstone DEAI-10',
      datasetName: datasetInfo.name,
      generatedAt: new Date().toISOString(),
      backendMode: backendStatus.connected ? 'PySpark Live Backend' : 'Demo Mode',
      summary,
      beforeAndAfterVerification: report,
      rootCauses,
      recommendedActions: duplicateGroups.map(g => ({
        groupId: g.groupId,
        action: g.recommendation,
        reason: g.recommendationText,
        keyColumns: g.keyColumns
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DataDup_Guard_Report_${datasetInfo.name.replace(/\.[^/.]+$/, '')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Browser print report trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-100 m-0">Audit & Reconciliation Report</h2>
          <p className="text-xs text-slate-400 m-0">
            Comprehensive diagnostic summary report for dataset <strong className="text-slate-200">{datasetInfo.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl font-medium flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Download Report (JSON)</span>
          </button>
        </div>
      </div>

      {/* Download Toast Alert */}
      {downloadSuccess && (
        <div className="bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Audit report JSON successfully downloaded to your device!</span>
          </div>
        </div>
      )}

      {/* Main Printable Report Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Printable Header */}
        <div className="border-b border-slate-800 print:border-black pb-6 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400 print:text-black" />
              <h1 className="text-xl font-bold text-slate-100 print:text-black tracking-wide m-0">
                DataDup Guard — Diagnostic Audit Report
              </h1>
            </div>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-1 m-0">
              DEAI-10 Capstone Project • Duplicate-Safe Incremental Merge Diagnostics
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-gray-600 space-y-0.5">
            <div>Generated: <strong className="text-slate-200 print:text-black">{report.generatedAt}</strong></div>
            <div>Dataset: <strong className="text-indigo-300 print:text-black font-mono">{datasetInfo.name}</strong></div>
            <div>Mode: <strong className="text-emerald-400 print:text-black">{backendStatus.connected ? 'PySpark Backend' : 'Demo Engine'}</strong></div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 print:text-black uppercase tracking-wider m-0">
            1. Executive Diagnostic Summary
          </h3>
          <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed bg-slate-950 print:bg-gray-100 p-4 rounded-lg border border-slate-800 print:border-gray-300 m-0">
            {summary.summaryText}
          </p>
        </div>

        {/* Section 2: Before & After Reconciliation Simulation Metrics */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 print:text-black uppercase tracking-wider m-0">
            2. Before & After Reconciliation Simulation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before Metrics */}
            <div className="bg-slate-950 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 print:border-gray-300 pb-2">
                <span className="text-xs font-semibold text-rose-400 print:text-red-700">Before Reconciliation</span>
                <span className="text-[10px] text-slate-500 font-mono">RAW INGESTION</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Total Rows:</span>
                  <strong className="text-slate-200 print:text-black font-mono">{report.beforeMetrics.totalRows.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Unique Entities:</span>
                  <strong className="text-slate-200 print:text-black font-mono">{report.beforeMetrics.uniqueEntities.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Duplicate Rows:</span>
                  <strong className="text-rose-400 print:text-red-700 font-mono">{report.beforeMetrics.duplicateRows.toLocaleString()} ({report.beforeMetrics.duplicatePercentage})</strong>
                </div>
              </div>
            </div>

            {/* After Simulation Metrics */}
            <div className="bg-slate-950 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 print:border-gray-300 pb-2">
                <span className="text-xs font-semibold text-emerald-400 print:text-green-700">After Non-Destructive Strategy</span>
                <span className="text-[10px] text-slate-500 font-mono">SIMULATION</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Cleaned Record Count:</span>
                  <strong className="text-slate-200 print:text-black font-mono">{report.afterSimulationMetrics.totalRows.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Quarantined Records:</span>
                  <strong className="text-amber-400 print:text-amber-700 font-mono">{report.afterSimulationMetrics.quarantinedRows.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 print:text-gray-600">Data Quality Score:</span>
                  <strong className="text-emerald-400 print:text-green-700 font-mono">{report.afterSimulationMetrics.dataCleanlinessScore}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Recommended Action Strategy Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 print:text-black uppercase tracking-wider m-0">
            3. Recommended Action Strategy (Non-Destructive)
          </h3>

          <div className="overflow-x-auto rounded-lg border border-slate-800 print:border-gray-300">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 print:bg-gray-200 text-slate-400 print:text-gray-700 uppercase text-[10px] border-b border-slate-800 print:border-gray-300 font-semibold">
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Record Volume</th>
                  <th className="px-4 py-2.5">Percentage</th>
                  <th className="px-4 py-2.5">Operational Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300 text-slate-300 print:text-black">
                {report.actionsSummary.map((act) => (
                  <tr key={act.action} className="hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-bold">
                      <StatusBadge type={act.action} text={act.action} />
                    </td>
                    <td className="px-4 py-2.5 font-mono">{act.count} Records</td>
                    <td className="px-4 py-2.5 font-mono text-indigo-300 print:text-black">{act.percent}</td>
                    <td className="px-4 py-2.5">{act.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Root Cause Diagnostic Summary Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 print:text-black uppercase tracking-wider m-0">
            4. Identified Root Cause Diagnostic Findings
          </h3>

          <div className="space-y-2">
            {rootCauses.map((cause) => (
              <div key={cause.id} className="bg-slate-950 print:bg-gray-50 border border-slate-800 print:border-gray-300 rounded-lg p-3 text-xs flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-bold">{cause.id}</span>
                    <strong className="text-slate-200 print:text-black">{cause.title}</strong>
                    <span className="text-[10px] text-indigo-400 font-mono">({cause.category})</span>
                  </div>
                  <p className="text-[11px] text-slate-400 print:text-gray-600 m-0 mt-0.5">{cause.explanation}</p>
                </div>
                <StatusBadge type={cause.statusType} text={`${cause.statusType} (${cause.confidenceScore}%)`} />
              </div>
            ))}
          </div>
        </div>

        {/* Report Footer Notice */}
        <div className="border-t border-slate-800 print:border-gray-300 pt-4 text-[11px] text-slate-500 print:text-gray-500 flex justify-between items-center">
          <span>DataDup Guard — DEAI-10 Capstone Review Artifact</span>
          <span>End of Audit Report</span>
        </div>
      </div>
    </div>
  );
}
