import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiMonitor } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
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
    <div className="group">
      <dt className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Presentable Slide</dt>
      <dd className="border border-gray-100 p-8 rounded-none">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <FiMonitor className="w-6 h-6 text-gray-400" />
            <div>
              <p className="text-gray-900 font-medium">
                {presentableSlide ? 'Ready for viewing' : 'No slide generated yet'}
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Professional Presentation Format</p>
            </div>
          </div>
          {project && project.id && (
            presentableSlide ? (
              <Button
                className="bg-[#0f121f] text-white hover:bg-[#0f121f]/90 rounded-none h-11 px-8"
                onClick={() => navigate(`/projects/${project.id}/slide`)}
              >
                View Slide
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white rounded-none h-11 px-8 transition-colors"
                onClick={handleGenerateSlide}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Slide'}
              </Button>
            )
          )}
        </div>
      </dd>
    </div>
  );
};
