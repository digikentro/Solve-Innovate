import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ProjectService } from '@/services/projectService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import type { Project } from '@/types/project';
import { FiEdit, FiTrash2, FiArrowLeft, FiPlus, FiTrendingUp } from 'react-icons/fi';
import { IOSAssessmentCard } from '@/components/ui/IOSAssessmentCard';
import { supabase } from '@/lib/supabase';
import VerticalModal, { HorizontalModal } from '@/components/ui/Modal';
import { ResourceFrameworkSelector } from '@/components/assessment/ResourceFrameworkSelector';

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presentableSlide, setPresentableSlide] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAssessmentIdx, setSelectedAssessmentIdx] = useState(0);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'express' | 'standard' | 'premium' | null>(null);
  const [viewAssessmentIdx, setViewAssessmentIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  const assessments = project?.assessments || [];

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
            {project.skills && project.skills.length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Skills</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Assessments Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Assessments</h3>
          </div>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={() => setShowAssessmentModal(true)}
          >
            <FiTrendingUp className="-ml-1 mr-2 h-5 w-5" />
            Assess Project
          </button>
        </div>
        <div className="px-4 py-0">
          {assessments.length > 0 ? (
            <>
              <div className="mb-8">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment Name</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...assessments]
                      .map((a, idx) => ({ a, idx }))
                      .sort((x, y) => {
                        const d1 = new Date(x.a.createdAt || x.a.updatedAt || 0).getTime();
                        const d2 = new Date(y.a.createdAt || y.a.updatedAt || 0).getTime();
                        return d2 - d1;
                      })
                      .map(({ a, idx }, arrIdx, arr) => {
                        // Determine assessment name
                        let name = a.name;
                        if (!name) {
                          if (arr.length > 0 && arrIdx === arr.length - 1) {
                            name = 'Initial Assessment';
                          } else {
                            name = `Assessment - ${a.randomId || Math.floor(1000 + Math.random() * 9000)}`;
                            a.randomId = name.split(' - ')[1];
                          }
                        }
                        return (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {a.createdAt ? new Date(a.createdAt).toLocaleString() : a.updatedAt ? new Date(a.updatedAt).toLocaleString() : 'Unknown'}
                            </td>
                           <td className="px-4 py-3 text-sm text-gray-900">
                             {editingIdx === idx ? (
                               <input
                                 className="border rounded px-2 py-1 text-sm"
                                 value={editName}
                                 onChange={e => setEditName(e.target.value)}
                                 onBlur={() => {
                                   // Save name on blur
                                   a.name = editName;
                                   setEditingIdx(null);
                                 }}
                                 onKeyDown={e => {
                                   if (e.key === 'Enter') {
                                     a.name = editName;
                                     setEditingIdx(null);
                                   }
                                 }}
                                 autoFocus
                               />
                             ) : (
                               name
                             )}
                           </td>
                            <td className="px-4 py-3 flex gap-2">
                              <button
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded text-sm"
                                onClick={() => setViewAssessmentIdx(idx)}
                              >
                                View Assessment
                              </button>
                             <button
                               className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded text-sm flex items-center"
                               onClick={() => {
                                 setEditingIdx(idx);
                                 setEditName(a.name || name);
                               }}
                               title="Edit Assessment Name"
                             >
                               <FiEdit className="w-4 h-4" />
                             </button>
                             <button
                               className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-sm flex items-center"
                               onClick={() => {
                                 // Remove assessment from list (frontend only)
                                 if (window.confirm('Delete this assessment?')) {
                                   const updated = [...assessments];
                                   updated.splice(idx, 1);
                                   if (project) project.assessments = updated;
                                   setViewAssessmentIdx(null);
                                   setEditingIdx(null);
                                 }
                               }}
                               title="Delete Assessment"
                             >
                               <FiTrash2 className="w-4 h-4" />
                             </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-gray-500 px-2 py-7">No assessments available for this project.</div>
          )}
        </div>
      </div>

      {/* Presentable Slide Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Presentable Slide</h3>
        </div>
        <div className="px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-gray-700 text-sm">
            Generate or view a presentable slide summarizing your project for sharing or pitching.
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {project && project.id && (
              presentableSlide ? (
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
              )
            )}
          </div>
        </div>
      </div>
      {/* Assessment Modal */}
      <HorizontalModal open={showAssessmentModal} onClose={() => setShowAssessmentModal(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Assess Project</h2>          <ResourceFrameworkSelector
            onTierSelect={setSelectedTier}
            selectedTier={selectedTier as any}
          />
          <div className="flex justify-end mt-8">
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded disabled:opacity-50"
              disabled={!selectedTier}
              onClick={async () => {
                if (!project) return;
                // Call the new Supabase function to assess the project
                // Example:
                // const { data, error } = await supabase.functions.invoke('assess-project', {
                //   body: {
                //     hmw: project.title,
                //     description: project.description,
                //     skills: project.skills,
                //     tier: selectedTier
                //   }
                // });
                // For now, simulate assessment result:
                const now = new Date();
                let newAssessment = {
                  name: '',
                  createdAt: now.toISOString(),
                  ...project,
                  tier: selectedTier,
                  // ...other assessment fields from backend
                };
                if (!project.assessments || project.assessments.length === 0) {
                  newAssessment.name = 'Initial Assessment';
                  newAssessment.createdAt = project.created_at;
                } else {
                  newAssessment.name = `Assessment - ${Math.floor(1000 + Math.random() * 9000)}`;
                }
                // Add to assessments array
                const updated = [...(project.assessments || []), newAssessment];
                project.assessments = updated;
                setShowAssessmentModal(false);
              }}
            >
              Assess
            </button>
          </div>
        </div>
      </HorizontalModal>
      {/* View Assessment Modal */}
      <VerticalModal open={viewAssessmentIdx !== null} onClose={() => setViewAssessmentIdx(null)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Assessment Detailed View</h3>
          </div>
          <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: '75vh' }}>
            {viewAssessmentIdx !== null && assessments[viewAssessmentIdx] && (
              <IOSAssessmentCard
                assessment={assessments[viewAssessmentIdx]}
                problemTitle={project.title}
              />
            )}
          </div>
        </div>
      </VerticalModal>
    </div>
  );
};
