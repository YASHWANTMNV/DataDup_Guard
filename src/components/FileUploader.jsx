import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, Trash2, ArrowRight, AlertCircle, Play, Sparkles, Server } from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import { useDataset } from '../context/DatasetContext';

export default function FileUploader() {
  const { 
    handleFileUpload, 
    runAnalysis, 
    datasetInfo, 
    resetDataset, 
    analysisState, 
    errorMessage, 
    setErrorMessage,
    loadSampleDataset,
    backendStatus 
  } = useDataset();

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes

  // Safeguard: Prevent browser from intercepting file drops anywhere on window/document
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', preventDefaults, false);
    window.addEventListener('drop', preventDefaults, false);
    document.addEventListener('dragover', preventDefaults, false);
    document.addEventListener('drop', preventDefaults, false);

    return () => {
      window.removeEventListener('dragover', preventDefaults, false);
      window.removeEventListener('drop', preventDefaults, false);
      document.removeEventListener('dragover', preventDefaults, false);
      document.removeEventListener('drop', preventDefaults, false);
    };
  }, []);

  // Validate supported file extension (.csv, .xlsx, .xls) and size limit (up to 200MB)
  const validateFile = (file) => {
    if (!file) return false;
    const ext = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['csv', 'xlsx', 'xls'];

    if (!validExtensions.includes(ext)) {
      setErrorMessage(`Invalid file format ".${ext}". Please upload a CSV (.csv) or Excel file (.xlsx, .xls).`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File "${file.name}" (${formatBytes(file.size)}) exceeds the maximum allowed limit of 200MB. Please upload a file up to 200MB.`);
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const onDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const onFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        handleFileUpload(file);
      }
    }
  };

  const onFileSelect = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        handleFileUpload(file);
      }
    }
    // Reset file input value so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    resetDataset();
  };

  const triggerBrowse = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const isUploading = analysisState === 'uploading';
  const isAnalyzing = analysisState === 'analyzing';

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-100 tracking-tight m-0">Upload Dataset for Diagnosis</h2>
        <p className="text-xs text-slate-400">
          Upload your target CSV or Excel dataset to initiate duplicate detection and root-cause diagnostic scanning.
        </p>
      </div>

      {/* Backend Status Advisory Notice */}
      {!backendStatus?.connected && (
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3 text-xs text-amber-200">
          <Server className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <span className="font-semibold text-amber-300">Backend Server Offline (Running in Demo Mode)</span>
            <p className="text-slate-400 m-0">
              Files up to 200MB are supported. Start the Python backend with <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">python backend/app.py</code> for full multi-threaded PySpark dataset processing.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="bg-rose-950/80 border border-rose-600/50 rounded-xl p-3.5 flex items-start gap-3 text-xs text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold m-0">Upload / Processing Error</p>
            <p className="m-0 mt-0.5 text-rose-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Hidden File Input (Kept outside container to prevent double click bubbling) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, .xlsx, .xls"
        className="hidden"
        style={{ display: 'none' }}
        onChange={onFileSelect}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Drag & Drop Upload Zone */}
      {!datasetInfo && !selectedFile ? (
        <div
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onFileDrop}
          onClick={triggerBrowse}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer select-none ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
              : 'border-slate-700 bg-slate-950/60 hover:border-slate-500 hover:bg-slate-950'
          }`}
        >
          <div className="pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-slate-700">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200 m-0">
              Drag and drop dataset here, or <span className="text-indigo-400 hover:underline">Browse Files</span>
            </p>
            <p className="text-xs text-slate-400 mt-1.5 m-0">
              Supports CSV (.csv) and Excel (.xlsx, .xls) files up to 200MB
            </p>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 px-2.5 py-0.5 rounded-full">
              <span>Max size: <strong>200MB</strong></span>
              <span className="text-slate-600">•</span>
              <span>Formats: <strong>CSV, XLSX, XLS</strong></span>
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded-lg flex-shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-100 truncate m-0">
                  {datasetInfo?.name || selectedFile?.name}
                </p>
                {(datasetInfo?.size || selectedFile?.size || 0) > 20 * 1024 * 1024 && (
                  <span className="text-[10px] bg-indigo-950 border border-indigo-800 text-indigo-300 px-1.5 py-0.2 rounded font-mono font-medium flex-shrink-0">
                    High Capacity (200MB Limit)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>Size: <strong className="text-slate-300">{formatBytes(datasetInfo?.size || selectedFile?.size)}</strong></span>
                <span>Type: <strong className="text-indigo-300 uppercase">{datasetInfo?.type || 'CSV'}</strong></span>
                {datasetInfo?.rowCount && (
                  <span>Rows: <strong className="text-slate-300">{datasetInfo.rowCount.toLocaleString()}</strong></span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={isAnalyzing}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer disabled:opacity-40"
            title="Remove file"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Action Buttons Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            loadSampleDataset();
          }}
          disabled={isAnalyzing}
          className="w-full sm:w-auto text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-800 hover:bg-slate-800 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Or test with built-in Sample Dataset</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            runAnalysis();
          }}
          disabled={!datasetInfo && !selectedFile || isUploading || isAnalyzing}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
            !datasetInfo && !selectedFile || isUploading || isAnalyzing
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Dataset...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Analyze Dataset</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
