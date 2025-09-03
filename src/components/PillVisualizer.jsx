import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

function PillVisualizer({ 
  pillType = 'tablet', 
  color = '#ffffff', 
  shape = 'round', 
  size = 'medium',
  className = '',
  animate = true 
}) {
  // Size variants
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10', 
    large: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  // Get appropriate sizing
  const pillSize = sizeClasses[size] || sizeClasses.medium;

  // Generate lighter/darker shades for 3D effect
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const rgb = hexToRgb(color);
  const lightColor = `rgb(${Math.min(255, rgb.r + 30)}, ${Math.min(255, rgb.g + 30)}, ${Math.min(255, rgb.b + 30)})`;
  const darkColor = `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`;
  const shadowColor = `rgb(${Math.max(0, rgb.r - 60)}, ${Math.max(0, rgb.g - 60)}, ${Math.max(0, rgb.b - 60)})`;

  // Tablet rendering
  const renderTablet = () => {
    const tabletShape = shape === 'round' ? 'rounded-full' : shape === 'oval' ? 'rounded-full' : 'rounded-lg';
    const aspectRatio = shape === 'oval' ? 'aspect-[1.5/1]' : 'aspect-square';
    
    return (
      <div 
        className={`${pillSize} ${aspectRatio} ${tabletShape} relative overflow-hidden ${className}`}
        style={{
          background: `linear-gradient(145deg, ${lightColor} 0%, ${color} 50%, ${darkColor} 100%)`,
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.6),
            inset 0 -1px 0 rgba(0,0,0,0.2),
            0 2px 4px rgba(0,0,0,0.1),
            0 1px 2px ${shadowColor}40
          `,
          border: `1px solid ${darkColor}30`
        }}
      >
        {/* Tablet scoring line for round/square tablets */}
        {(shape === 'round' || shape === 'square') && (
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-0.5"
            style={{ 
              background: `linear-gradient(90deg, transparent 10%, ${darkColor}60 50%, transparent 90%)`,
              opacity: 0.4
            }}
          />
        )}
        
        {/* Shine effect */}
        <div 
          className="absolute inset-0 rounded-inherit"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.2) 100%)`
          }}
        />
      </div>
    );
  };

  // Capsule rendering  
  const renderCapsule = () => {
    return (
      <div className={`${pillSize} aspect-[2/1] relative overflow-hidden rounded-full ${className}`}>
        {/* Capsule body */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(145deg, ${lightColor} 0%, ${color} 50%, ${darkColor} 100%)`,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.4),
              inset 0 -1px 0 rgba(0,0,0,0.2),
              0 2px 4px rgba(0,0,0,0.1),
              0 1px 2px ${shadowColor}40
            `,
            border: `1px solid ${darkColor}20`
          }}
        />
        
        {/* Capsule separation line */}
        <div 
          className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-0.5"
          style={{ 
            background: `linear-gradient(to bottom, transparent 10%, ${darkColor}50 50%, transparent 90%)`,
            opacity: 0.6
          }}
        />
        
        {/* Capsule highlight */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 100%)`
          }}
        />
      </div>
    );
  };

  // Liquid bottle rendering
  const renderLiquid = () => {
    return (
      <div className={`${pillSize} aspect-[1/1.5] relative overflow-hidden rounded-t-lg rounded-b-2xl ${className}`}>
        {/* Bottle body */}
        <div 
          className="absolute inset-0 rounded-t-lg rounded-b-2xl"
          style={{
            background: `linear-gradient(145deg, ${lightColor}90 0%, ${color}90 50%, ${darkColor}90 100%)`,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.3),
              inset 0 -1px 0 rgba(0,0,0,0.1),
              0 2px 4px rgba(0,0,0,0.1),
              0 1px 2px ${shadowColor}30
            `,
            border: `1px solid ${darkColor}20`
          }}
        />
        
        {/* Bottle cap */}
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1/4 rounded-t-lg"
          style={{
            background: `linear-gradient(145deg, #e5e5e5 0%, #d0d0d0 50%, #b0b0b0 100%)`,
            boxShadow: `0 1px 2px rgba(0,0,0,0.2)`
          }}
        />
        
        {/* Liquid level */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-3/4 rounded-b-2xl"
          style={{
            background: `linear-gradient(to top, ${color} 0%, ${color}80 100%)`,
            opacity: 0.8
          }}
        />
        
        {/* Bottle highlight */}
        <div 
          className="absolute inset-0 rounded-t-lg rounded-b-2xl"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.1) 100%)`
          }}
        />
      </div>
    );
  };

  // Animation wrapper
  const AnimationWrapper = ({ children }) => {
    if (!animate) return children;
    
    return (
      <motion.div
        whileHover={{ 
          scale: 1.05,
          y: -2,
          filter: 'brightness(1.1)'
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20 
        }}
        className="cursor-pointer"
      >
        {children}
      </motion.div>
    );
  };

  // Render appropriate pill type
  const renderPill = () => {
    switch (pillType) {
      case 'capsule':
        return renderCapsule();
      case 'liquid':
        return renderLiquid();
      case 'injection':
        return (
          <div className={`${pillSize} aspect-[1/4] rounded-full bg-gray-300 ${className}`}>
            <div className="w-full h-full rounded-full bg-gradient-to-b from-gray-100 to-gray-400" />
          </div>
        );
      case 'tablet':
      default:
        return renderTablet();
    }
  };

  return (
    <AnimationWrapper>
      {renderPill()}
    </AnimationWrapper>
  );
}

PillVisualizer.propTypes = {
  pillType: PropTypes.oneOf(['tablet', 'capsule', 'liquid', 'injection']),
  color: PropTypes.string,
  shape: PropTypes.oneOf(['round', 'oval', 'square', 'capsule']),
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xl']),
  className: PropTypes.string,
  animate: PropTypes.bool
};

export default PillVisualizer;