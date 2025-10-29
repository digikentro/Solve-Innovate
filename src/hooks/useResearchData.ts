import { useState, useEffect } from 'react';
import type { Project } from '@/types/project';

interface ResearchDataState {
  asIsMapData: any | null;
  extremeUserData: any | null;
  deepEmpathyData: any | null;
  behavioralInsightsData: any | null;
  psychologicalAnalysisData: any | null;
  transformationFrameworkData: any | null;
  hmwFrameworkData: any | null;
  hmwIdeationData: any | null;
}

export const useResearchData = (project: Project | null) => {
  const [researchData, setResearchData] = useState<ResearchDataState>({
    asIsMapData: null,
    extremeUserData: null,
    deepEmpathyData: null,
    behavioralInsightsData: null,
    psychologicalAnalysisData: null,
    transformationFrameworkData: null,
    hmwFrameworkData: null,
    hmwIdeationData: null,
  });

  useEffect(() => {
    if (!project) return;

    const parseData = (data: any) => {
      if (!data) return null;
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      }
      return data;
    };

    // Check if data exists - either as direct value or nested in .content
    const extractData = (data: any) => {
      const parsed = parseData(data);
      if (!parsed) return null;
      
      // If data has a .content property, use that, otherwise use the data itself
      if (parsed.content !== undefined) {
        return parsed.content;
      }
      return parsed;
    };

    setResearchData({
      asIsMapData: extractData(project.as_is_map),
      extremeUserData: extractData(project.extreme_user_data),
      deepEmpathyData: extractData(project.deep_empathy_data),
      behavioralInsightsData: extractData(project.behavioral_insights_data),
      psychologicalAnalysisData: extractData(project.psychological_analysis),
      transformationFrameworkData: extractData(project.transformation_framework),
      hmwFrameworkData: extractData(project.Behaviour_Framework),
      hmwIdeationData: extractData(project.HMW_Ideation_Framework),
    });
  }, [project]);

  return {
    ...researchData,
    setAsIsMapData: (data: any) => setResearchData(prev => ({ ...prev, asIsMapData: data })),
    setExtremeUserData: (data: any) => setResearchData(prev => ({ ...prev, extremeUserData: data })),
    setDeepEmpathyData: (data: any) => setResearchData(prev => ({ ...prev, deepEmpathyData: data })),
    setBehavioralInsightsData: (data: any) => setResearchData(prev => ({ ...prev, behavioralInsightsData: data })),
    setPsychologicalAnalysisData: (data: any) => setResearchData(prev => ({ ...prev, psychologicalAnalysisData: data })),
    setTransformationFrameworkData: (data: any) => setResearchData(prev => ({ ...prev, transformationFrameworkData: data })),
    setHmwFrameworkData: (data: any) => setResearchData(prev => ({ ...prev, hmwFrameworkData: data })),
    setHmwIdeationData: (data: any) => setResearchData(prev => ({ ...prev, hmwIdeationData: data })),
  };
};
