'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiZap, FiCheckCircle } from 'react-icons/fi';
import type { Project } from '@/types/project';
import { ProjectService } from '@/services/projectService';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PrototypingToolsSectionProps {
  ideaClusteringData: any;
  project: Project;
  onRefreshProject?: () => Promise<void> | void;
}

export const PrototypingToolsSection = ({ ideaClusteringData, project, onRefreshProject }: PrototypingToolsSectionProps) => {
  const { user } = useAuth();
  const reportData = useMemo(() => {
    if (!ideaClusteringData) return null;
    return ideaClusteringData.content ?? ideaClusteringData;
  }, [ideaClusteringData]);

  const clusters = reportData?.top_5_clusters ?? [];
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [selectedRank, setSelectedRank] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSketch, setIsGeneratingSketch] = useState(false);
  const [prototypeSketchUrl, setPrototypeSketchUrl] = useState<string | null>(null);
  const [prototypeImageUrl, setPrototypeImageUrl] = useState<string | null>(null);
  const [prototypeGeneratedAt, setPrototypeGeneratedAt] = useState<string | null>(null);
  const [showCards, setShowCards] = useState(true);
  const [isSubmittingImage, setIsSubmittingImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const parsePrototypeImage = (raw: any) => {
    if (!raw) return { sketchUrl: null, imageUrl: null, generatedAt: null };
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const sketchUrl = parsed?.sketch || null;
      const imageUrl = parsed?.image || null;
      const generatedAt = parsed?.generated_at || null;
      return { sketchUrl, imageUrl, generatedAt };
    } catch (e) {
      try {
        if (typeof raw === 'string') {
          const matches = raw.match(/https?:\/\/[^\s"']+\.(png|jpg|jpeg|webp|gif|svg)/gi) || [];
          const sketchUrl = matches[0] ?? null;
          const imageUrl = matches[1] ?? null;
          const tsMatch = raw.match(/generated_at\"?\s*:?\s*\"?([^\"\n}]+)/i);
          const generatedAt = tsMatch ? tsMatch[1].replace(/\"/g, '') : null;
          return { sketchUrl, imageUrl, generatedAt };
        }
      } catch (rex) {
        console.error('Regex-based parse failed', rex);
      }
      console.error('Failed to parse prototype_images', e, raw);
      return { sketchUrl: null, imageUrl: null, generatedAt: null };
    }
  };

  const applyPrototypeImage = (raw: any) => {
    const { sketchUrl, imageUrl, generatedAt } = parsePrototypeImage(raw);
    setPrototypeSketchUrl(sketchUrl);
    setPrototypeImageUrl(imageUrl);
    setPrototypeGeneratedAt(generatedAt);
    if (sketchUrl || imageUrl) {
      setIsGeneratingSketch(false);
      setIsGeneratingImage(false);
      setShowCards(false);
    }
  };

  useEffect(() => {
    applyPrototypeImage(project.prototype_images);
  }, [project.prototype_images]);

  useEffect(() => {
    if (clusters.length > 0) {
      setSelectedRank(clusters[0].rank ?? null);
    } else {
      setSelectedRank(null);
    }
  }, [clusters]);

  if (!clusters.length) {
    return (
      <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
        <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-md bg-gray-50">
            <FiZap className="size-6 text-gray-300" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-gray-900">No Ideas Available</h3>
            <p className="text-xs text-gray-500">Run the Idea Clustering and Idea Cards report to see top-ranked ideas for prototyping.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const toggleCard = (rank: number) => {
    setExpandedCards(prev => ({ ...prev, [rank]: !prev[rank] }));
  };

  const getSelectedCluster = () => clusters.find((cluster: any) => cluster.rank === selectedRank);

  const buildPayload = () => {
    if (selectedRank === null) {
      toast.error('Please choose a final idea to prototype.');
      return null;
    }
    const selectedCluster = getSelectedCluster();
    if (!selectedCluster) {
      toast.error('Selected idea not found. Please choose again.');
      return null;
    }
    return {
      selectedCluster,
      payload: {
        project_id: project.id,
        project: {
          title: project.title,
          description: project.description,
          status: project.status,
        },
        selected_idea: selectedCluster,
      },
    };
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollForPrototypeField = async (field: 'sketch' | 'image', maxAttempts = 12, intervalMs = 1000) => {
    if (!user?.id) return false;
    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const latest = await ProjectService.getProjectById(project.id, user.id);
        if (latest?.prototype_images) {
          const { sketchUrl, imageUrl } = parsePrototypeImage(latest.prototype_images);
          const targetUrl = field === 'sketch' ? sketchUrl : imageUrl;
          if (targetUrl) {
            applyPrototypeImage(latest.prototype_images);
            return true;
          }
        }
        await delay(intervalMs);
      }
      return false;
    } catch (error) {
      console.error('Polling for image failed:', error);
      return false;
    }
  };

  const handleGenerate = () => {
    if (prototypeSketchUrl) {
      setPrototypeSketchUrl(null);
      setPrototypeImageUrl(null);
      setPrototypeGeneratedAt(null);
      setShowCards(true);
      setIsGeneratingSketch(false);
    }

    const built = buildPayload();
    if (!built) return;
    const { payload, selectedCluster } = built;

    const persistAndSend = async () => {
      setIsSubmitting(true);
      setIsGeneratingSketch(true);
      try {
        if (!user?.id) throw new Error('Not authenticated');
        await ProjectService.updateProject(project.id, { final_idea: selectedCluster }, user.id);

        const res = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/prototyping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        try {
          await res.json();
        } catch {}

        toast.success(
          selectedCluster?.cluster_name
            ? `Generating prototype guidance for ${selectedCluster.cluster_name}...`
            : 'Generating prototype guidance for the selected idea...'
        );

        if (onRefreshProject) {
          await onRefreshProject();
        }

        pollForPrototypeField('sketch').catch(pollErr => {
          console.error('Background polling failed:', pollErr);
        });
      } catch (err) {
        console.error('Prototyping generate failed', err);
        toast.error('Failed to save and trigger prototyping. Please try again.');
        setIsGeneratingSketch(false);
      } finally {
        setIsSubmitting(false);
      }
    };

    persistAndSend();
  };

  const handleGenerateImage = () => {
    const built = buildPayload();
    if (!built) return;
    const { payload, selectedCluster } = built;

    if (prototypeImageUrl) {
      setPrototypeImageUrl(null);
    }

    const persistAndSend = async () => {
      setIsSubmittingImage(true);
      setIsGeneratingImage(true);
      try {
        if (!user?.id) throw new Error('Not authenticated');
        await ProjectService.updateProject(project.id, { final_idea: selectedCluster }, user.id);

        const res = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/img_prototyping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        try {
          await res.json();
        } catch {}

        toast.success(
          selectedCluster?.cluster_name
            ? `Generating image prototype for ${selectedCluster.cluster_name}...`
            : 'Generating image prototype for the selected idea...'
        );

        if (onRefreshProject) {
          await onRefreshProject();
        }

        pollForPrototypeField('image').catch(pollErr => {
          console.error('Background polling failed:', pollErr);
        });
      } catch (err) {
        console.error('Image generation failed', err);
        toast.error('Failed to generate image prototype. Please try again.');
        setIsGeneratingImage(false);
      } finally {
        setIsSubmittingImage(false);
      }
    };

    persistAndSend();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sketch Prototype Card */}
      <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary">
              <FiZap className="size-5 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-sm font-semibold leading-none text-gray-900">Sketch Prototype</CardTitle>
              {prototypeGeneratedAt && (
                <p className="text-xs text-gray-500">Generated at {new Date(prototypeGeneratedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isSubmitting}
            size="sm"
            className="shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating...
              </>
            ) : (
              prototypeSketchUrl ? 'Generate Again' : 'Generate Sketch'
            )}
          </Button>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-6">
          {isGeneratingSketch && !prototypeSketchUrl && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-sm text-gray-500">Creating your sketch prototype...</p>
            </div>
          )}

          {prototypeSketchUrl ? (
            <div className="flex w-full justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-100">
              <img
                src={prototypeSketchUrl}
                alt="Generated sketch prototype"
                className="max-h-96 w-full max-w-2xl object-contain"
              />
            </div>
          ) : (
            !isGeneratingSketch && (
              <div className="w-full rounded-md border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No sketch prototype yet. Click "Generate Sketch" to create one.
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Image Prototype Card */}
      <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary">
              <FiZap className="size-5 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-sm font-semibold leading-none text-gray-900">Image Prototype</CardTitle>
              {prototypeGeneratedAt && (
                <p className="text-xs text-gray-500">Generated at {new Date(prototypeGeneratedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
          <Button
            type="button"
            onClick={handleGenerateImage}
            disabled={isSubmittingImage}
            size="sm"
            variant="outline"
            className="shrink-0"
          >
            {isSubmittingImage ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating...
              </>
            ) : (
              prototypeImageUrl ? 'Generate Again' : 'Generate Image'
            )}
          </Button>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-6">
          {isGeneratingImage && !prototypeImageUrl && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="text-sm text-gray-500">Creating your high-fidelity image...</p>
            </div>
          )}

          {prototypeImageUrl ? (
            <div className="flex w-full justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-100">
              <img
                src={prototypeImageUrl}
                alt="Generated image prototype"
                className="max-h-96 w-full max-w-2xl object-contain"
              />
            </div>
          ) : (
            !isGeneratingImage && (
              <div className="w-full rounded-md border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No image prototype yet. Click "Generate Image" to create one.
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Idea Selection Cards */}
      {showCards && !isGeneratingSketch && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Select an Idea to Prototype</h3>
          {clusters.map((cluster: any) => (
            <Card key={cluster.rank} className="bg-white border border-gray-200 shadow-none rounded-md overflow-hidden">
              <div className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="prototype-final-idea"
                    checked={selectedRank === cluster.rank}
                    onChange={() => setSelectedRank(cluster.rank)}
                    className="w-4 h-4"
                    aria-label={`Select ${cluster.cluster_name}`}
                  />
                  <label
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setSelectedRank(cluster.rank)}
                  >
                    <span className="text-lg font-bold text-gray-900">#{cluster.rank}</span>
                    <span className="text-sm font-semibold text-gray-900">{cluster.cluster_name}</span>
                    {typeof cluster.final_score !== 'undefined' && (
                      <span className="text-xs bg-primary text-white px-2 py-1 rounded">Score: {cluster.final_score}</span>
                    )}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRank === cluster.rank && <FiCheckCircle className="w-5 h-5 text-green-600" />}
                  <Button
                    onClick={() => toggleCard(cluster.rank)}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    {expandedCards[cluster.rank] ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </div>

              {expandedCards[cluster.rank] && cluster.idea_card && (
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-primary mb-2">Need State</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.need_state}</p>
                  </div>

                  {cluster.idea_card.features && (
                    <div>
                      <h4 className="text-xs font-bold text-primary mb-2">Key Features</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                        {cluster.idea_card.features.map((feature: string, i: number) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-50 border border-gray-200 shadow-none">
                      <CardContent className="pt-4">
                        <h4 className="text-xs font-bold text-primary mb-2">Primary Innovation</h4>
                        <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.primary_innovation}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-50 border border-gray-200 shadow-none">
                      <CardContent className="pt-4">
                        <h4 className="text-xs font-bold text-secondary mb-2">Secondary Innovation</h4>
                        <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.secondary_innovation}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {cluster.idea_card.market_opportunity && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gray-50 border border-gray-200 shadow-none">
                        <CardContent className="pt-4">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Target Market</p>
                          <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.market_opportunity.target_market}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50 border border-gray-200 shadow-none">
                        <CardContent className="pt-4">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Market Readiness</p>
                          <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.market_opportunity.market_readiness}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50 border border-gray-200 shadow-none">
                        <CardContent className="pt-4">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Competitive Advantage</p>
                          <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.market_opportunity.competitive_advantage}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {cluster.idea_card.implementation_pathway && (
                    <div>
                      <h4 className="text-xs font-bold text-primary mb-3">Implementation Phases</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-green-50 border border-green-200 shadow-none">
                          <CardContent className="pt-4">
                            <p className="text-xs font-semibold text-green-700 mb-2">Phase 1</p>
                            <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.implementation_pathway.phase_1}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border border-green-200 shadow-none">
                          <CardContent className="pt-4">
                            <p className="text-xs font-semibold text-green-700 mb-2">Phase 2</p>
                            <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.implementation_pathway.phase_2}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border border-green-200 shadow-none">
                          <CardContent className="pt-4">
                            <p className="text-xs font-semibold text-green-700 mb-2">Phase 3</p>
                            <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.implementation_pathway.phase_3}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {cluster.idea_card.risk_assessment && (
                    <Card className="bg-red-50 border border-red-200 shadow-none">
                      <CardContent className="pt-4">
                        <h4 className="text-xs font-bold text-red-700 mb-3">Risk Assessment</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-red-700 mb-2">Primary Risk</p>
                            <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.risk_assessment.primary_risk}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-red-700 mb-2">Mitigation</p>
                            <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.risk_assessment.mitigation_strategy}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-700 mb-2">Success Probability</p>
                            <p className="text-sm text-gray-800 whitespace-pre-line">{cluster.idea_card.risk_assessment.success_probability}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
