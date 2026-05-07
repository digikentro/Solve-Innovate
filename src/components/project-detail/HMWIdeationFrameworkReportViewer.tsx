import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FiChevronDown, FiChevronUp, FiEdit3, FiRefreshCw, FiSave, FiX, FiCheckCircle, FiAlertCircle, FiZap, FiBox, FiPlusCircle, FiMinusCircle } from 'react-icons/fi';

interface HMWIdeationFrameworkReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const HMWIdeationFrameworkReportViewer = ({ data, onGenerateNew, projectId, onSave }: HMWIdeationFrameworkReportViewerProps) => {
  const [expandedIdeation, setExpandedIdeation] = useState<{[key: number]: boolean}>({ 0: true });
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
      setErrorText('Failed to save HMW Ideation Framework. Please try again.');
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
        <p className="text-xs text-gray-400 uppercase tracking-widest">No Ideation Data Available</p>
      </div>
    );
  }

  const toggleIdeation = (idx: number) => {
    setExpandedIdeation(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const renderIdeaCard = (idea: any, icon: any, label: string, pathPrefix: (string | number)[]) => (
    <div className="p-8 border border-gray-100 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
        <div className="text-gray-900">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Concept Name</span>
          {isEditMode ? (
            <input
              type="text"
              value={idea.idea_name || ''}
              onChange={(e) => updateTextAtPath([...pathPrefix, 'idea_name'], e.target.value)}
              className="w-full bg-white border border-gray-200 p-2 text-sm font-medium focus:outline-none transition-colors"
            />
          ) : (
            <p className="text-sm font-medium text-gray-900">{idea.idea_name}</p>
          )}
        </div>

        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Description</span>
          {isEditMode ? (
            <textarea
              value={idea.description || idea.original_solution || idea.added_feature || idea.removed_elements || ''}
              onChange={(e) => updateTextAtPath([...pathPrefix, idea.description ? 'description' : (idea.original_solution ? 'original_solution' : (idea.added_feature ? 'added_feature' : 'removed_elements'))], e.target.value)}
              rows={3}
              className="w-full bg-white border border-gray-100 p-3 text-xs focus:outline-none transition-colors resize-none"
            />
          ) : (
            <p className="text-xs text-gray-600 leading-relaxed">{idea.description || idea.original_solution || idea.added_feature || idea.removed_elements}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-50">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Behavior Enablement</span>
            {isEditMode ? (
              <textarea
                value={idea.behavior_enablement || ''}
                onChange={(e) => updateTextAtPath([...pathPrefix, 'behavior_enablement'], e.target.value)}
                rows={2}
                className="w-full bg-white border border-gray-100 p-3 text-xs focus:outline-none transition-colors resize-none"
              />
            ) : (
              <p className="text-xs text-gray-600 italic">"{idea.behavior_enablement}"</p>
            )}
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Implementation</span>
            {isEditMode ? (
              <textarea
                value={idea.implementation || idea.integration_method || idea.simplified_experience || ''}
                onChange={(e) => updateTextAtPath([...pathPrefix, idea.implementation ? 'implementation' : (idea.integration_method ? 'integration_method' : 'simplified_experience')], e.target.value)}
                rows={2}
                className="w-full bg-white border border-gray-100 p-3 text-xs focus:outline-none transition-colors resize-none"
              />
            ) : (
              <p className="text-xs text-gray-600">{idea.implementation || idea.integration_method || idea.simplified_experience}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

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
            <p className="mb-8 text-sm text-gray-600">Confirm permanent updates to the HMW Ideation Framework.</p>
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
            HMW Ideation
          </h1>
          <p className="mt-2 max-w-xl text-base leading-snug text-gray-500">
            Multi-Dimensional Solution Generation
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

      {/* HMW Ideation Clusters */}
      <div className="space-y-6">
        <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Solution Ideation Catalog</h2>
        
        {reportData.hmw_ideation?.map((hmw: any, idx: number) => (
          <div key={idx} className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <button
                onClick={() => toggleIdeation(idx)}
                className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">HMW 0{idx + 1}</span>
                  <span className="text-sm font-medium">{hmw.hmw_statement ? hmw.hmw_statement.substring(0, 50) + '...' : 'HMW Statement'}</span>
                </div>
                <span className="text-xs">{expandedIdeation[idx] ? 'CLOSE' : 'EXPAND'}</span>
              </button>
              
              {expandedIdeation[idx] && (
                <div className="border-t border-gray-100 bg-white p-6">
                  <div className="mb-6 space-y-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500 block">Full HMW Statement</span>
                    {isEditMode ? (
                      <textarea
                        value={hmw.hmw_statement || ''}
                        onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'hmw_statement'], e.target.value)}
                        rows={2}
                        className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-base leading-relaxed focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                      />
                    ) : (
                      <p className="text-base font-medium text-gray-900 italic">"{ hmw.hmw_statement }"</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {hmw.approach_1_simple_ideas?.map((idea: any, i: number) => 
                      renderIdeaCard(idea, <FiZap className="w-4 h-4" />, 'Approach 01: Direct', ['hmw_ideation', idx, 'approach_1_simple_ideas', i])
                    )}
                    {hmw.approach_2_outside_category_ideas?.map((idea: any, i: number) => 
                      renderIdeaCard(idea, <FiBox className="w-4 h-4" />, 'Approach 02: Analogy', ['hmw_ideation', idx, 'approach_2_outside_category_ideas', i])
                    )}
                    {hmw.approach_3_add_feature_ideas?.map((idea: any, i: number) => 
                      renderIdeaCard(idea, <FiPlusCircle className="w-4 h-4" />, 'Approach 03: Addition', ['hmw_ideation', idx, 'approach_3_add_feature_ideas', i])
                    )}
                    {hmw.approach_4_remove_feature_ideas?.map((idea: any, i: number) => 
                      renderIdeaCard(idea, <FiMinusCircle className="w-4 h-4" />, 'Approach 04: Reduction', ['hmw_ideation', idx, 'approach_4_remove_feature_ideas', i])
                    )}
                  </div>
                  
                  {hmw.cross_approach_synthesis && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 pt-8">
                      <label className="mb-8 block text-xs font-medium uppercase tracking-wide text-gray-500">Cross-Approach Synthesis</label>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                          { label: 'Complementary Paths', path: ['hmw_ideation', idx, 'cross_approach_synthesis', 'complementary_ideas'], value: hmw.cross_approach_synthesis.complementary_ideas },
                          { label: 'Implementation Priority', path: ['hmw_ideation', idx, 'cross_approach_synthesis', 'implementation_priority'], value: hmw.cross_approach_synthesis.implementation_priority },
                          { label: 'Extreme User Fit', path: ['hmw_ideation', idx, 'cross_approach_synthesis', 'extreme_user_preference'], value: hmw.cross_approach_synthesis.extreme_user_preference },
                          { label: 'Behavioral Impact', path: ['hmw_ideation', idx, 'cross_approach_synthesis', 'behavior_impact'], value: hmw.cross_approach_synthesis.behavior_impact }
                        ].map((field, fIdx) => (
                          <div key={fIdx} className="space-y-3">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">{field.label}</span>
                            {isEditMode ? (
                              <textarea
                                value={field.value || ''}
                                onChange={(e) => updateTextAtPath(field.path, e.target.value)}
                                rows={3}
                                className="min-h-[80px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                              />
                            ) : (
                              <p className="text-xs text-gray-600 leading-relaxed">{field.value}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Portfolio Analysis */}
      {reportData.portfolio_analysis && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Portfolio Effectiveness Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16 pb-16 border-b border-gray-100">
            <div className="space-y-10">
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Priority Concepts</label>
                <div className="space-y-3 pl-6 border-l border-gray-200">
                  {reportData.portfolio_analysis.next_steps_recommendations?.priority_ideas?.map((idea: string, i: number) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-sm font-bold text-gray-900">0{i+1}</span>
                      {isEditMode ? (
                        <input
                          value={idea || ''}
                          onChange={(e) => updateArrayItemAtPath(['portfolio_analysis', 'next_steps_recommendations', 'priority_ideas'], i, e.target.value)}
                          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 font-medium">{idea}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Prototype Candidates</label>
                <div className="space-y-3 pl-6 border-l border-gray-200">
                  {reportData.portfolio_analysis.next_steps_recommendations?.prototype_candidates?.map((candidate: string, i: number) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-sm font-bold text-gray-900 italic">C{i+1}</span>
                      {isEditMode ? (
                        <input
                          value={candidate || ''}
                          onChange={(e) => updateArrayItemAtPath(['portfolio_analysis', 'next_steps_recommendations', 'prototype_candidates'], i, e.target.value)}
                          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      ) : (
                        <p className="text-sm text-gray-600">{candidate}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Research Trajectory</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.portfolio_analysis.next_steps_recommendations?.research_needs || ''}
                    onChange={(e) => updateTextAtPath(['portfolio_analysis', 'next_steps_recommendations', 'research_needs'], e.target.value)}
                    rows={4}
                    className="min-h-[100px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed pl-4 border-l border-gray-200 italic">"{ reportData.portfolio_analysis.next_steps_recommendations?.research_needs }"</p>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block">Strategic Planning</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.portfolio_analysis.next_steps_recommendations?.implementation_planning || ''}
                    onChange={(e) => updateTextAtPath(['portfolio_analysis', 'next_steps_recommendations', 'implementation_planning'], e.target.value)}
                    rows={4}
                    className="min-h-[100px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed pl-4 border-l border-gray-200">{reportData.portfolio_analysis.next_steps_recommendations?.implementation_planning}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: 'Simple Ideas Effectiveness', path: ['portfolio_analysis', 'approach_effectiveness', 'simple_ideas_strengths'], value: reportData.portfolio_analysis.approach_effectiveness?.simple_ideas_strengths },
              { label: 'Analogy Insights', path: ['portfolio_analysis', 'approach_effectiveness', 'outside_category_insights'], value: reportData.portfolio_analysis.approach_effectiveness?.outside_category_insights },
              { label: 'Addition Opportunities', path: ['portfolio_analysis', 'approach_effectiveness', 'add_feature_opportunities'], value: reportData.portfolio_analysis.approach_effectiveness?.add_feature_opportunities },
              { label: 'Reduction Impact', path: ['portfolio_analysis', 'approach_effectiveness', 'remove_feature_impact'], value: reportData.portfolio_analysis.approach_effectiveness?.remove_feature_impact }
            ].map((field, fIdx) => (
              <div key={fIdx} className="space-y-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block">{field.label}</span>
                {isEditMode ? (
                  <textarea
                    value={field.value || ''}
                    onChange={(e) => updateTextAtPath(field.path, e.target.value)}
                    rows={3}
                    className="min-h-[80px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <p className="text-xs text-gray-600 leading-relaxed">{field.value}</p>
                )}
              </div>
            ))}
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
