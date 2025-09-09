import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import { useConnections } from '../contexts/ConnectionsContext';
import useBiometricAuth from '../hooks/useBiometricAuth';
import FaceIDSetup from '../components/FaceIDSetup';
import HealthOracle from '../components/HealthOracle';
import HealthHubCard from '../components/HealthHubCard';
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
  PaperAirplaneIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { records, medications, getShareCountForRecord, getNextAppointment, questionSets } = useHealthRecords();
  const { connections } = useConnections();
  const { isAvailable, isRegistered } = useBiometricAuth();
  const [showFaceIDSetup, setShowFaceIDSetup] = useState(false);

  const completedRecords = records.filter(r => r.status === 'completed');
  const processingRecords = records.filter(r => r.status === 'processing');

  // Helper functions for Health Hub status
  const getConnectionsStatus = () => {
    const connectedCount = connections?.filter(c => c.status === 'connected').length || 0;
    if (connectedCount === 0) {
      return { text: 'No connections', color: 'text-gray-600' };
    }
    return { text: `${connectedCount} provider${connectedCount > 1 ? 's' : ''} linked`, color: 'text-green-600' };
  };

  const getMedicationsStatus = () => {
    const activeMeds = medications?.filter(m => m.status === 'active') || [];
    const todaysDoses = activeMeds.reduce((count, med) => count + (med.times?.length || 0), 0);

    if (activeMeds.length === 0) {
      return { text: 'No medications tracked', color: 'text-gray-600' };
    }

    // Check if any doses are due soon (within 1 hour)
    const now = new Date();
    const hasDueDoeses = activeMeds.some(med => {
      return med.times?.some(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const doseTime = new Date();
        doseTime.setHours(hours, minutes, 0, 0);
        const timeDiff = doseTime.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 3600000; // 1 hour
      });
    });

    if (hasDueDoeses) {
      return { text: `${todaysDoses} doses due today`, color: 'text-amber-600' };
    }

    return { text: `${activeMeds.length} active medication${activeMeds.length > 1 ? 's' : ''}`, color: 'text-green-600' };
  };

  const getPrepareQuestionsStatus = () => {
    const hasRecentQuestions = questionSets && questionSets.length > 0;
    const nextAppointment = getNextAppointment();

    if (nextAppointment) {
      const daysUntil = Math.ceil((new Date(nextAppointment.date) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7 && daysUntil > 0) {
        return { text: `Appointment in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`, color: 'text-amber-600' };
      }
    }

    if (hasRecentQuestions) {
      return { text: 'Questions ready to review', color: 'text-green-600' };
    }

    return { text: 'Ready to prepare', color: 'text-teal-600' };
  };

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
      label: 'Update Health Score',
      description: 'Upload records for instant health analysis',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      path: '/upload',
    },
    {
      icon: ShareIcon,
      label: 'Prepare for Appointments',
      description: 'Share organized records with your doctor',
      iconBg: 'bg-success-100',
      iconColor: 'text-success-600',
      path: '/share',
    },
    {
      icon: DocumentTextIcon,
      label: 'Track Your Health Journey',
      description: `View your complete health story (${completedRecords.length} records)`,
      iconBg: 'bg-secondary-100',
      iconColor: 'text-secondary-600',
      path: '/timeline',
    },
  ];

  return (
    <div className="pb-20 min-h-screen">
      <div className="px-4 pt-safe-top">
        {/* Header */}
        <div className="py-8">
          {/* Settings Button */}
          <div className="flex justify-end mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/settings')}
              className="p-2 bg-gray-50 rounded-lg transition-colors hover:bg-gray-100"
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

          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="font-medium text-gray-600">
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
            className="p-5 bg-white rounded-2xl border border-gray-100 shadow-lg transition-shadow hover:shadow-xl"
          >
            <div className="flex justify-between items-center mb-3">
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
            <p className="mt-1 text-xs font-medium text-gray-600">
              Completed records
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-5 bg-white rounded-2xl border border-gray-100 shadow-lg transition-shadow hover:shadow-xl"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <ClockIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-xs font-medium text-yellow-700">
                Processing
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {processingRecords.length}
            </p>
            <p className="mt-1 text-xs font-medium text-gray-600">
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
              className="flex items-center p-5 space-x-4 w-full bg-gradient-to-r rounded-2xl shadow-lg transition-shadow from-primary-600 to-primary-700 hover:shadow-xl"
            >
              <div className="p-3 rounded-xl backdrop-blur bg-white/20">
                <FaceSmileIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-bold text-white">
                  Set Up Face ID
                </h3>
                <p className="text-sm font-medium text-primary-50">
                  Quick and secure access to your records
                </p>
              </div>
              <div className="px-3 py-1 rounded-full backdrop-blur bg-white/20">
                <span className="text-xs font-semibold text-white">NEW</span>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="flex gap-2 items-center mb-5 text-lg font-bold text-gray-900">
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
                className="flex items-center p-5 space-x-4 w-full bg-white rounded-2xl border border-gray-100 shadow-lg transition-shadow hover:shadow-xl"
              >
                <div className={`${action.iconBg} rounded-xl p-3`}>
                  <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-gray-900">
                    {action.label}
                  </h3>
                  <p className="text-sm font-medium text-gray-600">
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

        {/* Health Hub */}
        <div className="mt-10">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Health Hub
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Connect Card */}
            <HealthHubCard
              title="Connect"
              description="Link your healthcare providers and insurance"
              icon={LinkIcon}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              statusText={getConnectionsStatus().text}
              statusColor={getConnectionsStatus().color}
              onClick={() => navigate('/connect')}
            />

            {/* Medications Card */}
            <HealthHubCard
              title="Medications"
              description="Track daily medication schedule and reminders"
              icon={BeakerIcon}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
              statusText={getMedicationsStatus().text}
              statusColor={getMedicationsStatus().color}
              onClick={() => navigate('/medications')}
            />

            {/* Prepare Questions Card */}
            <HealthHubCard
              title="Prepare Questions"
              description="AI-powered questions for appointments"
              icon={ChatBubbleLeftRightIcon}
              iconBgColor="bg-teal-100"
              iconColor="text-teal-600"
              statusText={getPrepareQuestionsStatus().text}
              statusColor={getPrepareQuestionsStatus().color}
              onClick={() => navigate('/prepare-questions')}
            />
          </div>
        </div>

        {/* Recent Activity */}
        {records.length > 0 && (
          <div className="mt-10">
            <div className="flex justify-between items-center mb-5">
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
                    className="p-4 w-full text-left bg-white rounded-2xl border border-gray-100 shadow-lg transition-all hover:shadow-xl"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon with background */}
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${isProcessing
                          ? 'bg-yellow-100'
                          : record.aiAnalysis
                            ? 'bg-secondary-100'
                            : 'bg-gray-50'
                        }`}>
                        {isProcessing ? (
                          <ArrowPathIcon className="w-5 h-5 text-yellow-600 animate-spin" />
                        ) : (
                          <Icon className={`w-5 h-5 ${record.aiAnalysis
                              ? 'text-secondary-600'
                              : 'text-gray-600'
                            }`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title and time */}
                        <div className="flex justify-between items-start mb-1">
                          <p className="pr-2 text-sm font-semibold text-gray-900 truncate">
                            {record.displayName || record.originalName || 'Health Record'}
                          </p>
                          <span className="flex-shrink-0 text-xs text-gray-500">
                            {getTimeAgo(record.uploadedAt)}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="mb-2 text-xs text-gray-600 line-clamp-2">
                          {getActivityDescription(record)}
                        </p>

                        {/* Metadata badges */}
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Status badge */}
                          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${record.status === 'completed'
                              ? 'bg-success-100 text-success-800'
                              : record.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                            {isProcessing ? (
                              <>
                                <ArrowPathIcon className="mr-1 w-3 h-3 animate-spin" />
                                Processing
                              </>
                            ) : record.status === 'completed' ? (
                              <>
                                <CheckCircleIcon className="mr-1 w-3 h-3" />
                                Ready
                              </>
                            ) : (
                              record.status
                            )}
                          </span>

                          {/* AI Analysis badge */}
                          {record.aiAnalysis && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700 font-medium">
                              <SparklesIcon className="mr-1 w-3 h-3" />
                              AI Analyzed
                            </span>
                          )}

                          {/* Share count */}
                          {shareCount > 0 && (
                            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-info-100 text-info-800 font-medium">
                              <PaperAirplaneIcon className="mr-1 w-3 h-3" />
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
                              <BuildingOfficeIcon className="mr-1 w-3 h-3" />
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
                className="p-3 mt-4 rounded-xl border bg-primary-50 border-primary-100"
              >
                <p className="flex items-center text-xs text-primary-700">
                  <SparklesIcon className="flex-shrink-0 mr-2 w-4 h-4" />
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
          className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-white/50"
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
