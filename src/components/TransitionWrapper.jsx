import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    x: '100%',
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: '-20%',
  },
};

const pageTransition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
};

function TransitionWrapper({ children }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="absolute inset-0"
    >
      {children}
    </motion.div>
  );
}

export default TransitionWrapper;