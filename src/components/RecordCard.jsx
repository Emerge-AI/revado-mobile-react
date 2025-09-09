import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  PhotoIcon,
  ShareIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentIcon,
  HeartIcon,
  BeakerIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleIconSolid,
  ShareIcon as ShareIconSolid
} from '@heroicons/react/24/solid';

function RecordCard({ record, isExpanded, onToggle, onToggleVisibility, onDelete, onShare, viewMode = 'list' }) {
  const [imageError, setImageError] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const getFileTypeIcon = (record) => {
    if (record.type === 'captured_document' && record.documentType) {
      // Use the icon from document type if available
      if (record.documentType.name?.includes('Insurance')) {
        return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
      }
      if (record.documentType.name?.includes('Lab')) {
        return <BeakerIcon className="w-5 h-5 text-purple-500" />;
      }
      if (record.documentType.name?.includes('Medication')) {
        return <DocumentIcon className="w-5 h-5 text-green-500" />;
      }
      if (record.documentType.name?.includes('Vital')) {
        return <HeartIcon className="w-5 h-5 text-red-500" />;
      }
    }
    if (record.mimeType?.includes('image')) {
      return <PhotoIcon className="w-5 h-5 text-blue-500" />;
    }
    if (record.mimeType?.includes('pdf')) {
      return <DocumentIcon className="w-5 h-5 text-red-500" />;
    }
    if (record.type === 'ccda') {
      return <HeartIcon className="w-5 h-5 text-green-500" />;
    }
    if (record.extractedData?.type?.toLowerCase().includes('lab')) {
      return <BeakerIcon className="w-5 h-5 text-purple-500" />;
    }
    return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIconSolid className="w-4 h-4 text-green-500" />;
      case 'processing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <ClockIcon className="w-4 h-4 text-orange-500" />
          </motion.div>
        );
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getShareCount = () => {
    const shareHistory = JSON.parse(localStorage.getItem('shareHistory') || '[]');
    return shareHistory.filter(share =>
      share.recordIds?.includes(record.id) ||
      (share.sharedAt && new Date(share.sharedAt) > new Date(record.uploadedAt))
    ).length;
  };

  const renderImagePreview = () => {
    const hasImage = record.mimeType?.includes('image') || record.capturedImage;
    if (!hasImage || imageError) return null;

    // Use captured image if available, otherwise use URL or placeholder
    const imageUrl = record.capturedImage || record.url || `https://picsum.photos/400/300?random=${record.id}`;

    return (
      <motion.div
        className="relative overflow-hidden rounded-2xl aspect-video bg-gray-100"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <img
          src={imageUrl}
          alt={record.displayName}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          onClick={() => setIsImageZoomed(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Share badge */}
        {getShareCount() > 0 && (
          <div className="absolute top-2 right-2 bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <ShareIconSolid className="w-3 h-3 text-white" />
            <span className="text-xs text-white font-medium">{getShareCount()}</span>
          </div>
        )}
      </motion.div>
    );
  };

  const renderPDFPreview = () => {
    if (!record.mimeType?.includes('pdf')) return null;

    return (
      <motion.div
        className="relative overflow-hidden rounded-2xl aspect-video bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="text-center">
          <DocumentIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-700">PDF Document</p>
          <p className="text-xs text-red-600">
            {record.size ? `${Math.round(record.size / 1024)} KB` : 'Click to view'}
          </p>
        </div>

        {/* Share badge */}
        {getShareCount() > 0 && (
          <div className="absolute top-2 right-2 bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
            <ShareIconSolid className="w-3 h-3 text-white" />
            <span className="text-xs text-white font-medium">{getShareCount()}</span>
          </div>
        )}
      </motion.div>
    );
  };

  if (viewMode === 'grid') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`relative group ${record.hidden ? 'opacity-60' : ''}`}
        >
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
            {/* Image/PDF Preview */}
            <div className="p-3">
              {record.mimeType?.includes('image') ? renderImagePreview() : renderPDFPreview()}
            </div>

            {/* Card Content */}
            <div className="px-3 pb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  {getFileTypeIcon(record)}
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {record.displayName || record.originalName || 'Unnamed Record'}
                  </h3>
                </div>
                {getStatusIcon(record.status)}
              </div>

              <p className="text-xs text-gray-500 mb-2">
                {formatDate(record.uploadedAt)}
              </p>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  record.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : record.status === 'processing'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {record.status}
                </span>

                {record.hidden && (
                  <div className="p-1 bg-gray-100 rounded-full">
                    <EyeSlashIcon className="w-3 h-3 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(record.id);
              }}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full"
            >
              {record.hidden ? (
                <EyeIcon className="w-5 h-5 text-white" />
              ) : (
                <EyeSlashIcon className="w-5 h-5 text-white" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onShare(record.id);
              }}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full"
            >
              <ShareIcon className="w-5 h-5 text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(record.id);
              }}
              className="p-3 bg-red-500/20 backdrop-blur-sm rounded-full"
            >
              <TrashIcon className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </motion.div>

        {/* Image Zoom Modal */}
        <AnimatePresence>
          {isImageZoomed && record.mimeType?.includes('image') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/90 z-50 flex items-center justify-center p-4"
              onClick={() => setIsImageZoomed(false)}
            >
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                src={record.url || `https://picsum.photos/800/600?random=${record.id}`}
                alt={record.displayName}
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // List view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative ${record.hidden ? 'opacity-60' : ''}`}
    >
      <div className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
        <motion.div
          className="flex items-start justify-between cursor-pointer"
          onClick={() => onToggle(record.id)}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="flex items-start space-x-3 flex-1">
            <div className="p-2 bg-gray-50 rounded-2xl">
              {getFileTypeIcon(record)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {record.displayName || record.originalName || 'Unnamed Record'}
                </h3>
                {getStatusIcon(record.status)}
                {getShareCount() > 0 && (
                  <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-50 rounded-full">
                    <ShareIconSolid className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">
                      {getShareCount()}
                    </span>
                  </div>
                )}
                {record.aiAnalysis && (
                  <div className="flex items-center space-x-1 px-2 py-0.5 bg-purple-50 rounded-full">
                    <SparklesIcon className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-purple-600 font-medium">
                      AI
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-2">
                {formatDate(record.uploadedAt)}
              </p>

              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  record.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : record.status === 'processing'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {record.status}
                </span>

                {record.hidden && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                    Hidden
                  </span>
                )}

                {record.aiAnalysis && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                    AI Analyzed
                  </span>
                )}
              </div>
            </div>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="p-1"
          >
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          </motion.div>
        </motion.div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gray-100">
                {/* Image/PDF Preview in expanded view */}
                {(record.mimeType?.includes('image') || record.mimeType?.includes('pdf')) && (
                  <div className="mb-4">
                    {record.mimeType?.includes('image') ? renderImagePreview() : renderPDFPreview()}
                  </div>
                )}

                {/* Extracted Data */}
                {record.extractedData && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-500">Patient:</span>
                      <span className="text-sm text-gray-900 font-medium text-right">
                        {record.extractedData.patientName}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-500">Provider:</span>
                      <span className="text-sm text-gray-900 font-medium text-right">
                        {record.extractedData.provider}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-gray-500">Type:</span>
                      <span className="text-sm text-gray-900 font-medium text-right">
                        {record.extractedData.type}
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">Summary:</p>
                      <p className="text-sm text-gray-900">
                        {record.extractedData.summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(record.id);
                    }}
                    className="bg-gray-50 text-gray-700 py-3 rounded-2xl font-medium text-sm flex items-center justify-center space-x-2 hover:bg-gray-100:bg-gray-700 transition-colors"
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
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(record.id);
                    }}
                    className="bg-blue-50 text-blue-600 py-3 rounded-2xl font-medium text-sm flex items-center justify-center space-x-2 hover:bg-blue-100:bg-blue-900/50 transition-colors"
                  >
                    <ShareIcon className="w-4 h-4" />
                    <span>Share</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(record.id);
                    }}
                    className="bg-red-50 text-red-600 py-3 rounded-2xl font-medium text-sm flex items-center justify-center space-x-2 hover:bg-red-100:bg-red-900/50 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Delete</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default RecordCard;
