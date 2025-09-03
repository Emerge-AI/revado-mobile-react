import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

function RecordingVisualizer({ audioLevel = 0, isRecording = false }) {
  const [waveformBars, setWaveformBars] = useState([]);

  // Generate animated bars based on audio level
  useEffect(() => {
    const generateBars = () => {
      const numBars = 32;
      const bars = [];
      
      for (let i = 0; i < numBars; i++) {
        // Create a wave pattern that responds to audio level
        const baseHeight = 0.2 + Math.sin(i * 0.2) * 0.1;
        const audioResponse = isRecording ? audioLevel * (0.5 + Math.random() * 0.5) : 0.1;
        const height = Math.min(1, baseHeight + audioResponse);
        
        bars.push({
          id: i,
          height: height,
          delay: i * 0.05,
          color: i < 8 ? 'bg-orange-400' : i < 16 ? 'bg-blue-400' : i < 24 ? 'bg-purple-400' : 'bg-green-400'
        });
      }
      
      setWaveformBars(bars);
    };

    generateBars();
    
    if (isRecording) {
      const interval = setInterval(generateBars, 100);
      return () => clearInterval(interval);
    }
  }, [audioLevel, isRecording]);

  return (
    <div className="relative">
      {/* Main Waveform */}
      <div className="flex items-center justify-center gap-1 h-20 bg-gradient-to-r from-blue-50 via-purple-50 to-orange-50 rounded-2xl p-4 border border-gray-100">
        {waveformBars.map((bar) => (
          <motion.div
            key={bar.id}
            className={`w-1.5 ${bar.color} rounded-full opacity-70`}
            initial={{ height: '20%' }}
            animate={{ 
              height: `${Math.max(20, bar.height * 100)}%`,
              scaleY: isRecording ? [1, 1.2, 0.8, 1] : 1,
            }}
            transition={{
              height: { duration: 0.1 },
              scaleY: { 
                duration: 0.5 + Math.random() * 0.5, 
                repeat: isRecording ? Infinity : 0,
                delay: bar.delay,
                ease: "easeInOut"
              }
            }}
          />
        ))}
      </div>

      {/* Audio Level Indicator */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <span className="text-xs text-gray-500 font-medium">
          {isRecording ? 'Listening' : 'Ready'}
        </span>
        
        {/* Volume Level Display */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <motion.div
              key={level}
              className={`w-1 h-3 rounded-full transition-colors duration-200 ${
                audioLevel * 5 >= level 
                  ? 'bg-green-500' 
                  : 'bg-gray-200'
              }`}
              animate={isRecording ? {
                backgroundColor: audioLevel * 5 >= level ? '#10b981' : '#e5e7eb'
              } : {}}
            />
          ))}
        </div>

        <span className="text-xs text-gray-500 font-medium">
          {Math.round(audioLevel * 100)}%
        </span>
      </div>

      {/* Ambient Animation */}
      {isRecording && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 20px rgba(249, 115, 22, 0.1)',
              '0 0 40px rgba(249, 115, 22, 0.2)',
              '0 0 20px rgba(249, 115, 22, 0.1)',
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Status Messages */}
      <div className="mt-3 text-center">
        <motion.p
          className="text-sm text-gray-600"
          animate={isRecording ? { 
            opacity: [0.6, 1, 0.6] 
          } : { 
            opacity: 0.6 
          }}
          transition={{
            duration: 1.5,
            repeat: isRecording ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          {isRecording 
            ? "Speak naturally - I'm listening to every word"
            : "Tap the microphone to start your conversation"
          }
        </motion.p>
        
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center justify-center gap-2"
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-orange-500"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-orange-600 font-medium">
              AI is listening
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default RecordingVisualizer;