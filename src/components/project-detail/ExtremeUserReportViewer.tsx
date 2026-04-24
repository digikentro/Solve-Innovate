import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
        <div className="fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-none shadow-xl z-50 flex items-center gap-2 border border-white/20">
          <span className="text-xs uppercase tracking-widest">Changes saved successfully</span>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-none shadow-xl z-50 flex items-center gap-2 border border-red-500">
          <span className="text-xs uppercase tracking-widest text-red-500">{errorText || 'Failed to save changes'}</span>
        </div>
      )}

      {/* Header with Edit and Generate New Buttons */}
      <div className="pb-8 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Extreme User Analysis</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Primary research report</p>
        </div>
        <div className="flex items-center gap-4">
          {!isEditMode && projectId && onSave && (
            <Button
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white rounded-none h-10 px-8 font-normal transition-colors"
              onClick={handleEditToggle}
            >
              Edit Report
            </Button>
          )}
          {onGenerateNew && (
            <Button
              className="bg-black text-white hover:bg-black/90 rounded-none h-10 px-8 font-normal transition-colors"
              onClick={onGenerateNew}
            >
              Generate New
            </Button>
          )}
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest opacity-70">Status</span>
            <span className="text-sm font-medium">Edit Mode Active — Modification enabled</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 rounded-none h-10 px-6 font-normal transition-colors"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Discard Changes
            </Button>
            <Button
              className="bg-white text-black hover:bg-white/90 rounded-none h-10 px-8 font-normal transition-colors"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {/* Pain Point Context */}
      {reportData.painPointAnalysis && (
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Pain Point Context</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Step Analyzed</label>
              {isEditMode ? (
                <input
                  type="text"
                  value={reportData.painPointAnalysis.step || ''}
                  onChange={(e) => updateTextAtPath(['painPointAnalysis', 'step'], e.target.value)}
                  className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 border-l border-black pl-4">{reportData.painPointAnalysis.step}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-8">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Description</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.painPointAnalysis.description || ''}
                    onChange={(e) => updateTextAtPath(['painPointAnalysis', 'description'], e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{reportData.painPointAnalysis.description}</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">User Context</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.painPointAnalysis.userContext || ''}
                    onChange={(e) => updateTextAtPath(['painPointAnalysis', 'userContext'], e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{reportData.painPointAnalysis.userContext}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Power Users (High-Need Extreme) */}
      {reportData.extremeUserProfiles?.powerUsersHighNeedExtreme && 
       reportData.extremeUserProfiles.powerUsersHighNeedExtreme.length > 0 && (
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Power Users (High-Need Extreme)</h2>
          <p className="text-xs text-gray-400 mb-8 max-w-xl italic">
            Users who push the boundaries and have amplified needs - Select to expand profile
          </p>

          <div className="space-y-4">
            {reportData.extremeUserProfiles.powerUsersHighNeedExtreme.map((user: any, index: number) => (
              <div key={index} className="border border-gray-100">
                {/* User Header */}
                <button
                  onClick={() => toggleUser(index)}
                  className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors ${expandedUsers[index] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${expandedUsers[index] ? 'opacity-70' : 'text-gray-400'}`}>User 0{index + 1}</span>
                    <span className="text-sm font-medium">{user.label}</span>
                  </div>
                  <span className="text-xs">{expandedUsers[index] ? 'CLOSE' : 'EXPAND'}</span>
                </button>

                {/* User Details */}
                {expandedUsers[index] && (
                  <div className="p-8 space-y-10 border-t border-gray-100 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Demographics</label>
                        {isEditMode ? (
                          <textarea
                            value={user.demographics || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'demographics'], e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                          />
                        ) : (
                          <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.demographics}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Amplified Needs</label>
                        {isEditMode ? (
                          <textarea
                            value={user.amplifiedNeeds || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'amplifiedNeeds'], e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                          />
                        ) : (
                          <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.amplifiedNeeds}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Pain Point Experience</label>
                        {isEditMode ? (
                          <textarea
                            value={user.painPointExperience || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'painPointExperience'], e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                          />
                        ) : (
                          <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.painPointExperience}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Current Workarounds</label>
                        {isEditMode ? (
                          <textarea
                            value={user.currentWorkarounds || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'currentWorkarounds'], e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                          />
                        ) : (
                          <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.currentWorkarounds}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Unique Challenges</label>
                        {isEditMode ? (
                          <textarea
                            value={user.uniqueChallenges || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'uniqueChallenges'], e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                          />
                        ) : (
                          <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.uniqueChallenges}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Interview Focus Areas</label>
                        {isEditMode ? (
                          <textarea
                            value={user.interviewFocus || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'interviewFocus'], e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                          />
                        ) : (
                          <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.interviewFocus}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100">
                      <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-4">Research Value</label>
                      {isEditMode ? (
                        <textarea
                          value={user.researchValue || ''}
                          onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'powerUsersHighNeedExtreme', index, 'researchValue'], e.target.value)}
                          rows={2}
                          className="w-full bg-white border border-black py-3 px-4 text-sm font-medium focus:outline-none transition-colors resize-none"
                        />
                      ) : (
                        <p className="text-sm font-medium text-gray-900 leading-relaxed bg-gray-50 p-6 border-l-2 border-black">{user.researchValue}</p>
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
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Marginalized Users (Barrier-Facing Extreme)</h2>
          <p className="text-xs text-gray-400 mb-8 max-w-xl italic">
            Users who face significant barriers and exclusion - Select to expand profile
          </p>

          <div className="space-y-4">
            {reportData.extremeUserProfiles.marginalizedUsersBarrierFacingExtreme.map((user: any, index: number) => {
              const userIndex = index + 1000; // Unique id to avoid conflicts with power users
              return (
                <div key={index} className="border border-gray-100">
                  {/* User Header */}
                  <button
                    onClick={() => toggleUser(userIndex)}
                    className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors ${expandedUsers[userIndex] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${expandedUsers[userIndex] ? 'opacity-70' : 'text-gray-400'}`}>User M{index + 1}</span>
                      <span className="text-sm font-medium">{user.label}</span>
                    </div>
                    <span className="text-xs">{expandedUsers[userIndex] ? 'CLOSE' : 'EXPAND'}</span>
                  </button>

                  {/* User Details */}
                  {expandedUsers[userIndex] && (
                    <div className="p-8 space-y-10 border-t border-gray-100 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Demographics</label>
                          {isEditMode ? (
                            <textarea
                              value={user.demographics || ''}
                              onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'demographics'], e.target.value)}
                              rows={2}
                              className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.demographics}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Barriers Faced</label>
                          {isEditMode ? (
                            <textarea
                              value={user.barriersFaced || ''}
                              onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'barriersFaced'], e.target.value)}
                              rows={2}
                              className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.barriersFaced}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Pain Point Experience</label>
                          {isEditMode ? (
                            <textarea
                              value={user.painPointExperience || ''}
                              onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'painPointExperience'], e.target.value)}
                              rows={2}
                              className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.painPointExperience}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Exclusion Factors</label>
                          {isEditMode ? (
                            <textarea
                              value={user.exclusionFactors || ''}
                              onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'exclusionFactors'], e.target.value)}
                              rows={2}
                              className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.exclusionFactors}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Unique Challenges</label>
                          {isEditMode ? (
                            <textarea
                              value={user.uniqueChallenges || ''}
                              onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'uniqueChallenges'], e.target.value)}
                              rows={2}
                              className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.uniqueChallenges}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Interview Focus Areas</label>
                          {isEditMode ? (
                            <textarea
                              value={user.interviewFocus || ''}
                              onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'interviewFocus'], e.target.value)}
                              rows={2}
                              className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                            />
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{user.interviewFocus}</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-8 border-t border-gray-100">
                        <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block mb-4">Research Value</label>
                        {isEditMode ? (
                          <textarea
                            value={user.researchValue || ''}
                            onChange={(e) => updateTextAtPath(['extremeUserProfiles', 'marginalizedUsersBarrierFacingExtreme', index, 'researchValue'], e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-black py-3 px-4 text-sm font-medium focus:outline-none transition-colors resize-none"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 leading-relaxed bg-gray-50 p-6 border-l-2 border-black">{user.researchValue}</p>
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
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Research Strategy</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {reportData.researchStrategy.userRecruitment && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">User Recruitment</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.researchStrategy.userRecruitment || ''}
                    onChange={(e) => updateTextAtPath(['researchStrategy', 'userRecruitment'], e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{reportData.researchStrategy.userRecruitment}</p>
                )}
              </div>
            )}

            {reportData.researchStrategy.interviewApproach && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Interview Approach</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.researchStrategy.interviewApproach || ''}
                    onChange={(e) => updateTextAtPath(['researchStrategy', 'interviewApproach'], e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{reportData.researchStrategy.interviewApproach}</p>
                )}
              </div>
            )}

            {reportData.researchStrategy.keyInsightsToExplore && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Key Insights to Explore</label>
                {Array.isArray(reportData.researchStrategy.keyInsightsToExplore) ? (
                  <ul className="space-y-2 border-l border-gray-100 pl-4">
                    {reportData.researchStrategy.keyInsightsToExplore.map((insight: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 border-l border-gray-100 pl-4">{reportData.researchStrategy.keyInsightsToExplore}</p>
                )}
              </div>
            )}

            {reportData.researchStrategy.expectedBreakthroughAreas && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Expected Breakthrough Areas</label>
                {Array.isArray(reportData.researchStrategy.expectedBreakthroughAreas) ? (
                  <ul className="space-y-2 border-l border-gray-100 pl-4">
                    {reportData.researchStrategy.expectedBreakthroughAreas.map((area: string, i: number) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />
                        {area}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 border-l border-gray-100 pl-4">{reportData.researchStrategy.expectedBreakthroughAreas}</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Design Implications */}
      {reportData.designImplications && (
        <section className="p-8 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Design Implications</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {reportData.designImplications.powerUserInsights && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Power User Insights</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.designImplications.powerUserInsights || ''}
                    onChange={(e) => updateTextAtPath(['designImplications', 'powerUserInsights'], e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{reportData.designImplications.powerUserInsights}</p>
                )}
              </div>
            )}

            {reportData.designImplications.marginalizedUserInsights && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Marginalized User Insights</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.designImplications.marginalizedUserInsights || ''}
                    onChange={(e) => updateTextAtPath(['designImplications', 'marginalizedUserInsights'], e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed border-l border-gray-100 pl-4">{reportData.designImplications.marginalizedUserInsights}</p>
                )}
              </div>
            )}

            {reportData.designImplications.solutionOpportunities && 
             reportData.designImplications.solutionOpportunities.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Solution Opportunities</label>
                <ul className="space-y-2 border-l border-gray-100 pl-4">
                  {reportData.designImplications.solutionOpportunities.map((opportunity: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reportData.designImplications.implementationConsiderations && 
             reportData.designImplications.implementationConsiderations.length > 0 && (
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-3">Implementation Considerations</label>
                <ul className="space-y-2 border-l border-gray-100 pl-4">
                  {reportData.designImplications.implementationConsiderations.map((consideration: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 bg-black rounded-full flex-shrink-0" />
                      {consideration}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Report Metadata */}
      {data.generated_at && (
        <div className="text-[10px] text-gray-400 text-center pt-8 border-t border-gray-100 uppercase tracking-[0.2em]">
          Generated on {new Date(data.generated_at).toLocaleString()} — Solver Labs Research Engine
        </div>
      )}
    </div>
  );
};
