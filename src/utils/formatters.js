/**
 * Utility functions for formatting numbers, byte sizes, percentages, and text.
 */

// Formats file sizes into human readable strings (e.g. 1.2 MB)
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Formats large numbers with commas (e.g. 12,450)
export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString();
}

// Formats decimals as percentage string (e.g. 9.4%)
export function formatPercent(val, decimals = 1) {
  if (val === undefined || val === null) return '0%';
  return `${Number(val).toFixed(decimals)}%`;
}

// Truncates long text nicely with ellipsis
export function truncateText(text, maxLength = 30) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
