import { useState } from 'react';

interface ExtremeUserReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
}

export const ExtremeUserReportViewer = ({ data, onGenerateNew }: ExtremeUserReportViewerProps) => {
  const [expandedUsers, setExpandedUsers] = useState<{[key: number]: boolean}>({});

  const reportData = data?.content || data;

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

  return (
    <div className="space-y-8">
      {/* Header with Generate New Button */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Extreme User Analysis Report</h1>
        {onGenerateNew && (
          <button
            onClick={onGenerateNew}
            className="px-6 py-2 font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Generate New
          </button>
        )}
      </div>

      {/* Pain Point Context */}
      {reportData.painPointAnalysis && (
        <section className="p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-4 pb-2">Pain Point Context</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Step Analyzed</h3>
              <p className="text-base pl-4">{reportData.painPointAnalysis.step}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-base pl-4 leading-relaxed">{reportData.painPointAnalysis.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">User Context</h3>
              <p className="text-base pl-4 leading-relaxed">{reportData.painPointAnalysis.userContext}</p>
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
                  className="w-full px-4 py-3 bg-gray-200 text-left hover:bg-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">#{index + 1}</span>
                      <span className="text-lg font-semibold">{user.label}</span>
                    </div>
                    <span className="text-xl">{expandedUsers[index] ? '−' : '+'}</span>
                  </div>
                </button>

                {/* User Details */}
                {expandedUsers[index] && (
                  <div className="p-4 space-y-4 bg-gray-50">
                    <div>
                      <h4 className="font-bold mb-2">Demographics</h4>
                      <p className="text-sm pl-4">{user.demographics}</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Amplified Needs</h4>
                      <p className="text-sm pl-4">{user.amplifiedNeeds}</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Pain Point Experience</h4>
                      <p className="text-sm pl-4">{user.painPointExperience}</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Current Workarounds</h4>
                      <p className="text-sm pl-4">{user.currentWorkarounds}</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Unique Challenges</h4>
                      <p className="text-sm pl-4">{user.uniqueChallenges}</p>
                    </div>

                    <div className="pt-3 mt-3 bg-gray-100 p-3">
                      <h4 className="font-bold mb-2">Research Value</h4>
                      <p className="text-sm pl-4 font-semibold">{user.researchValue}</p>
                    </div>

                    <div>
                      <h4 className="font-bold mb-2">Interview Focus Areas</h4>
                      <p className="text-sm pl-4">{user.interviewFocus}</p>
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
              const userIndex = index + 1000; // Unique key to avoid conflicts with power users
              return (
                <div key={index} className="bg-white">
                  {/* User Header */}
                  <button
                    onClick={() => toggleUser(userIndex)}
                    className="w-full px-4 py-3 bg-gray-200 text-left hover:bg-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">#{index + 1}</span>
                        <span className="text-lg font-semibold">{user.label}</span>
                      </div>
                      <span className="text-xl">{expandedUsers[userIndex] ? '−' : '+'}</span>
                    </div>
                  </button>

                  {/* User Details */}
                  {expandedUsers[userIndex] && (
                    <div className="p-4 space-y-4 bg-gray-50">
                      <div>
                        <h4 className="font-bold mb-2">Demographics</h4>
                        <p className="text-sm pl-4">{user.demographics}</p>
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Barriers Faced</h4>
                        <p className="text-sm pl-4">{user.barriersFaced}</p>
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Pain Point Experience</h4>
                        <p className="text-sm pl-4">{user.painPointExperience}</p>
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Exclusion Factors</h4>
                        <p className="text-sm pl-4">{user.exclusionFactors}</p>
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Unique Challenges</h4>
                        <p className="text-sm pl-4">{user.uniqueChallenges}</p>
                      </div>

                      <div className="pt-3 mt-3 bg-gray-100 p-3">
                        <h4 className="font-bold mb-2">Research Value</h4>
                        <p className="text-sm pl-4 font-semibold">{user.researchValue}</p>
                      </div>

                      <div>
                        <h4 className="font-bold mb-2">Interview Focus Areas</h4>
                        <p className="text-sm pl-4">{user.interviewFocus}</p>
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
                <p className="text-sm pl-4">{reportData.researchStrategy.userRecruitment}</p>
              </div>
            )}

            {reportData.researchStrategy.interviewApproach && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Interview Approach</h3>
                <p className="text-sm pl-4">{reportData.researchStrategy.interviewApproach}</p>
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
                <p className="text-sm pl-4">{reportData.designImplications.powerUserInsights}</p>
              </div>
            )}

            {reportData.designImplications.marginalizedUserInsights && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Marginalized User Insights</h3>
                <p className="text-sm pl-4">{reportData.designImplications.marginalizedUserInsights}</p>
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
