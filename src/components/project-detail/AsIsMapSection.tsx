import { useState, useEffect } from 'react';
import { FiPlus, FiMap } from 'react-icons/fi';
import { AsIsMapForm } from '@/components/project/AsIsMap';
import type { Project } from '@/types/project';
import { hasDataContent } from '@/utils/dataHelpers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
        <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight text-gray-900">
              <FiMap className="size-5 shrink-0 text-gray-400" />
              As-Is Map
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wide text-gray-500">
              Visualize the current state
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col gap-6 px-6 pb-6 pt-6">
            <div className="border-l-2 border-gray-900 py-2 pl-4">
              <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
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
