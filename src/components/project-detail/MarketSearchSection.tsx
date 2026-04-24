import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { FiSearch, FiLoader } from 'react-icons/fi';
import type { Project } from '@/types/project';
import { MarketResearchReportViewer } from './MarketResearchReportViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MarketSearchSectionProps {
    project: Project;
    asIsMapData: any;
    extremeUserData: any;
    deepEmpathyData: any;
    ideaClusteringData: any;
    testingData: any;
    marketSearchData: any;
    setMarketSearchData: (data: any) => void;
    onRefreshProject?: () => void;
}

export const MarketSearchSection = ({
    project,
    asIsMapData,
    extremeUserData,
    deepEmpathyData,
    ideaClusteringData,
    testingData,
    marketSearchData,
    setMarketSearchData,
    onRefreshProject,
}: MarketSearchSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    // Check if data exists
    const hasData = marketSearchData !== null && marketSearchData !== undefined &&
        (typeof marketSearchData === 'object' && Object.keys(marketSearchData).length > 0);

    // Extract auto-populated data from project (same as Testing)
    const autoPopulatedData = useMemo(() => {
        const problemStatement = project.description || project.title || '';

        let targetUsers = '';
        const asIsContent = asIsMapData?.content || asIsMapData;
        if (asIsContent?.hmw_statement_analysis?.target_users) {
            const tu = asIsContent.hmw_statement_analysis.target_users;
            targetUsers = Array.isArray(tu) ? tu.join(', ') : String(tu);
        } else if (extremeUserData) {
            const extContent = extremeUserData?.content || extremeUserData;
            if (extContent?.extreme_users) {
                targetUsers = extContent.extreme_users
                    .map((u: any) => u.user_type || u.name || '')
                    .filter(Boolean)
                    .join(', ');
            }
        }

        let keyFeatures: string[] = [];
        const ideaContent = ideaClusteringData?.content || ideaClusteringData;
        if (ideaContent?.top_5_clusters?.[0]?.idea_card?.features) {
            keyFeatures = ideaContent.top_5_clusters[0].idea_card.features;
        }

        let userScenarios: string[] = [];
        const deepContent = deepEmpathyData?.content || deepEmpathyData;
        if (deepContent?.journey_stages) {
            userScenarios = deepContent.journey_stages
                .slice(0, 3)
                .map((stage: any) => stage.stage_name || stage.description || '')
                .filter(Boolean);
        }

        let designStage = 'Early Concept';
        if (project.prototype_images) {
            try {
                const protoImages = typeof project.prototype_images === 'string'
                    ? JSON.parse(project.prototype_images)
                    : project.prototype_images;
                if (protoImages?.image) {
                    designStage = 'Refined Prototype';
                } else if (protoImages?.sketch) {
                    designStage = 'Rough Prototype';
                }
            } catch (e) {
                console.error('Failed to parse prototype_images', e);
            }
        }

        let prototypeArtifacts: { sketch?: string; image?: string } = {};
        if (project.prototype_images) {
            try {
                const parsed = typeof project.prototype_images === 'string'
                    ? JSON.parse(project.prototype_images)
                    : project.prototype_images;
                prototypeArtifacts = {
                    sketch: parsed?.sketch,
                    image: parsed?.image,
                };
            } catch (e) {
                console.error('Failed to parse prototype_images', e);
            }
        }

        let featureDescriptions: string[] = [];
        if (ideaContent?.top_5_clusters?.[0]?.idea_card) {
            const ideaCard = ideaContent.top_5_clusters[0].idea_card;
            if (ideaCard.primary_innovation) {
                featureDescriptions.push(`Primary Innovation: ${ideaCard.primary_innovation}`);
            }
            if (ideaCard.secondary_innovation) {
                featureDescriptions.push(`Secondary Innovation: ${ideaCard.secondary_innovation}`);
            }
            if (ideaCard.need_state) {
                featureDescriptions.push(`Need State: ${ideaCard.need_state}`);
            }
        }

        return {
            problemStatement,
            targetUsers,
            keyFeatures,
            userScenarios,
            designStage,
            prototypeArtifacts,
            featureDescriptions,
        };
    }, [project, asIsMapData, extremeUserData, deepEmpathyData, ideaClusteringData]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Get product_name from localStorage (saved by Testing section)
            const productNameFromTesting = localStorage.getItem(`testing_product_name_${project.id}`) || '';

            const requestBody = {
                project_id: project.id,
                product_name: productNameFromTesting || project.title || '',
                problem_statement: autoPopulatedData.problemStatement || '',
                target_users: autoPopulatedData.targetUsers || '',
                key_features: autoPopulatedData.keyFeatures?.join('\n') || '',
                user_scenarios: autoPopulatedData.userScenarios?.join('\n') || '',
                design_stage: autoPopulatedData.designStage || 'Early Concept',
                prototype_artifacts: JSON.stringify(autoPopulatedData.prototypeArtifacts || {}),
                feature_descriptions: autoPopulatedData.featureDescriptions?.join('\n') || '',
            };

            console.log('Market Search Request Body:', requestBody);

            const BACKEND_URL = (import.meta as any).env?.VITE_PPT_API_URL || 'http://localhost:8000';
            const targetUrl = 'https://n8n.srv922914.hstgr.cloud/webhook-test/marketrearch';

            const response = await fetch(`${BACKEND_URL}/api/v1/webhook/proxy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    target_url: targetUrl,
                    payload: requestBody
                }),
            });

            if (!response.ok) {
                console.error('API Response not ok:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let data = null;
            try {
                const text = await response.text();
                if (text && text.trim()) {
                    data = JSON.parse(text);
                }
            } catch (parseError) {
                console.log('Response parsing skipped or empty response');
            }

            console.log('Market Search Response:', data);

            toast.success('Market research generated successfully!');

            if (onRefreshProject) {
                setTimeout(() => onRefreshProject(), 2000);
            }
        } catch (error) {
            console.error('Error generating market research:', error);
            toast.error('Failed to generate market research. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateNew = () => {
        setMarketSearchData(null);
    };

    // Show results if data exists
    if (hasData) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-fadeIn">
                <MarketResearchReportViewer
                    data={marketSearchData}
                    onGenerateNew={handleGenerateNew}
                />
            </div>
        );
    }

    // Show generate button only
    return (
        <Card className="bg-white border border-gray-200 shadow-none rounded-xl overflow-hidden">
          <CardHeader className="px-8 py-6 border-b border-gray-100 flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-gray-100 flex items-center justify-center">
                <FiSearch className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-medium text-gray-900">Market Search</CardTitle>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Comprehensive market research generation</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Generate comprehensive market research based on your project data. All relevant information will be automatically extracted from your project insights, testing scenarios, and prototype details.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FiSearch className="w-4 h-4 mr-2" />
                    Generate Market Research
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
    );
};
