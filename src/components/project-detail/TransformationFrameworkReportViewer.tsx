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
            const updated = structuredClone(prev);
            let current = updated;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return updated;
        });
    };

    const updateArrayItemAtPath = (path: (string | number)[], index: number, value: string) => {
        setEditedData((prev: any) => {
            const updated = structuredClone(prev);
            let current = updated;
            for (let i = 0; i < path.length; i++) {
                current = current[path[i]];
            }
            current[index] = value;
            return updated;
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
        <div className="space-y-8">
            {/* Confirmation Dialogs */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Save Changes?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to save these changes to the Transformation Framework report?</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowSaveDialog(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSave}
                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCancelDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Discard Changes?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to discard all changes? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowCancelDialog(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Keep Editing
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            {showSuccessMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Changes saved successfully!</span>
                </div>
            )}

            {showErrorMessage && (
                <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{errorText || 'Failed to save changes'}</span>
                </div>
            )}

            {/* Header with Edit and Generate New Buttons */}
            <div className="pb-4 flex items-center justify-between">
                <h1 className="text-3xl font-bold">Transformation Framework Report</h1>
                <div className="flex items-center gap-3">
                    {!isEditMode && projectId && onSave && (
                        <button
                            onClick={handleEditToggle}
                            className="px-6 py-2 text-[0.85rem] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-md"
                        >
                            Edit
                        </button>
                    )}
                    {onGenerateNew && (
                        <button
                            onClick={onGenerateNew}
                            className="px-6 py-2 text-[0.85rem] font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors rounded-md"
                        >
                            Generate New
                        </button>
                    )}
                </div>
            </div>

            {/* Edit Mode Banner */}
            {isEditMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        <span className="text-blue-800 font-medium">Edit Mode - Click on text fields to edit</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-[0.85rem] font-semibold bg-gray-600 text-white hover:bg-gray-700 transition-colors rounded-md"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-[0.85rem] font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors rounded-md"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}

            {/* Project Context */}
            {projectContext && (
                <section className="p-6 bg-gray-50">
                    <h2 className="text-2xl font-bold mb-4 pb-2">Project Context</h2>
                    <div className="space-y-4">
                        {projectContext.prioritizedPainPoint !== undefined && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Prioritized Pain Point</h3>
                                {isEditMode ? (
                                    <textarea
                                        value={reportData.projectContext.prioritizedPainPoint || ''}
                                        onChange={(e) => updateTextAtPath(['projectContext', 'prioritizedPainPoint'], e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-base pl-4">{projectContext.prioritizedPainPoint}</p>
                                )}
                            </div>
                        )}
                        {projectContext.targetUserType !== undefined && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Target User Type</h3>
                                {isEditMode ? (
                                    <textarea
                                        value={reportData.projectContext.targetUserType || ''}
                                        onChange={(e) => updateTextAtPath(['projectContext', 'targetUserType'], e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-base pl-4">{projectContext.targetUserType}</p>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Irrationality Clusters */}
            {irrationalityClusters.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-2xl font-bold mb-4 pb-2">Irrationality Clusters Analysis</h2>
                    {irrationalityClusters.map((cluster: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-6 rounded-xl">
                            <button
                                onClick={() => toggleCluster(idx)}
                                className="w-full text-left mb-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold pr-4">
                                        Cluster {idx + 1}: {cluster.irrationality ? `"${cluster.irrationality.substring(0, 80)}${cluster.irrationality.length > 80 ? '...' : ''}"` : 'Irrationality Cluster'}
                                    </h3>
                                    <span className="text-2xl flex-shrink-0">{expandedClusters[idx] ? '−' : '+'}</span>
                                </div>
                            </button>
                            {expandedClusters[idx] && (
                                <div className="space-y-4 pl-4">
                                    {/* Irrationality */}
                                    <div>
                                        <h4 className="font-bold mb-1">Irrationality</h4>
                                        {isEditMode ? (
                                            <textarea
                                                value={cluster.irrationality || ''}
                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'irrationality'], e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                            />
                                        ) : (
                                            <p className="text-base">{cluster.irrationality}</p>
                                        )}
                                    </div>

                                    {/* Diagnosis */}
                                    {cluster.diagnosis && cluster.diagnosis.length > 0 && (
                                        <div>
                                            <h4 className="font-bold mb-1">Diagnosis (Cognitive Biases)</h4>
                                            {isEditMode ? (
                                                <div className="space-y-2 pl-4">
                                                    {cluster.diagnosis.map((bias: string, i: number) => (
                                                        <input
                                                            key={i}
                                                            value={bias || ''}
                                                            onChange={(e) => updateArrayItemAtPath(['irrationalityClusters', idx, 'diagnosis'], i, e.target.value)}
                                                            className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <ul className="list-disc list-inside space-y-1 pl-4">
                                                    {cluster.diagnosis.map((bias: string, i: number) => (
                                                        <li key={i} className="text-sm">{bias}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    {/* Psychological Need Analysis */}
                                    {cluster.psychologicalNeedAnalysis && (
                                        <div>
                                            <h4 className="font-bold mb-1">Psychological Need Analysis</h4>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {cluster.psychologicalNeedAnalysis.coreNeed !== undefined && (
                                                    <div>
                                                        <span className="font-semibold">Core Need:</span>
                                                        {isEditMode ? (
                                                            <textarea
                                                                value={cluster.psychologicalNeedAnalysis.coreNeed || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'coreNeed'], e.target.value)}
                                                                rows={2}
                                                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                                            />
                                                        ) : (
                                                            <p className="text-sm pl-2">{cluster.psychologicalNeedAnalysis.coreNeed}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.psychologicalNeedAnalysis.biasDrivenMotivation !== undefined && (
                                                    <div>
                                                        <span className="font-semibold">Bias-Driven Motivation:</span>
                                                        {isEditMode ? (
                                                            <textarea
                                                                value={cluster.psychologicalNeedAnalysis.biasDrivenMotivation || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'biasDrivenMotivation'], e.target.value)}
                                                                rows={2}
                                                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                                            />
                                                        ) : (
                                                            <p className="text-sm pl-2">{cluster.psychologicalNeedAnalysis.biasDrivenMotivation}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.psychologicalNeedAnalysis.persistenceFactor !== undefined && (
                                                    <div>
                                                        <span className="font-semibold">Persistence Factor:</span>
                                                        {isEditMode ? (
                                                            <textarea
                                                                value={cluster.psychologicalNeedAnalysis.persistenceFactor || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'persistenceFactor'], e.target.value)}
                                                                rows={2}
                                                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                                            />
                                                        ) : (
                                                            <p className="text-sm pl-2">{cluster.psychologicalNeedAnalysis.persistenceFactor}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.psychologicalNeedAnalysis.painPointConnection !== undefined && (
                                                    <div>
                                                        <span className="font-semibold">Pain Point Connection:</span>
                                                        {isEditMode ? (
                                                            <textarea
                                                                value={cluster.psychologicalNeedAnalysis.painPointConnection || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'painPointConnection'], e.target.value)}
                                                                rows={2}
                                                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                                            />
                                                        ) : (
                                                            <p className="text-sm pl-2">{cluster.psychologicalNeedAnalysis.painPointConnection}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Outcome */}
                                    {cluster.outcome !== undefined && (
                                        <div>
                                            <h4 className="font-bold mb-1">Outcome</h4>
                                            {isEditMode ? (
                                                <textarea
                                                    value={cluster.outcome || ''}
                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcome'], e.target.value)}
                                                    rows={3}
                                                    className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                                />
                                            ) : (
                                                <p className="text-base">{cluster.outcome}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Outcome Validation */}
                                    {cluster.outcomeValidation && (
                                        <div>
                                            <h4 className="font-bold mb-1">Outcome Validation</h4>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {cluster.outcomeValidation.smartPsychologyUse !== undefined && (
                                                    <div>
                                                        <span className="font-semibold">Smart Psychology Use:</span>
                                                        {isEditMode ? (
                                                            <textarea
                                                                value={cluster.outcomeValidation.smartPsychologyUse || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'smartPsychologyUse'], e.target.value)}
                                                                rows={2}
                                                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                                            />
                                                        ) : (
                                                            <p className="text-sm pl-2">{cluster.outcomeValidation.smartPsychologyUse}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.outcomeValidation.painPointAlignment !== undefined && (
                                                    <div>
                                                        <span className="font-semibold">Pain Point Alignment:</span>
                                                        {isEditMode ? (
                                                            <textarea
                                                                value={cluster.outcomeValidation.painPointAlignment || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'painPointAlignment'], e.target.value)}
                                                                rows={2}
                                                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                                            />
                                                        ) : (
                                                            <p className="text-sm pl-2">{cluster.outcomeValidation.painPointAlignment}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.outcomeValidation.specificityLevel !== undefined && (
                                                    <div>
                                                        <span className="font-semibold">Specificity Level:</span>
                                                        {isEditMode ? (
                                                            <input
                                                                value={cluster.outcomeValidation.specificityLevel || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'specificityLevel'], e.target.value)}
                                                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                                            />
                                                        ) : (
                                                            <p className="text-sm pl-2">{cluster.outcomeValidation.specificityLevel}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.outcomeValidation.directionFocus !== undefined && (
                                                    <div>
                                                        <span className="font-semibold">Direction Focus:</span>
                                                        {isEditMode ? (
                                                            <textarea
                                                                value={cluster.outcomeValidation.directionFocus || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'directionFocus'], e.target.value)}
                                                                rows={2}
                                                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                                            />
                                                        ) : (
                                                            <p className="text-sm pl-2">{cluster.outcomeValidation.directionFocus}</p>
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
                </section>
            )}

            {/* Outcome Integration Analysis */}
            {outcomeIntegration && (
                <section className="p-6 bg-gray-50">
                    <h2 className="text-2xl font-bold mb-4 pb-2">Outcome Integration Analysis</h2>
                    <div className="space-y-4">
                        {/* Psychological Pattern Themes */}
                        {outcomeIntegration.psychologicalPatternThemes && outcomeIntegration.psychologicalPatternThemes.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Psychological Pattern Themes</h3>
                                {isEditMode ? (
                                    <div className="space-y-2 pl-4">
                                        {outcomeIntegration.psychologicalPatternThemes.map((theme: string, i: number) => (
                                            <textarea
                                                key={i}
                                                value={theme || ''}
                                                onChange={(e) => updateArrayItemAtPath(['outcomeIntegrationAnalysis', 'psychologicalPatternThemes'], i, e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <ul className="list-disc list-inside space-y-1 pl-4">
                                        {outcomeIntegration.psychologicalPatternThemes.map((theme: string, i: number) => (
                                            <li key={i} className="text-sm">{theme}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Pain Point Solution Coherence */}
                        {outcomeIntegration.painPointSolutionCoherence !== undefined && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Pain Point Solution Coherence</h3>
                                {isEditMode ? (
                                    <textarea
                                        value={reportData.outcomeIntegrationAnalysis.painPointSolutionCoherence || ''}
                                        onChange={(e) => updateTextAtPath(['outcomeIntegrationAnalysis', 'painPointSolutionCoherence'], e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-base pl-4 leading-relaxed">{outcomeIntegration.painPointSolutionCoherence}</p>
                                )}
                            </div>
                        )}

                        {/* Innovation Opportunity Spaces */}
                        {outcomeIntegration.innovationOpportunitySpaces && outcomeIntegration.innovationOpportunitySpaces.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Innovation Opportunity Spaces</h3>
                                {isEditMode ? (
                                    <div className="space-y-2 pl-4">
                                        {outcomeIntegration.innovationOpportunitySpaces.map((space: string, i: number) => (
                                            <textarea
                                                key={i}
                                                value={space || ''}
                                                onChange={(e) => updateArrayItemAtPath(['outcomeIntegrationAnalysis', 'innovationOpportunitySpaces'], i, e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 text-sm border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <ul className="list-disc list-inside space-y-1 pl-4">
                                        {outcomeIntegration.innovationOpportunitySpaces.map((space: string, i: number) => (
                                            <li key={i} className="text-sm">{space}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Implementation Priority Suggestions */}
                        {outcomeIntegration.implementationPrioritySuggestions !== undefined && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Implementation Priority Suggestions</h3>
                                {isEditMode ? (
                                    <textarea
                                        value={reportData.outcomeIntegrationAnalysis.implementationPrioritySuggestions || ''}
                                        onChange={(e) => updateTextAtPath(['outcomeIntegrationAnalysis', 'implementationPrioritySuggestions'], e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-base pl-4 leading-relaxed">{outcomeIntegration.implementationPrioritySuggestions}</p>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Fallback: Show raw data if structure doesn't match */}
            {(!projectContext && irrationalityClusters.length === 0 && !outcomeIntegration) && (
                <section className="p-6 bg-gray-50">
                    <h2 className="text-2xl font-bold mb-4 pb-2">Raw Data Structure</h2>
                    <pre className="text-sm text-gray-700 overflow-auto max-h-96 font-mono">
                        {JSON.stringify(reportData, null, 2)}
                    </pre>
                </section>
            )}

            {/* Report Metadata */}
            {data?.generated_at && (
                <div className="text-sm text-gray-500 text-center pt-4">
                    Report generated on {new Date(data.generated_at).toLocaleString()}
                </div>
            )}
        </div>
    );
};
