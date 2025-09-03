import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import PillVisualizer from './PillVisualizer';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

function TodaysSchedule({ medications = [] }) {
  const [completedDoses, setCompletedDoses] = useState(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Generate today's schedule from medications
  const getTodaysSchedule = () => {
    const schedule = [];
    const today = new Date();
    
    medications.forEach(medication => {
      if (medication.status !== 'active' || !medication.times) return;
      
      medication.times.forEach(timeStr => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduleTime = new Date(today);
        scheduleTime.setHours(hours, minutes, 0, 0);
        
        const doseId = `${medication.id}-${timeStr}`;
        const isCompleted = completedDoses.has(doseId);
        const isPast = currentTime > scheduleTime;
        const isOverdue = isPast && !isCompleted;
        const isUpcoming = !isPast && !isCompleted;
        const timeUntil = scheduleTime.getTime() - currentTime.getTime();
        const isDueSoon = timeUntil > 0 && timeUntil <= 30 * 60 * 1000; // 30 minutes
        
        schedule.push({
          id: doseId,
          medication,
          time: scheduleTime,
          timeStr,
          isCompleted,
          isPast,
          isOverdue,
          isUpcoming,
          isDueSoon,
          timeUntil
        });
      });
    });
    
    return schedule.sort((a, b) => a.time.getTime() - b.time.getTime());
  };

  const todaysSchedule = getTodaysSchedule();
  const completedCount = todaysSchedule.filter(dose => dose.isCompleted).length;
  const overdueCount = todaysSchedule.filter(dose => dose.isOverdue).length;
  const dueSoonCount = todaysSchedule.filter(dose => dose.isDueSoon).length;

  // Handle dose completion
  const handleDoseComplete = (doseId) => {
    setCompletedDoses(prev => {
      const newCompleted = new Set(prev);
      if (newCompleted.has(doseId)) {
        newCompleted.delete(doseId);
      } else {
        newCompleted.add(doseId);
      }
      return newCompleted;
    });
  };

  // Get status color and icon
  const getDoseStatus = (dose) => {
    if (dose.isCompleted) {
      return {
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircleSolid,
        label: 'Completed'
      };
    }
    if (dose.isOverdue) {
      return {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: ExclamationTriangleIcon,
        label: 'Overdue'
      };
    }
    if (dose.isDueSoon) {
      return {
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        icon: ClockIcon,
        label: 'Due Soon'
      };
    }
    return {
      color: 'text-gray-400 bg-gray-50 border-gray-200',
      icon: ClockIcon,
      label: 'Upcoming'
    };
  };

  // Format time until next dose
  const formatTimeUntil = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  // Get next dose
  const getNextDose = () => {
    const upcomingDoses = todaysSchedule.filter(dose => dose.isUpcoming);
    return upcomingDoses.length > 0 ? upcomingDoses[0] : null;
  };

  const nextDose = getNextDose();

  if (todaysSchedule.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100"
      >
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClockIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No medications scheduled for today
        </h3>
        <p className="text-gray-600 text-sm">
          You're all set! Check back tomorrow for your next doses.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Today's Progress</h3>
          <div className="flex items-center space-x-1 text-sm font-semibold text-primary-600">
            <ArrowPathIcon className="w-4 h-4" />
            <span>{completedCount}/{todaysSchedule.length}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <motion.div
            className="bg-primary-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / todaysSchedule.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Status Summary */}
        <div className="flex items-center space-x-4 text-sm">
          {overdueCount > 0 && (
            <div className="flex items-center space-x-1 text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{overdueCount} overdue</span>
            </div>
          )}
          {dueSoonCount > 0 && (
            <div className="flex items-center space-x-1 text-amber-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>{dueSoonCount} due soon</span>
            </div>
          )}
          <div className="flex items-center space-x-1 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{completedCount} completed</span>
          </div>
        </div>
        
        {/* Next Dose Info */}
        {nextDose && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Next: {nextDose.medication.name}
                </p>
                <p className="text-xs text-blue-700">
                  {nextDose.time.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })} • in {formatTimeUntil(nextDose.timeUntil)}
                </p>
              </div>
              <PillVisualizer
                pillType={nextDose.medication.pillType}
                color={nextDose.medication.color}
                shape={nextDose.medication.shape}
                size="small"
                animate={false}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
        
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <AnimatePresence>
            {todaysSchedule.map((dose, index) => {
              const status = getDoseStatus(dose);
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={dose.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-center space-x-4 pb-4 last:pb-0"
                >
                  {/* Timeline dot */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDoseComplete(dose.id)}
                    className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${status.color} hover:shadow-lg`}
                  >
                    <StatusIcon className="w-6 h-6" />
                  </motion.button>
                  
                  {/* Dose info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <PillVisualizer
                          pillType={dose.medication.pillType}
                          color={dose.medication.color}
                          shape={dose.medication.shape}
                          size="small"
                          animate={false}
                        />
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {dose.medication.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {dose.medication.dosage}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {dose.time.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </p>
                        <p className={`text-xs ${
                          dose.isCompleted ? 'text-green-600' :
                          dose.isOverdue ? 'text-red-600' :
                          dose.isDueSoon ? 'text-amber-600' :
                          'text-gray-500'
                        }`}>
                          {dose.isCompleted ? 'Completed' :
                           dose.isOverdue ? 'Overdue' :
                           dose.isDueSoon ? `Due in ${formatTimeUntil(dose.timeUntil)}` :
                           'Upcoming'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Medication instructions */}
                    {dose.medication.instructions && !dose.isCompleted && (
                      <p className="text-xs text-gray-500 mt-1 ml-9">
                        {dose.medication.instructions}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

TodaysSchedule.propTypes = {
  medications: PropTypes.array.isRequired
};

export default TodaysSchedule;