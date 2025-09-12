import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Brain, Target, Lightbulb, BarChart3, Users, AlertTriangle, Eye, MessageCircle, Search, UserCheck, MapPin, Clock, CheckCircle, Zap, TrendingUp, Shield, Heart, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

interface PsychologicalAnalysisData {
  content: {
    clusters?: Array<{
      irrationalBehavior: string;
      rationalCounterpart: string;
      rawEvidenceFromStudentData: string[];
      peculiarityRevealed: string;
      psychologicalAnalysis: {
        cognitiveBiases: string;
        emotionalDrivers: string;
        psychologicalNeeds: string;
        whyItPersists: string;
      };
      behavioralScienceExplanation: string;
      innovationInsight: string;
    }>;
    comprehensiveMetaAnalysis?: {
      totalClustersIdentified: number;
      behavioralPatternThemes: string[];
      humanPsychologyInsights: string;
      cognitiveBiasPatterns: string[];
      emotionalDriverAnalysis: string;
      systemLevelImplications: string;
      innovationOpportunitySpaces: string[];
    };
    criticalRequirements?: string[];
  };
  generated_at: string;
  prompt: string;
}

export default function PsychologicalAnalysisPage() {
  const params = useParams();
  const projectId = params.id;
  const navigate = useNavigate();
  const [psychologicalData, setPsychologicalData] = useState<PsychologicalAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState<string>('');

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const fetchPsychologicalData = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        
        // Get the project data including psychological_analysis
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('title, psychological_analysis')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProjectTitle(projectData.title);

        // Check if psychological_analysis exists and has content
        console.log('Project data received:', projectData);
        console.log('psychological_analysis value:', projectData.psychological_analysis);
        
        let psychologicalAnalysisData = projectData.psychological_analysis;
        
        // Handle case where psychological_analysis might be stoblack as a JSON string
        if (typeof psychologicalAnalysisData === 'string') {
          try {
            psychologicalAnalysisData = JSON.parse(psychologicalAnalysisData);
            console.log('Parsed psychological_analysis from string:', psychologicalAnalysisData);
          } catch (error) {
            console.error('Failed to parse psychological_analysis string:', error);
          }
        }
        
        if (psychologicalAnalysisData && 
            typeof psychologicalAnalysisData === 'object' && 
            psychologicalAnalysisData.content && 
            Object.keys(psychologicalAnalysisData.content).length > 0) {
          console.log('Setting psychological analysis data:', psychologicalAnalysisData);
          setPsychologicalData(psychologicalAnalysisData as PsychologicalAnalysisData);
        } else {
          console.log('No valid psychological analysis data found');
          // No psychological analysis data found yet
          toast('Psychological Analysis is still being generated. Please wait a moment and refresh.', {
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
        console.error('Error fetching psychological analysis data:', error);
        toast.error('Failed to load psychological analysis data');
      } finally {
        setLoading(false);
      }
    };

    fetchPsychologicalData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black-600" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Psychological Analysis...</h2>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!psychologicalData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-black-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-black-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Psychological Analysis Not Ready</h2>
          <p className="text-gray-500 mb-6">
            The psychological analysis is still being generated. This process typically takes a few minutes.
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
            <h1 className="text-3xl font-bold text-gray-900">Psychological Analysis</h1>
            <p className="text-gray-600 mt-1">{projectTitle}</p>
          </div>
        </div>

        {/* Comprehensive Meta Analysis */}
        {psychologicalData.content.comprehensiveMetaAnalysis && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-black-50 to-black-50 border-black-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-black-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-black-900">Comprehensive Meta Analysis</h2>
                <p className="text-black-700 mt-1">
                  {psychologicalData.content.comprehensiveMetaAnalysis.totalClustersIdentified} behavioral clusters identified
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Behavioral Pattern Themes
                </h3>
                <ul className="space-y-2 text-sm">
                  {psychologicalData.content.comprehensiveMetaAnalysis.behavioralPatternThemes?.map((theme, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-black-700">{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Human Psychology Insights
                </h3>
                <p className="text-black-700 text-sm">{psychologicalData.content.comprehensiveMetaAnalysis.humanPsychologyInsights}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Cognitive Bias Patterns
                </h3>
                <ul className="space-y-2 text-sm">
                  {psychologicalData.content.comprehensiveMetaAnalysis.cognitiveBiasPatterns?.map((bias, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-black-700">{bias}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Emotional Driver Analysis
                </h3>
                <p className="text-black-700 text-sm">{psychologicalData.content.comprehensiveMetaAnalysis.emotionalDriverAnalysis}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  System Level Implications
                </h3>
                <p className="text-black-700 text-sm">{psychologicalData.content.comprehensiveMetaAnalysis.systemLevelImplications}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-black-200">
                <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Innovation Opportunity Spaces
                </h3>
                <ul className="space-y-2 text-sm">
                  {psychologicalData.content.comprehensiveMetaAnalysis.innovationOpportunitySpaces?.map((opportunity, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-black-700">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Behavioral Clusters */}
        {psychologicalData.content.clusters && (
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Behavioral Clusters Analysis</h2>
            </div>
            
            {psychologicalData.content.clusters.map((cluster, clusterIndex) => (
              <Card key={clusterIndex} className="p-6">
                <div className="space-y-6">
                  {/* Irrational vs Rational Behavior */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                      <h3 className="font-semibold text-black-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Irrational Behavior
                      </h3>
                      <p className="text-black-700 text-sm">{cluster.irrationalBehavior}</p>
                    </div>
                    <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                      <h3 className="font-semibold text-black-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Rational Counterpart
                      </h3>
                      <p className="text-black-700 text-sm">{cluster.rationalCounterpart}</p>
                    </div>
                  </div>

                  {/* Raw Evidence */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Raw Evidence from Student Data
                    </h3>
                    <ul className="space-y-2 text-sm">
                      {cluster.rawEvidenceFromStudentData?.map((evidence, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-gray-700">{evidence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Peculiarity Revealed */}
                  <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                    <h3 className="font-semibold text-black-800 mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Peculiarity Revealed
                    </h3>
                    <p className="text-black-700 text-sm">{cluster.peculiarityRevealed}</p>
                  </div>

                  {/* Psychological Analysis */}
                  <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                    <h3 className="font-semibold text-black-800 mb-3 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Psychological Analysis
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-black-700 mb-1">Cognitive Biases</h4>
                        <p className="text-black-600 text-sm">{cluster.psychologicalAnalysis.cognitiveBiases}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-black-700 mb-1">Emotional Drivers</h4>
                        <p className="text-black-600 text-sm">{cluster.psychologicalAnalysis.emotionalDrivers}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-black-700 mb-1">Psychological Needs</h4>
                        <p className="text-black-600 text-sm">{cluster.psychologicalAnalysis.psychologicalNeeds}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-black-700 mb-1">Why It Persists</h4>
                        <p className="text-black-600 text-sm">{cluster.psychologicalAnalysis.whyItPersists}</p>
                      </div>
                    </div>
                  </div>

                  {/* Behavioral Science Explanation */}
                  <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                    <h3 className="font-semibold text-black-800 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Behavioral Science Explanation
                    </h3>
                    <p className="text-black-700 text-sm">{cluster.behavioralScienceExplanation}</p>
                  </div>

                  {/* Innovation Insight */}
                  <div className="bg-black-50 p-4 rounded-lg border border-black-200">
                    <h3 className="font-semibold text-black-800 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Innovation Insight
                    </h3>
                    <p className="text-black-700 text-sm">{cluster.innovationInsight}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Critical Requirements */}
        {psychologicalData.content.criticalRequirements && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-black-50 to-black-50 border-black-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-black-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-black-600" />
              </div>
              <h2 className="text-xl font-semibold text-black-900">Critical Requirements</h2>
            </div>
            
            <ul className="space-y-3">
              {psychologicalData.content.criticalRequirements?.map((requirement, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-black-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-black-600 font-semibold text-sm">{idx + 1}</span>
                  </span>
                  <span className="text-black-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Fallback - Show raw data if structure doesn't match expected format */}
        {(!psychologicalData.content.clusters && 
          !psychologicalData.content.comprehensiveMetaAnalysis && 
          !psychologicalData.content.criticalRequirements) && (
          <Card className="p-6 mb-8 bg-black-50 border-black-200">
            <h2 className="text-xl font-semibold text-black-800 mb-4">Raw Data Structure</h2>
            <p className="text-black-700 mb-4">
              The data structure doesn't match the expected format. Here's the raw data:
            </p>
            <div className="bg-white p-4 rounded border">
              {typeof psychologicalData.content === 'string' ? (
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{psychologicalData.content}</div>
              ) : (
                <pre className="text-xs text-gray-700 overflow-auto max-h-96">
                  {JSON.stringify(psychologicalData.content, null, 2)}
                </pre>
              )}
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mb-8">
          <p>Generated on {new Date(psychologicalData.generated_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}