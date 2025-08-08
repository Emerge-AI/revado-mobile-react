import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthLogger } from '../utils/authLogger';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

function LogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const allLogs = AuthLogger.getAllLogs();
    setLogs(allLogs);
  };

  const clearAllLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      AuthLogger.clearLogs();
      loadLogs();
    }
  };

  const exportLogs = () => {
    AuthLogger.exportLogs();
  };

  const getDeviceIcon = (deviceType) => {
    if (['ios', 'android', 'mobile'].includes(deviceType)) {
      return <DevicePhoneMobileIcon className="w-5 h-5" />;
    }
    return <ComputerDesktopIcon className="w-5 h-5" />;
  };

  const getAuthTypeColor = (authType) => {
    return authType === 'signin' ? 'text-blue-600' : 'text-green-600';
  };

  const sortedLogs = Object.entries(logs).sort((a, b) => 
    new Date(b[1].timestamp) - new Date(a[1].timestamp)
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="pt-safe-top px-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Authentication Logs
          </h1>
          <div className="flex gap-2">
            <button
              onClick={exportLogs}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Export logs"
            >
              <ArrowDownTrayIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={clearAllLogs}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              title="Clear all logs"
            >
              <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {sortedLogs.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Logs</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {sortedLogs.filter(([_, log]) => log.authType === 'signin').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Sign Ins</p>
          </div>
        </div>

        {/* Logs List */}
        {sortedLogs.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No logs yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Authentication events will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLogs.map(([filename, log]) => (
              <motion.button
                key={filename}
                onClick={() => setSelectedLog(selectedLog === filename ? null : filename)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      log.authType === 'signin' 
                        ? 'bg-blue-100 dark:bg-blue-900/30' 
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      {getDeviceIcon(log.deviceType)}
                    </div>
                    <div>
                      <p className={`font-semibold ${getAuthTypeColor(log.authType)}`}>
                        {log.authType === 'signin' ? 'Sign In' : 'Sign Up'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {log.deviceType}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {log.durationFormatted}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedLog === filename && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="text-gray-900 dark:text-white font-mono">
                          {log.email || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Method:</span>
                        <span className="text-gray-900 dark:text-white">
                          {log.method || 'password'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="text-gray-900 dark:text-white">
                          {log.duration.toFixed(2)}s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Screen:</span>
                        <span className="text-gray-900 dark:text-white">
                          {log.screenResolution}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                        <span className="text-gray-900 dark:text-white">
                          {log.platform}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Language:</span>
                        <span className="text-gray-900 dark:text-white">
                          {log.language}
                        </span>
                      </div>
                      <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">User Agent:</p>
                        <p className="text-xs text-gray-900 dark:text-white font-mono break-all">
                          {log.userAgent}
                        </p>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          File: /logs/{filename}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LogsPage;