import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WorkspaceContextType {
  topBarTitle: string;
  setTopBarTitle: (title: string) => void;
  activeProjectScore: number | null;
  setActiveProjectScore: (score: number | null) => void;
  activeProjectAssessment: any | null;
  setActiveProjectAssessment: (assessment: any | null) => void;
  showPlasma: boolean;
  setShowPlasma: (show: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [topBarTitle, setTopBarTitle] = useState('New Project');
  const [activeProjectScore, setActiveProjectScore] = useState<number | null>(null);
  const [activeProjectAssessment, setActiveProjectAssessment] = useState<any | null>(null);
  const [showPlasma, setShowPlasma] = useState(false);

  return (
    <WorkspaceContext.Provider value={{ 
      topBarTitle, setTopBarTitle,
      activeProjectScore, setActiveProjectScore,
      activeProjectAssessment, setActiveProjectAssessment,
      showPlasma, setShowPlasma
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
