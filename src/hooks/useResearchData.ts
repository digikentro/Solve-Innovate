import { useState, useEffect } from 'react';
import type { Project } from '@/types/project';

interface ResearchDataState {
  asIsMapData: any | null;
  extremeUserData: any | null;
  deepEmpathyData: any | null;
  psychologicalAnalysisData: any | null;
  transformationFrameworkData: any | null;
  hmwFrameworkData: any | null;
  hmwIdeationData: any | null;
  ideaClusteringData: any | null;
}

export const useResearchData = (project: Project | null) => {
  const [researchData, setResearchData] = useState<ResearchDataState>({
    asIsMapData: null,
    extremeUserData: null,
    deepEmpathyData: null,
    psychologicalAnalysisData: null,
    transformationFrameworkData: null,
    hmwFrameworkData: null,
    hmwIdeationData: null,
    ideaClusteringData: null,
  });

  useEffect(() => {
    if (!project) return;

    console.log('useResearchData - full project:', project);
    console.log('useResearchData - all project keys:', Object.keys(project));
    console.log('useResearchData - transformation_framework field specifically:', project.transformation_framework);
    
    // DIRECT TEST - Simple parsing of transformation framework
    console.log('=== DIRECT TRANSFORMATION TEST ===');
    const directTF = project.transformation_framework;
    if (directTF) {
      console.log('Direct TF exists, type:', typeof directTF);
      console.log('Direct TF first 100 chars:', typeof directTF === 'string' ? directTF.substring(0, 100) : directTF);
      
      if (typeof directTF === 'string') {
        try {
          const directParsed = JSON.parse(directTF);
          console.log('Direct parsing SUCCESS, keys:', Object.keys(directParsed));
          console.log('Direct parsing content exists:', !!directParsed.content);
          if (directParsed.content) {
            console.log('Direct content keys:', Object.keys(directParsed.content));
          }
        } catch (e) {
          console.error('Direct parsing FAILED:', e);
        }
      }
    } else {
      console.log('Direct TF is null/undefined');
    }
    console.log('=== END DIRECT TEST ===');

    const parseData = (data: any) => {
      if (!data) return null;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          console.log('parseData - successfully parsed string to:', parsed);
          return parsed;
        } catch (e) {
          console.log('parseData - failed to parse string:', data, e);
          return null;
        }
      }
      return data;
    };

    // Check if data exists - either as direct value or nested in .content
    const extractData = (data: any, type?: string) => {
      console.log(`extractData for ${type}:`, { raw: data, type: typeof data });
      
      const parsed = parseData(data);
      if (!parsed || (typeof parsed === 'object' && Object.keys(parsed).length === 0)) {
        console.log(`extractData for ${type}: no parsed data`);
        return null;
      }
      
      // Standard logic for all types
      let result = parsed.content !== undefined ? parsed.content : parsed;
      
      if (type === 'transformation') {
        console.log(`extractData for ${type}: using standard extraction, result:`, result);
      }
      
      console.log(`extractData for ${type}: final extracted result:`, result);
      
      // For psychological analysis, only return if valid report structure exists and not just placeholder/empty data
      if (type === 'psychological') {
        if (!result || typeof result !== 'object') return null;
        // Check if comprehensiveMetaAnalysis exists and is all blank/zero
        let meta = result.comprehensiveMetaAnalysis;
        let clusters = result.clusters;
        let criticalRequirements = result.criticalRequirements;
        const metaIsEmpty = !meta || Object.values(meta).every(v => v === '' || v === 0 || v == null || (Array.isArray(v) && v.length === 0));
        const clustersIsEmpty = !clusters || clusters.length === 0;
        const criticalReqsIsEmpty = !criticalRequirements || (Array.isArray(criticalRequirements) && criticalRequirements.length === 0);
        // If all are empty, treat as no data
        if (metaIsEmpty && clustersIsEmpty && criticalReqsIsEmpty) return null;
      }

      // For transformation framework, be extremely lenient with validation
      if (type === 'transformation') {
        console.log('Transformation validation - input result:', result);
        
        // Allow almost anything that's not null/undefined
        if (result === null || result === undefined) {
          console.log('Transformation validation - rejected: null/undefined');
          return null;
        }
        
        // Always accept any non-null/undefined data for transformation framework
        console.log('Transformation validation - accepted:', result);
        return result;
      }

      return result;
    };



    setResearchData({
      asIsMapData: extractData(project.as_is_map),
      extremeUserData: extractData(project.extreme_user_data),
      deepEmpathyData: extractData(project.deep_empathy_data),
      psychologicalAnalysisData: extractData(project.psychological_analysis, 'psychological'),
      transformationFrameworkData: extractData(project.transformation_framework, 'transformation'),
      hmwFrameworkData: extractData(project.Behaviour_Framework),
      hmwIdeationData: extractData(project.HMW_Ideation_Framework),
      ideaClusteringData: extractData(project.Idea_Clustering_and_Idea_Cards),
    });
  }, [project]);

  return {
    ...researchData,
    setAsIsMapData: (data: any) => setResearchData(prev => ({ ...prev, asIsMapData: data })),
    setExtremeUserData: (data: any) => setResearchData(prev => ({ ...prev, extremeUserData: data })),
    setDeepEmpathyData: (data: any) => setResearchData(prev => ({ ...prev, deepEmpathyData: data })),
    setPsychologicalAnalysisData: (data: any) => setResearchData(prev => ({ ...prev, psychologicalAnalysisData: data })),
    setTransformationFrameworkData: (data: any) => setResearchData(prev => ({ ...prev, transformationFrameworkData: data })),
    setHmwFrameworkData: (data: any) => setResearchData(prev => ({ ...prev, hmwFrameworkData: data })),
    setHmwIdeationData: (data: any) => setResearchData(prev => ({ ...prev, hmwIdeationData: data })),
    setIdeaClusteringData: (data: any) => setResearchData(prev => ({ ...prev, ideaClusteringData: data })),
  };
};
