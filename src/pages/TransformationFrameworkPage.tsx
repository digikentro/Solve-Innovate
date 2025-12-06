import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { FiArrowLeft } from 'react-icons/fi';
import { TransformationFrameworkReportViewer } from '@/components/project-detail';
import { toast } from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  transformation_framework?: any;
}

const TransformationFrameworkPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        setError('No project ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, title, transformation_framework')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
        toast.error('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transformation framework...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading project or transformation framework data.</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const getTransformationFrameworkContent = () => {
    if (!project.transformation_framework) return null;

    // Handle string format
    if (typeof project.transformation_framework === 'string') {
      try {
        const parsed = JSON.parse(project.transformation_framework);
        return parsed.content || parsed;
      } catch (error) {
        console.error('Failed to parse transformation_framework string:', error);
        return null;
      }
    }

    // Handle object format
    if (typeof project.transformation_framework === 'object') {
      return project.transformation_framework.content || project.transformation_framework;
    }

    return null;
  };

  const transformationFrameworkContent = getTransformationFrameworkContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="p-2 hover:bg-white/50 rounded-xl transition-all duration-200 group"
          >
            <FiArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transformation Framework</h1>
            <p className="text-gray-600 mt-1">Actionable transformation strategies for {project.title}</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Transformation Framework Results</h2>
                <p className="text-sm text-gray-600">
                  Generated insights and strategies for behavioral transformation
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {transformationFrameworkContent ? (
              <TransformationFrameworkReportViewer 
                data={transformationFrameworkContent}
                onGenerateNew={() => navigate(`/projects/${id}`)}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transformation Framework Available</h3>
                <p className="text-gray-600 mb-6">
                  Generate a transformation framework to see actionable insights and strategies.
                </p>
                <button
                  onClick={() => navigate(`/projects/${id}`)}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  Generate Transformation Framework
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformationFrameworkPage;