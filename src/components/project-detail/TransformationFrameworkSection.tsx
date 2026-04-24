import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Target, Loader2 } from 'lucide-react';
import type { Project } from '@/types/project';
import { TransformationFrameworkReportViewer } from './TransformationFrameworkReportViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TransformationFrameworkSectionProps {
    project: Project;
    transformationFrameworkData: any;
    setTransformationFrameworkData: (data: any) => void;
    onRefreshProject?: () => void;
    onSaveData?: (updatedData: any) => Promise<void>;
}

export const TransformationFrameworkSection = ({
    project,
    transformationFrameworkData,
    setTransformationFrameworkData,
    onRefreshProject,
    onSaveData,
}: TransformationFrameworkSectionProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    // Check if data exists - handle various data structures
    const hasData = transformationFrameworkData && (
        transformationFrameworkData.content ||
        transformationFrameworkData.irrationalityClusters ||
        transformationFrameworkData.projectContext ||
        (typeof transformationFrameworkData === 'object' && Object.keys(transformationFrameworkData).length > 0)
    );

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const requestBody = {
                project_id: project.id,
            };

            const BACKEND_URL = (import.meta as any).env?.VITE_PPT_API_URL || 'http://localhost:8000';
            const targetUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/Transformation_Framework';

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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Try to parse response
            try {
                const text = await response.text();
                if (text && text.trim()) {
                    JSON.parse(text); // Just validate, we'll get data from refresh
                }
            } catch (parseError) {
                // Response parsing skipped or empty response
            }

            toast.success('Transformation Framework generated successfully!');

            // Refresh project data to get the latest from Supabase
            if (onRefreshProject) {
                setTimeout(() => onRefreshProject(), 2000);
            }
        } catch (error) {
            toast.error('Failed to generate transformation framework. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateNew = () => {
        setTransformationFrameworkData(null);
    };

    // Show report viewer if data exists
    if (hasData) {
        return (
            <Card className="bg-white border border-gray-200 shadow-none rounded-xl overflow-hidden">
                <CardContent className="p-6">
                    <TransformationFrameworkReportViewer
                        data={transformationFrameworkData}
                        onGenerateNew={handleGenerateNew}
                        projectId={project.id}
                        onSave={onSaveData}
                    />
                </CardContent>
            </Card>
        );
    }

    // Show generate button only
    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="bg-white border border-gray-200 shadow-none rounded-xl overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 border border-gray-100 flex items-center justify-center">
                            <Target className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-medium text-gray-900">Transformation Framework</CardTitle>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                                Psychological transformation insights
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8">
                    <div className="space-y-6">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Generate psychological transformation insights that bridge behavior patterns to actionable outcomes.
                            This framework identifies irrationality clusters and provides outcome-driven solutions.
                        </p>

                        <div className="flex justify-end">
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                size="lg"
                                className="bg-primary text-white hover:bg-primary/90"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Target className="mr-2 h-4 w-4" />
                                        Generate Framework
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
