import React from 'react';
import { Card } from './card';
import { IOSAssessment } from '@/services/iosFramework';
import { SourceVerificationService } from '@/services/sourceVerificationService';

interface IOSAssessmentCardProps {
  assessment: IOSAssessment;
  problemTitle: string;
  className?: string;
  onClick?: () => void;
}

export const IOSAssessmentCard: React.FC<IOSAssessmentCardProps> = ({
  assessment,
  problemTitle,
  className = '',
  onClick
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 16) return 'text-green-600';
    if (score >= 12) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTotalScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTotalScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getOpportunityLevel = (score: number) => {
    if (score >= 70) return 'High Opportunity';
    if (score >= 50) return 'Moderate Opportunity';
    return 'Limited Opportunity';
  };

  // Calculate overall source verification score
  const calculateSourceVerificationScore = () => {
    // Flatten all sources, including nested sources in 7th metric subscores
    const allSources: any[] = [];
    Object.entries(assessment.dimensions).forEach(([key, dim]) => {
      // For systemMetrics or businessMetrics, sources are nested in subscores
      if (key === 'systemMetrics' || key === 'businessMetrics') {
        Object.values(dim.subscores).forEach((sub: any) => {
          if (sub && typeof sub === 'object' && Array.isArray(sub.sources)) {
            allSources.push(...sub.sources);
          }
        });
      } else {
        if (Array.isArray(dim.sources)) {
          allSources.push(...dim.sources);
        }
      }
    });
    if (allSources.length === 0) return 0;
    const totalScore = allSources.reduce((sum, source) => {
      if (!source || typeof source.tier === 'undefined') return sum;
      const tierInfo = SourceVerificationService.getTierInfo(source.tier);
      const tierWeight = tierInfo ? tierInfo.credibilityScore / 100 : 0.5;
      const biasWeight = (source.biasScore || 75) / 100;
      return sum + (tierWeight * biasWeight * 100);
    }, 0);
    return Math.round(totalScore / allSources.length);
  };

  const sourceVerificationScore = calculateSourceVerificationScore();

  return (
    <Card className={`p-6 ${className}`} onClick={onClick}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{problemTitle}</h3>
        
        {/* Total Score and Source Verification */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">Total IOS Score</div>
          <div className={`text-2xl font-bold ${getTotalScoreColor(assessment.totalScore)}`}>
            {assessment.totalScore}/100
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">Source Verification</div>
          <div className={`text-lg font-bold ${sourceVerificationScore >= 80 ? 'text-green-600' : sourceVerificationScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {sourceVerificationScore}/100
          </div>
        </div>
        
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTotalScoreBgColor(assessment.totalScore)} ${getTotalScoreColor(assessment.totalScore)}`}>
          {getOpportunityLevel(assessment.totalScore)}
        </div>
      </div>

      {/* Assessment Mode and Resource Tier */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Assessment Mode</div>
          <div className="font-medium capitalize">{assessment.assessmentMode}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Resource Tier</div>
          <div className="font-medium capitalize">{assessment.resourceTier}</div>
        </div>
      </div>

      {/* Source Verification Summary */}
      <div className="mb-6 p-4 bg-blue-100 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Source Verification Framework</h4>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {[1, 2, 3, 4, 5].map(tier => {
            // For each dimension, collect sources for this tier
            const tierSources = Object.entries(assessment.dimensions).flatMap(([key, d]) => {
              if (key === 'systemMetrics' || key === 'businessMetrics') {
                // Aggregate sources from all subscores
                return Object.values(d.subscores).flatMap((sub: any) =>
                  (sub && Array.isArray(sub.sources)) ? sub.sources.filter((s: any) => s && s.tier === tier) : []
                );
              } else if (d && Array.isArray(d.sources)) {
                return d.sources.filter((s: any) => s && s.tier === tier);
              }
              return [];
            });
            const tierInfo = SourceVerificationService.getTierInfo(tier);
            return (
              <div key={tier} className="text-center">
                <div className={`px-2 py-1 rounded text-white font-medium ${SourceVerificationService.getTierColor(tier).replace('text-', 'bg-').replace('border-', '')}`}>
                  Tier {tier}
                </div>
                <div className="text-gray-600 mt-1">{tierSources.length}</div>
                <div className="text-gray-500">{tierInfo?.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dimensions Grid */}
      <div className="space-y-4">
        {Object.entries(assessment.dimensions).map(([key, dimension], idx, arr) => {
          // Special handling for 7th metric
          const isSystem = key === 'systemMetrics';
          const isBusiness = key === 'businessMetrics';
          if (isSystem || isBusiness) {
            return (
              <div
                key={key}
                className={`border-2 rounded-lg p-4 shadow-md ${isSystem ? 'border-blue-500 bg-blue-50' : 'border-yellow-500 bg-yellow-50'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg text-gray-900">{dimension.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isSystem ? 'bg-blue-500 text-white' : 'bg-yellow-500 text-white'}`}>{isSystem ? 'System-Focused Metric' : 'Business-Focused Metric'}</span>
                  </div>
                  <div className={`text-lg font-bold ${getScoreColor(dimension.score)}`}>{dimension.score}/20</div>
                </div>
                <div className="text-xs text-gray-500 mb-4">{dimension.weight}% weight</div>
                {/* Render each subscore with extra info */}
                <div className="space-y-4">
                  {Object.entries(dimension.subscores).map(([subKey, subVal]) => {
                    // subVal is expected to be { score, weight, evidence, sources }
                    // fallback for old format: if subVal is a number, treat as score only
                    if (typeof subVal === 'number') {
                      // Render like a standard metric with minimal info
                      return (
                        <div key={subKey} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{subKey.replace(/([A-Z])/g, ' $1').trim()}</h4>
                              <div className="text-xs text-gray-500">20% weight</div>
                            </div>
                            <div className={`text-lg font-bold ${getScoreColor(subVal)}`}>{subVal}/20</div>
                          </div>
                        </div>
                      );
                    }
                    const { score, weight, evidence = [], sources = [] } = subVal as any;
                    return (
                      <div key={subKey} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{subKey.replace(/([A-Z])/g, ' $1').trim()}</h4>
                            <div className="text-xs text-gray-500">{weight}% weight</div>
                          </div>
                          <div className={`text-lg font-bold ${getScoreColor(score)}`}>{score}/20</div>
                        </div>
                        {/* Evidence */}
                        {evidence.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-1">Evidence:</div>
                            <ul className="text-xs text-gray-700 space-y-1">
                              {evidence.map((ev: string, i: number) => (
                                <li key={i} className="flex items-start"><span className="text-gray-400 mr-1">•</span>{ev}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Sources */}
                        {sources.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 mb-2">Verified Sources:</div>
                            <div className="space-y-2">
                              {sources.slice(0, 3).map((source: any, index: number) => {
                                return (
                                  <div key={index} className="border-l-4 border-gray-200 pl-3 py-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center">
                                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${source.tier <= 2 ? 'bg-green-400' : source.tier <= 3 ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                                        <span className="text-xs font-medium text-gray-900">{source.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${SourceVerificationService.getTierColor(source.tier)}`}>Tier {source.tier}</span>
                                        <span className={`text-xs ${SourceVerificationService.getBiasColor(source.biasScore || 75)}`}></span>
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-600 mb-1">{source.credibility}</div>
                                    {source.url && (
                                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>View Source →</a>
                                    )}
                                  </div>
                                );
                              })}
                              {sources.length > 3 && (
                                <div className="text-xs text-gray-500">+{sources.length - 3} more verified sources</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          // Default rendering for other metrics
          return (
            <div key={key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{dimension.name}</h4>
                  <div className="text-xs text-gray-500">{dimension.weight}% weight</div>
                </div>
                <div className={`text-lg font-bold ${getScoreColor(dimension.score)}`}>{dimension.score}/20</div>
              </div>
              {/* Subscores */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {Object.entries(dimension.subscores).map(([subscoreKey, score]) => (
                  <div key={subscoreKey} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{subscoreKey.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className={`text-sm font-medium ${getScoreColor(score)}`}>{score}</div>
                  </div>
                ))}
              </div>
              {/* Evidence */}
              {dimension.evidence.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Evidence:</div>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {dimension.evidence.slice(0, 2).map((evidence, index) => (
                      <li key={index} className="flex items-start"><span className="text-gray-400 mr-1">•</span>{evidence}</li>
                    ))}
                    {dimension.evidence.length > 2 && (
                      <li className="text-gray-500">+{dimension.evidence.length - 2} more</li>
                    )}
                  </ul>
                </div>
              )}
              {/* Enhanced Sources Display */}
              {dimension.sources.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Verified Sources:</div>
                  <div className="space-y-2">
                    {dimension.sources.slice(0, 3).map((source, index) => {
                      return (
                        <div key={index} className="border-l-4 border-gray-200 pl-3 py-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${source.tier <= 2 ? 'bg-green-400' : source.tier <= 3 ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                              <span className="text-xs font-medium text-gray-900">{source.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${SourceVerificationService.getTierColor(source.tier)}`}>Tier {source.tier}</span>
                              <span className={`text-xs ${SourceVerificationService.getBiasColor(source.biasScore || 75)}`}></span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">{source.credibility}</div>
                          {source.url && (
                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>View Source →</a>
                          )}
                        </div>
                      );
                    })}
                    {dimension.sources.length > 3 && (
                      <div className="text-xs text-gray-500">+{dimension.sources.length - 3} more verified sources</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cultural Factors and Trend Analysis */}
      {(assessment.culturalFactors.length > 0 || assessment.trendAnalysis.length > 0) && (
        <div className="mt-6 space-y-4">
          {assessment.culturalFactors.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Cultural Factors</h4>
              <div className="space-y-1">
                {assessment.culturalFactors.map((factor, index) => (
                  <div key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {assessment.trendAnalysis.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Trend Analysis</h4>
              <div className="space-y-1">
                {assessment.trendAnalysis.map((trend, index) => (
                  <div key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    {trend}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {assessment.recommendations.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
          <div className="space-y-1">
            {assessment.recommendations.map((recommendation, index) => (
              <div key={index} className="text-sm text-gray-700 flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                {recommendation}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment Metadata */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Created: {new Date(assessment.createdAt).toLocaleDateString()}</span>
          <span>Updated: {new Date(assessment.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Card>
  );
};

// Compact version for use in lists
export const IOSAssessmentCardCompact: React.FC<IOSAssessmentCardProps> = ({
  assessment,
  problemTitle,
  className = '',
  onClick
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 16) return 'text-green-600';
    if (score >= 12) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTotalScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate source verification score for compact view
  const calculateSourceVerificationScore = () => {
    // Flatten all sources, including nested sources in 7th metric subscores
    const allSources: any[] = [];
    Object.entries(assessment.dimensions).forEach(([key, dim]) => {
      // For systemMetrics or businessMetrics, sources are nested in subscores
      if (key === 'systemMetrics' || key === 'businessMetrics') {
        Object.values(dim.subscores).forEach((sub: any) => {
          if (sub && typeof sub === 'object' && Array.isArray(sub.sources)) {
            allSources.push(...sub.sources);
          }
        });
      } else {
        if (Array.isArray(dim.sources)) {
          allSources.push(...dim.sources);
        }
      }
    });
    if (allSources.length === 0) return 0;
    const totalScore = allSources.reduce((sum, source) => {
      if (!source || typeof source.tier === 'undefined') return sum;
      const tierInfo = SourceVerificationService.getTierInfo(source.tier);
      const tierWeight = tierInfo ? tierInfo.credibilityScore / 100 : 0.5;
      const biasWeight = (source.biasScore || 75) / 100;
      return sum + (tierWeight * biasWeight * 100);
    }, 0);
    return Math.round(totalScore / allSources.length);
  };

  const sourceVerificationScore = calculateSourceVerificationScore();

  // Count sources by tier
  const tierCounts = [1, 2, 3, 4, 5].map(tier => {
    const count = Object.values(assessment.dimensions).flatMap(d => 
      d.sources.filter(s => s.tier === tier)
    ).length;
    return { tier, count };
  }).filter(t => t.count > 0);

  return (
    <Card className={`p-4 ${className}`} onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">{problemTitle}</h4>
        <div className="text-right">
          <div className={`text-lg font-bold ${getTotalScoreColor(assessment.totalScore)}`}>
            {assessment.totalScore}
          </div>
          <div className="text-xs text-gray-500">IOS Score</div>
        </div>
      </div>

      {/* Source Verification Score */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-600">Source Verification:</span>
        <div className="text-right">
          <div className={`text-sm font-bold ${sourceVerificationScore >= 80 ? 'text-green-600' : sourceVerificationScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {sourceVerificationScore}/100
          </div>
          <div className="text-xs text-gray-500">Credibility</div>
        </div>
      </div>

      {/* Source Tier Distribution */}
      {tierCounts.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">Source Tiers:</div>
          <div className="flex gap-1">
            {tierCounts.map(({ tier, count }) => (
              <div key={tier} className="flex items-center">
                <span className={`px-1 py-0.5 rounded text-xs font-medium ${SourceVerificationService.getTierColor(tier)}`}>
                  T{tier}:{count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 3 Dimensions */}
      <div className="space-y-2">
        {Object.entries(assessment.dimensions)
          .sort(([, a], [, b]) => b.score - a.score)
          .slice(0, 3)
          .map(([key, dimension]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{dimension.name}</span>
              <span className={`font-medium ${getScoreColor(dimension.score)}`}>
                {dimension.score}/20
              </span>
            </div>
          ))}
      </div>

      {/* Assessment Mode */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Mode:</span>
          <span className="font-medium capitalize">{assessment.assessmentMode}</span>
        </div>
      </div>
    </Card>
  );
}; 