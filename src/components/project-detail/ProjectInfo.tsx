import { FiTrendingUp } from 'react-icons/fi';
import type { Project } from '@/types/project';

interface ProjectInfoProps {
  project: Project;
}

export const ProjectInfo = ({ project }: ProjectInfoProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
      <div className="px-8 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <FiTrendingUp className="w-5 h-5 text-white" />
          </div>
          Project Information
        </h3>
      </div>
      
      <div className="p-8">
        <dl className="space-y-8">
          <div className="group">
            <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Description</dt>
            <dd className="text-gray-900 leading-relaxed bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
              {project.description || 'No description provided'}
            </dd>
          </div>
          
          {project.skills && project.skills.length > 0 && (
            <div className="group">
              <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Skills & Technologies</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-3">
                  {project.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200 hover:shadow-md transition-all duration-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          )}

          {project.design_research?.generated_at && (
            <div className="group">
              <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Extreme User Analysis</dt>
              <dd className="bg-green-50/80 p-6 rounded-2xl border border-green-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold">Generated on: {new Date(project.design_research.generated_at).toLocaleString()}</span>
                  </div>
                  {project.design_research.form && (
                    <div className="mt-4 p-4 bg-white/80 rounded-xl border border-green-300">
                      <p className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Generation Parameters
                      </p>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium text-gray-700">Step:</span> <span className="text-gray-600">{project.design_research.form.painPointStep}</span></p>
                        <p><span className="font-medium text-gray-700">Description:</span> <span className="text-gray-600">{project.design_research.form.painPointDescription}</span></p>
                        <p><span className="font-medium text-gray-700">User Context:</span> <span className="text-gray-600">{project.design_research.form.targetUserContext}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              </dd>
            </div>
          )}

          {project.deep_empathy_data?.generated_at && (
            <div className="group">
              <dt className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Deep Empathy Research</dt>
              <dd className="bg-purple-50/80 p-6 rounded-2xl border border-purple-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-semibold">Generated on: {new Date(project.deep_empathy_data.generated_at).toLocaleString()}</span>
                  </div>
                  {project.deep_empathy_data.form && (
                    <div className="mt-4 p-4 bg-white/80 rounded-xl border border-purple-300">
                      <p className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        Generation Parameters
                      </p>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium text-gray-700">Prioritized Pain Point:</span> <span className="text-gray-600">{project.deep_empathy_data.form.prioritizedPainPoint}</span></p>
                        <p><span className="font-medium text-gray-700">Description:</span> <span className="text-gray-600">{project.deep_empathy_data.form.painPointDescription}</span></p>
                        <p><span className="font-medium text-gray-700">Selected Extreme User:</span> <span className="text-gray-600">{project.deep_empathy_data.form.selectedExtremeUser}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};
