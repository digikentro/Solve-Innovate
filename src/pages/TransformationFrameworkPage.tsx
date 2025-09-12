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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-black-600" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Transformation Framework...</h2>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-black-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-black-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Transformation Framework Not Ready</h2>
          <p className="text-gray-500 mb-6">The framework is still being generated. Try again shortly.</p>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">Refresh Page</Button>
            <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)} className="w-full">Back to Project</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-[70vw] mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Button onClick={() => navigate(`/projects/${projectId}`)} variant="ghost" size="sm" className="p-2">
            <FiArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transformation Framework</h1>
            <p className="text-gray-600 mt-1">{projectTitle}</p>
          </div>
        </div>

        {/* Structured renderer for Transformation Framework */}
        {typeof data.content === 'string' ? (
          <Card className="p-6 mb-8 bg-white border">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{data.content}</div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Project Context */}
            {data.content.projectContext && (
              <Card className="p-6 bg-gradient-to-r from-black-50 to-black-50 border-black-200">
                <div className="flex items-start gap-3 mb-4">
                  <BarChart3 className="w-5 h-5 text-black-600" />
                  <h2 className="text-xl font-semibold text-black-900">Project Context</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Prioritized Pain Point</h3>
                    <p className="text-gray-700 text-sm">{formatValue(data.content.projectContext.prioritizedPainPoint)}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Target User Type</h3>
                    <p className="text-gray-700 text-sm">{formatValue(data.content.projectContext.targetUserType)}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Outcome Integration Analysis */}
            {data.content.outcomeIntegrationAnalysis && (
              <Card className="p-6 bg-white border">
                <div className="flex items-start gap-3 mb-4">
                  <Globe className="w-5 h-5 text-black-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Outcome Integration Analysis</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Psychological Pattern Themes</h3>
                    <ul className="space-y-2 text-sm">
                      {data.content.outcomeIntegrationAnalysis.psychologicalPatternThemes?.map((t: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-gray-700">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Innovation Opportunity Spaces</h3>
                    <ul className="space-y-2 text-sm">
                      {data.content.outcomeIntegrationAnalysis.innovationOpportunitySpaces?.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-black-400 rounded-full mt-2 flex-shrink-0"></span>
                          <span className="text-gray-700">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {data.content.outcomeIntegrationAnalysis.painPointSolutionCoherence && (
                  <div className="mt-6 bg-black-50 p-4 rounded border border-black-200">
                    <h3 className="font-semibold text-black-900 mb-2">Pain-Point ⇄ Solution Coherence</h3>
                    <p className="text-black-800 text-sm">{data.content.outcomeIntegrationAnalysis.painPointSolutionCoherence}</p>
                  </div>
                )}
                {data.content.outcomeIntegrationAnalysis.implementationPrioritySuggestions && (
                  <div className="mt-4 bg-black-50 p-4 rounded border border-black-200">
                    <h3 className="font-semibold text-black-900 mb-2">Implementation Priority Suggestions</h3>
                    <p className="text-black-800 text-sm">{data.content.outcomeIntegrationAnalysis.implementationPrioritySuggestions}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Irrationality Clusters (if present) */}
            {Array.isArray(data.content.irrationalityClusters) && data.content.irrationalityClusters.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-black-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Irrationality Clusters</h2>
                </div>
                {data.content.irrationalityClusters.map((cluster: any, idx: number) => (
                  <Card key={idx} className="p-6">
                    <div className="space-y-4">
                      {cluster.irrationality && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">Irrationality</h3>
                          <p className="text-gray-700 text-sm">{formatValue(cluster.irrationality)}</p>
                        </div>
                      )}

                      {Array.isArray(cluster.diagnosis) && cluster.diagnosis.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">Diagnosis</h3>
                          <ul className="space-y-1 text-sm">
                            {cluster.diagnosis.map((d: string, dIdx: number) => (
                              <li key={dIdx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                                <span className="text-gray-700">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {cluster.psychologicalNeedAnalysis && (
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                          <h3 className="font-semibold text-gray-900 mb-2">Psychological Need Analysis</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-800 mb-1">Core Need</h4>
                              <p className="text-gray-700 text-sm">{formatValue(cluster.psychologicalNeedAnalysis.coreNeed)}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800 mb-1">Bias-driven Motivation</h4>
                              <p className="text-gray-700 text-sm">{formatValue(cluster.psychologicalNeedAnalysis.biasDrivenMotivation)}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800 mb-1">Persistence Factor</h4>
                              <p className="text-gray-700 text-sm">{formatValue(cluster.psychologicalNeedAnalysis.persistenceFactor)}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800 mb-1">Pain Point Connection</h4>
                              <p className="text-gray-700 text-sm">{formatValue(cluster.psychologicalNeedAnalysis.painPointConnection)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {cluster.outcome && (
                        <div className="bg-black-50 p-4 rounded border border-black-200">
                          <h3 className="font-semibold text-black-900 mb-2">Outcome</h3>
                          <p className="text-black-800 text-sm">{formatValue(cluster.outcome)}</p>
                        </div>
                      )}

                      {cluster.outcomeValidation && (
                        <div className="bg-black-50 p-4 rounded border border-black-200">
                          <h3 className="font-semibold text-black-900 mb-2">Outcome Validation</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-800 mb-1">Smart Psychology Use</h4>
                              <p className="text-gray-700 text-sm">{formatValue(cluster.outcomeValidation.smartPsychologyUse)}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800 mb-1">Pain Point Alignment</h4>
                              <p className="text-gray-700 text-sm">{formatValue(cluster.outcomeValidation.painPointAlignment)}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800 mb-1">Specificity Level</h4>
                              <p className="text-gray-700 text-sm">{formatValue(cluster.outcomeValidation.specificityLevel)}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800 mb-1">Direction Focus</h4>
                              <p className="text-gray-700 text-sm">{formatValue(cluster.outcomeValidation.directionFocus)}</p>
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
              <Card className="p-6 bg-white border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Data</h2>
                <pre className="text-xs text-gray-700 overflow-auto max-h-96">{JSON.stringify(data.content, null, 2)}</pre>
              </Card>
            )}
          </div>
        )}

        <div className="text-center text-gray-500 text-sm mb-8">
          <p>Generated on {new Date(data.generated_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}


