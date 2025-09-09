import { motion } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

function HealthHubCard({
  title,
  description,
  icon: Icon,
  iconBgColor = 'bg-primary-100',
  iconColor = 'text-primary-600',
  statusText,
  statusColor = 'text-primary-600',
  onClick,
  className = ''
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all text-left w-full group ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Icon */}
          <div className={`${iconBgColor} rounded-xl p-3 mb-4 inline-flex`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>

          {/* Content */}
          <h3 className="font-bold text-gray-900 text-lg mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {description}
          </p>

          {/* Status */}
          {statusText && (
            <div className="flex items-center space-x-2">
              <div className={`text-sm font-semibold ${statusColor}`}>
                {statusText}
              </div>
              {statusText.includes('due') && (
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}

HealthHubCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  iconBgColor: PropTypes.string,
  iconColor: PropTypes.string,
  statusText: PropTypes.string,
  statusColor: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default HealthHubCard;
