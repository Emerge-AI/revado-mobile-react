import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import ShareOptions from './ShareOptions';
import {
  XMarkIcon,
  ShareIcon,
  TrashIcon,
  EyeSlashIcon,
  EyeIcon,
  DocumentIcon,
  PhotoIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowDownTrayIcon,
  HeartIcon,
  StarIcon,
  TagIcon,
  SparklesIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

function RecordDetailModal({ record, isOpen, onClose, onShare, onDelete, onToggleVisibility }) {
  const { records, analyzeRecord, analysisInProgress } = useHealthRecords();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [showActions, setShowActions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [starred, setStarred] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get all images from this record
  const images = record?.mimeType?.startsWith('image/') && record.url ? [record] : [];
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (isOpen) {
      setImageZoom(1);
      setImagePosition({ x: 0, y: 0 });
      setCurrentImageIndex(0);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle swipe gestures
  const handleTouchStart = (e) => {
    setDragStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    });
  };

  const handleTouchEnd = (e) => {
    if (!dragStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    const deltaTime = Date.now() - dragStart.time;

    // Swipe down to close (if not zoomed)
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 100 && deltaTime < 300 && imageZoom === 1) {
      onClose();
    }
    // Swipe left/right for image navigation
    else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && hasMultipleImages) {
      if (deltaX > 0 && currentImageIndex > 0) {
        setCurrentImageIndex(prev => prev - 1);
      } else if (deltaX < 0 && currentImageIndex < images.length - 1) {
        setCurrentImageIndex(prev => prev + 1);
      }
    }

    setDragStart(null);
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success-600 bg-success-100';
      case 'processing': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen || !record) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/90 backdrop-blur-xl z-50"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20 
          }}
          className="absolute inset-4 rounded-3xl bg-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-100">
            <div className="flex items-center justify-between p-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </motion.button>

              <div className="text-center flex-1 mx-4">
                <h2 className="font-semibold text-gray-900 truncate">
                  {record.displayName || record.originalName}
                </h2>
                {hasMultipleImages && (
                  <p className="text-sm text-gray-500">
                    {currentImageIndex + 1} of {images.length}
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowActions(!showActions)}
                className="p-2 bg-primary-600 rounded-full hover:bg-primary-700 transition-colors"
              >
                <ShareIcon className="w-6 h-6 text-white" />
              </motion.button>
            </div>

            {/* Image Navigation */}
            {hasMultipleImages && (
              <div className="flex justify-center pb-2">
                <div className="flex space-x-1">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="pt-20 pb-4 h-full overflow-hidden">
            {/* Image Viewer */}
            {record.mimeType?.startsWith('image/') && record.url ? (
              <div className="relative h-2/3 overflow-hidden bg-gray-50">
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex]?.url}
                  alt={record.displayName}
                  className="w-full h-full object-contain cursor-pointer"
                  style={{
                    transform: `scale(${imageZoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />

                {/* Zoom Controls */}
                {imageZoom > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setImageZoom(Math.max(1, imageZoom - 0.5))}
                      className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white"
                    >
                      <MagnifyingGlassMinusIcon className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setImageZoom(Math.min(4, imageZoom + 0.5))}
                      className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white"
                    >
                      <MagnifyingGlassPlusIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}

                {/* Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                      disabled={currentImageIndex === 0}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white disabled:opacity-30"
                    >
                      <ChevronLeftIcon className="w-6 h-6" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                      disabled={currentImageIndex === images.length - 1}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white disabled:opacity-30"
                    >
                      <ChevronRightIcon className="w-6 h-6" />
                    </motion.button>
                  </>
                )}
              </div>
            ) : (
              /* Document Viewer */
              <div className="h-2/3 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <DocumentIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {record.displayName || record.originalName}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {formatSize(record.size)}
                  </p>
                  {record.url && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={record.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                      View Document
                    </motion.a>
                  )}
                </div>
              </div>
            )}

            {/* Details Section */}
            <div className="h-1/3 overflow-y-auto p-4 space-y-4">
              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                    {record.status || 'unknown'}
                  </span>
                  {record.hidden && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                      Hidden
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFavorited(!favorited)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {favorited ? (
                      <HeartIconSolid className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStarred(!starred)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {starred ? (
                      <StarIconSolid className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <StarIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <CalendarDaysIcon className="w-5 h-5 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Uploaded</p>
                    <p className="text-xs">{formatDate(record.uploadedAt)}</p>
                  </div>
                </div>

                {record.extractedData?.provider && (
                  <div className="flex items-center text-gray-600">
                    <UserIcon className="w-5 h-5 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Provider</p>
                      <p className="text-xs">{record.extractedData.provider}</p>
                    </div>
                  </div>
                )}

                {record.extractedData?.type && (
                  <div className="flex items-center text-gray-600">
                    <TagIcon className="w-5 h-5 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Record Type</p>
                      <p className="text-xs">{record.extractedData.type}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Analysis Button & Results */}
              {!record.aiAnalysis && !analysisInProgress?.[record.id] && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    console.log('[RecordDetailModal] Analyze button clicked for record:', record.id);
                    console.log('[RecordDetailModal] Record details:', { 
                      id: record.id, 
                      type: record.fileType, 
                      name: record.displayName 
                    });
                    setIsAnalyzing(true);
                    try {
                      console.log('[RecordDetailModal] Calling analyzeRecord...');
                      const result = await analyzeRecord(record.id);
                      console.log('[RecordDetailModal] Analysis completed successfully:', result);
                    } catch (error) {
                      console.error('[RecordDetailModal] Analysis failed with error:', error);
                      console.error('[RecordDetailModal] Error details:', {
                        message: error.message,
                        stack: error.stack
                      });
                    } finally {
                      setIsAnalyzing(false);
                      console.log('[RecordDetailModal] Analysis process finished');
                    }
                  }}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  <SparklesIcon className="w-5 h-5" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                </motion.button>
              )}

              {/* AI Analysis in Progress */}
              {(analysisInProgress?.[record.id] || isAnalyzing) && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <BeakerIcon className="w-5 h-5 text-purple-600" />
                      <div className="absolute inset-0 w-5 h-5">
                        <motion.div
                          className="w-full h-full border-2 border-purple-400 rounded-full"
                          animate={{
                            scale: [1, 1.5, 1.5],
                            opacity: [0.5, 0, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">AI Analysis in Progress</h4>
                      <p className="text-sm text-gray-600">Processing your document...</p>
                    </div>
                  </div>
                  <motion.div
                    className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-3"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: 3,
                      ease: "easeInOut",
                      repeat: Infinity
                    }}
                  />
                </div>
              )}

              {/* AI Analysis Results */}
              {record.aiAnalysis && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <SparklesIcon className="w-5 h-5 text-purple-600" />
                      <h4 className="font-medium text-gray-900">AI Analysis</h4>
                      {record.analyzedAt && (
                        <span className="ml-auto text-xs text-gray-500">
                          {new Date(record.analyzedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {/* Document Type Badge */}
                    {record.aiAnalysis.documentType && (
                      <motion.div 
                        className="mb-3"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          record.aiAnalysis.documentType === 'lab' ? 'bg-blue-100 text-blue-800' :
                          record.aiAnalysis.documentType === 'xray' ? 'bg-gray-100 text-gray-800' :
                          record.aiAnalysis.documentType === 'prescription' ? 'bg-green-100 text-green-800' :
                          record.aiAnalysis.documentType === 'discharge' ? 'bg-yellow-100 text-yellow-800' :
                          record.aiAnalysis.documentType === 'dental' ? 'bg-purple-100 text-purple-800' :
                          record.aiAnalysis.documentType === 'non-medical' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.aiAnalysis.documentType === 'non-medical' ? '⚠️ Non-Medical Document' : 
                           record.aiAnalysis.documentType === 'lab' ? '🧪 Lab Results' :
                           record.aiAnalysis.documentType === 'xray' ? '📷 Imaging' :
                           record.aiAnalysis.documentType === 'prescription' ? '💊 Prescription' :
                           record.aiAnalysis.documentType === 'discharge' ? '🏥 Discharge Summary' :
                           record.aiAnalysis.documentType === 'dental' ? '🦷 Dental' :
                           '📄 ' + (record.aiAnalysis.documentType || 'Document')}
                        </span>
                      </motion.div>
                    )}
                    
                    {/* Metadata Row */}
                    {(record.aiAnalysis.collectionDate || record.aiAnalysis.labFacility || record.aiAnalysis.orderingProvider) && (
                      <motion.div 
                        className="mb-3 flex flex-wrap gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {record.aiAnalysis.collectionDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <CalendarDaysIcon className="w-4 h-4" />
                            <span>{record.aiAnalysis.collectionDate}</span>
                          </div>
                        )}
                        {record.aiAnalysis.labFacility && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <BeakerIcon className="w-4 h-4" />
                            <span>{record.aiAnalysis.labFacility}</span>
                          </div>
                        )}
                        {record.aiAnalysis.orderingProvider && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <UserIcon className="w-4 h-4" />
                            <span>{record.aiAnalysis.orderingProvider}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                    
                    {/* Summary */}
                    {record.aiAnalysis.summary && (
                      <motion.div 
                        className="mb-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {record.aiAnalysis.summary}
                        </p>
                      </motion.div>
                    )}
                    
                    {/* Lab Test Results (if applicable) */}
                    {record.aiAnalysis.tests && record.aiAnalysis.tests.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase mb-2">Test Results</h5>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {record.aiAnalysis.tests.map((test, index) => (
                            <motion.div 
                              key={index} 
                              className="bg-white rounded-lg p-3 border border-gray-100"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900">{test.name}</span>
                                  {test.referenceRange && (
                                    <span className="text-xs text-gray-500 block mt-1">
                                      Ref: {test.referenceRange}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right ml-3">
                                  <span className={`text-sm font-semibold ${
                                    test.isAbnormal ? 'text-red-600' : 'text-gray-700'
                                  }`}>
                                    {test.value}
                                  </span>
                                  {test.unit && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      {test.unit}
                                    </span>
                                  )}
                                  {test.isAbnormal && (
                                    <span className="text-xs text-red-600 block mt-1">Abnormal</span>
                                  )}
                                </div>
                              </div>
                              {test.reference && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Reference: {test.reference}
                                </p>
                              )}
                              {test.flag && (
                                <span className={`text-xs font-medium ${
                                  test.flag === 'high' ? 'text-red-600' :
                                  test.flag === 'low' ? 'text-yellow-600' :
                                  'text-gray-600'
                                }`}>
                                  {test.flag === 'high' ? '↑ High' : test.flag === 'low' ? '↓ Low' : test.flag}
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Abnormal Results */}
                    {record.aiAnalysis.abnormalResults && record.aiAnalysis.abnormalResults.length > 0 && (
                      <motion.div 
                        className="mb-3 bg-red-50 rounded-lg p-3 border border-red-200"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h5 className="text-xs font-semibold text-red-600 uppercase mb-2 flex items-center gap-1">
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            ⚠️
                          </motion.span>
                          Abnormal Results
                        </h5>
                        <ul className="space-y-1">
                          {record.aiAnalysis.abnormalResults.map((result, index) => (
                            <motion.li 
                              key={index} 
                              className="text-sm text-red-700 flex items-start gap-2"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.05 }}
                            >
                              <span className="mt-0.5">•</span>
                              <span>{result}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                    
                    {/* Findings (for imaging) */}
                    {record.aiAnalysis.findings && record.aiAnalysis.findings.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase mb-2">Findings</h5>
                        <ul className="space-y-1">
                          {record.aiAnalysis.findings.map((finding, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-purple-500 mt-0.5">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Medications (for prescriptions) */}
                    {record.aiAnalysis.medications && record.aiAnalysis.medications.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase mb-2">Medications</h5>
                        <ul className="space-y-1">
                          {record.aiAnalysis.medications.map((med, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">💊</span>
                              <span>{med}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Recommendations */}
                    {record.aiAnalysis.recommendations && record.aiAnalysis.recommendations.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-gray-600 uppercase mb-2">Recommendations</h5>
                        <ul className="space-y-1">
                          {record.aiAnalysis.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-pink-500 mt-0.5">→</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Provider Info */}
                    {(record.aiAnalysis.provider || record.aiAnalysis.orderingProvider || record.aiAnalysis.date || record.aiAnalysis.collectionDate) && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {(record.aiAnalysis.provider || record.aiAnalysis.orderingProvider) && (
                            <div>
                              <p className="text-xs text-gray-500">Provider</p>
                              <p className="text-gray-900 font-medium">
                                {record.aiAnalysis.provider || record.aiAnalysis.orderingProvider}
                              </p>
                            </div>
                          )}
                          {(record.aiAnalysis.date || record.aiAnalysis.collectionDate) && (
                            <div>
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="text-gray-900 font-medium">
                                {record.aiAnalysis.date || record.aiAnalysis.collectionDate}
                              </p>
                            </div>
                          )}
                          {record.aiAnalysis.labFacility && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500">Facility</p>
                              <p className="text-gray-900 font-medium">
                                {record.aiAnalysis.labFacility}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Original AI Summary (if exists and no new analysis) */}
              {record.extractedData?.summary && !record.aiAnalysis && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <p className="text-sm text-gray-600">
                    {record.extractedData.summary}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions Sheet */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                key="actions-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/50 backdrop-blur-sm z-30"
                onClick={() => setShowActions(false)}
              >
                <motion.div
                  key="actions-sheet"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 20 
                  }}
                  className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
                  
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowShareOptions(true);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-blue-50 rounded-2xl text-blue-600 hover:bg-blue-100:bg-blue-900/30 transition-colors"
                    >
                      <ShareIcon className="w-6 h-6" />
                      <div className="text-left">
                        <p className="font-medium">Share Record</p>
                        <p className="text-sm opacity-75">Send to healthcare provider</p>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onToggleVisibility(record.id);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl text-yellow-600 hover:bg-yellow-100:bg-yellow-900/30 transition-colors"
                    >
                      {record.hidden ? <EyeIcon className="w-6 h-6" /> : <EyeSlashIcon className="w-6 h-6" />}
                      <div className="text-left">
                        <p className="font-medium">{record.hidden ? 'Show' : 'Hide'} Record</p>
                        <p className="text-sm opacity-75">
                          {record.hidden ? 'Make visible in timeline' : 'Hide from sharing'}
                        </p>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onDelete(record.id);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-4 p-4 bg-red-50 rounded-2xl text-red-600 hover:bg-red-100:bg-red-900/30 transition-colors"
                    >
                      <TrashIcon className="w-6 h-6" />
                      <div className="text-left">
                        <p className="font-medium">Delete Record</p>
                        <p className="text-sm opacity-75">Permanently remove this record</p>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      
      {/* Share Options Modal */}
      <ShareOptions
        isOpen={showShareOptions}
        onClose={() => setShowShareOptions(false)}
        recordData={[record]}
        recipientEmail="" // Could be passed from parent or collected in ShareOptions
      />
    </AnimatePresence>
  );
}

export default RecordDetailModal;