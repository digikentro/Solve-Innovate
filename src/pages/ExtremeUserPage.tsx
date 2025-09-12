import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Users, AlertTriangle, Lightbulb, Target, BarChart3, Globe, Heart, Brain, Eye, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

interface ExtremeUserData {
  content: {
    painPointAnalysis?: {
      step: string;
      description: string;
      userContext: string;
    };
    extremeUserProfiles?: {
      powerUsersHighNeedExtreme: Array<{
        label: string;
        demographics: string;
        amplifiedNeeds: string;
        painPointExperience: string;
        currentWorkarounds: string;
        uniqueChallenges: string;
        researchValue: string;
        interviewFocus: string;
      }>;
      marginalizedUsersBarrierFacingExtreme: Array<{
        label: string;
        demographics: string;
        barriersFaced: string;
        painPointExperience: string;
        exclusionFactors: string;
        uniqueChallenges: string;
        researchValue: string;
        interviewFocus: string;
      }>;
    };
    researchStrategy?: {
      userRecruitment: string;
      interviewApproach: string;
      keyInsightsToExplore: string | string[];
      expectedBreakthroughAreas: string | string[];
    };
    designImplications?: {
      powerUserInsights: string;
      marginalizedUserInsights: string;
      solutionOpportunities: string[];
      implementationConsiderations: string[];
    };
  };
  generated_at: string;
  prompt: string;
}

