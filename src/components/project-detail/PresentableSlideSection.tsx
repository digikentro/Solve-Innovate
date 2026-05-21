import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiMonitor } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/types/project';

interface PresentableSlideProps {
  project: Project;
  presentableSlide: any | null;
  setPresentableSlide: (slide: any) => void;
}

export const PresentableSlideSection = ({ project, presentableSlide, setPresentableSlide }: PresentableSlideProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const handleGenerateSlide = async () => {
    if (!project || !project.id) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-presentable-slide', {
        body: { title: project.title, description: project.description }
      });
      if (error) throw error;
      setPresentableSlide(data);
      await supabase.from('projects').update({ presentable_slide: data }).eq('id', project.id);
    } catch (err: any) {
      toast.error('Failed to generate slide.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight text-gray-900">
          <FiMonitor className="size-5 shrink-0 text-gray-400" />
          Presentable Slide
        </CardTitle>
        <CardDescription className="text-xs uppercase tracking-wide text-gray-500">
          Professional Presentation Format
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pb-6 pt-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
              <FiMonitor className="size-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {presentableSlide ? 'Ready for viewing' : 'No slide generated yet'}
              </p>
            </div>
          </div>
          {project && project.id && (
            presentableSlide ? (
              <Button
                onClick={() => navigate(`/projects/${project.id}/slide`)}
                className="w-full sm:w-auto"
              >
                View Slide
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleGenerateSlide}
                disabled={isGenerating}
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 inline size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Slide'
                )}
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};
