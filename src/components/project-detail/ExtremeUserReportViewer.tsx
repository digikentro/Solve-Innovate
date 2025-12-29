import { useState } from 'react';

interface ExtremeUserReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const ExtremeUserReportViewer = ({ data, onGenerateNew, projectId, onSave }: ExtremeUserReportViewerProps) => {
  const [expandedUsers, setExpandedUsers] = useState<{[key: number]: boolean}>({});
  const [hoverUserId, setHoverUserId] = useState<number | null>(null);
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

  const reportData = isEditMode ? editedData : (data?.content || data);

  const handleEditToggle = () => {
    if (!isEditMode) {
      const dataToEdit = data?.content || data;
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

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No Extreme User Analysis data available</p>
      </div>
    );
  }

  const toggleUser = (index: number) => {
    setExpandedUsers(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleUserMouseEnter = (id: number) => {
    setHoverUserId(id);
    // Auto-expand after a short hover delay to preview content
    const timer = window.setTimeout(() => {
      setExpandedUsers(prev => ({ ...prev, [id]: true }));
    }, 500);
    setHoverTimer(timer);
  };

  const handleUserMouseLeave = (id: number) => {
    setHoverUserId(prev => (prev === id ? null : prev));
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
            <p className="text-gray-600 mb-6">Are you sure you want to save these changes to the Extreme User Analysis report?</p>
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
        <h1 className="text-3xl font-bold">Extreme User Analysis Report</h1>
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

      {/* Pain Point Context */}
      {reportData.painPointAnalysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Pain Point Context</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Step Analyzed</h3>
              {isEditMode ? (
                <input
                  type="text"
                  value={reportData.painPointAnalysis.step || ''}
                  onChange={(e) => updateTextAtPath(['painPointAnalysis', 'step'], e.target.value)}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-4">{reportData.painPointAnalysis.step}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.painPointAnalysis.description || ''}
                  onChange={(e) => updateTextAtPath(['painPointAnalysis', 'description'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-4 leading-relaxed">{reportData.painPointAnalysis.description}</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">User Context</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.painPointAnalysis.userContext || ''}
                  onChange={(e) => updateTextAtPath(['painPointAnalysis', 'userContext'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-4 leading-relaxed">{reportData.painPointAnalysis.userContext}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Power Users (High-Need Extreme) */}
      {reportData.extremeUserProfiles?.powerUsersHighNeedExtreme && 
       reportData.extremeUserProfiles.powerUsersHighNeedExtreme.length > 0 && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Power Users (High-Need Extreme)</h2>
          <p className="text-sm text-gray-600 mb-6">
            Users who push the boundaries and have amplified needs - Click to expand details
          </p>

          <div className="space-y-4">
            {reportData.extremeUserProfiles.powerUsersHighNeedExtreme.map((user: any, index: number) => (
              <div key={index} className="bg-white">
                {/* User Header */}
                <button
                  onClick={() => toggleUser(index)}
                  onMouseEnter={() => handleUserMouseEnter(index)}
                  onMouseLeave={() => handleUserMouseLeave(index)}
                  className={`w-full px-4 py-3 text-left transition-all duration-200 ${hoverUserId === index ? 'bg-gray-300 shadow-md scale-[1.01]' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">#{index + 1}</span>
                      <span className="text-lg font-semibold">{user.label}</span>
                    </div>
                    <span className={`text-xl transition-transform duration-200 ${hoverUserId === index ? 'translate-y-[-1px]' : ''}`}>{expandedUsers[index] ? '−' : '+'}</span>
                  </div>
                </button>

                {/* User Details */}
                {expandedUsers[index] && (
                  <div className="p-4 space-y-4 bg-gray-50">
                    <div>
                      <h4 className="font-bold mb-2">Demographics</h4>
                      {isEditMode ? (
                        <textarea
                          value={user.demographics || ''}
                          onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'demographics'], e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm pl-4">{user.demographics}</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Amplified Needs</h4>
                      {isEditMode ? (
                        <textarea
                          value={user.amplifiedNeeds || ''}
                          onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'amplifiedNeeds'], e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm pl-4">{user.amplifiedNeeds}</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Pain Point Experience</h4>
                      {isEditMode ? (
                        <textarea
                          value={user.painPointExperience || ''}
                          onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'painPointExperience'], e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm pl-4">{user.painPointExperience}</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Current Workarounds</h4>
                      {isEditMode ? (
                        <textarea
                          value={user.currentWorkarounds || ''}
                          onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'currentWorkarounds'], e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm pl-4">{user.currentWorkarounds}</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Unique Challenges</h4>
                      {isEditMode ? (
                        <textarea
                          value={user.uniqueChallenges || ''}
                          onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'uniqueChallenges'], e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm pl-4">{user.uniqueChallenges}</p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 bg-gray-100 p-3">
                      <h4 className="font-bold mb-2">Research Value</h4>
                      {isEditMode ? (
                        <textarea
                          value={user.researchValue || ''}
                          onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'researchValue'], e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500 font-semibold"
                        />
                      ) : (
                        <p className="text-sm pl-4 font-semibold">{user.researchValue}</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Interview Focus Areas</h4>
                      {isEditMode ? (
                        <textarea
                          value={user.interviewFocus || ''}
                          onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'interviewFocus'], e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm pl-4">{user.interviewFocus}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Marginalized Users (Barrier-Facing Extreme) */}
      {reportData.extremeUserProfiles?.marginalizedUsersBarrierFacingExtreme && 
       reportData.extremeUserProfiles.marginalizedUsersBarrierFacingExtreme.length > 0 && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Marginalized Users (Barrier-Facing Extreme)</h2>
          <p className="text-sm text-gray-600 mb-6">
            Users who face significant barriers and exclusion - Click to expand details
          </p>

          <div className="space-y-4">
            {reportData.extremeUserProfiles.marginalizedUsersBarrierFacingExtreme.map((user: any, index: number) => {
              const userIndex = index + 1000; // Unique id to avoid conflicts with power users
              return (
                <div key={index} className="bg-white">
                  {/* User Header */}
                  <button
                    onClick={() => toggleUser(userIndex)}
                    onMouseEnter={() => handleUserMouseEnter(userIndex)}
                    onMouseLeave={() => handleUserMouseLeave(userIndex)}
                    className={`w-full px-4 py-3 text-left transition-all duration-200 ${hoverUserId === userIndex ? 'bg-gray-300 shadow-md scale-[1.01]' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">#{index + 1}</span>
                        <span className="text-lg font-semibold">{user.label}</span>
                      </div>
                      <span className={`text-xl transition-transform duration-200 ${hoverUserId === userIndex ? 'translate-y-[-1px]' : ''}`}>{expandedUsers[userIndex] ? '−' : '+'}</span>
                    </div>
                  </button>

                  {/* User Details */}
                  {expandedUsers[userIndex] && (
                    <div className="p-4 space-y-4 bg-gray-50">
                      <div>
                        <h4 className="font-bold mb-2">Demographics</h4>
                        {isEditMode ? (
                          <textarea
                            value={user.demographics || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'demographics'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-4">{user.demographics}</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Barriers Faced</h4>
                        {isEditMode ? (
                          <textarea
                            value={user.barriersFaced || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'barriersFaced'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-4">{user.barriersFaced}</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Pain Point Experience</h4>
                        {isEditMode ? (
                          <textarea
                            value={user.painPointExperience || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'painPointExperience'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-4">{user.painPointExperience}</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Exclusion Factors</h4>
                        {isEditMode ? (
                          <textarea
                            value={user.exclusionFactors || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'exclusionFactors'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-4">{user.exclusionFactors}</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Unique Challenges</h4>
                        {isEditMode ? (
                          <textarea
                            value={user.uniqueChallenges || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'uniqueChallenges'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-4">{user.uniqueChallenges}</p>
                        )}
                      </div>

                      <div className="pt-3 mt-3 bg-gray-100 p-3">
                        <h4 className="font-bold mb-2">Research Value</h4>
                        {isEditMode ? (
                          <textarea
                            value={user.researchValue || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'researchValue'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500 font-semibold"
                          />
                        ) : (
                          <p className="text-sm pl-4 font-semibold">{user.researchValue}</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Interview Focus Areas</h4>
                        {isEditMode ? (
                          <textarea
                            value={user.interviewFocus || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'interviewFocus'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-4">{user.interviewFocus}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Research Strategy */}
      {reportData.researchStrategy && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Research Strategy</h2>

          <div className="space-y-4">
            {reportData.researchStrategy.userRecruitment && (
              <div>
                <h3 className="text-lg font-semibold mb-2">User Recruitment</h3>
                {isEditMode ? (
                  <textarea
                    value={reportData.researchStrategy.userRecruitment || ''}
                    onChange={(e) => updateTextAtPath(['researchStrategy', 'userRecruitment'], e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm pl-4">{reportData.researchStrategy.userRecruitment}</p>
                )}
              </div>
            )}

            {reportData.researchStrategy.interviewApproach && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Interview Approach</h3>
                {isEditMode ? (
                  <textarea
                    value={reportData.researchStrategy.interviewApproach || ''}
                    onChange={(e) => updateTextAtPath(['researchStrategy', 'interviewApproach'], e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm pl-4">{reportData.researchStrategy.interviewApproach}</p>
                )}
              </div>
            )}

            {reportData.researchStrategy.keyInsightsToExplore && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Key Insights to Explore</h3>
                {Array.isArray(reportData.researchStrategy.keyInsightsToExplore) ? (
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    {reportData.researchStrategy.keyInsightsToExplore.map((insight: string, i: number) => (
                      <li key={i} className="text-sm">{insight}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm pl-4">{reportData.researchStrategy.keyInsightsToExplore}</p>
                )}
              </div>
            )}

            {reportData.researchStrategy.expectedBreakthroughAreas && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Expected Breakthrough Areas</h3>
                {Array.isArray(reportData.researchStrategy.expectedBreakthroughAreas) ? (
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    {reportData.researchStrategy.expectedBreakthroughAreas.map((area: string, i: number) => (
                      <li key={i} className="text-sm">{area}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm pl-4">{reportData.researchStrategy.expectedBreakthroughAreas}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Design Implications */}
      {reportData.designImplications && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Design Implications</h2>

          <div className="space-y-4">
            {reportData.designImplications.powerUserInsights && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Power User Insights</h3>
                {isEditMode ? (
                  <textarea
                    value={reportData.designImplications.powerUserInsights || ''}
                    onChange={(e) => updateTextAtPath(['designImplications', 'powerUserInsights'], e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm pl-4">{reportData.designImplications.powerUserInsights}</p>
                )}
              </div>
            )}

            {reportData.designImplications.marginalizedUserInsights && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Marginalized User Insights</h3>
                {isEditMode ? (
                  <textarea
                    value={reportData.designImplications.marginalizedUserInsights || ''}
                    onChange={(e) => updateTextAtPath(['designImplications', 'marginalizedUserInsights'], e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm pl-4">{reportData.designImplications.marginalizedUserInsights}</p>
                )}
              </div>
            )}

            {reportData.designImplications.solutionOpportunities && 
             reportData.designImplications.solutionOpportunities.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Solution Opportunities</h3>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {reportData.designImplications.solutionOpportunities.map((opportunity: string, i: number) => (
                    <li key={i} className="text-sm">{opportunity}</li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.designImplications.implementationConsiderations && 
             reportData.designImplications.implementationConsiderations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Implementation Considerations</h3>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {reportData.designImplications.implementationConsiderations.map((consideration: string, i: number) => (
                    <li key={i} className="text-sm">{consideration}</li>
                  ))}
                </ul>
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
