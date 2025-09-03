import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  PlusIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

function ProviderCard({ 
  provider, 
  onConnect, 
  isConnected = false, 
  connectionStatus = null,
  showFeatures = true,
  size = 'default' // 'compact' | 'default' | 'detailed'
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return {
          bg: 'bg-success-100',
          text: 'text-success-600',
          icon: CheckCircleIcon,
          label: 'Connected'
        };
      case 'connecting':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-600',
          icon: ClockIcon,
          label: 'Connecting'
        };
      case 'error':
        return {
          bg: 'bg-red-100',
          text: 'text-red-600',
          icon: ExclamationTriangleIcon,
          label: 'Error'
        };
      default:
        return {
          bg: 'bg-primary-100',
          text: 'text-primary-600',
          icon: PlusIcon,
          label: 'Connect'
        };
    }
  };

  const statusConfig = getStatusColor(connectionStatus || (isConnected ? 'connected' : null));
  const StatusIcon = statusConfig.icon;

  // Size configurations
  const sizeConfig = {
    compact: {
      padding: 'p-4',
      iconSize: 'w-10 h-10',
      titleSize: 'text-sm',
      descriptionSize: 'text-xs',
      showDescription: false,
      showFeatures: false
    },
    default: {
      padding: 'p-5',
      iconSize: 'w-12 h-12',
      titleSize: 'text-base',
      descriptionSize: 'text-sm',
      showDescription: true,
      showFeatures: showFeatures
    },
    detailed: {
      padding: 'p-6',
      iconSize: 'w-14 h-14',
      titleSize: 'text-lg',
      descriptionSize: 'text-sm',
      showDescription: true,
      showFeatures: true
    }
  };

  const config = sizeConfig[size];

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onConnect(provider)}
      className={`w-full bg-white rounded-2xl ${config.padding} border shadow-lg hover:shadow-xl transition-all text-left group`}
      style={{
        borderColor: provider.brandColor ? `${provider.brandColor}15` : '#e5e7eb'
      }}
      disabled={connectionStatus === 'connecting'}
    >
      <div className="flex items-start space-x-4">
        {/* Provider logo/icon */}
        <div 
          className={`${config.iconSize} rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 border shadow-sm`}
          style={{
            backgroundColor: provider.brandColorLight || '#f9fafb',
            borderColor: provider.brandColor ? `${provider.brandColor}20` : '#e5e7eb'
          }}
        >
          {provider.logo ? (
            provider.logo.endsWith('.svg') ? (
              <img 
                src={provider.logo} 
                alt={`${provider.name} logo`}
                className={`${config.iconSize} object-contain p-2`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <span className="text-2xl">{provider.logo}</span>
            )
          ) : (
            <div className="w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-400 rounded" />
          )}
          {/* Fallback for when image fails to load */}
          <div 
            className="w-6 h-6 rounded hidden items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: provider.brandColor || '#6b7280' }}
          >
            {provider.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
        
        {/* Provider info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className={`font-semibold text-gray-900 ${config.titleSize} truncate pr-2`}>
              {provider.name}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Popular badge */}
              {provider.isPopular && (
                <div className="bg-orange-100 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-semibold text-orange-700">
                    Popular
                  </span>
                </div>
              )}
              
              {/* Status badge */}
              <div className={`${statusConfig.bg} rounded-full px-2 py-0.5 flex items-center gap-1`}>
                <StatusIcon className={`w-3 h-3 ${statusConfig.text}`} />
                <span className={`text-xs font-medium ${statusConfig.text}`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>
          
          {/* Description */}
          {config.showDescription && (
            <p className={`text-gray-600 ${config.descriptionSize} mb-3 leading-relaxed`}>
              {provider.description}
            </p>
          )}
          
          {/* Connection info for connected providers */}
          {isConnected && provider.lastSync && (
            <div className="mb-3 p-2 bg-success-50 rounded-lg border border-success-100">
              <p className="text-xs text-success-700">
                <span className="font-medium">Last sync:</span> {formatLastSync(provider.lastSync)}
              </p>
            </div>
          )}
          
          {/* Features list */}
          {config.showFeatures && provider.supportedFeatures && (
            <div className="flex flex-wrap gap-2 mb-2">
              {provider.supportedFeatures.slice(0, 3).map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 font-medium"
                >
                  {formatFeatureName(feature)}
                </span>
              ))}
              {provider.supportedFeatures.length > 3 && (
                <span className="text-xs text-gray-500 font-medium">
                  +{provider.supportedFeatures.length - 3} more
                </span>
              )}
            </div>
          )}
          
          {/* Auth methods indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {provider.authMethods && (
                <span className="text-xs text-gray-500">
                  {getAuthMethodLabel(provider.authMethods)}
                </span>
              )}
            </div>
            
            {/* Arrow indicator */}
            <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>
      </div>
      
      {/* Loading overlay for connecting state */}
      {connectionStatus === 'connecting' && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-primary-600">Connecting...</span>
          </div>
        </div>
      )}
    </motion.button>
  );
}

// Helper functions
function formatLastSync(lastSync) {
  const now = new Date();
  const then = new Date(lastSync);
  const diffInHours = Math.floor((now - then) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return then.toLocaleDateString();
}

function formatFeatureName(feature) {
  const featureMap = {
    'claims': 'Claims',
    'eligibility': 'Eligibility', 
    'benefits': 'Benefits',
    'records': 'Records',
    'appointments': 'Appointments',
    'test_results': 'Test Results',
    'prescriptions': 'Prescriptions',
    'billing': 'Billing'
  };
  return featureMap[feature] || feature;
}

function getAuthMethodLabel(authMethods) {
  if (!authMethods || authMethods.length === 0) return '';
  
  if (authMethods.includes('oauth2')) {
    return 'Secure OAuth';
  } else if (authMethods.includes('credentials')) {
    return 'Username & Password';
  } else if (authMethods.includes('webview')) {
    return 'Web Login';
  }
  return 'Secure Connection';
}

export default ProviderCard;