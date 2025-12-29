import { useState } from 'react';

interface HMWIdeationFrameworkReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const HMWIdeationFrameworkReportViewer = ({ data, onGenerateNew, projectId, onSave }: HMWIdeationFrameworkReportViewerProps) => {
  const [expandedIdeation, setExpandedIdeation] = useState<{[key: number]: boolean}>({});
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

  const toggleIdeation = (idx: number) => {
    setExpandedIdeation(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleIdeationMouseEnter = (id: number) => {
    // Auto-expand after a short hover delay to preview content
    const timer = window.setTimeout(() => {
      setExpandedIdeation(prev => ({ ...prev, [id]: true }));
    }, 500);
    setHoverTimer(timer);
  };

  const handleIdeationMouseLeave = () => {
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };

  const formatValue = (v: any) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string' && v.trim().toLowerCase() === 'undefined') return '—';
    return v;
  };

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
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        setOriginalData(null);
        setEditedData(null);
        setIsEditMode(false);
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
      const updated = structuredClone(prev);
      let current = updated;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return updated;
    });
  };

  const updateArrayItemAtPath = (path: (string | number)[], index: number, value: any) => {
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

  return (
    <div className="space-y-8">
      {/* Save Confirmation Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Changes?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to save these changes to the HMW Ideation Framework report?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Discard Changes?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to discard all your changes?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Changes saved successfully!
        </div>
      )}

      {/* Error Toast */}
      {showErrorMessage && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Error: {errorText}
        </div>
      )}
      {/* Header with Edit and Generate New Buttons */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">HMW Ideation Framework Report</h1>
        <div className="flex gap-3">
          {projectId && onSave && (
            <button
              onClick={handleEditToggle}
              disabled={isEditMode}
              className="px-6 py-2 font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Edit
            </button>
          )}
          {onGenerateNew && (
            <button
              onClick={onGenerateNew}
              className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors rounded-lg"
            >
              Generate New
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="font-semibold text-blue-900">Edit Mode Active</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:bg-white rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Context */}
      {reportData.project_context && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Project Context</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Prioritized Pain Point</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.project_context.prioritized_pain_point || ''}
                  onChange={(e) => updateTextAtPath(['project_context', 'prioritized_pain_point'], e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-2">{formatValue(reportData.project_context.prioritized_pain_point)}</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Target Extreme User</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.project_context.target_extreme_user || ''}
                  onChange={(e) => updateTextAtPath(['project_context', 'target_extreme_user'], e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base pl-2">{formatValue(reportData.project_context.target_extreme_user)}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* HMW Ideation */}
      {Array.isArray(reportData.hmw_ideation) && reportData.hmw_ideation.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold mb-4 pb-2">HMW Ideation</h2>
          {reportData.hmw_ideation.map((hmw: any, idx: number) => (
            <div key={idx} className="bg-gray-50 p-6 rounded-xl">
              <button
                onClick={() => toggleIdeation(idx)}
                onMouseEnter={() => handleIdeationMouseEnter(idx)}
                onMouseLeave={() => handleIdeationMouseLeave()}
                className="w-full text-left mb-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold pr-4">HMW {idx + 1}: {hmw.hmw_statement || 'HMW Statement'}</h3>
                  <span className="text-2xl flex-shrink-0">{expandedIdeation[idx] ? '−' : '+'}</span>
                </div>
              </button>
              {expandedIdeation[idx] && (
                <div className="space-y-4 pl-4">
                  <div>
                    <h4 className="font-bold mb-1">HMW Statement</h4>
                    {isEditMode ? (
                      <textarea
                        value={hmw.hmw_statement || ''}
                        onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'hmw_statement'], e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base">{formatValue(hmw.hmw_statement)}</p>
                    )}
                  </div>
                  {/* Approach 1: Simple Ideas */}
                  {hmw.approach_1_simple_ideas && (
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2">Approach 1: Simple Ideas</h4>
                      <div className="space-y-2">
                        {hmw.approach_1_simple_ideas.map((idea: any, i: number) => (
                          <div key={i} className="bg-green-50 p-4 rounded-lg">
                            {isEditMode ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={idea.idea_name || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_1_simple_ideas', i, 'idea_name'], e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.description || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_1_simple_ideas', i, 'description'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.behavior_enablement || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_1_simple_ideas', i, 'behavior_enablement'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.implementation || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_1_simple_ideas', i, 'implementation'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.extreme_user_fit || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_1_simple_ideas', i, 'extreme_user_fit'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="font-bold text-green-800 mb-1">{idea.idea_name}</div>
                                <div className="text-sm">
                                  <p><strong>Description:</strong> {idea.description}</p>
                                  <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                                  <p><strong>Implementation:</strong> {idea.implementation}</p>
                                  <p><strong>Extreme User Fit:</strong> {idea.extreme_user_fit}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Approach 2: Outside Category Ideas */}
                  {hmw.approach_2_outside_category_ideas && (
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-2">Approach 2: Outside Category Ideas</h4>
                      <div className="space-y-2">
                        {hmw.approach_2_outside_category_ideas.map((idea: any, i: number) => (
                          <div key={i} className="bg-blue-50 p-4 rounded-lg">
                            {isEditMode ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={idea.idea_name || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_2_outside_category_ideas', i, 'idea_name'], e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.inspiration_source || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_2_outside_category_ideas', i, 'inspiration_source'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.original_solution || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_2_outside_category_ideas', i, 'original_solution'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.adaptation || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_2_outside_category_ideas', i, 'adaptation'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.behavior_enablement || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_2_outside_category_ideas', i, 'behavior_enablement'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.implementation || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_2_outside_category_ideas', i, 'implementation'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="font-bold text-blue-800 mb-1">{idea.idea_name}</div>
                                <div className="text-sm">
                                  <p><strong>Inspiration Source:</strong> {idea.inspiration_source}</p>
                                  <p><strong>Original Solution:</strong> {idea.original_solution}</p>
                                  <p><strong>Adaptation:</strong> {idea.adaptation}</p>
                                  <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                                  <p><strong>Implementation:</strong> {idea.implementation}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Approach 3: Add Feature Ideas */}
                  {hmw.approach_3_add_feature_ideas && (
                    <div>
                      <h4 className="font-semibold text-purple-700 mb-2">Approach 3: Add Feature Ideas</h4>
                      <div className="space-y-2">
                        {hmw.approach_3_add_feature_ideas.map((idea: any, i: number) => (
                          <div key={i} className="bg-purple-50 p-4 rounded-lg">
                            {isEditMode ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={idea.idea_name || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_3_add_feature_ideas', i, 'idea_name'], e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.existing_product || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_3_add_feature_ideas', i, 'existing_product'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.added_feature || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_3_add_feature_ideas', i, 'added_feature'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.integration_method || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_3_add_feature_ideas', i, 'integration_method'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.behavior_enablement || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_3_add_feature_ideas', i, 'behavior_enablement'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.automatic_behavior || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_3_add_feature_ideas', i, 'automatic_behavior'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="font-bold text-purple-800 mb-1">{idea.idea_name}</div>
                                <div className="text-sm">
                                  <p><strong>Existing Product:</strong> {idea.existing_product}</p>
                                  <p><strong>Added Feature:</strong> {idea.added_feature}</p>
                                  <p><strong>Integration Method:</strong> {idea.integration_method}</p>
                                  <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                                  <p><strong>Automatic Behavior:</strong> {idea.automatic_behavior}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Approach 4: Remove Feature Ideas */}
                  {hmw.approach_4_remove_feature_ideas && (
                    <div>
                      <h4 className="font-semibold text-orange-700 mb-2">Approach 4: Remove Feature Ideas</h4>
                      <div className="space-y-2">
                        {hmw.approach_4_remove_feature_ideas.map((idea: any, i: number) => (
                          <div key={i} className="bg-orange-50 p-4 rounded-lg">
                            {isEditMode ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={idea.idea_name || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_4_remove_feature_ideas', i, 'idea_name'], e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.existing_solution || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_4_remove_feature_ideas', i, 'existing_solution'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.removed_elements || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_4_remove_feature_ideas', i, 'removed_elements'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.simplified_experience || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_4_remove_feature_ideas', i, 'simplified_experience'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.behavior_enablement || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_4_remove_feature_ideas', i, 'behavior_enablement'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  value={idea.maintained_functionality || ''}
                                  onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'approach_4_remove_feature_ideas', i, 'maintained_functionality'], e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="font-bold text-orange-800 mb-1">{idea.idea_name}</div>
                                <div className="text-sm">
                                  <p><strong>Existing Solution:</strong> {idea.existing_solution}</p>
                                  <p><strong>Removed Elements:</strong> {idea.removed_elements}</p>
                                  <p><strong>Simplified Experience:</strong> {idea.simplified_experience}</p>
                                  <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                                  <p><strong>Maintained Functionality:</strong> {idea.maintained_functionality}</p>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Cross Approach Synthesis */}
                  {hmw.cross_approach_synthesis && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Cross-Approach Synthesis</h4>
                      <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <span className="font-medium">Complementary Ideas:</span>
                          {isEditMode ? (
                            <textarea
                              value={hmw.cross_approach_synthesis.complementary_ideas || ''}
                              onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'cross_approach_synthesis', 'complementary_ideas'], e.target.value)}
                              rows={2}
                              className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <span> {hmw.cross_approach_synthesis.complementary_ideas}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Implementation Priority:</span>
                          {isEditMode ? (
                            <textarea
                              value={hmw.cross_approach_synthesis.implementation_priority || ''}
                              onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'cross_approach_synthesis', 'implementation_priority'], e.target.value)}
                              rows={2}
                              className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <span> {hmw.cross_approach_synthesis.implementation_priority}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Extreme User Preference:</span>
                          {isEditMode ? (
                            <textarea
                              value={hmw.cross_approach_synthesis.extreme_user_preference || ''}
                              onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'cross_approach_synthesis', 'extreme_user_preference'], e.target.value)}
                              rows={2}
                              className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <span> {hmw.cross_approach_synthesis.extreme_user_preference}</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Behavior Impact:</span>
                          {isEditMode ? (
                            <textarea
                              value={hmw.cross_approach_synthesis.behavior_impact || ''}
                              onChange={(e) => updateTextAtPath(['hmw_ideation', idx, 'cross_approach_synthesis', 'behavior_impact'], e.target.value)}
                              rows={2}
                              className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <span> {hmw.cross_approach_synthesis.behavior_impact}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Portfolio Analysis */}
      {reportData.portfolio_analysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Portfolio Analysis</h2>
          {reportData.portfolio_analysis.approach_effectiveness && (
            <div className="mb-8">
              <h3 className="font-semibold mb-2">Approach Effectiveness</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="font-medium text-green-800">Simple Ideas Strengths:</span>
                  {isEditMode ? (
                    <textarea
                      value={reportData.portfolio_analysis.approach_effectiveness.simple_ideas_strengths || ''}
                      onChange={(e) => updateTextAtPath(['portfolio_analysis', 'approach_effectiveness', 'simple_ideas_strengths'], e.target.value)}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span> {reportData.portfolio_analysis.approach_effectiveness.simple_ideas_strengths}</span>
                  )}
                  <span className="font-medium text-blue-800">Outside Category Insights:</span>
                  {isEditMode ? (
                    <textarea
                      value={reportData.portfolio_analysis.approach_effectiveness.outside_category_insights || ''}
                      onChange={(e) => updateTextAtPath(['portfolio_analysis', 'approach_effectiveness', 'outside_category_insights'], e.target.value)}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span> {reportData.portfolio_analysis.approach_effectiveness.outside_category_insights}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <span className="font-medium text-purple-800">Add Feature Opportunities:</span>
                  {isEditMode ? (
                    <textarea
                      value={reportData.portfolio_analysis.approach_effectiveness.add_feature_opportunities || ''}
                      onChange={(e) => updateTextAtPath(['portfolio_analysis', 'approach_effectiveness', 'add_feature_opportunities'], e.target.value)}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span> {reportData.portfolio_analysis.approach_effectiveness.add_feature_opportunities}</span>
                  )}
                  <span className="font-medium text-orange-800">Remove Feature Impact:</span>
                  {isEditMode ? (
                    <textarea
                      value={reportData.portfolio_analysis.approach_effectiveness.remove_feature_impact || ''}
                      onChange={(e) => updateTextAtPath(['portfolio_analysis', 'approach_effectiveness', 'remove_feature_impact'], e.target.value)}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span> {reportData.portfolio_analysis.approach_effectiveness.remove_feature_impact}</span>
                  )}
                </div>
              </div>
            </div>
          )}
          {reportData.portfolio_analysis.next_steps_recommendations && (
            <div>
              <h3 className="font-semibold mb-2">Next Steps Recommendations</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <span className="font-medium">Priority Ideas:</span>
                  {isEditMode ? (
                    <div className="space-y-2 pl-4">
                      {reportData.portfolio_analysis.next_steps_recommendations.priority_ideas?.map((idea: string, i: number) => (
                        <textarea
                          key={i}
                          value={idea || ''}
                          onChange={(e) => updateArrayItemAtPath(['portfolio_analysis', 'next_steps_recommendations', 'priority_ideas'], i, e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      ))}
                    </div>
                  ) : (
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      {reportData.portfolio_analysis.next_steps_recommendations.priority_ideas?.map((idea: string, i: number) => (
                        <li key={i} className="text-sm">{idea}</li>
                      ))}
                    </ul>
                  )}
                  <span className="font-medium">Prototype Candidates:</span>
                  {isEditMode ? (
                    <div className="space-y-2 pl-4">
                      {reportData.portfolio_analysis.next_steps_recommendations.prototype_candidates?.map((candidate: string, i: number) => (
                        <textarea
                          key={i}
                          value={candidate || ''}
                          onChange={(e) => updateArrayItemAtPath(['portfolio_analysis', 'next_steps_recommendations', 'prototype_candidates'], i, e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      ))}
                    </div>
                  ) : (
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      {reportData.portfolio_analysis.next_steps_recommendations.prototype_candidates?.map((candidate: string, i: number) => (
                        <li key={i} className="text-sm">{candidate}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <span className="font-medium">Research Needs:</span>
                  {isEditMode ? (
                    <textarea
                      value={reportData.portfolio_analysis.next_steps_recommendations.research_needs || ''}
                      onChange={(e) => updateTextAtPath(['portfolio_analysis', 'next_steps_recommendations', 'research_needs'], e.target.value)}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span> {reportData.portfolio_analysis.next_steps_recommendations.research_needs}</span>
                  )}
                  <span className="font-medium">Implementation Planning:</span>
                  {isEditMode ? (
                    <textarea
                      value={reportData.portfolio_analysis.next_steps_recommendations.implementation_planning || ''}
                      onChange={(e) => updateTextAtPath(['portfolio_analysis', 'next_steps_recommendations', 'implementation_planning'], e.target.value)}
                      rows={2}
                      className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <span> {reportData.portfolio_analysis.next_steps_recommendations.implementation_planning}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Fallback: Show all raw data if structure doesn't match expected format */}
      {!reportData.project_context && !(Array.isArray(reportData.hmw_ideation) && reportData.hmw_ideation.length > 0) && !reportData.portfolio_analysis && (
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
