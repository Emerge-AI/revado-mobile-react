import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import useBiometricAuth from '../hooks/useBiometricAuth';
import FaceIDSetup from '../components/FaceIDSetup';
import { 
  DocumentTextIcon, 
  ArrowUpTrayIcon, 
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
  Cog6ToothIcon,
  FaceSmileIcon 
} from '@heroicons/react/24/outline';

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { records } = useHealthRecords();
  const { isAvailable, isRegistered } = useBiometricAuth();
  const [showFaceIDSetup, setShowFaceIDSetup] = useState(false);

  const completedRecords = records.filter(r => r.status === 'completed');
  const processingRecords = records.filter(r => r.status === 'processing');

  const quickActions = [
    {
      icon: ArrowUpTrayIcon,
      label: 'Upload Records',
      description: 'Add PDFs or photos',
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      path: '/upload',
    },
    {
      icon: ShareIcon,
      label: 'Share with Dentist',
      description: 'Send secure email',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      path: '/share',
    },
    {
      icon: DocumentTextIcon,
      label: 'View Timeline',
      description: `${completedRecords.length} records`,
      iconBg: 'bg-purple-50 dark:bg-purple-950/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
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
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Cog6ToothIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <SparklesIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Quick & Secure
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {user?.email}
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                Ready
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {completedRecords.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
              Completed records
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Processing
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {processingRecords.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 flex items-center space-x-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="bg-white/20 backdrop-blur rounded-xl p-3">
                <FaceSmileIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-white text-lg">
                  Set Up Face ID
                </h3>
                <p className="text-sm text-blue-100 font-medium">
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            Quick Actions
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
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
                className="w-full bg-white dark:bg-gray-800 rounded-2xl p-5 flex items-center space-x-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`${action.iconBg} rounded-xl p-3`}>
                  <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    {action.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {action.description}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 dark:text-gray-500"
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              Recent Activity
            </h2>
            
            <div className="space-y-3">
              {records.slice(0, 3).map((record) => (
                <motion.div
                  key={record.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center justify-between border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {record.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(record.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    record.status === 'completed' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : record.status === 'processing'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {record.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Face ID Setup Modal */}
      {showFaceIDSetup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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