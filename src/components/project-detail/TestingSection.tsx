import { Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { FiActivity, FiCheck, FiAlertCircle } from 'react-icons/fi';
import type { Project } from '@/types/project';
import { TestingReportViewer } from './TestingReportViewer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

            const BACKEND_URL = (import.meta as any).env?.VITE_PPT_API_URL || 'http://localhost:8000';
            const targetUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/testing';

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

    const DataCard = ({ title, content, isEmpty }: { title: string; content: React.ReactNode; isEmpty?: boolean }) => null;

    // Show report viewer if data exists
    if (hasData) {
        return (
            <TestingReportViewer
                data={testingData}
                onGenerateNew={handleGenerateNew}
                projectId={project.id}
            />
        );
    }

    // Show form if no data
    return (
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
            <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight text-gray-900">
                    <FiActivity className="size-5 shrink-0 text-gray-400" />
                    Testing
                </CardTitle>
                <CardDescription className="text-xs uppercase tracking-wide text-gray-500">
                    Generate comprehensive testing scenarios
                </CardDescription>
            </CardHeader>
            
            <CardContent className="flex flex-col gap-8 px-6 pb-6 pt-6">
                {/* User Input Section */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-medium text-gray-900">Your Input</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="productName" className="text-sm font-medium text-gray-900">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="productName"
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Enter your product name..."
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="specificFocus" className="text-sm font-medium text-gray-900">
                        Specific Focus Areas <span className="text-xs font-normal text-gray-500">(Optional)</span>
                      </label>
                      <Textarea
                        id="specificFocus"
                        value={specificFocus}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSpecificFocus(e.target.value)}
                        placeholder="Any specific concerns, edge cases, or areas to focus on during testing..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-Populated Data Preview */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Auto-Populated from Project Data</h3>
                    <p className="mt-1 text-xs text-gray-500">(Read-only)</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Card className="border border-gray-200 bg-gray-50 shadow-none">
                      <CardContent className="flex flex-col gap-2 px-4 py-3">
                        <div className="flex items-start gap-2">
                          {autoPopulatedData.problemStatement ? (
                            <FiCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
                          ) : (
                            <FiAlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                          )}
                          <h4 className="text-xs font-medium text-gray-700">Problem Statement</h4>
                        </div>
                        <p className="line-clamp-3 text-xs text-gray-600">
                          {autoPopulatedData.problemStatement || <span className="italic text-gray-500">No data available</span>}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-gray-50 shadow-none">
                      <CardContent className="flex flex-col gap-2 px-4 py-3">
                        <div className="flex items-start gap-2">
                          {autoPopulatedData.targetUsers ? (
                            <FiCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
                          ) : (
                            <FiAlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                          )}
                          <h4 className="text-xs font-medium text-gray-700">Target Users</h4>
                        </div>
                        <p className="line-clamp-3 text-xs text-gray-600">
                          {autoPopulatedData.targetUsers || <span className="italic text-gray-500">No data available</span>}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-gray-50 shadow-none">
                      <CardContent className="flex flex-col gap-2 px-4 py-3">
                        <div className="flex items-start gap-2">
                          {autoPopulatedData.keyFeatures.length > 0 ? (
                            <FiCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
                          ) : (
                            <FiAlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                          )}
                          <h4 className="text-xs font-medium text-gray-700">Key Features</h4>
                        </div>
                        {autoPopulatedData.keyFeatures.length > 0 ? (
                          <ul className="flex flex-col gap-1">
                            {autoPopulatedData.keyFeatures.slice(0, 3).map((f, i) => (
                              <li key={i} className="line-clamp-1 text-xs text-gray-600">• {f}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs italic text-gray-500">No data available</span>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-gray-50 shadow-none">
                      <CardContent className="flex flex-col gap-2 px-4 py-3">
                        <div className="flex items-start gap-2">
                          {autoPopulatedData.userScenarios.length > 0 ? (
                            <FiCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
                          ) : (
                            <FiAlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                          )}
                          <h4 className="text-xs font-medium text-gray-700">User Scenarios</h4>
                        </div>
                        {autoPopulatedData.userScenarios.length > 0 ? (
                          <ul className="flex flex-col gap-1">
                            {autoPopulatedData.userScenarios.slice(0, 3).map((s, i) => (
                              <li key={i} className="line-clamp-1 text-xs text-gray-600">• {s}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs italic text-gray-500">No data available</span>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-gray-50 shadow-none">
                      <CardContent className="flex flex-col gap-2 px-4 py-3">
                        <div className="flex items-start gap-2">
                          <FiCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
                          <h4 className="text-xs font-medium text-gray-700">Design Stage</h4>
                        </div>
                        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${autoPopulatedData.designStage === 'Refined Prototype'
                          ? 'bg-green-100 text-green-700'
                          : autoPopulatedData.designStage === 'Rough Prototype'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                          }`}>
                          {autoPopulatedData.designStage}
                        </span>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 bg-gray-50 shadow-none">
                      <CardContent className="flex flex-col gap-2 px-4 py-3">
                        <div className="flex items-start gap-2">
                          {autoPopulatedData.prototypeArtifacts.sketch || autoPopulatedData.prototypeArtifacts.image ? (
                            <FiCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
                          ) : (
                            <FiAlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                          )}
                          <h4 className="text-xs font-medium text-gray-700">Prototype Artifacts</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {autoPopulatedData.prototypeArtifacts.sketch && (
                            <span className="rounded-md bg-purple-100 px-2 py-1 text-xs text-purple-700">Sketch ✓</span>
                          )}
                          {autoPopulatedData.prototypeArtifacts.image && (
                            <span className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-700">Image ✓</span>
                          )}
                          {!autoPopulatedData.prototypeArtifacts.sketch && !autoPopulatedData.prototypeArtifacts.image && (
                            <span className="text-xs italic text-gray-500">None generated yet</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {autoPopulatedData.featureDescriptions.length > 0 && (
                    <Card className="border border-gray-200 bg-gray-50 shadow-none">
                      <CardContent className="flex flex-col gap-3 px-4 py-3">
                        <h4 className="text-xs font-medium text-gray-700">Feature Descriptions</h4>
                        <ul className="flex flex-col gap-2">
                          {autoPopulatedData.featureDescriptions.map((desc, i) => (
                            <li key={i} className="text-xs text-gray-600">• {desc}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="flex justify-start">
                    <Button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating || !productName.trim()}
                    >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          'Generate Testing Scenarios'
                        )}
                    </Button>
                </div>
              </CardContent>
            </Card>
    );
};
