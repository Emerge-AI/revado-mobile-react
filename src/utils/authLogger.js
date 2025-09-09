/**
 * Authentication Logger Utility
 * Tracks sign-in and sign-up durations and saves logs to files
 */

class AuthLogger {
  constructor() {
    this.startTime = null;
    this.authType = null;
    this.deviceType = this.getDeviceType();
  }

  /**
   * Detect device type from user agent
   */
  getDeviceType() {
    const ua = navigator.userAgent;

    if (/iPhone|iPad|iPod/i.test(ua)) {
      return 'ios';
    }
    if (/Android/i.test(ua)) {
      return 'android';
    }
    if (/Mobile/i.test(ua)) {
      return 'mobile';
    }
    if (/Macintosh|Mac OS/i.test(ua)) {
      return 'mac';
    }
    if (/Windows/i.test(ua)) {
      return 'windows';
    }
    if (/Linux/i.test(ua)) {
      return 'linux';
    }
    return 'desktop';
  }

  /**
   * Start tracking authentication time
   * @param {string} type - 'signin' or 'signup'
   */
  startTracking(type) {
    this.startTime = Date.now();
    this.authType = type;
    console.log(`[AuthLogger] Started tracking ${type} at ${new Date().toISOString()}`);
  }

  /**
   * Stop tracking and save log
   * @param {object} userData - User information for the log
   * @returns {object} Log data that was saved
   */
  async stopTracking(userData = {}) {
    if (!this.startTime) {
      console.warn('[AuthLogger] No tracking session started');
      return null;
    }

    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000; // Duration in seconds

    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      authType: this.authType,
      deviceType: this.deviceType,
      duration: duration,
      durationFormatted: this.formatDuration(duration),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      platform: navigator.platform,
      language: navigator.language,
      ...userData
    };

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${this.deviceType}_${this.authType}.json`;

    // Save to localStorage (since we can't write to filesystem directly from browser)
    this.saveToLocalStorage(filename, logEntry);

    // Reset tracking
    this.startTime = null;
    this.authType = null;

    console.log(`[AuthLogger] Completed ${logEntry.authType} tracking:`, {
      duration: logEntry.durationFormatted,
      device: logEntry.deviceType
    });

    return logEntry;
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(seconds) {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Save log to localStorage (simulating file system)
   * In production, this would send to a backend API
   */
  saveToLocalStorage(filename, data) {
    try {
      // Get existing logs
      const existingLogs = JSON.parse(localStorage.getItem('authLogs') || '{}');

      // Add new log
      existingLogs[filename] = data;

      // Keep only last 100 logs to prevent localStorage overflow
      const logKeys = Object.keys(existingLogs);
      if (logKeys.length > 100) {
        const sortedKeys = logKeys.sort();
        const keysToRemove = sortedKeys.slice(0, logKeys.length - 100);
        keysToRemove.forEach(key => delete existingLogs[key]);
      }

      // Save back to localStorage
      localStorage.setItem('authLogs', JSON.stringify(existingLogs));

      console.log(`[AuthLogger] Log saved: /logs/${filename}`);
    } catch (error) {
      console.error('[AuthLogger] Failed to save log:', error);
    }
  }

  /**
   * Get all logs from localStorage
   */
  static getAllLogs() {
    try {
      return JSON.parse(localStorage.getItem('authLogs') || '{}');
    } catch (error) {
      console.error('[AuthLogger] Failed to retrieve logs:', error);
      return {};
    }
  }

  /**
   * Clear all logs
   */
  static clearLogs() {
    localStorage.removeItem('authLogs');
    console.log('[AuthLogger] All logs cleared');
  }

  /**
   * Export logs as downloadable file
   */
  static exportLogs() {
    const logs = AuthLogger.getAllLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `auth-logs-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}

// Create singleton instance
const authLogger = new AuthLogger();

export default authLogger;
export { AuthLogger };
