import { useState, useRef } from 'react';

interface AsIsMapReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const AsIsMapReportViewer = ({ data, onGenerateNew, projectId, onSave }: AsIsMapReportViewerProps) => {
  const [expandedStages, setExpandedStages] = useState<{ [key: number]: boolean }>({});
  const [expandedBottlenecks, setExpandedBottlenecks] = useState<{ [key: number]: boolean }>({});
  // Hover states to provide affordance and optional auto-expand on hover
  const [hoverStageId, setHoverStageId] = useState<number | null>(null);
  const [hoverBottleneckIndex, setHoverBottleneckIndex] = useState<number | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);

  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorText, setErrorText] = useState('');

  const reportData = (isEditMode && editedData ? editedData?.content || editedData : data?.content || data) || {};

  // Precompute step offsets so numbering is continuous across stages,
  // regardless of which stages are expanded in the UI
  const stages: any[] = reportData?.as_is_map?.stages || [];
  const stepOffsets: number[] = stages.reduce((acc: number[], _stage: any, idx: number) => {
    const prev = idx === 0 ? 0 : acc[idx - 1] + (stages[idx - 1]?.steps?.length || 0);
    acc[idx] = prev;
    return acc;
  }, [] as number[]);

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

  // Handlers to show hover affordance and auto-expand after a short delay
  const handleStageMouseEnter = (stageId: number) => {
    setHoverStageId(stageId);
    // Auto-expand after 500ms if not already expanded
    if (!expandedStages[stageId]) {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = window.setTimeout(() => {
        setExpandedStages(prev => ({ ...prev, [stageId]: true }));
      }, 500);
    }
  };

  const handleStageMouseLeave = (stageId: number) => {
    setHoverStageId(current => (current === stageId ? null : current));
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleBottleneckMouseEnter = (index: number) => {
    setHoverBottleneckIndex(index);
    if (!expandedBottlenecks[index]) {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = window.setTimeout(() => {
        setExpandedBottlenecks(prev => ({ ...prev, [index]: true }));
      }, 500);
    }
  };

  const handleBottleneckMouseLeave = (index: number) => {
    setHoverBottleneckIndex(current => (current === index ? null : current));
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const getPainLevelLabel = (level: number) => {
    if (level >= 8) return 'Critical';
    if (level >= 6) return 'High';
    if (level >= 4) return 'Medium';
    return 'Low';
  };

  const handleEditToggle = () => {
    if (!isEditMode) {
      // Entering edit mode - save original and create editable copy
      setOriginalData(structuredClone(data));
      setEditedData(structuredClone(data));
    }
    setIsEditMode(!isEditMode);
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setEditedData(null);
    setOriginalData(null);
    setIsEditMode(false);
    setShowCancelDialog(false);
  };

  const handleSave = async () => {
    setShowSaveDialog(true);
  };

  const confirmSave = async () => {
    setShowSaveDialog(false);
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(editedData);
      }
      // Update original to match saved
      setOriginalData(structuredClone(editedData));
      setIsEditMode(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setErrorText('Failed to save As-Is Map. Please try again.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTextAtPath = (path: string[], value: string) => {
    const clone = structuredClone(editedData || data);
    let current: any = clone?.content || clone;

    // Navigate to parent
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) return;
      current = current[path[i]];
    }

    // Update the final key
    const lastKey = path[path.length - 1];
    current[lastKey] = value;

    setEditedData(clone?.content ? { ...clone } : clone);
  };

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg animate-fadeIn">
          <p className="font-semibold">✓ As-Is Map saved successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg animate-fadeIn">
          <p className="font-semibold">✗ {errorText}</p>
        </div>
      )}

      {/* Save Confirmation Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Save Changes?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to save changes to the As-Is Map?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Discard Changes?</h3>
            <p className="text-gray-600 mb-6">All your changes will be lost. Are you sure you want to discard them?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-blue-100 border-l-4 border-blue-600 p-4 rounded">
          <p className="text-blue-800 font-semibold">
            ✏️ Edit Mode Active - You can now edit text fields in the report. Click Save when done or Cancel to discard changes.
          </p>
        </div>
      )}

      {/* Header with Action Buttons */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">As-Is Map Report</h1>
        <div className="flex items-center gap-4">
          {projectId && onSave && (
            <>
              {!isEditMode ? (
                <button
                  onClick={handleEditToggle}
                  className="px-6 py-2 font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-md text-[0.85rem]"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 rounded-md text-[0.85rem]"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 py-2 font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50 rounded-md text-[0.85rem]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
          {onGenerateNew && (
            <button
              onClick={onGenerateNew}
              disabled={isEditMode}
              className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-[0.85rem]"
            >
              Generate New
            </button>
          )}
        </div>
      </div>

      {/* Executive Summary Section */}
      {reportData.hmw_statement_analysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Executive Summary</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Problem Statement</h3>
              {isEditMode ? (
                <textarea
                  value={Array.isArray(reportData.hmw_statement_analysis.hmw)
                    ? reportData.hmw_statement_analysis.hmw[0]
                    : reportData.hmw_statement_analysis.hmw || ''}
                  onChange={(e) => {
                    const isArray = Array.isArray((editedData?.content || editedData)?.hmw_statement_analysis?.hmw);
                    updateTextAtPath(
                      isArray ? ['hmw_statement_analysis', 'hmw', '0'] : ['hmw_statement_analysis', 'hmw'],
                      e.target.value
                    );
                  }}
                  className="w-full px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                />
              ) : (
                <p className="text-base leading-relaxed pl-4 break-words whitespace-normal">
                  {Array.isArray(reportData.hmw_statement_analysis.hmw)
                    ? reportData.hmw_statement_analysis.hmw[0]
                    : reportData.hmw_statement_analysis.hmw || 'N/A'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Target Users</h3>
                {isEditMode ? (
                  <textarea
                    value={Array.isArray(reportData.hmw_statement_analysis.target_users)
                      ? reportData.hmw_statement_analysis.target_users[0]
                      : reportData.hmw_statement_analysis.target_users || ''}
                    onChange={(e) => {
                      const isArray = Array.isArray((editedData?.content || editedData)?.hmw_statement_analysis?.target_users);
                      updateTextAtPath(
                        isArray ? ['hmw_statement_analysis', 'target_users', '0'] : ['hmw_statement_analysis', 'target_users'],
                        e.target.value
                      );
                    }}
                    className="w-full px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px]"
                  />
                ) : (
                  <p className="text-base pl-4 break-words whitespace-normal">
                    {Array.isArray(reportData.hmw_statement_analysis.target_users)
                      ? reportData.hmw_statement_analysis.target_users[0]
                      : reportData.hmw_statement_analysis.target_users || 'N/A'}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Core Need</h3>
                {isEditMode ? (
                  <textarea
                    value={Array.isArray(reportData.hmw_statement_analysis.core_need)
                      ? reportData.hmw_statement_analysis.core_need[0]
                      : reportData.hmw_statement_analysis.core_need || ''}
                    onChange={(e) => {
                      const isArray = Array.isArray((editedData?.content || editedData)?.hmw_statement_analysis?.core_need);
                      updateTextAtPath(
                        isArray ? ['hmw_statement_analysis', 'core_need', '0'] : ['hmw_statement_analysis', 'core_need'],
                        e.target.value
                      );
                    }}
                    className="w-full px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px]"
                  />
                ) : (
                  <p className="text-base pl-4 break-words whitespace-normal">
                    {Array.isArray(reportData.hmw_statement_analysis.core_need)
                      ? reportData.hmw_statement_analysis.core_need[0]
                      : reportData.hmw_statement_analysis.core_need || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Current State Journey Map */}
      {reportData.as_is_map?.stages && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Current State Journey Map</h2>
          <p className="text-sm text-gray-600 mb-6">Hover a stage to preview and click to expand/collapse steps</p>

          {/* Number steps continuously across stages irrespective of expansion state */}
          <div className="space-y-6">
            {reportData.as_is_map.stages.map((stage: any, index: number) => (

              <div key={stage.id}>
                {/* Stage Header */}
                {isEditMode ? (
                  <div className="w-full px-4 py-3 bg-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">Stage {stage.id}</span>
                      <input
                        type="text"
                        value={stage.stage_name}
                        onChange={(e) => {
                          updateTextAtPath(['as_is_map', 'stages', index.toString(), 'stage_name'], e.target.value);
                        }}
                        className="flex-1 px-3 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => toggleStage(stage.id)}
                        className="text-xl px-2"
                      >
                        {expandedStages[stage.id] ? '−' : '+'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleStage(stage.id)}
                    onMouseEnter={() => handleStageMouseEnter(stage.id)}
                    onMouseLeave={() => handleStageMouseLeave(stage.id)}
                    className={`w-full px-4 py-3 text-left transition-all duration-200 ${hoverStageId === stage.id ? 'bg-gray-300 shadow-md scale-[1.01]' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">Stage {stage.id}</span>
                        <span className="text-lg font-semibold">{stage.stage_name}</span>
                      </div>
                      <span className={`text-xl transition-transform duration-200 ${hoverStageId === stage.id ? 'translate-y-[-1px]' : ''}`}>{expandedStages[stage.id] ? '−' : '+'}</span>
                    </div>
                  </button>
                )}

                {/* Stage Steps */}
                {expandedStages[stage.id] && (
                  <div className="p-4 bg-white">
                    <div className="space-y-3">
                      {stage.steps.map((step: any, stepIdx: number) => {
                        const currentNumber = (stepOffsets[index] || 0) + stepIdx + 1;
                        return (
                          <div key={`${stage.id}-${step.id}-${currentNumber}`} className="p-3 bg-gray-50">
                            <div className="flex items-start gap-3">
                              <span className="font-bold text-sm flex-shrink-0 w-8">#{currentNumber}</span>
                              {isEditMode ? (
                                <textarea
                                  value={step.description}
                                  onChange={(e) => {
                                    updateTextAtPath(['as_is_map', 'stages', index.toString(), 'steps', stepIdx.toString(), 'description'], e.target.value);
                                  }}
                                  className="flex-1 text-sm px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                                />
                              ) : (
                                <p className="text-sm flex-1">{step.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                {reportData.pain_point_analysis.steps.map((pain: any, painIdx: number) => (
                  <tr key={painIdx} className="bg-white">
                    <td className="py-3 px-4 font-semibold">Stage {pain.stage_id}</td>
                    <td className="py-3 px-4">Step {pain.step_id}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold">{pain.pain_level}/10</span>
                      <span className="ml-2 text-sm">({getPainLevelLabel(pain.pain_level)})</span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {isEditMode ? (
                        <textarea
                          value={pain.description}
                          onChange={(e) => {
                            updateTextAtPath(['pain_point_analysis', 'steps', painIdx.toString(), 'description'], e.target.value);
                          }}
                          className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                        />
                      ) : (
                        pain.description
                      )}
                    </td>
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
          <p className="text-sm text-gray-600 mb-6">Top issues ranked by impact - Hover to preview and click to expand details</p>

          <div className="space-y-4">
            {reportData.pareto_prioritization.top_bottlenecks.map((bottleneck: any, index: number) => (
              <div key={index} className="bg-white">
                {/* Bottleneck Header */}
                <button
                  onClick={() => toggleBottleneck(index)}
                  onMouseEnter={() => handleBottleneckMouseEnter(index)}
                  onMouseLeave={() => handleBottleneckMouseLeave(index)}
                  className={`w-full px-4 py-3 text-left transition-all duration-200 ${hoverBottleneckIndex === index ? 'bg-gray-300 shadow-md scale-[1.01]' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold">#{index + 1}</span>
                      <span className="font-semibold">Stage {bottleneck.stage_id}, Step {bottleneck.step_id}</span>
                      <span className="font-bold">Pain: {bottleneck.pain_level}/10</span>
                      <span className="text-sm bg-gray-900 text-white px-2 py-1">{bottleneck.impact_scope}</span>
                    </div>
                    <span className={`text-xl transition-transform duration-200 ${hoverBottleneckIndex === index ? 'translate-y-[-1px]' : ''}`}>{expandedBottlenecks[index] ? '−' : '+'}</span>
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
              {isEditMode ? (
                <textarea
                  value={Array.isArray(reportData.exploration_recommendations.primary_focus)
                    ? reportData.exploration_recommendations.primary_focus[0]
                    : reportData.exploration_recommendations.primary_focus || ''}
                  onChange={(e) => {
                    const isArray = Array.isArray((editedData?.content || editedData)?.exploration_recommendations?.primary_focus);
                    updateTextAtPath(
                      isArray ? ['exploration_recommendations', 'primary_focus', '0'] : ['exploration_recommendations', 'primary_focus'],
                      e.target.value
                    );
                  }}
                  className="w-full px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              ) : (
                <p className="text-sm pl-4 break-words whitespace-normal">
                  {Array.isArray(reportData.exploration_recommendations.primary_focus)
                    ? reportData.exploration_recommendations.primary_focus[0]
                    : reportData.exploration_recommendations.primary_focus || 'N/A'}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Research Methods</h3>
              {isEditMode ? (
                <textarea
                  value={Array.isArray(reportData.exploration_recommendations.research_methods)
                    ? reportData.exploration_recommendations.research_methods[0]
                    : reportData.exploration_recommendations.research_methods || ''}
                  onChange={(e) => {
                    const isArray = Array.isArray((editedData?.content || editedData)?.exploration_recommendations?.research_methods);
                    updateTextAtPath(
                      isArray ? ['exploration_recommendations', 'research_methods', '0'] : ['exploration_recommendations', 'research_methods'],
                      e.target.value
                    );
                  }}
                  className="w-full px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              ) : (
                <p className="text-sm pl-4 break-words whitespace-normal">
                  {Array.isArray(reportData.exploration_recommendations.research_methods)
                    ? reportData.exploration_recommendations.research_methods[0]
                    : reportData.exploration_recommendations.research_methods || 'N/A'}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Success Metrics</h3>
              {isEditMode ? (
                <textarea
                  value={Array.isArray(reportData.exploration_recommendations.success_metrics)
                    ? reportData.exploration_recommendations.success_metrics[0]
                    : reportData.exploration_recommendations.success_metrics || ''}
                  onChange={(e) => {
                    const isArray = Array.isArray((editedData?.content || editedData)?.exploration_recommendations?.success_metrics);
                    updateTextAtPath(
                      isArray ? ['exploration_recommendations', 'success_metrics', '0'] : ['exploration_recommendations', 'success_metrics'],
                      e.target.value
                    );
                  }}
                  className="w-full px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              ) : (
                <p className="text-sm pl-4 break-words whitespace-normal">
                  {Array.isArray(reportData.exploration_recommendations.success_metrics)
                    ? reportData.exploration_recommendations.success_metrics[0]
                    : reportData.exploration_recommendations.success_metrics || 'N/A'}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Timeline</h3>
              {isEditMode ? (
                <textarea
                  value={Array.isArray(reportData.exploration_recommendations.timeline)
                    ? reportData.exploration_recommendations.timeline[0]
                    : reportData.exploration_recommendations.timeline || ''}
                  onChange={(e) => {
                    const isArray = Array.isArray((editedData?.content || editedData)?.exploration_recommendations?.timeline);
                    updateTextAtPath(
                      isArray ? ['exploration_recommendations', 'timeline', '0'] : ['exploration_recommendations', 'timeline'],
                      e.target.value
                    );
                  }}
                  className="w-full px-4 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              ) : (
                <p className="text-sm pl-4 break-words whitespace-normal">
                  {Array.isArray(reportData.exploration_recommendations.timeline)
                    ? reportData.exploration_recommendations.timeline[0]
                    : reportData.exploration_recommendations.timeline || 'N/A'}
                </p>
              )}
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
                  {Array.isArray(reportData.prioritization_rationale.methodology) ? (
                    reportData.prioritization_rationale.methodology.map((method: string, i: number) => (
                      <li key={i} className="text-sm">{method}</li>
                    ))
                  ) : (
                    <li className="text-sm">{reportData.prioritization_rationale.methodology}</li>
                  )}
                </ul>
              </div>
            )}

            {reportData.prioritization_rationale.impact_calculation && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Impact Calculation</h3>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {Array.isArray(reportData.prioritization_rationale.impact_calculation) ? (
                    reportData.prioritization_rationale.impact_calculation.map((calc: string, i: number) => (
                      <li key={i} className="text-sm">{calc}</li>
                    ))
                  ) : (
                    <li className="text-sm">{reportData.prioritization_rationale.impact_calculation}</li>
                  )}
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
