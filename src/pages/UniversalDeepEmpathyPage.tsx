import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Users, AlertTriangle, Lightbulb, Target, BarChart3, Globe, Heart, Brain, Eye, MessageCircle, Search, UserCheck, MapPin, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

interface DeepEmpathyData {
  content: {
    researchContextAnalysis?: {
      painPoint: string;
      description: string;
      extremeUser: string;
    };
    empathyTechnique1Observation?: {
      observationFocusAreas: string[];
      whatToDocument: string[];
      keyQuestionsForObservation: string[];
    };
    empathyTechnique2Immersion?: {
      immersionActivities: string[];
      whatToExperience: string[];
      immersionDocumentation: string[];
      keyInsightsToCapture: string[];
    };
    empathyTechnique3RolePlaying?: {
      rolePlayingScenarios: string[];
      rolePlayingVariables: string[];
      documentationFocus: string[];
      keyQuestionsForRolePlaying: string[];
    };
    empathyTechnique4Shadowing?: {
      shadowingFocusAreas: string[];
      whatToShadow: string[];
      shadowingDocumentation: string[];
      keyInsightsFromShadowing: string[];
    };
    empathyTechnique5Conversation?: {
      deepInterviewQuestions: {
        openingQuestions: string[];
        beliefUncoveringQuestions: string[];
        behaviorExploringQuestions: string[];
        contextDeepeningQuestions: string[];
        innovationOpportunityQuestions: string[];
        followUpProbes: string[];
      };
    };
    researchExecutionGuidance?: {
      preResearchPreparation: string[];
      duringResearchBestPractices: string[];
      postResearchAnalysis: string[];
    };
    insightSynthesisFramework?: {
      beliefInsights: string[];
      behavioralInsights: string[];
      innovationOpportunities: string[];
      designImplications: string[];
    };
  };
  generated_at: string;
  prompt: string;
}

