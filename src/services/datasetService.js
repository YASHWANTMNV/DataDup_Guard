import { apiRequest } from './api';
import { MOCK_ANALYSIS_RESULTS, SAMPLE_RAW_ROWS } from './mockData';
import { parseDatasetFile } from '../utils/fileParser';
import { classifyDatasetClientSide } from '../utils/rootCauseEngine';

/**
 * Service Abstraction for PySpark & Delta Lake Backend Integration
 * 
 * Provides reusable functions for dataset upload, profiling, duplicate detection,
 * root-cause diagnosis, action recommendations, and report generation.
 * 
 * When VITE_API_BASE_URL is connected to a live Python backend, it executes HTTP requests.
 * When operating in Demo Mode, it provides client-side parsing and structured diagnostic mock data.
 */

/**
 * 1. Upload Dataset
 * Backend Endpoint: POST /api/v1/datasets/upload (multipart/form-data)
 */
export async function uploadDataset(file, isConnected = false) {
  if (isConnected) {
    const formData = new FormData();
    formData.append('file', file);
    return await apiRequest('/datasets/upload', {
      method: 'POST',
      body: formData
    });
  }

  // Demo / Fallback mode: parse CSV/Excel locally
  const parsed = await parseDatasetFile(file);
  return {
    datasetId: `DS-${Date.now()}`,
    fileName: parsed.fileName,
    fileSize: parsed.fileSize,
    fileType: parsed.fileType,
    rowCount: parsed.rows.length,
    columnCount: parsed.columns.length,
    rawRows: parsed.rows,
    rawColumns: parsed.columns,
    message: 'Dataset uploaded and parsed successfully (Demo Mode).'
  };
}

/**
 * 2. Start Duplicate Analysis & Diagnostics
 * Backend Endpoint: POST /api/v1/analysis/start
 * Request Payload: { datasetId: string, options: object }
 */
export async function startDuplicateAnalysis(datasetId, isConnected = false, rawRows = null) {
  if (isConnected) {
    return await apiRequest('/analysis/start', {
      method: 'POST',
      body: { datasetId }
    });
  }

  // Demo Mode simulation delay for realistic UX review
  await new Promise((res) => setTimeout(res, 1200));

  // If user uploaded a custom file, compute real client-side evidence-based classification
  if (rawRows && rawRows.length > 0) {
    const totalRows = rawRows.length;
    const totalColumns = Object.keys(rawRows[0] || {}).length;

    // Run evidence-based classification on client
    const classified = classifyDatasetClientSide(rawRows);
    const duplicateRecordsCount = classified.totalDuplicateRecords;
    const dupPct = totalRows > 0 ? ((duplicateRecordsCount / totalRows) * 100).toFixed(2) : '0';

    return {
      summary: {
        ...MOCK_ANALYSIS_RESULTS.summary,
        totalRows,
        totalColumns,
        duplicateRecordsCount,
        duplicatePercentage: parseFloat(dupPct),
        duplicateGroupsCount: classified.duplicateGroups.length,
        summaryText: `Analysis scanned ${totalRows.toLocaleString()} records. Identified ${duplicateRecordsCount} duplicate records across ${classified.duplicateGroups.length} groups.`
      },
      profile: {
        ...MOCK_ANALYSIS_RESULTS.profile,
        dimensions: `${totalRows.toLocaleString()} Rows × ${totalColumns} Columns`,
      },
      duplicateCategories: classified.duplicateCategories,
      duplicateGroups: classified.duplicateGroups,
      rootCauses: classified.rootCauses,
      report: {
        ...MOCK_ANALYSIS_RESULTS.report,
        beforeMetrics: {
          totalRows,
          uniqueEntities: Math.max(0, totalRows - duplicateRecordsCount + classified.duplicateGroups.length),
          duplicateRows: duplicateRecordsCount,
          duplicatePercentage: `${dupPct}%`
        }
      }
    };
  }

  return MOCK_ANALYSIS_RESULTS;
}

/**
 * 3. Retrieve Dataset Profile
 * Backend Endpoint: GET /api/v1/datasets/:datasetId/profile
 */
export async function getDatasetProfile(datasetId, isConnected = false) {
  if (isConnected) {
    return await apiRequest(`/datasets/${datasetId}/profile`);
  }
  return MOCK_ANALYSIS_RESULTS.profile;
}

/**
 * 4. Retrieve Duplicate Groups
 * Backend Endpoint: GET /api/v1/analysis/:datasetId/duplicates
 */
export async function getDuplicateGroups(datasetId, isConnected = false) {
  if (isConnected) {
    return await apiRequest(`/analysis/${datasetId}/duplicates`);
  }
  return {
    categories: MOCK_ANALYSIS_RESULTS.duplicateCategories,
    groups: MOCK_ANALYSIS_RESULTS.duplicateGroups
  };
}

/**
 * 5. Retrieve Root-Cause Insights
 * Backend Endpoint: GET /api/v1/analysis/:datasetId/root-causes
 */
export async function getRootCauseInsights(datasetId, isConnected = false) {
  if (isConnected) {
    return await apiRequest(`/analysis/${datasetId}/root-causes`);
  }
  return MOCK_ANALYSIS_RESULTS.rootCauses;
}

/**
 * 6. Retrieve Recommended Actions
 * Backend Endpoint: GET /api/v1/analysis/:datasetId/recommendations
 */
export async function getRecommendedActions(datasetId, isConnected = false) {
  if (isConnected) {
    return await apiRequest(`/analysis/${datasetId}/recommendations`);
  }
  return MOCK_ANALYSIS_RESULTS.duplicateGroups.map(g => ({
    groupId: g.groupId,
    recommendation: g.recommendation,
    recommendationText: g.recommendationText,
    matchType: g.matchType,
    keyColumns: g.keyColumns
  }));
}

/**
 * 7. Retrieve Report & Before/After Verification Metrics
 * Backend Endpoint: GET /api/v1/reports/:datasetId
 */
export async function getReport(datasetId, isConnected = false) {
  if (isConnected) {
    return await apiRequest(`/reports/${datasetId}`);
  }
  return MOCK_ANALYSIS_RESULTS.report;
}
