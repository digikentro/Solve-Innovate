import React, { useState } from 'react';
import { HorizontalModal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

interface AsIsMapModalProps {
    open: boolean;
    onClose: () => void;
    asIsMapData: any | null;
    project: any;
    setAsIsMapPrompt: (val: string) => void;
    getAsIsMapContent: (asIsMapData: any, projectAsIsMapData?: any) => any;
}

// Helper function to extract AS-IS-MAP content data
export const getAsIsMapContent = (asIsMapData: any, projectAsIsMapData?: any) => {
    // Use current state first, then fall back to project as_is_map_data column
    const dataToUse = asIsMapData || projectAsIsMapData?.content;
    if (!dataToUse) return null;

    // If it's a JSON string, try parsing it (including extracting JSON inside code fences)
    if (typeof dataToUse === 'string') {
        const raw = dataToUse.trim();

        // Try to extract JSON from fenced code blocks like ```json ... ``` or ``` ... ```
        const fencedMatch = raw.match(/```(?:json)?\n([\s\S]*?)\n```/i);
        const possibleJson = fencedMatch ? fencedMatch[1] : raw;

        // Also handle leading/trailing backticks or stray characters
        const cleaned = possibleJson
            .replace(/^```(?:json)?/i, '')
            .replace(/```$/i, '')
            .trim();

        try {
            const parsed = JSON.parse(cleaned);
            // recurse once with parsed
            return (
                parsed?.[0]?.message?.content ||
                parsed?.message?.content ||
                parsed?.content ||
                parsed?.data ||
                parsed?.result ||
                parsed?.response ||
                parsed
            );
        } catch {
            // Not valid JSON; sometimes providers return a JSON-looking string but with single quotes -> try a lenient fix
            try {
                const lenient = cleaned
                    .replace(/\r\n/g, '\n')
                    .replace(/\n/g, '\n')
                    .replace(/\t/g, '\t')
                    // replace single quotes around keys/strings carefully (basic heuristic)
                    .replace(/([,{\s])'([^']+)'\s*:/g, '$1"$2":')
                    .replace(/:\s*'([^']*)'/g, ': "$1"');
                const parsed2 = JSON.parse(lenient);
                return (
                    parsed2?.[0]?.message?.content ||
                    parsed2?.message?.content ||
                    parsed2?.content ||
                    parsed2?.data ||
                    parsed2?.result ||
                    parsed2?.response ||
                    parsed2
                );
            } catch {
                // Non-JSON string, return as-is (will be rendered in a pre block)
                return dataToUse;
            }
        }
    }

    // Common shapes returned by different services
    const result = (
        (dataToUse as any)?.[0]?.message?.content ||
        (dataToUse as any)?.message?.content ||
        (dataToUse as any)?.content ||
        (dataToUse as any)?.data ||
        (dataToUse as any)?.result ||
        (dataToUse as any)?.response ||
        dataToUse
    );
    console.log('Extracted content result:', result);
    return result;
};

// AS-IS Map generation function
export const generateAsIsMap = async (prompt: string, projectId: string) => {
    if (!prompt.trim()) {
        throw new Error('Please enter a prompt for the As is Map generation.');
    }

    if (!projectId) {
        throw new Error('Project ID not found. Please try again.');
    }

    const response = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/Asismap', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            prompt: prompt,
            project_id: projectId
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
};

