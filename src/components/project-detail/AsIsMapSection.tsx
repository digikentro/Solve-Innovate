import { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { AsIsMapForm } from '@/components/project/AsIsMap';
import type { Project } from '@/types/project';
import { hasDataContent } from '@/utils/dataHelpers';

interface AsIsMapSectionProps {
  project: Project;
  asIsMapData: any | null;
  setAsIsMapData: (data: any) => void;
  renderReport?: (data: any, onGenerateNew: () => void) => React.ReactNode;
}

export const AsIsMapSection = ({ project, asIsMapData, setAsIsMapData, renderReport }: AsIsMapSectionProps) => {
  const [asIsMapPrompt, setAsIsMapPrompt] = useState<string>('');
  const [isGeneratingAsIsMap, setIsGeneratingAsIsMap] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (asIsMapPrompt && asIsMapPrompt.trim().length > 0) return;
    if (project?.title && project.title.trim().length > 0) {
      setAsIsMapPrompt(project.title);
    }
  }, [project, asIsMapPrompt]);

  const hasData = asIsMapData || hasDataContent(project?.as_is_map);

  // Auto-show report when data is available
  useEffect(() => {
    if (hasData && !isGeneratingAsIsMap) {
      setShowReport(true);
    }
  }, [hasData, isGeneratingAsIsMap]);

  return (
    <>
      {!hasData ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <FiPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">As-Is Map</h3>
                <p className="text-sm text-gray-600">Visualize the current state of your project or process</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="space-y-6">
              <div className="bg-blue-50/80 p-6 rounded-2xl border border-blue-200">
                <p className="text-gray-700 text-sm leading-relaxed">
                  Generate an "As-Is Map" to visualize the current state of your project or process. This helps identify pain points and opportunities for improvement.
                </p>
              </div>
              <AsIsMapForm
                projectId={project?.id || ''}
                prompt={asIsMapPrompt}
                onPromptChange={setAsIsMapPrompt}
                onGenerate={(data) => {
                  setAsIsMapData(data);
                  setAsIsMapPrompt('');
                  setShowReport(true);
                }}
                onGeneratingChange={setIsGeneratingAsIsMap}
                isGenerating={isGeneratingAsIsMap}
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Inline Report Display */}
          {showReport && renderReport && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-fadeIn">
              {renderReport(asIsMapData, () => {
                setAsIsMapData(null);
                setAsIsMapPrompt('');
                setShowReport(false);
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
};
