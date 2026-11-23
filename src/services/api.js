/**
 * Centralized API Service Layer
 * 
 * Provides HTTP client abstraction and configurable base URL via VITE_API_BASE_URL.
 * Supports health check diagnostics to detect active Python (PySpark/Delta Lake) backend.
 */

// Base API URL configured through environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Low-level HTTP fetch wrapper with error handling and JSON parsing
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Accept': 'application/json',
  };

  // If payload is not FormData, set Content-Type to JSON
  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message || errorData.detail) {
          errorMessage = errorData.message || errorData.detail;
        }
      } catch (e) {
        // Fallback to text error message if response is not JSON
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.warn(`[DataDup Guard API] Call to ${endpoint} failed:`, error.message);
    throw error;
  }
}

/**
 * Checks whether the Python PySpark backend server is online and reachable
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second quick check timeout

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return { connected: true, details: data };
    }
    return { connected: false, reason: 'Non-200 response' };
  } catch (err) {
    return { connected: false, reason: err.message };
  }
}
