import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import type { Project } from '@/types/project';

interface ProjectCanvasSectionProps {
  project: Project;
}

export const ProjectCanvasSection = ({ project }: ProjectCanvasSectionProps) => {
  const navigate = useNavigate();

  return (
    <div className="group">
      <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Project Canvas</dt>
      <dd className="bg-indigo-50/80 p-6 rounded-2xl border border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FiPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-900 font-medium">
                {project.canvas ? 'Canvas available for collaboration' : 'No canvas created yet'}
              </p>
              <p className="text-sm text-gray-600">Collaborative workspace for your team</p>
            </div>
          </div>
          {project && project.id && (
            <button
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              onClick={() => navigate(`/projects/${project.id}/canvas`)}
            >
              {project.canvas ? 'View Canvas' : 'Create Canvas'}
            </button>
          )}
        </div>
      </dd>
    </div>
  );
};
