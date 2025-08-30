import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { ProjectService } from '@/services/projectService';
import { toast } from 'react-hot-toast';
import type { Project } from '@/types/project';
import { FiEdit, FiTrash2, FiArrowLeft, FiPlus, FiTrendingUp } from 'react-icons/fi';
import { AssessmentProblemDetailedView } from '@/components/ui/AssessmentProblemDetailedView';
import { supabase } from '@/lib/supabase';
import { HorizontalModal } from '@/components/ui/Modal';
import { ResourceFrameworkSelector } from '@/components/assessment/ResourceFrameworkSelector';
import AsIsMapModal, { getAsIsMapContent, generateAsIsMap, AsIsMapForm } from '@/components/project/AsIsMap';

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presentableSlide, setPresentableSlide] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // As-Is Map states
  const [asIsMapData, setAsIsMapData] = useState<any | null>(null);
  const [asIsMapPrompt, setAsIsMapPrompt] = useState<string>('');
  const [isGeneratingAsIsMap, setIsGeneratingAsIsMap] = useState(false);
  const [showAsIsMapModal, setShowAsIsMapModal] = useState(false);

  // Extreme User Generator states
  const [extremeUserData, setExtremeUserData] = useState<any | null>(null);
  const [isGeneratingExtremeUser, setIsGeneratingExtremeUser] = useState(false);
  const [showExtremeUserModal, setShowExtremeUserModal] = useState(false);
  const [showPainPointsModal, setShowPainPointsModal] = useState(false);
  const [extremeUserForm, setExtremeUserForm] = useState({
    painPointStep: '',
    painPointDescription: '',
    targetUserContext: ''
  });
  // Deep Empathy Research Generator states
  const [deepEmpathyData, setDeepEmpathyData] = useState<any | null>(null);
  const [isGeneratingDeepEmpathy, setIsGeneratingDeepEmpathy] = useState(false);
  const [showDeepEmpathyModal, setShowDeepEmpathyModal] = useState(false);
  const [deepEmpathyForm, setDeepEmpathyForm] = useState({
    prioritizedPainPoint: '',
    painPointDescription: '',
    selectedExtremeUser: ''
  });
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'express' | 'standard' | 'premium' | null>(null);
  const [viewAssessmentIdx, setViewAssessmentIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  const analysis = project?.analysis || [];


  const getExtremeUserContent = () => {
    return (extremeUserData?.[0]?.message?.content) ||
      (extremeUserData?.message?.content) ||
      (extremeUserData?.content) ||
      extremeUserData;
  };

  // Helper function to safely render data values (handle objects, arrays, etc.)
  const renderDataValue = (value: any) => {
    if (typeof value === 'string') {
      return value;
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.join(', ');
      } else {
        // Handle object with key-value pairs
        return Object.entries(value)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
      }
    } else if (value === null || value === undefined) {
      return 'N/A';
    } else {
      return String(value);
    }
  };

  // Helper: get first available property by alias (case-insensitive)
  const getPropByAliases = (source: any, aliases: string[]) => {
    if (!source || typeof source !== 'object') return undefined;
    const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const keyMap = Object.keys(source).reduce<Record<string, string>>((acc, k) => {
      acc[normalize(k)] = k;
      return acc;
    }, {});
    for (const alias of aliases) {
      const normalizedAlias = normalize(alias);
      if (keyMap[normalizedAlias]) return source[keyMap[normalizedAlias]];
    }
    return undefined;
  };

  // Helper: check if as-is map data exists
  const hasAsIsMapData = () => {
    if (asIsMapData) return true;
    
    if (project?.as_is_map) {
      // Handle case where as_is_map might be stored as a JSON string
      if (typeof project.as_is_map === 'string') {
        try {
          const parsed = JSON.parse(project.as_is_map);
          return parsed && parsed.content && Object.keys(parsed.content).length > 0;
        } catch (error) {
          console.error('Failed to parse as_is_map string:', error);
          return false;
        }
      }
      
      // Handle case where as_is_map is an object
      if (typeof project.as_is_map === 'object' && project.as_is_map.content) {
        return Object.keys(project.as_is_map.content).length > 0;
      }
    }
    
    return false;
  };

  // Aliases for flexible schemas
  const USER_FIELD_ALIASES = {
    demographics: ['Demographics', 'Demographic', 'Profile', 'Demographic Details'],
    amplifiedNeeds: ['Amplified Needs', 'Needs', 'High Needs'],
    painPointExperience: ['Pain Point Experience', 'Pain Points', 'Experience'],
    currentWorkarounds: ['Current Workarounds', 'Workarounds', 'Existing Workarounds'],
    uniqueChallenges: ['Unique Challenges', 'Challenges'],
    researchValue: ['Research Value', 'Value for Research', 'Why Important'],
    interviewFocus: ['Interview Focus', 'Interview Questions', 'Interview Themes'],
    barriersFaced: ['Barriers Faced', 'Barriers', 'Constraints'],
    exclusionFactors: ['Exclusion Factors', 'Exclusion', 'Systemic Exclusion']
  };

  const getUserField = (user: any, field: keyof typeof USER_FIELD_ALIASES) => {
    return renderDataValue(getPropByAliases(user, USER_FIELD_ALIASES[field]) ?? 'N/A');
  };

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

        setProject(data);
        if (data.presentable_slide) setPresentableSlide(data.presentable_slide);
        if (data.as_is_map?.content) {
          setAsIsMapData(data.as_is_map.content);
        }
        if (data.design_research?.content) {
          setExtremeUserData(data.design_research.content);
        }
        if (data.empathy_research_plan?.content) {
          setDeepEmpathyData(data.empathy_research_plan.content);
        }
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

  useEffect(() => {
    if (asIsMapPrompt && asIsMapPrompt.trim().length > 0) return;
    try {
      // Use project title instead of extracting HMW from AS-IS map content
      if (project?.title && project.title.trim().length > 0) {
        setAsIsMapPrompt(project.title);
      }
    } catch { }
  }, [project, asIsMapPrompt]);

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



  const handleGenerateExtremeUser = async () => {
    if (!extremeUserForm.painPointStep.trim() || !extremeUserForm.painPointDescription.trim() || !extremeUserForm.targetUserContext.trim()) {
      toast.error('Please fill in all fields for extreme user generation.');
      return;
    }

    setIsGeneratingExtremeUser(true);
    try {
      const requestBody = {
        "Pain Point Step": extremeUserForm.painPointStep,
        "Pain Point Description": extremeUserForm.painPointDescription,
        "Target User Context": extremeUserForm.targetUserContext
      };


      const response = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/UniversalExtreme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Save the extreme user data to the project
      if (project && project.id) {
        try {
          const { error: updateError } = await supabase
            .from('projects')
            .update({
              extreme_user_data: {
                content: data,
                generated_at: new Date().toISOString(),
                form: extremeUserForm
              }
            })
            .eq('id', project.id);

          if (updateError) {
            console.error('Error saving extreme user to database:', updateError);
            toast.error('Extreme User generated but failed to save to project.');
          } else {
            // Update local project state
            setProject({
              ...project,
              design_research: {
                content: data,
                generated_at: new Date().toISOString(),
                form: extremeUserForm
              }
            });
            toast.success('Extreme User generated and saved successfully!');
          }
        } catch (dbError) {
          console.error('Error saving extreme user to database:', dbError);
          toast.error('Extreme User generated but failed to save to project.');
        }
      }

      setExtremeUserData(data); // Store the data
      setShowExtremeUserModal(true); // Open the modal with the data

      // Clear the form after successful generation
      setExtremeUserForm({
        painPointStep: '',
        painPointDescription: '',
        targetUserContext: ''
      });
    } catch (error) {
      console.error('Error generating Extreme User:', error);
      if (error instanceof Error) {
        toast.error(`Failed to generate Extreme User: ${error.message}`);
      } else {
        toast.error('Failed to generate Extreme User. Please try again.');
      }
    } finally {
      setIsGeneratingExtremeUser(false);
    }
  };

  // Helper function to extract Deep Empathy content data
  const getDeepEmpathyContent = () => {
    return (deepEmpathyData?.[0]?.message?.content) ||
      (deepEmpathyData?.message?.content) ||
      (deepEmpathyData?.content) ||
      deepEmpathyData;
  };

  const handleGenerateDeepEmpathy = async () => {
    if (!deepEmpathyForm.prioritizedPainPoint.trim() || !deepEmpathyForm.painPointDescription.trim() || !deepEmpathyForm.selectedExtremeUser.trim()) {
      toast.error('Please fill in all fields for deep empathy generation.');
      return;
    }

    setIsGeneratingDeepEmpathy(true);
    try {
      const requestBody = {
        "Prioritized Pain Point": deepEmpathyForm.prioritizedPainPoint,
        "Pain Point Description": deepEmpathyForm.painPointDescription,
        "Selected Extreme User": deepEmpathyForm.selectedExtremeUser
      };

      const response = await fetch('http://localhost:4000/generate-deep-empathy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Deep Empathy response:', data);

      // Save the deep empathy data to the project
      if (project && project.id) {
        try {
          const { error: updateError } = await supabase
            .from('projects')
            .update({
              deep_empathy_data: {
                content: data,
                generated_at: new Date().toISOString(),
                form: deepEmpathyForm
              }
            })
            .eq('id', project.id);

          if (updateError) {
            console.error('Error saving deep empathy research to database:', updateError);
            toast.error('Deep Empathy generated but failed to save to project.');
          } else {
            setProject({
              ...project,
              empathy_research_plan: {
                content: data,
                generated_at: new Date().toISOString(),
                form: deepEmpathyForm
              }
            });
            toast.success('Deep Empathy Research generated and saved successfully!');
          }
        } catch (dbError) {
          console.error('Error saving deep empathy research to database:', dbError);
          toast.error('Deep Empathy generated but failed to save to project.');
        }
      }

      setDeepEmpathyData(data);
      setShowDeepEmpathyModal(true);

      setDeepEmpathyForm({
        prioritizedPainPoint: '',
        painPointDescription: '',
        selectedExtremeUser: ''
      });
    } catch (error) {
      console.error('Error generating Deep Empathy Research:', error);
      if (error instanceof Error) {
        toast.error(`Failed to generate Deep Empathy: ${error.message}`);
      } else {
        toast.error('Failed to generate Deep Empathy. Please try again.');
      }
    } finally {
      setIsGeneratingDeepEmpathy(false);
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
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-start gap-3 flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-indigo-700 shadow hover:bg-indigo-50 hover:text-indigo-900 transition border border-indigo-200 mt-2"
              type="button"
              aria-label="Back"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl break-words">
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
                            className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}

                {/* Extreme User Analysis Metadata */}
                {project.design_research?.generated_at && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Extreme User Analysis</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="space-y-1">
                        <p>Generated on: {new Date(project.design_research.generated_at).toLocaleString()}</p>
                        {project.design_research.form && (
                          <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="font-medium text-green-800 mb-2">Generation Parameters:</p>
                            <p className="text-sm"><span className="font-medium">Step:</span> {project.design_research.form.painPointStep}</p>
                            <p className="text-sm"><span className="font-medium">Description:</span> {project.design_research.form.painPointDescription}</p>
                            <p className="text-sm"><span className="font-medium">User Context:</span> {project.design_research.form.targetUserContext}</p>
                          </div>
                        )}
                      </div>
                    </dd>
                  </div>
                )}

                {/* Deep Empathy Research Metadata */}
                {project.empathy_research_plan?.generated_at && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Deep Empathy Research</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="space-y-1">
                        <p>Generated on: {new Date(project.empathy_research_plan.generated_at).toLocaleString()}</p>
                        {project.empathy_research_plan.form && (
                          <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="font-medium text-purple-800 mb-2">Generation Parameters:</p>
                            <p className="text-sm"><span className="font-medium">Prioritized Pain Point:</span> {project.empathy_research_plan.form.prioritizedPainPoint}</p>
                            <p className="text-sm"><span className="font-medium">Description:</span> {project.empathy_research_plan.form.painPointDescription}</p>
                            <p className="text-sm"><span className="font-medium">Selected Extreme User:</span> {project.empathy_research_plan.form.selectedExtremeUser}</p>
                          </div>
                        )}
                      </div>
                    </dd>
                  </div>
                )}

                {/* Presentable Slide */}
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Presentable Slide</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {presentableSlide ? 'Slide generated and ready for viewing' : 'No slide generated yet'}
                      </span>
                      {project && project.id && (
                        presentableSlide ? (
                          <button
                            className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
                            onClick={() => navigate(`/projects/${project.id}/slide`)}
                          >
                            View Slide
                          </button>
                        ) : (
                          <button
                            className="px-3 py-1.5 rounded bg-yellow-500 text-white text-xs font-medium hover:bg-yellow-600 transition"
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

                {/* Project Canvas */}
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Project Canvas</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {project.canvas ? 'Canvas available for collaboration' : 'No canvas created yet'}
                      </span>
                      {project && project.id && (
                        <button
                          className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition"
                          onClick={() => navigate(`/projects/${project.id}/canvas`)}
                        >
                          {project.canvas ? 'View Canvas' : 'Create Canvas'}
                        </button>
                      )}
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* analysis Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Analysis</h3>
              </div>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={() => setShowAssessmentModal(true)}
              >
                <FiTrendingUp className="-ml-1 mr-2 h-5 w-5" />
                Analyse Project
              </button>
            </div>
            <div className="px-4 py-0">
              {analysis.length > 0 ? (
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
                        {[...analysis]
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
                                name = 'Initial Analysis';
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
                                    View Analysis
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
                                        const updated = [...analysis];
                                        updated.splice(idx, 1);
                                        if (project) project.analysis = updated;
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
                <div className="text-gray-500 px-2 py-7">No analysis available for this project.</div>
              )}
            </div>
          </div>

          {/* As is Map Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">As is Map</h3>
            </div>
            <div className="px-8 py-5">
              <div className="text-gray-700 text-sm mb-4">
                Generate an "As is Map" to visualize the current state of your project or process.
              </div>

              {!hasAsIsMapData() ? (
                <AsIsMapForm
                  projectId={project?.id || ''}
                  prompt={asIsMapPrompt}
                  onPromptChange={setAsIsMapPrompt}
                  onGenerate={(data) => {
                    setAsIsMapData(data);
                    setAsIsMapPrompt('');
                  }}
                  onGeneratingChange={setIsGeneratingAsIsMap}
                />
              ) : (
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                    onClick={() => {
                      // Navigate to the dedicated As-Is Map page
                      navigate(`/projects/${project?.id}/as_is_map`);
                    }}
                  >
                    View AS-IS Map
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-gray-600 text-white font-medium hover:bg-gray-700 transition"
                    onClick={() => {
                      setAsIsMapData(null);
                      setAsIsMapPrompt('');
                    }}
                  >
                    Generate New
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Extreme User Generator for Design Research Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Extreme User Generator for Design Research</h3>
                <p className="text-gray-700 text-sm mt-2">
                  Generate extreme user personas to identify edge cases and design opportunities for your project.
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                onClick={() => setShowPainPointsModal(true)}
                title="Choose from AS-IS Map Pain Points"
              >
                Choose
              </button>
            </div>
            <div className="px-8 py-5">
              <div className="space-y-4">
                <div>
                  <label htmlFor="painPointStep" className="block text-sm font-medium text-gray-700 mb-2">
                    Pain Point Step
                  </label>
                  <input
                    type="text"
                    id="painPointStep"
                    value={extremeUserForm.painPointStep}
                    onChange={(e) => setExtremeUserForm({ ...extremeUserForm, painPointStep: e.target.value })}
                    placeholder="e.g., Step 2.1: Harvest timing decisions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="painPointDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Pain Point Description
                  </label>
                  <textarea
                    id="painPointDescription"
                    value={extremeUserForm.painPointDescription}
                    onChange={(e) => setExtremeUserForm({ ...extremeUserForm, painPointDescription: e.target.value })}
                    rows={3}
                    placeholder="Describe the specific pain point or challenge..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="targetUserContext" className="block text-sm font-medium text-gray-700 mb-2">
                    Target User Context
                  </label>
                  <textarea
                    id="targetUserContext"
                    value={extremeUserForm.targetUserContext}
                    onChange={(e) => setExtremeUserForm({ ...extremeUserForm, targetUserContext: e.target.value })}
                    rows={3}
                    placeholder="Describe the user's context, constraints, and environment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleGenerateExtremeUser}
                    disabled={isGeneratingExtremeUser}
                    className="px-4 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {isGeneratingExtremeUser ? 'Generating...' : 'Generate Extreme User'}
                  </button>
                  {extremeUserData && (
                    <button
                      className="px-4 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                      onClick={() => setShowExtremeUserModal(true)}
                    >
                      View Extreme User
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Universal Deep Empathy Research Generator for Primary Research Section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Universal Deep Empathy Research Generator for Primary Research</h3>
              <p className="text-gray-700 text-sm mt-2">
                Generate universal deep empathy insights for primary research, mirroring the Extreme User workflow.
              </p>
            </div>
            <div className="px-8 py-5">
              <div className="space-y-4">
                <div>
                  <label htmlFor="prioritizedPainPoint" className="block text-sm font-medium text-gray-700 mb-2">
                    Prioritized Pain Point
                  </label>
                  <input
                    type="text"
                    id="prioritizedPainPoint"
                    value={deepEmpathyForm.prioritizedPainPoint}
                    onChange={(e) => setDeepEmpathyForm({ ...deepEmpathyForm, prioritizedPainPoint: e.target.value })}
                    placeholder="e.g., Woman travels to healthcare facility or contacts healthcare provider"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="deepPainPointDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Pain Point Description
                  </label>
                  <textarea
                    id="deepPainPointDescription"
                    value={deepEmpathyForm.painPointDescription}
                    onChange={(e) => setDeepEmpathyForm({ ...deepEmpathyForm, painPointDescription: e.target.value })}
                    rows={3}
                    placeholder="Transportation barriers, long distances, high costs preventing initial prenatal care access"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="selectedExtremeUser" className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Extreme User
                  </label>
                  <textarea
                    id="selectedExtremeUser"
                    value={deepEmpathyForm.selectedExtremeUser}
                    onChange={(e) => setDeepEmpathyForm({ ...deepEmpathyForm, selectedExtremeUser: e.target.value })}
                    rows={3}
                    placeholder="The Remote Island Expectant Mother - 28-year-old woman living on river island, accessible only by boat, 45km from mainland healthcare"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleGenerateDeepEmpathy}
                    disabled={isGeneratingDeepEmpathy}
                    className="px-4 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {isGeneratingDeepEmpathy ? 'Generating...' : 'Generate Deep Empathy Research'}
                  </button>
                  {deepEmpathyData && (
                    <button
                      className="px-4 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                      onClick={() => setShowDeepEmpathyModal(true)}
                    >
                      View Deep Empathy Research
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* Assessment Modal */}
          <HorizontalModal open={showAssessmentModal} onClose={() => setShowAssessmentModal(false)}>
            <div className="p-6 no-scrollbar">
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
                    if (!project.analysis || project.analysis.length === 0) {
                      newAssessment.name = 'Initial Analysis';
                      newAssessment.createdAt = project.created_at;
                    } else {
                      newAssessment.name = `Assessment - ${Math.floor(1000 + Math.random() * 9000)}`;
                    }
                    // Add to analysis array
                    const updated = [...(project.analysis || []), newAssessment];
                    project.analysis = updated;
                    setShowAssessmentModal(false);
                  }}
                >
                  Assess
                </button>
              </div>
            </div>
          </HorizontalModal>
          {/* View Assessment Modal (Reusable) */}
          <AssessmentProblemDetailedView
            open={viewAssessmentIdx !== null && !!analysis[viewAssessmentIdx]}
            onClose={() => setViewAssessmentIdx(null)}
            assessment={viewAssessmentIdx !== null ? analysis[viewAssessmentIdx] : undefined}
            problemTitle={project.title}
            viewType="assessment"
          />

          {/* Extreme User Modal */}
          <HorizontalModal open={showExtremeUserModal} onClose={() => setShowExtremeUserModal(false)}>
            <div className="p-6 max-w-6xl max-h-[70vh] overflow-y-auto pr-4 no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Extreme User Analysis</h2>
                  {project?.design_research?.generated_at && (
                    <p className="text-sm text-gray-500 mt-1">
                      Generated on: {new Date(project.design_research.generated_at).toLocaleString()}
                    </p>
                  )}
                  {/* Removed form parameter display from header as requested */}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowExtremeUserModal(false);
                      // You can add regenerate functionality here if needed
                    }}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
              {extremeUserData && (
                <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                  <div>
                    {getExtremeUserContent() ? (
                      <div className="space-y-6">
                        {/* Pain Point Analysis (moved to top) */}
                        {getExtremeUserContent()['PAIN POINT ANALYSIS'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                              🔎 Pain Point Analysis
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <span className="font-semibold text-gray-700">Step:</span>
                                <span className="text-gray-600 ml-2">
                                  {renderDataValue(getExtremeUserContent()['PAIN POINT ANALYSIS']?.['Step'])}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">Description:</span>
                                <span className="text-gray-600 ml-2">
                                  {renderDataValue(getExtremeUserContent()['PAIN POINT ANALYSIS']?.['Description'])}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">User Context:</span>
                                <span className="text-gray-700 ml-2">
                                  {renderDataValue(getExtremeUserContent()['PAIN POINT ANALYSIS']?.['User Context'])}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Design Implications */}
                        {getExtremeUserContent()['DESIGN IMPLICATIONS'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
                              💡 Design Implications
                            </h3>
                            <div className="space-y-4">
                              {(() => {
                                const di = getExtremeUserContent()['DESIGN IMPLICATIONS'];
                                const renderBulletsOrText = (val: any) => {
                                  if (Array.isArray(val)) {
                                    return (
                                      <ul className="mt-2 space-y-1">
                                        {val.map((item: any, idx: number) => (
                                          <li key={idx} className="text-gray-700 ml-4">• {renderDataValue(item)}</li>
                                        ))}
                                      </ul>
                                    );
                                  }
                                  return <span className="text-gray-700 ml-2">{renderDataValue(val)}</span>;
                                };
                                return (
                                  <>
                                    <div>
                                      <span className="font-semibold text-indigo-700">Power Users:</span>
                                      {renderBulletsOrText(di['Power User Insights'])}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-indigo-700">Marginalized Users:</span>
                                      {renderBulletsOrText(di['Marginalized User Insights'])}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-indigo-700">Solution Opportunities:</span>
                                      {renderBulletsOrText(di['Solution Opportunities'])}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-indigo-700">Implementation Considerations:</span>
                                      {renderBulletsOrText(di['Implementation Considerations'])}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Extreme User Profiles */}
                        {(() => {
                          const profiles = getPropByAliases(getExtremeUserContent(), [
                            'EXTREME USER PROFILES',
                            'Extreme User Profiles',
                            'Extreme Users',
                            'User Extremes'
                          ]);
                          if (!profiles) return null;

                          const powerUsers = getPropByAliases(profiles, [
                            'POWER USERS (High-Need Extreme)',
                            'Power Users',
                            'High-Need Extreme Users',
                            'High Need Users'
                          ]) || [];
                          const marginalizedUsers = getPropByAliases(profiles, [
                            'MARGINALIZED USERS (Barrier-Facing Extreme)',
                            'Marginalized Users',
                            'Barrier-Facing Users',
                            'Barrier Facing Users'
                          ]) || [];

                          return (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                                👩‍👩‍👧 Extreme User Profiles
                              </h3>

                              {Array.isArray(powerUsers) && powerUsers.length > 0 && (
                                <div className="mb-6">
                                  <h4 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">🔹 Power Users</h4>
                                  <div className="space-y-4">
                                    {powerUsers.map((user: any, index: number) => (
                                      <div key={index} className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <h5 className="font-bold text-green-800 text-lg mb-3 border-b border-green-200 pb-2">
                                          {renderDataValue(getPropByAliases(user, ['Descriptive Name/Title', 'Title', 'Name']) || `User ${index + 1}`)}
                                        </h5>
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="font-semibold text-green-700">Demographics:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'demographics')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-green-700">Amplified Needs:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'amplifiedNeeds')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-green-700">Pain Point Experience:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'painPointExperience')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-green-700">Current Workarounds:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'currentWorkarounds')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-green-700">Unique Challenges:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'uniqueChallenges')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-green-700">Research Value:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'researchValue')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-green-700">Interview Focus:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'interviewFocus')}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {Array.isArray(marginalizedUsers) && marginalizedUsers.length > 0 && (
                                <div>
                                  <h4 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">🔹 Marginalized Users</h4>
                                  <div className="space-y-4">
                                    {marginalizedUsers.map((user: any, index: number) => (
                                      <div key={index} className="bg-red-50 p-4 rounded-lg border border-red-200">
                                        <h5 className="font-bold text-red-800 text-lg mb-3 border-b border-red-200 pb-2">
                                          {renderDataValue(getPropByAliases(user, ['Descriptive Name/Title', 'Title', 'Name']) || `User ${index + 1}`)}
                                        </h5>
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="font-semibold text-red-700">Demographics:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'demographics')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-red-700">Barriers Faced:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'barriersFaced')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-red-700">Pain Point Experience:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'painPointExperience')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-red-700">Exclusion Factors:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'exclusionFactors')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-red-700">Unique Challenges:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'uniqueChallenges')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-red-700">Research Value:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'researchValue')}</span>
                                          </div>
                                          <div>
                                            <span className="font-semibold text-red-700">Interview Focus:</span>
                                            <span className="text-gray-700 ml-2">{getUserField(user, 'interviewFocus')}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Pain Point Analysis */}
                        {getExtremeUserContent()['PAIN POINT ANALYSIS'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                              🔎 Pain Point Analysis
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <span className="font-semibold text-gray-700">Step:</span>
                                <span className="text-gray-600 ml-2">
                                  {renderDataValue(getExtremeUserContent()['PAIN POINT ANALYSIS']?.['Step'])}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">Description:</span>
                                <span className="text-gray-600 ml-2">
                                  {renderDataValue(getExtremeUserContent()['PAIN POINT ANALYSIS']?.['Description'])}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">User Context:</span>
                                <span className="text-gray-700 ml-2">
                                  {renderDataValue(getExtremeUserContent()['PAIN POINT ANALYSIS']?.['User Context'])}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Research Strategy */}
                        {getExtremeUserContent()['RESEARCH STRATEGY'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                              🧪 Research Strategy
                            </h3>
                            <div className="space-y-4">
                              {(() => {
                                const rs = getExtremeUserContent()['RESEARCH STRATEGY'];
                                const renderBulletsOrText = (val: any) => {
                                  if (Array.isArray(val)) {
                                    return (
                                      <ul className="mt-2 space-y-1">
                                        {val.map((item: any, idx: number) => (
                                          <li key={idx} className="text-gray-700 ml-4">• {renderDataValue(item)}</li>
                                        ))}
                                      </ul>
                                    );
                                  }
                                  return <span className="text-gray-700 ml-2">{renderDataValue(val)}</span>;
                                };
                                return (
                                  <>
                                    <div>
                                      <span className="font-semibold text-purple-700">User Recruitment:</span>
                                      {renderBulletsOrText(rs['User Recruitment'])}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-purple-700">Interview Approach:</span>
                                      {renderBulletsOrText(rs['Interview Approach'])}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-purple-700">Key Insights to Explore:</span>
                                      {renderBulletsOrText(rs['Key Insights to Explore'])}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-purple-700">Expected Breakthrough Areas:</span>
                                      {renderBulletsOrText(rs['Expected Breakthrough Areas'])}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fallback to show raw data if structure doesn't match */
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Raw Data (Fallback)</h3>
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <strong>⚠️ Data Structure Issue:</strong> The data format doesn't match the expected structure.
                          Please check the debug information above.
                        </div>
                        <pre className="text-sm text-gray-700 overflow-auto max-h-96">
                          {JSON.stringify(extremeUserData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </React.Suspense>
              )}
            </div>
          </HorizontalModal>

          {/* Deep Empathy Modal */}
          <HorizontalModal open={showDeepEmpathyModal} onClose={() => setShowDeepEmpathyModal(false)}>
            <div className="p-6 max-w-6xl max-h-[70vh] overflow-y-auto pr-4 no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Deep Empathy Research</h2>
                  {project?.empathy_research_plan?.generated_at && (
                    <p className="text-sm text-gray-500 mt-1">
                      Generated on: {new Date(project.empathy_research_plan.generated_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeepEmpathyModal(false)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
              {deepEmpathyData ? (
                <div className="space-y-6">
                  {/* Attempt to render structured content if present; fallback to JSON */}
                  {(() => {
                    const content = getDeepEmpathyContent();
                    if (!content || typeof content !== 'object') {
                      return (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <pre className="text-xs text-gray-700 overflow-auto max-h-96">{JSON.stringify(content || deepEmpathyData, null, 2)}</pre>
                        </div>
                      );
                    }

                    const toArray = (val: any) => Array.isArray(val) ? val : (val ? [val] : []);

                    return (
                      <div className="space-y-6">
                        {content['RESEARCH_CONTEXT_ANALYSIS'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Research Context</h3>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-semibold text-gray-700">Prioritized Pain Point:</span> <span className="text-gray-700 ml-1">{renderDataValue(content['RESEARCH_CONTEXT_ANALYSIS']?.['Pain Point'])}</span></div>
                              <div><span className="font-semibold text-gray-700">Description:</span> <span className="text-gray-700 ml-1">{renderDataValue(content['RESEARCH_CONTEXT_ANALYSIS']?.['Description'])}</span></div>
                              <div><span className="font-semibold text-gray-700">Extreme User:</span> <span className="text-gray-700 ml-1">{renderDataValue(content['RESEARCH_CONTEXT_ANALYSIS']?.['Extreme User'])}</span></div>
                              <div><span className="font-semibold text-gray-700">Research Objective:</span> <span className="text-gray-700 ml-1">{renderDataValue(content['RESEARCH_CONTEXT_ANALYSIS']?.['Research Objective'])}</span></div>
                            </div>
                          </div>
                        )}

                        {content['INSIGHT_SYNTHESIS_FRAMEWORK'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-indigo-800 mb-4">💡 Design Implications</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">Belief Insights</h4>
                                <ul className="space-y-1 text-sm">{toArray(content['INSIGHT_SYNTHESIS_FRAMEWORK']?.['Belief Insights']).map((x: any, i: number) => (<li key={i} className="text-gray-700">• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">Behavioral Insights</h4>
                                <ul className="space-y-1 text-sm">{toArray(content['INSIGHT_SYNTHESIS_FRAMEWORK']?.['Behavioral Insights']).map((x: any, i: number) => (<li key={i} className="text-gray-700">• {renderDataValue(x)}</li>))}</ul>
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">Design Implications</h4>
                                <ul className="space-y-1 text-sm">{toArray(content['INSIGHT_SYNTHESIS_FRAMEWORK']?.['Design Implications']).map((x: any, i: number) => (<li key={i} className="text-gray-700">• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">Innovation Opportunities</h4>
                                <ul className="space-y-1 text-sm">{toArray(content['INSIGHT_SYNTHESIS_FRAMEWORK']?.['Innovation Opportunities']).map((x: any, i: number) => (<li key={i} className="text-gray-700">• {renderDataValue(x)}</li>))}</ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {content['RESEARCH_EXECUTION_GUIDANCE'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-purple-800 mb-4">🧪 Research Strategy</h3>
                            <div className="grid md:grid-cols-3 gap-6 text-sm">
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">Pre-Research Preparation</h4>
                                <ul className="space-y-1">{toArray(content['RESEARCH_EXECUTION_GUIDANCE']?.['Pre-Research Preparation']).map((x: any, i: number) => (<li key={i} className="text-gray-700">• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">During Research Best Practices</h4>
                                <ul className="space-y-1">{toArray(content['RESEARCH_EXECUTION_GUIDANCE']?.['During Research Best Practices']).map((x: any, i: number) => (<li key={i} className="text-gray-700">• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">Post-Research Analysis</h4>
                                <ul className="space-y-1">{toArray(content['RESEARCH_EXECUTION_GUIDANCE']?.['Post-Research Analysis']).map((x: any, i: number) => (<li key={i} className="text-gray-700">• {renderDataValue(x)}</li>))}</ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {content['EMPATHY_TECHNIQUE_1_OBSERVATION'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Empathy Technique 1: Observation</h3>
                            <div className="grid md:grid-cols-3 gap-6 text-sm">
                              <div>
                                <h4 className="font-semibold mb-2">What to Document</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_1_OBSERVATION']?.['What to Document']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Focus Areas</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_1_OBSERVATION']?.['Observation Focus Areas']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Key Questions</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_1_OBSERVATION']?.['Key Questions for Observation']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {content['EMPATHY_TECHNIQUE_2_IMMERSION'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Empathy Technique 2: Immersion</h3>
                            <div className="grid md:grid-cols-4 gap-6 text-sm">
                              <div>
                                <h4 className="font-semibold mb-2">What to Experience</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_2_IMMERSION']?.['What to Experience']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Immersion Activities</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_2_IMMERSION']?.['Immersion Activities']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Immersion Documentation</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_2_IMMERSION']?.['Immersion Documentation']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Key Insights to Capture</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_2_IMMERSION']?.['Key Insights to Capture']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {content['EMPATHY_TECHNIQUE_3_ROLE_PLAYING'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Empathy Technique 3: Role-Playing</h3>
                            <div className="grid md:grid-cols-4 gap-6 text-sm">
                              <div>
                                <h4 className="font-semibold mb-2">Documentation Focus</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_3_ROLE_PLAYING']?.['Documentation Focus']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Role-Playing Scenarios</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_3_ROLE_PLAYING']?.['Role-Playing Scenarios']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Role-Playing Variables</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_3_ROLE_PLAYING']?.['Role-Playing Variables']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Key Questions</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_3_ROLE_PLAYING']?.['Key Questions for Role-Playing']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {content['EMPATHY_TECHNIQUE_4_SHADOWING'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Empathy Technique 4: Shadowing</h3>
                            <div className="grid md:grid-cols-4 gap-6 text-sm">
                              <div>
                                <h4 className="font-semibold mb-2">What to Shadow</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_4_SHADOWING']?.['What to Shadow']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Focus Areas</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_4_SHADOWING']?.['Shadowing Focus Areas']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Documentation</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_4_SHADOWING']?.['Shadowing Documentation']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Key Insights</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_4_SHADOWING']?.['Key Insights from Shadowing']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {content['EMPATHY_TECHNIQUE_5_CONVERSATION'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Empathy Technique 5: Conversation (Deep Interviews)</h3>
                            <div className="grid md:grid-cols-2 gap-6 text-sm">
                              <div>
                                <h4 className="font-semibold mb-2">Opening Questions (Problem Context)</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_5_CONVERSATION']?.['DEEP INTERVIEW QUESTIONS (Following Justin Wilcox Principles)']?.['Opening Questions (Problem Context)']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Follow-up Probes</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_5_CONVERSATION']?.['DEEP INTERVIEW QUESTIONS (Following Justin Wilcox Principles)']?.['FOLLOW-UP PROBES']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-6 text-sm mt-4">
                              <div>
                                <h4 className="font-semibold mb-2">Belief-Uncovering Questions</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_5_CONVERSATION']?.['DEEP INTERVIEW QUESTIONS (Following Justin Wilcox Principles)']?.['Belief-Uncovering Questions']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Context-Deepening Questions</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_5_CONVERSATION']?.['DEEP INTERVIEW QUESTIONS (Following Justin Wilcox Principles)']?.['Context-Deepening Questions']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Behavior-Exploring Questions</h4>
                                <ul className="space-y-1">{toArray(content['EMPATHY_TECHNIQUE_5_CONVERSATION']?.['DEEP INTERVIEW QUESTIONS (Following Justin Wilcox Principles)']?.['Behavior-Exploring Questions']).map((x: any, i: number) => (<li key={i}>• {renderDataValue(x)}</li>))}</ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Fallback: if none of the expected sections present, dump formatted JSON */}
                        {!content['RESEARCH_CONTEXT_ANALYSIS'] &&
                          !content['INSIGHT_SYNTHESIS_FRAMEWORK'] &&
                          !content['RESEARCH_EXECUTION_GUIDANCE'] &&
                          !content['EMPATHY_TECHNIQUE_1_OBSERVATION'] &&
                          !content['EMPATHY_TECHNIQUE_2_IMMERSION'] &&
                          !content['EMPATHY_TECHNIQUE_3_ROLE_PLAYING'] &&
                          !content['EMPATHY_TECHNIQUE_4_SHADOWING'] &&
                          !content['EMPATHY_TECHNIQUE_5_CONVERSATION'] && (
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <pre className="text-xs text-gray-700 overflow-auto max-h-96">{JSON.stringify(content, null, 2)}</pre>
                            </div>
                          )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">No Deep Empathy data available</div>
              )}
            </div>
          </HorizontalModal>
          {/* Pain Points Picker Modal */}
          <HorizontalModal open={showPainPointsModal} onClose={() => setShowPainPointsModal(false)}>
            <div className="p-6 max-w-5xl max-h-[70vh] overflow-y-auto pr-4 no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Choose a Pain Point</h2>
                <button
                  onClick={() => setShowPainPointsModal(false)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
              {(() => {
                try {
                  const content = getAsIsMapContent(asIsMapData, project?.as_is_map);
                  const painAnalysis = (content && typeof content === 'object') ? content['PAIN POINT ANALYSIS'] : undefined;
                  const entries = painAnalysis && typeof painAnalysis === 'object' ? Object.entries(painAnalysis as any) : [];
                  if (!entries || entries.length === 0) {
                    return <div className="text-gray-500">No pain points available. Generate an AS-IS Map first.</div>;
                  }
                  return (
                    <div className="space-y-3">
                      {entries.map(([stepKey, painInfo]: [string, any]) => {
                        const isString = typeof painInfo === 'string';
                        const painLevelFromString = isString ? (painInfo.match(/Pain\s*Level\s*(\d+)/i)?.[1] || null) : null;
                        const painLevel = !isString ? painInfo?.Pain_Level : painLevelFromString;
                        const description = !isString ? painInfo?.Description : painInfo;
                        return (
                          <button
                            key={stepKey}
                            onClick={() => {
                              setExtremeUserForm({
                                ...extremeUserForm,
                                painPointStep: stepKey,
                                painPointDescription: String(description || '')
                              });
                              setShowPainPointsModal(false);
                            }}
                            className="w-full text-left p-4 rounded border hover:border-indigo-300 hover:bg-indigo-50 transition"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-gray-900">{stepKey.replace(/_/g, ' ')}</span>
                              {painLevel && (
                                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">Pain Level: {painLevel}/10</span>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm">{String(description)}</p>
                          </button>
                        );
                      })}
                    </div>
                  );
                } catch {
                  return <div className="text-gray-500">Unable to load pain points.</div>;
                }
              })()}
            </div>
          </HorizontalModal>

          {/* AS-IS Map Modal */}
          <AsIsMapModal
            open={showAsIsMapModal}
            onClose={() => setShowAsIsMapModal(false)}
            asIsMapData={asIsMapData}
            project={project}
            setAsIsMapPrompt={setAsIsMapPrompt}
            getAsIsMapContent={(data, projectData) => getAsIsMapContent(data, projectData)}
          />
        </div>
      </div>
    </div>
  );
};
