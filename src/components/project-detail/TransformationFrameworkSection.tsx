import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiTarget, FiLoader } from 'react-icons/fi';
import type { Project } from '@/types/project';
import { TransformationFrameworkReportViewer } from './TransformationFrameworkReportViewer';

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

            const response = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/Transformation_Framework', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestBody),
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
            <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-fadeIn">
                <TransformationFrameworkReportViewer
                    data={transformationFrameworkData}
                    onGenerateNew={handleGenerateNew}
                    projectId={project.id}
                    onSave={onSaveData}
                />
            </div>
        );
    }

    // Show generate button only
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl shadow-lg p-8">
                <div className="flex items-start gap-4">
                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
                        <FiTarget className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold">Transformation Framework</h2>
                        <p className="text-indigo-100 mt-2 text-lg">
                            Generate psychological transformation insights that bridge behavior patterns to actionable outcomes.
                            This framework identifies irrationality clusters and provides outcome-driven solutions.
                        </p>
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100">
                        <FiTarget className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Generate Transformation Framework
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Analyze irrationality clusters and psychological patterns to create outcome-driven transformation insights for your project.
                        </p>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`
                            inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg
                            transition-all duration-200 shadow-lg
                            ${isGenerating
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:shadow-xl transform hover:-translate-y-0.5'
                            }
                        `}
                    >
                        {isGenerating ? (
                            <>
                                <FiLoader className="w-5 h-5 animate-spin" />
                                Generating Framework...
                            </>
                        ) : (
                            <>
                                <FiTarget className="w-5 h-5" />
                                Generate Transformation Framework
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
