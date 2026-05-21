import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FiChevronDown, FiChevronUp, FiEdit3, FiRefreshCw, FiSave, FiX, FiCheckCircle, FiAlertCircle, FiActivity } from 'react-icons/fi';

interface PsychologicalAnalysisReportViewerProps {
  data: any;
  onGenerateNew?: () => void;
  projectId?: string;
  onSave?: (updatedData: any) => Promise<void>;
}

export const PsychologicalAnalysisReportViewer = ({ data, onGenerateNew, projectId, onSave }: PsychologicalAnalysisReportViewerProps) => {
  const [expandedClusters, setExpandedClusters] = useState<{ [key: number]: boolean }>({ 0: true });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorText, setErrorText] = useState('');

  const reportData = isEditMode ? editedData : (data?.content || data);

  const handleEditToggle = () => {
    if (!isEditMode) {
      const dataToEdit = data?.content || data;
      setEditedData(structuredClone(dataToEdit));
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
      setEditedData(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(editedData);
        setIsEditMode(false);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setErrorText(error instanceof Error ? error.message : 'Failed to save changes');
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTextAtPath = (path: string[], value: string) => {    setEditedData((prev: any) => {
      const cloneObj = (obj: any, p: (string | number)[]): any => {
        if (p.length === 0) return value;
        const head = p[0];
        const rest = p.slice(1);
        if (Array.isArray(obj)) {
          const arr = [...obj];
          arr[head as number] = cloneObj(obj[head as number], rest);
          return arr;
        } else if (obj !== null && typeof obj === 'object') {
          return {
            ...obj,
            [head]: cloneObj(obj[head], rest)
          };
        }
        return obj;
      };
      return cloneObj(prev, path);
    });
  };

  const updateArrayItemAtPath = (path: string[], index: number, value: string) => {    setEditedData((prev: any) => {
      const fullPath = [...path, index];
      const cloneObj = (obj: any, p: (string | number)[]): any => {
        if (p.length === 0) return value;
        const head = p[0];
        const rest = p.slice(1);
        if (Array.isArray(obj)) {
          const arr = [...obj];
          arr[head as number] = cloneObj(obj[head as number], rest);
          return arr;
        } else if (obj !== null && typeof obj === 'object') {
          return {
            ...obj,
            [head]: cloneObj(obj[head], rest)
          };
        }
        return obj;
      };
      return cloneObj(prev, fullPath);
    });
  };

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-24">
        <FiAlertCircle className="w-8 h-8 text-gray-400 mb-4" />
        <p className="text-xs text-gray-500 uppercase tracking-widest">No Psychological Analysis Data</p>
      </div>
    );
  }

  const toggleCluster = (idx: number) => {
    setExpandedClusters(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const renderEditableList = (items: string[] | undefined, path: string[], label: string) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="flex flex-col gap-4">
        <label className="text-[10px] font-medium uppercase tracking-wide text-gray-500 block">{label}</label>
        <div className="flex flex-col gap-3 pl-4 border-l border-gray-200">
          {items.map((item: string, i: number) => (
            <div key={i} className="group relative">
              {isEditMode ? (
                <textarea
                  value={item || ''}
                  onChange={(e) => updateArrayItemAtPath(path, i, e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-gray-200 p-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 resize-none rounded-lg"
                />
              ) : (
                <div className="flex items-start gap-3 py-1">
                  <span className="mt-1.5 w-1 h-1 bg-gray-400 rounded-md flex-shrink-0" />
                  <p className="text-sm text-gray-600 leading-relaxed">{item}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Toast Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-900">✓ Analysis saved successfully</p>
        </div>
      )}

      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn rounded-xl border border-red-200 bg-white px-6 py-4 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600">✗ {errorText}</p>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0 text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Psychological Analysis
          </h1>
          <p className="mt-2 max-w-xl text-base leading-snug text-gray-500">
            Behavioral pattern synthesis report
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
                    onClick={handleEditToggle}
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

      {/* Meta Analysis Overview */}
      {reportData.comprehensiveMetaAnalysis && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Comprehensive Meta Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10">
            <div className="flex flex-col gap-12">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-medium uppercase tracking-wide text-gray-500 block">Clusters Identified</label>
                <p className="text-5xl font-light text-gray-900 border-l-2 border-gray-200 pl-6">
                  {reportData.comprehensiveMetaAnalysis.totalClustersIdentified || '0'}
                </p>
              </div>
              
              {renderEditableList(reportData.comprehensiveMetaAnalysis.behavioralPatternThemes, ['comprehensiveMetaAnalysis', 'behavioralPatternThemes'], 'Emergent Themes')}
            </div>

            <div className="md:col-span-2 flex flex-col gap-12">
              <div className="flex flex-col gap-6">
                <label className="text-[10px] font-medium uppercase tracking-wide text-gray-500 block">Human Psychology Insights</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.comprehensiveMetaAnalysis.humanPsychologyInsights || ''}
                    onChange={(e) => updateTextAtPath(['comprehensiveMetaAnalysis', 'humanPsychologyInsights'], e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-gray-200 p-4 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 resize-none rounded-lg"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-200">
                    {reportData.comprehensiveMetaAnalysis.humanPsychologyInsights}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {renderEditableList(reportData.comprehensiveMetaAnalysis.cognitiveBiasPatterns, ['comprehensiveMetaAnalysis', 'cognitiveBiasPatterns'], 'Cognitive Biases')}
                <div className="flex flex-col gap-6">
                  <label className="text-[10px] font-medium uppercase tracking-wide text-gray-500 block">Emotional Drivers</label>
                  {isEditMode ? (
                    <textarea
                      value={reportData.comprehensiveMetaAnalysis.emotionalDriverAnalysis || ''}
                      onChange={(e) => updateTextAtPath(['comprehensiveMetaAnalysis', 'emotionalDriverAnalysis'], e.target.value)}
                      rows={4}
                      className="w-full bg-white border border-gray-200 p-4 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 resize-none rounded-lg"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-200">
                      {reportData.comprehensiveMetaAnalysis.emotionalDriverAnalysis}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Behavioral Clusters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-8">
        <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Behavioral Cluster Catalog</h2>
        
        <div className="flex flex-col gap-6">
          {reportData.clusters?.map((cluster: any, idx: number) => (
            <div key={idx} className="overflow-hidden rounded-xl border border-gray-200">
              <button
                onClick={() => toggleCluster(idx)}
                className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${expandedClusters[idx] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium uppercase tracking-wide ${expandedClusters[idx] ? 'opacity-70' : 'text-gray-500'}`}>Cluster 0{idx + 1}</span>
                  <span className="text-sm font-medium">{cluster.irrationalBehavior || 'Behavioral Pattern'}</span>
                </div>
                <span className="text-xs">{expandedClusters[idx] ? 'CLOSE' : 'EXPAND'}</span>
              </button>
              {expandedClusters[idx] && (
                <div className="flex flex-col gap-12 bg-white p-8 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="flex flex-col gap-6">
                      <label className="text-[10px] font-medium uppercase tracking-wide text-gray-500 block">Rational Counterpart</label>
                      {isEditMode ? (
                        <textarea
                          value={cluster.rationalCounterpart || ''}
                          onChange={(e) => updateTextAtPath(['clusters', idx.toString(), 'rationalCounterpart'], e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-gray-200 p-4 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 resize-none rounded-lg"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-200">{cluster.rationalCounterpart}</p>
                      )}
                    </div>
                    
                    {renderEditableList(cluster.rawEvidenceFromStudentData, ['clusters', idx.toString(), 'rawEvidenceFromStudentData'], 'Raw Evidence')}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-10 border-t border-gray-100">
                    {[
                      { label: 'Cognitive Biases', path: ['clusters', idx.toString(), 'psychologicalAnalysis', 'cognitiveBiases'], value: cluster.psychologicalAnalysis?.cognitiveBiases },
                      { label: 'Emotional Drivers', path: ['clusters', idx.toString(), 'psychologicalAnalysis', 'emotionalDrivers'], value: cluster.psychologicalAnalysis?.emotionalDrivers },
                      { label: 'Psychological Needs', path: ['clusters', idx.toString(), 'psychologicalAnalysis', 'psychologicalNeeds'], value: cluster.psychologicalAnalysis?.psychologicalNeeds },
                      { label: 'Continuity Factor', path: ['clusters', idx.toString(), 'psychologicalAnalysis', 'whyItPersists'], value: cluster.psychologicalAnalysis?.whyItPersists }
                    ].map((field, fIdx) => (
                      <div key={fIdx} className="flex flex-col gap-3">
                        <label className="text-[10px] font-medium uppercase tracking-wide text-gray-500 block">{field.label}</label>
                        {isEditMode ? (
                          <textarea
                            value={field.value || ''}
                            onChange={(e) => updateTextAtPath(field.path as string[], e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-gray-200 p-3 text-xs focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 resize-none rounded-lg"
                          />
                        ) : (
                          <p className="text-xs text-gray-600 leading-relaxed">{field.value}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pt-10 border-t border-gray-200">
                    <div className="flex flex-col gap-6">
                      <label className="text-[10px] font-medium uppercase tracking-wide text-gray-500 block">Behavioral Science Basis</label>
                      {isEditMode ? (
                        <textarea
                          value={cluster.behavioralScienceExplanation || ''}
                          onChange={(e) => updateTextAtPath(['clusters', idx.toString(), 'behavioralScienceExplanation'], e.target.value)}
                          rows={4}
                          className="w-full bg-white border border-gray-200 p-4 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 resize-none rounded-lg"
                        />
                      ) : (
                        <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l-2 border-gray-200 italic">"{cluster.behavioralScienceExplanation}"</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-6">
                      <label className="text-[10px] font-medium uppercase tracking-wide text-gray-500 block">Strategic Innovation Insight</label>
                      {isEditMode ? (
                        <textarea
                          value={cluster.innovationInsight || ''}
                          onChange={(e) => updateTextAtPath(['clusters', idx.toString(), 'innovationInsight'], e.target.value)}
                          rows={4}
                          className="w-full bg-white border border-gray-200 p-4 text-sm font-medium focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 resize-none rounded-lg"
                        />
                      ) : (
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                          <p className="text-sm font-medium text-gray-900 leading-relaxed">{cluster.innovationInsight}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Critical Requirements */}
      {reportData.criticalRequirements && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <h2 className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500">Core Design Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {reportData.criticalRequirements.map((req: string, idx: number) => (
              <div key={idx} className="flex gap-6 group">
                <span className="text-2xl font-light text-gray-200 group-hover:text-gray-400 transition-colors tabular-nums">{(idx + 1).toString().padStart(2, '0')}</span>
                {isEditMode ? (
                  <textarea
                    value={req || ''}
                    onChange={(e) => updateArrayItemAtPath(['criticalRequirements'], idx, e.target.value)}
                    rows={2}
                    className="flex-1 bg-white border border-gray-200 p-3 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 resize-none rounded-lg"
                  />
                ) : (
                  <p className="text-sm text-gray-900 font-medium leading-relaxed pt-1.5">{req}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* System Level Implications */}
      {reportData.comprehensiveMetaAnalysis?.systemLevelImplications && (
        <section className="rounded-2xl border border-gray-200 bg-white p-8">
          <label className="mb-8 text-xs font-medium uppercase tracking-wide text-gray-500 block">System Level Implications</label>
          {isEditMode ? (
            <textarea
              value={reportData.comprehensiveMetaAnalysis.systemLevelImplications || ''}
              onChange={(e) => updateTextAtPath(['comprehensiveMetaAnalysis', 'systemLevelImplications'], e.target.value)}
              rows={4}
              className="w-full bg-white border border-gray-200 p-4 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20 resize-none rounded-lg"
            />
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">{reportData.comprehensiveMetaAnalysis.systemLevelImplications}</p>
          )}
        </section>
      )}

      {/* Footer Metadata */}
      {data.generated_at && (
        <div className="border-t border-gray-100 pt-12 text-center text-[10px] uppercase tracking-widest text-gray-500">
          Analysis synchronized on {new Date(data.generated_at).toLocaleString()} — Behavioral Science Engine
        </div>
      )}
    </div>
  );
};

