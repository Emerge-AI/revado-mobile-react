import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  UserIcon,
  PlusIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  DocumentTextIcon,
  BellAlertIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { EVENT_TYPES, PRIORITY_LEVELS } from '../../services/eventExtraction';

function EventCard({ event, onAddToCalendar, onDismiss, isExpanded = false, onToggleExpand }) {
  const [isHovered, setIsHovered] = useState(false);

  const getEventIcon = (type) => {
    const icons = {
      [EVENT_TYPES.SURGERY]: WrenchScrewdriverIcon,
      [EVENT_TYPES.PROCEDURE]: BeakerIcon,
      [EVENT_TYPES.APPOINTMENT]: CalendarDaysIcon,
      [EVENT_TYPES.FOLLOW_UP]: HeartIcon,
      [EVENT_TYPES.TEST]: BeakerIcon,
      [EVENT_TYPES.MEDICATION_CHANGE]: AdjustmentsHorizontalIcon,
      [EVENT_TYPES.REMINDER]: BellAlertIcon,
      [EVENT_TYPES.LIFESTYLE_CHANGE]: HeartIcon,
      [EVENT_TYPES.SYMPTOM_ONSET]: DocumentTextIcon
    };
    return icons[type] || CalendarDaysIcon;
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case PRIORITY_LEVELS.URGENT:
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200',
          accent: 'bg-red-500',
          icon: ExclamationTriangleIcon,
          label: 'Urgent'
        };
      case PRIORITY_LEVELS.HIGH:
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-100',
          border: 'border-orange-200',
          accent: 'bg-orange-500',
          icon: ExclamationTriangleIcon,
          label: 'High Priority'
        };
      case PRIORITY_LEVELS.MEDIUM:
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          border: 'border-blue-200',
          accent: 'bg-blue-500',
          icon: InformationCircleIcon,
          label: 'Medium Priority'
        };
      default:
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          border: 'border-green-200',
          accent: 'bg-green-500',
          icon: CheckCircleIcon,
          label: 'Low Priority'
        };
    }
  };

  const getEventTypeConfig = (type) => {
    switch (type) {
      case EVENT_TYPES.SURGERY:
        return {
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Surgery',
          description: 'Surgical procedure requiring preparation'
        };
      case EVENT_TYPES.PROCEDURE:
        return {
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          label: 'Medical Procedure',
          description: 'Clinical procedure or treatment'
        };
      case EVENT_TYPES.TEST:
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Lab Test',
          description: 'Laboratory or diagnostic test'
        };
      case EVENT_TYPES.FOLLOW_UP:
        return {
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Follow-up',
          description: 'Follow-up appointment'
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'Appointment',
          description: 'Medical appointment'
        };
    }
  };

  const EventIcon = getEventIcon(event.type);
  const priorityConfig = getPriorityConfig(event.priority);
  const typeConfig = getEventTypeConfig(event.type);
  const PriorityIcon = priorityConfig.icon;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getDaysUntil = (dateString) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntil = getDaysUntil(event.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 ${typeConfig.border} shadow-lg hover:shadow-xl transition-all overflow-hidden`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Header with priority stripe */}
      <div className={`h-1 ${priorityConfig.accent}`} />
      
      {/* Main content */}
      <div className="p-5">
        {/* Top row - Icon, Title, Priority, Actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2.5 ${typeConfig.bg} rounded-xl flex-shrink-0`}>
              <EventIcon className={`w-5 h-5 ${typeConfig.color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 truncate">
                {event.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                {event.description}
              </p>
            </div>
          </div>

          {/* Priority badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${priorityConfig.bg} flex-shrink-0 ml-3`}>
            <PriorityIcon className={`w-3 h-3 ${priorityConfig.color}`} />
            <span className={`text-xs font-semibold ${priorityConfig.color}`}>
              {priorityConfig.label}
            </span>
          </div>
        </div>

        {/* Date and time info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm">
              {formatDate(event.date)}
              {daysUntil <= 7 && daysUntil > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                  {daysUntil} day{daysUntil !== 1 ? 's' : ''} away
                </span>
              )}
              {daysUntil === 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium animate-pulse">
                  Today!
                </span>
              )}
            </span>
          </div>
          
          {event.time && (
            <div className="flex items-center gap-2 text-gray-700">
              <ClockIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">{event.time}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-center gap-2 text-gray-700">
              <MapPinIcon className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium truncate">{event.location}</span>
            </div>
          )}
          
          {event.provider && (
            <div className="flex items-center gap-2 text-gray-700">
              <UserIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">{event.provider}</span>
            </div>
          )}
        </div>

        {/* Preparation needed indicator */}
        {event.needsPrep && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <BellAlertIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  Preparation Required
                </p>
                {event.prepInstructions && (
                  <button
                    onClick={onToggleExpand}
                    className="flex items-center gap-1 text-xs text-yellow-700 hover:text-yellow-800 transition-colors"
                  >
                    {isExpanded ? 'Hide' : 'View'} instructions
                    {isExpanded ? (
                      <ChevronDownIcon className="w-3 h-3" />
                    ) : (
                      <ChevronRightIcon className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {isExpanded && event.prepInstructions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-3 pt-3 border-t border-yellow-200"
              >
                <ul className="space-y-1">
                  {event.prepInstructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddToCalendar(event)}
            disabled={!event.calendarReady}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add to Calendar
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDismiss(event)}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <ShareIcon className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Confidence indicator */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>AI Confidence</span>
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(event.confidence || 0.8) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-green-500 h-1.5 rounded-full"
              />
            </div>
            <span className="font-medium">
              {Math.round((event.confidence || 0.8) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Hover animation */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none rounded-2xl ring-2 ring-blue-400 ring-opacity-50"
        />
      )}
    </motion.div>
  );
}

export default EventCard;