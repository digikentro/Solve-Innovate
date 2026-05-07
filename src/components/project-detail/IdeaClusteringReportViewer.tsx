import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FiChevronDown, FiChevronUp, FiEdit3, FiRefreshCw, FiSave, FiX, FiCheckCircle, FiAlertCircle, FiAward, FiTarget, FiTrendingUp, FiShield } from 'react-icons/fi';

interface IdeaClusteringReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const IdeaClusteringReportViewer = ({ data, onGenerateNew, projectId, onSave }: IdeaClusteringReportViewerProps) => {
  const [expandedClusters, setExpandedClusters] = useState<{[key: string]: boolean}>({ '1': true });
  const [expandedIdeaCards, setExpandedIdeaCards] = useState<{[key: number]: boolean}>({ 1: true });
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
        <p className="text-xs text-gray-400 uppercase tracking-widest">No Clustering Data Available</p>
      </div>
    );
  }

  const toggleCluster = (clusterId: string) => {
    setExpandedClusters(prev => ({ ...prev, [clusterId]: !prev[clusterId] }));
  };

  const toggleIdeaCard = (rank: number) => {
    setExpandedIdeaCards(prev => ({ ...prev, [rank]: !prev[rank] }));
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-24">
      {/* Toast Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-900">✓ Clustering Analysis Saved Successfully</p>
        </div>
      )}
      
      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn rounded-xl border border-red-200 bg-white px-6 py-4 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600">✗ {errorText}</p>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Idea Clustering
          </h1>
          <p className="mt-2 max-w-xl text-base leading-snug text-gray-500">
            Strategic Synthesis & Ranking
          </p>
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
                    className="rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-lg bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-black/90 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
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
              className="rounded-lg bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate New
            </button>
          )}
        </div>
      </div>

      {/* Foundation Context */}
      {reportData.project_context && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Foundation Analysis</h2>
          
          <div className="flex flex-col gap-10">
            <div>
              <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Prioritized Pain Point</label>
              {isEditMode ? (
                <textarea
                  value={reportData.project_context.prioritized_pain_point || ''}
                  onChange={(e) => updateTextAtPath(['project_context', 'prioritized_pain_point'], e.target.value)}
                  className="min-h-[100px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  rows={3}
                />
              ) : (
                <p className="border-l-2 border-gray-900 pl-4 text-base leading-relaxed text-gray-900">
                  {reportData.project_context.prioritized_pain_point}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Target Extreme User</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.project_context.target_extreme_user || ''}
                    onChange={(e) => updateTextAtPath(['project_context', 'target_extreme_user'], e.target.value)}
                    rows={3}
                    className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <p className="border-l border-gray-200 pl-4 text-sm leading-relaxed text-gray-600">
                    {reportData.project_context.target_extreme_user}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Geographic Focus</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.project_context.geographic_focus || ''}
                    onChange={(e) => updateTextAtPath(['project_context', 'geographic_focus'], e.target.value)}
                    rows={3}
                    className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed pl-4 border-l border-gray-200">
                    {reportData.project_context.geographic_focus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Idea Clusters */}
      <div className="space-y-6">
        <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Solution Ideation Catalog</h2>
        
        {reportData.clusters?.map((cluster: any, idx: number) => (
          <div key={cluster.cluster_id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button
              onClick={() => toggleCluster(cluster.cluster_id)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">CLUSTER 0{cluster.cluster_id}</span>
                <span className="text-sm font-medium">{cluster.cluster_name || 'Innovation Cluster'}</span>
              </div>
              <span className="text-xs">{expandedClusters[cluster.cluster_id] ? 'CLOSE' : 'EXPAND'}</span>
            </button>
            
            {expandedClusters[cluster.cluster_id] && (
              <div className="border-t border-gray-100 bg-white p-6 space-y-6">
                <div>
                  <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Core Strategic Function</label>
                  {isEditMode ? (
                    <textarea
                      value={cluster.core_function || ''}
                      onChange={(e) => updateTextAtPath(['clusters', idx, 'core_function'], e.target.value)}
                      rows={2}
                      className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900 pl-4 border-l-2 border-gray-900 leading-relaxed">{cluster.core_function}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-50 md:grid-cols-2 md:gap-6 md:border-t-0 md:pt-0">
                  <div>
                    <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Included Concepts ({cluster.included_ideas?.length})</label>
                    <div className="space-y-2">
                      {cluster.included_ideas?.map((idea: any, i: number) => (
                        <div key={i} className="flex gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <span className="text-[10px] font-bold text-gray-400 pt-1">#{idea.idea_id}</span>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{idea.idea_name}</p>
                            <p className="text-[10px] text-gray-500 italic leading-snug">{idea.hmw_statement}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Innovation Assessment</label>
                    <div className="grid grid-cols-1 gap-6">
                      {Object.entries(cluster.innovation_assessment || {}).map(([key, assessment]: [string, any], j: number) => (
                        key !== 'score' && (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                              <span className="text-xs font-medium text-gray-400">{assessment.score}/100</span>
                            </div>
                            <div className="w-full h-1 bg-gray-100">
                              <div className="h-full bg-black transition-all" style={{ width: `${assessment.score}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed pt-1">{assessment.reasoning}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top Ranked Idea Cards */}
      <div className="space-y-6">
        <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Strategic Concept Cards</h2>
        
        {reportData.top_5_clusters?.map((cluster: any, idx: number) => (
          <div key={cluster.rank} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button
              onClick={() => toggleIdeaCard(cluster.rank)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl font-light italic text-gray-300">0{cluster.rank}</span>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-gray-900">{cluster.cluster_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">Final Score</span>
                    <span className="text-[10px] font-semibold text-gray-900">{cluster.final_score}</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500">{expandedIdeaCards[cluster.rank] ? 'CLOSE' : 'EXPAND'}</span>
            </button>

            {expandedIdeaCards[cluster.rank] && cluster.idea_card && (
              <div className="border-t border-gray-100 bg-white p-8 space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Need State Definition</label>
                    <p className="text-base font-medium text-gray-900 italic leading-relaxed border-l-2 border-gray-900 pl-4">"{cluster.idea_card.need_state}"</p>
                  </div>
                  
                  <div>
                    <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Key Features</label>
                    <div className="space-y-2">
                      {cluster.idea_card.features?.map((feature: string, i: number) => (
                        <div key={i} className="flex gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <span className="text-[10px] font-bold text-gray-400 pt-1">#{i+1}</span>
                          <p className="text-xs text-gray-600 leading-relaxed">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-50 md:grid-cols-2 md:gap-6 md:border-t-0 md:pt-0">
                    <div>
                      <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Primary Innovation</label>
                      <p className="text-sm text-gray-600 pl-4 border-l border-gray-200 leading-relaxed">{cluster.idea_card.primary_innovation}</p>
                    </div>
                    <div>
                      <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Secondary Innovation</label>
                      <p className="text-sm text-gray-600 pl-4 border-l border-gray-200 leading-relaxed">{cluster.idea_card.secondary_innovation}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      { label: 'Target Segment', value: cluster.idea_card.market_opportunity?.target_market },
                      { label: 'Market Readiness', value: cluster.idea_card.market_opportunity?.market_readiness },
                      { label: 'Competitive Edge', value: cluster.idea_card.market_opportunity?.competitive_advantage }
                    ].map((m, mi) => (
                      <div key={mi} className="space-y-2">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">{m.label}</span>
                        <p className="text-xs text-gray-600 leading-relaxed">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-50 md:grid-cols-2 md:border-t-0 md:pt-0">
                    <div>
                      <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Implementation Pathway</label>
                      <div className="space-y-3">
                        {[
                          { phase: '01', label: 'Initial Integration', value: cluster.idea_card.implementation_pathway?.phase_1 },
                          { phase: '02', label: 'Expansion & Scale', value: cluster.idea_card.implementation_pathway?.phase_2 },
                          { phase: '03', label: 'System Maturity', value: cluster.idea_card.implementation_pathway?.phase_3 }
                        ].map((p, pi) => (
                          <div key={pi} className="space-y-1">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">{p.phase} — {p.label}</span>
                            <p className="text-xs text-gray-600 leading-relaxed pl-4 border-l border-gray-100">{p.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-2">
                        <FiShield className="w-3 h-3" /> Risk Assessment
                      </label>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Primary Risk</span>
                          <p className="text-xs text-gray-600 pl-4 border-l border-gray-100 leading-relaxed">{cluster.idea_card.risk_assessment?.primary_risk}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Mitigation</span>
                          <p className="text-xs text-gray-600 pl-4 border-l border-gray-100 leading-relaxed">{cluster.idea_card.risk_assessment?.mitigation_strategy}</p>
                        </div>
                        <div className="pt-2 border-t border-gray-100 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Success Probability</span>
                            <span className="text-sm font-medium text-gray-900">{cluster.idea_card.risk_assessment?.success_probability}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Portfolio Analysis */}
      {reportData.portfolio_analysis && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Portfolio Strategic Synthesis</h2>
          
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Portfolio Balance</label>
              <p className="text-sm text-gray-600 leading-relaxed pl-4 border-l border-gray-200">{reportData.portfolio_analysis.portfolio_balance}</p>
            </div>
            <div>
              <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Risk Distribution</label>
              <p className="text-sm text-gray-600 leading-relaxed pl-4 border-l border-gray-200">{reportData.portfolio_analysis.risk_distribution}</p>
            </div>
            <div>
              <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Implementation Sequence</label>
              <p className="text-sm text-gray-600 leading-relaxed pl-4 border-l border-gray-200">{reportData.portfolio_analysis.implementation_sequence}</p>
            </div>
            <div>
              <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Primary Prototype Recommendation</label>
              <p className="text-sm font-medium text-gray-900 leading-relaxed pl-4 border-l-2 border-gray-900">{reportData.portfolio_analysis.primary_prototype_recommendation}</p>
            </div>
          </div>
        </section>
      )}

      {/* Footer Metadata */}
      {data.generated_at && (
        <div className="text-xs text-gray-500 text-center pt-8 border-t border-gray-100 uppercase tracking-widest">
          Analysis Synchronized on {new Date(data.generated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
};