// AS-IS Map form component
export const AsIsMapForm: React.FC<{
    projectId: string;
    prompt: string;
    onPromptChange: (prompt: string) => void;
    onGenerate: (data: any) => void;
    onGeneratingChange: (isGenerating: boolean) => void;
    isGenerating?: boolean;
}> = ({ projectId, prompt, onPromptChange, onGenerate, onGeneratingChange, isGenerating = false }) => {

    const handleGenerate = async () => {
        onGeneratingChange(true);
        try {
            const data = await generateAsIsMap(prompt, projectId);
            onGenerate(data);
            onPromptChange(''); // Clear the prompt after successful generation
            toast.success('AS-IS Map generated successfully! The data will be automatically saved to your project.');
        } catch (error) {
            console.error('Error generating As is Map:', error);
            if (error instanceof Error) {
                toast.error(`Failed to generate As is Map: ${error.message}`);
            } else {
                toast.error('Failed to generate As is Map. Please try again.');
            }
        } finally {
            onGeneratingChange(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="asIsMapPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                    AS-IS Map Prompt
                </label>
                <textarea
                    id="asIsMapPrompt"
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder="Enter your prompt here..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
            </div>
            <div className="flex justify-end">
                <button
                    className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                >
                    {isGenerating ? 'Generating...' : 'Generate AS-IS Map'}
                </button>
            </div>
        </div>
    );
};

const AsIsMapModal: React.FC<AsIsMapModalProps> = ({
    open,
    onClose,
    asIsMapData,
    project,
    setAsIsMapPrompt,
    getAsIsMapContent,
}) => {
    return (
        <HorizontalModal open={open} onClose={onClose}>
            <div className="p-6 no-scrollbar">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">AS-IS Map Analysis</h2>
                        {project?.as_is_map_data?.generated_at && (
                            <p className="text-sm text-gray-500 mt-1">
                                Generated on:{' '}
                                {new Date(
                                    project.as_is_map_data.generated_at
                                ).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                onClose();
                                const _content = getAsIsMapContent(asIsMapData, project?.as_is_map_data);
                                setAsIsMapPrompt(_content?.['HMW STATEMENT ANALYSIS']?.HMW || '');
                            }}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Content */}
                {!asIsMapData && !project?.as_is_map_data?.content ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No AS-IS Map data available</p>
                        <p className="text-sm mt-2">Please generate an AS-IS Map first</p>
                    </div>
                ) : (
                    <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-4 no-scrollbar">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">

                            {(() => {
                                const content = getAsIsMapContent(asIsMapData, project?.as_is_map_data);
                                console.log('Modal rendering with content:', content);

                                if (!content) {
                                    console.log('No content available for modal');
                                    return (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No AS-IS Map data available</p>
                                            <p className="text-sm">Debug: project.as_is_map_data = {JSON.stringify(project?.as_is_map_data)}</p>
                                        </div>
                                    );
                                }

                                // If content is a string, display it formatted
                                if (typeof content === 'string') {
                                    return (
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{content}</div>
                                        </div>
                                    );
                                }

                                // If content is an object, display it in a simple, clean way
                                if (typeof content === 'object' && content !== null) {
                                    return (
                                        <div className="space-y-6">
                                            {/* HMW Statement Analysis */}
                                            {content['HMW STATEMENT ANALYSIS'] && (
                                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h5 className="font-semibold text-blue-800 mb-2">Key Question</h5>
                                                            <p className="text-gray-700 leading-relaxed">{content['HMW STATEMENT ANALYSIS'].HMW}</p>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-blue-800 mb-2">Target Users</h5>
                                                            <p className="text-gray-700 leading-relaxed">{content['HMW STATEMENT ANALYSIS']['Target Users']}</p>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-blue-800 mb-2">Core Need</h5>
                                                            <p className="text-gray-700 leading-relaxed">{content['HMW STATEMENT ANALYSIS']['Core Need']}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AS-IS Map: Complete User Journey */}
                                            {content['AS-IS-MAP: COMPLETE USER JOURNEY'] && (
                                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 text-xl border-b border-gray-200 pb-3">
                                                        Current Process Stages
                                                    </h4>
                                                    <div className="space-y-6">
                                                        {Object.entries(content['AS-IS-MAP: COMPLETE USER JOURNEY']).map(([stageKey, stageData]: [string, any]) => (
                                                            <div key={stageKey} className="border-l-4 border-green-200 pl-4">
                                                                <h5 className="font-semibold text-green-800 text-lg mb-3">
                                                                    {stageKey.replace(/_/g, ' ')}
                                                                </h5>
                                                                <div className="space-y-3">
                                                                    {Object.entries(stageData).filter(([key]) => key.startsWith('Step')).map(([stepKey, stepValue]: [string, unknown]) => (
                                                                        <div key={stepKey} className="flex items-start gap-3">
                                                                            <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                                                                {stepKey.split(' ')[1]}
                                                                            </span>
                                                                            <div className="flex-1 bg-gray-50 p-3 rounded border border-gray-200">
                                                                                <p className="text-gray-700 leading-relaxed">{String(stepValue)}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* MECE Validation */}
                                            {content['MECE VALIDATION'] && (
                                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 text-xl border-b border-gray-200 pb-3">
                                                        MECE Validation
                                                    </h4>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <h5 className="font-semibold text-indigo-800 mb-2">Mutually Exclusive Check</h5>
                                                            <p className="text-gray-700 leading-relaxed">{content['MECE VALIDATION']['Mutually Exclusive Check']}</p>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-indigo-800 mb-2">Collectively Exhaustive Check</h5>
                                                            <p className="text-gray-700 leading-relaxed">{content['MECE VALIDATION']['Collectively Exhaustive Check']}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pain Point Analysis */}
                                            {content['PAIN POINT ANALYSIS'] && (
                                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 text-xl border-b border-gray-200 pb-3">
                                                        Pain Point Analysis
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {Object.entries(content['PAIN POINT ANALYSIS']).map(([stepKey, painInfo]: [string, any]) => {
                                                            const isString = typeof painInfo === 'string';
                                                            const painLevelFromString = isString ? (painInfo.match(/Pain\s*Level\s*(\d+)/i)?.[1] || null) : null;
                                                            const painLevel = !isString ? painInfo?.Pain_Level : painLevelFromString;
                                                            const description = !isString ? painInfo?.Description : painInfo;
                                                            return (
                                                                <div key={stepKey} className="bg-red-50 p-4 rounded-lg border border-red-200">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="font-semibold text-red-800">{stepKey.replace(/_/g, ' ')}</span>
                                                                        {painLevel && (
                                                                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                                                                Pain Level: {painLevel}/10
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-gray-700 leading-relaxed">{String(description)}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pareto Prioritization */}
                                            {content['PARETO PRIORITIZATION (80/20 ANALYSIS)'] && (
                                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 text-xl border-b border-gray-200 pb-3">
                                                        Priority Bottlenecks (80/20 Analysis)
                                                    </h4>
                                                    <div className="space-y-6">
                                                        {content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #1'] && (
                                                            <div className="bg-purple-50 p-5 rounded-lg border border-purple-200">
                                                                <h5 className="font-bold text-purple-800 mb-3 text-lg">🔥 Top Priority Bottleneck #1</h5>
                                                                <div className="grid md:grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <span className="font-semibold text-purple-700">Step:</span>
                                                                            <p className="text-purple-700 text-sm mt-1">{content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #1'].Step}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-semibold text-purple-700">Pain Level:</span>
                                                                            <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                                                                                {content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #1']['Pain Level']}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-semibold text-purple-700">Impact Scope:</span>
                                                                            <p className="text-purple-700 text-sm mt-1">{content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #1']['Impact Scope']}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <span className="font-semibold text-purple-700">Hypothesis:</span>
                                                                            <p className="text-purple-700 text-sm mt-1">{content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #1']['Hypothesis for Exploration']}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-4 p-3 bg-purple-100 rounded border border-purple-200">
                                                                    <h6 className="font-semibold text-purple-800 mb-2">Why This Creates 80% Impact</h6>
                                                                    <p className="text-purple-700 text-sm">{content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #1']['Why This Creates 80% Impact']}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #2'] && (
                                                            <div className="bg-purple-50 p-5 rounded-lg border border-purple-200">
                                                                <h5 className="font-bold text-purple-800 mb-3 text-lg">⚡ Top Priority Bottleneck #2</h5>
                                                                <div className="grid md:grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <span className="font-semibold text-purple-700">Step:</span>
                                                                            <p className="text-purple-700 text-sm mt-1">{content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #2'].Step}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-semibold text-purple-700">Pain Level:</span>
                                                                            <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                                                                                {content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #2']['Pain Level']}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-semibold text-purple-700">Impact Scope:</span>
                                                                            <p className="text-purple-700 text-sm mt-1">{content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #2']['Impact Scope']}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <span className="font-semibold text-purple-700">Hypothesis:</span>
                                                                            <p className="text-purple-700 text-sm mt-1">{content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #2']['Hypothesis for Exploration']}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-4 p-3 bg-purple-100 rounded border border-purple-200">
                                                                    <h6 className="font-semibold text-purple-800 mb-2">Why This Creates 80% Impact</h6>
                                                                    <p className="text-purple-700 text-sm">{content['PARETO PRIORITIZATION (80/20 ANALYSIS)']['TOP PRIORITY BOTTLENECK #2']['Why This Creates 80% Impact']}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Prioritization Rationale */}
                                            {content['PRIORITIZATION RATIONALE'] && (
                                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 text-xl border-b border-gray-200 pb-3">
                                                        Prioritization Rationale
                                                    </h4>
                                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <h5 className="font-semibold text-amber-800 mb-2">Methodology</h5>
                                                            <p className="text-gray-700 leading-relaxed">{content['PRIORITIZATION RATIONALE'].Methodology}</p>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-amber-800 mb-2">Confidence Level</h5>
                                                            <p className="text-gray-700 leading-relaxed">{content['PRIORITIZATION RATIONALE']['Confidence Level']}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-semibold text-amber-800 mb-2">Data Sources</h5>
                                                        <ul className="text-gray-700 text-sm space-y-1">
                                                            {(() => {
                                                                const toArray = (val: any) => {
                                                                    if (Array.isArray(val)) return val;
                                                                    if (typeof val === 'string') {
                                                                        return val
                                                                            .split(/\n|,|;|•|-|\u2022/g)
                                                                            .map(s => s.trim())
                                                                            .filter(Boolean);
                                                                    }
                                                                    if (val && typeof val === 'object') return Object.values(val);
                                                                    return [] as any[];
                                                                };
                                                                const rawSources = content['PRIORITIZATION RATIONALE']['Data Sources'];
                                                                const sources = toArray(rawSources);
                                                                return sources.map((source: any, index: number) => {
                                                                    const isString = typeof source === 'string';
                                                                    const title = isString ? source : (source?.title || source?.name || source?.Source || 'Untitled');
                                                                    const url = isString ? undefined : (source?.url || source?.URL || source?.link);
                                                                    return (
                                                                        <li key={index} className="flex items-start gap-2">
                                                                            <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                            {url ? (
                                                                                <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-700 hover:text-blue-900">
                                                                                    {title}
                                                                                </a>
                                                                            ) : (
                                                                                <span>{title}</span>
                                                                            )}
                                                                        </li>
                                                                    );
                                                                });
                                                            })()}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Exploration Recommendations */}
                                            {content['EXPLORATION RECOMMENDATIONS'] && (
                                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 text-xl border-b border-gray-200 pb-3">
                                                        Exploration Recommendations
                                                    </h4>
                                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <h5 className="font-semibold text-yellow-800 mb-2">Primary Focus</h5>
                                                            <p className="text-gray-700 leading-relaxed">{content['EXPLORATION RECOMMENDATIONS']['Primary Focus']}</p>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-yellow-800 mb-2">Timeline</h5>
                                                            <p className="text-gray-700 leading-relaxed">{content['EXPLORATION RECOMMENDATIONS'].Timeline}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <h5 className="font-semibold text-yellow-800 mb-2">Research Methods</h5>
                                                            <ul className="text-gray-700 text-sm space-y-1">
                                                                {(() => {
                                                                    const toArray = (val: any) => {
                                                                        if (Array.isArray(val)) return val;
                                                                        if (typeof val === 'string') {
                                                                            return val
                                                                                .split(/\n|,|;|•|-|\u2022/g)
                                                                                .map(s => s.trim())
                                                                                .filter(Boolean);
                                                                        }
                                                                        if (val && typeof val === 'object') return Object.values(val);
                                                                        return [] as any[];
                                                                    };
                                                                    const methods = toArray(content['EXPLORATION RECOMMENDATIONS']['Research Methods']);
                                                                    return methods.map((method: any, index: number) => (
                                                                        <li key={index} className="flex items-start gap-2">
                                                                            <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                            {String(method)}
                                                                        </li>
                                                                    ));
                                                                })()}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-yellow-800 mb-2">Success Metrics</h5>
                                                            <ul className="text-gray-700 text-sm space-y-1">
                                                                {(() => {
                                                                    const toArray = (val: any) => {
                                                                        if (Array.isArray(val)) return val;
                                                                        if (typeof val === 'string') {
                                                                            return val
                                                                                .split(/\n|,|;|•|-|\u2022/g)
                                                                                .map(s => s.trim())
                                                                                .filter(Boolean);
                                                                        }
                                                                        if (val && typeof val === 'object') return Object.values(val);
                                                                        return [] as any[];
                                                                    };
                                                                    const metrics = toArray(content['EXPLORATION RECOMMENDATIONS']['Success Metrics']);
                                                                    return metrics.map((metric: any, index: number) => (
                                                                        <li key={index} className="flex items-start gap-2">
                                                                            <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                            {String(metric)}
                                                                        </li>
                                                                    ));
                                                                })()}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Credible Sources */}
                                            {content['CREDIBLE SOURCES'] && (
                                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                                    <h4 className="font-bold text-gray-800 mb-4 text-xl border-b border-gray-200 pb-3">
                                                        Credible Sources
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {content['CREDIBLE SOURCES'].map((source: any, index: number) => {
                                                            const isString = typeof source === 'string';
                                                            const title = isString ? source : (source?.Source || source?.title || source?.name || 'Untitled');
                                                            const url = isString ? undefined : (source?.URL || source?.url || source?.link);
                                                            const relevance = isString ? undefined : (source?.Relevance || source?.relevance);
                                                            return (
                                                                <div key={index} className="border-l-4 border-gray-200 pl-4">
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1">
                                                                            <h5 className="font-semibold text-gray-800 mb-1">{title}</h5>
                                                                            {url && (
                                                                                <a
                                                                                    href={url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                                                                                >
                                                                                    {url}
                                                                                </a>
                                                                            )}
                                                                            {relevance && (
                                                                                <p className="text-gray-600 text-sm mt-1">{relevance}</p>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-gray-400 text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                                                                            Source {index + 1}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                // Final fallback
                                return (
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <pre className="text-xs text-gray-700 overflow-auto max-h-96">
                                            {JSON.stringify(content, null, 2)}
                                        </pre>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </HorizontalModal>
    );
};

export default AsIsMapModal;
