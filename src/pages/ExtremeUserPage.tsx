import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Users, AlertTriangle, Lightbulb, Target, BarChart3, Globe, Heart, Brain, Eye, MessageCircle, ArrowRight, Sparkles, TrendingUp, Shield, Zap, Star, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    painPoint: true,
    powerUsers: true,
    marginalizedUsers: true,
    researchStrategy: true,
    designImplications: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Extreme User Analysis</h2>
            <p className="text-gray-600 mb-4">This may take a few moments</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!extremeUserData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Extreme User Analysis Not Ready</h2>
            <p className="text-gray-600 mb-6">
              The extreme user analysis is still being generated. This process typically takes a few minutes.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/projects/${projectId}`)}
                className="w-full border-2 border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 font-medium py-3 rounded-xl transition-all duration-200"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="relative mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate(`/projects/${projectId}`)}
              variant="ghost"
              size="sm"
              className="p-3 hover:bg-white/80 transition-all duration-200 rounded-xl"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Extreme User Analysis
                  </h1>
                  <p className="text-gray-600 text-lg">{projectTitle}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pain Points</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Power Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {extremeUserData?.content.extremeUserProfiles?.powerUsersHighNeedExtreme?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Marginalized Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {extremeUserData?.content.extremeUserProfiles?.marginalizedUsersBarrierFacingExtreme?.length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Insights</p>
                  <p className="text-2xl font-bold text-gray-900">4</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pain Point Analysis */}
        {extremeUserData.content.painPointAnalysis && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <div 
              className="p-8 cursor-pointer hover:bg-gray-50/50 transition-all duration-200"
              onClick={() => toggleSection('painPoint')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pain Point Analysis</h2>
                    <p className="text-gray-600 mt-1">{extremeUserData.content.painPointAnalysis.step || 'N/A'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-2">
                  {expandedSections.painPoint ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            {expandedSections.painPoint && (
              <div className="px-8 pb-8">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-orange-600" />
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{extremeUserData.content.painPointAnalysis.description || 'N/A'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                      User Context
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{extremeUserData.content.painPointAnalysis.userContext || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Power Users */}
        {extremeUserData.content.extremeUserProfiles?.powerUsersHighNeedExtreme && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <div 
              className="p-8 cursor-pointer hover:bg-gray-50/50 transition-all duration-200"
              onClick={() => toggleSection('powerUsers')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Power Users (High-Need Extreme)</h2>
                    <p className="text-gray-600 mt-1">{extremeUserData.content.extremeUserProfiles.powerUsersHighNeedExtreme.length} user profiles identified</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-2">
                  {expandedSections.powerUsers ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            {expandedSections.powerUsers && (
              <div className="px-8 pb-8">
                <div className="grid gap-6">
                  {extremeUserData.content.extremeUserProfiles.powerUsersHighNeedExtreme.map((user, index) => (
                    <div key={user.label} className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                          <h3 className="font-bold text-gray-800 text-xl">{user.label}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Power User</span>
                          <Star className="w-4 h-4 text-yellow-500" />
                        </div>
                      </div>
                      
                      <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <div className="bg-white/60 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              Demographics
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{user.demographics}</p>
                          </div>
                          <div className="bg-white/60 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-blue-600" />
                              Amplified Needs
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{user.amplifiedNeeds}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-white/60 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                              Pain Point Experience
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{user.painPointExperience}</p>
                          </div>
                          <div className="bg-white/60 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-green-600" />
                              Current Workarounds
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{user.currentWorkarounds}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white/60 p-4 rounded-xl">
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-purple-600" />
                            Unique Challenges
                          </h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{user.uniqueChallenges}</p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-xl">
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            Research Value
                          </h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{user.researchValue}</p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-100 to-cyan-100 p-4 rounded-xl border border-blue-200">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                          Interview Focus
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{user.interviewFocus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Marginalized Users */}
        {extremeUserData.content.extremeUserProfiles?.marginalizedUsersBarrierFacingExtreme && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <div 
              className="p-8 cursor-pointer hover:bg-gray-50/50 transition-all duration-200"
              onClick={() => toggleSection('marginalizedUsers')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Marginalized Users (Barrier-Facing Extreme)</h2>
                    <p className="text-gray-600 mt-1">{extremeUserData.content.extremeUserProfiles.marginalizedUsersBarrierFacingExtreme.length} user profiles identified</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-2">
                  {expandedSections.marginalizedUsers ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            {expandedSections.marginalizedUsers && (
              <div className="px-8 pb-8">
                <div className="grid gap-6">
                  {extremeUserData.content.extremeUserProfiles.marginalizedUsersBarrierFacingExtreme.map((user, index) => (
                    <div key={user.label} className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                          <h3 className="font-bold text-gray-800 text-xl">{user.label}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">Marginalized</span>
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                      </div>
                      
                      <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <div className="bg-white/60 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <Users className="w-4 h-4 text-red-600" />
                              Demographics
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{user.demographics}</p>
                          </div>
                          <div className="bg-white/60 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-red-600" />
                              Barriers Faced
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{user.barriersFaced}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-white/60 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                              Pain Point Experience
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{user.painPointExperience}</p>
                          </div>
                          <div className="bg-white/60 p-4 rounded-xl">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-purple-600" />
                              Exclusion Factors
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed">{user.exclusionFactors}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white/60 p-4 rounded-xl">
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-600" />
                            Unique Challenges
                          </h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{user.uniqueChallenges}</p>
                        </div>
                        <div className="bg-white/60 p-4 rounded-xl">
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            Research Value
                          </h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{user.researchValue}</p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-red-100 to-pink-100 p-4 rounded-xl border border-red-200">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-red-600" />
                          Interview Focus
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed">{user.interviewFocus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Research Strategy */}
        {extremeUserData.content.researchStrategy && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <div 
              className="p-8 cursor-pointer hover:bg-gray-50/50 transition-all duration-200"
              onClick={() => toggleSection('researchStrategy')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Research Strategy</h2>
                    <p className="text-gray-600 mt-1">Comprehensive research approach and methodology</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-2">
                  {expandedSections.researchStrategy ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            {expandedSections.researchStrategy && (
              <div className="px-8 pb-8">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-indigo-600" />
                      User Recruitment
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{extremeUserData.content.researchStrategy.userRecruitment}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      Interview Approach
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{extremeUserData.content.researchStrategy.interviewApproach}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      <Eye className="w-5 h-5 text-green-600" />
                      Key Insights to Explore
                    </h3>
                    {Array.isArray(extremeUserData.content.researchStrategy.keyInsightsToExplore) ? (
                      <ul className="text-gray-700 space-y-2">
                        {extremeUserData.content.researchStrategy.keyInsightsToExplore.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="leading-relaxed">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-700 leading-relaxed">{extremeUserData.content.researchStrategy.keyInsightsToExplore}</p>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      Expected Breakthrough Areas
                    </h3>
                    {Array.isArray(extremeUserData.content.researchStrategy.expectedBreakthroughAreas) ? (
                      <ul className="text-gray-700 space-y-2">
                        {extremeUserData.content.researchStrategy.expectedBreakthroughAreas.map((area, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="leading-relaxed">{area}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-700 leading-relaxed">{extremeUserData.content.researchStrategy.expectedBreakthroughAreas}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Design Implications */}
        {extremeUserData.content.designImplications && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
            <div 
              className="p-8 cursor-pointer hover:bg-gray-50/50 transition-all duration-200"
              onClick={() => toggleSection('designImplications')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Design Implications</h2>
                    <p className="text-gray-600 mt-1">Key insights and actionable recommendations</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-2">
                  {expandedSections.designImplications ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            
            {expandedSections.designImplications && (
              <div className="px-8 pb-8">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Power User Insights
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{extremeUserData.content.designImplications.powerUserInsights}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl border border-red-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      <Shield className="w-5 h-5 text-red-600" />
                      Marginalized User Insights
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{extremeUserData.content.designImplications.marginalizedUserInsights}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      <Lightbulb className="w-5 h-5 text-green-600" />
                      Solution Opportunities
                    </h3>
                    <ul className="text-gray-700 space-y-2">
                      {extremeUserData.content.designImplications.solutionOpportunities?.map((opportunity, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="leading-relaxed">{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-2xl border border-purple-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-purple-600" />
                      Implementation Considerations
                    </h3>
                    <ul className="text-gray-700 space-y-2">
                      {extremeUserData.content.designImplications.implementationConsiderations?.map((consideration, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="leading-relaxed">{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Fallback - Show raw data if structure doesn't match expected format */}
        {(!extremeUserData.content.painPointAnalysis && 
          !extremeUserData.content.extremeUserProfiles && 
          !extremeUserData.content.researchStrategy && 
          !extremeUserData.content.designImplications) && (
          <Card className="mb-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-xl rounded-3xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Raw Data Structure</h2>
                  <p className="text-gray-600 mt-1">The data structure doesn't match the expected format</p>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-yellow-200">
                {typeof extremeUserData.content === 'string' ? (
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-mono text-sm">{extremeUserData.content}</div>
                ) : (
                  <pre className="text-sm text-gray-700 overflow-auto max-h-96 font-mono bg-gray-50 p-4 rounded-lg">
                    {JSON.stringify(extremeUserData.content, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Modern Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span className="text-gray-600 font-medium">Analysis Generated</span>
            </div>
            <p className="text-gray-500 text-sm">
              {new Date(extremeUserData.generated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
