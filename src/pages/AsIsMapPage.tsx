import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, TrendingUp, AlertTriangle, Lightbulb, Target, BarChart3, Users, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

interface AsIsMapData {
  content: {
    hmw_statement_analysis: {
      hmw: string[];
      target_users: string[];
      core_need: string[];
    };
    as_is_map: {
      stages: Array<{
        id: number;
        stage_name: string;
        steps: Array<{
          id: number;
          description: string;
        }>;
      }>;
    };
    mece_validation: {
      mutually_exclusive_check: string[];
      collectively_exhaustive_check: string[];
    };
    pain_point_analysis: {
      steps: Array<{
        stage_id: number;
        step_id: number;
        pain_level: number;
        description: string;
      }>;
    };
    pareto_prioritization: {
      top_bottlenecks: Array<{
        stage_id: number;
        step_id: number;
        pain_level: number;
        impact_scope: string;
        bottleneck_evidence: string[];
        why_80_percent_impact: string[];
        ripple_effects: string[];
        current_solutions_gap: string[];
        hypothesis_for_exploration: string[];
      }>;
    };
    prioritization_rationale: {
      data_sources: Array<{
        title: string;
        url: string;
      }>;
      methodology: string[];
      impact_calculation: string[];
      confidence_level: string;
    };
    exploration_recommendations: {
      primary_focus: string[];
      research_methods: string[];
      success_metrics: string[];
      timeline: string[];
    };
    credible_sources: Array<{
      id: number;
      title: string;
      url: string;
      relevance: string;
    }>;
  };
  generated_at: string;
  prompt: string;
}

