import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  BellIcon,
  BellAlertIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  DocumentTextIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

function NotificationsPage() {
  const navigate = useNavigate();
  
  // Notification preferences state
  const [notifications, setNotifications] = useState({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    
    // Notification types
    newRecords: true,
    processingComplete: true,
    shareConfirmations: true,
    weeklyDigest: false,
    promotions: false,
    
    // Timing
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    // In production, save to backend
    localStorage.setItem('notificationPreferences', JSON.stringify({
      ...notifications,
      [key]: !notifications[key]
    }));
  };

  const notificationChannels = [
    {
      key: 'pushEnabled',
      icon: BellIcon,
      label: 'Push Notifications',
      description: 'Get instant alerts on your device',
    },
    {
      key: 'emailEnabled',
      icon: EnvelopeIcon,
      label: 'Email Notifications',
      description: 'Receive updates in your inbox',
    },
    {
      key: 'smsEnabled',
      icon: DevicePhoneMobileIcon,
      label: 'SMS Notifications',
      description: 'Get text messages for urgent updates',
    },
  ];

  const notificationTypes = [
    {
      key: 'newRecords',
      icon: DocumentTextIcon,
      label: 'New Records',
      description: 'When new health records are added',
    },
    {
      key: 'processingComplete',
      icon: BellAlertIcon,
      label: 'Processing Complete',
      description: 'When AI finishes analyzing your records',
    },
    {
      key: 'shareConfirmations',
      icon: ShareIcon,
      label: 'Share Confirmations',
      description: 'When records are successfully shared',
    },
    {
      key: 'weeklyDigest',
      icon: ClockIcon,
      label: 'Weekly Summary',
      description: 'Weekly health record summary',
    },
    {
      key: 'promotions',
      icon: BellIcon,
      label: 'Promotions & Updates',
      description: 'Product updates and special offers',
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
            Notifications
          </h1>
          <div className="w-10" />
        </div>

        {/* Notification Channels */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Notification Channels
          </h2>
          <div className="space-y-3">
            {notificationChannels.map((channel) => (
              <motion.div
                key={channel.key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      notifications[channel.key] 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                    }`}>
                      <channel.icon className={`w-5 h-5 ${
                        notifications[channel.key] 
                          ? 'text-blue-600' 
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {channel.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleToggle(channel.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[channel.key] 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[channel.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Notification Types */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Notification Types
          </h2>
          <div className="space-y-3">
            {notificationTypes.map((type) => (
              <motion.div
                key={type.key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      notifications[type.key] 
                        ? 'bg-green-100' 
                        : 'bg-gray-100'
                    }`}>
                      <type.icon className={`w-5 h-5 ${
                        notifications[type.key] 
                          ? 'text-green-600' 
                          : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleToggle(type.key)}
                    disabled={!notifications.pushEnabled && !notifications.emailEnabled && !notifications.smsEnabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications[type.key] 
                        ? 'bg-green-600' 
                        : 'bg-gray-300'
                    } ${
                      !notifications.pushEnabled && !notifications.emailEnabled && !notifications.smsEnabled
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[type.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Quiet Hours
          </h2>
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  notifications.quietHoursEnabled 
                    ? 'bg-purple-100' 
                    : 'bg-gray-100'
                }`}>
                  <ClockIcon className={`w-5 h-5 ${
                    notifications.quietHoursEnabled 
                      ? 'text-purple-600' 
                      : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Do Not Disturb
                  </p>
                  <p className="text-xs text-gray-600">
                    Silence notifications during set hours
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleToggle('quietHoursEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.quietHoursEnabled 
                    ? 'bg-purple-600' 
                    : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {notifications.quietHoursEnabled && (
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">From</label>
                  <input
                    type="time"
                    value={notifications.quietHoursStart}
                    onChange={(e) => setNotifications(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-gray-100 rounded-lg text-gray-900"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">To</label>
                  <input
                    type="time"
                    value={notifications.quietHoursEnd}
                    onChange={(e) => setNotifications(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-gray-100 rounded-lg text-gray-900"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;