import { useState } from 'react';

interface DeepEmpathyReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const DeepEmpathyReportViewer = ({ data, onGenerateNew, projectId, onSave }: DeepEmpathyReportViewerProps) => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [hoverSectionKey, setHoverSectionKey] = useState<string | null>(null);
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

  const reportData = (isEditMode ? editedData : (data?.content || data)) || {};

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
        setOriginalData(null);
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
      <div className="text-center py-12">
        <p className="text-gray-500">No Deep Empathy Research data available</p>
      </div>
    );
  }

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSectionMouseEnter = (key: string) => {
    setHoverSectionKey(key);
    // Auto-expand the section after a brief hover to preview content
    const timer = window.setTimeout(() => {
      setExpandedSections(prev => ({ ...prev, [key]: true }));
    }, 500);
    setHoverTimer(timer);
  };

  const handleSectionMouseLeave = (key: string) => {
    setHoverSectionKey(prev => (prev === key ? null : prev));
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  const renderList = (items: string[] | undefined, path: string[], emptyMessage: string = 'No items available') => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-gray-500 italic pl-4">{emptyMessage}</p>;
    }
    
    if (isEditMode) {
      return (
        <div className="space-y-2 pl-4">
          {items.map((item: string, i: number) => (
            <textarea
              key={i}
              value={item || ''}
              onChange={(e) => updateArrayItemAtPath(path, i, e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
            />
          ))}
        </div>
      );
    }
    
    return (
      <ul className="list-disc list-inside space-y-1 pl-4">
        {items.map((item: string, i: number) => (
          <li key={i} className="text-sm">{item}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-8">
      {/* Confirmation Dialogs */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Changes?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to save these changes to the Deep Empathy Research report?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Discard Changes?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to discard all changes? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Changes saved successfully!</span>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{errorText || 'Failed to save changes'}</span>
        </div>
      )}

      {/* Header with Edit and Generate New Buttons */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Deep Empathy Research Report</h1>
        <div className="flex items-center gap-3">
          {!isEditMode && projectId && onSave && (
            <button
              onClick={handleEditToggle}
              className="px-6 py-2 text-[0.85rem] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-md"
            >
              Edit
            </button>
          )}
          {onGenerateNew && (
            <button
              onClick={onGenerateNew}
              className="px-6 py-2 text-[0.85rem] font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors rounded-md"
            >
              Generate New
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <span className="text-blue-800 font-medium">Edit Mode - Click on text fields to edit</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-[0.85rem] font-semibold bg-gray-600 text-white hover:bg-gray-700 transition-colors rounded-md"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-[0.85rem] font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors rounded-md"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Research Context Analysis */}
      {reportData.researchContextAnalysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Research Context</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Pain Point</h3>
              {isEditMode ? (
                <input
                  type="text"
                  value={reportData.researchContextAnalysis.painPoint || ''}
                  onChange={(e) => updateTextAtPath(['researchContextAnalysis', 'painPoint'], e.target.value)}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-4">{reportData.researchContextAnalysis.painPoint}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.researchContextAnalysis.description || ''}
                  onChange={(e) => updateTextAtPath(['researchContextAnalysis', 'description'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-4 leading-relaxed">{reportData.researchContextAnalysis.description}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Target Extreme User</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.researchContextAnalysis.extremeUser || ''}
                  onChange={(e) => updateTextAtPath(['researchContextAnalysis', 'extremeUser'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-4 leading-relaxed">{reportData.researchContextAnalysis.extremeUser}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Technique 1: Observation */}
      {reportData.empathyTechnique1Observation && (
        <section className="p-6 bg-gray-50">
          <button
            onClick={() => toggleSection('observation')}
            onMouseEnter={() => handleSectionMouseEnter('observation')}
            onMouseLeave={() => handleSectionMouseLeave('observation')}
            className={`w-full text-left mb-4 px-4 py-3 transition-all duration-200 ${hoverSectionKey === 'observation' ? 'bg-gray-200 shadow-md scale-[1.01]' : ''}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pb-2">Technique 1: Observation</h2>
              <span className={`text-2xl transition-transform duration-200 ${hoverSectionKey === 'observation' ? 'translate-y-[-1px]' : ''}`}>{expandedSections['observation'] ? '−' : '+'}</span>
            </div>
          </button>

          {expandedSections['observation'] && (
            <div className="space-y-4 pl-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Focus Areas</h3>
                {renderList(reportData.empathyTechnique1Observation.observationFocusAreas, ['empathyTechnique1Observation', 'observationFocusAreas'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">What to Document</h3>
                {renderList(reportData.empathyTechnique1Observation.whatToDocument, ['empathyTechnique1Observation', 'whatToDocument'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Key Questions for Observation</h3>
                {renderList(reportData.empathyTechnique1Observation.keyQuestionsForObservation, ['empathyTechnique1Observation', 'keyQuestionsForObservation'])}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Technique 2: Immersion */}
      {reportData.empathyTechnique2Immersion && (
        <section className="p-6 bg-gray-50">
          <button
            onClick={() => toggleSection('immersion')}
            onMouseEnter={() => handleSectionMouseEnter('immersion')}
            onMouseLeave={() => handleSectionMouseLeave('immersion')}
            className={`w-full text-left mb-4 px-4 py-3 transition-all duration-200 ${hoverSectionKey === 'immersion' ? 'bg-gray-200 shadow-md scale-[1.01]' : ''}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pb-2">Technique 2: Immersion</h2>
              <span className={`text-2xl transition-transform duration-200 ${hoverSectionKey === 'immersion' ? 'translate-y-[-1px]' : ''}`}>{expandedSections['immersion'] ? '−' : '+'}</span>
            </div>
          </button>

          {expandedSections['immersion'] && (
            <div className="space-y-4 pl-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Immersion Activities</h3>
                {renderList(reportData.empathyTechnique2Immersion.immersionActivities, ['empathyTechnique2Immersion', 'immersionActivities'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">What to Experience</h3>
                {renderList(reportData.empathyTechnique2Immersion.whatToExperience, ['empathyTechnique2Immersion', 'whatToExperience'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Documentation Guidelines</h3>
                {renderList(reportData.empathyTechnique2Immersion.immersionDocumentation, ['empathyTechnique2Immersion', 'immersionDocumentation'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Key Insights to Capture</h3>
                {renderList(reportData.empathyTechnique2Immersion.keyInsightsToCapture, ['empathyTechnique2Immersion', 'keyInsightsToCapture'])}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Technique 3: Role-Playing */}
      {reportData.empathyTechnique3RolePlaying && (
        <section className="p-6 bg-gray-50">
          <button
            onClick={() => toggleSection('roleplaying')}
            onMouseEnter={() => handleSectionMouseEnter('roleplaying')}
            onMouseLeave={() => handleSectionMouseLeave('roleplaying')}
            className={`w-full text-left mb-4 px-4 py-3 transition-all duration-200 ${hoverSectionKey === 'roleplaying' ? 'bg-gray-200 shadow-md scale-[1.01]' : ''}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pb-2">Technique 3: Role-Playing</h2>
              <span className={`text-2xl transition-transform duration-200 ${hoverSectionKey === 'roleplaying' ? 'translate-y-[-1px]' : ''}`}>{expandedSections['roleplaying'] ? '−' : '+'}</span>
            </div>
          </button>

          {expandedSections['roleplaying'] && (
            <div className="space-y-4 pl-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Scenarios to Role-Play</h3>
                {renderList(reportData.empathyTechnique3RolePlaying.rolePlayingScenarios, ['empathyTechnique3RolePlaying', 'rolePlayingScenarios'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Variables to Test</h3>
                {renderList(reportData.empathyTechnique3RolePlaying.rolePlayingVariables, ['empathyTechnique3RolePlaying', 'rolePlayingVariables'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Documentation Focus</h3>
                {renderList(reportData.empathyTechnique3RolePlaying.documentationFocus, ['empathyTechnique3RolePlaying', 'documentationFocus'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Key Questions</h3>
                {renderList(reportData.empathyTechnique3RolePlaying.keyQuestionsForRolePlaying, ['empathyTechnique3RolePlaying', 'keyQuestionsForRolePlaying'])}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Technique 4: Shadowing */}
      {reportData.empathyTechnique4Shadowing && (
        <section className="p-6 bg-gray-50">
          <button
            onClick={() => toggleSection('shadowing')}
            onMouseEnter={() => handleSectionMouseEnter('shadowing')}
            onMouseLeave={() => handleSectionMouseLeave('shadowing')}
            className={`w-full text-left mb-4 px-4 py-3 transition-all duration-200 ${hoverSectionKey === 'shadowing' ? 'bg-gray-200 shadow-md scale-[1.01]' : ''}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pb-2">Technique 4: Shadowing</h2>
              <span className={`text-2xl transition-transform duration-200 ${hoverSectionKey === 'shadowing' ? 'translate-y-[-1px]' : ''}`}>{expandedSections['shadowing'] ? '−' : '+'}</span>
            </div>
          </button>

          {expandedSections['shadowing'] && (
            <div className="space-y-4 pl-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Focus Areas</h3>
                {renderList(reportData.empathyTechnique4Shadowing.shadowingFocusAreas, ['empathyTechnique4Shadowing', 'shadowingFocusAreas'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">What to Shadow</h3>
                {renderList(reportData.empathyTechnique4Shadowing.whatToShadow, ['empathyTechnique4Shadowing', 'whatToShadow'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Documentation Guidelines</h3>
                {renderList(reportData.empathyTechnique4Shadowing.shadowingDocumentation, ['empathyTechnique4Shadowing', 'shadowingDocumentation'])}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
                {renderList(reportData.empathyTechnique4Shadowing.keyInsightsFromShadowing, ['empathyTechnique4Shadowing', 'keyInsightsFromShadowing'])}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Technique 5: Deep Conversation */}
      {reportData.empathyTechnique5Conversation?.deepInterviewQuestions && (
        <section className="p-6 bg-gray-50">
          <button
            onClick={() => toggleSection('conversation')}
            onMouseEnter={() => handleSectionMouseEnter('conversation')}
            onMouseLeave={() => handleSectionMouseLeave('conversation')}
            className={`w-full text-left mb-4 px-4 py-3 transition-all duration-200 ${hoverSectionKey === 'conversation' ? 'bg-gray-200 shadow-md scale-[1.01]' : ''}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pb-2">Technique 5: Deep Conversation</h2>
              <span className={`text-2xl transition-transform duration-200 ${hoverSectionKey === 'conversation' ? 'translate-y-[-1px]' : ''}`}>{expandedSections['conversation'] ? '−' : '+'}</span>
            </div>
          </button>

          {expandedSections['conversation'] && (
            <div className="space-y-4 pl-4">
              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.openingQuestions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Opening Questions</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.openingQuestions, ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'openingQuestions'])}
                </div>
              )}

              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.beliefUncoveringQuestions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Belief-Uncovering Questions</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.beliefUncoveringQuestions, ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'beliefUncoveringQuestions'])}
                </div>
              )}

              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.behaviorExploringQuestions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Behavior-Exploring Questions</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.behaviorExploringQuestions, ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'behaviorExploringQuestions'])}
                </div>
              )}

              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.contextDeepeningQuestions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Context-Deepening Questions</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.contextDeepeningQuestions, ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'contextDeepeningQuestions'])}
                </div>
              )}

              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.innovationOpportunityQuestions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Innovation Opportunity Questions</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.innovationOpportunityQuestions, ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'innovationOpportunityQuestions'])}
                </div>
              )}

              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.followUpProbes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Follow-Up Probes</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.followUpProbes, ['empathyTechnique5Conversation', 'deepInterviewQuestions', 'followUpProbes'])}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Research Execution Guidance */}
      {reportData.researchExecutionGuidance && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Research Execution Guidance</h2>

          <div className="space-y-4">
            {reportData.researchExecutionGuidance.preResearchPreparation && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Pre-Research Preparation</h3>
                {renderList(reportData.researchExecutionGuidance.preResearchPreparation, ['researchExecutionGuidance', 'preResearchPreparation'])}
              </div>
            )}

            {reportData.researchExecutionGuidance.duringResearchBestPractices && (
              <div>
                <h3 className="text-lg font-semibold mb-2">During Research Best Practices</h3>
                {renderList(reportData.researchExecutionGuidance.duringResearchBestPractices, ['researchExecutionGuidance', 'duringResearchBestPractices'])}
              </div>
            )}

            {reportData.researchExecutionGuidance.postResearchAnalysis && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Post-Research Analysis</h3>
                {renderList(reportData.researchExecutionGuidance.postResearchAnalysis, ['researchExecutionGuidance', 'postResearchAnalysis'])}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Insight Synthesis Framework */}
      {reportData.insightSynthesisFramework && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Insight Synthesis Framework</h2>

          <div className="space-y-4">
            {reportData.insightSynthesisFramework.beliefInsights && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Belief Insights</h3>
                {renderList(reportData.insightSynthesisFramework.beliefInsights, ['insightSynthesisFramework', 'beliefInsights'])}
              </div>
            )}

            {reportData.insightSynthesisFramework.behavioralInsights && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Behavioral Insights</h3>
                {renderList(reportData.insightSynthesisFramework.behavioralInsights, ['insightSynthesisFramework', 'behavioralInsights'])}
              </div>
            )}

            {reportData.insightSynthesisFramework.innovationOpportunities && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Innovation Opportunities</h3>
                {renderList(reportData.insightSynthesisFramework.innovationOpportunities, ['insightSynthesisFramework', 'innovationOpportunities'])}
              </div>
            )}

            {reportData.insightSynthesisFramework.designImplications && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Design Implications</h3>
                {renderList(reportData.insightSynthesisFramework.designImplications, ['insightSynthesisFramework', 'designImplications'])}
              </div>
            )}
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
