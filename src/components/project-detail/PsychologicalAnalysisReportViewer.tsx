import { useState } from 'react';

interface PsychologicalAnalysisReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
}

export const PsychologicalAnalysisReportViewer = ({ data, onGenerateNew }: PsychologicalAnalysisReportViewerProps) => {
  const reportData = data?.content || data;
  const [expandedClusters, setExpandedClusters] = useState<{[key: number]: boolean}>({});

  const toggleCluster = (idx: number) => {
    setExpandedClusters(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-8">
      {/* Header with Generate New Button */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Psychological Analysis Report</h1>
        {onGenerateNew && (
          <button
            onClick={onGenerateNew}
            className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Generate New
          </button>
        )}
      </div>

      {/* Comprehensive Meta Analysis */}
      {reportData.comprehensiveMetaAnalysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Comprehensive Meta Analysis</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Total Clusters Identified</h3>
              <p className="text-base pl-4">{reportData.comprehensiveMetaAnalysis.totalClustersIdentified}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Behavioral Pattern Themes</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                {reportData.comprehensiveMetaAnalysis.behavioralPatternThemes?.map((theme: string, idx: number) => (
                  <li key={idx} className="text-sm">{theme}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Human Psychology Insights</h3>
              <p className="text-base pl-4 leading-relaxed">{reportData.comprehensiveMetaAnalysis.humanPsychologyInsights}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Cognitive Bias Patterns</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                {reportData.comprehensiveMetaAnalysis.cognitiveBiasPatterns?.map((bias: string, idx: number) => (
                  <li key={idx} className="text-sm">{bias}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Emotional Driver Analysis</h3>
              <p className="text-base pl-4 leading-relaxed">{reportData.comprehensiveMetaAnalysis.emotionalDriverAnalysis}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">System Level Implications</h3>
              <p className="text-base pl-4 leading-relaxed">{reportData.comprehensiveMetaAnalysis.systemLevelImplications}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Innovation Opportunity Spaces</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                {reportData.comprehensiveMetaAnalysis.innovationOpportunitySpaces?.map((op: string, idx: number) => (
                  <li key={idx} className="text-sm">{op}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Behavioral Clusters */}
      {reportData.clusters && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold mb-4 pb-2">Behavioral Clusters Analysis</h2>
          {reportData.clusters.map((cluster: any, idx: number) => (
            <div key={idx} className="bg-gray-50 p-6 rounded-xl">
              <button
                onClick={() => toggleCluster(idx)}
                className="w-full text-left mb-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Cluster {idx + 1}: {cluster.irrationalBehavior?.slice(0, 40) || 'Behavior Cluster'}</h3>
                  <span className="text-2xl">{expandedClusters[idx] ? '−' : '+'}</span>
                </div>
              </button>
              {expandedClusters[idx] && (
                <div className="space-y-4 pl-4">
                  <div>
                    <h4 className="font-bold mb-1">Irrational Behavior</h4>
                    <p className="text-base">{cluster.irrationalBehavior}</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Rational Counterpart</h4>
                    <p className="text-base">{cluster.rationalCounterpart}</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Raw Evidence from Student Data</h4>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      {cluster.rawEvidenceFromStudentData?.map((ev: string, i: number) => (
                        <li key={i} className="text-sm">{ev}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Peculiarity Revealed</h4>
                    <p className="text-base">{cluster.peculiarityRevealed}</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Psychological Analysis</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <span className="font-semibold">Cognitive Biases:</span>
                        <p className="text-sm pl-2">{cluster.psychologicalAnalysis?.cognitiveBiases}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Emotional Drivers:</span>
                        <p className="text-sm pl-2">{cluster.psychologicalAnalysis?.emotionalDrivers}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Psychological Needs:</span>
                        <p className="text-sm pl-2">{cluster.psychologicalAnalysis?.psychologicalNeeds}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Why It Persists:</span>
                        <p className="text-sm pl-2">{cluster.psychologicalAnalysis?.whyItPersists}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Behavioral Science Explanation</h4>
                    <p className="text-base">{cluster.behavioralScienceExplanation}</p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Innovation Insight</h4>
                    <p className="text-base">{cluster.innovationInsight}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Critical Requirements */}
      {reportData.criticalRequirements && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Critical Requirements</h2>
          <ul className="list-decimal list-inside space-y-1 pl-4">
            {reportData.criticalRequirements.map((req: string, idx: number) => (
              <li key={idx} className="text-sm">{req}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Fallback: Show all raw data if structure doesn't match expected format */}
      {(!reportData.clusters && !reportData.comprehensiveMetaAnalysis && !reportData.criticalRequirements) && (
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
