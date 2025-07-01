import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectService } from '@/services/projectService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import type { Project } from '@/types/project';
import { FiPlus, FiEdit2, FiTrash2, FiArrowRight } from 'react-icons/fi';

export const ProjectList = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const data = await ProjectService.getUserProjects(user.id);
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await ProjectService.deleteProject(id, user?.id || '');
        setProjects(projects.filter(project => project.id !== id));
        toast.success('Project deleted successfully');
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">My Projects</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your projects. Edit, view, or delete them as needed.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/projects/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            New Project
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">No projects yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first project.
          </p>
          <div className="mt-6">
            <Link
              to="/projects/new"
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <FiPlus className="-ml-1 mr-2 h-5 w-5" />
              New Project
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="relative bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 flex flex-col h-full group border border-gray-300"
            >
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {project.title}
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {project.description || 'No description'}
              </p>
              <div className="flex-1" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  Created: <time dateTime={project.created_at}>{new Date(project.created_at).toLocaleDateString()}</time>
                </span>
                <div className="flex space-x-2">
                  <Link
                    to={`/projects/${project.id}/edit`}
                    className="p-2 rounded hover:bg-indigo-50 text-indigo-600"
                    title="Edit"
                  >
                    <FiEdit2 className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 rounded hover:bg-red-50 text-red-600"
                    title="Delete"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                  <Link
                    to={`/projects/${project.id}`}
                    className="p-2 rounded hover:bg-indigo-50 text-indigo-600 flex items-center"
                    title="View"
                  >
                    <FiArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
