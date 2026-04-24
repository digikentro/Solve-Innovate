import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FiChevronDown, FiChevronUp, FiEdit3, FiRefreshCw, FiSave, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

interface DeepEmpathyReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const DeepEmpathyReportViewer = ({ data, onGenerateNew, projectId, onSave }: DeepEmpathyReportViewerProps) => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    observation: true,
    immersion: false,
    roleplaying: false,
    shadowing: false,
    conversation: false
  });
  
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
      console.error('Failed to save:', error);
      setErrorText(error instanceof Error ? error.message : 'Failed to save changes');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTextAtPath = (path: string[], value: string) => {
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

  const updateArrayItemAtPath = (path: string[], index: number, value: string) => {
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
        <p className="text-xs text-gray-400 uppercase tracking-widest">No Deep Empathy Research Data</p>
      </div>
    );
  }

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderEditableList = (items: string[] | undefined, path: string[], label: string) => {
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
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Changes Synchronized</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-100">
        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Deep Empathy Research</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em]">Phase 02 · Qualitative Exploration Guide</p>
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
                  <FiEdit3 className="mr-2 w-4 h-4" /> Edit Report
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

      {/* Research Context */}
      {reportData.researchContextAnalysis && (
        <section className="p-10 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-12">Research Context</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-6">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Core Pain Point</label>
              {isEditMode ? (
                <textarea
                  value={reportData.researchContextAnalysis.painPoint || ''}
                  onChange={(e) => updateTextAtPath(['researchContextAnalysis', 'painPoint'], e.target.value)}
                  className="w-full bg-white border border-gray-200 p-4 text-sm font-medium focus:outline-none focus:border-black transition-colors resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-xl font-light text-gray-900 border-l-2 border-black pl-6 leading-tight">
                  {reportData.researchContextAnalysis.painPoint}
                </p>
              )}
            </div>

            <div className="md:col-span-2 space-y-12">
              <div className="space-y-6">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Contextual Description</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.researchContextAnalysis.description || ''}
                    onChange={(e) => updateTextAtPath(['researchContextAnalysis', 'description'], e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-100">
                    {reportData.researchContextAnalysis.description}
                  </p>
                )}
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Target Extreme User</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.researchContextAnalysis.extremeUser || ''}
                    onChange={(e) => updateTextAtPath(['researchContextAnalysis', 'extremeUser'], e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 leading-relaxed pl-6 border-l border-gray-100">
                    {reportData.researchContextAnalysis.extremeUser}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empathy Techniques */}
      <div className="space-y-6">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] pl-2 mb-8">Empathy Methodologies</h2>
        
        {/* Methodology Sections */}
        {[
          { key: 'observation', label: 'Technique 01: Observation', data: reportData.empathyTechnique1Observation, 
            fields: [
              { label: 'Focus Areas', path: ['empathyTechnique1Observation', 'observationFocusAreas'], items: reportData.empathyTechnique1Observation?.observationFocusAreas },
              { label: 'Documentation Requirements', path: ['empathyTechnique1Observation', 'whatToDocument'], items: reportData.empathyTechnique1Observation?.whatToDocument },
              { label: 'Critical Observation Questions', path: ['empathyTechnique1Observation', 'keyQuestionsForObservation'], items: reportData.empathyTechnique1Observation?.keyQuestionsForObservation }
            ]
          },
          { key: 'immersion', label: 'Technique 02: Immersion', data: reportData.empathyTechnique2Immersion,
            fields: [
              { label: 'Immersion Activities', path: ['empathyTechnique2Immersion', 'immersionActivities'], items: reportData.empathyTechnique2Immersion?.immersionActivities },
              { label: 'Experience Parameters', path: ['empathyTechnique2Immersion', 'whatToExperience'], items: reportData.empathyTechnique2Immersion?.whatToExperience },
              { label: 'Insights to Capture', path: ['empathyTechnique2Immersion', 'keyInsightsToCapture'], items: reportData.empathyTechnique2Immersion?.keyInsightsToCapture }
            ]
          },
          { key: 'roleplaying', label: 'Technique 03: Role-Playing', data: reportData.empathyTechnique3RolePlaying,
            fields: [
              { label: 'Scenarios', path: ['empathyTechnique3RolePlaying', 'rolePlayingScenarios'], items: reportData.empathyTechnique3RolePlaying?.rolePlayingScenarios },
              { label: 'Variable Parameters', path: ['empathyTechnique3RolePlaying', 'rolePlayingVariables'], items: reportData.empathyTechnique3RolePlaying?.rolePlayingVariables },
              { label: 'Key Research Questions', path: ['empathyTechnique3RolePlaying', 'keyQuestionsForRolePlaying'], items: reportData.empathyTechnique3RolePlaying?.keyQuestionsForRolePlaying }
            ]
          },
          { key: 'shadowing', label: 'Technique 04: Shadowing', data: reportData.empathyTechnique4Shadowing,
            fields: [
              { label: 'Focus Areas', path: ['empathyTechnique4Shadowing', 'shadowingFocusAreas'], items: reportData.empathyTechnique4Shadowing?.shadowingFocusAreas },
              { label: 'Documentation Guidelines', path: ['empathyTechnique4Shadowing', 'shadowingDocumentation'], items: reportData.empathyTechnique4Shadowing?.shadowingDocumentation },
              { label: 'Expected Critical Insights', path: ['empathyTechnique4Shadowing', 'keyInsightsFromShadowing'], items: reportData.empathyTechnique4Shadowing?.keyInsightsFromShadowing }
            ]
          }
        ].map((section) => section.data && (
          <div key={section.key} className="border border-gray-100 group">
            <button
              onClick={() => toggleSection(section.key)}
              className={`w-full p-8 text-left flex items-center justify-between transition-all ${expandedSections[section.key] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <span className="text-sm font-medium tracking-wide uppercase">{section.label}</span>
              {expandedSections[section.key] ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections[section.key] && (
              <div className="p-10 bg-white grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-gray-100">
                {section.fields.map((field, fIdx) => (
                  <div key={fIdx}>
                    {renderEditableList(field.items, field.path, field.label)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Technique 5: Deep Conversation - Specialized Layout */}
        {reportData.empathyTechnique5Conversation?.deepInterviewQuestions && (
          <div className="border border-gray-100">
            <button
              onClick={() => toggleSection('conversation')}
              className={`w-full p-8 text-left flex items-center justify-between transition-all ${expandedSections['conversation'] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <span className="text-sm font-medium tracking-wide uppercase">Technique 05: Deep Conversation</span>
              {expandedSections['conversation'] ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
            </button>

            {expandedSections['conversation'] && (
              <div className="p-10 bg-white border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                  {[
                    { label: 'Opening Questions', path: ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'openingQuestions'], items: reportData.empathyTechnique5Conversation.deepInterviewQuestions.openingQuestions },
                    { label: 'Belief-Uncovering Questions', path: ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'beliefUncoveringQuestions'], items: reportData.empathyTechnique5Conversation.deepInterviewQuestions.beliefUncoveringQuestions },
                    { label: 'Behavior-Exploring Questions', path: ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'behaviorExploringQuestions'], items: reportData.empathyTechnique5Conversation.deepInterviewQuestions.behaviorExploringQuestions },
                    { label: 'Context-Deepening Questions', path: ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'contextDeepeningQuestions'], items: reportData.empathyTechnique5Conversation.deepInterviewQuestions.contextDeepeningQuestions },
                    { label: 'Innovation Opportunity Questions', path: ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'innovationOpportunityQuestions'], items: reportData.empathyTechnique5Conversation.deepInterviewQuestions.innovationOpportunityQuestions },
                    { label: 'Critical Follow-Up Probes', path: ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'followUpProbes'], items: reportData.empathyTechnique5Conversation.deepInterviewQuestions.followUpProbes }
                  ].map((field, idx) => field.items && (
                    <div key={idx} className="space-y-4">
                      {renderEditableList(field.items, field.path, field.label)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Insight Synthesis Framework */}
      {reportData.insightSynthesisFramework && (
        <section className="p-10 border border-black">
          <h2 className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.3em] mb-12">Synthesis Framework</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {renderEditableList(reportData.insightSynthesisFramework.beliefInsights, ['insightSynthesisFramework', 'beliefInsights'], 'Expected Belief Insights')}
            {renderEditableList(reportData.insightSynthesisFramework.behavioralInsights, ['insightSynthesisFramework', 'behavioralInsights'], 'Expected Behavioral Insights')}
            {renderEditableList(reportData.insightSynthesisFramework.innovationOpportunities, ['insightSynthesisFramework', 'innovationOpportunities'], 'Innovation Opportunities')}
            {renderEditableList(reportData.insightSynthesisFramework.designImplications, ['insightSynthesisFramework', 'designImplications'], 'Strategic Design Implications')}
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
