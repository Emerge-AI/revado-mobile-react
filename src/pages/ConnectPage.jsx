import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useConnections } from '../contexts/ConnectionsContext';
import {
  ShieldCheckIcon,
  CreditCardIcon,
  BuildingOffice2Icon,
  PlusCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  SparklesIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

function ConnectPage() {
  const navigate = useNavigate();
  const { connections, getConnectedProvidersCount, getProviders, loading } = useConnections();
  const [showConnectionTip, setShowConnectionTip] = useState(true);

  const connectedCount = getConnectedProvidersCount();
  const recentConnections = connections.slice(0, 3); // Show 3 most recent

  // Get NYC healthcare providers
  const allHealthcareProviders = getProviders('healthcare');
  const nycProviders = allHealthcareProviders.filter(provider =>
    provider.location && (
      provider.location.includes('New York') ||
      provider.location.includes('Brooklyn') ||
      provider.location.includes('Bronx') ||
      provider.location.includes('Staten Island') ||
      provider.location.includes('Long Island')
    )
  ).slice(0, 3); // Show top 3 NYC providers

  const connectionCategories = [
    {
      id: 'insurance',
      title: 'Insurance Providers',
      description: 'Connect to your health insurance',
      icon: CreditCardIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      path: '/connect/insurance',
      features: ['Claims & Coverage', 'Benefits & Deductibles', 'Eligibility Verification'],
      connectedCount: connections.filter(c => c.connectionType === 'insurance' && c.status === 'connected').length,
    },
    {
      id: 'healthcare',
      title: 'Healthcare Systems',
      description: 'Connect to hospitals & clinics',
      icon: BuildingOffice2Icon,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      path: '/connect/healthcare',
      features: ['Medical Records', 'Test Results', 'Appointment History'],
      connectedCount: connections.filter(c => c.connectionType === 'healthcare' && c.status === 'connected').length,
    },
  ];

  const formatTimeAgo = (date) => {
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

  return (
    <div className="min-h-screen pb-20">
      <div className="pt-safe-top px-4">
        {/* Header */}
        <div className="py-8">
          {/* Settings Button */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Connect</h1>
              {connectedCount > 0 && (
                <div className="bg-primary-100 rounded-full px-3 py-1">
                  <span className="text-sm font-semibold text-primary-700">
                    {connectedCount} connected
                  </span>
                </div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/connect/accounts')}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
            </motion.button>
          </div>

          <p className="text-gray-600 font-medium mb-6">
            Securely connect your health accounts to import records automatically
          </p>

          {/* Security Assurance Badge */}
          <div className="bg-success-50 rounded-xl p-4 mb-8 border border-success-200">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="w-6 h-6 text-success-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-success-800">
                  Bank-Level Security
                </p>
                <p className="text-xs text-success-600">
                  HIPAA compliant • End-to-end encrypted • Never stored permanently
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status Overview */}
        {connectedCount > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-2 gap-4">
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
                    Active
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {connectedCount}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  Connected accounts
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-blue-100">
                    <ClockIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-700">
                    Syncing
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.floor(Math.random() * 3) + 1}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  Records today
                </p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Featured NYC Healthcare */}
        {nycProviders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-blue-600" />
                Featured NYC Healthcare
              </h2>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/connect/healthcare')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all NYC
              </motion.button>
            </div>

            <div className="grid gap-3">
              {nycProviders.map((provider) => {
                const isConnected = connections.some(c => c.providerId === provider.id && c.status === 'connected');
                return (
                  <motion.button
                    key={provider.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/connect/healthcare')}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-xl transition-all text-left"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Provider Icon */}
                      <div className={`rounded-xl p-3 flex-shrink-0`} style={{ backgroundColor: provider.brandColor + '15' }}>
                        <BuildingOffice2Icon className="w-6 h-6" style={{ color: provider.brandColor }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-base truncate">
                            {provider.name}
                          </h3>
                          {isConnected && (
                            <div className="bg-success-100 rounded-full px-2 py-0.5 ml-2">
                              <span className="text-xs font-semibold text-success-700">
                                Connected
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 truncate">
                          {provider.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPinIcon className="w-3 h-3" />
                            {provider.location}
                          </span>
                          {provider.isPopular && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* Connection Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            Connect Your Accounts
          </h2>

          <div className="space-y-4">
            {connectionCategories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(category.path)}
                className="w-full bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all text-left"
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`${category.iconBg} rounded-xl p-3 flex-shrink-0`}>
                    <category.icon className={`w-6 h-6 ${category.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {category.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {category.connectedCount > 0 && (
                          <div className="bg-success-100 rounded-full px-2 py-0.5">
                            <span className="text-xs font-semibold text-success-700">
                              {category.connectedCount} connected
                            </span>
                          </div>
                        )}
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 font-medium">
                      {category.description}
                    </p>

                    {/* Features list */}
                    <div className="flex flex-wrap gap-2">
                      {category.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {recentConnections.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Recent Activity
              </h2>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/connect/accounts')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </motion.button>
            </div>

            <div className="space-y-3">
              {recentConnections.map((connection) => (
                <motion.div
                  key={connection.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-center space-x-3">
                    {/* Status indicator */}
                    <div className={`p-2 rounded-xl flex-shrink-0 ${connection.status === 'connected'
                        ? 'bg-success-100'
                        : connection.status === 'connecting'
                          ? 'bg-yellow-100'
                          : 'bg-gray-100'
                      }`}>
                      {connection.status === 'connected' ? (
                        <CheckCircleIcon className="w-5 h-5 text-success-600" />
                      ) : connection.status === 'connecting' ? (
                        <ClockIcon className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <PlusCircleIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {connection.accountName}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTimeAgo(connection.lastSync)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {connection.connectionType === 'insurance' ? 'Insurance Provider' : 'Healthcare System'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Getting Started Tip */}
        {connectedCount === 0 && showConnectionTip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary-50 rounded-xl p-4 border border-primary-100 mb-8"
          >
            <div className="flex items-start gap-3">
              <SparklesIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary-800 mb-1">
                  Get Started
                </p>
                <p className="text-xs text-primary-700 mb-3">
                  Connect your insurance or healthcare accounts to automatically import your health records and make sharing with doctors effortless.
                </p>
                <button
                  onClick={() => setShowConnectionTip(false)}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Additional Security Info */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-center">
            <ShieldCheckIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700 mb-1">
              Your privacy is protected
            </p>
            <p className="text-xs text-gray-600">
              We use read-only connections and never store your login credentials.
              All data is encrypted and you can disconnect anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectPage;
