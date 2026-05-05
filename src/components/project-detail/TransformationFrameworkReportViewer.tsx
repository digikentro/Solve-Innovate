import { Loader2, ChevronDown, ChevronRight, Edit, Trash2, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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
        <div className="space-y-6">
            {/* Confirmation Dialogs */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Save Changes?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">Are you sure you want to save these changes to the Transformation Framework report?</p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    onClick={() => setShowSaveDialog(false)}
                                    variant="outline"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showCancelDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Discard Changes?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">Are you sure you want to discard all changes? This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    onClick={() => setShowCancelDialog(false)}
                                    variant="outline"
                                >
                                    Keep Editing
                                </Button>
                                <Button
                                    onClick={confirmCancel}
                                    variant="destructive"
                                >
                                    Discard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Toast Notifications */}
            {showSuccessMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">Changes saved successfully!</span>
                </div>
            )}

            {showErrorMessage && (
                <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-md shadow-lg z-50 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{errorText || 'Failed to save changes'}</span>
                </div>
            )}

            {/* Header with Edit and Generate New Buttons */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Transformation Framework Report</h1>
                <div className="flex items-center gap-3">
                    {!isEditMode && projectId && onSave && (
                        <Button
                            onClick={handleEditToggle}
                            variant="outline"
                            size="sm"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    )}
                    {onGenerateNew && (
                        <Button
                            onClick={onGenerateNew}
                            variant="default"
                            size="sm"
                        >
                            Generate New
                        </Button>
                    )}
                </div>
            </div>

            {/* Edit Mode Banner */}
            {isEditMode && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Edit className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-800 font-medium">Edit Mode - Click on text fields to edit</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                size="sm"
                                disabled={isSaving}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                size="sm"
                                disabled={isSaving}
                            >
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-1" />Save</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Project Context */}
            {projectContext && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Project Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {projectContext.prioritizedPainPoint !== undefined && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Prioritized Pain Point</h3>
                                {isEditMode ? (
                                    <Textarea
                                        value={reportData.projectContext.prioritizedPainPoint || ''}
                                        onChange={(e) => updateTextAtPath(['projectContext', 'prioritizedPainPoint'], e.target.value)}
                                        rows={2}
                                        className="border-blue-300"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-700">{projectContext.prioritizedPainPoint}</p>
                                )}
                            </div>
                        )}
                        {projectContext.targetUserType !== undefined && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Target User Type</h3>
                                {isEditMode ? (
                                    <Textarea
                                        value={reportData.projectContext.targetUserType || ''}
                                        onChange={(e) => updateTextAtPath(['projectContext', 'targetUserType'], e.target.value)}
                                        rows={2}
                                        className="border-blue-300"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-700">{projectContext.targetUserType}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Irrationality Clusters */}
            {irrationalityClusters.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Irrationality Clusters Analysis</h2>
                    {irrationalityClusters.map((cluster: any, idx: number) => (
                        <Card key={idx}>
                            <CardHeader className="cursor-pointer" onClick={() => toggleCluster(idx)}>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-medium">
                                        Cluster {idx + 1}: {cluster.irrationality ? `"${cluster.irrationality.substring(0, 80)}${cluster.irrationality.length > 80 ? '...' : ''}"` : 'Irrationality Cluster'}
                                    </CardTitle>
                                    {expandedClusters[idx] ? (
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                            </CardHeader>
                            {expandedClusters[idx] && (
                                <CardContent className="space-y-4 pt-0">
                                    {/* Irrationality */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Irrationality</h4>
                                        {isEditMode ? (
                                            <Textarea
                                                value={cluster.irrationality || ''}
                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'irrationality'], e.target.value)}
                                                rows={2}
                                                className="border-blue-300"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-700">{cluster.irrationality}</p>
                                        )}
                                    </div>

                                    {/* Diagnosis */}
                                    {cluster.diagnosis && cluster.diagnosis.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Diagnosis (Cognitive Biases)</h4>
                                            {isEditMode ? (
                                                <div className="space-y-2">
                                                    {cluster.diagnosis.map((bias: string, i: number) => (
                                                        <Input
                                                            key={i}
                                                            value={bias || ''}
                                                            onChange={(e) => updateArrayItemAtPath(['irrationalityClusters', idx, 'diagnosis'], i, e.target.value)}
                                                            className="border-blue-300"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                    {cluster.diagnosis.map((bias: string, i: number) => (
                                                        <li key={i}>{bias}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    {/* Psychological Need Analysis */}
                                    {cluster.psychologicalNeedAnalysis && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Psychological Need Analysis</h4>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {cluster.psychologicalNeedAnalysis.coreNeed !== undefined && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700">Core Need:</span>
                                                        {isEditMode ? (
                                                            <Textarea
                                                                value={cluster.psychologicalNeedAnalysis.coreNeed || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'coreNeed'], e.target.value)}
                                                                rows={2}
                                                                className="mt-1 border-blue-300"
                                                            />
                                                        ) : (
                                                            <p className="text-sm text-gray-600 mt-1">{cluster.psychologicalNeedAnalysis.coreNeed}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.psychologicalNeedAnalysis.biasDrivenMotivation !== undefined && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700">Bias-Driven Motivation:</span>
                                                        {isEditMode ? (
                                                            <Textarea
                                                                value={cluster.psychologicalNeedAnalysis.biasDrivenMotivation || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'biasDrivenMotivation'], e.target.value)}
                                                                rows={2}
                                                                className="mt-1 border-blue-300"
                                                            />
                                                        ) : (
                                                            <p className="text-sm text-gray-600 mt-1">{cluster.psychologicalNeedAnalysis.biasDrivenMotivation}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.psychologicalNeedAnalysis.persistenceFactor !== undefined && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700">Persistence Factor:</span>
                                                        {isEditMode ? (
                                                            <Textarea
                                                                value={cluster.psychologicalNeedAnalysis.persistenceFactor || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'persistenceFactor'], e.target.value)}
                                                                rows={2}
                                                                className="mt-1 border-blue-300"
                                                            />
                                                        ) : (
                                                            <p className="text-sm text-gray-600 mt-1">{cluster.psychologicalNeedAnalysis.persistenceFactor}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.psychologicalNeedAnalysis.painPointConnection !== undefined && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700">Pain Point Connection:</span>
                                                        {isEditMode ? (
                                                            <Textarea
                                                                value={cluster.psychologicalNeedAnalysis.painPointConnection || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'psychologicalNeedAnalysis', 'painPointConnection'], e.target.value)}
                                                                rows={2}
                                                                className="mt-1 border-blue-300"
                                                            />
                                                        ) : (
                                                            <p className="text-sm text-gray-600 mt-1">{cluster.psychologicalNeedAnalysis.painPointConnection}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Outcome */}
                                    {cluster.outcome !== undefined && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Outcome</h4>
                                            {isEditMode ? (
                                                <Textarea
                                                    value={cluster.outcome || ''}
                                                    onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcome'], e.target.value)}
                                                    rows={3}
                                                    className="border-blue-300"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-700">{cluster.outcome}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Outcome Validation */}
                                    {cluster.outcomeValidation && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Outcome Validation</h4>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {cluster.outcomeValidation.smartPsychologyUse !== undefined && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700">Smart Psychology Use:</span>
                                                        {isEditMode ? (
                                                            <Textarea
                                                                value={cluster.outcomeValidation.smartPsychologyUse || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'smartPsychologyUse'], e.target.value)}
                                                                rows={2}
                                                                className="mt-1 border-blue-300"
                                                            />
                                                        ) : (
                                                            <p className="text-sm text-gray-600 mt-1">{cluster.outcomeValidation.smartPsychologyUse}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.outcomeValidation.painPointAlignment !== undefined && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700">Pain Point Alignment:</span>
                                                        {isEditMode ? (
                                                            <Textarea
                                                                value={cluster.outcomeValidation.painPointAlignment || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'painPointAlignment'], e.target.value)}
                                                                rows={2}
                                                                className="mt-1 border-blue-300"
                                                            />
                                                        ) : (
                                                            <p className="text-sm text-gray-600 mt-1">{cluster.outcomeValidation.painPointAlignment}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.outcomeValidation.specificityLevel !== undefined && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700">Specificity Level:</span>
                                                        {isEditMode ? (
                                                            <Input
                                                                value={cluster.outcomeValidation.specificityLevel || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'specificityLevel'], e.target.value)}
                                                                className="mt-1 border-blue-300"
                                                            />
                                                        ) : (
                                                            <p className="text-sm text-gray-600 mt-1">{cluster.outcomeValidation.specificityLevel}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {cluster.outcomeValidation.directionFocus !== undefined && (
                                                    <div>
                                                        <span className="text-sm font-medium text-gray-700">Direction Focus:</span>
                                                        {isEditMode ? (
                                                            <Textarea
                                                                value={cluster.outcomeValidation.directionFocus || ''}
                                                                onChange={(e) => updateTextAtPath(['irrationalityClusters', idx, 'outcomeValidation', 'directionFocus'], e.target.value)}
                                                                rows={2}
                                                                className="mt-1 border-blue-300"
                                                            />
                                                        ) : (
                                                            <p className="text-sm text-gray-600 mt-1">{cluster.outcomeValidation.directionFocus}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Outcome Integration Analysis */}
            {outcomeIntegration && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Outcome Integration Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Psychological Pattern Themes */}
                        {outcomeIntegration.psychologicalPatternThemes && outcomeIntegration.psychologicalPatternThemes.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Psychological Pattern Themes</h3>
                                {isEditMode ? (
                                    <div className="space-y-2">
                                        {outcomeIntegration.psychologicalPatternThemes.map((theme: string, i: number) => (
                                            <Textarea
                                                key={i}
                                                value={theme || ''}
                                                onChange={(e) => updateArrayItemAtPath(['outcomeIntegrationAnalysis', 'psychologicalPatternThemes'], i, e.target.value)}
                                                rows={2}
                                                className="border-blue-300"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                        {outcomeIntegration.psychologicalPatternThemes.map((theme: string, i: number) => (
                                            <li key={i}>{theme}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Pain Point Solution Coherence */}
                        {outcomeIntegration.painPointSolutionCoherence !== undefined && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Pain Point Solution Coherence</h3>
                                {isEditMode ? (
                                    <Textarea
                                        value={reportData.outcomeIntegrationAnalysis.painPointSolutionCoherence || ''}
                                        onChange={(e) => updateTextAtPath(['outcomeIntegrationAnalysis', 'painPointSolutionCoherence'], e.target.value)}
                                        rows={3}
                                        className="border-blue-300"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-700 leading-relaxed">{outcomeIntegration.painPointSolutionCoherence}</p>
                                )}
                            </div>
                        )}

                        {/* Innovation Opportunity Spaces */}
                        {outcomeIntegration.innovationOpportunitySpaces && outcomeIntegration.innovationOpportunitySpaces.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Innovation Opportunity Spaces</h3>
                                {isEditMode ? (
                                    <div className="space-y-2">
                                        {outcomeIntegration.innovationOpportunitySpaces.map((space: string, i: number) => (
                                            <Textarea
                                                key={i}
                                                value={space || ''}
                                                onChange={(e) => updateArrayItemAtPath(['outcomeIntegrationAnalysis', 'innovationOpportunitySpaces'], i, e.target.value)}
                                                rows={2}
                                                className="border-blue-300"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                        {outcomeIntegration.innovationOpportunitySpaces.map((space: string, i: number) => (
                                            <li key={i}>{space}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Implementation Priority Suggestions */}
                        {outcomeIntegration.implementationPrioritySuggestions !== undefined && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Implementation Priority Suggestions</h3>
                                {isEditMode ? (
                                    <Textarea
                                        value={reportData.outcomeIntegrationAnalysis.implementationPrioritySuggestions || ''}
                                        onChange={(e) => updateTextAtPath(['outcomeIntegrationAnalysis', 'implementationPrioritySuggestions'], e.target.value)}
                                        rows={3}
                                        className="border-blue-300"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-700 leading-relaxed">{outcomeIntegration.implementationPrioritySuggestions}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Fallback: Show raw data if structure doesn't match */}
            {(!projectContext && irrationalityClusters.length === 0 && !outcomeIntegration) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Raw Data Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="text-xs text-gray-700 overflow-auto max-h-96 font-mono bg-gray-50 p-4 rounded">
                            {JSON.stringify(reportData, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
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
