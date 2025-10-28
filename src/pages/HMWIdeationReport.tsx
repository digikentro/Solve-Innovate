import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FiArrowLeft } from 'react-icons/fi';
import { Loader2, Lightbulb, BarChart3, Users, AlertTriangle, CheckCircle, Globe, Zap, Layers, Plus, Minus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface HMWIdeationData {
  content: any;
  generated_at: string;
  prompt?: string;
}

export default function HMWIdeationReport() {
  const params = useParams();
  const projectId = params.id;
  const navigate = useNavigate();
  const [data, setData] = useState<HMWIdeationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const formatValue = (v: any) => {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'string' && v.trim().toLowerCase() === 'undefined') return '—';
    return v;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        const { data: projectData, error } = await supabase
          .from('projects')
          .select('title, HMW_Ideation_Framework')
          .eq('id', projectId)
          .single();
        if (error) throw error;
        
        console.log('HMW Ideation Report - Raw project data:', projectData);
        
        setProjectTitle(projectData.title);
        let hif = projectData.HMW_Ideation_Framework;
        
        console.log('HMW Ideation Report - Raw HMW_Ideation_Framework:', hif);
        
        if (typeof hif === 'string') {
          try { 
            hif = JSON.parse(hif); 
            console.log('HMW Ideation Report - Parsed HMW_Ideation_Framework:', hif);
          } catch (e) { 
            console.error('HMW Ideation Report - Parse error:', e);
          }
        }
        if (hif && typeof hif === 'object' && hif.content) {
          // Check if content has meaningful data
          const hasContent = typeof hif.content === 'object' && hif.content !== null && 
            (Object.keys(hif.content).length > 0 || typeof hif.content === 'string');
          
          if (hasContent) {
            setData(hif as HMWIdeationData);
          } else {
            toast('HMW Ideation Framework is still being generated. Please refresh soon.', {
              icon: '⏳',
              duration: 4000
            });
          }
        } else {
          toast('HMW Ideation Framework is still being generated. Please refresh soon.', {
            icon: '⏳',
            duration: 4000
          });
        }
      } catch (e) {
        console.error('Error loading HMW Ideation Framework:', e);
        toast.error('Failed to load HMW Ideation Framework');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f6f0] via-[#f5f3ed] to-[#f0ede6] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#d4af37] to-[#b8941f] rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#1a1d29] rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold text-[#1a1d29] mb-3">Loading HMW Ideation Framework</h2>
          <p className="text-[#2c2c2c]/70 text-lg">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f6f0] via-[#f5f3ed] to-[#f0ede6] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1a1d29] to-[#2a2d3a] rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <Lightbulb className="w-10 h-10 text-[#d4af37]" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#d4af37] rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold text-[#1a1d29] mb-3">HMW Ideation Framework Not Ready</h2>
          <p className="text-[#2c2c2c]/70 text-lg mb-8">The framework is still being generated. Try again shortly.</p>
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-gradient-to-r from-[#d4af37] to-[#b8941f] hover:from-[#b8941f] hover:to-[#a0851a] text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200"
            >
              Refresh Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/projects/${projectId}`)} 
              className="w-full border-[#1a1d29] text-[#1a1d29] hover:bg-[#1a1d29] hover:text-white font-semibold py-3 rounded-xl transition-all duration-200"
            >
              Back to Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Structured rendering for HMW Ideation Framework
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f6f0] via-[#f5f3ed] to-[#f0ede6]">
      <div className="w-[70vw] mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-10">
          <Button 
            onClick={() => navigate(`/projects/${projectId}`)} 
            variant="ghost" 
            size="sm" 
            className="p-3 hover:bg-[#d4af37]/10 transition-all duration-200 rounded-xl"
          >
            <FiArrowLeft className="w-5 h-5 text-[#1a1d29]" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-[#1a1d29] mb-2 tracking-tight">HMW Ideation Framework</h1>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-[#d4af37] to-[#b8941f] rounded-full"></div>
              <p className="text-[#2c2c2c] text-lg font-medium">{projectTitle}</p>
            </div>
          </div>
        </div>

        {/* Structured renderer for HMW Ideation Framework */}
        {typeof data.content === 'string' ? (
          <Card className="p-8 mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="whitespace-pre-wrap text-[#2c2c2c] leading-relaxed text-base">{data.content}</div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Project Context */}
            {data.content.project_context && (
              <Card className="p-8 bg-gradient-to-br from-[#1a1d29] to-[#2a2d3a] border-0 shadow-2xl rounded-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-[#d4af37]/20 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-[#d4af37]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Project Context</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-[#d4af37] text-sm uppercase tracking-wide">Prioritized Pain Point</h3>
                      <p className="text-white/90 text-base leading-relaxed">{formatValue(data.content.project_context.prioritized_pain_point)}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-[#d4af37] text-sm uppercase tracking-wide">Target Extreme User</h3>
                      <p className="text-white/90 text-base leading-relaxed">{formatValue(data.content.project_context.target_extreme_user)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* HMW Ideation */}
            {Array.isArray(data.content.hmw_ideation) && data.content.hmw_ideation.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-[#d4af37]/10 rounded-xl">
                    <Lightbulb className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1a1d29]">HMW Ideation</h2>
                </div>
                {data.content.hmw_ideation.map((hmw: any, idx: number) => (
                  <Card key={idx} className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
                    <div className="space-y-8">
                      <div className="bg-gradient-to-r from-[#d4af37]/10 to-[#b8941f]/10 p-6 rounded-xl border border-[#d4af37]/20">
                        <h3 className="font-semibold text-[#d4af37] text-lg mb-3">HMW Statement</h3>
                        <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(hmw.hmw_statement)}</p>
                      </div>

                      {/* Approach 1: Simple Ideas */}
                      {hmw.approach_1_simple_ideas && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <h4 className="text-xl font-semibold text-[#1a1d29]">Approach 1: Simple Ideas</h4>
                          </div>
                          <div className="grid gap-4">
                            {hmw.approach_1_simple_ideas.map((idea: any, i: number) => (
                              <div key={i} className="bg-green-50/80 p-6 rounded-xl border border-green-200">
                                <h5 className="font-semibold text-green-800 mb-3">{idea.idea_name}</h5>
                                <div className="space-y-3 text-sm">
                                  <p><strong>Description:</strong> {idea.description}</p>
                                  <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                                  <p><strong>Implementation:</strong> {idea.implementation}</p>
                                  <p><strong>Extreme User Fit:</strong> {idea.extreme_user_fit}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Approach 2: Outside Category Ideas */}
                      {hmw.approach_2_outside_category_ideas && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Globe className="w-5 h-5 text-blue-600" />
                            </div>
                            <h4 className="text-xl font-semibold text-[#1a1d29]">Approach 2: Outside Category Ideas</h4>
                          </div>
                          <div className="grid gap-4">
                            {hmw.approach_2_outside_category_ideas.map((idea: any, i: number) => (
                              <div key={i} className="bg-blue-50/80 p-6 rounded-xl border border-blue-200">
                                <h5 className="font-semibold text-blue-800 mb-3">{idea.idea_name}</h5>
                                <div className="space-y-3 text-sm">
                                  <p><strong>Inspiration Source:</strong> {idea.inspiration_source}</p>
                                  <p><strong>Original Solution:</strong> {idea.original_solution}</p>
                                  <p><strong>Adaptation:</strong> {idea.adaptation}</p>
                                  <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                                  <p><strong>Implementation:</strong> {idea.implementation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Approach 3: Add Feature Ideas */}
                      {hmw.approach_3_add_feature_ideas && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Plus className="w-5 h-5 text-purple-600" />
                            </div>
                            <h4 className="text-xl font-semibold text-[#1a1d29]">Approach 3: Add Feature Ideas</h4>
                          </div>
                          <div className="grid gap-4">
                            {hmw.approach_3_add_feature_ideas.map((idea: any, i: number) => (
                              <div key={i} className="bg-purple-50/80 p-6 rounded-xl border border-purple-200">
                                <h5 className="font-semibold text-purple-800 mb-3">{idea.idea_name}</h5>
                                <div className="space-y-3 text-sm">
                                  <p><strong>Existing Product:</strong> {idea.existing_product}</p>
                                  <p><strong>Added Feature:</strong> {idea.added_feature}</p>
                                  <p><strong>Integration Method:</strong> {idea.integration_method}</p>
                                  <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                                  <p><strong>Automatic Behavior:</strong> {idea.automatic_behavior}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Approach 4: Remove Feature Ideas */}
                      {hmw.approach_4_remove_feature_ideas && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Minus className="w-5 h-5 text-orange-600" />
                            </div>
                            <h4 className="text-xl font-semibold text-[#1a1d29]">Approach 4: Remove Feature Ideas</h4>
                          </div>
                          <div className="grid gap-4">
                            {hmw.approach_4_remove_feature_ideas.map((idea: any, i: number) => (
                              <div key={i} className="bg-orange-50/80 p-6 rounded-xl border border-orange-200">
                                <h5 className="font-semibold text-orange-800 mb-3">{idea.idea_name}</h5>
                                <div className="space-y-3 text-sm">
                                  <p><strong>Existing Solution:</strong> {idea.existing_solution}</p>
                                  <p><strong>Removed Elements:</strong> {idea.removed_elements}</p>
                                  <p><strong>Simplified Experience:</strong> {idea.simplified_experience}</p>
                                  <p><strong>Behavior Enablement:</strong> {idea.behavior_enablement}</p>
                                  <p><strong>Maintained Functionality:</strong> {idea.maintained_functionality}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cross Approach Synthesis */}
                      {hmw.cross_approach_synthesis && (
                        <div className="bg-gradient-to-r from-[#1a1d29]/5 to-[#1a1d29]/10 p-6 rounded-xl border border-[#1a1d29]/20">
                          <h4 className="font-semibold text-[#1a1d29] text-lg mb-4">Cross-Approach Synthesis</h4>
                          <div className="grid md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-2">
                              <h5 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Complementary Ideas</h5>
                              <p className="text-[#2c2c2c] leading-relaxed">{hmw.cross_approach_synthesis.complementary_ideas}</p>
                            </div>
                            <div className="space-y-2">
                              <h5 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Implementation Priority</h5>
                              <p className="text-[#2c2c2c] leading-relaxed">{hmw.cross_approach_synthesis.implementation_priority}</p>
                            </div>
                            <div className="space-y-2">
                              <h5 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Extreme User Preference</h5>
                              <p className="text-[#2c2c2c] leading-relaxed">{hmw.cross_approach_synthesis.extreme_user_preference}</p>
                            </div>
                            <div className="space-y-2">
                              <h5 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Behavior Impact</h5>
                              <p className="text-[#2c2c2c] leading-relaxed">{hmw.cross_approach_synthesis.behavior_impact}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Portfolio Analysis */}
            {data.content.portfolio_analysis && (
              <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-[#d4af37]/10 rounded-xl">
                    <Layers className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1a1d29]">Portfolio Analysis</h2>
                </div>

                {/* Approach Effectiveness */}
                {data.content.portfolio_analysis.approach_effectiveness && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-[#1a1d29] text-lg mb-4">Approach Effectiveness</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-green-50/80 p-4 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Simple Ideas Strengths</h4>
                          <p className="text-sm text-green-700">{data.content.portfolio_analysis.approach_effectiveness.simple_ideas_strengths}</p>
                        </div>
                        <div className="bg-blue-50/80 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">Outside Category Insights</h4>
                          <p className="text-sm text-blue-700">{data.content.portfolio_analysis.approach_effectiveness.outside_category_insights}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-purple-50/80 p-4 rounded-lg">
                          <h4 className="font-medium text-purple-800 mb-2">Add Feature Opportunities</h4>
                          <p className="text-sm text-purple-700">{data.content.portfolio_analysis.approach_effectiveness.add_feature_opportunities}</p>
                        </div>
                        <div className="bg-orange-50/80 p-4 rounded-lg">
                          <h4 className="font-medium text-orange-800 mb-2">Remove Feature Impact</h4>
                          <p className="text-sm text-orange-700">{data.content.portfolio_analysis.approach_effectiveness.remove_feature_impact}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Steps Recommendations */}
                {data.content.portfolio_analysis.next_steps_recommendations && (
                  <div className="bg-gradient-to-r from-[#d4af37]/5 to-[#d4af37]/10 p-6 rounded-xl border border-[#d4af37]/20">
                    <h3 className="font-semibold text-[#1a1d29] text-lg mb-4">Next Steps Recommendations</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-[#1a1d29] mb-2">Priority Ideas</h4>
                          <ul className="list-disc ml-6 text-sm text-[#2c2c2c]">
                            {data.content.portfolio_analysis.next_steps_recommendations.priority_ideas?.map((idea: string, i: number) => (
                              <li key={i}>{idea}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-[#1a1d29] mb-2">Prototype Candidates</h4>
                          <ul className="list-disc ml-6 text-sm text-[#2c2c2c]">
                            {data.content.portfolio_analysis.next_steps_recommendations.prototype_candidates?.map((candidate: string, i: number) => (
                              <li key={i}>{candidate}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-[#1a1d29] mb-2">Research Needs</h4>
                          <p className="text-sm text-[#2c2c2c]">{data.content.portfolio_analysis.next_steps_recommendations.research_needs}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-[#1a1d29] mb-2">Implementation Planning</h4>
                          <p className="text-sm text-[#2c2c2c]">{data.content.portfolio_analysis.next_steps_recommendations.implementation_planning}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Fallback: show the raw content if nothing matched */}
            {!data.content.project_context && !(Array.isArray(data.content.hmw_ideation) && data.content.hmw_ideation.length > 0) && !data.content.portfolio_analysis && (
              <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
                <h2 className="text-2xl font-bold text-[#1a1d29] mb-6">Data</h2>
                <pre className="text-sm text-[#2c2c2c] overflow-auto max-h-96 bg-[#f8f6f0] p-4 rounded-xl">{JSON.stringify(data.content, null, 2)}</pre>
              </Card>
            )}
          </div>
        )}

        <div className="text-center text-[#2c2c2c]/70 text-sm mb-8 mt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-[#d4af37]/20">
            <div className="w-2 h-2 bg-[#d4af37] rounded-full"></div>
            <p>Generated on {new Date(data.generated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}