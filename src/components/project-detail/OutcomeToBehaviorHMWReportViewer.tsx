import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FiChevronDown, FiChevronUp, FiEdit3, FiRefreshCw, FiSave, FiX, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';

interface OutcomeToBehaviorHMWReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const OutcomeToBehaviorHMWReportViewer = ({ data, onGenerateNew, projectId, onSave }: OutcomeToBehaviorHMWReportViewerProps) => {
  const [expandedTransformations, setExpandedTransformations] = useState<{[key: number]: boolean}>({ 0: true });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const reportData = isEditMode && editedData ? editedData?.content || editedData : data?.content || data;

  const handleEditToggle = () => {
    if (!isEditMode) {
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
      setOriginalData(structuredClone(editedData));
      setIsEditMode(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setErrorText('Failed to save Transformation Framework. Please try again.');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTextAtPath = (path: (string | number)[], value: any) => {
    const clone = structuredClone(editedData || data);
    let current: any = clone?.content || clone;
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) return;
      current = current[path[i]];
    }
    const lastKey = path[path.length - 1];
    current[lastKey] = value;
    setEditedData(clone?.content ? { ...clone } : clone);
  };

  const updateArrayItemAtPath = (path: (string | number)[], index: number, value: any) => {
    const fullPath = [...path, index];
    updateTextAtPath(fullPath, value);
  };

    if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-gray-100">
        <FiAlertCircle className="w-8 h-8 text-gray-200 mb-4" />
        <p className="text-xs text-gray-400 uppercase tracking-widest">No Transformation Data Available</p>
      </div>
    );
  }

  const toggleTransformation = (idx: number) => {
    setExpandedTransformations(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const renderEditableList = (items: string[] | undefined, path: (string | number)[], label: string) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">{label}</label>
        <div className="space-y-3 pl-6 border-l border-gray-200">
          {items.map((item: string, i: number) => (
            <div key={i} className="group relative">
              {isEditMode ? (
                <textarea
                  value={item || ''}
                  onChange={(e) => updateArrayItemAtPath(path, i, e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              ) : (
                <div className="flex items-start gap-3 py-1">
                  <span className="mt-1.5 w-1 h-1 bg-black rounded-md flex-shrink-0" />
                  <p className="text-sm text-gray-600 leading-relaxed">{item}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Messages & Dialogs */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-900">✓ Framework saved successfully</p>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn rounded-xl border border-red-200 bg-white px-6 py-4 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600">✗ {errorText}</p>
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Save Changes?</h3>
            <p className="mb-8 text-sm text-gray-600">Confirm permanent updates to the Transformation Framework.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-xs font-medium uppercase tracking-widest text-gray-900 hover:bg-gray-50">Go Back</button>
              <button onClick={confirmSave} className="flex-1 rounded-xl bg-black px-4 py-3 text-xs font-medium uppercase tracking-widest text-white hover:bg-black/90">Save Now</button>
            </div>
          </div>
        </div>
      )}

      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Discard Changes?</h3>
            <p className="mb-8 text-sm text-gray-600">Unsaved modifications will be permanently lost.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowCancelDialog(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-xs font-medium uppercase tracking-widest text-gray-900 hover:bg-gray-50">Keep Editing</button>
              <button onClick={confirmCancel} className="flex-1 rounded-xl bg-black px-4 py-3 text-xs font-medium uppercase tracking-widest text-white hover:bg-black/90">Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-6">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-gray-500">Status</span>
            <span className="text-sm font-medium text-gray-900">Edit Mode Active — Modification enabled</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Outcome-to-Behavior
          </h1>
          <p className="mt-2 max-w-xl text-base leading-snug text-gray-500">
            Transformation Framework
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
          {projectId && onSave && (
            <>
              {!isEditMode ? (
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-900 transition-colors hover:bg-gray-50"
                >
                  Edit Report
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-lg bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-black/90 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-1.5 inline size-3 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
          {onGenerateNew && (
            <button
              type="button"
              onClick={onGenerateNew}
              disabled={isEditMode}
              className="rounded-lg bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate New
            </button>
          )}
        </div>
      </div>

      {/* Project Context */}
      {reportData.project_context && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Foundation Analysis</h2>
          
          <div className="flex flex-col gap-10">
            <div>
              <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Prioritized Pain Point</label>
              {isEditMode ? (
                <textarea
                  value={reportData.project_context.prioritized_pain_point || ''}
                  onChange={(e) => updateTextAtPath(['project_context', 'prioritized_pain_point'], e.target.value)}
                  className="min-h-[100px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  rows={3}
                />
              ) : (
                <p className="border-l-2 border-gray-900 pl-4 text-base leading-relaxed text-gray-900">
                  {reportData.project_context.prioritized_pain_point}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Target Extreme User</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.project_context.target_extreme_user || ''}
                    onChange={(e) => updateTextAtPath(['project_context', 'target_extreme_user'], e.target.value)}
                    rows={3}
                    className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <p className="border-l border-gray-200 pl-4 text-sm leading-relaxed text-gray-600">
                    {reportData.project_context.target_extreme_user}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Transformations */}
      <div className="space-y-6">
        <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Transformation Pathways</h2>
        
        {reportData.transformations?.map((trans: any, idx: number) => (
          <div key={idx} className="overflow-hidden rounded-xl border border-gray-200">
            <button
              onClick={() => toggleTransformation(idx)}
              className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${expandedTransformations[idx] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium uppercase tracking-wide ${expandedTransformations[idx] ? 'opacity-70' : 'text-gray-500'}`}>Transformation 0{idx + 1}</span>
                <span className="text-sm font-medium">{trans.outcome || 'Strategic Outcome'}</span>
              </div>
              <span className="text-xs">{expandedTransformations[idx] ? 'CLOSE' : 'EXPAND'}</span>
            </button>
            
            {expandedTransformations[idx] && (
              <div className="flex flex-col gap-4 bg-white p-6 border-t border-gray-100 space-y-8">
                {/* Outcome & Behavior Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Core Behavior</label>
                      {isEditMode ? (
                        <textarea
                          value={trans.behavior_analysis?.core_behavior || ''}
                          onChange={(e) => updateTextAtPath(['transformations', idx, 'behavior_analysis', 'core_behavior'], e.target.value)}
                          rows={2}
                          className="min-h-[60px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 border-l-2 border-black pl-4">{trans.behavior_analysis?.core_behavior}</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Measurement Criteria</label>
                      {isEditMode ? (
                        <textarea
                          value={trans.behavior_analysis?.measurement_criteria || ''}
                          onChange={(e) => updateTextAtPath(['transformations', idx, 'behavior_analysis', 'measurement_criteria'], e.target.value)}
                          rows={2}
                          className="min-h-[60px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 pl-4 border-l border-gray-200">{trans.behavior_analysis?.measurement_criteria}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8">
                    {renderEditableList(trans.behavior_analysis?.ability_barriers, ['transformations', idx, 'behavior_analysis', 'ability_barriers'], 'Ability Barriers')}
                    {renderEditableList(trans.behavior_analysis?.extreme_user_constraints, ['transformations', idx, 'behavior_analysis', 'extreme_user_constraints'], 'Extreme User Constraints')}
                  </div>
                </div>

                {/* Specification & Constraints */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-12 border-t border-gray-100">
                  <div className="space-y-8">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Behavior Specification</label>
                    <div className="space-y-6 pl-6 border-l border-gray-200">
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Specific Action</span>
                        {isEditMode ? (
                          <textarea
                            value={trans.behavior_specification?.specific_action || ''}
                            onChange={(e) => updateTextAtPath(['transformations', idx, 'behavior_specification', 'specific_action'], e.target.value)}
                            rows={2}
                            className="min-h-[60px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 font-medium">{trans.behavior_specification?.specific_action}</p>
                        )}
                      </div>
                      {renderEditableList(trans.behavior_specification?.measurable_elements, ['transformations', idx, 'behavior_specification', 'measurable_elements'], 'Measurable Elements')}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <label className="text-xs font-medium uppercase tracking-wide text-gray-500">Ability-Focused Constraint</label>
                    <div className="space-y-6 pl-6 border-l border-gray-200">
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Primary Barrier</span>
                        {isEditMode ? (
                          <textarea
                            value={trans.ability_focused_constraint?.primary_barrier || ''}
                            onChange={(e) => updateTextAtPath(['transformations', idx, 'ability_focused_constraint', 'primary_barrier'], e.target.value)}
                            rows={2}
                            className="min-h-[60px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 font-medium">{trans.ability_focused_constraint?.primary_barrier}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wide block mb-2">Simplification Approach</span>
                        {isEditMode ? (
                          <textarea
                            value={trans.ability_focused_constraint?.simplification_approach || ''}
                            onChange={(e) => updateTextAtPath(['transformations', idx, 'ability_focused_constraint', 'simplification_approach'], e.target.value)}
                            rows={2}
                            className="min-h-[60px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                          />
                        ) : (
                          <p className="text-sm text-gray-600">{trans.ability_focused_constraint?.simplification_approach}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* HMW Statement - Highlighted */}
                <div className="pt-12 border-t border-gray-100">
                  <div className="rounded-xl border border-gray-200 bg-white p-8 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">HMW Statement</span>
                    </div>
                    <div className="flex-1 w-full">
                      {isEditMode ? (
                        <textarea
                          value={trans.hmw_statement || ''}
                          onChange={(e) => updateTextAtPath(['transformations', idx, 'hmw_statement'], e.target.value)}
                          rows={3}
                          className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-base leading-relaxed focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      ) : (
                        <h3 className="text-lg font-medium text-gray-900 leading-relaxed italic">
                          "{trans.hmw_statement}"
                        </h3>
                      )}
                    </div>
                  </div>
                </div>

                {/* BJ Fogg Validation */}
                <div className="pt-12 border-t border-gray-100">
                  <label className="mb-8 block text-xs font-medium uppercase tracking-wide text-gray-500">Behavioral Design Validation (BJ Fogg)</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                      { label: 'Ability Focus', path: ['transformations', idx, 'bj_fogg_validation', 'ability_focus'], value: trans.bj_fogg_validation?.ability_focus },
                      { label: 'Specificity', path: ['transformations', idx, 'bj_fogg_validation', 'behavior_specificity'], value: trans.bj_fogg_validation?.behavior_specificity },
                      { label: 'Enablement', path: ['transformations', idx, 'bj_fogg_validation', 'extreme_user_enablement'], value: trans.bj_fogg_validation?.extreme_user_enablement },
                      { label: 'Outcome Link', path: ['transformations', idx, 'bj_fogg_validation', 'outcome_achievement'], value: trans.bj_fogg_validation?.outcome_achievement }
                    ].map((val, vIdx) => (
                      <div key={vIdx} className="space-y-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">{val.label}</span>
                        {isEditMode ? (
                          <textarea
                            value={val.value || ''}
                            onChange={(e) => updateTextAtPath(val.path, e.target.value)}
                            rows={3}
                            className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                          />
                        ) : (
                          <p className="text-xs text-gray-600 leading-relaxed">{val.value}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Behavior Integration Analysis */}
      {reportData.behavior_integration_analysis && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Integration Synthesis</h2>
          
          <div className="flex flex-col gap-10">
            {renderEditableList(reportData.behavior_integration_analysis.behavior_pattern_themes, ['behavior_integration_analysis', 'behavior_pattern_themes'], 'Behavioral Themes')}
            {renderEditableList(reportData.behavior_integration_analysis.ability_simplification_strategies, ['behavior_integration_analysis', 'ability_simplification_strategies'], 'Simplification Strategies')}
          </div>

          <div className="grid grid-cols-1 gap-12 mt-16 pt-12 border-t border-gray-100">
            <div className="space-y-6">
              <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Coherence Analysis</label>
              {isEditMode ? (
                <textarea
                  value={reportData.behavior_integration_analysis.extreme_user_enablement_coherence || ''}
                  onChange={(e) => updateTextAtPath(['behavior_integration_analysis', 'extreme_user_enablement_coherence'], e.target.value)}
                  rows={3}
                  className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              ) : (
                <p className="text-sm leading-relaxed text-gray-600 border-l border-gray-200 pl-4">{reportData.behavior_integration_analysis.extreme_user_enablement_coherence}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-6">
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Achievement Pathway</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.behavior_integration_analysis.outcome_achievement_pathway || ''}
                    onChange={(e) => updateTextAtPath(['behavior_integration_analysis', 'outcome_achievement_pathway'], e.target.value)}
                    rows={3}
                    className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <p className="text-sm leading-relaxed text-gray-600 border-l border-gray-200 pl-4">{reportData.behavior_integration_analysis.outcome_achievement_pathway}</p>
                )}
              </div>
              <div className="space-y-6">
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Implementation Feasibility</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.behavior_integration_analysis.implementation_feasibility_assessment || ''}
                    onChange={(e) => updateTextAtPath(['behavior_integration_analysis', 'implementation_feasibility_assessment'], e.target.value)}
                    rows={3}
                    className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <p className="text-sm leading-relaxed text-gray-600 border-l border-gray-200 pl-4">{reportData.behavior_integration_analysis.implementation_feasibility_assessment}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Metadata */}
      {data.generated_at && (
        <div className="text-xs text-gray-500 text-center pt-8 border-t border-gray-100 uppercase tracking-widest">
          Analysis Synchronized on {new Date(data.generated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
};
