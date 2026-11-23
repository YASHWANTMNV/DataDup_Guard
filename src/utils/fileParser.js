import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Browser-side dataset file parser for CSV and Excel files.
 * Provides client-side fallback parsing when backend PySpark API is operating in demo mode.
 * Supports files up to 200MB (samples rows on large files in pure browser mode to protect DOM/JS heap).
 */
export async function parseDatasetFile(file) {
  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB limit
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of 200MB.`);
  }

  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
      // Sample first 10,000 rows on files > 5MB to protect browser main thread and memory
      const shouldSample = file.size > 5 * 1024 * 1024;
      const previewLimit = shouldSample ? 10000 : 0;

      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        preview: previewLimit,
        complete: (results) => {
          if (results.errors && results.errors.length > 0 && (!results.data || results.data.length === 0)) {
            reject(new Error(`CSV Parsing Error: ${results.errors[0].message}`));
            return;
          }

          const rows = (results.data || []).slice(0, 10000);
          const columns = results.meta?.fields || (rows.length > 0 ? Object.keys(rows[0]) : []);

          resolve({
            fileName: file.name,
            fileSize: file.size,
            fileType: 'CSV',
            rows,
            columns,
            isSampled: shouldSample
          });
        },
        error: (err) => reject(new Error(`CSV Read Error: ${err.message || 'Unable to parse CSV file.'}`))
      });
    } else if (['xlsx', 'xls'].includes(extension)) {
      const isLargeExcel = file.size > 10 * 1024 * 1024;
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          // For Excel files in browser mode, cap sheetRows to 10,000 rows to prevent browser OOM
          const workbook = XLSX.read(data, { 
            type: 'array',
            sheetRows: 10000
          });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            throw new Error('Excel workbook contains no sheets.');
          }
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          const rows = jsonData.slice(0, 10000);
          const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

          resolve({
            fileName: file.name,
            fileSize: file.size,
            fileType: extension.toUpperCase(),
            rows,
            columns,
            isSampled: isLargeExcel
          });
        } catch (err) {
          reject(new Error(`Excel Parsing Error: ${err.message || 'Unable to parse Excel file.'}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file from browser storage.'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error(`Unsupported file format ".${extension}". Please upload a CSV (.csv) or Excel file (.xlsx, .xls).`));
    }
  });
}
