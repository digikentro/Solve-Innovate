import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiTrendingUp } from 'react-icons/fi';
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
      <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Presentable Slide</dt>
      <dd className="bg-blue-50/80 p-6 rounded-2xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-900 font-medium">
                {presentableSlide ? 'Slide generated and ready for viewing' : 'No slide generated yet'}
              </p>
              <p className="text-sm text-gray-600">Create professional presentations</p>
            </div>
          </div>
          {project && project.id && (
            presentableSlide ? (
              <button
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                onClick={() => navigate(`/projects/${project.id}/slide`)}
              >
                View Slide
              </button>
            ) : (
              <button
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50"
                onClick={handleGenerateSlide}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Slide'}
              </button>
            )
          )}
        </div>
      </dd>
    </div>
  );
};
