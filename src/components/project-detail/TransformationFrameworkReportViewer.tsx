import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TransformationFrameworkReportViewerProps {
    data: any;
    onGenerateNew?: () => void;
    projectId?: string;
    onSave?: (updatedData: any) => Promise<void>;
}

export const TransformationFrameworkReportViewer = ({ data, onGenerateNew, projectId, onSave }: TransformationFrameworkReportViewerProps) => {
    const [expandedClusters, setExpandedClusters] = useState<{ [key: number]: boolean }>({});
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedData, setEditedData] = useState<any>(null);
    const [originalData, setOriginalData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [errorText, setErrorText] = useState('');

    const parsedData = typeof data === 'string' ? (() => {
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    })() : data;

    const reportData = isEditMode ? editedData : (parsedData?.content || parsedData);

    const handleEditToggle = () => {
        if (!isEditMode) {
            const dataToEdit = parsedData?.content || parsedData;
            setOriginalData(structuredClone(dataToEdit));
            setEditedData(structuredClone(dataToEdit));
            setIsEditMode(true);
        }
    };

    const handleCancel = () => {
        setShowCancelDialog(true);
    };

    const confirmCancel = () => {
        setEditedData(null);
        setOriginalData(null);
        setIsEditMode(false);
        setShowCancelDialog(false);
    };

    const handleSave = () => {
        setShowSaveDialog(true);
    };

    const confirmSave = async () => {
        setShowSaveDialog(false);
        setIsSaving(true);
        try {
            if (onSave) {
                await onSave(editedData);
                setOriginalData(null);
                setIsEditMode(false);
                setShowSuccessMessage(true);
                setTimeout(() => setShowSuccessMessage(false), 3000);
            }
        } catch (error) {
            setErrorText(error instanceof Error ? error.message : 'Failed to save changes');
            setShowErrorMessage(true);
            setTimeout(() => setShowErrorMessage(false), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    const updateTextAtPath = (path: (string | number)[], value: string) => {
        setEditedData((prev: any) => {
            const cloneObj = (obj: any, p: (string | number)[]): any => {
                if (!p || p.length === 0) return value;
                const head = p[0];
                const rest = p.slice(1);
                if (Array.isArray(obj)) {
                    const arr = [...obj];
                    arr[head as number] = cloneObj(obj[head as number], rest);
                    return arr;
                } else if (obj !== null && typeof obj === 'object') {
                    return { ...obj, [head]: cloneObj(obj[head], rest) };
                }
                return obj;
            };
            return cloneObj(prev, path);
        });
    };

    const updateArrayItemAtPath = (path: (string | number)[], index: number, value: string) => {
        setEditedData((prev: any) => {
            const fullPath = [...path, index];
            const cloneObj = (obj: any, p: (string | number)[]): any => {
                if (!p || p.length === 0) return value;
                const head = p[0];
                const rest = p.slice(1);
                if (Array.isArray(obj)) {
                    const arr = [...obj];
                    arr[head as number] = cloneObj(obj[head as number], rest);
                    return arr;
                } else if (obj !== null && typeof obj === 'object') {
                    return { ...obj, [head]: cloneObj(obj[head], rest) };
                }
                return obj;
            };
            return cloneObj(prev, fullPath);
        });
    };

    const toggleCluster = (idx: number) => {
        setExpandedClusters(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    if (!reportData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No Transformation Framework data available</p>
            </div>
        );
    }

    const projectContext = reportData.projectContext;
    const irrationalityClusters = reportData.irrationalityClusters || [];
    const outcomeIntegration = reportData.outcomeIntegrationAnalysis;

    return (
        <div className="flex flex-col gap-8 pb-24">
            {/* Messages & Dialogs */}
            {showSuccessMessage && (
                <div className="fixed top-4 right-4 z-50 animate-fadeIn rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-2xl">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-900">✓ Report saved successfully</p>
                </div>
            )}

            {showErrorMessage && (
                <div className="fixed top-4 right-4 z-50 animate-fadeIn rounded-xl border border-red-200 bg-white px-6 py-4 shadow-2xl">
                    <p className="text-xs font-semibold uppercase tracking-widest text-red-600">✗ {errorText}</p>
                </div>
            )}

            {showSaveDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">Save Changes?</h3>
                        <p className="mb-8 text-sm text-gray-600">Confirm permanent updates to the Transformation Framework report data.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowSaveDialog(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-xs font-medium uppercase tracking-widest text-gray-900 hover:bg-gray-50">Go Back</button>
                            <button onClick={confirmSave} disabled={isSaving} className="flex-1 rounded-xl bg-black px-4 py-3 text-xs font-medium uppercase tracking-widest text-white hover:bg-black/90 disabled:opacity-50">{isSaving ? <>
                                <Loader2 className="mr-1.5 inline size-3 animate-spin" /> Saving...
                            </> : 'Save Now'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showCancelDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">Discard Changes?</h3>
                        <p className="mb-8 text-sm text-gray-600">Unsaved modifications will be permanently lost.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowCancelDialog(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-xs font-medium uppercase tracking-widest text-gray-900 hover:bg-gray-50">Keep Editing</button>
                            <button onClick={confirmCancel} className="flex-1 rounded-xl bg-black px-4 py-3 text-xs font-medium uppercase tracking-widest text-white hover:bg-black/90">Discard</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Mode Banner */}
            {isEditMode && (
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-widest text-gray-500">Status</span>
                        <span className="text-sm font-medium text-gray-900">Edit Mode Active — Modification enabled</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="min-w-0 text-left">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                        Transformation Framework
                    </h1>
                    <p className="mt-2 max-w-xl text-base leading-snug text-gray-500">
                        Psychological insight analysis report
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
                    {projectId && onSave && (
                        <>
                            {!isEditMode ? (
                                <button
                                    type="button"
                                    onClick={handleEditToggle}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-900 transition-colors hover:bg-gray-50"
                                >
                                    Edit Report
                                </button>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 disabled:opacity-50"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="rounded-lg bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-black/90 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-1.5 inline size-3 animate-spin" /> Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    {onGenerateNew && (
                        <button
                            type="button"
                            onClick={onGenerateNew}
                            disabled={isEditMode}
                            className="rounded-lg bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Generate New
                        </button>
                    )}
                </div>
            </div>

            {/* Project Context */}
            {projectContext && (
                <section className="rounded-2xl border border-gray-200 bg-white p-8">
                    <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Project Context</h2>
                    <div className="flex flex-col gap-10">
                        {projectContext.prioritizedPainPoint !== undefined && (
                            <div>
                                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Prioritized Pain Point</label>
                                {isEditMode ? (
                                    <textarea
                                        value={reportData.projectContext.prioritizedPainPoint || ''}
                                        onChange={(e) => updateTextAtPath(['projectContext', 'prioritizedPainPoint'], e.target.value)}
                                        className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                                    />
                                ) : (
                                    <p className="border-l border-gray-200 pl-4 text-sm leading-relaxed text-gray-600">{projectContext.prioritizedPainPoint}</p>
                                )}
                            </div>
                        )}
                        {projectContext.targetUserType !== undefined && (
                            <div>
                                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-gray-500">Target User Type</label>
                                {isEditMode ? (
                                    <textarea
                                        value={reportData.projectContext.targetUserType || ''}
                                        onChange={(e) => updateTextAtPath(['projectContext', 'targetUserType'], e.target.value)}
                                        className="min-h-[80px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                                    />
                                ) : (
                                    <p className="border-l border-gray-200 pl-4 text-sm leading-relaxed text-gray-600">{projectContext.targetUserType}</p>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Irrationality Clusters */}
            {irrationalityClusters.length > 0 && (
                <section className="rounded-2xl border border-gray-200 bg-white p-8">
                    <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Irrationality Clusters Analysis</h2>
                    <div className="flex flex-col gap-6">
                        {irrationalityClusters.map((cluster: any, idx: number) => (
                            <div key={idx} className="overflow-hidden rounded-xl border border-gray-200">
                                <button
                                    onClick={() => toggleCluster(idx)}
                                    className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${expandedClusters[idx] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs font-medium uppercase tracking-wide ${expandedClusters[idx] ? 'opacity-70' : 'text-gray-500'}`}>Cluster 0{idx + 1}</span>
                                        <span className="text-sm font-medium">{cluster.irrationality ? `"${cluster.irrationality.substring(0, 60)}${cluster.irrationality.length > 60 ? '...' : ''}"` : 'Irrationality Cluster'}</span>
                                    </div>
                                    <span className="text-xs">{expandedClusters[idx] ? 'CLOSE' : 'EXPAND'}</span>
                                </button>
                                {expandedClusters[idx] && (
                                    <div className="flex flex-col gap-8 bg-white p-8">
                                        {/* Irrationality */}
                                        <div>
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Irrationality</label>
                                            {isEditMode ? (
                                                <textarea
                                                    value={cluster.irrationality || ''}
                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'irrationality'], e.target.value)}
                                                    className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[80px]"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-600 leading-relaxed">{cluster.irrationality}</p>
                                            )}
                                        </div>

                                        {/* Diagnosis */}
                                        {cluster.diagnosis && cluster.diagnosis.length > 0 && (
                                            <div>
                                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Cognitive Biases (Diagnosis)</label>
                                                {isEditMode ? (
                                                    <div className="space-y-2">
                                                        {cluster.diagnosis.map((bias: string, i: number) => (
                                                            <input
                                                                key={i}
                                                                type="text"
                                                                value={bias || ''}
                                                                onChange={(e) => updateArrayItemAtPath(['irrationalityClusters', idx, 'diagnosis'], i, e.target.value)}
                                                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <ul className="space-y-2 border-l border-gray-200 pl-4">
                                                        {cluster.diagnosis.map((bias: string, i: number) => (
                                                            <li key={i} className="text-xs text-gray-600">• {bias}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}

                                        {/* Psychological Need Analysis */}
                                        {cluster.psychologicalNeedAnalysis && (
                                            <div>
                                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Psychological Need Analysis</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {cluster.psychologicalNeedAnalysis.coreNeed !== undefined && (
                                                        <div>
                                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Core Need</span>
                                                            {isEditMode ? (
                                                                <textarea
                                                                    value={cluster.psychologicalNeedAnalysis.coreNeed || ''}
                                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'coreNeed'], e.target.value)}
                                                                    className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]"
                                                                />
                                                            ) : (
                                                                <p className="text-xs text-gray-600 leading-relaxed">{cluster.psychologicalNeedAnalysis.coreNeed}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {cluster.psychologicalNeedAnalysis.biasDrivenMotivation !== undefined && (
                                                        <div>
                                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Bias-Driven Motivation</span>
                                                            {isEditMode ? (
                                                                <textarea
                                                                    value={cluster.psychologicalNeedAnalysis.biasDrivenMotivation || ''}
                                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'biasDrivenMotivation'], e.target.value)}
                                                                    className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]"
                                                                />
                                                            ) : (
                                                                <p className="text-xs text-gray-600 leading-relaxed">{cluster.psychologicalNeedAnalysis.biasDrivenMotivation}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {cluster.psychologicalNeedAnalysis.persistenceFactor !== undefined && (
                                                        <div>
                                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Persistence Factor</span>
                                                            {isEditMode ? (
                                                                <textarea
                                                                    value={cluster.psychologicalNeedAnalysis.persistenceFactor || ''}
                                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'persistenceFactor'], e.target.value)}
                                                                    className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]"
                                                                />
                                                            ) : (
                                                                <p className="text-xs text-gray-600 leading-relaxed">{cluster.psychologicalNeedAnalysis.persistenceFactor}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {cluster.psychologicalNeedAnalysis.painPointConnection !== undefined && (
                                                        <div>
                                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Pain Point Connection</span>
                                                            {isEditMode ? (
                                                                <textarea
                                                                    value={cluster.psychologicalNeedAnalysis.painPointConnection || ''}
                                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'painPointConnection'], e.target.value)}
                                                                    className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]"
                                                                />
                                                            ) : (
                                                                <p className="text-xs text-gray-600 leading-relaxed">{cluster.psychologicalNeedAnalysis.painPointConnection}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Outcome */}
                                        {cluster.outcome !== undefined && (
                                            <div>
                                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Outcome</label>
                                                {isEditMode ? (
                                                    <textarea
                                                        value={cluster.outcome || ''}
                                                        onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcome'], e.target.value)}
                                                        className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[80px]"
                                                    />
                                                ) : (
                                                    <p className="text-sm text-gray-600 leading-relaxed">{cluster.outcome}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Outcome Validation */}
                                        {cluster.outcomeValidation && (
                                            <div>
                                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Outcome Validation</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {cluster.outcomeValidation.smartPsychologyUse !== undefined && (
                                                        <div>
                                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Smart Psychology Use</span>
                                                            {isEditMode ? (
                                                                <textarea
                                                                    value={cluster.outcomeValidation.smartPsychologyUse || ''}
                                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'smartPsychologyUse'], e.target.value)}
                                                                    className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]"
                                                                />
                                                            ) : (
                                                                <p className="text-xs text-gray-600 leading-relaxed">{cluster.outcomeValidation.smartPsychologyUse}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {cluster.outcomeValidation.painPointAlignment !== undefined && (
                                                        <div>
                                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Pain Point Alignment</span>
                                                            {isEditMode ? (
                                                                <textarea
                                                                    value={cluster.outcomeValidation.painPointAlignment || ''}
                                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'painPointAlignment'], e.target.value)}
                                                                    className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]"
                                                                />
                                                            ) : (
                                                                <p className="text-xs text-gray-600 leading-relaxed">{cluster.outcomeValidation.painPointAlignment}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {cluster.outcomeValidation.specificityLevel !== undefined && (
                                                        <div>
                                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Specificity Level</span>
                                                            {isEditMode ? (
                                                                <input
                                                                    type="text"
                                                                    value={cluster.outcomeValidation.specificityLevel || ''}
                                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'specificityLevel'], e.target.value)}
                                                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
                                                                />
                                                            ) : (
                                                                <p className="text-xs text-gray-600 leading-relaxed">{cluster.outcomeValidation.specificityLevel}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {cluster.outcomeValidation.directionFocus !== undefined && (
                                                        <div>
                                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-2">Direction Focus</span>
                                                            {isEditMode ? (
                                                                <textarea
                                                                    value={cluster.outcomeValidation.directionFocus || ''}
                                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'directionFocus'], e.target.value)}
                                                                    className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]"
                                                                />
                                                            ) : (
                                                                <p className="text-xs text-gray-600 leading-relaxed">{cluster.outcomeValidation.directionFocus}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Outcome Integration Analysis */}
            {outcomeIntegration && (
                <section className="rounded-2xl border border-gray-200 bg-white p-8">
                    <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Outcome Integration Analysis</h2>
                    <div className="flex flex-col gap-10">
                        {/* Psychological Pattern Themes */}
                        {outcomeIntegration.psychologicalPatternThemes && outcomeIntegration.psychologicalPatternThemes.length > 0 && (
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Psychological Pattern Themes</label>
                                {isEditMode ? (
                                    <div className="space-y-2">
                                        {outcomeIntegration.psychologicalPatternThemes.map((theme: string, i: number) => (
                                            <textarea
                                                key={i}
                                                value={theme || ''}
                                                onChange={(e) => updateArrayItemAtPath(['outcomeIntegrationAnalysis', 'psychologicalPatternThemes'], i, e.target.value)}
                                                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <ul className="space-y-2 border-l border-gray-200 pl-4">
                                        {outcomeIntegration.psychologicalPatternThemes.map((theme: string, i: number) => (
                                            <li key={i} className="text-xs text-gray-600">• {theme}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Pain Point Solution Coherence */}
                        {outcomeIntegration.painPointSolutionCoherence !== undefined && (
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Pain Point Solution Coherence</label>
                                {isEditMode ? (
                                    <textarea
                                        value={reportData.outcomeIntegrationAnalysis.painPointSolutionCoherence || ''}
                                        onChange={(e) => updateTextAtPath(['outcomeIntegrationAnalysis', 'painPointSolutionCoherence'], e.target.value)}
                                        className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[80px]"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-600 leading-relaxed">{outcomeIntegration.painPointSolutionCoherence}</p>
                                )}
                            </div>
                        )}

                        {/* Innovation Opportunity Spaces */}
                        {outcomeIntegration.innovationOpportunitySpaces && outcomeIntegration.innovationOpportunitySpaces.length > 0 && (
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Innovation Opportunity Spaces</label>
                                {isEditMode ? (
                                    <div className="space-y-2">
                                        {outcomeIntegration.innovationOpportunitySpaces.map((space: string, i: number) => (
                                            <textarea
                                                key={i}
                                                value={space || ''}
                                                onChange={(e) => updateArrayItemAtPath(['outcomeIntegrationAnalysis', 'innovationOpportunitySpaces'], i, e.target.value)}
                                                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[60px]"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <ul className="space-y-2 border-l border-gray-200 pl-4">
                                        {outcomeIntegration.innovationOpportunitySpaces.map((space: string, i: number) => (
                                            <li key={i} className="text-xs text-gray-600">• {space}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Implementation Priority Suggestions */}
                        {outcomeIntegration.implementationPrioritySuggestions !== undefined && (
                            <div>
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block mb-4">Implementation Priority Suggestions</label>
                                {isEditMode ? (
                                    <textarea
                                        value={reportData.outcomeIntegrationAnalysis.implementationPrioritySuggestions || ''}
                                        onChange={(e) => updateTextAtPath(['outcomeIntegrationAnalysis', 'implementationPrioritySuggestions'], e.target.value)}
                                        className="w-full bg-white border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none min-h-[80px]"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-600 leading-relaxed">{outcomeIntegration.implementationPrioritySuggestions}</p>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Fallback: Show raw data if structure doesn't match */}
            {(!projectContext && irrationalityClusters.length === 0 && !outcomeIntegration) && (
                <section className="rounded-2xl border border-gray-200 bg-white p-8">
                    <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Raw Data Structure</h2>
                    <pre className="text-xs text-gray-700 overflow-auto max-h-96 font-mono bg-gray-50 p-4 rounded border border-gray-200">
                        {JSON.stringify(reportData, null, 2)}
                    </pre>
                </section>
            )}

            {/* Report Metadata */}
            {data?.generated_at && (
                <div className="text-xs text-gray-500 text-center pt-4">
                    Report generated on {new Date(data.generated_at).toLocaleString()}
                </div>
            )}
        </div>
    );
};
