import { useState, useEffect } from 'react';
import { FiPlus, FiMap } from 'react-icons/fi';
import { AsIsMapForm } from '@/components/project/AsIsMap';
import type { Project } from '@/types/project';
import { hasDataContent } from '@/utils/dataHelpers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AsIsMapSectionProps {
  project: Project;
  asIsMapData: any | null;
  setAsIsMapData: (data: any) => void;
  renderReport?: (data: any, onGenerateNew: () => void) => React.ReactNode;
  onRefreshProject?: () => void;
}

export const AsIsMapSection = ({ project, asIsMapData, setAsIsMapData, renderReport, onRefreshProject }: AsIsMapSectionProps) => {
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
        <Card className="bg-white border border-gray-200 shadow-none rounded-none overflow-hidden mb-8">
          <CardHeader className="px-8 py-6 border-b border-gray-100 flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border border-gray-100 flex items-center justify-center">
                <FiMap className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-medium text-gray-900">As-Is Map</CardTitle>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Visualize the current state</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="space-y-10">
              <div className="border-l-2 border-gray-900 pl-6 py-2">
                <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
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
                  if (onRefreshProject) {
                    setTimeout(() => {
                      onRefreshProject();
                    }, 2000);
                  }
                }}
                onGeneratingChange={setIsGeneratingAsIsMap}
                isGenerating={isGeneratingAsIsMap}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fadeIn">
          {showReport && renderReport && renderReport(asIsMapData, () => {
            setIsGeneratingAsIsMap(true);
            setShowReport(false);
            setAsIsMapData(null);
          })}
        </div>
      )}
    </>
  );
};
