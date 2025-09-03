import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon,
  XMarkIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

function HTTPSWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if we're on HTTP (not HTTPS)
    const isHTTP = window.location.protocol === 'http:';
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    // Show warning if on HTTP and not localhost, or if explicitly testing
    if (isHTTP && !isDismissed) {
      // Check if we're on a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Show warning on mobile or non-localhost HTTP
      if (isMobile || !isLocalhost) {
        setShowWarning(true);
      }
    }
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowWarning(false);
    // Remember dismissal for this session
    sessionStorage.setItem('httpsWarningDismissed', 'true');
  };

  useEffect(() => {
    // Check if warning was already dismissed this session
    if (sessionStorage.getItem('httpsWarningDismissed') === 'true') {
      setIsDismissed(true);
    }
  }, []);

  if (!showWarning) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 p-4 pt-safe-top"
      >
        <div className="max-w-lg mx-auto">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-800 mb-1">
                  Face ID Won't Work on HTTP
                </h3>
                <p className="text-xs text-orange-700 mb-3">
                  You're accessing this site over HTTP. Face ID and Touch ID require HTTPS to work.
                </p>
                
                <div className="space-y-2 text-xs text-orange-600">
                  <div className="flex items-start gap-2">
                    <LockClosedIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">For local testing:</p>
                      <p>Run <code className="bg-orange-100 px-1 rounded">./setup-https.sh</code> then access via <code className="bg-orange-100 px-1 rounded">https://localhost:5173</code></p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <LockClosedIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">For iPhone testing:</p>
                      <p>Use ngrok: <code className="bg-orange-100 px-1 rounded">ngrok http 5173</code></p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-orange-100:bg-orange-800/50 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-orange-600" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default HTTPSWarning;