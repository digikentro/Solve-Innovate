import React from 'react';

interface TransformationFrameworkReportViewerProps {
  data: any;
  onGenerateNew: () => void;
}

export const TransformationFrameworkReportViewer: React.FC<TransformationFrameworkReportViewerProps> = ({ data, onGenerateNew }) => {
  
  let reportData = data;
  
  // Try multiple extraction methods
  if (data?.content) {
    reportData = data.content;
  } else if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      reportData = parsed.content || parsed;
    } catch (e) {
      reportData = data;
    }
  }

  const renderDataValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No transformation framework data available</p>
        <button
          onClick={onGenerateNew}
          className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Generate New Framework
        </button>
      </div>
    );
  }

  // Handle string data
  if (typeof reportData === 'string') {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-xl border">
          <pre className="whitespace-pre-wrap text-sm text-gray-700">{reportData}</pre>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onGenerateNew}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Generate New Framework
          </button>
        </div>
      </div>
    );
  }

  // Handle object data - expected structure from the API response
  return (
    <div className="space-y-8">
      {/* Project Context */}
      {reportData.projectContext && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2">
            🎯 Project Context
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold text-gray-700">Pain Point:</span>
              <p className="text-gray-600 mt-1">{renderDataValue(reportData.projectContext.prioritizedPainPoint)}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Target User:</span>
              <p className="text-gray-600 mt-1">{renderDataValue(reportData.projectContext.targetUserType)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Irrationality Clusters */}
      {reportData.irrationalityClusters && Array.isArray(reportData.irrationalityClusters) && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
            🧠 Behavioral Transformation Clusters
          </h3>
          <div className="space-y-6">
            {reportData.irrationalityClusters.map((cluster: any, index: number) => (
              <div key={index} className="border-l-4 border-purple-200 pl-6 bg-purple-50 p-4 rounded-r-lg">
                <div className="mb-4">
                  <h4 className="font-bold text-purple-900 text-lg mb-2">
                    Irrationality #{index + 1}
                  </h4>
                  <p className="text-purple-800 italic bg-white p-3 rounded border">
                    "{renderDataValue(cluster.irrationality)}"
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-purple-700 mb-2">🧩 Psychological Diagnosis</h5>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(cluster.diagnosis) ? cluster.diagnosis.map((diag: any, idx: number) => (
                          <span key={idx} className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm">
                            {renderDataValue(diag)}
                          </span>
                        )) : (
                          <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm">
                            {renderDataValue(cluster.diagnosis)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-purple-700 mb-2">💡 Core Need Analysis</h5>
                      <div className="bg-white p-3 rounded border space-y-2">
                        <div>
                          <span className="font-medium text-gray-700">Core Need:</span>
                          <p className="text-gray-600 text-sm mt-1">{renderDataValue(cluster.psychologicalNeedAnalysis?.coreNeed)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Motivation:</span>
                          <p className="text-gray-600 text-sm mt-1">{renderDataValue(cluster.psychologicalNeedAnalysis?.biasDrivenMotivation)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Persistence Factor:</span>
                          <p className="text-gray-600 text-sm mt-1">{renderDataValue(cluster.psychologicalNeedAnalysis?.persistenceFactor)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-emerald-700 mb-2">🎯 Desired Outcome</h5>
                      <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
                        <p className="text-emerald-800 font-medium">{renderDataValue(cluster.outcome)}</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-semibold text-blue-700 mb-2">✅ Outcome Validation</h5>
                      <div className="bg-blue-50 p-3 rounded border border-blue-200 space-y-2">
                        <div>
                          <span className="font-medium text-blue-800">Psychology Use:</span>
                          <p className="text-blue-700 text-sm mt-1">{renderDataValue(cluster.outcomeValidation?.smartPsychologyUse)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Pain Point Alignment:</span>
                          <p className="text-blue-700 text-sm mt-1">{renderDataValue(cluster.outcomeValidation?.painPointAlignment)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outcome Integration Analysis */}
      {reportData.outcomeIntegrationAnalysis && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
            🔄 Integration Analysis
          </h3>
          
          <div className="space-y-6">
            {/* Psychological Pattern Themes */}
            {reportData.outcomeIntegrationAnalysis.psychologicalPatternThemes && (
              <div>
                <h4 className="font-semibold text-indigo-700 mb-3">🧠 Psychological Patterns</h4>
                <div className="grid gap-3">
                  {Array.isArray(reportData.outcomeIntegrationAnalysis.psychologicalPatternThemes) ? 
                    reportData.outcomeIntegrationAnalysis.psychologicalPatternThemes.map((theme: any, index: number) => (
                      <div key={index} className="bg-indigo-50 p-3 rounded border border-indigo-200">
                        <p className="text-indigo-800">{renderDataValue(theme)}</p>
                      </div>
                    )) : (
                      <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                        <p className="text-indigo-800">{renderDataValue(reportData.outcomeIntegrationAnalysis.psychologicalPatternThemes)}</p>
                      </div>
                    )
                  }
                </div>
              </div>
            )}

            {/* Solution Coherence */}
            {reportData.outcomeIntegrationAnalysis.painPointSolutionCoherence && (
              <div>
                <h4 className="font-semibold text-green-700 mb-3">🎯 Solution Coherence</h4>
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <p className="text-green-800">{renderDataValue(reportData.outcomeIntegrationAnalysis.painPointSolutionCoherence)}</p>
                </div>
              </div>
            )}

            {/* Innovation Opportunities */}
            {reportData.outcomeIntegrationAnalysis.innovationOpportunitySpaces && (
              <div>
                <h4 className="font-semibold text-yellow-700 mb-3">💡 Innovation Opportunities</h4>
                <div className="grid gap-3">
                  {Array.isArray(reportData.outcomeIntegrationAnalysis.innovationOpportunitySpaces) ? 
                    reportData.outcomeIntegrationAnalysis.innovationOpportunitySpaces.map((opportunity: any, index: number) => (
                      <div key={index} className="bg-yellow-50 p-3 rounded border border-yellow-200 flex items-start gap-3">
                        <span className="w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-yellow-800">{renderDataValue(opportunity)}</p>
                      </div>
                    )) : (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <p className="text-yellow-800">{renderDataValue(reportData.outcomeIntegrationAnalysis.innovationOpportunitySpaces)}</p>
                      </div>
                    )
                  }
                </div>
              </div>
            )}

            {/* Implementation Priority */}
            {reportData.outcomeIntegrationAnalysis.implementationPrioritySuggestions && (
              <div>
                <h4 className="font-semibold text-red-700 mb-3">⚡ Implementation Priority</h4>
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <p className="text-red-800">{renderDataValue(reportData.outcomeIntegrationAnalysis.implementationPrioritySuggestions)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fallback: Show raw data if expected structure doesn't exist */}
      {!reportData.projectContext && !reportData.irrationalityClusters && !reportData.outcomeIntegrationAnalysis && (
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
          <h3 className="text-lg font-bold text-yellow-800 mb-4">🔍 Debug: Raw Data Structure</h3>
          <p className="text-sm text-yellow-700 mb-4">
            The expected transformation framework structure was not found. Showing raw data for debugging:
          </p>
          <div className="bg-white p-4 rounded border border-yellow-300 max-h-96 overflow-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Generation Metadata */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {(data?.generated_at || reportData?.generated_at) && (
              <p>Generated on: {new Date(data?.generated_at || reportData?.generated_at).toLocaleString()}</p>
            )}
          </div>
          <button
            onClick={onGenerateNew}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Generate New Framework
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransformationFrameworkReportViewer;