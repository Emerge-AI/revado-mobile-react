import { motion } from 'framer-motion';
import TimelineConnector from './TimelineConnector';
import {
  ArrowUpTrayIcon,
  PaperAirplaneIcon,
  DocumentIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  ChevronRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

function TimelineEvent({ 
  event, 
  onClick, 
  viewMode = 'list',
  isFirst = false,
  isLast = false,
  showConnector = true,
  isActive = false
}) {
  const isShare = event.type === 'share';
  const isUpload = event.type === 'upload';
  
  // Determine event styling based on type
  const getEventStyles = () => {
    if (isShare) {
      return {
        bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
        textColor: 'text-purple-700 dark:text-purple-300',
        badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
      };
    }
    return {
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      textColor: 'text-blue-700 dark:text-blue-300',
      badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
    };
  };

  const styles = getEventStyles();
  
  // Get appropriate icon
  const getIcon = () => {
    if (isShare) {
      return <PaperAirplaneIcon className="w-5 h-5 text-white" />;
    }
    if (event.mimeType?.startsWith('image/')) {
      return <PhotoIcon className="w-5 h-5 text-white" />;
    }
    if (event.mimeType === 'application/pdf') {
      return <DocumentIcon className="w-5 h-5 text-white" />;
    }
    return <ArrowUpTrayIcon className="w-5 h-5 text-white" />;
  };

  // Format timestamp
  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  // Get status icon for shares
  const getStatusIcon = () => {
    if (!isShare) return null;
    if (event.status === 'sent' || event.status === 'success') {
      return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    }
    if (event.status === 'failed') {
      return <XCircleIcon className="w-4 h-4 text-red-500" />;
    }
    return <ClockIcon className="w-4 h-4 text-yellow-500" />;
  };

  if (viewMode === 'grid') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick?.(event)}
        className={`relative group cursor-pointer rounded-2xl overflow-hidden ${styles.bgColor} border-2 ${styles.borderColor} transition-all duration-300`}
      >
        {/* Event Type Badge */}
        <div className="absolute top-2 left-2 z-10">
          <div className={`${styles.iconBg} rounded-full p-2 shadow-lg backdrop-blur-xl`}>
            {getIcon()}
          </div>
        </div>

        {/* Share Recipient Badge */}
        {isShare && event.recipientEmail && (
          <div className="absolute top-2 right-2 z-10">
            <div className={`${styles.badge} px-2 py-1 rounded-full text-xs font-medium backdrop-blur-xl`}>
              To: {event.recipientEmail.split('@')[0]}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="aspect-[4/3] p-4 flex flex-col justify-end">
          {isUpload && event.url && event.mimeType?.startsWith('image/') ? (
            <img 
              src={event.url} 
              alt={event.displayName || event.originalName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className={`${styles.iconBg} rounded-2xl p-6`}>
                {getIcon()}
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Text Content */}
          <div className="relative z-10 text-white">
            <p className="text-xs opacity-90">{formatTime(event.timestamp || event.uploadedAt || event.sharedAt)}</p>
            <p className="font-semibold truncate">
              {isShare ? `Shared ${event.recordCount || 1} records` : (event.displayName || event.originalName || 'Unnamed')}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // List View with Timeline
  return (
    <div className="flex items-start gap-4">
      {/* Timeline Connector */}
      {showConnector && (
        <div className="flex-shrink-0 pt-2">
          <TimelineConnector 
            isFirst={isFirst}
            isLast={isLast}
            eventType={event.type}
            isActive={isActive}
          />
        </div>
      )}
      
      {/* Event Card */}
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick?.(event)}
        className={`group cursor-pointer rounded-2xl p-4 flex-1 ${styles.bgColor} border-2 ${styles.borderColor} backdrop-blur-xl transition-all duration-300 hover:shadow-lg shadow-sm`}
      >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Icon */}
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`${styles.iconBg} rounded-xl p-3 shadow-lg`}
          >
            {getIcon()}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {isShare ? (
                <>
                  <span className="flex items-center gap-1">
                    <SparklesIcon className="w-4 h-4 text-purple-500" />
                    Shared with {event.recipientName || event.recipientEmail?.split('@')[0] || 'Recipient'}
                  </span>
                  {getStatusIcon()}
                </>
              ) : (
                <span className="flex items-center gap-1">
                  {event.extractedData?.type && (
                    <SparklesIcon className="w-4 h-4 text-blue-500" />
                  )}
                  {event.displayName || event.originalName || 'Unnamed Record'}
                </span>
              )}
            </h3>
              
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              {/* Event Type Badge */}
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}
              >
                {isShare ? 'Share' : 'Upload'}
              </motion.span>

              {/* Timestamp */}
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {formatTime(event.timestamp || event.uploadedAt || event.sharedAt)}
              </span>

              {/* Additional Info */}
              {isShare ? (
                <>
                  <span className="text-gray-500 dark:text-gray-400">
                    • {event.recordCount || 1} record{(event.recordCount || 1) > 1 ? 's' : ''}
                  </span>
                  {event.method && (
                    <span className="text-gray-500 dark:text-gray-400">
                      • via {event.method}
                    </span>
                  )}
                </>
              ) : (
                <>
                  {event.extractedData?.type && (
                    <span className="text-gray-500 dark:text-gray-400">
                      • {event.extractedData.type}
                    </span>
                  )}
                  {event.size && (
                    <span className="text-gray-500 dark:text-gray-400">
                      • {(event.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Recipient Email for Shares */}
            {isShare && event.recipientEmail && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <UserIcon className="w-4 h-4" />
                <span>{event.recipientEmail}</span>
              </div>
            )}

            {/* AI Summary Preview for Uploads */}
            {isUpload && event.extractedData?.summary && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {event.extractedData.summary}
                </p>
              </div>
            )}

            {/* File Status for Uploads */}
            {isUpload && event.status && (
              <div className="mt-2">
                <motion.span 
                  whileHover={{ scale: 1.05 }}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${event.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                      event.status === 'processing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300'}`}
                >
                  {event.status}
                </motion.span>
              </div>
            )}
          </div>

        </div>
        
        {/* Right Side - Thumbnail and Arrow */}
        <div className="flex items-center space-x-3">
          {/* Thumbnail for uploads */}
          {isUpload && event.url && event.mimeType?.startsWith('image/') && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0"
            >
              <img 
                src={event.url}
                alt={event.displayName}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white dark:border-gray-800 shadow-md"
              />
            </motion.div>
          )}
          
          {/* Arrow indicator */}
          <motion.div
            whileHover={{ x: 4 }}
            className="opacity-60 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </motion.div>
        </div>
      </div>
    </motion.div>
    </div>
  );
}

export default TimelineEvent;