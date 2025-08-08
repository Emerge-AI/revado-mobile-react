import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import { 
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

function TimelinePage() {
  const { records, deleteRecord, toggleRecordVisibility } = useHealthRecords();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
  );

  const handleDelete = (recordId) => {
    deleteRecord(recordId);
    setDeleteConfirm(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-orange-500 animate-pulse" />;
      default:
        return <ClockIcon className="w-5 h-5 text-ios-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'processing':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-20">
      <div className="pt-safe-top px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Health Timeline
          </h1>
          <p className="text-ios-gray-600 dark:text-ios-gray-400 mt-1">
            {records.length} total records
          </p>
        </motion.div>

        {sortedRecords.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <DocumentTextIcon className="w-16 h-16 text-ios-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Records Yet
            </h3>
            <p className="text-ios-gray-600 dark:text-ios-gray-400">
              Upload your first health record to get started
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {sortedRecords.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className={`bg-ios-gray-100 dark:bg-ios-gray-900 rounded-2xl p-4 ${
                  record.hidden ? 'opacity-60' : ''
                }`}
              >
                <div 
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setSelectedRecord(
                    selectedRecord === record.id ? null : record.id
                  )}
                >
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(record.status)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {record.name}
                      </h3>
                      <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400">
                        {new Date(record.uploadedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          getStatusColor(record.status)
                        }`}>
                          {record.status}
                        </span>
                        {record.hidden && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-ios-gray-200 text-ios-gray-700 dark:bg-ios-gray-800 dark:text-ios-gray-300">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRightIcon className={`w-5 h-5 text-ios-gray-400 transition-transform ${
                    selectedRecord === record.id ? 'rotate-90' : ''
                  }`} />
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedRecord === record.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 mt-4 border-t border-ios-gray-200 dark:border-ios-gray-800">
                        {record.extractedData && (
                          <div className="mb-4 space-y-2">
                            <p className="text-sm">
                              <span className="text-ios-gray-500">Patient:</span>{' '}
                              <span className="text-gray-900 dark:text-white font-medium">
                                {record.extractedData.patientName}
                              </span>
                            </p>
                            <p className="text-sm">
                              <span className="text-ios-gray-500">Provider:</span>{' '}
                              <span className="text-gray-900 dark:text-white font-medium">
                                {record.extractedData.provider}
                              </span>
                            </p>
                            <p className="text-sm">
                              <span className="text-ios-gray-500">Type:</span>{' '}
                              <span className="text-gray-900 dark:text-white font-medium">
                                {record.extractedData.type}
                              </span>
                            </p>
                            <p className="text-sm">
                              <span className="text-ios-gray-500">Summary:</span>{' '}
                              <span className="text-gray-900 dark:text-white">
                                {record.extractedData.summary}
                              </span>
                            </p>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRecordVisibility(record.id);
                            }}
                            className="flex-1 bg-white dark:bg-ios-gray-800 py-2 rounded-xl font-medium text-sm flex items-center justify-center space-x-1 hover:bg-ios-gray-50 dark:hover:bg-ios-gray-700 transition-colors"
                          >
                            {record.hidden ? (
                              <>
                                <EyeIcon className="w-4 h-4" />
                                <span>Show</span>
                              </>
                            ) : (
                              <>
                                <EyeSlashIcon className="w-4 h-4" />
                                <span>Hide</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(record.id);
                            }}
                            className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2 rounded-xl font-medium text-sm flex items-center justify-center space-x-1 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-ios-gray-900 rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Record?
              </h3>
              <p className="text-sm text-ios-gray-600 dark:text-ios-gray-400 mb-6">
                This action cannot be undone. The record will be permanently removed.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-ios-gray-100 dark:bg-ios-gray-800 text-gray-900 dark:text-white py-2 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default TimelinePage;