export default function ExtremeUserPage() {
  const params = useParams();
  const projectId = params.id;
  const navigate = useNavigate();
  const [extremeUserData, setExtremeUserData] = useState<ExtremeUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState<string>('');

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const fetchExtremeUserData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        
        // Get the project data including extreme_user_data
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('title, extreme_user_data')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProjectTitle(projectData.title);

        // Extract content using the same approach as AsIsMap
        const getExtremeUserContent = (data: any) => {
          if (!data) return null;

          // If it's a JSON string, try parsing it
          if (typeof data === 'string') {
            const raw = data.trim();
            
            // Try to extract JSON from fenced code blocks
            const fencedMatch = raw.match(/```(?:json)?\n([\s\S]*?)\n```/i);
            const possibleJson = fencedMatch ? fencedMatch[1] : raw;

            const cleaned = possibleJson
              .replace(/^```(?:json)?/i, '')
              .replace(/```$/i, '')
              .trim();

            try {
              const parsed = JSON.parse(cleaned);
              return (
                parsed?.[0]?.message?.content ||
                parsed?.message?.content ||
                parsed?.content ||
                parsed?.data ||
                parsed?.result ||
                parsed?.response ||
                parsed
              );
            } catch {
              try {
                const lenient = cleaned
                  .replace(/([,{\s])'([^']+)'\s*:/g, '$1"$2":')
                  .replace(/:\s*'([^']*)'/g, ': "$1"');
                const parsed2 = JSON.parse(lenient);
                return (
                  parsed2?.[0]?.message?.content ||
                  parsed2?.message?.content ||
                  parsed2?.content ||
                  parsed2?.data ||
                  parsed2?.result ||
                  parsed2?.response ||
                  parsed2
                );
              } catch {
                return data;
              }
            }
          }

          // Common shapes returned by different services
          return (
            data?.[0]?.message?.content ||
            data?.message?.content ||
            data?.content ||
            data?.data ||
            data?.result ||
            data?.response ||
            data
          );
        };

        const content = getExtremeUserContent(projectData.extreme_user_data);
        console.log('Extreme User Data fetched from Supabase:', content);

        if (content && typeof content === 'object' && Object.keys(content).length > 0) {
          setExtremeUserData({ content, generated_at: new Date().toISOString(), prompt: '' } as ExtremeUserData);
        } else {
          // No extreme user data found yet
          toast.loading('Extreme User data is still being generated. Please wait and refresh.', {
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error fetching extreme user data:', error);
        toast.error('Failed to load extreme user data');
      } finally {
        setLoading(false);
      }
    };

    fetchExtremeUserData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Extreme User Analysis...</h2>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!extremeUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Extreme User Analysis Not Ready</h2>
          <p className="text-gray-500 mb-6">
            The extreme user analysis is still being generated. This process typically takes a few minutes.
          </p>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/projects/${projectId}`)}
              className="w-full"
            >
              Back to Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-[70vw] mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            onClick={() => navigate(`/projects/${projectId}`)}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Extreme User Analysis</h1>
            <p className="text-gray-600 mt-1">{projectTitle}</p>
          </div>
        </div>

                 {/* Pain Point Analysis */}
         {extremeUserData.content.painPointAnalysis && (
           <Card className="p-6 mb-8 bg-gradient-to-r from-black-50 to-orange-50 border-black-200">
             <div className="flex items-start gap-3 mb-4">
               <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                 <AlertTriangle className="w-5 h-5 text-black-600" />
               </div>
               <div>
                 <h2 className="text-xl font-semibold text-black-900">Pain Point Analysis</h2>
                 <p className="text-black-700 mt-1">{extremeUserData.content.painPointAnalysis.step || 'N/A'}</p>
               </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6 mt-6">
               <div className="bg-white p-4 rounded-lg border border-black-200">
                 <h3 className="font-semibold text-black-800 mb-2 flex items-center gap-2">
                   <Target className="w-4 h-4" />
                   Description
                 </h3>
                 <p className="text-black-700 text-sm">{extremeUserData.content.painPointAnalysis.description || 'N/A'}</p>
               </div>
               <div className="bg-white p-4 rounded-lg border border-black-200">
                 <h3 className="font-semibold text-black-800 mb-2 flex items-center gap-2">
                   <Users className="w-4 h-4" />
                   User Context
                 </h3>
                 <p className="text-black-700 text-sm">{extremeUserData.content.painPointAnalysis.userContext || 'N/A'}</p>
               </div>
             </div>
           </Card>
         )}

                 {/* Power Users */}
         {extremeUserData.content.extremeUserProfiles?.powerUsersHighNeedExtreme && (
           <Card className="p-6 mb-8">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                 <Users className="w-5 h-5 text-gray-600" />
               </div>
               <h2 className="text-xl font-semibold text-gray-900">Power Users (High-Need Extreme)</h2>
             </div>
             
             <div className="space-y-6">
               {extremeUserData.content.extremeUserProfiles.powerUsersHighNeedExtreme.map((user) => (
              <div key={user.label} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="font-bold text-gray-800 text-lg mb-4 border-b border-gray-200 pb-2">
                  {user.label}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Demographics</h4>
                      <p className="text-sm text-gray-700">{user.demographics}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Amplified Needs</h4>
                      <p className="text-sm text-gray-700">{user.amplifiedNeeds}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Pain Point Experience</h4>
                      <p className="text-sm text-gray-700">{user.painPointExperience}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Current Workarounds</h4>
                      <p className="text-sm text-gray-700">{user.currentWorkarounds}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Unique Challenges</h4>
                    <p className="text-sm text-gray-700">{user.uniqueChallenges}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Research Value</h4>
                    <p className="text-sm text-gray-700">{user.researchValue}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Interview Focus</h4>
                  <p className="text-sm text-gray-700">{user.interviewFocus}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        )}

        {/* Marginalized Users */}
        {extremeUserData.content.extremeUserProfiles?.marginalizedUsersBarrierFacingExtreme && (
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Marginalized Users (Barrier-Facing Extreme)</h2>
            </div>
            
            <div className="space-y-6">
              {extremeUserData.content.extremeUserProfiles.marginalizedUsersBarrierFacingExtreme.map((user) => (
              <div key={user.label} className="border border-gray-200 rounded-lg p-6 bg-black-50">
                <h3 className="font-bold text-black-800 text-lg mb-4 border-b border-black-200 pb-2">
                  {user.label}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-black-700 mb-1">Demographics</h4>
                      <p className="text-sm text-gray-700">{user.demographics}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-black-700 mb-1">Barriers Faced</h4>
                      <p className="text-sm text-gray-700">{user.barriersFaced}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-black-700 mb-1">Pain Point Experience</h4>
                      <p className="text-sm text-gray-700">{user.painPointExperience}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-black-700 mb-1">Exclusion Factors</h4>
                      <p className="text-sm text-gray-700">{user.exclusionFactors}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-black-700 mb-1">Unique Challenges</h4>
                    <p className="text-sm text-gray-700">{user.uniqueChallenges}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black-700 mb-1">Research Value</h4>
                    <p className="text-sm text-gray-700">{user.researchValue}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-black-100 rounded-lg">
                  <h4 className="font-semibold text-black-800 mb-2">Interview Focus</h4>
                  <p className="text-sm text-black-700">{user.interviewFocus}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        )}

        {/* Research Strategy */}
        {extremeUserData.content.researchStrategy && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-gray-50 to-indigo-50 border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Research Strategy</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  User Recruitment
                </h3>
                <p className="text-gray-700 text-sm">{extremeUserData.content.researchStrategy.userRecruitment}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Interview Approach
                </h3>
                <p className="text-gray-700 text-sm">{extremeUserData.content.researchStrategy.interviewApproach}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Key Insights to Explore
                </h3>
                {Array.isArray(extremeUserData.content.researchStrategy.keyInsightsToExplore) ? (
                  <ul className="text-gray-700 text-sm space-y-1">
                    {extremeUserData.content.researchStrategy.keyInsightsToExplore.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 text-sm">{extremeUserData.content.researchStrategy.keyInsightsToExplore}</p>
                )}
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Expected Breakthrough Areas
                </h3>
                {Array.isArray(extremeUserData.content.researchStrategy.expectedBreakthroughAreas) ? (
                  <ul className="text-gray-700 text-sm space-y-1">
                    {extremeUserData.content.researchStrategy.expectedBreakthroughAreas.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        {area}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 text-sm">{extremeUserData.content.researchStrategy.expectedBreakthroughAreas}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Design Implications */}
        {extremeUserData.content.designImplications && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-black-50 to-cyan-50 border-black-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-black-900">Design Implications</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-2">Power User Insights</h3>
                <p className="text-black-700 text-sm">{extremeUserData.content.designImplications.powerUserInsights}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-2">Marginalized User Insights</h3>
                <p className="text-black-700 text-sm">{extremeUserData.content.designImplications.marginalizedUserInsights}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-2">Solution Opportunities</h3>
                <ul className="text-black-700 text-sm space-y-1">
                  {extremeUserData.content.designImplications.solutionOpportunities?.map((opportunity, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      {opportunity}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-2">Implementation Considerations</h3>
                <ul className="text-black-700 text-sm space-y-1">
                  {extremeUserData.content.designImplications.implementationConsiderations?.map((consideration, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      {consideration}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Fallback - Show raw data if structure doesn't match expected format */}
        {(!extremeUserData.content.painPointAnalysis && 
          !extremeUserData.content.extremeUserProfiles && 
          !extremeUserData.content.researchStrategy && 
          !extremeUserData.content.designImplications) && (
          <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">Raw Data Structure</h2>
            <p className="text-yellow-700 mb-4">
              The data structure doesn't match the expected format. Here's the raw data:
            </p>
            <div className="bg-white p-4 rounded border">
              {typeof extremeUserData.content === 'string' ? (
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{extremeUserData.content}</div>
              ) : (
                <pre className="text-xs text-gray-700 overflow-auto max-h-96">
                  {JSON.stringify(extremeUserData.content, null, 2)}
                </pre>
              )}
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mb-8">
          <p>Generated on {new Date(extremeUserData.generated_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
