import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';

function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [, setVisits] = useState(0);

  useEffect(() => {
    // Track visits
    const visitCount = parseInt(localStorage.getItem('visitCount') || '0') + 1;
    localStorage.setItem('visitCount', visitCount.toString());
    setVisits(visitCount);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show after second visit
      if (visitCount >= 2 && !localStorage.getItem('pwaPromptDismissed')) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 max-w-[568px] mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Install Revado Health
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Add to your home screen for the best experience
              </p>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                >
                  Install App
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-100 text-gray-900 py-2 px-4 rounded-lg font-medium text-sm hover:bg-gray-200:bg-gray-600 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PWAInstallPrompt;