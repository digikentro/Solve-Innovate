import { useState } from 'react';

interface DeepEmpathyReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
}

export const DeepEmpathyReportViewer = ({ data, onGenerateNew }: DeepEmpathyReportViewerProps) => {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  const reportData = data?.content || data;

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

  const renderList = (items: string[] | undefined, emptyMessage: string = 'No items available') => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-gray-500 italic pl-4">{emptyMessage}</p>;
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
      {/* Header with Generate New Button */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Deep Empathy Research Report</h1>
        {onGenerateNew && (
          <button
            onClick={onGenerateNew}
            className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Generate New
          </button>
        )}
      </div>

      {/* Research Context Analysis */}
      {reportData.researchContextAnalysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Research Context</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Pain Point</h3>
              <p className="text-base pl-4">{reportData.researchContextAnalysis.painPoint}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-base pl-4 leading-relaxed">{reportData.researchContextAnalysis.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Target Extreme User</h3>
              <p className="text-base pl-4 leading-relaxed">{reportData.researchContextAnalysis.extremeUser}</p>
            </div>
          </div>
        </section>
      )}

      {/* Technique 1: Observation */}
      {reportData.empathyTechnique1Observation && (
        <section className="p-6 bg-gray-50">
          <button
            onClick={() => toggleSection('observation')}
            className="w-full text-left mb-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pb-2">Technique 1: Observation</h2>
              <span className="text-2xl">{expandedSections['observation'] ? '−' : '+'}</span>
            </div>
          </button>

          {expandedSections['observation'] && (
            <div className="space-y-4 pl-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Focus Areas</h3>
                {renderList(reportData.empathyTechnique1Observation.observationFocusAreas)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">What to Document</h3>
                {renderList(reportData.empathyTechnique1Observation.whatToDocument)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Key Questions for Observation</h3>
                {renderList(reportData.empathyTechnique1Observation.keyQuestionsForObservation)}
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
            className="w-full text-left mb-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pb-2">Technique 2: Immersion</h2>
              <span className="text-2xl">{expandedSections['immersion'] ? '−' : '+'}</span>
            </div>
          </button>

          {expandedSections['immersion'] && (
            <div className="space-y-4 pl-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Immersion Activities</h3>
                {renderList(reportData.empathyTechnique2Immersion.immersionActivities)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">What to Experience</h3>
                {renderList(reportData.empathyTechnique2Immersion.whatToExperience)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Documentation Guidelines</h3>
                {renderList(reportData.empathyTechnique2Immersion.immersionDocumentation)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Key Insights to Capture</h3>
                {renderList(reportData.empathyTechnique2Immersion.keyInsightsToCapture)}
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
            className="w-full text-left mb-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pb-2">Technique 3: Role-Playing</h2>
              <span className="text-2xl">{expandedSections['roleplaying'] ? '−' : '+'}</span>
            </div>
          </button>

          {expandedSections['roleplaying'] && (
            <div className="space-y-4 pl-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Scenarios to Role-Play</h3>
                {renderList(reportData.empathyTechnique3RolePlaying.rolePlayingScenarios)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Variables to Test</h3>
                {renderList(reportData.empathyTechnique3RolePlaying.rolePlayingVariables)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Documentation Focus</h3>
                {renderList(reportData.empathyTechnique3RolePlaying.documentationFocus)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Key Questions</h3>
                {renderList(reportData.empathyTechnique3RolePlaying.keyQuestionsForRolePlaying)}
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
            className="w-full text-left mb-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pb-2">Technique 4: Shadowing</h2>
              <span className="text-2xl">{expandedSections['shadowing'] ? '−' : '+'}</span>
            </div>
          </button>

          {expandedSections['shadowing'] && (
            <div className="space-y-4 pl-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Focus Areas</h3>
                {renderList(reportData.empathyTechnique4Shadowing.shadowingFocusAreas)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">What to Shadow</h3>
                {renderList(reportData.empathyTechnique4Shadowing.whatToShadow)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Documentation Guidelines</h3>
                {renderList(reportData.empathyTechnique4Shadowing.shadowingDocumentation)}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
                {renderList(reportData.empathyTechnique4Shadowing.keyInsightsFromShadowing)}
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
            className="w-full text-left mb-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold pb-2">Technique 5: Deep Conversation</h2>
              <span className="text-2xl">{expandedSections['conversation'] ? '−' : '+'}</span>
            </div>
          </button>

          {expandedSections['conversation'] && (
            <div className="space-y-4 pl-4">
              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.openingQuestions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Opening Questions</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.openingQuestions)}
                </div>
              )}

              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.beliefUncoveringQuestions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Belief-Uncovering Questions</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.beliefUncoveringQuestions)}
                </div>
              )}

              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.behaviorExploringQuestions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Behavior-Exploring Questions</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.behaviorExploringQuestions)}
                </div>
              )}

              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.contextDeepeningQuestions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Context-Deepening Questions</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.contextDeepeningQuestions)}
                </div>
              )}

              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.innovationOpportunityQuestions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Innovation Opportunity Questions</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.innovationOpportunityQuestions)}
                </div>
              )}

              {reportData.empathyTechnique5Conversation.deepInterviewQuestions.followUpProbes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Follow-Up Probes</h3>
                  {renderList(reportData.empathyTechnique5Conversation.deepInterviewQuestions.followUpProbes)}
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
                {renderList(reportData.researchExecutionGuidance.preResearchPreparation)}
              </div>
            )}

            {reportData.researchExecutionGuidance.duringResearchBestPractices && (
              <div>
                <h3 className="text-lg font-semibold mb-2">During Research Best Practices</h3>
                {renderList(reportData.researchExecutionGuidance.duringResearchBestPractices)}
              </div>
            )}

            {reportData.researchExecutionGuidance.postResearchAnalysis && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Post-Research Analysis</h3>
                {renderList(reportData.researchExecutionGuidance.postResearchAnalysis)}
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
                {renderList(reportData.insightSynthesisFramework.beliefInsights)}
              </div>
            )}

            {reportData.insightSynthesisFramework.behavioralInsights && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Behavioral Insights</h3>
                {renderList(reportData.insightSynthesisFramework.behavioralInsights)}
              </div>
            )}

            {reportData.insightSynthesisFramework.innovationOpportunities && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Innovation Opportunities</h3>
                {renderList(reportData.insightSynthesisFramework.innovationOpportunities)}
              </div>
            )}

            {reportData.insightSynthesisFramework.designImplications && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Design Implications</h3>
                {renderList(reportData.insightSynthesisFramework.designImplications)}
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
