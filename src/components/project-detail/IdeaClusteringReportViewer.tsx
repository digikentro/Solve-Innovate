import { useState } from 'react';

interface IdeaClusteringReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const IdeaClusteringReportViewer = ({ data, onGenerateNew, projectId, onSave }: IdeaClusteringReportViewerProps) => {
  const [expandedClusters, setExpandedClusters] = useState<{[key: string]: boolean}>({});
  const [expandedIdeaCards, setExpandedIdeaCards] = useState<{[key: number]: boolean}>({});
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

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No Idea Clustering data available</p>
      </div>
    );
  }

  const toggleCluster = (clusterId: string) => {
    setExpandedClusters(prev => ({ ...prev, [clusterId]: !prev[clusterId] }));
  };

  const toggleIdeaCard = (rank: number) => {
    setExpandedIdeaCards(prev => ({ ...prev, [rank]: !prev[rank] }));
  };

  const handleClusterMouseEnter = (clusterId: string) => {
    // Auto-expand after a short hover delay to preview content
    const timer = window.setTimeout(() => {
      setExpandedClusters(prev => ({ ...prev, [clusterId]: true }));
    }, 500);
    setHoverTimer(timer);
  };

  const handleIdeaCardMouseEnter = (rank: number) => {
    // Auto-expand after a short hover delay to preview content
    const timer = window.setTimeout(() => {
      setExpandedIdeaCards(prev => ({ ...prev, [rank]: true }));
    }, 500);
    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
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
            <p className="text-gray-600 mb-6">Are you sure you want to save these changes to the Idea Clustering and Idea Cards report?</p>
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
        <h1 className="text-3xl font-bold">Idea Clustering and Idea Cards Report</h1>
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
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Prioritized Pain Point</h3>
              {isEditMode ? (
                <textarea
                  value={reportData.project_context.prioritized_pain_point || ''}
                  onChange={(e) => updateTextAtPath(['project_context', 'prioritized_pain_point'], e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                />
              ) : (
                <p className="text-base leading-relaxed pl-4 break-words whitespace-normal">
                  {reportData.project_context.prioritized_pain_point || 'N/A'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Target Extreme User</h3>
                {isEditMode ? (
                  <textarea
                    value={reportData.project_context.target_extreme_user || ''}
                    onChange={(e) => updateTextAtPath(['project_context', 'target_extreme_user'], e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-base pl-4 break-words whitespace-normal">
                    {reportData.project_context.target_extreme_user || 'N/A'}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Geographic Focus</h3>
                {isEditMode ? (
                  <textarea
                    value={reportData.project_context.geographic_focus || ''}
                    onChange={(e) => updateTextAtPath(['project_context', 'geographic_focus'], e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-base pl-4 break-words whitespace-normal">
                    {reportData.project_context.geographic_focus || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Clusters */}
      {reportData.clusters && reportData.clusters.length > 0 && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Idea Clusters</h2>
          <p className="text-sm text-gray-600 mb-6">Click on any cluster to expand/collapse ideas</p>

          <div className="space-y-6">
            {reportData.clusters.map((cluster: any, idx: number) => (
              <div key={cluster.cluster_id}>
                {/* Cluster Header */}
                <button
                  onClick={() => toggleCluster(cluster.cluster_id)}
                  onMouseEnter={() => handleClusterMouseEnter(cluster.cluster_id)}
                  onMouseLeave={() => handleMouseLeave()}
                  className="w-full px-4 py-3 bg-gray-200 text-left hover:bg-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">Cluster {cluster.cluster_id}</span>
                      <span className="text-lg font-semibold">{cluster.cluster_name}</span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Score: {cluster.weighted_innovation_score}
                      </span>
                    </div>
                    <span className="text-xl">{expandedClusters[cluster.cluster_id] ? '−' : '+'}</span>
                  </div>
                </button>

                {/* Cluster Details */}
                {expandedClusters[cluster.cluster_id] && (
                  <div className="p-4 bg-white">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold mb-2">Core Function:</h4>
                        {isEditMode ? (
                          <textarea
                            value={cluster.core_function || ''}
                            onChange={(e) => updateTextAtPath(['clusters', idx, 'core_function'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-4">{cluster.core_function}</p>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Included Ideas ({cluster.included_ideas?.length || 0}):</h4>
                        <div className="space-y-2 pl-4">
                          {cluster.included_ideas?.map((idea: any, i: number) => (
                            <div key={idea.idea_id} className="p-2 bg-gray-50 rounded">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-sm flex-shrink-0">#{idea.idea_id}</span>
                                <div className="flex-1">
                                  {isEditMode ? (
                                    <>
                                      <input
                                        type="text"
                                        value={idea.idea_name || ''}
                                        onChange={(e) => updateTextAtPath(['clusters', idx, 'included_ideas', i, 'idea_name'], e.target.value)}
                                        className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                      />
                                      <textarea
                                        value={idea.hmw_statement || ''}
                                        onChange={(e) => updateTextAtPath(['clusters', idx, 'included_ideas', i, 'hmw_statement'], e.target.value)}
                                        rows={2}
                                        className="w-full mt-2 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <p className="font-semibold text-sm">{idea.idea_name}</p>
                                      <p className="text-xs text-gray-600 mt-1">{idea.hmw_statement}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {cluster.innovation_assessment && (
                        <div>
                          <h4 className="font-bold mb-2">Innovation Assessment:</h4>
                          <div className="grid grid-cols-2 gap-3 pl-4">
                              {Object.entries(cluster.innovation_assessment).map(([key, assessment]: [string, any], j: number) => (
                                key !== 'score' && (
                                  <div key={key} className="text-sm">
                                    <span className="font-semibold capitalize">
                                      {key.replace(/_/g, ' ')}:
                                    </span>
                                    {isEditMode ? (
                                      <div className="mt-1 pl-2 space-y-2">
                                        <input
                                          type="number"
                                          value={assessment.score ?? ''}
                                          onChange={(e) => updateTextAtPath(['clusters', idx, 'innovation_assessment', key, 'score'], Number(e.target.value))}
                                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                        />
                                        <textarea
                                          value={assessment.reasoning || ''}
                                          onChange={(e) => updateTextAtPath(['clusters', idx, 'innovation_assessment', key, 'reasoning'], e.target.value)}
                                          rows={2}
                                          className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <span className="ml-2">{assessment.score}/100</span>
                                        {assessment.reasoning && (
                                          <p className="text-xs text-gray-600 mt-1">{assessment.reasoning}</p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top 5 Clusters with Idea Cards */}
      {reportData.top_5_clusters && reportData.top_5_clusters.length > 0 && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Top Ranked Clusters & Idea Cards</h2>
          <p className="text-sm text-gray-600 mb-6">Click on any card to expand/collapse details</p>

          <div className="space-y-6">
            {reportData.top_5_clusters.map((cluster: any, idx: number) => (
              <div key={cluster.rank}>
                {/* Top Cluster Header */}
                <button
                  onClick={() => toggleIdeaCard(cluster.rank)}
                  onMouseEnter={() => handleIdeaCardMouseEnter(cluster.rank)}
                  onMouseLeave={() => handleMouseLeave()}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-100 to-blue-100 text-left hover:from-purple-200 hover:to-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-purple-700">{cluster.rank}</span>
                      <span className="text-lg font-semibold">{cluster.cluster_name}</span>
                      <span className="text-sm bg-purple-600 text-white px-2 py-1 rounded">
                        Final Score: {cluster.final_score}
                      </span>
                    </div>
                    <span className="text-xl">{expandedIdeaCards[cluster.rank] ? '−' : '+'}</span>
                  </div>
                </button>

                {/* Idea Card Details */}
                {expandedIdeaCards[cluster.rank] && cluster.idea_card && (
                  <div className="p-6 bg-white border-l-4 border-purple-500">
                    <div className="space-y-6">
                      {/* Need State */}
                      <div>
                        <h4 className="font-bold text-purple-700 mb-2">Need State:</h4>
                        {isEditMode ? (
                          <textarea
                            value={cluster.idea_card.need_state || ''}
                            onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'need_state'], e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-sm pl-4">{cluster.idea_card.need_state}</p>
                        )}
                      </div>

                      {/* Features */}
                      {cluster.idea_card.features && (
                        <div>
                          <h4 className="font-bold text-purple-700 mb-2">Key Features:</h4>
                          {isEditMode ? (
                            <div className="space-y-2 pl-4">
                              {cluster.idea_card.features.map((feature: string, i: number) => (
                                <textarea
                                  key={i}
                                  value={feature || ''}
                                  onChange={(e) => updateArrayItemAtPath(['top_5_clusters', idx, 'idea_card', 'features'], i, e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ))}
                            </div>
                          ) : (
                            <ul className="list-disc list-inside space-y-1 pl-4">
                              {cluster.idea_card.features.map((feature: string, i: number) => (
                                <li key={i} className="text-sm">{feature}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Innovations */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-bold text-purple-700 mb-2">Primary Innovation:</h4>
                          {isEditMode ? (
                            <textarea
                              value={cluster.idea_card.primary_innovation || ''}
                              onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'primary_innovation'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-4">{cluster.idea_card.primary_innovation}</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-purple-700 mb-2">Secondary Innovation:</h4>
                          {isEditMode ? (
                            <textarea
                              value={cluster.idea_card.secondary_innovation || ''}
                              onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'secondary_innovation'], e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <p className="text-sm pl-4">{cluster.idea_card.secondary_innovation}</p>
                          )}
                        </div>
                      </div>

                      {/* Market Opportunity */}
                      {cluster.idea_card.market_opportunity && (
                        <div>
                          <h4 className="font-bold text-purple-700 mb-2">Market Opportunity:</h4>
                          <div className="grid grid-cols-3 gap-4 pl-4">
                            <div className="text-sm">
                              <span className="font-semibold">Target Market:</span>
                              {isEditMode ? (
                                <textarea
                                  value={cluster.idea_card.market_opportunity.target_market || ''}
                                  onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'market_opportunity', 'target_market'], e.target.value)}
                                  rows={2}
                                  className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.market_opportunity.target_market}</p>
                              )}
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">Market Readiness:</span>
                              {isEditMode ? (
                                <textarea
                                  value={cluster.idea_card.market_opportunity.market_readiness || ''}
                                  onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'market_opportunity', 'market_readiness'], e.target.value)}
                                  rows={2}
                                  className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.market_opportunity.market_readiness}</p>
                              )}
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">Competitive Advantage:</span>
                              {isEditMode ? (
                                <textarea
                                  value={cluster.idea_card.market_opportunity.competitive_advantage || ''}
                                  onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'market_opportunity', 'competitive_advantage'], e.target.value)}
                                  rows={2}
                                  className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.market_opportunity.competitive_advantage}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Implementation Pathway */}
                      {cluster.idea_card.implementation_pathway && (
                        <div>
                          <h4 className="font-bold text-purple-700 mb-2">Implementation Pathway:</h4>
                          <div className="grid grid-cols-3 gap-4 pl-4">
                            <div className="text-sm">
                              <span className="font-semibold">Phase 1:</span>
                              {isEditMode ? (
                                <textarea
                                  value={cluster.idea_card.implementation_pathway.phase_1 || ''}
                                  onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'implementation_pathway', 'phase_1'], e.target.value)}
                                  rows={2}
                                  className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.implementation_pathway.phase_1}</p>
                              )}
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">Phase 2:</span>
                              {isEditMode ? (
                                <textarea
                                  value={cluster.idea_card.implementation_pathway.phase_2 || ''}
                                  onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'implementation_pathway', 'phase_2'], e.target.value)}
                                  rows={2}
                                  className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.implementation_pathway.phase_2}</p>
                              )}
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">Phase 3:</span>
                              {isEditMode ? (
                                <textarea
                                  value={cluster.idea_card.implementation_pathway.phase_3 || ''}
                                  onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'implementation_pathway', 'phase_3'], e.target.value)}
                                  rows={2}
                                  className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.implementation_pathway.phase_3}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Risk Assessment */}
                      {cluster.idea_card.risk_assessment && (
                        <div className="bg-red-50 p-4 rounded">
                          <h4 className="font-bold text-red-700 mb-2">Risk Assessment:</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-sm">
                              <span className="font-semibold text-red-600">Primary Risk:</span>
                              {isEditMode ? (
                                <textarea
                                  value={cluster.idea_card.risk_assessment.primary_risk || ''}
                                  onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'risk_assessment', 'primary_risk'], e.target.value)}
                                  rows={2}
                                  className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-xs text-gray-700 mt-1">{cluster.idea_card.risk_assessment.primary_risk}</p>
                              )}
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold text-red-600">Mitigation Strategy:</span>
                              {isEditMode ? (
                                <textarea
                                  value={cluster.idea_card.risk_assessment.mitigation_strategy || ''}
                                  onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'risk_assessment', 'mitigation_strategy'], e.target.value)}
                                  rows={2}
                                  className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-xs text-gray-700 mt-1">{cluster.idea_card.risk_assessment.mitigation_strategy}</p>
                              )}
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold text-green-600">Success Probability:</span>
                              {isEditMode ? (
                                <input
                                  type="number"
                                  value={cluster.idea_card.risk_assessment.success_probability ?? ''}
                                  onChange={(e) => updateTextAtPath(['top_5_clusters', idx, 'idea_card', 'risk_assessment', 'success_probability'], Number(e.target.value))}
                                  className="w-full mt-1 px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                />
                              ) : (
                                <p className="text-xs text-gray-700 mt-1">{cluster.idea_card.risk_assessment.success_probability}%</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Portfolio Analysis */}
      {reportData.portfolio_analysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Portfolio Analysis</h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Portfolio Balance</h3>
              <p className="text-sm pl-4">{reportData.portfolio_analysis.portfolio_balance}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Risk Distribution</h3>
              <p className="text-sm pl-4">{reportData.portfolio_analysis.risk_distribution}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Implementation Sequence</h3>
              <p className="text-sm pl-4">{reportData.portfolio_analysis.implementation_sequence}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Primary Prototype Recommendation</h3>
              <p className="text-sm pl-4">{reportData.portfolio_analysis.primary_prototype_recommendation}</p>
            </div>
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