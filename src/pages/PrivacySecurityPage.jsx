import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  EyeSlashIcon,
  KeyIcon,
  FingerPrintIcon,
  CloudArrowUpIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

function PrivacySecurityPage() {
  const navigate = useNavigate();
  
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    autoLockEnabled: true,
    autoLockTimeout: '5',
    encryptBackups: true,
    shareAnalytics: false,
    saveHistory: true,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggle = (key) => {
    setSecurity(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    localStorage.setItem('securityPreferences', JSON.stringify({
      ...security,
      [key]: !security[key]
    }));
  };

  const handleDeleteAllData = () => {
    if (showDeleteConfirm) {
      // Clear all data
      localStorage.clear();
      sessionStorage.clear();
      // Navigate to auth
      navigate('/auth');
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 5000);
    }
  };

  const securitySettings = [
    {
      key: 'twoFactorEnabled',
      icon: KeyIcon,
      label: 'Two-Factor Authentication',
      description: 'Add extra security with 2FA',
      type: 'toggle',
    },
    {
      key: 'autoLockEnabled',
      icon: LockClosedIcon,
      label: 'Auto-Lock',
      description: 'Require authentication after inactivity',
      type: 'toggle',
    },
    {
      key: 'encryptBackups',
      icon: CloudArrowUpIcon,
      label: 'Encrypted Backups',
      description: 'Encrypt your data backups',
      type: 'toggle',
    },
  ];

  const privacySettings = [
    {
      key: 'shareAnalytics',
      icon: EyeSlashIcon,
      label: 'Share Analytics',
      description: 'Help improve the app with usage data',
      type: 'toggle',
    },
    {
      key: 'saveHistory',
      icon: FingerPrintIcon,
      label: 'Save Activity History',
      description: 'Keep a record of your app activity',
      type: 'toggle',
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="pt-safe-top px-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-6">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            Privacy & Security
          </h1>
          <div className="w-10" />
        </div>

        {/* Security Settings */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Security
          </h2>
          <div className="space-y-3">
            {securitySettings.map((setting) => (
              <motion.div
                key={setting.key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      security[setting.key] 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                    }`}>
                      <setting.icon className={`w-5 h-5 ${
                        security[setting.key] 
                          ? 'text-blue-600' 
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {setting.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleToggle(setting.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      security[setting.key] 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        security[setting.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Auto-lock timeout selector */}
                {setting.key === 'autoLockEnabled' && security.autoLockEnabled && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="text-xs text-gray-500">Lock after</label>
                    <select
                      value={security.autoLockTimeout}
                      onChange={(e) => setSecurity(prev => ({ ...prev, autoLockTimeout: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 bg-gray-100 rounded-lg text-gray-900"
                    >
                      <option value="1">1 minute</option>
                      <option value="5">5 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Privacy
          </h2>
          <div className="space-y-3">
            {privacySettings.map((setting) => (
              <motion.div
                key={setting.key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      security[setting.key] 
                        ? 'bg-green-100' 
                        : 'bg-gray-100'
                    }`}>
                      <setting.icon className={`w-5 h-5 ${
                        security[setting.key] 
                          ? 'text-green-600' 
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {setting.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleToggle(setting.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      security[setting.key] 
                        ? 'bg-green-600' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        security[setting.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Data Management
          </h2>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-3"
            onClick={() => navigate('/settings/export-data')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <CloudArrowUpIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    Export Your Data
                  </p>
                  <p className="text-xs text-gray-600">
                    Download all your health records
                  </p>
                </div>
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
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleDeleteAllData}
            className={`w-full rounded-xl p-4 border shadow-sm transition-colors ${
              showDeleteConfirm 
                ? 'bg-red-50 border-red-300'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  showDeleteConfirm 
                    ? 'bg-red-100'
                    : 'bg-red-50'
                }`}>
                  {showDeleteConfirm ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <TrashIcon className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-red-600">
                    {showDeleteConfirm ? 'Tap again to confirm' : 'Delete All Data'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {showDeleteConfirm 
                      ? 'This action cannot be undone'
                      : 'Permanently remove all your data'}
                  </p>
                </div>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-start space-x-3">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Your Privacy Matters
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                We use industry-standard encryption to protect your health data. 
                Your records are never shared without your explicit consent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacySecurityPage;