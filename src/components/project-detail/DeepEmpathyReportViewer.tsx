import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

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

  const updateTextAtPath = (path: string[], value: string) => {    setEditedData((prev: any) => {
      const cloneObj = (obj: any, p: (string | number)[]): any => {
        if (p.length === 0) return value;
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

  const updateArrayItemAtPath = (path: string[], index: number, value: string) => {    setEditedData((prev: any) => {
      const fullPath = [...path, index];
      const cloneObj = (obj: any, p: (string | number)[]): any => {
        if (p.length === 0) return value;
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
        <div className="w-8 h-8 text-gray-200 mb-4">⚠</div>
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
      <div>
        <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">{label}</label>
        <ul className="space-y-3 border-l border-gray-200 pl-4">
          {items.map((item: string, i: number) => (
            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
              {isEditMode ? (
                <textarea
                  value={item || ''}
                  onChange={(e) => updateArrayItemAtPath(path, i, e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-900 transition-colors resize-none rounded-lg"
                />
              ) : (
                <>
                  <span className="mt-1.5 w-1 h-1 bg-gray-900 rounded-md flex-shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Toast Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-900">✓ Report saved successfully</p>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn rounded-xl border border-red-200 bg-white px-6 py-4 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600">✗ {errorText || 'Failed to save changes'}</p>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Deep Empathy Research</h1>
          <p className="mt-2 max-w-xl text-base leading-snug text-gray-500">Phase 02 · Qualitative Exploration Guide</p>
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
                    onClick={handleEditToggle}
                    disabled={isSaving}
                    className="rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-lg bg-gray-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
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
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Generate New
            </button>
          )}
        </div>
      </div>

      {/* Research Context */}
      {reportData.researchContextAnalysis && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Research Context</h2>
          
          <div className="flex flex-col gap-10">
            <div>
              <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Core Pain Point</label>
              {isEditMode ? (
                <textarea
                  value={reportData.researchContextAnalysis.painPoint || ''}
                  onChange={(e) => updateTextAtPath(['researchContextAnalysis', 'painPoint'], e.target.value)}
                  className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  rows={3}
                />
              ) : (
                <p className="border-l border-gray-200 pl-4 text-sm leading-relaxed text-gray-600">{reportData.researchContextAnalysis.painPoint}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Contextual Description</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.researchContextAnalysis.description || ''}
                    onChange={(e) => updateTextAtPath(['researchContextAnalysis', 'description'], e.target.value)}
                    rows={4}
                    className="min-h-[100px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                ) : (
                  <p className="border-l border-gray-200 pl-4 text-sm leading-relaxed text-gray-600">{reportData.researchContextAnalysis.description}</p>
                )}
              </div>
              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Target Extreme User</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.researchContextAnalysis.extremeUser || ''}
                    onChange={(e) => updateTextAtPath(['researchContextAnalysis', 'extremeUser'], e.target.value)}
                    rows={3}
                    className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                ) : (
                  <p className="border-l border-gray-200 pl-4 text-sm leading-relaxed text-gray-600">{reportData.researchContextAnalysis.extremeUser}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empathy Techniques */}
      <div className="flex flex-col gap-4">
        <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Empathy Methodologies</h2>
        
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
          <div key={section.key} className="overflow-hidden rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection(section.key)}
              className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${expandedSections[section.key] ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium uppercase tracking-wide ${expandedSections[section.key] ? 'opacity-70' : 'text-gray-500'}`}>{section.label}</span>
              </div>
              <span className="text-xs">{expandedSections[section.key] ? 'CLOSE' : 'EXPAND'}</span>
            </button>
            {expandedSections[section.key] && (
              <div className="flex flex-col gap-4 bg-white p-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {section.fields.map((field, fIdx) => (
                    <div key={fIdx}>
                      {renderEditableList(field.items, field.path, field.label)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Technique 5: Deep Conversation - Specialized Layout */}
        {reportData.empathyTechnique5Conversation?.deepInterviewQuestions && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <button
              onClick={() => toggleSection('conversation')}
              className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${expandedSections['conversation'] ? 'bg-gray-900 text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-medium uppercase tracking-wide ${expandedSections['conversation'] ? 'opacity-70' : 'text-gray-500'}`}>Technique 05: Deep Conversation</span>
              </div>
              <span className="text-xs">{expandedSections['conversation'] ? 'CLOSE' : 'EXPAND'}</span>
            </button>

            {expandedSections['conversation'] && (
              <div className="flex flex-col gap-4 bg-white p-6 border-t border-gray-200">
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
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Synthesis Framework</h2>
          
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {renderEditableList(reportData.insightSynthesisFramework.beliefInsights, ['insightSynthesisFramework', 'beliefInsights'], 'Expected Belief Insights')}
            {renderEditableList(reportData.insightSynthesisFramework.behavioralInsights, ['insightSynthesisFramework', 'behavioralInsights'], 'Expected Behavioral Insights')}
            {renderEditableList(reportData.insightSynthesisFramework.innovationOpportunities, ['insightSynthesisFramework', 'innovationOpportunities'], 'Innovation Opportunities')}
            {renderEditableList(reportData.insightSynthesisFramework.designImplications, ['insightSynthesisFramework', 'designImplications'], 'Strategic Design Implications')}
          </div>
        </section>
      )}

      {/* Footer Metadata */}
      {data.generated_at && (
        <div className="text-[10px] text-gray-400 text-center pt-8 border-t border-gray-100 uppercase tracking-[0.3em]">
          Analysis Synchronized on {new Date(data.generated_at).toLocaleString()} — Advanced Research Logic
        </div>
      )}
    </div>
  );
};
