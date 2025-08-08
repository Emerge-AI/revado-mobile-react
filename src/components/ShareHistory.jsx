import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ShareIcon,
  AtSymbolIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  ClockIcon as ClockIconSolid,
  XCircleIcon as XCircleIconSolid
} from '@heroicons/react/24/solid';

function ShareHistory({ isOpen, onClose }) {
  const [shareHistory, setShareHistory] = useState([]);
  const [selectedShare, setSelectedShare] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadShareHistory();
    }
  }, [isOpen]);

  const loadShareHistory = () => {
    const history = JSON.parse(localStorage.getItem('shareHistory') || '[]');
    // Sort by most recent first
    const sortedHistory = history.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));
    setShareHistory(sortedHistory);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIconSolid className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <ClockIconSolid className="w-5 h-5 text-orange-500" />;
      case 'failed':
        return <XCircleIconSolid className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'failed':
        return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'emailjs':
        return <PaperAirplaneIcon className="w-4 h-4 text-blue-500" />;
      case 'mailto':
        return <AtSymbolIcon className="w-4 h-4 text-gray-500" />;
      default:
        return <ShareIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today at ' + date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 2) {
      return 'Yesterday at ' + date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${Math.round(kb)} KB`;
    }
    const mb = kb / 1024;
    return `${Math.round(mb * 10) / 10} MB`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { velocity }) => {
              if (velocity.y > 500) {
                onClose();
              }
            }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              mass: 0.8
            }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-white dark:bg-gray-900 rounded-t-3xl max-h-[85vh] flex flex-col">
              {/* Handle - Make it draggable */}
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Share History
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {shareHistory.length} total shares
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {shareHistory.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12 px-6"
                  >
                    <ShareIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Shares Yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Your share history will appear here after you send records to healthcare providers.
                    </p>
                  </motion.div>
                ) : (
                  <div className="px-6 py-4 space-y-3">
                    {shareHistory.map((share, index) => (
                      <motion.div
                        key={share.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="group"
                      >
                        <div 
                          className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer"
                          onClick={() => setSelectedShare(
                            selectedShare === share.id ? null : share.id
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
                                {getStatusIcon(share.status)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {share.recipientEmail}
                                  </h3>
                                  {getMethodIcon(share.method)}
                                </div>
                                
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  {formatDate(share.sharedAt)}
                                </p>
                                
                                <div className="flex items-center space-x-2">
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(share.status)}`}>
                                    {share.status}
                                  </span>
                                  
                                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {share.recordCount} {share.recordCount === 1 ? 'record' : 'records'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <motion.div
                              animate={{ rotate: selectedShare === share.id ? 180 : 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              className="p-1"
                            >
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </motion.div>
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {selectedShare === share.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400">Method:</span>
                                      <p className="text-gray-900 dark:text-white font-medium capitalize">
                                        {share.method === 'emailjs' ? 'Direct Email' : 'Mail Client'}
                                      </p>
                                    </div>
                                    
                                    {share.pdfSize && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">PDF Size:</span>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                          {formatFileSize(share.pdfSize)}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {share.emailMessageId && (
                                      <div className="col-span-2">
                                        <span className="text-gray-500 dark:text-gray-400">Message ID:</span>
                                        <p className="text-gray-900 dark:text-white font-mono text-xs break-all">
                                          {share.emailMessageId}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {share.error && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                      <div className="flex items-start space-x-2">
                                        <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <p className="text-sm font-medium text-red-700 dark:text-red-300">Error</p>
                                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                            {share.error}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ShareHistory;