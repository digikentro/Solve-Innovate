import { useState } from 'react';

interface HMWIdeationFrameworkReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
}

export const HMWIdeationFrameworkReportViewer = ({ data, onGenerateNew }: HMWIdeationFrameworkReportViewerProps) => {
  const reportData = data?.content || data;
  const [expandedIdeation, setExpandedIdeation] = useState<{[key: number]: boolean}>({});

  const toggleIdeation = (idx: number) => {
    setExpandedIdeation(prev => ({ ...prev, [idx]: !prev[idx] }));
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
        <h1 className="text-3xl font-bold">HMW Ideation Framework Report</h1>
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
      {reportData.project_context && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Project Context</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Prioritized Pain Point</h3>
              <p className="text-base pl-2">{formatValue(reportData.project_context.prioritized_pain_point)}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Target Extreme User</h3>
              <p className="text-base pl-2">{formatValue(reportData.project_context.target_extreme_user)}</p>
            </div>
          </div>
        </section>
      )}

      {/* HMW Ideation */}
      {Array.isArray(reportData.hmw_ideation) && reportData.hmw_ideation.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold mb-4 pb-2">HMW Ideation</h2>
          {reportData.hmw_ideation.map((hmw: any, idx: number) => (
            <div key={idx} className="bg-gray-50 p-6 rounded-xl">
              <button
                onClick={() => toggleIdeation(idx)}
                className="w-full text-left mb-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">HMW {idx + 1}: {hmw.hmw_statement?.slice(0, 40) || 'HMW Statement'}</h3>
                  <span className="text-2xl">{expandedIdeation[idx] ? '−' : '+'}</span>
                </div>
              </button>
              {expandedIdeation[idx] && (
                <div className="space-y-4 pl-4">
                  <div>
                    <h4 className="font-bold mb-1">HMW Statement</h4>
                    <p className="text-base">{formatValue(hmw.hmw_statement)}</p>
                  </div>
                  {/* Approach 1: Simple Ideas */}
                  {hmw.approach_1_simple_ideas && (
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2">Approach 1: Simple Ideas</h4>
                      <div className="space-y-2">
                        {hmw.approach_1_simple_ideas.map((idea: any, i: number) => (
                          <div key={i} className="bg-green-50 p-4 rounded-lg">
                            <div className="font-bold text-green-800 mb-1">{idea.idea_name}</div>
                            <div className="text-sm">
                              <p><strong>Description:</strong> {idea.description}</p>
                              <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                              <p><strong>Implementation:</strong> {idea.implementation}</p>
                              <p><strong>Extreme User Fit:</strong> {idea.extreme_user_fit}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Approach 2: Outside Category Ideas */}
                  {hmw.approach_2_outside_category_ideas && (
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-2">Approach 2: Outside Category Ideas</h4>
                      <div className="space-y-2">
                        {hmw.approach_2_outside_category_ideas.map((idea: any, i: number) => (
                          <div key={i} className="bg-blue-50 p-4 rounded-lg">
                            <div className="font-bold text-blue-800 mb-1">{idea.idea_name}</div>
                            <div className="text-sm">
                              <p><strong>Inspiration Source:</strong> {idea.inspiration_source}</p>
                              <p><strong>Original Solution:</strong> {idea.original_solution}</p>
                              <p><strong>Adaptation:</strong> {idea.adaptation}</p>
                              <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                              <p><strong>Implementation:</strong> {idea.implementation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Approach 3: Add Feature Ideas */}
                  {hmw.approach_3_add_feature_ideas && (
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-2">Approach 3: Add Feature Ideas</h4>
                      <div className="space-y-2">
                        {hmw.approach_3_add_feature_ideas.map((idea: any, i: number) => (
                          <div key={i} className="bg-purple-50 p-4 rounded-lg">
                            <div className="font-bold text-purple-800 mb-1">{idea.idea_name}</div>
                            <div className="text-sm">
                              <p><strong>Existing Product:</strong> {idea.existing_product}</p>
                              <p><strong>Added Feature:</strong> {idea.added_feature}</p>
                              <p><strong>Integration Method:</strong> {idea.integration_method}</p>
                              <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                              <p><strong>Automatic Behavior:</strong> {idea.automatic_behavior}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Approach 4: Remove Feature Ideas */}
                  {hmw.approach_4_remove_feature_ideas && (
                    <div>
                      <h4 className="font-semibold text-orange-700 mb-2">Approach 4: Remove Feature Ideas</h4>
                      <div className="space-y-2">
                        {hmw.approach_4_remove_feature_ideas.map((idea: any, i: number) => (
                          <div key={i} className="bg-orange-50 p-4 rounded-lg">
                            <div className="font-bold text-orange-800 mb-1">{idea.idea_name}</div>
                            <div className="text-sm">
                              <p><strong>Existing Solution:</strong> {idea.existing_solution}</p>
                              <p><strong>Removed Elements:</strong> {idea.removed_elements}</p>
                              <p><strong>Simplified Experience:</strong> {idea.simplified_experience}</p>
                              <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                              <p><strong>Maintained Functionality:</strong> {idea.maintained_functionality}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Cross Approach Synthesis */}
                  {hmw.cross_approach_synthesis && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Cross-Approach Synthesis</h4>
                      <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <span className="font-medium">Complementary Ideas:</span> {hmw.cross_approach_synthesis.complementary_ideas}
                        </div>
                        <div>
                          <span className="font-medium">Implementation Priority:</span> {hmw.cross_approach_synthesis.implementation_priority}
                        </div>
                        <div>
                          <span className="font-medium">Extreme User Preference:</span> {hmw.cross_approach_synthesis.extreme_user_preference}
                        </div>
                        <div>
                          <span className="font-medium">Behavior Impact:</span> {hmw.cross_approach_synthesis.behavior_impact}
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

      {/* Portfolio Analysis */}
      {reportData.portfolio_analysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Portfolio Analysis</h2>
          {reportData.portfolio_analysis.approach_effectiveness && (
            <div className="mb-8">
              <h3 className="font-semibold mb-2">Approach Effectiveness</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="font-medium text-green-800">Simple Ideas Strengths:</span> {reportData.portfolio_analysis.approach_effectiveness.simple_ideas_strengths}
                  <span className="font-medium text-blue-800">Outside Category Insights:</span> {reportData.portfolio_analysis.approach_effectiveness.outside_category_insights}
                </div>
                <div className="space-y-2">
                  <span className="font-medium text-purple-800">Add Feature Opportunities:</span> {reportData.portfolio_analysis.approach_effectiveness.add_feature_opportunities}
                  <span className="font-medium text-orange-800">Remove Feature Impact:</span> {reportData.portfolio_analysis.approach_effectiveness.remove_feature_impact}
                </div>
              </div>
            </div>
          )}
          {reportData.portfolio_analysis.next_steps_recommendations && (
            <div>
              <h3 className="font-semibold mb-2">Next Steps Recommendations</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <span className="font-medium">Priority Ideas:</span>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    {reportData.portfolio_analysis.next_steps_recommendations.priority_ideas?.map((idea: string, i: number) => (
                      <li key={i} className="text-sm">{idea}</li>
                    ))}
                  </ul>
                  <span className="font-medium">Prototype Candidates:</span>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    {reportData.portfolio_analysis.next_steps_recommendations.prototype_candidates?.map((candidate: string, i: number) => (
                      <li key={i} className="text-sm">{candidate}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Research Needs:</span> {reportData.portfolio_analysis.next_steps_recommendations.research_needs}
                  <span className="font-medium">Implementation Planning:</span> {reportData.portfolio_analysis.next_steps_recommendations.implementation_planning}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Fallback: Show all raw data if structure doesn't match expected format */}
      {!reportData.project_context && !(Array.isArray(reportData.hmw_ideation) && reportData.hmw_ideation.length > 0) && !reportData.portfolio_analysis && (
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
