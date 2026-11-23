import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Table({ columns, data, highlightKeys = [], keyColumnName = 'order_id' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter rows based on search input
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data || [];
    const term = searchTerm.toLowerCase();
    return (data || []).filter((row) =>
      Object.values(row || {}).some(
        (val) => val !== null && String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-3">
      {/* Table controls header: search & page size */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-md border border-slate-800 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-850 border-b border-slate-800 text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              {columns.map((col) => {
                const isHighlightKey = highlightKeys.includes(col);
                return (
                  <th
                    key={col}
                    className={`px-3 py-2.5 whitespace-nowrap ${
                      isHighlightKey
                        ? 'bg-amber-950/40 text-amber-300 border-x border-amber-800/40 font-bold'
                        : ''
                    }`}
                  >
                    {col}
                    {isHighlightKey && <span className="ml-1 text-[10px] text-amber-400 font-mono">(Key)</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {currentRows.length > 0 ? (
              currentRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition">
                  {columns.map((col) => {
                    const isHighlightKey = highlightKeys.includes(col);
                    const cellValue = row[col];

                    return (
                      <td
                        key={col}
                        className={`px-3 py-2 font-mono whitespace-nowrap ${
                          isHighlightKey
                            ? 'bg-amber-950/20 text-amber-200 font-medium border-x border-amber-900/30'
                            : ''
                        }`}
                      >
                        {cellValue === null || cellValue === undefined ? (
                          <span className="text-slate-600 italic font-sans text-[10px]">null</span>
                        ) : (
                          String(cellValue)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 py-1">
        <span>
          Showing {filteredData.length > 0 ? startIndex + 1 : 0} to{' '}
          {Math.min(startIndex + pageSize, filteredData.length)} of {filteredData.length} records
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 py-0.5 font-medium text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
