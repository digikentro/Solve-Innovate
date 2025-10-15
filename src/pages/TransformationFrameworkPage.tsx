import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FiArrowLeft } from 'react-icons/fi';
import { Loader2, Lightbulb, BarChart3, Users, AlertTriangle, CheckCircle, Globe, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TransformationFrameworkData {
  content: {
    projectContext?: {
      prioritizedPainPoint?: string;
      targetUserType?: string;
    };
    irrationalityClusters?: any[];
    outcomeIntegrationAnalysis?: {
      psychologicalPatternThemes?: string[];
      painPointSolutionCoherence?: string;
      innovationOpportunitySpaces?: string[];
      implementationPrioritySuggestions?: string;
    };
    [key: string]: any;
  } | string;
  generated_at: string;
  prompt?: string;
}

export default function TransformationFrameworkPage() {
  const params = useParams();
  const projectId = params.id;
  const navigate = useNavigate();
  const [data, setData] = useState<TransformationFrameworkData | null>(null);
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
          .select('title, transformation_framework')
          .eq('id', projectId)
          .single();
        if (error) throw error;
        setProjectTitle(projectData.title);
        let tf = projectData.transformation_framework;
        if (typeof tf === 'string') {
          try { tf = JSON.parse(tf); } catch (e) { /* ignore parse error */ }
        }
        if (tf && typeof tf === 'object' && tf.content && Object.keys(tf.content).length > 0) {
          setData(tf as TransformationFrameworkData);
        } else {
          toast('Transformation Framework is still being generated. Please refresh soon.', {
            icon: '⏳',
            duration: 4000
          });
        }
      } catch (e) {
        console.error('Error loading Transformation Framework:', e);
        toast.error('Failed to load Transformation Framework');
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
          <h2 className="text-2xl font-bold text-[#1a1d29] mb-3">Loading Transformation Framework</h2>
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
          <h2 className="text-2xl font-bold text-[#1a1d29] mb-3">Transformation Framework Not Ready</h2>
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
            <h1 className="text-4xl font-bold text-[#1a1d29] mb-2 tracking-tight">Transformation Framework</h1>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-[#d4af37] to-[#b8941f] rounded-full"></div>
              <p className="text-[#2c2c2c] text-lg font-medium">{projectTitle}</p>
            </div>
          </div>
        </div>

        {/* Structured renderer for Transformation Framework */}
        {typeof data.content === 'string' ? (
          <Card className="p-8 mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <div className="whitespace-pre-wrap text-[#2c2c2c] leading-relaxed text-base">{data.content}</div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Project Context */}
            {data.content.projectContext && (
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
                      <p className="text-white/90 text-base leading-relaxed">{formatValue(data.content.projectContext.prioritizedPainPoint)}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-[#d4af37] text-sm uppercase tracking-wide">Target User Type</h3>
                      <p className="text-white/90 text-base leading-relaxed">{formatValue(data.content.projectContext.targetUserType)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Outcome Integration Analysis */}
            {data.content.outcomeIntegrationAnalysis && (
              <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-[#d4af37]/10 rounded-xl">
                    <Globe className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1a1d29]">Outcome Integration Analysis</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#1a1d29] text-lg">Psychological Pattern Themes</h3>
                    <ul className="space-y-3">
                      {data.content.outcomeIntegrationAnalysis.psychologicalPatternThemes?.map((t: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-[#2c2c2c] text-base leading-relaxed">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[#1a1d29] text-lg">Innovation Opportunity Spaces</h3>
                    <ul className="space-y-3">
                      {data.content.outcomeIntegrationAnalysis.innovationOpportunitySpaces?.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-[#2c2c2c] text-base leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {data.content.outcomeIntegrationAnalysis.painPointSolutionCoherence && (
                  <div className="mt-8 bg-gradient-to-r from-[#d4af37]/5 to-[#d4af37]/10 p-6 rounded-xl border border-[#d4af37]/20">
                    <h3 className="font-semibold text-[#1a1d29] text-lg mb-3">Pain-Point ⇄ Solution Coherence</h3>
                    <p className="text-[#2c2c2c] text-base leading-relaxed">{data.content.outcomeIntegrationAnalysis.painPointSolutionCoherence}</p>
                  </div>
                )}
                {data.content.outcomeIntegrationAnalysis.implementationPrioritySuggestions && (
                  <div className="mt-6 bg-gradient-to-r from-[#1a1d29]/5 to-[#1a1d29]/10 p-6 rounded-xl border border-[#1a1d29]/20">
                    <h3 className="font-semibold text-[#1a1d29] text-lg mb-3">Implementation Priority Suggestions</h3>
                    <p className="text-[#2c2c2c] text-base leading-relaxed">{data.content.outcomeIntegrationAnalysis.implementationPrioritySuggestions}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Irrationality Clusters (if present) */}
            {Array.isArray(data.content.irrationalityClusters) && data.content.irrationalityClusters.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-[#d4af37]/10 rounded-xl">
                    <Users className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#1a1d29]">Irrationality Clusters</h2>
                </div>
                {data.content.irrationalityClusters.map((cluster: any, idx: number) => (
                  <Card key={idx} className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
                    <div className="space-y-6">
                      {cluster.irrationality && (
                        <div className="space-y-2">
                          <h3 className="font-semibold text-[#1a1d29] text-lg">Irrationality</h3>
                          <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(cluster.irrationality)}</p>
                        </div>
                      )}

                      {Array.isArray(cluster.diagnosis) && cluster.diagnosis.length > 0 && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-[#1a1d29] text-lg">Diagnosis</h3>
                          <ul className="space-y-3">
                            {cluster.diagnosis.map((d: string, dIdx: number) => (
                              <li key={dIdx} className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-gradient-to-r from-[#d4af37] to-[#b8941f] rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-[#2c2c2c] text-base leading-relaxed">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {cluster.psychologicalNeedAnalysis && (
                        <div className="bg-gradient-to-r from-[#d4af37]/5 to-[#d4af37]/10 p-6 rounded-xl border border-[#d4af37]/20">
                          <h3 className="font-semibold text-[#1a1d29] text-lg mb-4">Psychological Need Analysis</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Core Need</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(cluster.psychologicalNeedAnalysis.coreNeed)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Bias-driven Motivation</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(cluster.psychologicalNeedAnalysis.biasDrivenMotivation)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Persistence Factor</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(cluster.psychologicalNeedAnalysis.persistenceFactor)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Pain Point Connection</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(cluster.psychologicalNeedAnalysis.painPointConnection)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {cluster.outcome && (
                        <div className="bg-gradient-to-br from-[#1a1d29] to-[#2a2d3a] p-6 rounded-xl text-white">
                          <h3 className="font-semibold text-[#d4af37] text-lg mb-3">Outcome</h3>
                          <p className="text-white/90 text-base leading-relaxed">{formatValue(cluster.outcome)}</p>
                        </div>
                      )}

                      {cluster.outcomeValidation && (
                        <div className="bg-gradient-to-r from-[#1a1d29]/5 to-[#1a1d29]/10 p-6 rounded-xl border border-[#1a1d29]/20">
                          <h3 className="font-semibold text-[#1a1d29] text-lg mb-4">Outcome Validation</h3>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Smart Psychology Use</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(cluster.outcomeValidation.smartPsychologyUse)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Pain Point Alignment</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(cluster.outcomeValidation.painPointAlignment)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Specificity Level</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(cluster.outcomeValidation.specificityLevel)}</p>
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-medium text-[#1a1d29] text-sm uppercase tracking-wide">Direction Focus</h4>
                              <p className="text-[#2c2c2c] text-base leading-relaxed">{formatValue(cluster.outcomeValidation.directionFocus)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Fallback: show the raw content if nothing matched */}
            {!data.content.projectContext && !data.content.outcomeIntegrationAnalysis && !(Array.isArray(data.content.irrationalityClusters) && data.content.irrationalityClusters.length > 0) && (
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


