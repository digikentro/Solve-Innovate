import { useState } from 'react';

interface PsychologicalAnalysisReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const PsychologicalAnalysisReportViewer = ({ data, onGenerateNew, projectId, onSave }: PsychologicalAnalysisReportViewerProps) => {
  const [expandedClusters, setExpandedClusters] = useState<{ [key: number]: boolean }>({});
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

  const toggleCluster = (idx: number) => {
    setExpandedClusters(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleClusterMouseEnter = (id: number) => {
    // Auto-expand after a short hover delay to preview content
    const timer = window.setTimeout(() => {
      setExpandedClusters(prev => ({ ...prev, [id]: true }));
    }, 500);
    setHoverTimer(timer);
  };

  const handleClusterMouseLeave = () => {
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Confirmation Dialogs */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Changes?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to save these changes to the Psychological Analysis report?</p>
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
        <h1 className="text-3xl font-bold">Psychological Analysis Report</h1>
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

      {/* Comprehensive Meta Analysis */}
      {reportData.comprehensiveMetaAnalysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Comprehensive Meta Analysis</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Total Clusters Identified</h3>
              {isEditMode ? (
                <input
                  type="number"
                  value={reportData.comprehensiveMetaAnalysis.totalClustersIdentified || ''}
                  onChange={(e) => updateTextAtPath(['comprehensiveMetaAnalysis', 'totalClustersIdentified'], e.target.value)}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-4">{reportData.comprehensiveMetaAnalysis.totalClustersIdentified}</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Behavioral Pattern Themes</h3>
              {isEditMode ? (
                <div className="space-y-2 pl-4">
                  {reportData.comprehensiveMetaAnalysis.behavioralPatternThemes?.map((theme: string, idx: number) => (
                    <textarea
                      key={idx}
                      value={theme || ''}
                      onChange={(e) => updateArrayItemAtPath(['comprehensiveMetaAnalysis', 'behavioralPatternThemes'], idx, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {reportData.comprehensiveMetaAnalysis.behavioralPatternThemes?.map((theme: string, idx: number) => (
                    <li key={idx} className="text-sm">{theme}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Human Psychology Insights</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.comprehensiveMetaAnalysis.humanPsychologyInsights || ''}
                  onChange={(e) => updateTextAtPath(['comprehensiveMetaAnalysis', 'humanPsychologyInsights'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-4 leading-relaxed">{reportData.comprehensiveMetaAnalysis.humanPsychologyInsights}</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Cognitive Bias Patterns</h3>
              {isEditMode ? (
                <div className="space-y-2 pl-4">
                  {reportData.comprehensiveMetaAnalysis.cognitiveBiasPatterns?.map((bias: string, idx: number) => (
                    <textarea
                      key={idx}
                      value={bias || ''}
                      onChange={(e) => updateArrayItemAtPath(['comprehensiveMetaAnalysis', 'cognitiveBiasPatterns'], idx, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {reportData.comprehensiveMetaAnalysis.cognitiveBiasPatterns?.map((bias: string, idx: number) => (
                    <li key={idx} className="text-sm">{bias}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Emotional Driver Analysis</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.comprehensiveMetaAnalysis.emotionalDriverAnalysis || ''}
                  onChange={(e) => updateTextAtPath(['comprehensiveMetaAnalysis', 'emotionalDriverAnalysis'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-4 leading-relaxed">{reportData.comprehensiveMetaAnalysis.emotionalDriverAnalysis}</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">System Level Implications</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.comprehensiveMetaAnalysis.systemLevelImplications || ''}
                  onChange={(e) => updateTextAtPath(['comprehensiveMetaAnalysis', 'systemLevelImplications'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-4 leading-relaxed">{reportData.comprehensiveMetaAnalysis.systemLevelImplications}</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Innovation Opportunity Spaces</h3>
              {isEditMode ? (
                <div className="space-y-2 pl-4">
                  {reportData.comprehensiveMetaAnalysis.innovationOpportunitySpaces?.map((op: string, idx: number) => (
                    <textarea
                      key={idx}
                      value={op || ''}
                      onChange={(e) => updateArrayItemAtPath(['comprehensiveMetaAnalysis', 'innovationOpportunitySpaces'], idx, e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {reportData.comprehensiveMetaAnalysis.innovationOpportunitySpaces?.map((op: string, idx: number) => (
                    <li key={idx} className="text-sm">{op}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Behavioral Clusters */}
      {reportData.clusters && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold mb-4 pb-2">Behavioral Clusters Analysis</h2>
          {reportData.clusters.map((cluster: any, idx: number) => (
            <div key={idx} className="bg-gray-50 p-6 rounded-xl">
              <button
                onClick={() => toggleCluster(idx)}
                onMouseEnter={() => handleClusterMouseEnter(idx)}
                onMouseLeave={() => handleClusterMouseLeave()}
                className="w-full text-left mb-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold pr-4">
                    Cluster {idx + 1}: {cluster.irrationalBehavior || 'Behavior Cluster'}
                  </h3>
                  <span className="text-2xl flex-shrink-0">{expandedClusters[idx] ? '−' : '+'}</span>
                </div>
              </button>
              {expandedClusters[idx] && (
                <div className="space-y-4 pl-4">
                  <div>
                    <h4 className="font-bold mb-1">Irrational Behavior</h4>
                    {isEditMode ? (
                      <textarea
                        value={cluster.irrationalBehavior || ''}
                        onChange={(e) => updateTextAtPath(['clusters', idx, 'irrationalBehavior'], e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base">{cluster.irrationalBehavior}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Rational Counterpart</h4>
                    {isEditMode ? (
                      <textarea
                        value={cluster.rationalCounterpart || ''}
                        onChange={(e) => updateTextAtPath(['clusters', idx, 'rationalCounterpart'], e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base">{cluster.rationalCounterpart}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Raw Evidence from Student Data</h4>
                    {isEditMode ? (
                      <div className="space-y-2 pl-4">
                        {cluster.rawEvidenceFromStudentData?.map((ev: string, i: number) => (
                          <textarea
                            key={i}
                            value={ev || ''}
                            onChange={(e) => updateArrayItemAtPath(['clusters', idx, 'rawEvidenceFromStudentData'], i, e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ))}
                      </div>
                    ) : (
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        {cluster.rawEvidenceFromStudentData?.map((ev: string, i: number) => (
                          <li key={i} className="text-sm">{ev}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Peculiarity Revealed</h4>
                    {isEditMode ? (
                      <textarea
                        value={cluster.peculiarityRevealed || ''}
                        onChange={(e) => updateTextAtPath(['clusters', idx, 'peculiarityRevealed'], e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base">{cluster.peculiarityRevealed}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Psychological Analysis</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <span className="font-semibold">Cognitive Biases:</span>
                        {isEditMode ? (
                          <textarea
                            value={cluster.psychologicalAnalysis?.cognitiveBiases || ''}
                            onChange={(e) => updateTextAtPath(['clusters', idx, 'psychologicalAnalysis', 'cognitiveBiases'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-2">{cluster.psychologicalAnalysis?.cognitiveBiases}</p>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold">Emotional Drivers:</span>
                        {isEditMode ? (
                          <textarea
                            value={cluster.psychologicalAnalysis?.emotionalDrivers || ''}
                            onChange={(e) => updateTextAtPath(['clusters', idx, 'psychologicalAnalysis', 'emotionalDrivers'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-2">{cluster.psychologicalAnalysis?.emotionalDrivers}</p>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold">Psychological Needs:</span>
                        {isEditMode ? (
                          <textarea
                            value={cluster.psychologicalAnalysis?.psychologicalNeeds || ''}
                            onChange={(e) => updateTextAtPath(['clusters', idx, 'psychologicalAnalysis', 'psychologicalNeeds'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-2">{cluster.psychologicalAnalysis?.psychologicalNeeds}</p>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold">Why It Persists:</span>
                        {isEditMode ? (
                          <textarea
                            value={cluster.psychologicalAnalysis?.whyItPersists || ''}
                            onChange={(e) => updateTextAtPath(['clusters', idx, 'psychologicalAnalysis', 'whyItPersists'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-2">{cluster.psychologicalAnalysis?.whyItPersists}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Behavioral Science Explanation</h4>
                    {isEditMode ? (
                      <textarea
                        value={cluster.behavioralScienceExplanation || ''}
                        onChange={(e) => updateTextAtPath(['clusters', idx, 'behavioralScienceExplanation'], e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base">{cluster.behavioralScienceExplanation}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Innovation Insight</h4>
                    {isEditMode ? (
                      <textarea
                        value={cluster.innovationInsight || ''}
                        onChange={(e) => updateTextAtPath(['clusters', idx, 'innovationInsight'], e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base">{cluster.innovationInsight}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Critical Requirements */}
      {reportData.criticalRequirements && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Critical Requirements</h2>
          {isEditMode ? (
            <div className="space-y-2 pl-4">
              {reportData.criticalRequirements.map((req: string, idx: number) => (
                <textarea
                  key={idx}
                  value={req || ''}
                  onChange={(e) => updateArrayItemAtPath(['criticalRequirements'], idx, e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ))}
            </div>
          ) : (
            <ul className="list-decimal list-inside space-y-1 pl-4">
              {reportData.criticalRequirements.map((req: string, idx: number) => (
                <li key={idx} className="text-sm">{req}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Fallback: Show all raw data if structure doesn't match expected format */}
      {(!reportData.clusters && !reportData.comprehensiveMetaAnalysis && !reportData.criticalRequirements) && (
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
