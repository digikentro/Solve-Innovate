import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiTrash2 } from 'react-icons/fi';
import type { Project } from '@/types/project';

interface ProjectHeaderProps {
  project: Project;
  onDelete: () => void;
}

export const ProjectHeader = ({ project, onDelete }: ProjectHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl opacity-10"></div>
      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="flex items-start gap-4 flex-wrap">
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            type="button"
            aria-label="Back to Projects"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent leading-tight">
              {project.title}
            </h1>
            <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-8">
              <div className="mt-2 flex items-center text-sm text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-full">
                <span className="font-medium">Created:</span>
                <span className="ml-2 font-semibold">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
              {project.updated_at !== project.created_at && (
                <div className="mt-2 flex items-center text-sm text-gray-600 bg-gray-100/80 px-3 py-1.5 rounded-full">
                  <span className="font-medium">Updated:</span>
                  <span className="ml-2 font-semibold">
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex flex-row space-x-3 md:mt-0 md:ml-4 items-start md:items-end">
            <Link
              to={`/projects/${project.id}/edit`}
              className="inline-flex items-center px-6 py-3 border border-gray-200 shadow-lg text-sm font-semibold rounded-2xl text-gray-700 bg-white/90 hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-200 backdrop-blur-sm"
            >
              <FiEdit className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
            <button
              onClick={onDelete}
              className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <FiTrash2 className="mr-2 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
