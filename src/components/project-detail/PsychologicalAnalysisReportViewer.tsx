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
      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-gray-100">
        <FiAlertCircle className="w-8 h-8 text-gray-200 mb-4" />
        <p className="text-xs text-gray-400 uppercase tracking-widest">No Psychological Analysis Data</p>
      </div>
    );
  }

  const toggleCluster = (idx: number) => {
    setExpandedClusters(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const renderEditableList = (items: string[] | undefined, path: string[], label: string) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="space-y-4">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">{label}</label>
        <div className="space-y-3 pl-4 border-l border-gray-100">
          {items.map((item: string, i: number) => (
            <div key={i} className="group relative">
              {isEditMode ? (
                <textarea
                  value={item || ''}
                  onChange={(e) => updateArrayItemAtPath(path, i, e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                />
              ) : (
                <div className="flex items-start gap-3 py-1">
                  <span className="mt-1.5 w-1 h-1 bg-black rounded-md flex-shrink-0" />
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
    <div className="space-y-12 max-w-5xl mx-auto pb-24">
      {/* Toast Notifications */}
      {showSuccessMessage && (
        <div className="fixed top-8 right-8 bg-black text-white px-6 py-4 z-50 flex items-center gap-3 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-4">
          <FiCheckCircle className="w-4 h-4 text-white" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Analysis Synchronized</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-gray-100">
        <div className="space-y-2">
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Psychological Analysis</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em]">Phase 03 · Behavioral Pattern Synthesis</p>
        </div>
        
        <div className="flex items-center gap-4">
          {!isEditMode ? (
            <>
              {onSave && (
                <Button
                  variant="outline"
                  onClick={handleEditToggle}
                  className="border-black text-black hover:bg-black hover:text-white rounded-md h-12 px-8 font-normal transition-all"
                >
                  <FiEdit3 className="mr-2 w-4 h-4" /> Edit Analysis
                </Button>
              )}
              {onGenerateNew && (
                <Button
                  onClick={onGenerateNew}
                  className="bg-black text-white hover:bg-black/90 rounded-md h-12 px-8 font-normal transition-all"
                >
                  <FiRefreshCw className="mr-2 w-4 h-4" /> Regenerate
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleEditToggle}
                className="text-gray-400 hover:text-black rounded-md h-12 px-6 font-normal transition-all"
                disabled={isSaving}
              >
                <FiX className="mr-2 w-4 h-4" /> Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-black text-white hover:bg-black/90 rounded-md h-12 px-10 font-normal transition-all"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> : <FiSave className="mr-2 w-4 h-4 inline" />} {isSaving ? 'Saving...' : 'Commit Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Meta Analysis Overview */}
      {reportData.comprehensiveMetaAnalysis && (
        <section className="p-10 border border-gray-100">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-12">Comprehensive Meta Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-12">
              <div className="space-y-4">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Clusters Identified</label>
                <p className="text-5xl font-light text-gray-900 border-l-2 border-black pl-6">
                  {reportData.comprehensiveMetaAnalysis.totalClustersIdentified || '0'}
                </p>
              </div>
              
              {renderEditableList(reportData.comprehensiveMetaAnalysis.behavioralPatternThemes, ['comprehensiveMetaAnalysis', 'behavioralPatternThemes'], 'Emergent Themes')}
            </div>

            <div className="md:col-span-2 space-y-12">
              <div className="space-y-6">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Human Psychology Insights</label>
                {isEditMode ? (
                  <textarea
                    value={reportData.comprehensiveMetaAnalysis.humanPsychologyInsights || ''}
                    onChange={(e) => updateTextAtPath(['comprehensiveMetaAnalysis', 'humanPsychologyInsights'], e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-100">
                    {reportData.comprehensiveMetaAnalysis.humanPsychologyInsights}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {renderEditableList(reportData.comprehensiveMetaAnalysis.cognitiveBiasPatterns, ['comprehensiveMetaAnalysis', 'cognitiveBiasPatterns'], 'Cognitive Biases')}
                <div className="space-y-6">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Emotional Drivers</label>
                  {isEditMode ? (
                    <textarea
                      value={reportData.comprehensiveMetaAnalysis.emotionalDriverAnalysis || ''}
                      onChange={(e) => updateTextAtPath(['comprehensiveMetaAnalysis', 'emotionalDriverAnalysis'], e.target.value)}
                      rows={4}
                      className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-100">
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
      <div className="space-y-6">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] pl-2 mb-8">Behavioral Cluster Catalog</h2>
        
        {reportData.clusters?.map((cluster: any, idx: number) => (
          <div key={idx} className="border border-gray-100 group">
            <button
              onClick={() => toggleCluster(idx)}
              className={`w-full p-8 text-left flex items-center justify-between transition-all ${expandedClusters[idx] ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-6">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${expandedClusters[idx] ? 'opacity-70' : 'text-gray-400'}`}>Cluster 0{idx + 1}</span>
                <span className="text-sm font-medium tracking-wide uppercase">{cluster.irrationalBehavior || 'Behavioral Pattern'}</span>
              </div>
              {expandedClusters[idx] ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedClusters[idx] && (
              <div className="p-10 bg-white border-t border-gray-100 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-6">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Rational Counterpart</label>
                    {isEditMode ? (
                      <textarea
                        value={cluster.rationalCounterpart || ''}
                        onChange={(e) => updateTextAtPath(['clusters', idx, 'rationalCounterpart'], e.target.value)}
                        rows={3}
                        className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed pl-6 border-l border-gray-100">{cluster.rationalCounterpart}</p>
                    )}
                  </div>
                  
                  {renderEditableList(cluster.rawEvidenceFromStudentData, ['clusters', idx, 'rawEvidenceFromStudentData'], 'Raw Evidence')}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-10 border-t border-gray-50">
                  {[
                    { label: 'Cognitive Biases', path: ['clusters', idx, 'psychologicalAnalysis', 'cognitiveBiases'], value: cluster.psychologicalAnalysis?.cognitiveBiases },
                    { label: 'Emotional Drivers', path: ['clusters', idx, 'psychologicalAnalysis', 'emotionalDrivers'], value: cluster.psychologicalAnalysis?.emotionalDrivers },
                    { label: 'Psychological Needs', path: ['clusters', idx, 'psychologicalAnalysis', 'psychologicalNeeds'], value: cluster.psychologicalAnalysis?.psychologicalNeeds },
                    { label: 'Continuity Factor', path: ['clusters', idx, 'psychologicalAnalysis', 'whyItPersists'], value: cluster.psychologicalAnalysis?.whyItPersists }
                  ].map((field, fIdx) => (
                    <div key={fIdx} className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{field.label}</label>
                      {isEditMode ? (
                        <textarea
                          value={field.value || ''}
                          onChange={(e) => updateTextAtPath(field.path, e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-gray-100 p-3 text-xs focus:outline-none focus:border-black transition-colors resize-none"
                        />
                      ) : (
                        <p className="text-xs text-gray-600 leading-relaxed">{field.value}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-10 border-t border-gray-50">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Behavioral Science Basis</label>
                    {isEditMode ? (
                      <textarea
                        value={cluster.behavioralScienceExplanation || ''}
                        onChange={(e) => updateTextAtPath(['clusters', idx, 'behavioralScienceExplanation'], e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-black p-4 text-sm focus:outline-none transition-colors resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-6 border-l-2 border-black italic">"{cluster.behavioralScienceExplanation}"</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest block">Strategic Innovation Insight</label>
                    {isEditMode ? (
                      <textarea
                        value={cluster.innovationInsight || ''}
                        onChange={(e) => updateTextAtPath(['clusters', idx, 'innovationInsight'], e.target.value)}
                        rows={4}
                        className="w-full bg-white border border-black p-4 text-sm font-medium focus:outline-none transition-colors resize-none"
                      />
                    ) : (
                      <div className="p-6 border border-gray-900 bg-white">
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

      {/* Critical Requirements */}
      {reportData.criticalRequirements && (
        <section className="p-10 border border-black bg-white">
          <h2 className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.3em] mb-12">Core Design Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
            {reportData.criticalRequirements.map((req: string, idx: number) => (
              <div key={idx} className="flex gap-6 group">
                <span className="text-2xl font-light text-gray-200 group-hover:text-black transition-colors tabular-nums">{(idx + 1).toString().padStart(2, '0')}</span>
                {isEditMode ? (
                  <textarea
                    value={req || ''}
                    onChange={(e) => updateArrayItemAtPath(['criticalRequirements'], idx, e.target.value)}
                    rows={2}
                    className="flex-1 bg-white border border-gray-200 p-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
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
        <section className="p-10 border border-gray-100">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] block mb-8">System Level Implications</label>
          {isEditMode ? (
            <textarea
              value={reportData.comprehensiveMetaAnalysis.systemLevelImplications || ''}
              onChange={(e) => updateTextAtPath(['comprehensiveMetaAnalysis', 'systemLevelImplications'], e.target.value)}
              rows={4}
              className="w-full bg-white border border-gray-200 p-4 text-sm focus:outline-none focus:border-black transition-colors resize-none"
            />
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed max-w-4xl">{reportData.comprehensiveMetaAnalysis.systemLevelImplications}</p>
          )}
        </section>
      )}

      {/* Footer Metadata */}
      {data.generated_at && (
        <div className="text-[10px] text-gray-400 text-center pt-12 border-t border-gray-100 uppercase tracking-[0.3em]">
          Analysis Synchronized on {new Date(data.generated_at).toLocaleString()} — Behavioral Science Engine
        </div>
      )}
    </div>
  );
};
