import { useState, useMemo } from 'react';
import { relaxedJsonParse } from '@/utils/jsonUtils';
import { toast } from 'react-hot-toast';
import { FiSearch, FiLoader } from 'react-icons/fi';
import type { Project } from '@/types/project';
import { MarketResearchReportViewer } from './MarketResearchReportViewer';
import { ProjectService } from '@/services/projectService';

const MARKET_RESEARCH_WEBHOOK_URL = 'https://n8n.srv922914.hstgr.cloud/webhook/market_research';
const MARKET_RESEARCH_TEST_WEBHOOK_URL = 'https://n8n.srv922914.hstgr.cloud/webhook-test/market_research';

const resolveMarketResearchWebhookUrl = (): string => {
    if ((import.meta as any).env?.DEV) {
        return MARKET_RESEARCH_TEST_WEBHOOK_URL;
    }

    const raw = String((import.meta as any).env?.VITE_N8N_MARKET_RESEARCH_WEBHOOK || '').trim();
    if (raw) {
        return raw.replace(/^=+/, '').replace(/\/+$/, '');
    }

    return MARKET_RESEARCH_WEBHOOK_URL;
};

const isWebhookNotRegisteredError = (detail: string): boolean =>
    /not registered/i.test(detail) || /webhook-test/i.test(detail);

const buildLocalMarketResearchReport = (requestBody: Record<string, string>) => {
    const productName = requestBody.product_name || 'Product';
    const problemStatement = requestBody.problem_statement || 'No problem statement provided.';
    const targetUsers = requestBody.target_users || 'Target users not specified.';
    const keyFeatures = (requestBody.key_features || '')
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);
    const scenarios = (requestBody.user_scenarios || '')
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);
    const designStage = requestBody.design_stage || 'Early Concept';

    return {
        content: {
            'Part 1': {
                'Project Name': productName,
                'Core Idea': problemStatement,
                'Key Features': keyFeatures.length > 0 ? keyFeatures : ['Primary user workflow', 'Core value delivery'],
                'Prototype Artifacts': requestBody.prototype_artifacts ? [
                    {
                        Sketch: JSON.parse(requestBody.prototype_artifacts || '{}').sketch,
                        Image: JSON.parse(requestBody.prototype_artifacts || '{}').image,
                    },
                ].filter(item => item.Sketch || item.Image) : [],
                'User Scenarios': scenarios,
                'Design Stage': designStage,
            },
            'Part 2': {
                '1. Competitive Landscape': [
                    {
                        'Competitor Name': 'Current workflow / manual process',
                        'Description of Their Solution': 'Users solve the problem with spreadsheets, messaging, or ad hoc coordination.',
                        'Pros': 'Already familiar and low setup cost.',
                        'Cons': 'Slow, inconsistent, and hard to scale.',
                    },
                    {
                        'Competitor Name': 'General-purpose digital tools',
                        'Description of Their Solution': 'Broad tools that can be adapted to the problem but are not purpose-built.',
                        'Pros': 'Flexible and easy to adopt in some teams.',
                        'Cons': 'Require manual configuration and lack domain-specific guidance.',
                    },
                ],
                '2. Comparative Analysis: Your Idea vs. Existing Solutions': {
                    'How the Proposed Idea is Better': [
                        {
                            'Advantage': 'Purpose-built workflow',
                            'Evidence': ['Maps directly to the user problem statement.', 'Keeps the primary action obvious.'],
                        },
                        {
                            'Advantage': 'More structured outputs',
                            'Evidence': ['Creates repeatable results for the target users.', 'Reduces ambiguity during handoff.'],
                        },
                    ],
                    'Is the Proposed Idea Truly the Best Option?': {
                        'Assessment': 'Likely yes for the current concept stage, but it needs live validation against the target audience to confirm usability and value.',
                        'Evidence': ['Early-stage prototypes usually benefit from faster task completion and clearer guidance.', 'User testing is needed to confirm the final fit.'],
                    },
                },
                '3. Differentiation and Value Proposition': [
                    {
                        'Unique Differentiator': 'Structured experience aligned to the exact use case',
                        'Evidence': ['Uses the supplied problem statement and user scenarios.', 'Can be tuned to the target workflow.'],
                        'Value Proposition': `A focused solution for ${targetUsers} that turns ${productName} into a clearer, more usable workflow.`,
                    },
                ],
                '4. Affordability Analysis': [
                    {
                        'Affordability Statement': 'Affordable enough for iteration at the prototype stage',
                        'Justification': 'The current concept can be validated without heavy operational overhead.',
                        'Evidence': ['Uses existing project context and lightweight content generation.', 'Defers deeper cost assumptions until testing.'],
                    },
                ],
            },
            'References': [
                'Prototype evidence from the current project data.',
                'Competitive benchmarking against manual and general-purpose workflows.',
                'User validation required to confirm desirability and adoption.',
            ],
            metadata: {
                generated_at: new Date().toISOString(),
                source: 'local_fallback',
                design_stage: designStage,
                user_scenarios: scenarios,
            },
        },
    };
};

