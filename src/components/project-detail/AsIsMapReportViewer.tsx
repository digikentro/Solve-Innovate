import { Loader2 } from 'lucide-react';
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

  const reportData = isEditMode && editedData ? editedData?.content || editedData : data?.content || data;

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
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) return;
      current = current[path[i]];
    }
    const lastKey = path[path.length - 1];
    current[lastKey] = value;
    setEditedData(clone?.content ? { ...clone } : clone);
  };

  return (
    <div className="space-y-8">
      {/* Messages & Dialogs */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-6 py-4 border border-white/20 shadow-2xl animate-fadeIn">
          <p className="text-[10px] font-bold uppercase tracking-widest">✓ Report saved successfully</p>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white px-6 py-4 border border-red-500 shadow-2xl animate-fadeIn">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">✗ {errorText}</p>
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-black shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Save Changes?</h3>
            <p className="text-sm text-gray-500 mb-8">Confirm permanent updates to the As-Is Map data structure.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowSaveDialog(false)} className="flex-1 px-4 py-3 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-gray-50">Go Back</button>
              <button onClick={confirmSave} className="flex-1 px-4 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-black/90">Save Now</button>
            </div>
          </div>
        </div>
      )}

      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-black shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Discard Changes?</h3>
            <p className="text-sm text-gray-500 mb-8">Unsaved modifications will be permanently lost.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowCancelDialog(false)} className="flex-1 px-4 py-3 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-gray-50">Keep Editing</button>
              <button onClick={confirmCancel} className="flex-1 px-4 py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700">Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-black text-white p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest opacity-60">Status</span>
            <span className="text-sm font-medium">Edit Mode Active — Modification enabled</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="pb-8 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">As-Is Map</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Operational landscape report</p>
        </div>
        <div className="flex items-center gap-4">
          {projectId && onSave && (
            <>
              {!isEditMode ? (
                <button onClick={handleEditToggle} className="px-8 h-10 border border-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all">Edit Report</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancel} disabled={isSaving} className="px-6 h-10 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black disabled:opacity-50">Discard</button>
                  <button onClick={handleSave} disabled={isSaving} className="px-8 h-10 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-black/90 disabled:opacity-50">{isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Saving...</> : 'Save Changes'}</button>
                </div>
              )}
            </>
          )}
          {onGenerateNew && (
            <button onClick={onGenerateNew} disabled={isEditMode} className="px-8 h-10 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed">Generate New</button>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      {reportData.hmw_statement_analysis && (
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Executive Summary</h2>
          <div className="space-y-12">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Problem Statement</label>
              {isEditMode ? (
                <textarea
                  value={Array.isArray(reportData.hmw_statement_analysis.hmw) ? reportData.hmw_statement_analysis.hmw[0] : reportData.hmw_statement_analysis.hmw || ''}
                  onChange={(e) => updateTextAtPath(Array.isArray(reportData.hmw_statement_analysis.hmw) ? ['hmw_statement_analysis', 'hmw', '0'] : ['hmw_statement_analysis', 'hmw'], e.target.value)}
                  className="w-full bg-white border border-gray-200 py-3 px-4 text-sm focus:outline-none focus:border-black min-h-[100px] resize-none"
                />
              ) : (
                <p className="text-base text-gray-900 leading-relaxed border-l border-black pl-6">{Array.isArray(reportData.hmw_statement_analysis.hmw) ? reportData.hmw_statement_analysis.hmw[0] : reportData.hmw_statement_analysis.hmw || 'N/A'}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Target Users</label>
                {isEditMode ? (
                  <textarea
                    value={Array.isArray(reportData.hmw_statement_analysis.target_users) ? reportData.hmw_statement_analysis.target_users[0] : reportData.hmw_statement_analysis.target_users || ''}
                    onChange={(e) => updateTextAtPath(Array.isArray(reportData.hmw_statement_analysis.target_users) ? ['hmw_statement_analysis', 'target_users', '0'] : ['hmw_statement_analysis', 'target_users'], e.target.value)}
                    className="w-full bg-white border border-gray-200 py-3 px-4 text-sm focus:outline-none focus:border-black min-h-[80px] resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-6">{Array.isArray(reportData.hmw_statement_analysis.target_users) ? reportData.hmw_statement_analysis.target_users[0] : reportData.hmw_statement_analysis.target_users || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Core Need</label>
                {isEditMode ? (
                  <textarea
                    value={Array.isArray(reportData.hmw_statement_analysis.core_need) ? reportData.hmw_statement_analysis.core_need[0] : reportData.hmw_statement_analysis.core_need || ''}
                    onChange={(e) => updateTextAtPath(Array.isArray(reportData.hmw_statement_analysis.core_need) ? ['hmw_statement_analysis', 'core_need', '0'] : ['hmw_statement_analysis', 'core_need'], e.target.value)}
                    className="w-full bg-white border border-gray-200 py-3 px-4 text-sm focus:outline-none focus:border-black min-h-[80px] resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-6">{Array.isArray(reportData.hmw_statement_analysis.core_need) ? reportData.hmw_statement_analysis.core_need[0] : reportData.hmw_statement_analysis.core_need || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Journey Map */}
      {reportData.as_is_map?.stages && (
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Current State Journey Map</h2>
          <div className="space-y-6">
            {reportData.as_is_map.stages.map((stage: any, index: number) => (
              <div key={stage.id} className="border border-gray-100">
                {isEditMode ? (
                  <div className="w-full px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stage {stage.id}</span>
                    <input type="text" value={stage.stage_name} onChange={(e) => updateTextAtPath(['as_is_map', 'stages', index.toString(), 'stage_name'], e.target.value)} className="flex-1 bg-white border border-gray-200 px-3 py-1 text-sm focus:outline-none focus:border-black" />
                    <button onClick={() => toggleStage(stage.id)} className="text-sm font-bold uppercase tracking-widest px-2">{expandedStages[stage.id] ? 'CLOSE' : 'OPEN'}</button>
                  </div>
                ) : (
                  <button onClick={() => toggleStage(stage.id)} className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors ${expandedStages[stage.id] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${expandedStages[stage.id] ? 'opacity-70' : 'text-gray-400'}`}>Stage 0{stage.id}</span>
                      <span className="text-sm font-medium">{stage.stage_name}</span>
                    </div>
                    <span className="text-xs">{expandedStages[stage.id] ? 'CLOSE' : 'EXPAND'}</span>
                  </button>
                )}
                {expandedStages[stage.id] && (
                  <div className="p-6 space-y-4 bg-white">
                    {stage.steps.map((step: any, stepIdx: number) => {
                      const currentNumber = (stepOffsets[index] || 0) + stepIdx + 1;
                      return (
                        <div key={`${stage.id}-${step.id}-${currentNumber}`} className="flex items-start gap-4 p-4 border-l-2 border-gray-100 group hover:border-black">
                          <span className="text-[10px] font-bold text-gray-300 mt-0.5 w-6 group-hover:text-black">{currentNumber.toString().padStart(2, '0')}</span>
                          {isEditMode ? (
                            <textarea value={step.description} onChange={(e) => updateTextAtPath(['as_is_map', 'stages', index.toString(), 'steps', stepIdx.toString(), 'description'], e.target.value)} className="flex-1 bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]" />
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pain Point Analysis */}
      {reportData.pain_point_analysis?.steps && (
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Pain Point Analysis</h2>
          <div className="overflow-x-auto border border-gray-100">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-[10px] text-gray-400 font-bold uppercase tracking-widest py-4 px-6 text-left w-24">Stage</th>
                  <th className="text-[10px] text-gray-400 font-bold uppercase tracking-widest py-4 px-6 text-left w-24">Step</th>
                  <th className="text-[10px] text-gray-400 font-bold uppercase tracking-widest py-4 px-6 text-left w-32">Pain Level</th>
                  <th className="text-[10px] text-gray-400 font-bold uppercase tracking-widest py-4 px-6 text-left">Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportData.pain_point_analysis.steps.map((pain: any, painIdx: number) => (
                  <tr key={painIdx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-xs font-medium text-gray-900">{pain.stage_id}</td>
                    <td className="py-4 px-6 text-xs font-medium text-gray-900">{pain.step_id}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{pain.pain_level}/10</span>
                        <div className="w-16 h-1 bg-gray-100 overflow-hidden">
                          <div className="h-full bg-black transition-all duration-500" style={{ width: `${pain.pain_level * 10}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {isEditMode ? (
                        <textarea value={pain.description} onChange={(e) => updateTextAtPath(['pain_point_analysis', 'steps', painIdx.toString(), 'description'], e.target.value)} className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]" />
                      ) : (
                        <p className="text-xs text-gray-600 leading-relaxed">{pain.description}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Priority Bottlenecks */}
      {reportData.pareto_prioritization?.top_bottlenecks && (
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Priority Bottlenecks (Pareto Analysis)</h2>
          <div className="space-y-4">
            {reportData.pareto_prioritization.top_bottlenecks.map((bottleneck: any, index: number) => (
              <div key={index} className="border border-gray-100">
                <button onClick={() => toggleBottleneck(index)} className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors ${expandedBottlenecks[index] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-6">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${expandedBottlenecks[index] ? 'opacity-70' : 'text-gray-400'}`}>Rank 0{index + 1}</span>
                    <span className="text-sm font-medium">Stage {bottleneck.stage_id} · Step {bottleneck.step_id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 border ${expandedBottlenecks[index] ? 'border-white/20 text-white' : 'border-black/10 text-gray-600'}`}>PAIN: {bottleneck.pain_level}/10</span>
                  </div>
                  <span className="text-xs">{expandedBottlenecks[index] ? 'CLOSE' : 'EXPAND'}</span>
                </button>
                {expandedBottlenecks[index] && (
                  <div className="p-8 space-y-10 border-t border-gray-100 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Evidence of Bottleneck</label>
                        <ul className="space-y-3 border-l border-gray-100 pl-6">
                          {bottleneck.bottleneck_evidence?.map((evidence: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />{evidence}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Why 80% Impact</label>
                        <ul className="space-y-3 border-l border-gray-100 pl-6">
                          {bottleneck.why_80_percent_impact?.map((impact: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />{impact}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Ripple Effects</label>
                        <ul className="space-y-3 border-l border-gray-100 pl-6">
                          {bottleneck.ripple_effects?.map((effect: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />{effect}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Current Solutions Gap</label>
                        <ul className="space-y-3 border-l border-gray-100 pl-6">
                          {bottleneck.current_solutions_gap?.map((gap: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />{gap}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="pt-8 border-t border-gray-100">
                      <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-4">Hypothesis for Exploration</label>
                      <div className="bg-gray-50 p-6 border-l-2 border-black">
                        <ul className="space-y-2">
                          {bottleneck.hypothesis_for_exploration?.map((hypothesis: string, i: number) => (
                            <li key={i} className="text-sm font-medium text-gray-900">{hypothesis}</li>
                          ))}
                        </ul>
                      </div>
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
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">MECE Validation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Mutually Exclusive</label>
              <ul className="space-y-3 border-l border-gray-100 pl-6">
                {reportData.mece_validation.mutually_exclusive_check?.map((check: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />{check}</li>
                ))}
              </ul>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Collectively Exhaustive</label>
              <ul className="space-y-3 border-l border-gray-100 pl-6">
                {reportData.mece_validation.collectively_exhaustive_check?.map((check: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />{check}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Exploration Recommendations */}
      {reportData.exploration_recommendations && (
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Exploration Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Primary Focus</label>
              {isEditMode ? (
                <textarea value={Array.isArray(reportData.exploration_recommendations.primary_focus) ? reportData.exploration_recommendations.primary_focus[0] : reportData.exploration_recommendations.primary_focus || ''} onChange={(e) => updateTextAtPath(Array.isArray(reportData.exploration_recommendations.primary_focus) ? ['exploration_recommendations', 'primary_focus', '0'] : ['exploration_recommendations', 'primary_focus'], e.target.value)} className="w-full bg-white border border-gray-200 py-3 px-4 text-sm focus:outline-none focus:border-black min-h-[80px] resize-none" />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-6">{Array.isArray(reportData.exploration_recommendations.primary_focus) ? reportData.exploration_recommendations.primary_focus[0] : reportData.exploration_recommendations.primary_focus || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Research Methods</label>
              {isEditMode ? (
                <textarea value={Array.isArray(reportData.exploration_recommendations.research_methods) ? reportData.exploration_recommendations.research_methods[0] : reportData.exploration_recommendations.research_methods || ''} onChange={(e) => updateTextAtPath(Array.isArray(reportData.exploration_recommendations.research_methods) ? ['exploration_recommendations', 'research_methods', '0'] : ['exploration_recommendations', 'research_methods'], e.target.value)} className="w-full bg-white border border-gray-200 py-3 px-4 text-sm focus:outline-none focus:border-black min-h-[80px] resize-none" />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-6">{Array.isArray(reportData.exploration_recommendations.research_methods) ? reportData.exploration_recommendations.research_methods[0] : reportData.exploration_recommendations.research_methods || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Success Metrics</label>
              {isEditMode ? (
                <textarea value={Array.isArray(reportData.exploration_recommendations.success_metrics) ? reportData.exploration_recommendations.success_metrics[0] : reportData.exploration_recommendations.success_metrics || ''} onChange={(e) => updateTextAtPath(Array.isArray(reportData.exploration_recommendations.success_metrics) ? ['exploration_recommendations', 'success_metrics', '0'] : ['exploration_recommendations', 'success_metrics'], e.target.value)} className="w-full bg-white border border-gray-200 py-3 px-4 text-sm focus:outline-none focus:border-black min-h-[80px] resize-none" />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-6">{Array.isArray(reportData.exploration_recommendations.success_metrics) ? reportData.exploration_recommendations.success_metrics[0] : reportData.exploration_recommendations.success_metrics || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Timeline</label>
              {isEditMode ? (
                <textarea value={Array.isArray(reportData.exploration_recommendations.timeline) ? reportData.exploration_recommendations.timeline[0] : reportData.exploration_recommendations.timeline || ''} onChange={(e) => updateTextAtPath(Array.isArray(reportData.exploration_recommendations.timeline) ? ['exploration_recommendations', 'timeline', '0'] : ['exploration_recommendations', 'timeline'], e.target.value)} className="w-full bg-white border border-gray-200 py-3 px-4 text-sm focus:outline-none focus:border-black min-h-[80px] resize-none" />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-6">{Array.isArray(reportData.exploration_recommendations.timeline) ? reportData.exploration_recommendations.timeline[0] : reportData.exploration_recommendations.timeline || 'N/A'}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Prioritization Rationale */}
      {reportData.prioritization_rationale && (
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Prioritization Rationale</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {reportData.prioritization_rationale.methodology && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Methodology</label>
                <ul className="space-y-3 border-l border-gray-100 pl-6">
                  {Array.isArray(reportData.prioritization_rationale.methodology) ? reportData.prioritization_rationale.methodology.map((method: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />{method}</li>
                  )) : <li className="text-sm text-gray-600 border-l border-gray-100 pl-6">{reportData.prioritization_rationale.methodology}</li>}
                </ul>
              </div>
            )}
            {reportData.prioritization_rationale.impact_calculation && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Impact Calculation</label>
                <ul className="space-y-3 border-l border-gray-100 pl-6">
                  {Array.isArray(reportData.prioritization_rationale.impact_calculation) ? reportData.prioritization_rationale.impact_calculation.map((calc: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />{calc}</li>
                  )) : <li className="text-sm text-gray-600 border-l border-gray-100 pl-6">{reportData.prioritization_rationale.impact_calculation}</li>}
                </ul>
              </div>
            )}
            {reportData.prioritization_rationale.confidence_level && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Confidence Level</label>
                <p className="text-sm text-gray-900 font-medium border-l border-black pl-6">{reportData.prioritization_rationale.confidence_level}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Credible Sources */}
      {reportData.credible_sources && reportData.credible_sources.length > 0 && (
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Credible Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportData.credible_sources.map((source: any, index: number) => (
              <div key={index} className="p-6 border border-gray-50 hover:border-black group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">{source.title}</h3>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">{source.relevance}</p>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-black border-b border-black/10 hover:border-black">View Full Source</a>
                  </div>
                  <span className="text-[10px] font-bold text-gray-300 group-hover:text-black">REF-0{index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Metadata */}
      {data.generated_at && (
        <div className="text-[10px] text-gray-400 text-center pt-8 border-t border-gray-100 uppercase tracking-[0.2em]">
          Generated on {new Date(data.generated_at).toLocaleString()} — Solver Labs Research Engine
        </div>
      )}
    </div>
  );
};
