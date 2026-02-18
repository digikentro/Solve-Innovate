import { useState, useEffect } from 'react';
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
            data.content = JSON.parse(data.content);
          } catch (e) {
            // Try without escaped quotes
            try {
              const cleanContent = data.content.replace(/\\n/g, '').replace(/\\"/g, '"');
              data.content = JSON.parse(cleanContent);
            } catch (e2) {
              // content is invalid JSON, leave as string
            }
          }
        }
        return data;
      }

      if (typeof data === 'string') {
        // Pre-clean: strip the "prompt" field which often contains unescaped inner quotes
        // from the webhook response (e.g. "prompt": "{...\"key\":\"value\"...}\"")
        // making the outer JSON invalid. Removing it lets content + generated_at parse fine.
        const stripped = data.replace(/,\s*"prompt"\s*:\s*"(?:[^"\\]|\\.)*"/g, '');

        const tryParse = (str: string) => {
          const parsed = JSON.parse(str);
          // Check if content needs additional parsing
          if (parsed && typeof parsed.content === 'string') {
            try {
              parsed.content = JSON.parse(parsed.content);
            } catch {
              try {
                const cleanContent = parsed.content.replace(/\\n/g, '').replace(/\\"/g, '"');
                parsed.content = JSON.parse(cleanContent);
              } catch { /* leave as string */ }
            }
          }
          return parsed;
        };

        // 1. Try stripped string first (removes broken prompt field)
        try {
          return tryParse(stripped);
        } catch { /* fall through */ }

        // 2. Try original string as-is
        try {
          return tryParse(data);
        } catch { /* fall through */ }

        // 3. Fallback: extract content + generated_at via regex
        try {
          const contentMatch =
            stripped.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"(generated_at|prompt)"/) ||
            data.match(/"content"\s*:\s*"([\s\S]*?)"\s*,\s*"(generated_at|prompt)"/);
          if (contentMatch && contentMatch[1]) {
            let contentStr = contentMatch[1]
              .replace(/\\n/g, '')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            const contentParsed = JSON.parse(contentStr);
            const generatedMatch = data.match(/"generated_at"\s*:\s*"([^"]+)"/);
            return {
              content: contentParsed,
              generated_at: generatedMatch ? generatedMatch[1] : null,
            };
          }
        } catch { /* regex extraction failed */ }

        return null;
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
          transformationResult = JSON.parse(ultraClean);
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
