import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon,
  CalendarDaysIcon,
  UserIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

function MedicationTracker({ medications = [], onUpdateMedication, isExpanded = false, onToggleExpand }) {
  const [showInteractions, setShowInteractions] = useState(false);

  const getMedicationActionConfig = (action) => {
    switch (action) {
      case 'start':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          border: 'border-green-200',
          icon: PlusIcon,
          label: 'Starting'
        };
      case 'stop':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          border: 'border-red-200',
          icon: XMarkIcon,
          label: 'Stopping'
        };
      case 'change':
      case 'adjust':
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-100',
          border: 'border-orange-200',
          icon: AdjustmentsHorizontalIcon,
          label: 'Adjusting'
        };
      default:
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          border: 'border-blue-200',
          icon: BeakerIcon,
          label: 'Medication'
        };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          icon: ExclamationTriangleIcon,
          label: 'Urgent'
        };
      case 'high':
        return {
          color: 'text-orange-600',
          bg: 'bg-orange-100',
          icon: ExclamationTriangleIcon,
          label: 'High Priority'
        };
      case 'medium':
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-100',
          icon: InformationCircleIcon,
          label: 'Medium Priority'
        };
      default:
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          icon: CheckCircleIcon,
          label: 'Low Priority'
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Ongoing';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!medications || medications.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
        <BeakerIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">No medications extracted from conversation</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {medications.map((medication, index) => {
        const actionConfig = getMedicationActionConfig(medication.action);
        const priorityConfig = getPriorityConfig(medication.priority);
        const ActionIcon = actionConfig.icon;
        const PriorityIcon = priorityConfig.icon;

        return (
          <motion.div
            key={medication.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white border-2 ${actionConfig.border} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 ${actionConfig.bg} rounded-xl`}>
                  <ActionIcon className={`w-5 h-5 ${actionConfig.color}`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">
                      {medication.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionConfig.bg} ${actionConfig.color}`}>
                      {actionConfig.label}
                    </span>
                  </div>

                  {medication.dosage && medication.frequency && (
                    <p className="text-sm text-gray-600">
                      {medication.dosage} - {medication.frequency}
                    </p>
                  )}

                  {medication.reason && (
                    <p className="text-sm text-gray-700 mt-1 font-medium">
                      {medication.reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Priority badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${priorityConfig.bg}`}>
                <PriorityIcon className={`w-3 h-3 ${priorityConfig.color}`} />
                <span className={`text-xs font-medium ${priorityConfig.color}`}>
                  {priorityConfig.label}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-3">
              {/* Dates */}
              <div className="flex flex-wrap gap-4 text-sm">
                {medication.startDate && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <CalendarDaysIcon className="w-4 h-4 text-green-600" />
                    <span>Start: {formatDate(medication.startDate)}</span>
                  </div>
                )}

                {medication.endDate && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <CalendarDaysIcon className="w-4 h-4 text-red-600" />
                    <span>End: {formatDate(medication.endDate)}</span>
                  </div>
                )}

                {medication.stopDate && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <CalendarDaysIcon className="w-4 h-4 text-red-600" />
                    <span>Stopped: {formatDate(medication.stopDate)}</span>
                  </div>
                )}
              </div>

              {/* Prescriber */}
              {medication.prescriber && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <UserIcon className="w-4 h-4" />
                  <span>Prescribed by {medication.prescriber}</span>
                </div>
              )}

              {/* Instructions */}
              {medication.instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium mb-1">Instructions</p>
                  <p className="text-sm text-blue-700">{medication.instructions}</p>
                </div>
              )}
            </div>

            {/* Monitoring */}
            {medication.needsMonitoring && medication.monitoringSchedule && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <ClockIcon className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Monitoring Required</p>
                    <p className="text-sm text-yellow-700 mt-1">{medication.monitoringSchedule}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Side Effects and Interactions */}
            {(medication.sideEffects?.length > 0 || medication.interactions?.length > 0) && (
              <div>
                <button
                  onClick={() => setShowInteractions(!showInteractions)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-2"
                >
                  {showInteractions ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                  <span>{showInteractions ? 'Hide' : 'Show'} side effects & interactions</span>
                </button>

                {showInteractions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    {/* Side Effects */}
                    {medication.sideEffects?.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-orange-800 mb-2">Possible Side Effects</p>
                        <div className="flex flex-wrap gap-1">
                          {medication.sideEffects.map((effect, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs"
                            >
                              {effect}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Drug Interactions */}
                    {medication.interactions?.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-800 mb-2">Drug Interactions</p>
                        <div className="flex flex-wrap gap-1">
                          {medication.interactions.map((interaction, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"
                            >
                              {interaction}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Confidence indicator */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>AI Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-12 bg-gray-200 rounded-full h-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(medication.confidence || 0.9) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="bg-green-500 h-1 rounded-full"
                  />
                </div>
                <span className="font-medium">
                  {Math.round((medication.confidence || 0.9) * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default MedicationTracker;
