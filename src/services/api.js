// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
    
    const config = {
      ...options,
      headers: {
        'X-User-Id': getUserId(),
        ...options.headers,
      },
    };
    
    // Add content-type for JSON requests
    if (options.body && !(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
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
}

// Create singleton instance
const apiService = new ApiService();

// Export both the class and instance
export { ApiService };
export default apiService;