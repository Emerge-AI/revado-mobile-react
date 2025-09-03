import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHealthRecords } from '../contexts/HealthRecordsContext';
import { useAuth } from '../contexts/AuthContext';
import TodaysSchedule from '../components/TodaysSchedule';
import PillVisualizer from '../components/PillVisualizer';
import MedShareModal from '../components/MedShareModal';
import { 
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  PauseIcon,
  InformationCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

function MedicationsPage() {
  const { user } = useAuth();
  const { medications } = useHealthRecords();
  const [activeTab, setActiveTab] = useState('active');
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);

  // Filter medications by status
  const activeMedications = medications.filter(med => med.status === 'active');
  const pausedMedications = medications.filter(med => med.status === 'paused');
  const completedMedications = medications.filter(med => med.status === 'completed');

  // Get today's medication count
  const todaysMedCount = activeMedications.reduce((count, med) => {
    return count + (med.times?.length || 0);
  }, 0);

  const handleShareMedication = (medication) => {
    setSelectedMedication(medication);
    setShowShareModal(true);
  };

  const handleShareAll = () => {
    setSelectedMedication(null);
    setShowShareModal(true);
  };

  const getMedicationsByTab = () => {
    switch (activeTab) {
      case 'active':
        return activeMedications;
      case 'paused':
        return pausedMedications;
      case 'completed':
        return completedMedications;
      default:
        return activeMedications;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="pt-safe-top">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white px-4 py-6 border-b border-gray-100"
        >
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-900">My Medications</h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleShareAll}
              className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
            >
              <ShareIcon className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* Quick Stats */}
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Active: <span className="font-semibold text-gray-900">{activeMedications.length}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Due Today: <span className="font-semibold text-gray-900">{todaysMedCount}</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Today's Schedule Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="px-4 py-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <TodaysSchedule medications={activeMedications} />
        </motion.div>

        {/* All Medications Section */}
        <div className="px-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1">
            {['active', 'paused', 'completed'].map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-1 text-xs">
                  ({tab === 'active' ? activeMedications.length : 
                    tab === 'paused' ? pausedMedications.length : completedMedications.length})
                </span>
              </motion.button>
            ))}
          </div>

          {/* Medications List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <AnimatePresence mode="wait">
              {getMedicationsByTab().map((medication, index) => (
                <motion.div
                  key={medication.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    {/* Pill Visual */}
                    <PillVisualizer
                      pillType={medication.pillType}
                      color={medication.color}
                      shape={medication.shape}
                      size="medium"
                    />
                    
                    {/* Medication Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {medication.name}
                        </h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          medication.status === 'active' ? 'bg-green-100 text-green-800' :
                          medication.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {medication.status === 'active' && <CheckCircleIcon className="w-3 h-3 inline mr-1" />}
                          {medication.status === 'paused' && <PauseIcon className="w-3 h-3 inline mr-1" />}
                          {medication.status.charAt(0).toUpperCase() + medication.status.slice(1)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-1">
                        {medication.dosage} • {medication.frequency}
                      </p>
                      
                      {medication.prescribedBy && (
                        <p className="text-xs text-gray-500">
                          Prescribed by {medication.prescribedBy}
                        </p>
                      )}
                      
                      {medication.nextDose && medication.status === 'active' && (
                        <div className="flex items-center mt-2 text-sm">
                          <ClockIcon className="w-4 h-4 text-primary-600 mr-1" />
                          <span className="text-primary-600 font-medium">
                            Next: {new Date(medication.nextDose).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleShareMedication(medication)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <ShareIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                  
                  {/* Medication Instructions */}
                  {medication.instructions && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <InformationCircleIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800">{medication.instructions}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {getMedicationsByTab().length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No {activeTab} medications
                </h3>
                <p className="text-gray-600 text-sm">
                  {activeTab === 'active' ? 
                    'Add your first medication to get started' :
                    `No ${activeTab} medications to show`
                  }
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Share Modal */}
      <MedShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        medication={selectedMedication}
        allMedications={selectedMedication ? null : activeMedications}
      />
    </div>
  );
}

export default MedicationsPage;