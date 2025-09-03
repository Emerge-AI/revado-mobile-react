import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import useBiometricAuth from '../hooks/useBiometricAuth';
import FaceIDSetup from '../components/FaceIDSetup';
import HealthOracle from '../components/HealthOracle';
import RevadoLogo from '../components/RevadoLogo';
import { 
  DocumentTextIcon, 
  ArrowUpTrayIcon, 
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  Cog6ToothIcon,
  FaceSmileIcon,
  PhotoIcon,
  DocumentIcon,
  BeakerIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ArrowPathIcon,
  EyeIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { records, getShareCountForRecord } = useHealthRecords();
  const { isAvailable, isRegistered } = useBiometricAuth();
  const [showFaceIDSetup, setShowFaceIDSetup] = useState(false);

  const completedRecords = records.filter(r => r.status === 'completed');
  const processingRecords = records.filter(r => r.status === 'processing');

  // Helper function to get icon based on record type
  const getRecordIcon = (record) => {
    if (record.type === 'image' || record.mimeType?.includes('image')) {
      return PhotoIcon;
    }
    if (record.type === 'document' || record.mimeType?.includes('pdf')) {
      return DocumentIcon;
    }
    if (record.extractedData?.type === 'Lab Results' || record.displayName?.toLowerCase().includes('lab')) {
      return BeakerIcon;
    }
    if (record.providerEmail) {
      return BuildingOfficeIcon;
    }
    return DocumentTextIcon;
  };

  // Helper function to get activity description
  const getActivityDescription = (record) => {
    if (record.status === 'processing') {
      return 'Analyzing with AI...';
    }
    if (record.aiAnalysis) {
      return record.aiAnalysis.summary?.substring(0, 50) + '...' || 'AI analysis complete';
    }
    if (record.extractedData?.summary) {
      return record.extractedData.summary;
    }
    if (record.extractedData?.type) {
      return record.extractedData.type;
    }
    if (record.providerEmail) {
      return `From ${record.providerEmail}`;
    }
    return 'Health record uploaded';
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${Math.round(kb)} KB`;
  };

  // Helper function to get time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const quickActions = [
    {
      icon: ArrowUpTrayIcon,
      label: 'Upload Records',
      description: 'Add PDFs or photos',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      path: '/upload',
    },
    {
      icon: ShareIcon,
      label: 'Share with Dentist',
      description: 'Send secure email',
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      path: '/share',
    },
    {
      icon: DocumentTextIcon,
      label: 'View Timeline',
      description: `${completedRecords.length} records`,
      iconBg: 'bg-secondary-100',
      iconColor: 'text-secondary-600',
      path: '/timeline',
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="pt-safe-top px-4">
        {/* Header */}
        <div className="py-8">
          {/* Settings Button */}
          <div className="flex justify-end mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
            </motion.button>
          </div>
          <div className="mb-6">
            <RevadoLogo size="default" showText={true} animated={true} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 mb-4">
            <SparklesIcon className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-medium text-gray-700">
              Quick & Secure
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600 font-medium">
            {user?.email}
          </p>
        </div>

        {/* Health Oracle - Adaptive Insight Card */}
        <HealthOracle />
        
        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-success-100">
                <CheckCircleIcon className="w-5 h-5 text-success-600" />
              </div>
              <span className="text-xs font-medium text-success-800">
                Ready
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {completedRecords.length}
            </p>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              Completed records
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-yellow-100">
                <ClockIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-xs font-medium text-yellow-700">
                Processing
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {processingRecords.length}
            </p>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              Processing now
            </p>
          </motion.div>
        </div>

        {/* Face ID Setup Card - Show if available but not registered */}
        {isAvailable && !isRegistered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowFaceIDSetup(true)}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-5 flex items-center space-x-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                <FaceSmileIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-white text-lg">
                  Set Up Face ID
                </h3>
                <p className="text-sm text-primary-50 font-medium">
                  Quick and secure access to your records
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1">
                <span className="text-xs font-semibold text-white">NEW</span>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            Quick Actions
            <span className="text-xs font-normal text-gray-500">
              Tap to continue
            </span>
          </h2>
          
          <div className="space-y-4">
            {quickActions.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(action.path)}
                className="w-full bg-white rounded-2xl p-5 flex items-center space-x-4 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`${action.iconBg} rounded-xl p-3`}>
                  <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {action.label}
                  </h3>
                  <p className="text-sm text-gray-600 font-medium">
                    {action.description}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {records.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Recent Activity
              </h2>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/timeline')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </motion.button>
            </div>
            
            <div className="space-y-3">
              {records.slice(0, 3).map((record) => {
                const Icon = getRecordIcon(record);
                const shareCount = getShareCountForRecord(record.id);
                const isProcessing = record.status === 'processing';
                
                return (
                  <motion.button
                    key={record.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/timeline')}
                    className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-xl transition-all text-left"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon with background */}
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                        isProcessing 
                          ? 'bg-yellow-100'
                          : record.aiAnalysis
                          ? 'bg-secondary-100'
                          : 'bg-gray-50'
                      }`}>
                        {isProcessing ? (
                          <ArrowPathIcon className="w-5 h-5 text-yellow-600 animate-spin" />
                        ) : (
                          <Icon className={`w-5 h-5 ${
                            record.aiAnalysis
                              ? 'text-secondary-600'
                              : 'text-gray-600'
                          }`} />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title and time */}
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900 truncate pr-2">
                            {record.displayName || record.originalName || 'Health Record'}
                          </p>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {getTimeAgo(record.uploadedAt)}
                          </span>
                        </div>
                        
                        {/* Description */}
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {getActivityDescription(record)}
                        </p>
                        
                        {/* Metadata badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status badge */}
                          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                            record.status === 'completed' 
                              ? 'bg-success-100 text-success-800'
                              : record.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isProcessing ? (
                              <>
                                <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />
                                Processing
                              </>
                            ) : record.status === 'completed' ? (
                              <>
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Ready
                              </>
                            ) : (
                              record.status
                            )}
                          </span>
                          
                          {/* AI Analysis badge */}
                          {record.aiAnalysis && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700 font-medium">
                              <SparklesIcon className="w-3 h-3 mr-1" />
                              AI Analyzed
                            </span>
                          )}
                          
                          {/* Share count */}
                          {shareCount > 0 && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-info-100 text-info-800 font-medium">
                              <PaperAirplaneIcon className="w-3 h-3 mr-1" />
                              Shared {shareCount}x
                            </span>
                          )}
                          
                          {/* File size */}
                          {record.size && (
                            <span className="text-xs text-gray-500">
                              {formatFileSize(record.size)}
                            </span>
                          )}
                          
                          {/* Provider info */}
                          {record.extractedData?.provider && (
                            <span className="inline-flex items-center text-xs text-gray-600">
                              <BuildingOfficeIcon className="w-3 h-3 mr-1" />
                              {record.extractedData.provider}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            
            {/* Quick tip */}
            {records.length > 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 bg-primary-50 rounded-xl border border-primary-100"
              >
                <p className="text-xs text-primary-700 flex items-center">
                  <SparklesIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>
                    You have {records.length - 3} more records. Tap "View all" to see your complete timeline.
                  </span>
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Face ID Setup Modal */}
      {showFaceIDSetup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowFaceIDSetup(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            <FaceIDSetup 
              onClose={() => setShowFaceIDSetup(false)}
              onSuccess={() => {
                setShowFaceIDSetup(false);
                // Optionally refresh the page or update state
                window.location.reload();
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default HomePage;