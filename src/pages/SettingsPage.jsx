import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useBiometricAuth from '../hooks/useBiometricAuth';
import FaceIDSetup from '../components/FaceIDSetup';
import RevadoLogo from '../components/RevadoLogo';
import {
  FaceSmileIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  BellIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  BugAntIcon
} from '@heroicons/react/24/outline';

function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    isAvailable,
    isBiometricEnabled,
    registerBiometric,
    disableBiometric,
    getRegisteredDevices
  } = useBiometricAuth();

  const [biometricEnabled, setBiometricEnabled] = useState(isBiometricEnabled());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [registeredDevices, setRegisteredDevices] = useState([]);
  const [showDevices, setShowDevices] = useState(false);
  const [showFaceIDSetup, setShowFaceIDSetup] = useState(false);
  const [debugPanelHidden, setDebugPanelHidden] = useState(() => {
    return localStorage.getItem('hideDebugPanel') === 'true';
  });

  useEffect(() => {
    if (biometricEnabled) {
      const devices = getRegisteredDevices();
      setRegisteredDevices(devices);
    }
  }, [biometricEnabled, getRegisteredDevices]);

  const handleBiometricToggle = async () => {
    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      if (!biometricEnabled) {
        // Enable biometric
        const result = await registerBiometric(user.id, user.email);
        if (result.success) {
          // Store email for future biometric sign ins
          localStorage.setItem('userEmail', user.email);
          setBiometricEnabled(true);
          setMessage('Face ID enabled successfully');
        } else {
          setMessage(result.error || 'Failed to enable Face ID');
        }
      } else {
        // Disable biometric but keep email for regular sign in
        disableBiometric();
        setBiometricEnabled(false);
        setMessage('Face ID disabled');
      }
    } catch (err) {
      console.error('Failed to toggle biometric:', err);
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSignOut = () => {
    // Clear auth but keep biometric setup
    signOut();
    // Force navigation to auth page
    window.location.href = '/auth';
  };

  const settingsItems = [
    {
      icon: FaceSmileIcon,
      label: 'Face ID',
      description: biometricEnabled ? 'Enabled - Tap to manage' : 'Quick sign in with biometrics',
      action: 'custom',
      enabled: biometricEnabled,
      available: isAvailable,
      onPress: () => setShowFaceIDSetup(true),
    },
    {
      icon: BellIcon,
      label: 'Notifications',
      description: 'Push notifications for updates',
      action: 'navigate',
      path: '/settings/notifications',
    },
    {
      icon: ShieldCheckIcon,
      label: 'Privacy & Security',
      description: 'Manage your data and privacy',
      action: 'navigate',
      path: '/settings/privacy',
    },
    {
      icon: ClipboardDocumentListIcon,
      label: 'Authentication Logs',
      description: 'View sign in/up activity',
      action: 'navigate',
      path: '/settings/logs',
    },
    {
      icon: BugAntIcon,
      label: 'Debug Panel',
      description: debugPanelHidden ? 'Hidden - Press Ctrl+Shift+D to show' : 'Visible - Press to hide',
      action: 'custom',
      enabled: !debugPanelHidden,
      available: true,
      onPress: () => {
        const newValue = !debugPanelHidden;
        setDebugPanelHidden(newValue);
        localStorage.setItem('hideDebugPanel', newValue.toString());
        setMessage(newValue ? 'Debug panel hidden' : 'Debug panel visible');
        setTimeout(() => setMessage(''), 3000);
      },
    },
    {
      icon: DocumentTextIcon,
      label: 'Terms & Conditions',
      description: 'Legal information',
      action: 'navigate',
      path: '/settings/terms',
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="pt-safe-top px-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            Settings
          </h1>
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>

        {/* User Info */}
        <div className="bg-white rounded-2xl p-5 mb-6 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <RevadoLogo size="default" showText={false} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.email?.split('@')[0]}
              </h2>
              <p className="text-sm text-gray-600">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl mb-4 text-sm font-medium ${
              message.includes('Error') || message.includes('Failed')
                ? 'bg-red-50 text-red-600'
                : 'bg-green-50 text-green-600'
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* Registered Devices Section */}
        {biometricEnabled && registeredDevices.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowDevices(!showDevices)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Registered Devices ({registeredDevices.length})
                </h3>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    showDevices ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {showDevices && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 mb-4"
              >
                {registeredDevices.map((device, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-white">
                          {device.deviceName?.includes('iPhone') || device.deviceName?.includes('iPad') ? (
                            <DevicePhoneMobileIcon className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ComputerDesktopIcon className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {device.deviceName || 'Unknown Device'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Added {new Date(device.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Settings List */}
        <div className="space-y-3">
          {settingsItems.map((item) => (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              {item.action === 'custom' ? (
                <button
                  onClick={item.onPress}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      item.enabled
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      <item.icon className={`w-5 h-5 ${
                        item.enabled
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.available ? item.description : 'Not available on this device'}
                      </p>
                    </div>
                  </div>

                  {item.enabled && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      Active
                    </span>
                  )}
                </button>
              ) : item.action === 'toggle' ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      item.enabled
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                    }`}>
                      <item.icon className={`w-5 h-5 ${
                        item.enabled
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.available ? item.description : 'Not available on this device'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={item.onToggle}
                    disabled={!item.available || loading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      item.enabled
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    } ${!item.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <item.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.description}
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
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Sign Out Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSignOut}
          className="w-full mt-8 bg-red-50 text-red-600 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 border border-red-200"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Sign Out
        </motion.button>
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
              onClose={() => {
                setShowFaceIDSetup(false);
                // Update local state after changes
                setBiometricEnabled(isBiometricEnabled());
                if (isBiometricEnabled()) {
                  const devices = getRegisteredDevices();
                  setRegisteredDevices(devices);
                }
              }}
              onSuccess={() => {
                setShowFaceIDSetup(false);
                // Refresh the page to update all states
                window.location.reload();
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default SettingsPage;
