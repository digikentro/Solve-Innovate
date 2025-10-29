import { useState } from 'react';

interface TransformationFrameworkReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
}

export const TransformationFrameworkReportViewer = ({ data, onGenerateNew }: TransformationFrameworkReportViewerProps) => {
  const reportData = data?.content || data;
  const [expandedClusters, setExpandedClusters] = useState<{[key: number]: boolean}>({});

  const toggleCluster = (idx: number) => {
    setExpandedClusters(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const formatValue = (v: any) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string' && v.trim().toLowerCase() === 'undefined') return '—';
    return v;
  };

  return (
    <div className="space-y-8">
      {/* Header with Generate New Button */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transformation Framework Report</h1>
        {onGenerateNew && (
          <button
            onClick={onGenerateNew}
            className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Generate New
          </button>
        )}
      </div>

      {/* Project Context */}
      {reportData.projectContext && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Project Context</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Prioritized Pain Point</h3>
              <p className="text-base pl-2">{formatValue(reportData.projectContext.prioritizedPainPoint)}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Target User Type</h3>
              <p className="text-base pl-2">{formatValue(reportData.projectContext.targetUserType)}</p>
            </div>
          </div>
        </section>
      )}

      {/* Outcome Integration Analysis */}
      {reportData.outcomeIntegrationAnalysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Outcome Integration Analysis</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Psychological Pattern Themes</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                {reportData.outcomeIntegrationAnalysis.psychologicalPatternThemes?.map((t: string, i: number) => (
                  <li key={i} className="text-sm">{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Innovation Opportunity Spaces</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                {reportData.outcomeIntegrationAnalysis.innovationOpportunitySpaces?.map((s: string, i: number) => (
                  <li key={i} className="text-sm">{s}</li>
                ))}
              </ul>
            </div>
          </div>
          {reportData.outcomeIntegrationAnalysis.painPointSolutionCoherence && (
            <div className="mt-8">
              <h3 className="font-semibold mb-2">Pain-Point ⇄ Solution Coherence</h3>
              <p className="text-base pl-2">{reportData.outcomeIntegrationAnalysis.painPointSolutionCoherence}</p>
            </div>
          )}
          {reportData.outcomeIntegrationAnalysis.implementationPrioritySuggestions && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Implementation Priority Suggestions</h3>
              <p className="text-base pl-2">{reportData.outcomeIntegrationAnalysis.implementationPrioritySuggestions}</p>
            </div>
          )}
        </section>
      )}

      {/* Irrationality Clusters */}
      {Array.isArray(reportData.irrationalityClusters) && reportData.irrationalityClusters.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold mb-4 pb-2">Irrationality Clusters</h2>
          {reportData.irrationalityClusters.map((cluster: any, idx: number) => (
            <div key={idx} className="bg-gray-50 p-6 rounded-xl">
              <button
                onClick={() => toggleCluster(idx)}
                className="w-full text-left mb-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Cluster {idx + 1}: {cluster.irrationality?.slice(0, 40) || 'Irrationality Cluster'}</h3>
                  <span className="text-2xl">{expandedClusters[idx] ? '−' : '+'}</span>
                </div>
              </button>
              {expandedClusters[idx] && (
                <div className="space-y-4 pl-4">
                  {cluster.irrationality && (
                    <div>
                      <h4 className="font-bold mb-1">Irrationality</h4>
                      <p className="text-base">{formatValue(cluster.irrationality)}</p>
                    </div>
                  )}
                  {Array.isArray(cluster.diagnosis) && cluster.diagnosis.length > 0 && (
                    <div>
                      <h4 className="font-bold mb-1">Diagnosis</h4>
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        {cluster.diagnosis.map((d: string, dIdx: number) => (
                          <li key={dIdx} className="text-sm">{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cluster.psychologicalNeedAnalysis && (
                    <div>
                      <h4 className="font-bold mb-1">Psychological Need Analysis</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <span className="font-semibold">Core Need:</span>
                          <p className="text-sm pl-2">{formatValue(cluster.psychologicalNeedAnalysis.coreNeed)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Bias-driven Motivation:</span>
                          <p className="text-sm pl-2">{formatValue(cluster.psychologicalNeedAnalysis.biasDrivenMotivation)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Persistence Factor:</span>
                          <p className="text-sm pl-2">{formatValue(cluster.psychologicalNeedAnalysis.persistenceFactor)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Pain Point Connection:</span>
                          <p className="text-sm pl-2">{formatValue(cluster.psychologicalNeedAnalysis.painPointConnection)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {cluster.outcome && (
                    <div>
                      <h4 className="font-bold mb-1">Outcome</h4>
                      <p className="text-base">{formatValue(cluster.outcome)}</p>
                    </div>
                  )}
                  {cluster.outcomeValidation && (
                    <div>
                      <h4 className="font-bold mb-1">Outcome Validation</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <span className="font-semibold">Smart Psychology Use:</span>
                          <p className="text-sm pl-2">{formatValue(cluster.outcomeValidation.smartPsychologyUse)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Pain Point Alignment:</span>
                          <p className="text-sm pl-2">{formatValue(cluster.outcomeValidation.painPointAlignment)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Specificity Level:</span>
                          <p className="text-sm pl-2">{formatValue(cluster.outcomeValidation.specificityLevel)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Direction Focus:</span>
                          <p className="text-sm pl-2">{formatValue(cluster.outcomeValidation.directionFocus)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Fallback: Show all raw data if structure doesn't match expected format */}
      {!reportData.projectContext && !reportData.outcomeIntegrationAnalysis && !(Array.isArray(reportData.irrationalityClusters) && reportData.irrationalityClusters.length > 0) && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Raw Data Structure</h2>
          <pre className="text-sm text-gray-700 overflow-auto max-h-96 font-mono">
            {JSON.stringify(reportData, null, 2)}
          </pre>
        </section>
      )}

      {/* Report Metadata */}
      {data.generated_at && (
        <div className="text-sm text-gray-500 text-center pt-4">
          Report generated on {new Date(data.generated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
};
