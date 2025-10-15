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
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-[85vw] max-w-7xl mx-auto py-8 px-6">
        {/* Modern Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(`/projects/${projectId}`)}
                variant="ghost"
                size="sm"
                className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  As-Is Process Map
                </h1>
                <p className="text-gray-600 mt-1 font-medium">{projectTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Analysis Complete
              </div>
              <div className="text-sm text-gray-500">
                Generated {new Date(asIsMapData.generated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* HMW Statement Analysis */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Problem Statement</h2>
              <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm">
                <p className="text-lg text-gray-800 leading-relaxed font-medium">
                  {asIsMapData.content.hmw_statement_analysis.hmw[0]}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Target Users</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{asIsMapData.content.hmw_statement_analysis.target_users[0]}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Core Need</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{asIsMapData.content.hmw_statement_analysis.core_need[0]}</p>
            </div>
          </div>
        </Card>

        {/* AS-IS Map */}
        <Card className="p-8 mb-8 bg-white shadow-xl border border-gray-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Current State Journey Map</h2>
              <p className="text-gray-600 mt-1">Step-by-step process breakdown</p>
            </div>
          </div>
          
          <div className="space-y-8">
            {asIsMapData.content.as_is_map.stages.map((stage, stageIndex) => (
              <div key={stage.id} className="relative">
                {/* Stage Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {stage.id}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{stage.stage_name}</h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full mt-2"></div>
                  </div>
                </div>
                
                {/* Steps Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 ml-16">
                  {stage.steps.map((step, stepIndex) => (
                    <div key={step.id} className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-emerald-300 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {step.id}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 leading-relaxed text-sm group-hover:text-emerald-800 transition-colors">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Connector Line */}
                {stageIndex < asIsMapData.content.as_is_map.stages.length - 1 && (
                  <div className="flex justify-center mt-8 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-emerald-300 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Pain Point Analysis */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pain Point Analysis</h2>
              <p className="text-gray-600 mt-1">Critical issues identified in the process</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Stage</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Step</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Pain Level</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {asIsMapData.content.pain_point_analysis.steps.map((painPoint, index) => (
                    <tr key={index} className="hover:bg-red-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        <div className="w-8 h-8 bg-red-100 text-red-700 rounded-lg flex items-center justify-center text-sm font-bold">
                          {painPoint.stage_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {painPoint.step_id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold w-fit ${getPainLevelColor(painPoint.pain_level.toString())}`}>
                          {getPainLevelIcon(painPoint.pain_level.toString())}
                          {painPoint.pain_level}/10
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 leading-relaxed">
                        {painPoint.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Pareto Prioritization */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Top Bottlenecks (Pareto Analysis)</h2>
              <p className="text-gray-600 mt-1">Priority-ranked critical issues for maximum impact</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Stage</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Step</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Pain Level</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Impact Scope</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Evidence</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Solutions Gap</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Hypothesis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  {asIsMapData.content.pareto_prioritization.top_bottlenecks.map((bottleneck, index) => (
                    <tr key={index} className="hover:bg-orange-50 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm font-bold text-orange-800">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl flex items-center justify-center text-sm font-bold">
                          #{index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        <div className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center text-sm font-bold">
                          {bottleneck.stage_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {bottleneck.step_id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold w-fit ${getPainLevelColor(bottleneck.pain_level.toString())}`}>
                          {getPainLevelIcon(bottleneck.pain_level.toString())}
                          {bottleneck.pain_level}/10
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 leading-relaxed">
                        {bottleneck.impact_scope}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 leading-relaxed">
                        {bottleneck.bottleneck_evidence[0]}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 leading-relaxed">
                        {bottleneck.current_solutions_gap[0]}
                      </td>
                      <td className="px-6 py-4 text-sm text-orange-700 leading-relaxed font-medium">
                        {bottleneck.hypothesis_for_exploration[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Exploration Recommendations */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Exploration Recommendations</h2>
              <p className="text-gray-600 mt-1">Strategic next steps for process improvement</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group bg-white p-6 rounded-2xl border border-purple-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Primary Focus</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{asIsMapData.content.exploration_recommendations.primary_focus[0]}</p>
            </div>
            <div className="group bg-white p-6 rounded-2xl border border-purple-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Research Methods</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{asIsMapData.content.exploration_recommendations.research_methods[0]}</p>
            </div>
            <div className="group bg-white p-6 rounded-2xl border border-purple-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Success Metrics</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{asIsMapData.content.exploration_recommendations.success_metrics[0]}</p>
            </div>
            <div className="group bg-white p-6 rounded-2xl border border-purple-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Timeline</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{asIsMapData.content.exploration_recommendations.timeline[0]}</p>
            </div>
          </div>
        </Card>

        {/* Credible Sources */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Credible Sources</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {asIsMapData.content.credible_sources.map((source, index) => (
              <div key={index} className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Source {index + 1}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                  {source.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                  {source.relevance}
                </p>
                
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors group/link"
                >
                  <span>View Source</span>
                  <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </Card>

        {/* Modern Footer */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Analysis Complete</h3>
                <p className="text-gray-600">Generated on {new Date(asIsMapData.generated_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl text-sm font-medium">
                Ready for Next Phase
              </div>
              <Button 
                onClick={() => navigate(`/projects/${projectId}`)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200"
              >
                Back to Project
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
