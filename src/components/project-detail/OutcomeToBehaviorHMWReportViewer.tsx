import { useState } from 'react';

interface OutcomeToBehaviorHMWReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
}

export const OutcomeToBehaviorHMWReportViewer = ({ data, onGenerateNew }: OutcomeToBehaviorHMWReportViewerProps) => {
  const reportData = data?.content || data;
  const [expandedTransformations, setExpandedTransformations] = useState<{[key: number]: boolean}>({});

  const toggleTransformation = (idx: number) => {
    setExpandedTransformations(prev => ({ ...prev, [idx]: !prev[idx] }));
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
        <h1 className="text-3xl font-bold">Outcome-to-Behavior HMW Report</h1>
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

      {/* Transformations */}
      {Array.isArray(reportData.transformations) && reportData.transformations.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold mb-4 pb-2">Transformations</h2>
          {reportData.transformations.map((trans: any, idx: number) => (
            <div key={idx} className="bg-gray-50 p-6 rounded-xl">
              <button
                onClick={() => toggleTransformation(idx)}
                className="w-full text-left mb-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Transformation {idx + 1}: {trans.outcome?.slice(0, 40) || 'Transformation'}</h3>
                  <span className="text-2xl">{expandedTransformations[idx] ? '−' : '+'}</span>
                </div>
              </button>
              {expandedTransformations[idx] && (
                <div className="space-y-4 pl-4">
                  <div>
                    <h4 className="font-bold mb-1">Outcome</h4>
                    <p className="text-base">{formatValue(trans.outcome)}</p>
                  </div>
                  {trans.behavior_analysis && (
                    <div>
                      <h4 className="font-bold mb-1">Behavior Analysis</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <span className="font-semibold">Core Behavior:</span>
                          <p className="text-sm pl-2">{formatValue(trans.behavior_analysis.core_behavior)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Measurement Criteria:</span>
                          <p className="text-sm pl-2">{formatValue(trans.behavior_analysis.measurement_criteria)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Ability Barriers:</span>
                          <ul className="list-disc list-inside space-y-1 pl-4">
                            {trans.behavior_analysis.ability_barriers?.map((b: string, i: number) => (
                              <li key={i} className="text-sm">{b}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold">Extreme User Constraints:</span>
                          <ul className="list-disc list-inside space-y-1 pl-4">
                            {trans.behavior_analysis.extreme_user_constraints?.map((c: string, i: number) => (
                              <li key={i} className="text-sm">{c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  {trans.behavior_specification && (
                    <div>
                      <h4 className="font-bold mb-1">Behavior Specification</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <span className="font-semibold">Specific Action:</span>
                          <p className="text-sm pl-2">{formatValue(trans.behavior_specification.specific_action)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Measurable Elements:</span>
                          <ul className="list-disc list-inside space-y-1 pl-4">
                            {trans.behavior_specification.measurable_elements?.map((m: string, i: number) => (
                              <li key={i} className="text-sm">{m}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold">Observable Components:</span>
                          <ul className="list-disc list-inside space-y-1 pl-4">
                            {trans.behavior_specification.observable_components?.map((o: string, i: number) => (
                              <li key={i} className="text-sm">{o}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-semibold">Outcome Connection:</span>
                          <p className="text-sm pl-2">{formatValue(trans.behavior_specification.outcome_connection)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {trans.ability_focused_constraint && (
                    <div>
                      <h4 className="font-bold mb-1">Ability-Focused Constraint</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <span className="font-semibold">Primary Barrier:</span>
                          <p className="text-sm pl-2">{formatValue(trans.ability_focused_constraint.primary_barrier)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Simplification Approach:</span>
                          <p className="text-sm pl-2">{formatValue(trans.ability_focused_constraint.simplification_approach)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Constraint Framing:</span>
                          <p className="text-sm pl-2">{formatValue(trans.ability_focused_constraint.constraint_framing)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Outcome Alignment:</span>
                          <p className="text-sm pl-2">{formatValue(trans.ability_focused_constraint.outcome_alignment)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {trans.hmw_statement && (
                    <div>
                      <h4 className="font-bold mb-1">HMW Statement</h4>
                      <p className="text-base">{formatValue(trans.hmw_statement)}</p>
                    </div>
                  )}
                  {trans.bj_fogg_validation && (
                    <div>
                      <h4 className="font-bold mb-1">BJ Fogg Validation</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <span className="font-semibold">Ability Focus:</span>
                          <p className="text-sm pl-2">{formatValue(trans.bj_fogg_validation.ability_focus)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Behavior Specificity:</span>
                          <p className="text-sm pl-2">{formatValue(trans.bj_fogg_validation.behavior_specificity)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Extreme User Enablement:</span>
                          <p className="text-sm pl-2">{formatValue(trans.bj_fogg_validation.extreme_user_enablement)}</p>
                        </div>
                        <div>
                          <span className="font-semibold">Outcome Achievement:</span>
                          <p className="text-sm pl-2">{formatValue(trans.bj_fogg_validation.outcome_achievement)}</p>
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

      {/* Behavior Integration Analysis */}
      {reportData.behavior_integration_analysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Behavior Integration Analysis</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Behavior Pattern Themes</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                {reportData.behavior_integration_analysis.behavior_pattern_themes?.map((t: string, i: number) => (
                  <li key={i} className="text-sm">{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Ability Simplification Strategies</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                {reportData.behavior_integration_analysis.ability_simplification_strategies?.map((s: string, i: number) => (
                  <li key={i} className="text-sm">{s}</li>
                ))}
              </ul>
            </div>
          </div>
          {reportData.behavior_integration_analysis.extreme_user_enablement_coherence && (
            <div className="mt-8">
              <h3 className="font-semibold mb-2">Extreme User Enablement Coherence</h3>
              <p className="text-base pl-2">{reportData.behavior_integration_analysis.extreme_user_enablement_coherence}</p>
            </div>
          )}
          {reportData.behavior_integration_analysis.outcome_achievement_pathway && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Outcome Achievement Pathway</h3>
              <p className="text-base pl-2">{reportData.behavior_integration_analysis.outcome_achievement_pathway}</p>
            </div>
          )}
          {reportData.behavior_integration_analysis.implementation_feasibility_assessment && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Implementation Feasibility Assessment</h3>
              <p className="text-base pl-2">{reportData.behavior_integration_analysis.implementation_feasibility_assessment}</p>
            </div>
          )}
        </section>
      )}

      {/* Fallback: Show all raw data if structure doesn't match expected format */}
      {!reportData.project_context && !(Array.isArray(reportData.transformations) && reportData.transformations.length > 0) && !reportData.behavior_integration_analysis && (
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