export default function UniversalDeepEmpathyPage() {
  const params = useParams();
  const projectId = params.id;
  const navigate = useNavigate();
  const [deepEmpathyData, setDeepEmpathyData] = useState<DeepEmpathyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState<string>('');

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const fetchDeepEmpathyData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        
        // Get the project data including deep_empathy_data
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('title, deep_empathy_data')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProjectTitle(projectData.title);

        // Check if deep_empathy_data exists and has content (following As-Is Map pattern)
        console.log('Project data received:', projectData);
        console.log('deep_empathy_data value:', projectData.deep_empathy_data);
        
        let deepEmpathyData = projectData.deep_empathy_data;
        
        // Handle case where deep_empathy_data might be stored as a JSON string
        if (typeof deepEmpathyData === 'string') {
          try {
            deepEmpathyData = JSON.parse(deepEmpathyData);
            console.log('Parsed deep_empathy_data from string:', deepEmpathyData);
          } catch (error) {
            console.error('Failed to parse deep_empathy_data string:', error);
          }
        }
        
        if (deepEmpathyData && 
            typeof deepEmpathyData === 'object' && 
            deepEmpathyData.content && 
            Object.keys(deepEmpathyData.content).length > 0) {
          console.log('Setting deep empathy data:', deepEmpathyData);
          setDeepEmpathyData(deepEmpathyData as DeepEmpathyData);
        } else {
          console.log('No valid deep empathy data found');
          // No deep empathy data found yet
          toast('Deep Empathy Research is still being generated. Please wait a moment and refresh.', {
            icon: '⏳',
            duration: 4000,
            style: {
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #f59e0b'
            }
          });
        }
      } catch (error) {
        console.error('Error fetching deep empathy data:', error);
        toast.error('Failed to load deep empathy research data');
      } finally {
        setLoading(false);
      }
    };

    fetchDeepEmpathyData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Deep Empathy Research...</h2>
          <p className="text-slate-600">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!deepEmpathyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Deep Empathy Research Not Ready</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            The deep empathy research analysis is still being generated. This process typically takes a few minutes.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Refresh Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/projects/${projectId}`)}
              className="w-full border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-3 rounded-xl transition-all duration-200"
            >
              Back to Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="w-[70vw] mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Button
            onClick={() => navigate(`/projects/${projectId}`)}
            variant="ghost"
            size="sm"
            className="p-3 hover:bg-purple-100 rounded-full transition-all duration-200"
          >
            <FiArrowLeft className="w-5 h-5 text-purple-600" />
          </Button>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-3">
              <Heart className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Deep Empathy Research</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 bg-clip-text text-transparent">
              Universal Deep Empathy Research
            </h1>
            <p className="text-slate-600 mt-2 text-lg font-medium">{projectTitle}</p>
          </div>
        </div>

        {/* Research Context Analysis */}
        {deepEmpathyData.content.researchContextAnalysis && (
          <Card className="p-8 mb-10 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Search className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Research Context Analysis</h2>
                <p className="text-slate-600 text-lg">Understanding the research foundation</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  Pain Point
                </h3>
                <p className="text-slate-700 leading-relaxed">{deepEmpathyData.content.researchContextAnalysis.painPoint || 'N/A'}</p>
              </div>
              <div className="group bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  Description
                </h3>
                <p className="text-slate-700 leading-relaxed">{deepEmpathyData.content.researchContextAnalysis.description || 'N/A'}</p>
              </div>
              <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Extreme User
                </h3>
                <p className="text-slate-700 leading-relaxed">{deepEmpathyData.content.researchContextAnalysis.extremeUser || 'N/A'}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Empathy Technique 1: Observation */}
        {deepEmpathyData.content.empathyTechnique1Observation && (
          <Card className="p-8 mb-10 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Empathy Technique 1: Observation</h2>
                <p className="text-slate-600">Watch and learn from user behavior</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  Focus Areas
                </h3>
                <ul className="space-y-3">
                  {deepEmpathyData.content.empathyTechnique1Observation.observationFocusAreas?.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700 leading-relaxed">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="group bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  What to Document
                </h3>
                <ul className="space-y-3">
                  {deepEmpathyData.content.empathyTechnique1Observation.whatToDocument?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="group bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  Key Questions
                </h3>
                <ul className="space-y-3">
                  {deepEmpathyData.content.empathyTechnique1Observation.keyQuestionsForObservation?.map((question, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700 leading-relaxed">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Empathy Technique 2: Immersion */}
        {deepEmpathyData.content.empathyTechnique2Immersion && (
          <Card className="p-8 mb-10 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Empathy Technique 2: Immersion</h2>
                <p className="text-slate-600">Step into the user's world</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="group bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Immersion Activities</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique2Immersion.immersionActivities?.map((activity, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">What to Experience</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique2Immersion.whatToExperience?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <div className="group bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Documentation</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique2Immersion.immersionDocumentation?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-gradient-to-br from-rose-50 to-purple-50 p-6 rounded-xl border border-rose-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Key Insights to Capture</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique2Immersion.keyInsightsToCapture?.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Empathy Technique 3: Role Playing */}
        {deepEmpathyData.content.empathyTechnique3RolePlaying && (
          <Card className="p-8 mb-10 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Empathy Technique 3: Role Playing</h2>
                <p className="text-slate-600">Act out different user perspectives</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="group bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-xl border border-violet-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Scenarios</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique3RolePlaying.rolePlayingScenarios?.map((scenario, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{scenario}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Variables</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique3RolePlaying.rolePlayingVariables?.map((variable, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{variable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <div className="group bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Documentation Focus</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique3RolePlaying.documentationFocus?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Key Questions</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique3RolePlaying.keyQuestionsForRolePlaying?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Empathy Technique 4: Shadowing */}
        {deepEmpathyData.content.empathyTechnique4Shadowing && (
          <Card className="p-8 mb-10 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Empathy Technique 4: Shadowing</h2>
                <p className="text-slate-600">Follow users in their natural environment</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="group bg-gradient-to-br from-sky-50 to-blue-50 p-6 rounded-xl border border-sky-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Focus Areas</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique4Shadowing.shadowingFocusAreas?.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">What to Shadow</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique4Shadowing.whatToShadow?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <div className="group bg-gradient-to-br from-indigo-50 to-violet-50 p-6 rounded-xl border border-indigo-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Documentation</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique4Shadowing.shadowingDocumentation?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-xl border border-violet-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Key Insights</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique4Shadowing.keyInsightsFromShadowing?.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Empathy Technique 5: Conversation */}
        {deepEmpathyData.content.empathyTechnique5Conversation && (
          <Card className="p-8 mb-10 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Empathy Technique 5: Deep Interviews</h2>
                <p className="text-slate-600">Engage in meaningful conversations</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="group bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Opening Questions</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.openingQuestions?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Belief-Uncovering Questions</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.beliefUncoveringQuestions?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Behavior-Exploring Questions</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.behaviorExploringQuestions?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <div className="group bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Context-Deepening Questions</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.contextDeepeningQuestions?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Innovation Opportunity Questions</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.innovationOpportunityQuestions?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-gradient-to-br from-rose-50 to-purple-50 p-6 rounded-xl border border-rose-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Follow-up Probes</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.followUpProbes?.map((probe, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{probe}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Research Execution Guidance */}
        {deepEmpathyData.content.researchExecutionGuidance && (
          <Card className="p-8 mb-10 bg-gradient-to-br from-slate-100 to-slate-200 border-0 shadow-xl rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Research Execution Guidance</h2>
                <p className="text-slate-600">Best practices for conducting research</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  Pre-Research Preparation
                </h3>
                <ul className="space-y-3">
                  {deepEmpathyData.content.researchExecutionGuidance.preResearchPreparation?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="group bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  During Research Best Practices
                </h3>
                <ul className="space-y-3">
                  {deepEmpathyData.content.researchExecutionGuidance.duringResearchBestPractices?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="group bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  Post-Research Analysis
                </h3>
                <ul className="space-y-3">
                  {deepEmpathyData.content.researchExecutionGuidance.postResearchAnalysis?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Insight Synthesis Framework */}
        {deepEmpathyData.content.insightSynthesisFramework && (
          <Card className="p-8 mb-10 bg-gradient-to-br from-emerald-100 to-teal-200 border-0 shadow-xl rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Lightbulb className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Insight Synthesis Framework</h2>
                <p className="text-slate-600">Transform research into actionable insights</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="group bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-emerald-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Belief Insights</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.insightSynthesisFramework.beliefInsights?.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-teal-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Behavioral Insights</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.insightSynthesisFramework.behavioralInsights?.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <div className="group bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-cyan-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Innovation Opportunities</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.insightSynthesisFramework.innovationOpportunities?.map((opportunity, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="group bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Design Implications</h3>
                  <ul className="space-y-3">
                    {deepEmpathyData.content.insightSynthesisFramework.designImplications?.map((implication, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700 leading-relaxed">{implication}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Fallback - Show raw data if structure doesn't match expected format */}
        {(!deepEmpathyData.content.researchContextAnalysis && 
          !deepEmpathyData.content.empathyTechnique1Observation && 
          !deepEmpathyData.content.empathyTechnique2Immersion &&
          !deepEmpathyData.content.empathyTechnique3RolePlaying &&
          !deepEmpathyData.content.empathyTechnique4Shadowing &&
          !deepEmpathyData.content.empathyTechnique5Conversation &&
          !deepEmpathyData.content.researchExecutionGuidance &&
          !deepEmpathyData.content.insightSynthesisFramework) && (
          <Card className="p-8 mb-10 bg-gradient-to-br from-amber-50 to-yellow-100 border-0 shadow-xl rounded-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-amber-800 mb-1">Raw Data Structure</h2>
                <p className="text-amber-700">The data structure doesn't match the expected format</p>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-amber-200">
              {typeof deepEmpathyData.content === 'string' ? (
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-mono text-sm">{deepEmpathyData.content}</div>
              ) : (
                <pre className="text-xs text-slate-700 overflow-auto max-h-96 font-mono bg-slate-50 p-4 rounded-lg">
                  {JSON.stringify(deepEmpathyData.content, null, 2)}
                </pre>
              )}
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full">
            <Clock className="w-4 h-4 text-slate-600" />
            <span className="text-slate-600 font-medium">Generated on {new Date(deepEmpathyData.generated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
