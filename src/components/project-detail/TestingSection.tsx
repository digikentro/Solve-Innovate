import { Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { FiActivity, FiCheck, FiAlertCircle } from 'react-icons/fi';
import type { Project } from '@/types/project';
import { TestingReportViewer } from './TestingReportViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
            {/* Header Card */}
            <Card className="bg-white border border-gray-200 shadow-none rounded-xl overflow-hidden">
              <CardHeader className="px-8 py-6 border-b border-gray-100 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-gray-100 flex items-center justify-center">
                    <FiActivity className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-medium text-gray-900">Testing</CardTitle>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Generate comprehensive testing scenarios</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8 space-y-8">
                {/* User Input Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Your Input</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="productName" className="text-sm font-semibold text-gray-900">
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
                    <div className="space-y-2">
                      <label htmlFor="specificFocus" className="text-sm font-semibold text-gray-900">
                        Specific Focus Areas <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                      </label>
                      <textarea
                        id="specificFocus"
                        value={specificFocus}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSpecificFocus(e.target.value)}
                        placeholder="Any specific concerns, edge cases, or areas to focus on during testing..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-Populated Data Preview */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Auto-Populated from Project Data</h3>
                    <p className="text-xs text-muted-foreground mt-1">(Read-only)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-50 border border-gray-200 shadow-none">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2 mb-2">
                          {autoPopulatedData.problemStatement ? (
                            <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <FiAlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          )}
                          <h4 className="text-xs font-semibold text-gray-700">Problem Statement</h4>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-3">
                          {autoPopulatedData.problemStatement || <span className="italic text-muted-foreground">No data available</span>}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50 border border-gray-200 shadow-none">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2 mb-2">
                          {autoPopulatedData.targetUsers ? (
                            <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <FiAlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          )}
                          <h4 className="text-xs font-semibold text-gray-700">Target Users</h4>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-3">
                          {autoPopulatedData.targetUsers || <span className="italic text-muted-foreground">No data available</span>}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50 border border-gray-200 shadow-none">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2 mb-2">
                          {autoPopulatedData.keyFeatures.length > 0 ? (
                            <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <FiAlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          )}
                          <h4 className="text-xs font-semibold text-gray-700">Key Features</h4>
                        </div>
                        {autoPopulatedData.keyFeatures.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {autoPopulatedData.keyFeatures.slice(0, 3).map((f, i) => (
                              <li key={i} className="text-xs text-gray-600 line-clamp-1">{f}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">No data available</span>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50 border border-gray-200 shadow-none">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2 mb-2">
                          {autoPopulatedData.userScenarios.length > 0 ? (
                            <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <FiAlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          )}
                          <h4 className="text-xs font-semibold text-gray-700">User Scenarios</h4>
                        </div>
                        {autoPopulatedData.userScenarios.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {autoPopulatedData.userScenarios.slice(0, 3).map((s, i) => (
                              <li key={i} className="text-xs text-gray-600 line-clamp-1">{s}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">No data available</span>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50 border border-gray-200 shadow-none">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2 mb-2">
                          <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <h4 className="text-xs font-semibold text-gray-700">Design Stage</h4>
                        </div>
                        <span className={`inline-flex text-xs font-medium px-2 py-1 rounded ${autoPopulatedData.designStage === 'Refined Prototype'
                          ? 'bg-green-100 text-green-700'
                          : autoPopulatedData.designStage === 'Rough Prototype'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                          }`}>
                          {autoPopulatedData.designStage}
                        </span>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50 border border-gray-200 shadow-none">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2 mb-2">
                          {autoPopulatedData.prototypeArtifacts.sketch || autoPopulatedData.prototypeArtifacts.image ? (
                            <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <FiAlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          )}
                          <h4 className="text-xs font-semibold text-gray-700">Prototype Artifacts</h4>
                        </div>
                        <div className="flex gap-2">
                          {autoPopulatedData.prototypeArtifacts.sketch && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Sketch ✓</span>
                          )}
                          {autoPopulatedData.prototypeArtifacts.image && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Image ✓</span>
                          )}
                          {!autoPopulatedData.prototypeArtifacts.sketch && !autoPopulatedData.prototypeArtifacts.image && (
                            <span className="text-xs text-muted-foreground italic">None generated yet</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {autoPopulatedData.featureDescriptions.length > 0 && (
                    <Card className="bg-gray-50 border border-gray-200 shadow-none">
                      <CardContent className="pt-4">
                        <h4 className="text-xs font-semibold text-gray-700 mb-3">Feature Descriptions</h4>
                        <ul className="space-y-2">
                          {autoPopulatedData.featureDescriptions.map((desc, i) => (
                            <li key={i} className="text-xs text-gray-600">{desc}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !productName.trim()}
                    size="lg"
                    className="bg-primary text-white hover:bg-primary/90"
                >
                    {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Testing Scenarios'}
                </Button>
            </div>
        </div>
    );
};
