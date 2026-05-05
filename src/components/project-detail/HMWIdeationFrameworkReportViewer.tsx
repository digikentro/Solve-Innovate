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
      const cloneObj = (obj: any, p: (string | number)[]): any => {
        if (!p || p.length === 0) return value;
        const head = p[0];
        const rest = p.slice(1);
        if (Array.isArray(obj)) {
          const arr = [...obj];
          arr[head as number] = cloneObj(obj[head as number], rest);
          return arr;
        } else if (obj !== null && typeof obj === 'object') {
          return {
            ...obj,
            [head]: cloneObj(obj[head], rest)
          };
        }
        return obj;
      };
      return cloneObj(prev, path);
    });
  };

  const updateArrayItemAtPath = (path: (string | number)[], index: number, value: any) => {
    setEditedData((prev: any) => {
      const fullPath = [...path, index];
      const cloneObj = (obj: any, p: (string | number)[]): any => {
        if (!p || p.length === 0) return value;
        const head = p[0];
        const rest = p.slice(1);
        if (Array.isArray(obj)) {
          const arr = [...obj];
          arr[head as number] = cloneObj(obj[head as number], rest);
          return arr;
        } else if (obj !== null && typeof obj === 'object') {
          return {
            ...obj,
            [head]: cloneObj(obj[head], rest)
          };
        }
        return obj;
      };
      return cloneObj(prev, fullPath);
    });
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
    <div className="space-y-12 max-w-6xl mx-auto pb-24">
      {/* Toast Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-8 right-8 bg-black text-white px-6 py-4 z-50 flex items-center gap-3 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-4">
          <FiCheckCircle className="w-4 h-4 text-white" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Strategy Synchronized</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-100">
        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-tight text-gray-900">HMW Ideation</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em]">Phase 05 · Multi-Dimensional Solution Generation</p>
        </div>
        
        <div className="flex items-center gap-4">
          {!isEditMode ? (
            <>
              {onSave && (
                <Button
                  variant="outline"
                  onClick={handleEditToggle}
                  className="border-black text-black hover:bg-black hover:text-white rounded-md h-12 px-8 font-normal transition-all"
                >
                  <FiEdit3 className="mr-2 w-4 h-4" /> Edit Framework
                </Button>
              )}
              {onGenerateNew && (
                <Button
                  onClick={onGenerateNew}
                  className="bg-black text-white hover:bg-black/90 rounded-md h-12 px-8 font-normal transition-all"
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
                className="text-gray-400 hover:text-black rounded-md h-12 px-6 font-normal transition-all"
                disabled={isSaving}
              >
                <FiX className="mr-2 w-4 h-4" /> Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-black text-white hover:bg-black/90 rounded-md h-12 px-10 font-normal transition-all"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> : <FiSave className="mr-2 w-4 h-4 inline" />} {isSaving ? 'Saving...' : 'Commit Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Foundation Context */}
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

      {/* HMW Ideation Clusters */}
      <div className="space-y-12">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] pl-2 mb-8">Solution Ideation catalog</h2>
        
        {reportData.hmw_ideation?.map((hmw: any, idx: number) => (
          <div key={idx} className="space-y-8">
            <div className="p-10 border border-black bg-white flex flex-col md:flex-row items-center gap-12">
              <div className="flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.4em] transform -rotate-90 block">HMW 0{idx + 1}</span>
              </div>
              <div className="flex-1 w-full">
                {isEditMode ? (
                  <textarea
                    value={hmw.hmw_statement || ''}
                    onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'hmw_statement'], e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-gray-200 p-4 text-2xl font-light focus:outline-none transition-colors resize-none"
                  />
                ) : (
                  <h3 className="text-3xl font-light text-gray-900 leading-snug italic">
                    "{hmw.hmw_statement}"
                  </h3>
                )}
              </div>
              <button
                onClick={() => toggleIdeation(idx)}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                {expandedIdeation[idx] ? <FiChevronUp className="w-6 h-6" /> : <FiChevronDown className="w-6 h-6" />}
              </button>
            </div>

            {expandedIdeation[idx] && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
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
            )}
            
            {expandedIdeation[idx] && hmw.cross_approach_synthesis && (
              <div className="p-10 border border-gray-100 bg-gray-50/50">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-8">Cross-Approach Synthesis</label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  {[
                    { label: 'Complementary Paths', path: ['hmw_ideation', idx, 'cross_approach_synthesis', 'complementary_ideas'], value: hmw.cross_approach_synthesis.complementary_ideas },
                    { label: 'Implementation Priority', path: ['hmw_ideation', idx, 'cross_approach_synthesis', 'implementation_priority'], value: hmw.cross_approach_synthesis.implementation_priority },
                    { label: 'Extreme User Fit', path: ['hmw_ideation', idx, 'cross_approach_synthesis', 'extreme_user_preference'], value: hmw.cross_approach_synthesis.extreme_user_preference },
                    { label: 'Behavioral Impact', path: ['hmw_ideation', idx, 'cross_approach_synthesis', 'behavior_impact'], value: hmw.cross_approach_synthesis.behavior_impact }
                  ].map((field, fIdx) => (
                    <div key={fIdx} className="space-y-3">
                      <span className="text-[10px] font-semibold text-gray-900 uppercase tracking-widest block">{field.label}</span>
                      {isEditMode ? (
                        <textarea
                          value={field.value || ''}
                          onChange={(e) => updateTextAtPath(field.path, e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-gray-200 p-3 text-xs focus:outline-none transition-colors resize-none"
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
        ))}
      </div>

      {/* Portfolio Analysis */}
      {reportData.portfolio_analysis && (
        <section className="p-10 border border-black">
          <h2 className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.3em] mb-12">Portfolio Effectiveness Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16 pb-16 border-b border-gray-100">
            <div className="space-y-12">
              <div className="space-y-4">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Priority Concepts</label>
                <div className="space-y-4 pl-4 border-l border-gray-100">
                  {reportData.portfolio_analysis.next_steps_recommendations?.priority_ideas?.map((idea: string, i: number) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-sm font-bold text-gray-900">0{i+1}</span>
                      {isEditMode ? (
                        <input
                          value={idea || ''}
                          onChange={(e) => updateArrayItemAtPath(['portfolio_analysis', 'next_steps_recommendations', 'priority_ideas'], i, e.target.value)}
                          className="flex-1 bg-white border border-gray-200 p-2 text-sm focus:outline-none transition-colors"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 font-medium">{idea}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Prototype Candidates</label>
                <div className="space-y-4 pl-4 border-l border-gray-100">
                  {reportData.portfolio_analysis.next_steps_recommendations?.prototype_candidates?.map((candidate: string, i: number) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-sm font-bold text-gray-900 italic">C{i+1}</span>
                      {isEditMode ? (
                        <input
                          value={candidate || ''}
                          onChange={(e) => updateArrayItemAtPath(['portfolio_analysis', 'next_steps_recommendations', 'prototype_candidates'], i, e.target.value)}
                          className="flex-1 bg-white border border-gray-200 p-2 text-sm focus:outline-none transition-colors"
                        />
                      ) : (
                        <p className="text-sm text-gray-600">{candidate}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-6">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Research Trajectory</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.portfolio_analysis.next_steps_recommendations?.research_needs || ''}
                    onChange={(e) => updateTextAtPath(['portfolio_analysis', 'next_steps_recommendations', 'research_needs'], e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-100 italic">"{reportData.portfolio_analysis.next_steps_recommendations?.research_needs}"</p>
                )}
              </div>
              <div className="space-y-6">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Strategic Planning</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.portfolio_analysis.next_steps_recommendations?.implementation_planning || ''}
                    onChange={(e) => updateTextAtPath(['portfolio_analysis', 'next_steps_recommendations', 'implementation_planning'], e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-100">{reportData.portfolio_analysis.next_steps_recommendations?.implementation_planning}</p>
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
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{field.label}</span>
                {isEditMode ? (
                  <textarea
                    value={field.value || ''}
                    onChange={(e) => updateTextAtPath(field.path, e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-100 p-3 text-[10px] focus:outline-none transition-colors resize-none"
                  />
                ) : (
                  <p className="text-[10px] text-gray-500 uppercase tracking-tight leading-relaxed">{field.value}</p>
                )}
              </div>
            ))}
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
