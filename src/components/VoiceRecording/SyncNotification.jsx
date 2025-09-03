import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  CalendarDaysIcon,
  BeakerIcon,
  BellAlertIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

function SyncNotification({ syncResult, isVisible, onDismiss }) {
  if (!syncResult || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -100, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6 }}
                  className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
                >
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                </motion.div>
                <h3 className="text-white font-semibold">Calendar Sync Complete!</h3>
              </div>
              
              <button
                onClick={onDismiss}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Successfully synced to your calendar</span>
              <span className="text-xs text-gray-500">
                {new Date(syncResult.syncedAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>
            
            {/* Sync Summary */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-blue-900">
                  {syncResult.results?.filter(r => r.summary && !r.summary.includes('Take')).length || 0}
                </p>
                <p className="text-xs text-blue-600">Appointments</p>
              </div>
              
              <div className="text-center p-2 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <BeakerIcon className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm font-semibold text-purple-900">
                  {syncResult.results?.filter(r => r.summary && r.summary.includes('Take')).length || 0}
                </p>
                <p className="text-xs text-purple-600">Reminders</p>
              </div>
              
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <BellAlertIcon className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-green-900">
                  {syncResult.eventsCreated || 0}
                </p>
                <p className="text-xs text-green-600">Total Events</p>
              </div>
            </div>
            
            {/* Recent Events Preview */}
            {syncResult.results && syncResult.results.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Recent Events Added:</p>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {syncResult.results.slice(0, 3).map((event, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="truncate">{event.summary}</span>
                      <span className="text-gray-400 flex-shrink-0">
                        {new Date(event.start?.dateTime || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {syncResult.results.length > 3 && (
                    <p className="text-xs text-gray-500 italic pl-4">
                      +{syncResult.results.length - 3} more events...
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Quick Action */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Open calendar app (simulate)
                console.log('Opening calendar app...');
                onDismiss();
              }}
              className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              View in Calendar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SyncNotification;