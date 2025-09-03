import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import PillVisualizer from './PillVisualizer';
import { useAuth } from '../contexts/AuthContext';
import { 
  XMarkIcon,
  EnvelopeIcon,
  ShareIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

function MedShareModal({ isOpen, onClose, medication, allMedications }) {
  const { user } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [shareType, setShareType] = useState('current'); // current, today, all
  const [customMessage, setCustomMessage] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(recipientEmail));
  }, [recipientEmail]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecipientEmail('');
      setCustomMessage('');
      setShareType(medication ? 'current' : 'all');
      setShowSuccess(false);
    }
  }, [isOpen, medication]);

  // Get medications to share based on type
  const getMedicationsToShare = () => {
    if (medication) {
      return [medication];
    }
    
    switch (shareType) {
      case 'today':
        return allMedications?.filter(med => 
          med.status === 'active' && med.times?.length > 0
        ) || [];
      case 'active':
        return allMedications?.filter(med => med.status === 'active') || [];
      case 'all':
      default:
        return allMedications || [];
    }
  };

  const medicationsToShare = getMedicationsToShare();

  // Generate email content
  const generateEmailContent = () => {
    const medicationList = medicationsToShare.map(med => `
• ${med.name} ${med.dosage}
  ${med.frequency}${med.prescribedBy ? ` - Prescribed by ${med.prescribedBy}` : ''}${med.instructions ? `\n  Instructions: ${med.instructions}` : ''}
    `).join('\n');

    const shareTypeLabel = medication ? 'Medication Details' :
                          shareType === 'today' ? "Today's Medications" :
                          shareType === 'active' ? 'Active Medications' :
                          'All Medications';

    return `Subject: ${shareTypeLabel} - ${user?.name || 'Patient'}

${customMessage ? customMessage + '\n\n' : ''}${shareTypeLabel}:
${medicationList}

---
Generated on ${new Date().toLocaleDateString()} via Revado Health Records
Patient: ${user?.name || 'Unknown'}
Email: ${user?.email || 'Not provided'}`;
  };

  // Handle share
  const handleShare = async () => {
    if (!isValid || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would call an email service
      const emailContent = generateEmailContent();
      console.log('Sharing medications via email:', {
        to: recipientEmail,
        content: emailContent,
        medications: medicationsToShare
      });
      
      setShowSuccess(true);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get share type options
  const shareTypeOptions = medication ? [] : [
    { value: 'today', label: "Today's Schedule", count: allMedications?.filter(m => m.status === 'active' && m.times?.length > 0).length || 0 },
    { value: 'active', label: 'Active Medications', count: allMedications?.filter(m => m.status === 'active').length || 0 },
    { value: 'all', label: 'All Medications', count: allMedications?.length || 0 }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 bottom-4 sm:relative sm:inset-auto bg-white rounded-2xl shadow-2xl z-50 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Success State */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-white rounded-2xl flex items-center justify-center z-10"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <CheckCircleIcon className="w-8 h-8 text-green-600" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Medications Shared!
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Successfully sent to {recipientEmail}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <ShareIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Share Medications
                  </h2>
                  <p className="text-sm text-gray-600">
                    {medication ? medication.name : `${medicationsToShare.length} medications`}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Share Type Selection (only if sharing all medications) */}
              {!medication && shareTypeOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    What would you like to share?
                  </label>
                  <div className="space-y-2">
                    {shareTypeOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShareType(option.value)}
                        className={`w-full p-3 rounded-xl text-left transition-all ${
                          shareType === option.value
                            ? 'bg-primary-50 border-primary-200 text-primary-900'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        } border`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.label}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm bg-white px-2 py-1 rounded-lg">
                              {option.count}
                            </span>
                            {shareType === option.value && (
                              <CheckCircleIcon className="w-4 h-4 text-primary-600" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Preview ({medicationsToShare.length} medication{medicationsToShare.length !== 1 ? 's' : ''})
                </label>
                <div className="bg-gray-50 rounded-xl p-4 max-h-40 overflow-y-auto">
                  <div className="space-y-3">
                    {medicationsToShare.slice(0, 3).map((med) => (
                      <div key={med.id} className="flex items-center space-x-3">
                        <PillVisualizer
                          pillType={med.pillType}
                          color={med.color}
                          shape={med.shape}
                          size="small"
                          animate={false}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {med.name} {med.dosage}
                          </p>
                          <p className="text-xs text-gray-600">{med.frequency}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          med.status === 'active' ? 'bg-green-100 text-green-800' :
                          med.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {med.status}
                        </div>
                      </div>
                    ))}
                    {medicationsToShare.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{medicationsToShare.length - 3} more medications
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recipient Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recipient Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all ${
                      recipientEmail && !isValid 
                        ? 'border-red-300 bg-red-50 text-red-900 placeholder-red-400' 
                        : 'border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                    } focus:outline-none`}
                  />
                </div>
                {recipientEmail && !isValid && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <InformationCircleIcon className="w-4 h-4 mr-1" />
                    Please enter a valid email address
                  </p>
                )}
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Hi Dr. Smith, here are my current medications for our upcoming appointment..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-gray-300 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none resize-none"
                />
              </div>

              {/* Send Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                disabled={!isValid || isLoading}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center space-x-2 ${
                  isValid && !isLoading
                    ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    <span>Send Medications</span>
                  </>
                )}
              </motion.button>

              {/* Disclaimer */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-start space-x-2">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-900 font-semibold mb-1">
                      Secure & Professional
                    </p>
                    <p className="text-xs text-blue-800">
                      This information will be sent securely and formatted professionally 
                      for healthcare providers. Your privacy is protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

MedShareModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  medication: PropTypes.object, // Single medication to share
  allMedications: PropTypes.array // All medications when sharing multiple
};

export default MedShareModal;