import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavDirection } from '@/contexts/NavigationContext';

/**
 * Wraps page content with directional slide animations.
 * Uses CSS animation classes (page-enter-forward / page-enter-back).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { direction, setDirection } = useNavDirection();
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const animClass =
    direction === 'forward' ? 'page-enter-forward' :
    direction === 'back'    ? 'page-enter-back'    : '';

  useEffect(() => {
    if (!ref.current || !animClass) return;

    // Apply animation class
    ref.current.classList.add(animClass);

    const el = ref.current;
    const handleEnd = () => {
      el.classList.remove(animClass);
      setDirection('none');
    };

    el.addEventListener('animationend', handleEnd, { once: true });
    return () => el.removeEventListener('animationend', handleEnd);
  }, [location.pathname]); // Re-run on each route change

  return (
    <div ref={ref} style={{ height: '100%' }}>
      {children}
    </div>
  );
}
