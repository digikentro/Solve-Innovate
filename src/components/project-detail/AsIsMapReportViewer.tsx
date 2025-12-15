import { useState } from 'react';

interface AsIsMapReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
}

export const AsIsMapReportViewer = ({ data, onGenerateNew }: AsIsMapReportViewerProps) => {
  const [expandedStages, setExpandedStages] = useState<{[key: number]: boolean}>({});
  const [expandedBottlenecks, setExpandedBottlenecks] = useState<{[key: number]: boolean}>({});

  const reportData = data?.content || data;

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No As-Is Map data available</p>
      </div>
    );
  }

  const toggleStage = (stageId: number) => {
    setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const toggleBottleneck = (index: number) => {
    setExpandedBottlenecks(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getPainLevelLabel = (level: number) => {
    if (level >= 8) return 'Critical';
    if (level >= 6) return 'High';
    if (level >= 4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-8">
      {/* Header with Generate New Button */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">As-Is Map Report</h1>
        {onGenerateNew && (
          <button
            onClick={onGenerateNew}
            className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Generate New
          </button>
        )}
      </div>

      {/* Executive Summary Section */}
      {reportData.hmw_statement_analysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Executive Summary</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Problem Statement</h3>
              <p className="text-base leading-relaxed pl-4 break-words whitespace-normal">
                {Array.isArray(reportData.hmw_statement_analysis.hmw) 
                  ? reportData.hmw_statement_analysis.hmw[0] 
                  : reportData.hmw_statement_analysis.hmw || 'N/A'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Target Users</h3>
                <p className="text-base pl-4 break-words whitespace-normal">
                  {Array.isArray(reportData.hmw_statement_analysis.target_users) 
                    ? reportData.hmw_statement_analysis.target_users[0] 
                    : reportData.hmw_statement_analysis.target_users || 'N/A'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Core Need</h3>
                <p className="text-base pl-4 break-words whitespace-normal">
                  {Array.isArray(reportData.hmw_statement_analysis.core_need) 
                    ? reportData.hmw_statement_analysis.core_need[0] 
                    : reportData.hmw_statement_analysis.core_need || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Current State Journey Map */}
      {reportData.as_is_map?.stages && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Current State Journey Map</h2>
          <p className="text-sm text-gray-600 mb-6">Click on any stage to expand/collapse steps</p>

          <div className="space-y-6">
            {reportData.as_is_map.stages.map((stage: any, index: number) => (
              <div key={stage.id}>
                {/* Stage Header */}
                <button
                  onClick={() => toggleStage(stage.id)}
                  className="w-full px-4 py-3 bg-gray-200 text-left hover:bg-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">Stage {stage.id}</span>
                      <span className="text-lg font-semibold">{stage.stage_name}</span>
                    </div>
                    <span className="text-xl">{expandedStages[stage.id] ? '−' : '+'}</span>
                  </div>
                </button>

                {/* Stage Steps */}
                {expandedStages[stage.id] && (
                  <div className="p-4 bg-white">
                    <div className="space-y-3">
                      {stage.steps.map((step: any) => (
                        <div key={step.id} className="p-3 bg-gray-50">
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-sm flex-shrink-0 w-8">#{step.id}</span>
                            <p className="text-sm flex-1">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connector */}
                {index < reportData.as_is_map.stages.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="text-2xl">↓</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pain Point Analysis */}
      {reportData.pain_point_analysis?.steps && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Pain Point Analysis</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="text-left py-3 px-4 font-bold">Stage</th>
                  <th className="text-left py-3 px-4 font-bold">Step</th>
                  <th className="text-left py-3 px-4 font-bold">Pain Level</th>
                  <th className="text-left py-3 px-4 font-bold">Description</th>
                </tr>
              </thead>
              <tbody>
                {reportData.pain_point_analysis.steps.map((pain: any, index: number) => (
                  <tr key={index} className="bg-white">
                    <td className="py-3 px-4 font-semibold">Stage {pain.stage_id}</td>
                    <td className="py-3 px-4">Step {pain.step_id}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold">{pain.pain_level}/10</span>
                      <span className="ml-2 text-sm">({getPainLevelLabel(pain.pain_level)})</span>
                    </td>
                    <td className="py-3 px-4 text-sm">{pain.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Priority Bottlenecks (Pareto Analysis) */}
      {reportData.pareto_prioritization?.top_bottlenecks && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Priority Bottlenecks (Pareto Analysis)</h2>
          <p className="text-sm text-gray-600 mb-6">Top issues ranked by impact - Click to expand details</p>

          <div className="space-y-4">
            {reportData.pareto_prioritization.top_bottlenecks.map((bottleneck: any, index: number) => (
              <div key={index} className="bg-white">
                {/* Bottleneck Header */}
                <button
                  onClick={() => toggleBottleneck(index)}
                  className="w-full px-4 py-3 bg-gray-200 text-left hover:bg-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold">#{index + 1}</span>
                      <span className="font-semibold">Stage {bottleneck.stage_id}, Step {bottleneck.step_id}</span>
                      <span className="font-bold">Pain: {bottleneck.pain_level}/10</span>
                      <span className="text-sm bg-gray-900 text-white px-2 py-1">{bottleneck.impact_scope}</span>
                    </div>
                    <span className="text-xl">{expandedBottlenecks[index] ? '−' : '+'}</span>
                  </div>
                </button>

                {/* Bottleneck Details */}
                {expandedBottlenecks[index] && (
                  <div className="p-4 space-y-4 bg-gray-50">
                    <div>
                      <h4 className="font-bold mb-2">Evidence of Bottleneck:</h4>
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        {bottleneck.bottleneck_evidence?.map((evidence: string, i: number) => (
                          <li key={i} className="text-sm">{evidence}</li>
                        ))}
                      </ul>
                    </div>

                    {bottleneck.why_80_percent_impact && bottleneck.why_80_percent_impact.length > 0 && (
                      <div>
                        <h4 className="font-bold mb-2">Why 80% Impact:</h4>
                        <ul className="list-disc list-inside space-y-1 pl-4">
                          {bottleneck.why_80_percent_impact.map((impact: string, i: number) => (
                            <li key={i} className="text-sm">{impact}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {bottleneck.ripple_effects && bottleneck.ripple_effects.length > 0 && (
                      <div>
                        <h4 className="font-bold mb-2">Ripple Effects:</h4>
                        <ul className="list-disc list-inside space-y-1 pl-4">
                          {bottleneck.ripple_effects.map((effect: string, i: number) => (
                            <li key={i} className="text-sm">{effect}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="font-bold mb-2">Current Solutions Gap:</h4>
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        {bottleneck.current_solutions_gap?.map((gap: string, i: number) => (
                          <li key={i} className="text-sm">{gap}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 mt-3 bg-gray-100 p-3">
                      <h4 className="font-bold mb-2">Hypothesis for Exploration:</h4>
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        {bottleneck.hypothesis_for_exploration?.map((hypothesis: string, i: number) => (
                          <li key={i} className="text-sm font-semibold">{hypothesis}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MECE Validation */}
      {reportData.mece_validation && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">MECE Validation</h2>
          <p className="text-sm text-gray-600 mb-4">Mutually Exclusive, Collectively Exhaustive analysis</p>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 pb-2">Mutually Exclusive Check</h3>
              <ul className="list-disc list-inside space-y-2 pl-2">
                {reportData.mece_validation.mutually_exclusive_check?.map((check: string, i: number) => (
                  <li key={i} className="text-sm">{check}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 pb-2">Collectively Exhaustive Check</h3>
              <ul className="list-disc list-inside space-y-2 pl-2">
                {reportData.mece_validation.collectively_exhaustive_check?.map((check: string, i: number) => (
                  <li key={i} className="text-sm">{check}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Exploration Recommendations */}
      {reportData.exploration_recommendations && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Exploration Recommendations</h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Primary Focus</h3>
              <p className="text-sm pl-4 break-words whitespace-normal">
                {Array.isArray(reportData.exploration_recommendations.primary_focus) 
                  ? reportData.exploration_recommendations.primary_focus[0] 
                  : reportData.exploration_recommendations.primary_focus || 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Research Methods</h3>
              <p className="text-sm pl-4 break-words whitespace-normal">
                {Array.isArray(reportData.exploration_recommendations.research_methods) 
                  ? reportData.exploration_recommendations.research_methods[0] 
                  : reportData.exploration_recommendations.research_methods || 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Success Metrics</h3>
              <p className="text-sm pl-4 break-words whitespace-normal">
                {Array.isArray(reportData.exploration_recommendations.success_metrics) 
                  ? reportData.exploration_recommendations.success_metrics[0] 
                  : reportData.exploration_recommendations.success_metrics || 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Timeline</h3>
              <p className="text-sm pl-4 break-words whitespace-normal">
                {Array.isArray(reportData.exploration_recommendations.timeline) 
                  ? reportData.exploration_recommendations.timeline[0] 
                  : reportData.exploration_recommendations.timeline || 'N/A'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Prioritization Rationale */}
      {reportData.prioritization_rationale && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Prioritization Rationale</h2>

          <div className="space-y-4">
            {reportData.prioritization_rationale.methodology && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Methodology</h3>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {reportData.prioritization_rationale.methodology.map((method: string, i: number) => (
                    <li key={i} className="text-sm">{method}</li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.prioritization_rationale.impact_calculation && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Impact Calculation</h3>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {reportData.prioritization_rationale.impact_calculation.map((calc: string, i: number) => (
                    <li key={i} className="text-sm">{calc}</li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.prioritization_rationale.confidence_level && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Confidence Level</h3>
                <p className="text-sm pl-4">
                  {reportData.prioritization_rationale.confidence_level}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Credible Sources */}
      {reportData.credible_sources && reportData.credible_sources.length > 0 && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Credible Sources</h2>

          <div className="space-y-3">
            {reportData.credible_sources.map((source: any, index: number) => (
              <div key={index} className="p-4 bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{source.title}</h3>
                    <p className="text-sm text-gray-700 mb-2">{source.relevance}</p>
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm underline hover:no-underline"
                    >
                      View Source →
                    </a>
                  </div>
                  <span className="text-xs bg-gray-900 text-white px-2 py-1 flex-shrink-0">
                    Source {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
