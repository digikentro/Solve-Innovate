import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FiArrowLeft } from 'react-icons/fi';
import { Loader2, Lightbulb, BarChart3, Users, AlertTriangle, CheckCircle, Globe, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface OutcomeToBehaviorData {
  content: any;
  generated_at: string;
  prompt?: string;
}

export default function OutcomeToBehaviorReport() {
  const params = useParams();
  const projectId = params.id;
  const navigate = useNavigate();
  const [data, setData] = useState<OutcomeToBehaviorData | null>(null);
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
          .select('title, Behaviour_Framework')
          .eq('id', projectId)
          .single();
        if (error) throw error;
        
        console.log('Outcome-to-Behavior Report - Raw project data:', projectData);
        
        setProjectTitle(projectData.title);
        let bf = projectData.Behaviour_Framework;
        
        console.log('Outcome-to-Behavior Report - Raw Behaviour_Framework:', bf);
        
        if (typeof bf === 'string') {
          try { 
            bf = JSON.parse(bf); 
            console.log('Outcome-to-Behavior Report - Parsed Behaviour_Framework:', bf);
          } catch (e) { 
            console.error('Outcome-to-Behavior Report - Parse error:', e);
          }
        }
        if (bf && typeof bf === 'object' && bf.content) {
          // Check if content has meaningful data
          const hasContent = typeof bf.content === 'object' && bf.content !== null && 
            (Object.keys(bf.content).length > 0 || typeof bf.content === 'string');
          
          if (hasContent) {
            setData(bf as OutcomeToBehaviorData);
          } else {
            toast('Outcome-to-Behavior HMW Framework is still being generated. Please refresh soon.', {
              icon: '⏳',
              duration: 4000
            });
          }
        } else {
          toast('Outcome-to-Behavior HMW Framework is still being generated. Please refresh soon.', {
            icon: '⏳',
            duration: 4000
          });
        }
      } catch (e) {
        console.error('Error loading Outcome-to-Behavior HMW Framework:', e);
        toast.error('Failed to load Outcome-to-Behavior HMW Framework');
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
          <h2 className="text-2xl font-bold text-[#1a1d29] mb-3">Loading Outcome-to-Behavior HMW Framework</h2>
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
          <h2 className="text-2xl font-bold text-[#1a1d29] mb-3">Outcome-to-Behavior HMW Framework Not Ready</h2>
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

  // Structured rendering for Outcome-to-Behavior HMW Framework
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
            <h1 className="text-4xl font-bold text-[#1a1d29] mb-2 tracking-tight">Outcome-to-Behavior HMW Framework</h1>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-[#d4af37] to-[#b8941f] rounded-full"></div>
              <p className="text-[#2c2c2c] text-lg font-medium">{projectTitle}</p>
            </div>
          </div>
        </div>

        {/* Structured renderer for Outcome-to-Behavior HMW Framework */}
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

            {/* Transformations */}
            {Array.isArray(data.content.transformations) && data.content.transformations.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-[#d4af37]/10 rounded-xl">
                    <Zap className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1a1d29]">Transformations</h2>
                </div>
                {data.content.transformations.map((trans: any, idx: number) => (
                  <Card key={idx} className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-[#1a1d29] text-lg">Outcome</h3>
                        <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.outcome)}</p>
                      </div>
                      {trans.behavior_analysis && (
                        <div className="bg-gradient-to-r from-[#d4af37]/5 to-[#d4af37]/10 p-6 rounded-xl border border-[#d4af37]/20">
                          <h3 className="font-semibold text-[#1a1d29] text-lg mb-4">Behavior Analysis</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Core Behavior</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.behavior_analysis.core_behavior)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Measurement Criteria</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.behavior_analysis.measurement_criteria)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Ability Barriers</h4>
                              <ul className="list-disc ml-6 text-[#2c2c2c] text-base">
                                {trans.behavior_analysis.ability_barriers?.map((b: string, i: number) => (
                                  <li key={i}>{b}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Extreme User Constraints</h4>
                              <ul className="list-disc ml-6 text-[#2c2c2c] text-base">
                                {trans.behavior_analysis.extreme_user_constraints?.map((c: string, i: number) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      {trans.behavior_specification && (
                        <div className="bg-gradient-to-br from-[#1a1d29] to-[#2a2d3a] p-6 rounded-xl text-white">
                          <h3 className="font-semibold text-[#d4af37] text-lg mb-3">Behavior Specification</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#d4af37] text-sm uppercase tracking-wide">Specific Action</h4>
                              <p className="text-white/90 text-base leading-relaxed">{formatValue(trans.behavior_specification.specific_action)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#d4af37] text-sm uppercase tracking-wide">Measurable Elements</h4>
                              <ul className="list-disc ml-6 text-white/90 text-base">
                                {trans.behavior_specification.measurable_elements?.map((m: string, i: number) => (
                                  <li key={i}>{m}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#d4af37] text-sm uppercase tracking-wide">Observable Components</h4>
                              <ul className="list-disc ml-6 text-white/90 text-base">
                                {trans.behavior_specification.observable_components?.map((o: string, i: number) => (
                                  <li key={i}>{o}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#d4af37] text-sm uppercase tracking-wide">Outcome Connection</h4>
                              <p className="text-white/90 text-base leading-relaxed">{formatValue(trans.behavior_specification.outcome_connection)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {trans.ability_focused_constraint && (
                        <div className="bg-gradient-to-r from-[#d4af37]/5 to-[#d4af37]/10 p-6 rounded-xl border border-[#d4af37]/20">
                          <h3 className="font-semibold text-[#1a1d29] text-lg mb-4">Ability-Focused Constraint</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Primary Barrier</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.ability_focused_constraint.primary_barrier)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Simplification Approach</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.ability_focused_constraint.simplification_approach)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Constraint Framing</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.ability_focused_constraint.constraint_framing)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Outcome Alignment</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.ability_focused_constraint.outcome_alignment)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {trans.hmw_statement && (
                        <div className="bg-gradient-to-br from-[#d4af37]/10 to-[#b8941f]/10 p-6 rounded-xl border border-[#d4af37]/20">
                          <h3 className="font-semibold text-[#d4af37] text-lg mb-3">HMW Statement</h3>
                          <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.hmw_statement)}</p>
                        </div>
                      )}
                      {trans.bj_fogg_validation && (
                        <div className="bg-gradient-to-r from-[#1a1d29]/5 to-[#1a1d29]/10 p-6 rounded-xl border border-[#1a1d29]/20">
                          <h3 className="font-semibold text-[#1a1d29] text-lg mb-4">BJ Fogg Validation</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Ability Focus</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.bj_fogg_validation.ability_focus)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Behavior Specificity</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.bj_fogg_validation.behavior_specificity)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Extreme User Enablement</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.bj_fogg_validation.extreme_user_enablement)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Outcome Achievement</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(trans.bj_fogg_validation.outcome_achievement)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Behavior Integration Analysis */}
            {data.content.behavior_integration_analysis && (
              <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-[#d4af37]/10 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1a1d29]">Behavior Integration Analysis</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#1a1d29] text-lg">Behavior Pattern Themes</h3>
                    <ul className="space-y-3">
                      {data.content.behavior_integration_analysis.behavior_pattern_themes?.map((t: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-[#2c2c2c] text-base leading-relaxed">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#1a1d29] text-lg">Ability Simplification Strategies</h3>
                    <ul className="space-y-3">
                      {data.content.behavior_integration_analysis.ability_simplification_strategies?.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-[#2c2c2c] text-base leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {data.content.behavior_integration_analysis.extreme_user_enablement_coherence && (
                  <div className="mt-8 bg-gradient-to-r from-[#d4af37]/5 to-[#d4af37]/10 p-6 rounded-xl border border-[#d4af37]/20">
                    <h3 className="font-semibold text-[#1a1d29] text-lg mb-3">Extreme User Enablement Coherence</h3>
                    <p className="text-[#2c2c2c] text-base leading-relaxed">{data.content.behavior_integration_analysis.extreme_user_enablement_coherence}</p>
                  </div>
                )}
                {data.content.behavior_integration_analysis.outcome_achievement_pathway && (
                  <div className="mt-6 bg-gradient-to-r from-[#1a1d29]/5 to-[#1a1d29]/10 p-6 rounded-xl border border-[#1a1d29]/20">
                    <h3 className="font-semibold text-[#1a1d29] text-lg mb-3">Outcome Achievement Pathway</h3>
                    <p className="text-[#2c2c2c] text-base leading-relaxed">{data.content.behavior_integration_analysis.outcome_achievement_pathway}</p>
                  </div>
                )}
                {data.content.behavior_integration_analysis.implementation_feasibility_assessment && (
                  <div className="mt-6 bg-gradient-to-r from-[#d4af37]/5 to-[#d4af37]/10 p-6 rounded-xl border border-[#d4af37]/20">
                    <h3 className="font-semibold text-[#1a1d29] text-lg mb-3">Implementation Feasibility Assessment</h3>
                    <p className="text-[#2c2c2c] text-base leading-relaxed">{data.content.behavior_integration_analysis.implementation_feasibility_assessment}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Fallback: show the raw content if nothing matched */}
            {!data.content.project_context && !(Array.isArray(data.content.transformations) && data.content.transformations.length > 0) && !data.content.behavior_integration_analysis && (
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
