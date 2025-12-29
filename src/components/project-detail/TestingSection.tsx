import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { FiActivity, FiCheck, FiAlertCircle } from 'react-icons/fi';
import type { Project } from '@/types/project';
import { TestingReportViewer } from './TestingReportViewer';

interface TestingSectionProps {
    project: Project;
    asIsMapData: any;
    extremeUserData: any;
    deepEmpathyData: any;
    ideaClusteringData: any;
    testingData: any;
    setTestingData: (data: any) => void;
    onRefreshProject?: () => void;
}

export const TestingSection = ({
    project,
    asIsMapData,
    extremeUserData,
    deepEmpathyData,
    ideaClusteringData,
    testingData,
    setTestingData,
    onRefreshProject,
}: TestingSectionProps) => {
    // User input fields
    const [productName, setProductName] = useState('');
    const [specificFocus, setSpecificFocus] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Check if data exists
    const hasData = testingData !== null && testingData !== undefined &&
        (typeof testingData === 'object' && Object.keys(testingData).length > 0);

    // Extract auto-populated data from project
    const autoPopulatedData = useMemo(() => {
        // Problem Statement - from project description or title
        const problemStatement = project.description || project.title || '';

        // Target Users - from As-Is Map or Extreme User data
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

        // Key Features - from Idea Clustering top cluster
        let keyFeatures: string[] = [];
        const ideaContent = ideaClusteringData?.content || ideaClusteringData;
        if (ideaContent?.top_5_clusters?.[0]?.idea_card?.features) {
            keyFeatures = ideaContent.top_5_clusters[0].idea_card.features;
        }

        // User Scenarios - from Deep Empathy or Transformation Framework
        let userScenarios: string[] = [];
        const deepContent = deepEmpathyData?.content || deepEmpathyData;
        if (deepContent?.journey_stages) {
            userScenarios = deepContent.journey_stages
                .slice(0, 3)
                .map((stage: any) => stage.stage_name || stage.description || '')
                .filter(Boolean);
        }

        // Design Stage - computed from prototype status
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

        // Prototype Artifacts - from prototype_images
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

        // Feature Descriptions - from idea card innovations
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
        if (!productName.trim()) {
            toast.error('Please enter a product name');
            return;
        }

        setIsGenerating(true);
        try {
            // Ensure all fields have fallback empty strings
            const requestBody = {
                project_id: project.id,
                product_name: productName.trim(),
                problem_statement: autoPopulatedData.problemStatement || '',
                target_users: autoPopulatedData.targetUsers || '',
                key_features: autoPopulatedData.keyFeatures?.join('\n') || '',
                user_scenarios: autoPopulatedData.userScenarios?.join('\n') || '',
                design_stage: autoPopulatedData.designStage || 'Early Concept',
                prototype_artifacts: JSON.stringify(autoPopulatedData.prototypeArtifacts || {}),
                feature_descriptions: autoPopulatedData.featureDescriptions?.join('\n') || '',
                specific_focus: specificFocus || '',
            };

            console.log('Testing Request Body:', requestBody);

            const response = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/testing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                console.error('API Response not ok:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Try to parse response, but don't fail if empty
            let data = null;
            try {
                const text = await response.text();
                if (text && text.trim()) {
                    data = JSON.parse(text);
                }
            } catch (parseError) {
                console.log('Response parsing skipped or empty response');
            }


            console.log('Testing Response:', data);

            // Store product_name in localStorage for Market Search to use
            localStorage.setItem(`testing_product_name_${project.id}`, productName.trim());

            toast.success('Testing scenarios generated successfully!');

            // Refresh project data to get the latest from Supabase
            if (onRefreshProject) {
                setTimeout(() => onRefreshProject(), 2000);
            }
        } catch (error) {
            console.error('Error generating testing scenarios:', error);
            toast.error('Failed to generate testing scenarios. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateNew = () => {
        setTestingData(null);
    };

    const DataCard = ({ title, content, isEmpty }: { title: string; content: React.ReactNode; isEmpty?: boolean }) => (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
                {isEmpty ? (
                    <FiAlertCircle className="w-4 h-4 text-amber-500" />
                ) : (
                    <FiCheck className="w-4 h-4 text-green-500" />
                )}
                <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
            </div>
            <div className="text-sm text-gray-600">
                {isEmpty ? <span className="italic text-gray-400">No data available</span> : content}
            </div>
        </div>
    );

    // Show report viewer if data exists
    if (hasData) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-fadeIn">
                <TestingReportViewer
                    data={testingData}
                    onGenerateNew={handleGenerateNew}
                    projectId={project.id}
                />
            </div>
        );
    }

    // Show form if no data
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-3xl shadow-lg p-6">
                <div className="flex items-start gap-3">
                    <div className="p-3 rounded-2xl bg-white/10">
                        <FiActivity className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Testing</h2>
                        <p className="text-sm text-cyan-100 mt-1">
                            Generate comprehensive testing scenarios for your prototype. Product details are auto-filled from your project data.
                        </p>
                    </div>
                </div>
            </div>

            {/* User Input Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Input</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-2">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="productName"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Enter your product name..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="specificFocus" className="block text-sm font-medium text-gray-700 mb-2">
                            Specific Focus Areas <span className="text-gray-400">(Optional)</span>
                        </label>
                        <textarea
                            id="specificFocus"
                            value={specificFocus}
                            onChange={(e) => setSpecificFocus(e.target.value)}
                            placeholder="Any specific concerns, edge cases, or areas to focus on during testing..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none transition-all duration-200"
                        />
                    </div>
                </div>
            </div>

            {/* Auto-Populated Data Preview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Auto-Populated from Project Data
                    <span className="text-sm font-normal text-gray-500 ml-2">(Read-only)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DataCard
                        title="Problem Statement"
                        content={<p className="line-clamp-3">{autoPopulatedData.problemStatement}</p>}
                        isEmpty={!autoPopulatedData.problemStatement}
                    />

                    <DataCard
                        title="Target Users"
                        content={<p className="line-clamp-3">{autoPopulatedData.targetUsers}</p>}
                        isEmpty={!autoPopulatedData.targetUsers}
                    />

                    <DataCard
                        title="Key Features"
                        content={
                            <ul className="list-disc list-inside space-y-1">
                                {autoPopulatedData.keyFeatures.slice(0, 5).map((f, i) => (
                                    <li key={i} className="line-clamp-1">{f}</li>
                                ))}
                            </ul>
                        }
                        isEmpty={autoPopulatedData.keyFeatures.length === 0}
                    />

                    <DataCard
                        title="User Scenarios"
                        content={
                            <ul className="list-disc list-inside space-y-1">
                                {autoPopulatedData.userScenarios.map((s, i) => (
                                    <li key={i} className="line-clamp-1">{s}</li>
                                ))}
                            </ul>
                        }
                        isEmpty={autoPopulatedData.userScenarios.length === 0}
                    />

                    <DataCard
                        title="Design Stage"
                        content={
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${autoPopulatedData.designStage === 'Refined Prototype'
                                ? 'bg-green-100 text-green-700'
                                : autoPopulatedData.designStage === 'Rough Prototype'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                {autoPopulatedData.designStage}
                            </span>
                        }
                    />

                    <DataCard
                        title="Prototype Artifacts"
                        content={
                            <div className="flex gap-2">
                                {autoPopulatedData.prototypeArtifacts.sketch && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Sketch ✓</span>
                                )}
                                {autoPopulatedData.prototypeArtifacts.image && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Image ✓</span>
                                )}
                                {!autoPopulatedData.prototypeArtifacts.sketch && !autoPopulatedData.prototypeArtifacts.image && (
                                    <span className="text-gray-400 italic">None generated yet</span>
                                )}
                            </div>
                        }
                    />
                </div>

                {autoPopulatedData.featureDescriptions.length > 0 && (
                    <div className="mt-4">
                        <DataCard
                            title="Feature Descriptions"
                            content={
                                <ul className="space-y-2">
                                    {autoPopulatedData.featureDescriptions.map((desc, i) => (
                                        <li key={i} className="text-sm">{desc}</li>
                                    ))}
                                </ul>
                            }
                        />
                    </div>
                )}
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !productName.trim()}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isGenerating ? 'Generating Testing Scenarios...' : 'Generate Testing Scenarios'}
                </button>
            </div>
        </div>
    );
};