export default function AsIsMapPage() {
  const params = useParams();
  const projectId = params.id;
  const navigate = useNavigate();
  const [asIsMapData, setAsIsMapData] = useState<AsIsMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState<string>('');

  useEffect(() => {
    const fetchAsIsMap = async () => {
      if (!projectId) return;

      try {
        setLoading(true);
        
        // Get the project data including as_is_map
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('title, as_is_map')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProjectTitle(projectData.title);

        // Check if as_is_map exists and has content
        console.log('Project data received:', projectData);
        console.log('as_is_map value:', projectData.as_is_map);
        
        let asIsMapData = projectData.as_is_map;
        
        // Handle case where as_is_map might be stored as a JSON string
        if (typeof asIsMapData === 'string') {
          try {
            asIsMapData = JSON.parse(asIsMapData);
            console.log('Parsed as_is_map from string:', asIsMapData);
          } catch (error) {
            console.error('Failed to parse as_is_map string:', error);
            asIsMapData = null;
          }
        }
        
        if (asIsMapData && 
            typeof asIsMapData === 'object' && 
            asIsMapData.content && 
            Object.keys(asIsMapData.content).length > 0) {
          console.log('Setting as-is map data:', asIsMapData);
          setAsIsMapData(asIsMapData);
        } else {
          console.log('No valid as-is map data found');
          // No as-is map found yet
          toast('As-is map is still being generated. Please wait a moment and refresh.', {
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
        console.error('Error fetching as-is map:', error);
        toast.error('Failed to load as-is map data');
      } finally {
        setLoading(false);
      }
    };

    fetchAsIsMap();
  }, [projectId]);

  const getPainLevelColor = (level: string) => {
    const numLevel = parseInt(level);
    if (numLevel >= 8) return 'text-red-600 bg-red-100';
    if (numLevel >= 6) return 'text-orange-600 bg-orange-100';
    if (numLevel >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPainLevelIcon = (level: string) => {
    const numLevel = parseInt(level);
    if (numLevel >= 8) return <AlertTriangle className="w-4 h-4" />;
    if (numLevel >= 6) return <AlertTriangle className="w-4 h-4" />;
    if (numLevel >= 4) return <TrendingUp className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-700">Loading As-Is Map...</h2>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!asIsMapData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">As-Is Map Not Ready</h2>
          <p className="text-gray-500 mb-6">
            The as-is map is still being generated. This process typically takes a few minutes.
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
      <div className="container mx-auto py-8 px-4">
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
            <h1 className="text-3xl font-bold text-gray-900">As-Is Map</h1>
            <p className="text-gray-600 mt-1">{projectTitle}</p>
          </div>
        </div>

        {/* HMW Statement Analysis */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-blue-900">How Might We Statement</h2>
              <p className="text-blue-700 mt-1">{asIsMapData.content.hmw_statement_analysis.hmw[0]}</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Target Users
              </h3>
              <p className="text-blue-700 text-sm">{asIsMapData.content.hmw_statement_analysis.target_users[0]}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Core Need
              </h3>
              <p className="text-blue-700 text-sm">{asIsMapData.content.hmw_statement_analysis.core_need[0]}</p>
            </div>
          </div>
        </Card>

        {/* AS-IS Map */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Current State Journey Map</h2>
          </div>
          
          <div className="space-y-6">
            {asIsMapData.content.as_is_map.stages.map((stage) => (
              <div key={stage.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {stage.id}
                  </span>
                  {stage.stage_name}
                </h3>
                <div className="space-y-2">
                  {stage.steps.map((step) => (
                    <div key={step.id} className="flex gap-3">
                      <span className="text-sm font-medium text-gray-600 min-w-[60px]">
                        Step {step.id}:
                      </span>
                      <span className="text-sm text-gray-700 flex-1">{step.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pain Point Analysis */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Pain Point Analysis</h2>
          </div>
          
          <div className="space-y-6">
            {asIsMapData.content.pain_point_analysis.steps.map((painPoint, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Stage {painPoint.stage_id}, Step {painPoint.step_id}</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Step {painPoint.step_id}</span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPainLevelColor(painPoint.pain_level.toString())}`}>
                      {getPainLevelIcon(painPoint.pain_level.toString())}
                      Pain Level: {painPoint.pain_level}/10
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{painPoint.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pareto Prioritization */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-orange-900">Top Bottlenecks (Pareto Analysis)</h2>
          </div>
          
          <div className="space-y-6">
            {asIsMapData.content.pareto_prioritization.top_bottlenecks.map((bottleneck, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-orange-800">Top Bottleneck {index + 1}</h3>
                  <div className="text-2xl font-bold text-orange-600">{bottleneck.pain_level}/10</div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Step & Impact</h4>
                    <p className="text-gray-600 mb-2">Stage {bottleneck.stage_id}, Step {bottleneck.step_id}</p>
                    <p className="text-gray-600">{bottleneck.impact_scope}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Evidence & Gap</h4>
                    <p className="text-gray-600 mb-2">{bottleneck.bottleneck_evidence[0]}</p>
                    <p className="text-gray-600">{bottleneck.current_solutions_gap[0]}</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Hypothesis</h4>
                  <p className="text-orange-700 text-sm">{bottleneck.hypothesis_for_exploration[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Exploration Recommendations */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-purple-900">Exploration Recommendations</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">Primary Focus</h3>
              <p className="text-purple-700 text-sm">{asIsMapData.content.exploration_recommendations.primary_focus[0]}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">Research Methods</h3>
              <p className="text-purple-700 text-sm">{asIsMapData.content.exploration_recommendations.research_methods[0]}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">Success Metrics</h3>
              <p className="text-purple-700 text-sm">{asIsMapData.content.exploration_recommendations.success_metrics[0]}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">Timeline</h3>
              <p className="text-purple-700 text-sm">{asIsMapData.content.exploration_recommendations.timeline[0]}</p>
            </div>
          </div>
        </Card>

        {/* Credible Sources */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Globe className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Credible Sources</h2>
          </div>
          
          <div className="space-y-3">
            {asIsMapData.content.credible_sources.map((source, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{source.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{source.relevance}</p>
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium inline-flex items-center gap-1"
                >
                  View Source
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
                </a>
              </div>
            ))}
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mb-8">
          <p>Generated on {new Date(asIsMapData.generated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
