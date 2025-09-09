// API configuration - compatible with both Vite and Jest
const getEnvVar = (key, defaultValue) => {
  // Support both Vite (import.meta.env) and Jest/Node (process.env)
  if (typeof import !== 'undefined' && import.meta && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return process.env[key] || defaultValue;
};

const API_BASE_URL = getEnvVar('VITE_API_URL', 'http://localhost:3001/api');

// Get user ID (in production, this would come from auth)
const getUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || 'demo-user';
};

/**
 * API service for backend communication
 */
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('[API Service] Making request to:', url);
    console.log('[API Service] Request method:', options.method || 'GET');
    
    const config = {
      ...options,
      headers: {
        'X-User-Id': getUserId(),
        ...options.headers,
      },
    };
    
    console.log('[API Service] Request headers:', config.headers);
    
    // Add content-type for JSON requests
    if (options.body && !(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(options.body);
      console.log('[API Service] Request body:', options.body);
    }
    
    try {
      console.log('[API Service] Sending fetch request...');
      const response = await fetch(url, config);
      
      console.log('[API Service] Response status:', response.status);
      console.log('[API Service] Response statusText:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API Service] Error response body:', errorText);
        
        let error;
        try {
          const errorJson = JSON.parse(errorText);
          error = new Error(errorJson.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch {
          error = new Error(`${response.status} ${errorText}`);
        }
        
        throw error;
      }
      
      const responseData = await response.json();
      console.log('[API Service] Response data:', responseData);
      return responseData;
    } catch (error) {
      console.error('[API Service] Request failed:', error);
      console.error('[API Service] Error details:', {
        message: error.message,
        stack: error.stack,
        url: url,
        method: options.method || 'GET'
      });
      throw error;
    }
  }

  /**
   * Health check
   */
  async checkHealth() {
    return this.request('/health');
  }

  /**
   * Upload single file
   */
  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', getUserId());
    
    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
      }
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      // Setup request
      xhr.open('POST', `${this.baseURL}/upload/single`);
      xhr.setRequestHeader('X-User-Id', getUserId());
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files, onProgress) {
    const formData = new FormData();
    
    for (const file of files) {
      formData.append('files', file);
    }
    formData.append('userId', getUserId());
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
      }
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      xhr.open('POST', `${this.baseURL}/upload/multiple`);
      xhr.setRequestHeader('X-User-Id', getUserId());
      xhr.send(formData);
    });
  }

  /**
   * Get all records
   */
  async getRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/records?${queryString}` : '/records';
    return this.request(endpoint);
  }

  /**
   * Get single record
   */
  async getRecord(id) {
    return this.request(`/records/${id}`);
  }

  /**
   * Update record
   */
  async updateRecord(id, updates) {
    return this.request(`/records/${id}`, {
      method: 'PUT',
      body: updates,
    });
  }

  /**
   * Delete record
   */
  async deleteRecord(id, permanent = false) {
    const endpoint = permanent ? `/records/${id}?permanent=true` : `/records/${id}`;
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Delete uploaded file
   */
  async deleteUploadedFile(id) {
    return this.request(`/upload/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get upload status
   */
  async getUploadStatus(id) {
    return this.request(`/upload/status/${id}`);
  }

  /**
   * Trigger processing for a record
   */
  async processRecord(id) {
    return this.request(`/records/process/${id}`, {
      method: 'POST',
    });
  }

  /**
   * Toggle record visibility
   */
  async toggleRecordVisibility(id, hidden) {
    return this.updateRecord(id, { hidden });
  }

  /**
   * Analyze record with AI
   */
  async analyzeRecord(id) {
    console.log('[API Service] analyzeRecord called with ID:', id);
    const result = await this.request(`/analyze/${id}`, {
      method: 'POST',
    });
    console.log('[API Service] analyzeRecord result:', result);
    return result;
  }

  /**
   * Check if backend is available
   */
  async isBackendAvailable() {
    try {
      const health = await this.checkHealth();
      return health.status === 'healthy';
    } catch (error) {
      console.error('Backend not available:', error);
      return false;
    }
  }

  /**
   * Analyze medical image
   */
  async analyzeImage(formData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Analysis failed: ${xhr.statusText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during analysis'));
      });
      
      xhr.open('POST', `${this.baseURL}/image-analysis/analyze`);
      xhr.setRequestHeader('X-User-Id', getUserId());
      xhr.send(formData);
    });
  }

  /**
   * Get image analysis by ID
   */
  async getImageAnalysis(id) {
    return this.request(`/image-analysis/${id}`);
  }

  /**
   * Get image analyses for a record
   */
  async getRecordImageAnalyses(recordId) {
    return this.request(`/image-analysis/record/${recordId}`);
  }

  /**
   * Get image analysis statistics
   */
  async getImageAnalysisStats() {
    return this.request('/image-analysis/stats/summary');
  }
}

// Create singleton instance
const apiService = new ApiService();

// Export both the class and instance
export { ApiService };
export default apiService;