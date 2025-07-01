import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ProjectService } from '@/services/projectService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import type { Project } from '@/types/project';
import { FiEdit, FiTrash2, FiArrowLeft, FiPlus, FiTrendingUp } from 'react-icons/fi';
import { IdeaList } from '@/components/idea/IdeaList';
import { generateIdeas } from '@/services/openaiService';
import { supabase } from '@/lib/supabase';

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presentableSlide, setPresentableSlide] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        const data = await ProjectService.getProjectById(id, user.id);
        
        // Ensure the project belongs to the current user
        if (!data) {
          toast.error('Project not found');
          navigate('/projects');
          return;
        }
        
        if (data.user_id !== user.id) {
          navigate('/projects');
          toast.error('You do not have permission to view this project');
          return;
        }
        
        setProject(data);
        if (data.presentable_slide) setPresentableSlide(data.presentable_slide);
      } catch (error) {
        console.error('Error loading project:', error);
        setError('Failed to load project');
        toast.error('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [id, user, navigate]);

  const handleDelete = async () => {
    if (!id || !user) return;
    
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await ProjectService.deleteProject(id, user.id);
        toast.success('Project deleted successfully');
        navigate('/projects');
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      }
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600">{error || 'Project not found'}</h3>
        <div className="mt-6">
          <Link
            to="/projects"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiArrowLeft className="-ml-1 mr-2 h-5 w-5" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            {project.title}
          </h2>
          {/* Presentable Slide Button */}
          {project && project.id && (
            <div className="flex justify-end mb-2">
              {presentableSlide ? (
                <button
                  className="px-4 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                  onClick={() => navigate(`/projects/${project.id}/slide`)}
                >
                  View Presentable Slide
                </button>
              ) : (
                <button
                  className="px-4 py-2 rounded bg-yellow-500 text-white font-medium hover:bg-yellow-600 transition"
                  onClick={handleGenerateSlide}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Presentable Slide'}
                </button>
              )}
            </div>
          )}
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className="font-medium">Created:</span>
              <span className="ml-2">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
            {project.updated_at !== project.created_at && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="font-medium">Last updated:</span>
                <span className="ml-2">
                  {new Date(project.updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-row space-x-3 md:mt-0 md:ml-4 items-start md:items-end">
          <Link
            to={`/projects/${project.id}/assessment`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FiTrendingUp className="-ml-1 mr-2 h-5 w-5" />
            Assess Project
          </Link>
          <Link
            to={`/projects/${project.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiEdit className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FiTrash2 className="-ml-1 mr-2 h-5 w-5" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Project Information
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {project.description || 'No description provided'}
              </dd>
            </div>
            {project.tags && project.tags.length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Tags</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Ideas</h3>
        <Link
          to={`/projects/${project.id}/ideas/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiPlus className="-ml-1 mr-2 h-5 w-5" />
          New Idea
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <IdeaList projectId={project.id} />
      </div>
    </div>
  );
};
