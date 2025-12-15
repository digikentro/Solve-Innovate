import { useState } from 'react';

interface IdeaClusteringReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
}

export const IdeaClusteringReportViewer = ({ data, onGenerateNew }: IdeaClusteringReportViewerProps) => {
  const [expandedClusters, setExpandedClusters] = useState<{[key: string]: boolean}>({});
  const [expandedIdeaCards, setExpandedIdeaCards] = useState<{[key: number]: boolean}>({});

  const reportData = data?.content || data;

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

  return (
    <div className="space-y-8">
      {/* Header with Generate New Button */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Idea Clustering and Idea Cards Report</h1>
        {onGenerateNew && (
          <button
            onClick={onGenerateNew}
            className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Generate New
          </button>
        )}
      </div>

      {/* Project Context */}
      {reportData.project_context && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Project Context</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Prioritized Pain Point</h3>
              <p className="text-base leading-relaxed pl-4 break-words whitespace-normal">
                {reportData.project_context.prioritized_pain_point || 'N/A'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Target Extreme User</h3>
                <p className="text-base pl-4 break-words whitespace-normal">
                  {reportData.project_context.target_extreme_user || 'N/A'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Geographic Focus</h3>
                <p className="text-base pl-4 break-words whitespace-normal">
                  {reportData.project_context.geographic_focus || 'N/A'}
                </p>
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
            {reportData.clusters.map((cluster: any) => (
              <div key={cluster.cluster_id}>
                {/* Cluster Header */}
                <button
                  onClick={() => toggleCluster(cluster.cluster_id)}
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
                        <p className="text-sm pl-4">{cluster.core_function}</p>
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Included Ideas ({cluster.included_ideas?.length || 0}):</h4>
                        <div className="space-y-2 pl-4">
                          {cluster.included_ideas?.map((idea: any) => (
                            <div key={idea.idea_id} className="p-2 bg-gray-50 rounded">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-sm flex-shrink-0">#{idea.idea_id}</span>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{idea.idea_name}</p>
                                  <p className="text-xs text-gray-600 mt-1">{idea.hmw_statement}</p>
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
                            {Object.entries(cluster.innovation_assessment).map(([key, assessment]: [string, any]) => (
                              key !== 'score' && (
                                <div key={key} className="text-sm">
                                  <span className="font-semibold capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="ml-2">{assessment.score}/100</span>
                                  {assessment.reasoning && (
                                    <p className="text-xs text-gray-600 mt-1">{assessment.reasoning}</p>
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
            {reportData.top_5_clusters.map((cluster: any) => (
              <div key={cluster.rank}>
                {/* Top Cluster Header */}
                <button
                  onClick={() => toggleIdeaCard(cluster.rank)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-100 to-blue-100 text-left hover:from-purple-200 hover:to-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-purple-700">#{cluster.rank}</span>
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
                        <p className="text-sm pl-4">{cluster.idea_card.need_state}</p>
                      </div>

                      {/* Features */}
                      {cluster.idea_card.features && (
                        <div>
                          <h4 className="font-bold text-purple-700 mb-2">Key Features:</h4>
                          <ul className="list-disc list-inside space-y-1 pl-4">
                            {cluster.idea_card.features.map((feature: string, i: number) => (
                              <li key={i} className="text-sm">{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Innovations */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-bold text-purple-700 mb-2">Primary Innovation:</h4>
                          <p className="text-sm pl-4">{cluster.idea_card.primary_innovation}</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-purple-700 mb-2">Secondary Innovation:</h4>
                          <p className="text-sm pl-4">{cluster.idea_card.secondary_innovation}</p>
                        </div>
                      </div>

                      {/* Market Opportunity */}
                      {cluster.idea_card.market_opportunity && (
                        <div>
                          <h4 className="font-bold text-purple-700 mb-2">Market Opportunity:</h4>
                          <div className="grid grid-cols-3 gap-4 pl-4">
                            <div className="text-sm">
                              <span className="font-semibold">Target Market:</span>
                              <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.market_opportunity.target_market}</p>
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">Market Readiness:</span>
                              <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.market_opportunity.market_readiness}</p>
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">Competitive Advantage:</span>
                              <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.market_opportunity.competitive_advantage}</p>
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
                              <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.implementation_pathway.phase_1}</p>
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">Phase 2:</span>
                              <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.implementation_pathway.phase_2}</p>
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold">Phase 3:</span>
                              <p className="text-xs text-gray-600 mt-1">{cluster.idea_card.implementation_pathway.phase_3}</p>
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
                              <p className="text-xs text-gray-700 mt-1">{cluster.idea_card.risk_assessment.primary_risk}</p>
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold text-red-600">Mitigation Strategy:</span>
                              <p className="text-xs text-gray-700 mt-1">{cluster.idea_card.risk_assessment.mitigation_strategy}</p>
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold text-green-600">Success Probability:</span>
                              <p className="text-xs text-gray-700 mt-1">{cluster.idea_card.risk_assessment.success_probability}%</p>
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