import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useBiometricAuth from '../hooks/useBiometricAuth';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaceSmileIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { FaceSmileIcon as FaceSmileSolid } from '@heroicons/react/24/solid';

function FaceIDSetup({ onClose, onSuccess }) {
  const { user } = useAuth();
  const { 
    isAvailable, 
    isRegistered,
    registerBiometric, 
    authenticateWithBiometric,
    disableBiometric 
  } = useBiometricAuth();
  
  const [step, setStep] = useState('intro'); // intro, registering, success, error
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSetupFaceID = async () => {
    if (!user) {
      setError('Please sign in first');
      return;
    }

    setIsProcessing(true);
    setStep('registering');
    setError('');

    try {
      // Small delay for animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await registerBiometric(user.id || 'user-' + Date.now(), user.email);
      
      if (result.success) {
        setStep('success');
        if (onSuccess) {
          setTimeout(() => onSuccess(), 2000);
        }
      } else {
        setError(result.error || 'Failed to set up Face ID');
        setStep('error');
      }
    } catch (err) {
      console.error('Face ID setup error:', err);
      setError(err.message || 'An unexpected error occurred');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestFaceID = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const result = await authenticateWithBiometric();
      
      if (result.success) {
        setStep('test-success');
        setTimeout(() => setStep('success'), 2000);
      } else {
        setError(result.error || 'Face ID test failed');
      }
    } catch (err) {
      console.error('Face ID test error:', err);
      setError(err.message || 'Test failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableFaceID = async () => {
    if (window.confirm('Are you sure you want to disable Face ID?')) {
      disableBiometric();
      setStep('intro');
      if (onClose) onClose();
    }
  };

  if (!isAvailable) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-auto"
      >
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Face ID Not Available
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Face ID is not available on this device or browser. Please ensure you're using Safari on iOS or a compatible browser.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {/* Intro Screen */}
      {step === 'intro' && (
        <motion.div
          key="intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-auto"
        >
          <div className="text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="inline-block"
            >
              <FaceSmileSolid className="w-20 h-20 text-blue-500 mx-auto mb-6" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {isRegistered ? 'Face ID Settings' : 'Set Up Face ID'}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {isRegistered 
                ? 'Face ID is enabled for quick and secure access to your health records'
                : 'Use Face ID for quick and secure access to your health records'
              }
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-left">
                <ShieldCheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enhanced security with biometric authentication
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <DevicePhoneMobileIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Quick access without passwords
                </span>
              </div>
              <div className="flex items-center gap-3 text-left">
                <LockClosedIcon className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Your biometric data stays on your device
                </span>
              </div>
            </div>

            {/* Actions */}
            {isRegistered ? (
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTestFaceID}
                  disabled={isProcessing}
                  className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  Test Face ID
                  <ArrowRightIcon className="w-5 h-5" />
                </motion.button>
                <button
                  onClick={handleDisableFaceID}
                  className="w-full px-6 py-3 text-red-600 dark:text-red-400 font-medium"
                >
                  Disable Face ID
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSetupFaceID}
                disabled={isProcessing}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                Enable Face ID
                <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
            )}

            <button
              onClick={onClose}
              className="mt-4 text-gray-500 dark:text-gray-400 text-sm"
            >
              Maybe Later
            </button>
          </div>
        </motion.div>
      )}

      {/* Registering Screen */}
      {step === 'registering' && (
        <motion.div
          key="registering"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-auto"
        >
          <div className="text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity
              }}
              className="inline-block"
            >
              <FaceSmileIcon className="w-20 h-20 text-blue-500 mx-auto mb-6" />
            </motion.div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Setting Up Face ID
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Follow the prompts on your device...
            </p>
            
            <div className="mt-8">
              <div className="animate-pulse flex space-x-1 justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animation-delay-200"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animation-delay-400"></div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Screen */}
      {step === 'success' && (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-auto"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
            </motion.div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Face ID Enabled!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              You can now use Face ID to quickly access your health records
            </p>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
            >
              Done
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Test Success Screen */}
      {step === 'test-success' && (
        <motion.div
          key="test-success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-auto"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
            </motion.div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Face ID Works!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Authentication successful
            </p>
          </div>
        </motion.div>
      )}

      {/* Error Screen */}
      {step === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-auto"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <XCircleIcon className="w-20 h-20 text-red-500 mx-auto mb-6" />
            </motion.div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Setup Failed
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {error || 'Failed to set up Face ID'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Please try again or contact support
            </p>
            
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('intro')}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                Try Again
              </motion.button>
              <button
                onClick={onClose}
                className="w-full px-6 py-3 text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FaceIDSetup;