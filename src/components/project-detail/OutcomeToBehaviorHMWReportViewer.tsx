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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorText, setErrorText] = useState('');
  
  const reportData = isEditMode ? editedData : (data?.content || data);

  const handleEditToggle = () => {
    if (!isEditMode) {
      const dataToEdit = data?.content || data;
      setEditedData(structuredClone(dataToEdit));
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
      setEditedData(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(editedData);
        setIsEditMode(false);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
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
      <div className="space-y-4">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">{label}</label>
        <div className="space-y-3 pl-4 border-l border-gray-100">
          {items.map((item: string, i: number) => (
            <div key={i} className="group relative">
              {isEditMode ? (
                <textarea
                  value={item || ''}
                  onChange={(e) => updateArrayItemAtPath(path, i, e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                />
              ) : (
                <div className="flex items-start gap-3 py-1">
                  <span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />
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
    <div className="space-y-12 max-w-5xl mx-auto pb-24">
      {/* Toast Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-8 right-8 bg-black text-white px-6 py-4 z-50 flex items-center gap-3 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-4">
          <FiCheckCircle className="w-4 h-4 text-white" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Framework Synchronized</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-100">
        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Outcome-to-Behavior</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em]">Phase 04 · Transformation Framework</p>
        </div>
        
        <div className="flex items-center gap-4">
          {!isEditMode ? (
            <>
              {onSave && (
                <Button
                  variant="outline"
                  onClick={handleEditToggle}
                  className="border-black text-black hover:bg-black hover:text-white rounded-none h-12 px-8 font-normal transition-all"
                >
                  <FiEdit3 className="mr-2 w-4 h-4" /> Edit Framework
                </Button>
              )}
              {onGenerateNew && (
                <Button
                  onClick={onGenerateNew}
                  className="bg-black text-white hover:bg-black/90 rounded-none h-12 px-8 font-normal transition-all"
                >
                  <FiRefreshCw className="mr-2 w-4 h-4" /> Regenerate
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleEditToggle}
                className="text-gray-400 hover:text-black rounded-none h-12 px-6 font-normal transition-all"
                disabled={isSaving}
              >
                <FiX className="mr-2 w-4 h-4" /> Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-black text-white hover:bg-black/90 rounded-none h-12 px-10 font-normal transition-all"
              >
                <FiSave className="mr-2 w-4 h-4" /> {isSaving ? 'Saving...' : 'Commit Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Project Context */}
      {reportData.project_context && (
        <section className="p-10 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-12">Foundation Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Prioritized Pain Point</label>
              {isEditMode ? (
                <textarea
                  value={reportData.project_context.prioritized_pain_point || ''}
                  onChange={(e) => updateTextAtPath(['project_context', 'prioritized_pain_point'], e.target.value)}
                  className="w-full bg-white border border-gray-200 p-4 text-sm font-medium focus:outline-none focus:border-black transition-colors resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-xl font-light text-gray-900 border-l-2 border-black pl-6 leading-tight">
                  {reportData.project_context.prioritized_pain_point}
                </p>
              )}
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Target Extreme User</label>
              {isEditMode ? (
                <textarea
                  value={reportData.project_context.target_extreme_user || ''}
                  onChange={(e) => updateTextAtPath(['project_context', 'target_extreme_user'], e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 leading-relaxed pl-6 border-l border-gray-100">
                  {reportData.project_context.target_extreme_user}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Transformations */}
      <div className="space-y-6">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] pl-2 mb-8">Transformation Pathways</h2>
        
        {reportData.transformations?.map((trans: any, idx: number) => (
          <div key={idx} className="border border-gray-100 group">
            <button
              onClick={() => toggleTransformation(idx)}
              className={`w-full p-8 text-left flex items-center justify-between transition-all ${expandedTransformations[idx] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-6">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${expandedTransformations[idx] ? 'opacity-70' : 'text-gray-400'}`}>Transformation 0{idx + 1}</span>
                <span className="text-sm font-medium tracking-wide uppercase">{trans.outcome || 'Strategic Outcome'}</span>
              </div>
              {expandedTransformations[idx] ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedTransformations[idx] && (
              <div className="p-10 bg-white border-t border-gray-100 space-y-12">
                {/* Outcome & Behavior Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Core Behavior</label>
                      {isEditMode ? (
                        <textarea
                          value={trans.behavior_analysis?.core_behavior || ''}
                          onChange={(e) => updateTextAtPath(['transformations', idx, 'behavior_analysis', 'core_behavior'], e.target.value)}
                          rows={2}
                          className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 border-l-2 border-black pl-6">{trans.behavior_analysis?.core_behavior}</p>
                      )}
                    </div>
                    <div className="space-y-6">
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Measurement Criteria</label>
                      {isEditMode ? (
                        <textarea
                          value={trans.behavior_analysis?.measurement_criteria || ''}
                          onChange={(e) => updateTextAtPath(['transformations', idx, 'behavior_analysis', 'measurement_criteria'], e.target.value)}
                          rows={2}
                          className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 pl-6 border-l border-gray-100">{trans.behavior_analysis?.measurement_criteria}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-12">
                    {renderEditableList(trans.behavior_analysis?.ability_barriers, ['transformations', idx, 'behavior_analysis', 'ability_barriers'], 'Ability Barriers')}
                    {renderEditableList(trans.behavior_analysis?.extreme_user_constraints, ['transformations', idx, 'behavior_analysis', 'extreme_user_constraints'], 'Extreme User Constraints')}
                  </div>
                </div>

                {/* Specification & Constraints */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-12 border-t border-gray-50">
                  <div className="space-y-8">
                    <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Behavior Specification</label>
                    <div className="space-y-6 pl-6 border-l border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">Specific Action</span>
                        {isEditMode ? (
                          <textarea
                            value={trans.behavior_specification?.specific_action || ''}
                            onChange={(e) => updateTextAtPath(['transformations', idx, 'behavior_specification', 'specific_action'], e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-gray-100 p-3 text-sm focus:outline-none transition-colors resize-none"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 font-medium">{trans.behavior_specification?.specific_action}</p>
                        )}
                      </div>
                      {renderEditableList(trans.behavior_specification?.measurable_elements, ['transformations', idx, 'behavior_specification', 'measurable_elements'], 'Measurable Elements')}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Ability-Focused Constraint</label>
                    <div className="space-y-6 pl-6 border-l border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">Primary Barrier</span>
                        {isEditMode ? (
                          <textarea
                            value={trans.ability_focused_constraint?.primary_barrier || ''}
                            onChange={(e) => updateTextAtPath(['transformations', idx, 'ability_focused_constraint', 'primary_barrier'], e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-gray-100 p-3 text-sm focus:outline-none transition-colors resize-none"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 font-medium">{trans.ability_focused_constraint?.primary_barrier}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">Simplification Approach</span>
                        {isEditMode ? (
                          <textarea
                            value={trans.ability_focused_constraint?.simplification_approach || ''}
                            onChange={(e) => updateTextAtPath(['transformations', idx, 'ability_focused_constraint', 'simplification_approach'], e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-gray-100 p-3 text-sm focus:outline-none transition-colors resize-none"
                          />
                        ) : (
                          <p className="text-sm text-gray-600">{trans.ability_focused_constraint?.simplification_approach}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* HMW Statement - Highlighted */}
                <div className="pt-12 border-t border-gray-50">
                  <div className="p-10 border border-black bg-white flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-shrink-0">
                      <span className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.4em] transform -rotate-90 block">HMW Statement</span>
                    </div>
                    <div className="flex-1 w-full">
                      {isEditMode ? (
                        <textarea
                          value={trans.hmw_statement || ''}
                          onChange={(e) => updateTextAtPath(['transformations', idx, 'hmw_statement'], e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-gray-200 p-4 text-lg font-light focus:outline-none transition-colors resize-none"
                        />
                      ) : (
                        <h3 className="text-2xl font-light text-gray-900 italic leading-snug">
                          "{trans.hmw_statement}"
                        </h3>
                      )}
                    </div>
                  </div>
                </div>

                {/* BJ Fogg Validation */}
                <div className="pt-12 border-t border-gray-50">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-8">Behavioral Design Validation (BJ Fogg)</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                      { label: 'Ability Focus', path: ['transformations', idx, 'bj_fogg_validation', 'ability_focus'], value: trans.bj_fogg_validation?.ability_focus },
                      { label: 'Specificity', path: ['transformations', idx, 'bj_fogg_validation', 'behavior_specificity'], value: trans.bj_fogg_validation?.behavior_specificity },
                      { label: 'Enablement', path: ['transformations', idx, 'bj_fogg_validation', 'extreme_user_enablement'], value: trans.bj_fogg_validation?.extreme_user_enablement },
                      { label: 'Outcome Link', path: ['transformations', idx, 'bj_fogg_validation', 'outcome_achievement'], value: trans.bj_fogg_validation?.outcome_achievement }
                    ].map((val, vIdx) => (
                      <div key={vIdx} className="space-y-3">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">{val.label}</span>
                        {isEditMode ? (
                          <textarea
                            value={val.value || ''}
                            onChange={(e) => updateTextAtPath(val.path, e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-gray-100 p-3 text-xs focus:outline-none transition-colors resize-none"
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
        <section className="p-10 border border-black">
          <h2 className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.3em] mb-12">Integration Synthesis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {renderEditableList(reportData.behavior_integration_analysis.behavior_pattern_themes, ['behavior_integration_analysis', 'behavior_pattern_themes'], 'Behavioral Themes')}
            {renderEditableList(reportData.behavior_integration_analysis.ability_simplification_strategies, ['behavior_integration_analysis', 'ability_simplification_strategies'], 'Simplification Strategies')}
          </div>

          <div className="grid grid-cols-1 gap-12 mt-16 pt-12 border-t border-gray-100">
            <div className="space-y-6">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Coherence Analysis</label>
              {isEditMode ? (
                <textarea
                  value={reportData.behavior_integration_analysis.extreme_user_enablement_coherence || ''}
                  onChange={(e) => updateTextAtPath(['behavior_integration_analysis', 'extreme_user_enablement_coherence'], e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-100">{reportData.behavior_integration_analysis.extreme_user_enablement_coherence}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-6">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Achievement Pathway</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.behavior_integration_analysis.outcome_achievement_pathway || ''}
                    onChange={(e) => updateTextAtPath(['behavior_integration_analysis', 'outcome_achievement_pathway'], e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-100">{reportData.behavior_integration_analysis.outcome_achievement_pathway}</p>
                )}
              </div>
              <div className="space-y-6">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Implementation Feasibility</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.behavior_integration_analysis.implementation_feasibility_assessment || ''}
                    onChange={(e) => updateTextAtPath(['behavior_integration_analysis', 'implementation_feasibility_assessment'], e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-100">{reportData.behavior_integration_analysis.implementation_feasibility_assessment}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Metadata */}
      {data.generated_at && (
        <div className="text-[10px] text-gray-400 text-center pt-12 border-t border-gray-100 uppercase tracking-[0.3em]">
          Analysis Synchronized on {new Date(data.generated_at).toLocaleString()} — Advanced Research Logic
        </div>
      )}
    </div>
  );
};
