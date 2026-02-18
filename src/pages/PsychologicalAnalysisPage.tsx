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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-12 rounded-3xl shadow-2xl border border-white/20">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Psychological Analysis...</h2>
          <p className="text-slate-600 text-lg">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!psychologicalData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-lg bg-white/80 backdrop-blur-sm p-12 rounded-3xl shadow-2xl border border-white/20">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Psychological Analysis Not Ready</h2>
          <p className="text-slate-600 mb-8 text-lg leading-relaxed">
            The psychological analysis is still being generated. This process typically takes a few minutes.
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-[75vw] mx-auto py-12 px-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Button
            onClick={() => navigate(`/projects/${projectId}`)}
            variant="ghost"
            size="sm"
            className="p-3 rounded-xl hover:bg-white/60 transition-all duration-200 shadow-sm"
          >
            <FiArrowLeft className="w-5 h-5 text-indigo-600" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Psychological Analysis
            </h1>
            <p className="text-slate-600 mt-2 text-lg font-medium">{projectTitle}</p>
          </div>
        </div>

        {/* Comprehensive Meta Analysis */}
        {psychologicalData.content.comprehensiveMetaAnalysis && (
          <Card className="p-8 mb-10 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Comprehensive Meta Analysis</h2>
                <p className="text-slate-600 mt-2 text-lg">
                  {psychologicalData.content.comprehensiveMetaAnalysis.totalClustersIdentified} behavioral clusters identified
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 hover:shadow-lg transition-all duration-300">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  Behavioral Pattern Themes
                </h3>
                <ul className="space-y-3">
                  {psychologicalData.content.comprehensiveMetaAnalysis.behavioralPatternThemes?.map((theme, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-slate-700 font-medium">{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition-all duration-300">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  Human Psychology Insights
                </h3>
                <p className="text-slate-700 leading-relaxed">{psychologicalData.content.comprehensiveMetaAnalysis.humanPsychologyInsights}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100 hover:shadow-lg transition-all duration-300">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  Cognitive Bias Patterns
                </h3>
                <ul className="space-y-3">
                  {psychologicalData.content.comprehensiveMetaAnalysis.cognitiveBiasPatterns?.map((bias, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-slate-700 font-medium">{bias}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-100 hover:shadow-lg transition-all duration-300">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  Emotional Driver Analysis
                </h3>
                <p className="text-slate-700 leading-relaxed">{psychologicalData.content.comprehensiveMetaAnalysis.emotionalDriverAnalysis}</p>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  System Level Implications
                </h3>
                <p className="text-slate-700 leading-relaxed">{psychologicalData.content.comprehensiveMetaAnalysis.systemLevelImplications}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 hover:shadow-lg transition-all duration-300">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  Innovation Opportunity Spaces
                </h3>
                <ul className="space-y-3">
                  {psychologicalData.content.comprehensiveMetaAnalysis.innovationOpportunitySpaces?.map((opportunity, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-slate-700 font-medium">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Behavioral Clusters */}
        {psychologicalData.content.clusters && (
          <div className="space-y-8 mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Behavioral Clusters Analysis</h2>
            </div>

            {psychologicalData.content.clusters.map((cluster, clusterIndex) => (
              <Card key={clusterIndex} className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
                <div className="space-y-8">
                  {/* Irrational vs Rational Behavior */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl border border-red-100 hover:shadow-lg transition-all duration-300">
                      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                        Irrational Behavior
                      </h3>
                      <p className="text-slate-700 leading-relaxed">{cluster.irrationalBehavior}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 hover:shadow-lg transition-all duration-300">
                      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        Rational Counterpart
                      </h3>
                      <p className="text-slate-700 leading-relaxed">{cluster.rationalCounterpart}</p>
                    </div>
                  </div>

                  {/* Raw Evidence */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all duration-300">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center">
                        <Search className="w-4 h-4 text-white" />
                      </div>
                      Raw Evidence from Student Data
                    </h3>
                    <ul className="space-y-3">
                      {cluster.rawEvidenceFromStudentData?.map((evidence, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-gradient-to-r from-slate-500 to-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-slate-700 font-medium">{evidence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Peculiarity Revealed */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-2xl border border-amber-100 hover:shadow-lg transition-all duration-300">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                      Peculiarity Revealed
                    </h3>
                    <p className="text-slate-700 leading-relaxed">{cluster.peculiarityRevealed}</p>
                  </div>

                  {/* Psychological Analysis */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 hover:shadow-lg transition-all duration-300">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      Psychological Analysis
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white/60 p-4 rounded-xl">
                        <h4 className="font-bold text-slate-700 mb-2 text-base">Cognitive Biases</h4>
                        <p className="text-slate-600 leading-relaxed">{cluster.psychologicalAnalysis.cognitiveBiases}</p>
                      </div>
                      <div className="bg-white/60 p-4 rounded-xl">
                        <h4 className="font-bold text-slate-700 mb-2 text-base">Emotional Drivers</h4>
                        <p className="text-slate-600 leading-relaxed">{cluster.psychologicalAnalysis.emotionalDrivers}</p>
                      </div>
                      <div className="bg-white/60 p-4 rounded-xl">
                        <h4 className="font-bold text-slate-700 mb-2 text-base">Psychological Needs</h4>
                        <p className="text-slate-600 leading-relaxed">{cluster.psychologicalAnalysis.psychologicalNeeds}</p>
                      </div>
                      <div className="bg-white/60 p-4 rounded-xl">
                        <h4 className="font-bold text-slate-700 mb-2 text-base">Why It Persists</h4>
                        <p className="text-slate-600 leading-relaxed">{cluster.psychologicalAnalysis.whyItPersists}</p>
                      </div>
                    </div>
                  </div>

                  {/* Behavioral Science Explanation */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-100 hover:shadow-lg transition-all duration-300">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      Behavioral Science Explanation
                    </h3>
                    <p className="text-slate-700 leading-relaxed">{cluster.behavioralScienceExplanation}</p>
                  </div>

                  {/* Innovation Insight */}
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-2xl border border-violet-100 hover:shadow-lg transition-all duration-300">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      Innovation Insight
                    </h3>
                    <p className="text-slate-700 leading-relaxed">{cluster.innovationInsight}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Critical Requirements */}
        {psychologicalData.content.criticalRequirements && (
          <Card className="p-8 mb-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Critical Requirements</h2>
            </div>

            <ul className="space-y-4">
              {psychologicalData.content.criticalRequirements?.map((requirement, idx) => (
                <li key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 hover:shadow-md transition-all duration-300">
                  <span className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                    <span className="text-white font-bold text-sm">{idx + 1}</span>
                  </span>
                  <span className="text-slate-700 font-medium leading-relaxed">{requirement}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Fallback - Show raw data if structure doesn't match expected format */}
        {(!psychologicalData.content.clusters &&
          !psychologicalData.content.comprehensiveMetaAnalysis &&
          !psychologicalData.content.criticalRequirements) && (
            <Card className="p-8 mb-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Raw Data Structure</h2>
              <p className="text-slate-600 mb-6 text-lg">
                The data structure doesn't match the expected format. Here's the raw data:
              </p>
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-2xl border border-slate-200">
                {typeof psychologicalData.content === 'string' ? (
                  <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-mono text-sm">{psychologicalData.content}</div>
                ) : (
                  <pre className="text-sm text-slate-700 overflow-auto max-h-96 font-mono">
                    {JSON.stringify(psychologicalData.content, null, 2)}
                  </pre>
                )}
              </div>
            </Card>
          )}

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm mb-8 p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200">
          <p className="font-medium">Generated on {new Date(psychologicalData.generated_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}