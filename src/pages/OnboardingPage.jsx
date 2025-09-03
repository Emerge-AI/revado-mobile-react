import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RevadoLogo from '../components/RevadoLogo';
import { 
  CameraIcon, 
  IdentificationIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  CreditCardIcon,
  PhotoIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

function OnboardingPage({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selfieCompleted, setSelfieCompleted] = useState(false);
  const [idCompleted, setIdCompleted] = useState(false);
  const [insuranceFrontCompleted, setInsuranceFrontCompleted] = useState(false);
  const [insuranceBackCompleted, setInsuranceBackCompleted] = useState(false);
  const [insuranceImages, setInsuranceImages] = useState({ front: null, back: null });
  const frontFileInputRef = useRef(null);
  const backFileInputRef = useRef(null);

  const steps = [
    {
      title: 'Welcome to Revado Health',
      description: 'Import and share your health records in minutes',
      icon: '👋',
      action: null,
    },
    {
      title: 'Scan Insurance Card',
      description: 'Quick access to your provider network and coverage',
      icon: '💳',
      action: 'insurance',
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

  const handleInsuranceCapture = (side) => {
    // Create a file input element for mobile camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Create a preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setInsuranceImages(prev => ({
            ...prev,
            [side]: reader.result
          }));
          
          if (side === 'front') {
            setInsuranceFrontCompleted(true);
          } else {
            setInsuranceBackCompleted(true);
          }
          
          // Store in localStorage for demo purposes
          localStorage.setItem(`insurance_${side}`, reader.result);
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="pt-safe-top px-4 pb-8 flex-1 flex flex-col">
        {/* Progress Indicator */}
        <div className="flex space-x-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-ios-blue' : 'bg-ios-gray-200'
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
              {currentStep === 0 ? (
                <div className="flex justify-center mb-6">
                  <RevadoLogo size="large" animated={true} />
                </div>
              ) : (
                <span className="text-6xl mb-4 block">{steps[currentStep].icon}</span>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {steps[currentStep].title}
              </h1>
              <p className="text-ios-gray-600 text-lg">
                {steps[currentStep].description}
              </p>
            </div>

            {steps[currentStep].action === 'insurance' && (
              <div className="space-y-3 mb-8">
                <button
                  onClick={() => handleInsuranceCapture('front')}
                  disabled={insuranceFrontCompleted}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors ${
                    insuranceFrontCompleted
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-white border-2 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      insuranceFrontCompleted ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <CreditCardIcon className={`w-6 h-6 ${
                        insuranceFrontCompleted ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="text-left">
                      <span className={`font-medium block ${
                        insuranceFrontCompleted ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        Front of Card
                      </span>
                      <span className="text-xs text-gray-500">
                        {insuranceFrontCompleted ? 'Captured successfully' : 'Tap to scan'}
                      </span>
                    </div>
                  </div>
                  {insuranceFrontCompleted ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <CameraIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={() => handleInsuranceCapture('back')}
                  disabled={insuranceBackCompleted}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors ${
                    insuranceBackCompleted
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-white border-2 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      insuranceBackCompleted ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <PhotoIcon className={`w-6 h-6 ${
                        insuranceBackCompleted ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="text-left">
                      <span className={`font-medium block ${
                        insuranceBackCompleted ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        Back of Card
                      </span>
                      <span className="text-xs text-gray-500">
                        {insuranceBackCompleted ? 'Captured successfully' : 'Tap to scan'}
                      </span>
                    </div>
                  </div>
                  {insuranceBackCompleted ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <CameraIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Preview of captured images */}
                {(insuranceImages.front || insuranceImages.back) && (
                  <div className="mt-4 flex gap-2">
                    {insuranceImages.front && (
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Front</p>
                        <img 
                          src={insuranceImages.front} 
                          alt="Insurance card front" 
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {insuranceImages.back && (
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Back</p>
                        <img 
                          src={insuranceImages.back} 
                          alt="Insurance card back" 
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-3 mt-4">
                  <p className="text-xs text-blue-700 flex items-start">
                    <ShieldCheckIcon className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    Your insurance information is encrypted and stored securely. We use it to verify coverage and connect with your provider network.
                  </p>
                </div>
              </div>
            )}

            {steps[currentStep].action === 'verify' && (
              <div className="space-y-3 mb-8">
                <button
                  onClick={handleSelfie}
                  disabled={selfieCompleted}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors ${
                    selfieCompleted
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-ios-gray-100 hover:bg-ios-gray-200:bg-ios-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CameraIcon className={`w-6 h-6 ${
                      selfieCompleted ? 'text-green-500' : 'text-ios-gray-600'
                    }`} />
                    <span className={`font-medium ${
                      selfieCompleted ? 'text-green-700' : 'text-gray-900'
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
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-ios-gray-100 hover:bg-ios-gray-200:bg-ios-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IdentificationIcon className={`w-6 h-6 ${
                      idCompleted ? 'text-green-500' : 'text-ios-gray-600'
                    }`} />
                    <span className={`font-medium ${
                      idCompleted ? 'text-green-700' : 'text-gray-900'
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

          {(steps[currentStep].action === 'verify' || steps[currentStep].action === 'insurance') && (
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