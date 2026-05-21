import React, { createContext, useContext, useState, ReactNode } from 'react';

type NavDirection = 'forward' | 'back' | 'none';

interface NavigationContextType {
  direction: NavDirection;
  setDirection: (d: NavDirection) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [direction, setDirection] = useState<NavDirection>('none');
  return (
    <NavigationContext.Provider value={{ direction, setDirection }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavDirection() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavDirection must be used within NavigationProvider');
  return ctx;
}
