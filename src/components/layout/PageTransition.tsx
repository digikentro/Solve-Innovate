import React from 'react';
import { useLocation } from 'react-router-dom';
import { useNavDirection } from '@/contexts/NavigationContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Wraps page content with directional slide animations using framer-motion.
 * This replaces the previous jittery CSS class approach.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { direction } = useNavDirection();
  const location = useLocation();

  const variants = {
    initial: (dir: string) => ({
      x: dir === 'forward' ? '20px' : dir === 'back' ? '-20px' : 0,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: (dir: string) => ({
      x: dir === 'forward' ? '-20px' : dir === 'back' ? '20px' : 0,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={location.pathname}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ height: '100%', width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