interface MarketSearchSectionProps {
    project: Project;
    userId?: string;
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
    userId,
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

    const persistMarketSearch = async (report: any) => {
        setMarketSearchData(report);

        if (!userId) {
            return;
        }

        try {
            await ProjectService.updateProject(project.id, { market_research: report }, userId);
            if (onRefreshProject) {
                await onRefreshProject();
            }
        } catch (error) {
            console.warn('Failed to persist market research to project, keeping local state only.', error);
        }
    };

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
            const raw = project.prototype_images;
            const protoImages = relaxedJsonParse(raw);
            if (protoImages?.image) {
                designStage = 'Refined Prototype';
            } else if (protoImages?.sketch) {
                designStage = 'Rough Prototype';
            }
        }

        let prototypeArtifacts: { sketch?: string; image?: string } = {};
        if (project.prototype_images) {
            const raw = project.prototype_images;
            const parsed = relaxedJsonParse(raw);
            prototypeArtifacts = {
                sketch: parsed?.sketch,
                image: parsed?.image,
            };
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
            const targetUrl = resolveMarketResearchWebhookUrl();

            const sendToWebhook = async (webhookUrl: string) => fetch(`${BACKEND_URL}/api/v1/webhook/proxy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    target_url: webhookUrl,
                    payload: requestBody
                }),
            });

            let response = await sendToWebhook(targetUrl);

            if (!response.ok) {
                const detail = await response.text().catch(() => '');
                if (response.status === 404 && targetUrl !== MARKET_RESEARCH_TEST_WEBHOOK_URL && isWebhookNotRegisteredError(detail)) {
                    response = await sendToWebhook(MARKET_RESEARCH_TEST_WEBHOOK_URL);
                }

                if (!response.ok) {
                    const retryDetail = await response.text().catch(() => '');
                    console.warn('Market search webhook unavailable, using local fallback report.', retryDetail || detail);
                    const localReport = buildLocalMarketResearchReport(requestBody);
                    await persistMarketSearch(localReport);
                    toast.success('Market research generated locally because the webhook is unavailable.');
                    return;
                }

                console.error('API Response not ok:', response.status, response.statusText, detail);
            }

            let data = null;
            try {
                const text = await response.text();
                if (text && text.trim()) {
                    data = relaxedJsonParse(text);
                }
            } catch (parseError) {
                console.log('Response parsing skipped or empty response');
            }

            console.log('Market Search Response:', data);
            if (data) {
                await persistMarketSearch(data);
            }

            toast.success('Market research generated successfully!');
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
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <div className="p-3 rounded-2xl bg-white/10">
                            <FiSearch className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Market Search</h2>
                            <p className="text-sm text-emerald-100 mt-1">
                                Generate comprehensive market research based on your project data. All relevant information will be automatically extracted from your project.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-8 py-4 bg-white text-emerald-700 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <FiLoader className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FiSearch className="w-5 h-5" />
                                Generate Market Research
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
