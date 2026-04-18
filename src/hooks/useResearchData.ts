import { useState, useEffect } from 'react';
import { relaxedJsonParse } from '@/utils/jsonUtils';
import type { Project } from '@/types/project';

interface ResearchDataState {
  asIsMapData: any | null;
  extremeUserData: any | null;
  deepEmpathyData: any | null;
  psychologicalAnalysisData: any | null;
  hmwFrameworkData: any | null;
  hmwIdeationData: any | null;
  ideaClusteringData: any | null;
  transformationFrameworkData: any | null;
  testingData: any | null;
  marketSearchData: any | null;
}

export const useResearchData = (project: Project | null) => {
  const [researchData, setResearchData] = useState<ResearchDataState>({
    asIsMapData: null,
    extremeUserData: null,
    deepEmpathyData: null,
    psychologicalAnalysisData: null,
    hmwFrameworkData: null,
    hmwIdeationData: null,
    ideaClusteringData: null,
    transformationFrameworkData: null,
    testingData: null,
    marketSearchData: null,
  });

  useEffect(() => {
    if (!project) return;

    const parseData = (data: any) => {
      if (!data) return null;

      // If it's already an object, return it directly
      if (typeof data === 'object' && data !== null) {
        // Check if content is a string that needs parsing
        if (typeof data.content === 'string') {
          try {
            data.content = relaxedJsonParse(data.content);
          } catch (e) {
            // content is invalid JSON, leave as string
          }
        }
        return data;
      }

      if (typeof data === 'string') {
        const parsed = relaxedJsonParse(data);
        if (parsed && typeof parsed.content === 'string') {
          try {
            parsed.content = relaxedJsonParse(parsed.content);
          } catch { /* leave as string */ }
        }
        return parsed;
      }

      return data;
    };

    // Check if data exists - either as direct value or nested in .content
    const extractData = (data: any, type?: string) => {
      const parsed = parseData(data);
      if (!parsed || (typeof parsed === 'object' && Object.keys(parsed).length === 0)) {
        return null;
      }

      // Standard logic for all types
      let result = parsed.content !== undefined ? parsed.content : parsed;

      // For psychological analysis, only return if valid report structure exists
      if (type === 'psychological') {
        if (!result || typeof result !== 'object') return null;
        let meta = result.comprehensiveMetaAnalysis;
        let clusters = result.clusters;
        let criticalRequirements = result.criticalRequirements;
        const metaIsEmpty = !meta || Object.values(meta).every(v => v === '' || v === 0 || v == null || (Array.isArray(v) && v.length === 0));
        const clustersIsEmpty = !clusters || clusters.length === 0;
        const criticalReqsIsEmpty = !criticalRequirements || (Array.isArray(criticalRequirements) && criticalRequirements.length === 0);
        if (metaIsEmpty && clustersIsEmpty && criticalReqsIsEmpty) return null;
      }

      // For transformation framework, be lenient with validation
      if (type === 'transformation') {
        if (result === null || result === undefined) return null;
        if (typeof result === 'object' && Object.keys(result).length === 0) return null;
        if (typeof result === 'string' && result.trim().length === 0) return null;
        return result;
      }

      return result;
    };

    let transformationResult = extractData(project.transformation_framework, 'transformation');

    // FALLBACK: If extraction failed but raw data exists, try to use raw data directly
    if (!transformationResult && project.transformation_framework) {
      const rawTF = project.transformation_framework;
      if (typeof rawTF === 'object' && rawTF !== null) {
        transformationResult = rawTF;
      } else if (typeof rawTF === 'string') {
        try {
          const ultraClean = rawTF
            .replace(/\\n/g, '')
            .replace(/\\r/g, '')
            .replace(/\n/g, '')
            .replace(/\r/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          transformationResult = relaxedJsonParse(ultraClean);
        } catch (e) {
          // Parse failed
        }
      }
    }

    setResearchData({
      asIsMapData: extractData(project.as_is_map),
      extremeUserData: extractData(project.extreme_user_data),
      deepEmpathyData: extractData(project.deep_empathy_data),
      psychologicalAnalysisData: extractData(project.psychological_analysis, 'psychological'),
      hmwFrameworkData: extractData(project.Behaviour_Framework),
      hmwIdeationData: extractData(project.HMW_Ideation_Framework),
      ideaClusteringData: extractData(project.Idea_Clustering_and_Idea_Cards),
      transformationFrameworkData: extractData(project.transformation_framework),
      testingData: extractData(project.testing),
      marketSearchData: extractData(project.market_research),
    });
  }, [project]);

  return {
    ...researchData,
    setAsIsMapData: (data: any) => setResearchData(prev => ({ ...prev, asIsMapData: data })),
    setExtremeUserData: (data: any) => setResearchData(prev => ({ ...prev, extremeUserData: data })),
    setDeepEmpathyData: (data: any) => setResearchData(prev => ({ ...prev, deepEmpathyData: data })),
    setPsychologicalAnalysisData: (data: any) => setResearchData(prev => ({ ...prev, psychologicalAnalysisData: data })),
    setHmwFrameworkData: (data: any) => setResearchData(prev => ({ ...prev, hmwFrameworkData: data })),
    setHmwIdeationData: (data: any) => setResearchData(prev => ({ ...prev, hmwIdeationData: data })),
    setIdeaClusteringData: (data: any) => setResearchData(prev => ({ ...prev, ideaClusteringData: data })),
    setTransformationFrameworkData: (data: any) => setResearchData(prev => ({ ...prev, transformationFrameworkData: data })),
    setTestingData: (data: any) => setResearchData(prev => ({ ...prev, testingData: data })),
    setMarketSearchData: (data: any) => setResearchData(prev => ({ ...prev, marketSearchData: data })),
  };
};
