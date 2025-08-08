import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CameraIcon, 
  IdentificationIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

function OnboardingPage({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selfieCompleted, setSelfieCompleted] = useState(false);
  const [idCompleted, setIdCompleted] = useState(false);

  const steps = [
    {
      title: 'Welcome to Revado',
      description: 'Import and share your health records in minutes',
      icon: '👋',
      action: null,
    },
    {
      title: 'Optional: Verify Identity',
      description: 'Take a selfie and photo of your ID to unlock premium features',
      icon: '🔐',
      action: 'verify',
    },
    {
      title: 'You\'re All Set!',
      description: 'Start importing your health records now',
      icon: '🎉',
      action: null,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSelfie = () => {
    // Simulate camera capture
    setTimeout(() => {
      setSelfieCompleted(true);
    }, 1000);
  };

  const handleID = () => {
    // Simulate ID capture
    setTimeout(() => {
      setIdCompleted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <div className="pt-safe-top px-4 pb-8 flex-1 flex flex-col">
        {/* Progress Indicator */}
        <div className="flex space-x-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-ios-blue' : 'bg-ios-gray-200 dark:bg-ios-gray-800'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="flex-1 flex flex-col justify-center"
          >
            <div className="text-center mb-8">
              <span className="text-6xl mb-4 block">{steps[currentStep].icon}</span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {steps[currentStep].title}
              </h1>
              <p className="text-ios-gray-600 dark:text-ios-gray-400 text-lg">
                {steps[currentStep].description}
              </p>
            </div>

            {steps[currentStep].action === 'verify' && (
              <div className="space-y-3 mb-8">
                <button
                  onClick={handleSelfie}
                  disabled={selfieCompleted}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors ${
                    selfieCompleted
                      ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                      : 'bg-ios-gray-100 dark:bg-ios-gray-900 hover:bg-ios-gray-200 dark:hover:bg-ios-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CameraIcon className={`w-6 h-6 ${
                      selfieCompleted ? 'text-green-500' : 'text-ios-gray-600 dark:text-ios-gray-400'
                    }`} />
                    <span className={`font-medium ${
                      selfieCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'
                    }`}>
                      Take Selfie
                    </span>
                  </div>
                  {selfieCompleted && (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  )}
                </button>

                <button
                  onClick={handleID}
                  disabled={idCompleted}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors ${
                    idCompleted
                      ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                      : 'bg-ios-gray-100 dark:bg-ios-gray-900 hover:bg-ios-gray-200 dark:hover:bg-ios-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IdentificationIcon className={`w-6 h-6 ${
                      idCompleted ? 'text-green-500' : 'text-ios-gray-600 dark:text-ios-gray-400'
                    }`} />
                    <span className={`font-medium ${
                      idCompleted ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'
                    }`}>
                      Scan ID
                    </span>
                  </div>
                  {idCompleted && (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  )}
                </button>

                <p className="text-xs text-center text-ios-gray-500 mt-4">
                  Optional: Skip this step if you prefer
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="space-y-3">
          <button
            onClick={handleNext}
            className="w-full bg-ios-blue text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-600 transition-colors"
          >
            <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}</span>
            <ArrowRightIcon className="w-5 h-5" />
          </button>

          {steps[currentStep].action === 'verify' && (
            <button
              onClick={handleNext}
              className="w-full text-ios-blue py-3 font-medium"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;