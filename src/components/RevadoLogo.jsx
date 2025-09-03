import { BoltIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

function RevadoLogo({ size = 'default', showText = true, animated = false }) {
  // Size configurations
  const sizes = {
    small: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      title: 'text-lg',
      subtitle: 'text-[10px]',
      spacing: 'mr-2'
    },
    default: {
      container: 'w-10 h-10',
      icon: 'w-5 h-5',
      title: 'text-xl',
      subtitle: 'text-xs',
      spacing: 'mr-3'
    },
    large: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      title: 'text-2xl',
      subtitle: 'text-sm',
      spacing: 'mr-3'
    }
  };

  const currentSize = sizes[size] || sizes.default;

  const LogoIcon = animated ? motion.div : 'div';
  const LogoContainer = animated ? motion.a : 'a';

  return (
    <LogoContainer
      href="#"
      className="flex items-center"
      {...(animated && {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
        transition: { type: "spring", stiffness: 400, damping: 17 }
      })}
    >
      <LogoIcon
        className={`flex justify-center items-center ${currentSize.spacing} ${currentSize.container} text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg`}
        {...(animated && {
          animate: { rotate: [0, 12, 0] },
          transition: { duration: 2, repeat: Infinity, repeatDelay: 3 }
        })}
      >
        <BoltIcon className={`${currentSize.icon} transform rotate-12`} />
      </LogoIcon>
      {showText && (
        <div className="flex flex-col">
          <span className={`${currentSize.title} font-bold tracking-tight leading-none text-gray-900`}>
            Revado
          </span>
          <span className={`${currentSize.subtitle} font-semibold tracking-widest text-blue-600 uppercase`}>
            Health
          </span>
        </div>
      )}
    </LogoContainer>
  );
}

export default RevadoLogo;