import { useState } from 'react';

interface OutcomeToBehaviorHMWReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const OutcomeToBehaviorHMWReportViewer = ({ data, onGenerateNew, projectId, onSave }: OutcomeToBehaviorHMWReportViewerProps) => {
  const [expandedTransformations, setExpandedTransformations] = useState<{[key: number]: boolean}>({});
  const [hoverTimer, setHoverTimer] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  const reportData = isEditMode ? editedData : (data?.content || data || {});

  const handleEditToggle = () => {
    if (!isEditMode) {
      const dataToEdit = (data?.content || data) || {};
      setOriginalData(structuredClone(dataToEdit));
      setEditedData(structuredClone(dataToEdit));
      setIsEditMode(true);
    }
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

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const confirmSave = async () => {
    setShowSaveDialog(false);
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(editedData);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        setOriginalData(null);
        setEditedData(null);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Save failed:', error);
      setErrorText(error instanceof Error ? error.message : 'Failed to save changes');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTextAtPath = (path: (string | number)[], value: any) => {
    setEditedData((prev: any) => {
      const updated = structuredClone(prev);
      let current = updated;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return updated;
    });
  };

  const updateArrayItemAtPath = (path: (string | number)[], index: number, value: any) => {
    setEditedData((prev: any) => {
      const updated = structuredClone(prev);
      let current = updated;
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      current[index] = value;
      return updated;
    });
  };

  const toggleTransformation = (idx: number) => {
    setExpandedTransformations(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleTransformationMouseEnter = (id: number) => {
    // Auto-expand after a short hover delay to preview content
    const timer = window.setTimeout(() => {
      setExpandedTransformations(prev => ({ ...prev, [id]: true }));
    }, 500);
    setHoverTimer(timer);
  };

  const handleTransformationMouseLeave = () => {
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  const formatValue = (v: any) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string' && v.trim().toLowerCase() === 'undefined') return '—';
    return v;
  };

  return (
    <div className="space-y-8">
      {/* Save Confirmation Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Changes?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to save these changes to the Outcome-to-Behavior HMW report?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Discard Changes?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to discard all your changes?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Changes saved successfully!
        </div>
      )}

      {/* Error Toast */}
      {showErrorMessage && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Error: {errorText}
        </div>
      )}

      {/* Header with Edit and Generate New Buttons */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Outcome-to-Behavior HMW Report</h1>
        <div className="flex gap-3">
          {projectId && onSave && (
            <button
              onClick={handleEditToggle}
              disabled={isEditMode}
              className="px-6 py-2 font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Edit
            </button>
          )}
          {onGenerateNew && (
            <button
              onClick={onGenerateNew}
              className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors rounded-lg"
            >
              Generate New
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="font-semibold text-blue-900">Edit Mode Active</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:bg-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Context */}
      {reportData.project_context && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Project Context</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Prioritized Pain Point</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.project_context.prioritized_pain_point || ''}
                  onChange={(e) => updateTextAtPath(['project_context', 'prioritized_pain_point'], e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-2">{formatValue(reportData.project_context.prioritized_pain_point)}</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Target Extreme User</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.project_context.target_extreme_user || ''}
                  onChange={(e) => updateTextAtPath(['project_context', 'target_extreme_user'], e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-2">{formatValue(reportData.project_context.target_extreme_user)}</p>
              )}
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
                onMouseEnter={() => handleTransformationMouseEnter(idx)}
                onMouseLeave={() => handleTransformationMouseLeave()}
                className="w-full text-left mb-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold pr-4">
                    Transformation {idx + 1}: {trans.outcome || 'Transformation'}
                  </h3>
                  <span className="text-2xl flex-shrink-0">{expandedTransformations[idx] ? '−' : '+'}</span>
                </div>
              </button>
              {expandedTransformations[idx] && (
                <div className="space-y-4 pl-4">
                  <div>
                    <h4 className="font-bold mb-1">Outcome</h4>
                    {isEditMode ? (
                      <textarea
                        value={trans.outcome || ''}
                        onChange={(e) => updateTextAtPath(['transformations', idx, 'outcome'], e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base">{formatValue(trans.outcome)}</p>
                    )}
                  </div>
                  {trans.behavior_analysis && (
                    <div>
                      <h4 className="font-bold mb-1">Behavior Analysis</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <span className="font-semibold">Core Behavior:</span>
                          {isEditMode ? (
                            <textarea
                              value={trans.behavior_analysis.core_behavior || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'behavior_analysis', 'core_behavior'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.behavior_analysis.core_behavior)}</p>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Measurement Criteria:</span>
                          {isEditMode ? (
                            <textarea
                              value={trans.behavior_analysis.measurement_criteria || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'behavior_analysis', 'measurement_criteria'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.behavior_analysis.measurement_criteria)}</p>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Ability Barriers:</span>
                          {isEditMode ? (
                            <div className="space-y-2 pl-4">
                              {trans.behavior_analysis.ability_barriers?.map((b: string, i: number) => (
                                <textarea
                                  key={i}
                                  value={b || ''}
                                  onChange={(e) => updateArrayItemAtPath(['transformations', idx, 'behavior_analysis', 'ability_barriers'], i, e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ))}
                            </div>
                          ) : (
                            <ul className="list-disc list-inside space-y-1 pl-4">
                              {trans.behavior_analysis.ability_barriers?.map((b: string, i: number) => (
                                <li key={i} className="text-sm">{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Extreme User Constraints:</span>
                          {isEditMode ? (
                            <div className="space-y-2 pl-4">
                              {trans.behavior_analysis.extreme_user_constraints?.map((c: string, i: number) => (
                                <textarea
                                  key={i}
                                  value={c || ''}
                                  onChange={(e) => updateArrayItemAtPath(['transformations', idx, 'behavior_analysis', 'extreme_user_constraints'], i, e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ))}
                            </div>
                          ) : (
                            <ul className="list-disc list-inside space-y-1 pl-4">
                              {trans.behavior_analysis.extreme_user_constraints?.map((c: string, i: number) => (
                                <li key={i} className="text-sm">{c}</li>
                              ))}
                            </ul>
                          )}
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
                          {isEditMode ? (
                            <textarea
                              value={trans.behavior_specification.specific_action || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'behavior_specification', 'specific_action'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.behavior_specification.specific_action)}</p>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Measurable Elements:</span>
                          {isEditMode ? (
                            <div className="space-y-2 pl-4">
                              {trans.behavior_specification.measurable_elements?.map((m: string, i: number) => (
                                <textarea
                                  key={i}
                                  value={m || ''}
                                  onChange={(e) => updateArrayItemAtPath(['transformations', idx, 'behavior_specification', 'measurable_elements'], i, e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ))}
                            </div>
                          ) : (
                            <ul className="list-disc list-inside space-y-1 pl-4">
                              {trans.behavior_specification.measurable_elements?.map((m: string, i: number) => (
                                <li key={i} className="text-sm">{m}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Observable Components:</span>
                          {isEditMode ? (
                            <div className="space-y-2 pl-4">
                              {trans.behavior_specification.observable_components?.map((o: string, i: number) => (
                                <textarea
                                  key={i}
                                  value={o || ''}
                                  onChange={(e) => updateArrayItemAtPath(['transformations', idx, 'behavior_specification', 'observable_components'], i, e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ))}
                            </div>
                          ) : (
                            <ul className="list-disc list-inside space-y-1 pl-4">
                              {trans.behavior_specification.observable_components?.map((o: string, i: number) => (
                                <li key={i} className="text-sm">{o}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Outcome Connection:</span>
                          {isEditMode ? (
                            <textarea
                              value={trans.behavior_specification.outcome_connection || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'behavior_specification', 'outcome_connection'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.behavior_specification.outcome_connection)}</p>
                          )}
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
                          {isEditMode ? (
                            <textarea
                              value={trans.ability_focused_constraint.primary_barrier || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'ability_focused_constraint', 'primary_barrier'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.ability_focused_constraint.primary_barrier)}</p>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Simplification Approach:</span>
                          {isEditMode ? (
                            <textarea
                              value={trans.ability_focused_constraint.simplification_approach || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'ability_focused_constraint', 'simplification_approach'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.ability_focused_constraint.simplification_approach)}</p>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Constraint Framing:</span>
                          {isEditMode ? (
                            <textarea
                              value={trans.ability_focused_constraint.constraint_framing || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'ability_focused_constraint', 'constraint_framing'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.ability_focused_constraint.constraint_framing)}</p>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Outcome Alignment:</span>
                          {isEditMode ? (
                            <textarea
                              value={trans.ability_focused_constraint.outcome_alignment || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'ability_focused_constraint', 'outcome_alignment'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.ability_focused_constraint.outcome_alignment)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {trans.hmw_statement && (
                    <div>
                      <h4 className="font-bold mb-1">HMW Statement</h4>
                      {isEditMode ? (
                        <textarea
                          value={trans.hmw_statement || ''}
                          onChange={(e) => updateTextAtPath(['transformations', idx, 'hmw_statement'], e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-base">{formatValue(trans.hmw_statement)}</p>
                      )}
                    </div>
                  )}
                  {trans.bj_fogg_validation && (
                    <div>
                      <h4 className="font-bold mb-1">BJ Fogg Validation</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <span className="font-semibold">Ability Focus:</span>
                          {isEditMode ? (
                            <textarea
                              value={trans.bj_fogg_validation.ability_focus || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'bj_fogg_validation', 'ability_focus'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.bj_fogg_validation.ability_focus)}</p>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Behavior Specificity:</span>
                          {isEditMode ? (
                            <textarea
                              value={trans.bj_fogg_validation.behavior_specificity || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'bj_fogg_validation', 'behavior_specificity'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.bj_fogg_validation.behavior_specificity)}</p>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Extreme User Enablement:</span>
                          {isEditMode ? (
                            <textarea
                              value={trans.bj_fogg_validation.extreme_user_enablement || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'bj_fogg_validation', 'extreme_user_enablement'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.bj_fogg_validation.extreme_user_enablement)}</p>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Outcome Achievement:</span>
                          {isEditMode ? (
                            <textarea
                              value={trans.bj_fogg_validation.outcome_achievement || ''}
                              onChange={(e) => updateTextAtPath(['transformations', idx, 'bj_fogg_validation', 'outcome_achievement'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-2">{formatValue(trans.bj_fogg_validation.outcome_achievement)}</p>
                          )}
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
              {isEditMode ? (
                <div className="space-y-2 pl-4">
                  {reportData.behavior_integration_analysis.behavior_pattern_themes?.map((t: string, i: number) => (
                    <textarea
                      key={i}
                      value={t || ''}
                      onChange={(e) => updateArrayItemAtPath(['behavior_integration_analysis', 'behavior_pattern_themes'], i, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {reportData.behavior_integration_analysis.behavior_pattern_themes?.map((t: string, i: number) => (
                    <li key={i} className="text-sm">{t}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Ability Simplification Strategies</h3>
              {isEditMode ? (
                <div className="space-y-2 pl-4">
                  {reportData.behavior_integration_analysis.ability_simplification_strategies?.map((s: string, i: number) => (
                    <textarea
                      key={i}
                      value={s || ''}
                      onChange={(e) => updateArrayItemAtPath(['behavior_integration_analysis', 'ability_simplification_strategies'], i, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {reportData.behavior_integration_analysis.ability_simplification_strategies?.map((s: string, i: number) => (
                    <li key={i} className="text-sm">{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {reportData.behavior_integration_analysis.extreme_user_enablement_coherence && (
            <div className="mt-8">
              <h3 className="font-semibold mb-2">Extreme User Enablement Coherence</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.behavior_integration_analysis.extreme_user_enablement_coherence || ''}
                  onChange={(e) => updateTextAtPath(['behavior_integration_analysis', 'extreme_user_enablement_coherence'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-2">{reportData.behavior_integration_analysis.extreme_user_enablement_coherence}</p>
              )}
            </div>
          )}
          {reportData.behavior_integration_analysis.outcome_achievement_pathway && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Outcome Achievement Pathway</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.behavior_integration_analysis.outcome_achievement_pathway || ''}
                  onChange={(e) => updateTextAtPath(['behavior_integration_analysis', 'outcome_achievement_pathway'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-2">{reportData.behavior_integration_analysis.outcome_achievement_pathway}</p>
              )}
            </div>
          )}
          {reportData.behavior_integration_analysis.implementation_feasibility_assessment && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Implementation Feasibility Assessment</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.behavior_integration_analysis.implementation_feasibility_assessment || ''}
                  onChange={(e) => updateTextAtPath(['behavior_integration_analysis', 'implementation_feasibility_assessment'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-2">{reportData.behavior_integration_analysis.implementation_feasibility_assessment}</p>
              )}
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
