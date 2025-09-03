import { motion } from 'framer-motion';

function TimelineConnector({ 
  isFirst = false, 
  isLast = false, 
  eventType = 'upload',
  isActive = false,
  position = 'left' // 'left', 'right', 'center'
}) {
  // Get colors based on event type
  const getColors = () => {
    switch (eventType) {
      case 'share':
        return {
          dot: isActive ? 'bg-purple-500' : 'bg-purple-300',
          dotRing: 'ring-purple-200',
          line: 'bg-purple-200'
        };
      case 'upload':
        return {
          dot: isActive ? 'bg-blue-500' : 'bg-blue-300',
          dotRing: 'ring-blue-200',
          line: 'bg-blue-200'
        };
      default:
        return {
          dot: isActive ? 'bg-gray-500' : 'bg-gray-300',
          dotRing: 'ring-gray-200',
          line: 'bg-gray-200'
        };
    }
  };

  const colors = getColors();
  
  return (
    <div className={`relative flex ${position === 'center' ? 'justify-center' : position === 'right' ? 'justify-end' : 'justify-start'}`}>
      {/* Connecting Line */}
      <div className="relative flex flex-col items-center">
        {/* Top Line */}
        {!isFirst && (
          <motion.div
            initial={{ scaleY: 0, originY: 1 }}
            animate={{ scaleY: 1 }}
            transition={{ 
              duration: 0.5,
              delay: 0.2,
              ease: "easeOut"
            }}
            className={`w-0.5 h-6 ${colors.line}`}
          />
        )}
        
        {/* Timeline Dot */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.3
          }}
          whileHover={{ scale: 1.2 }}
          className={`relative z-10 w-4 h-4 rounded-full ${colors.dot} ring-4 ${colors.dotRing} ${
            isActive ? 'shadow-lg' : ''
          } transition-all duration-300`}
        >
          {/* Pulse animation for active dot */}
          {isActive && (
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 0, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 rounded-full ${colors.dot}`}
            />
          )}
        </motion.div>
        
        {/* Bottom Line */}
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0, originY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ 
              duration: 0.5,
              delay: 0.4,
              ease: "easeOut"
            }}
            className={`w-0.5 flex-1 min-h-6 ${colors.line}`}
          />
        )}
      </div>
    </div>
  );
}

export default TimelineConnector;