import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/api';
import { uploadDataset, startDuplicateAnalysis } from '../services/datasetService';
import { SAMPLE_DATASET_NAME, SAMPLE_RAW_ROWS, MOCK_ANALYSIS_RESULTS } from '../services/mockData';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  // Navigation active tab: 'upload' | 'overview' | 'profile' | 'duplicates' | 'root-causes' | 'reports'
  const [activeTab, setActiveTab] = useState('upload');
  
  // Backend connection status
  const [backendStatus, setBackendStatus] = useState({
    checking: true,
    connected: false,
    reason: ''
  });

  // Current dataset metadata & raw file info
  const [datasetInfo, setDatasetInfo] = useState(null);

  // Workflow processing states
  const [analysisState, setAnalysisState] = useState('idle'); // 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);

  // Analysis result payload
  const [analysisResults, setAnalysisResults] = useState(null);

  // Check backend health on app load
  useEffect(() => {
    async function verifyBackend() {
      const status = await checkBackendHealth();
      setBackendStatus({
        checking: false,
        connected: status.connected,
        reason: status.connected ? 'PySpark Backend Connected' : 'Demo / Mock Mode Active'
      });
    }
    verifyBackend();
  }, []);

  // Handler 1: Upload dataset file
  const handleFileUpload = async (file) => {
    setErrorMessage(null);
    setAnalysisState('uploading');

    try {
      const uploadRes = await uploadDataset(file, backendStatus.connected);
      setDatasetInfo({
        id: uploadRes.datasetId || `DS-${Date.now()}`,
        name: uploadRes.fileName || file.name,
        size: uploadRes.fileSize || file.size,
        type: uploadRes.fileType || 'CSV',
        rawRows: uploadRes.rawRows || [],
        rawColumns: uploadRes.rawColumns || [],
        rowCount: uploadRes.rowCount || 0,
        columnCount: uploadRes.columnCount || 0
      });
      setAnalysisState('idle');
      return true;
    } catch (err) {
      setErrorMessage(err.message || 'Failed to upload dataset file.');
      setAnalysisState('error');
      return false;
    }
  };

  // Handler 2: Load built-in sample dataset for quick capstone review
  const loadSampleDataset = () => {
    setErrorMessage(null);
    setDatasetInfo({
      id: 'DS-SAMPLE-101',
      name: SAMPLE_DATASET_NAME,
      size: 142850,
      type: 'CSV',
      rawRows: SAMPLE_RAW_ROWS,
      rawColumns: Object.keys(SAMPLE_RAW_ROWS[0]),
      rowCount: 1250,
      columnCount: 10
    });
    setAnalysisResults(MOCK_ANALYSIS_RESULTS);
    setAnalysisState('completed');
    setActiveTab('overview');
  };

  // Handler 3: Execute duplicate analysis & root cause diagnostic workflow
  const runAnalysis = async () => {
    if (!datasetInfo) {
      setErrorMessage('Please select or upload a dataset first.');
      return;
    }

    setErrorMessage(null);
    setAnalysisState('analyzing');

    try {
      const results = await startDuplicateAnalysis(
        datasetInfo.id,
        backendStatus.connected,
        datasetInfo.rawRows
      );
      setAnalysisResults(results);
      setAnalysisState('completed');
      setActiveTab('overview'); // Guide user to Overview upon successful analysis
    } catch (err) {
      setErrorMessage(err.message || 'Error occurred during duplicate analysis.');
      setAnalysisState('error');
    }
  };

  // Handler 4: Reset dataset & clear state
  const resetDataset = () => {
    setDatasetInfo(null);
    setAnalysisResults(null);
    setAnalysisState('idle');
    setErrorMessage(null);
    setActiveTab('upload');
  };

  return (
    <DatasetContext.Provider
      value={{
        activeTab,
        setActiveTab,
        backendStatus,
        datasetInfo,
        analysisState,
        errorMessage,
        setErrorMessage,
        analysisResults,
        handleFileUpload,
        loadSampleDataset,
        runAnalysis,
        resetDataset
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
}
