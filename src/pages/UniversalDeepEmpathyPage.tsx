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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black-600" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Deep Empathy Research...</h2>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!deepEmpathyData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-black-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-black-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Deep Empathy Research Not Ready</h2>
          <p className="text-gray-500 mb-6">
            The deep empathy research analysis is still being generated. This process typically takes a few minutes.
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
            <h1 className="text-3xl font-bold text-gray-900">Universal Deep Empathy Research</h1>
            <p className="text-gray-600 mt-1">{projectTitle}</p>
          </div>
        </div>

        {/* Research Context Analysis */}
        {deepEmpathyData.content.researchContextAnalysis && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-black-50 to-black-50 border-black-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <Search className="w-5 h-5 text-black-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-black-900">Research Context Analysis</h2>
                <p className="text-black-700 mt-1">Understanding the research foundation</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Pain Point
                </h3>
                <p className="text-black-700 text-sm">{deepEmpathyData.content.researchContextAnalysis.painPoint || 'N/A'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Description
                </h3>
                <p className="text-black-700 text-sm">{deepEmpathyData.content.researchContextAnalysis.description || 'N/A'}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Extreme User
                </h3>
                <p className="text-black-700 text-sm">{deepEmpathyData.content.researchContextAnalysis.extremeUser || 'N/A'}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Empathy Technique 1: Observation */}
        {deepEmpathyData.content.empathyTechnique1Observation && (
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Empathy Technique 1: Observation</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Focus Areas
                </h3>
                <ul className="space-y-2 text-sm">
                  {deepEmpathyData.content.empathyTechnique1Observation.observationFocusAreas?.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-black-700">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  What to Document
                </h3>
                <ul className="space-y-2 text-sm">
                  {deepEmpathyData.content.empathyTechnique1Observation.whatToDocument?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-black-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Key Questions
                </h3>
                <ul className="space-y-2 text-sm">
                  {deepEmpathyData.content.empathyTechnique1Observation.keyQuestionsForObservation?.map((question, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-black-700">{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Empathy Technique 2: Immersion */}
        {deepEmpathyData.content.empathyTechnique2Immersion && (
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Empathy Technique 2: Immersion</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Immersion Activities</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique2Immersion.immersionActivities?.map((activity, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">What to Experience</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique2Immersion.whatToExperience?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Documentation</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique2Immersion.immersionDocumentation?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Key Insights to Capture</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique2Immersion.keyInsightsToCapture?.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{insight}</span>
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
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Empathy Technique 3: Role Playing</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Scenarios</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique3RolePlaying.rolePlayingScenarios?.map((scenario, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{scenario}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Variables</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique3RolePlaying.rolePlayingVariables?.map((variable, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{variable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Documentation Focus</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique3RolePlaying.documentationFocus?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Key Questions</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique3RolePlaying.keyQuestionsForRolePlaying?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{question}</span>
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
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Empathy Technique 4: Shadowing</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Focus Areas</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique4Shadowing.shadowingFocusAreas?.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">What to Shadow</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique4Shadowing.whatToShadow?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Documentation</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique4Shadowing.shadowingDocumentation?.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Key Insights</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique4Shadowing.keyInsightsFromShadowing?.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{insight}</span>
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
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Empathy Technique 5: Deep Interviews</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Opening Questions</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.openingQuestions?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Belief-Uncovering Questions</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.beliefUncoveringQuestions?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Behavior-Exploring Questions</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.behaviorExploringQuestions?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Context-Deepening Questions</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.contextDeepeningQuestions?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Innovation Opportunity Questions</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.innovationOpportunityQuestions?.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Follow-up Probes</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.empathyTechnique5Conversation.deepInterviewQuestions?.followUpProbes?.map((probe, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{probe}</span>
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
          <Card className="p-6 mb-8 bg-gradient-to-r from-black-50 to-black-50 border-black-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-black-900">Research Execution Guidance</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pre-Research Preparation
                </h3>
                <ul className="space-y-2 text-sm">
                  {deepEmpathyData.content.researchExecutionGuidance.preResearchPreparation?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-black-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  During Research Best Practices
                </h3>
                <ul className="space-y-2 text-sm">
                  {deepEmpathyData.content.researchExecutionGuidance.duringResearchBestPractices?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-black-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Post-Research Analysis
                </h3>
                <ul className="space-y-2 text-sm">
                  {deepEmpathyData.content.researchExecutionGuidance.postResearchAnalysis?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-black-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Insight Synthesis Framework */}
        {deepEmpathyData.content.insightSynthesisFramework && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-black-50 to-black-50 border-black-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-black-900">Insight Synthesis Framework</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Belief Insights</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.insightSynthesisFramework.beliefInsights?.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Behavioral Insights</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.insightSynthesisFramework.behavioralInsights?.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Innovation Opportunities</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.insightSynthesisFramework.innovationOpportunities?.map((opportunity, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-black-200">
                  <h3 className="font-semibold text-black-800 mb-3">Design Implications</h3>
                  <ul className="space-y-2 text-sm">
                    {deepEmpathyData.content.insightSynthesisFramework.designImplications?.map((implication, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-black-700">{implication}</span>
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
          <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">Raw Data Structure</h2>
            <p className="text-yellow-700 mb-4">
              The data structure doesn't match the expected format. Here's the raw data:
            </p>
            <div className="bg-white p-4 rounded border">
              {typeof deepEmpathyData.content === 'string' ? (
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{deepEmpathyData.content}</div>
              ) : (
                <pre className="text-xs text-gray-700 overflow-auto max-h-96">
                  {JSON.stringify(deepEmpathyData.content, null, 2)}
                </pre>
              )}
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mb-8">
          <p>Generated on {new Date(deepEmpathyData.generated_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
