import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

function UploadSuccessAnimation({ show, message, subMessage, onComplete }) {
  useEffect(() => {
    if (show) {
      // Trigger confetti
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          onComplete && onComplete();
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B']
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm mx-4"
      >
        {/* Success Icon Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: 1,
            rotate: 0,
            transition: {
              type: "spring",
              stiffness: 260,
              damping: 20
            }
          }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center"
            >
              <CheckCircleIcon className="w-14 h-14 text-white" />
            </motion.div>

            {/* Sparkles around the icon */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0, 1],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 3,
                repeat: Infinity
              }}
              className="absolute -top-2 -right-2"
            >
              <SparklesIcon className="w-8 h-8 text-yellow-400" />
            </motion.div>

            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.5, 1],
                rotate: [0, -180, -360]
              }}
              transition={{
                duration: 3,
                delay: 0.5,
                repeat: Infinity
              }}
              className="absolute -bottom-2 -left-2"
            >
              <SparklesIcon className="w-6 h-6 text-blue-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Text Animation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {message || "Perfect! All Done"}
          </h3>
          <p className="text-gray-600">
            {subMessage || "Your document is safe and organized"}
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <div className="flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  backgroundColor: ['#10B981', '#3B82F6', '#10B981']
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.2,
                  repeat: Infinity
                }}
                className="w-2 h-2 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default UploadSuccessAnimation;
