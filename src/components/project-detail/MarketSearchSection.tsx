import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { FiSearch, FiLoader } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import type { Project } from '@/types/project';
import { MarketResearchReportViewer } from './MarketResearchReportViewer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { postN8nWebhook } from '@/services/n8nWebhook';

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
                let protoImages = project.prototype_images;
                if (typeof project.prototype_images === 'string') {
                    let cleanString = project.prototype_images.trim();
                    if (!cleanString.startsWith('{') && !cleanString.startsWith('[')) {
                        cleanString = `{${cleanString}}`;
                    }
                    protoImages = JSON.parse(cleanString);
                }
                
                if (protoImages?.image) {
                    designStage = 'Refined Prototype';
                } else if (protoImages?.sketch) {
                    designStage = 'Rough Prototype';
                }
            } catch (e) {
                console.warn('Failed to parse prototype_images', e);
            }
        }

        let prototypeArtifacts: { sketch?: string; image?: string } = {};
        if (project.prototype_images) {
            try {
                let parsed = project.prototype_images;
                if (typeof project.prototype_images === 'string') {
                    // Fix potentially malformed JSON string (e.g. using single quotes or unescaped values)
                    let cleanString = project.prototype_images.trim();
                    if (!cleanString.startsWith('{') && !cleanString.startsWith('[')) {
                        cleanString = `{${cleanString}}`; // Attempt to wrap if it's missing brackets
                    }
                    parsed = JSON.parse(cleanString);
                }
                
                prototypeArtifacts = {
                    sketch: parsed?.sketch,
                    image: parsed?.image,
                };
            } catch (e) {
                console.warn('Failed to parse prototype_images', e);
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

            const webhookUrl =
                import.meta.env.VITE_N8N_MARKET_RESEARCH_WEBHOOK?.trim() ||
                'https://n8n.srv922914.hstgr.cloud/webhook/marketrearch';

            const response = await postN8nWebhook(webhookUrl, requestBody);
            const responseText = await response.text();

            if (!response.ok) {
                let detail = `${response.status} ${response.statusText}`.trim();
                try {
                    const errBody = JSON.parse(responseText) as { message?: string };
                    if (errBody?.message) detail = errBody.message;
                } catch {
                    if (responseText?.trim()) detail = responseText.trim().slice(0, 300);
                }
                console.error('Market research webhook error:', response.status, detail, responseText);
                throw new Error(detail);
            }

            let data = null;
            try {
                if (responseText && responseText.trim()) {
                    data = JSON.parse(responseText);
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
            const msg = error instanceof Error && error.message ? error.message : 'Failed to generate market research. Please try again.';
            toast.error(msg.length > 160 ? `${msg.slice(0, 157)}…` : msg);
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
            <Card className="animate-fadeIn overflow-hidden border border-gray-200 bg-white shadow-none">
                <CardContent className="px-6 pb-6 pt-6">
                    <MarketResearchReportViewer
                        data={marketSearchData}
                        onGenerateNew={handleGenerateNew}
                    />
                </CardContent>
            </Card>
        );
    }

    // Show generate button only
    return (
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
            <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight text-gray-900">
                    <FiSearch className="size-5 shrink-0 text-gray-400" />
                    Market Search
                </CardTitle>
                <CardDescription className="text-xs uppercase tracking-wide text-gray-500">
                    Comprehensive market research generation
                </CardDescription>
            </CardHeader>
            
            <CardContent className="flex flex-col gap-6 px-6 pb-6 pt-6">
                <p className="text-sm leading-relaxed text-gray-600">
                    Generate comprehensive market research based on your project data. All relevant information will be automatically extracted from your project insights, testing scenarios, and prototype details.
                </p>
                <div className="flex justify-start">
                    <Button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FiSearch className="mr-2 size-4" />
                                Generate Market Research
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
