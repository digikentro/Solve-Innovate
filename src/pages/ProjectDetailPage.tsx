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
  
  // Behavioral Insights Generator states
  const [behavioralInsightsData, setBehavioralInsightsData] = useState<any | null>(null);
  const [isGeneratingBehavioralInsights, setIsGeneratingBehavioralInsights] = useState(false);
  const [showBehavioralInsightsModal, setShowBehavioralInsightsModal] = useState(false);
  const [behavioralInsightsForm, setBehavioralInsightsForm] = useState({
    painPointInvestigated: '',
    extremeUserType: ''
  });
  
  // Psychological Analysis Generator states
  const [psychologicalAnalysisData, setPsychologicalAnalysisData] = useState<any | null>(null);
  const [isGeneratingPsychologicalAnalysis, setIsGeneratingPsychologicalAnalysis] = useState(false);
  const [showPsychologicalAnalysisModal, setShowPsychologicalAnalysisModal] = useState(false);
  const [psychologicalAnalysisForm, setPsychologicalAnalysisForm] = useState({
    painPointInvestigated: '',
    extremeUserType: ''
  });
  
  // Transformation Framework Generator states
  const [transformationFrameworkData, setTransformationFrameworkData] = useState<any | null>(null);
  const [isGeneratingTransformationFramework, setIsGeneratingTransformationFramework] = useState(false);
  const [transformationFrameworkForm, setTransformationFrameworkForm] = useState({
    painPointInvestigated: '',
    extremeUserType: ''
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

  // Helper: check if extreme user data exists
  const hasExtremeUserData = () => {
    if (extremeUserData) return true;
    
    if (project?.extreme_user_data) {
      // Handle case where extreme_user_data might be stored as a JSON string
      if (typeof project.extreme_user_data === 'string') {
        try {
          const parsed = JSON.parse(project.extreme_user_data);
          return parsed && parsed.content && Object.keys(parsed.content).length > 0;
        } catch (error) {
          console.error('Failed to parse extreme_user_data string:', error);
          return false;
        }
      }
      
      // Handle case where extreme_user_data is an object
      if (typeof project.extreme_user_data === 'object' && project.extreme_user_data.content) {
        return Object.keys(project.extreme_user_data.content).length > 0;
      }
    }
    
    return false;
  };

  // Helper: check if deep empathy data exists
  const hasDeepEmpathyData = () => {
    if (deepEmpathyData) return true;
    
    if (project?.deep_empathy_data) {
      // Handle case where deep_empathy_data might be stored as a JSON string
      if (typeof project.deep_empathy_data === 'string') {
        try {
          const parsed = JSON.parse(project.deep_empathy_data);
          return parsed && parsed.content && Object.keys(parsed.content).length > 0;
        } catch (error) {
          console.error('Failed to parse deep_empathy_data string:', error);
          return false;
        }
      }
      
      // Handle case where deep_empathy_data is an object
      if (typeof project.deep_empathy_data === 'object' && project.deep_empathy_data.content) {
        return Object.keys(project.deep_empathy_data.content).length > 0;
      }
    }
    
    return false;
  };

  // Helper: check if behavioral insights data exists
  const hasBehavioralInsightsData = () => {
    if (behavioralInsightsData) return true;
    
    if (project?.behavioral_insights_data) {
      // Handle case where behavioral_insights_data might be stored as a JSON string
      if (typeof project.behavioral_insights_data === 'string') {
        try {
          const parsed = JSON.parse(project.behavioral_insights_data);
          return parsed && parsed.content && Object.keys(parsed.content).length > 0;
        } catch (error) {
          console.error('Failed to parse behavioral_insights_data string:', error);
          return false;
        }
      }
      
      // Handle case where behavioral_insights_data is an object
      if (typeof project.behavioral_insights_data === 'object' && project.behavioral_insights_data.content) {
        return Object.keys(project.behavioral_insights_data.content).length > 0;
      }
    }
    
    return false;
  };

  // Helper: check if psychological analysis data exists
  const hasPsychologicalAnalysisData = () => {
    if (psychologicalAnalysisData) return true;
    
    if (project?.psychological_analysis) {
      // Handle case where psychological_analysis might be stored as a JSON string
      if (typeof project.psychological_analysis === 'string') {
        try {
          const parsed = JSON.parse(project.psychological_analysis);
          return parsed && parsed.content && Object.keys(parsed.content).length > 0;
        } catch (error) {
          console.error('Failed to parse psychological_analysis string:', error);
          return false;
        }
      }
      
      // Handle case where psychological_analysis is an object
      if (typeof project.psychological_analysis === 'object' && project.psychological_analysis.content) {
        return Object.keys(project.psychological_analysis.content).length > 0;
      }
    }
    
    return false;
  };

  // Helper: check if transformation framework data exists
  const hasTransformationFrameworkData = () => {
    if (transformationFrameworkData) return true;
    
    if (project?.transformation_framework) {
      if (typeof project.transformation_framework === 'string') {
        try {
          const parsed = JSON.parse(project.transformation_framework);
          return parsed && parsed.content && Object.keys(parsed.content).length > 0;
        } catch (error) {
          console.error('Failed to parse transformation_framework string:', error);
          return false;
        }
      }
      if (typeof project.transformation_framework === 'object' && project.transformation_framework.content) {
        return Object.keys(project.transformation_framework.content).length > 0;
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
        if (data.extreme_user_data?.content) {
          setExtremeUserData(data.extreme_user_data.content);
        }
        if (data.deep_empathy_data?.content) {
          setDeepEmpathyData(data.deep_empathy_data.content);
        }
        if (data.psychological_analysis) {
          // Handle case where psychological_analysis might be stored as a JSON string
          if (typeof data.psychological_analysis === 'string') {
            try {
              const parsed = JSON.parse(data.psychological_analysis);
              if (parsed && parsed.content && Object.keys(parsed.content).length > 0) {
                setPsychologicalAnalysisData(parsed);
              }
            } catch (error) {
              console.error('Failed to parse psychological_analysis string:', error);
            }
          } else if (data.psychological_analysis.content) {
            setPsychologicalAnalysisData(data.psychological_analysis);
          }
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
        "project_id": project?.id || '',
        "Pain Point Step": extremeUserForm.painPointStep,
        "Pain Point Description": extremeUserForm.painPointDescription,
        "Target User Context": extremeUserForm.targetUserContext
      };

      // Log the request to console
      console.log('Sending Extreme User Generation Request:', requestBody);

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

      setExtremeUserData(data); // Store the data locally
      toast.success('Extreme User generated successfully!');
      
      // Navigate to the dedicated Extreme User page
      navigate(`/projects/${project?.id}/extreme_user`);

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
        "project_id": project?.id || '',
        "Prioritized Pain Point": deepEmpathyForm.prioritizedPainPoint,
        "Pain Point Description": deepEmpathyForm.painPointDescription,
        "Selected Extreme User": deepEmpathyForm.selectedExtremeUser
      };

      // Log the request to console
      console.log('Sending Deep Empathy Generation Request:', requestBody);

      const response = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/UniversalDeepEmpathy', {
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

      let data;
      try {
        data = await response.json();
        console.log('Deep Empathy response:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        const responseText = await response.text();
        console.error('Raw response:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      setDeepEmpathyData(data); // Store the data locally
      toast.success('Deep Empathy Research generated successfully!');
      
      // Navigate to the dedicated Deep Empathy page
      navigate(`/projects/${project?.id}/deep_empathy`);

      // Clear the form after successful generation
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

  const handleGenerateBehavioralInsights = async () => {
    if (!behavioralInsightsForm.painPointInvestigated.trim() || !behavioralInsightsForm.extremeUserType.trim()) {
      toast.error('Please fill in all fields for behavioral insights generation.');
      return;
    }

    setIsGeneratingBehavioralInsights(true);
    try {
      const requestBody = {
        "project_id": project?.id || '',
        "Pain Point Investigated": behavioralInsightsForm.painPointInvestigated,
        "Extreme User Type": behavioralInsightsForm.extremeUserType
      };

      // Log the request to console
      console.log('Sending Behavioral Insights Generation Request:', requestBody);

      const response = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/BehavioralInsights', {
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

      let data;
      try {
        data = await response.json();
        console.log('Behavioral Insights response:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        const responseText = await response.text();
        console.error('Raw response:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      setBehavioralInsightsData(data); // Store the dat a locally
      toast.success('Behavioral Insights generated successfully!');
      
      // Show the modal with results
      setShowBehavioralInsightsModal(true);

      // Clear the form after successful generation
      setBehavioralInsightsForm({
        painPointInvestigated: '',
        extremeUserType: ''
      });
    } catch (error) {
      console.error('Error generating Behavioral Insights:', error);
      if (error instanceof Error) {
        toast.error(`Failed to generate Behavioral Insights: ${error.message}`);
      } else {
        toast.error('Failed to generate Behavioral Insights. Please try again.');
      }
    } finally {
      setIsGeneratingBehavioralInsights(false);
    }
  };

  const handleGeneratePsychologicalAnalysis = async () => {
    if (!psychologicalAnalysisForm.painPointInvestigated.trim() || !psychologicalAnalysisForm.extremeUserType.trim()) {
      toast.error('Please fill in all fields for psychological analysis generation.');
      return;
    }

    setIsGeneratingPsychologicalAnalysis(true);
    try {
      const requestBody = {
        "project_id": project?.id || '',
        "painPointInvestigated": psychologicalAnalysisForm.painPointInvestigated,
        "extremeUserType": psychologicalAnalysisForm.extremeUserType
      };

      // Log the request to console
      console.log('Sending Psychological Analysis Generation Request:', requestBody);

      const response = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/psychological_analysis', {
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

      let data;
      try {
        data = await response.json();
        console.log('Psychological Analysis response:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        const responseText = await response.text();
        console.error('Raw response:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      setPsychologicalAnalysisData(data); // Store the data locally
      toast.success('Psychological Analysis generated successfully!');
      
      // Navigate to the dedicated Psychological Analysis page
      navigate(`/projects/${project?.id}/psychological_analysis`);

      // Clear the form after successful generation
      setPsychologicalAnalysisForm({
        painPointInvestigated: '',
        extremeUserType: ''
      });
    } catch (error) {
      console.error('Error generating Psychological Analysis:', error);
      if (error instanceof Error) {
        toast.error(`Failed to generate Psychological Analysis: ${error.message}`);
      } else {
        toast.error('Failed to generate Psychological Analysis. Please try again.');
      }
    } finally {
      setIsGeneratingPsychologicalAnalysis(false);
    }
  };

  const handleGenerateTransformationFramework = async () => {
    if (!transformationFrameworkForm.painPointInvestigated.trim() || !transformationFrameworkForm.extremeUserType.trim()) {
      toast.error('Please fill in all fields for Transformation Framework generation.');
      return;
    }

    setIsGeneratingTransformationFramework(true);
    try {
      const requestBody = {
        project_id: project?.id || '',
        painPointInvestigated: transformationFrameworkForm.painPointInvestigated,
        extremeUserType: transformationFrameworkForm.extremeUserType
      };

      console.log('Sending Transformation Framework Generation Request:', requestBody);

      const response = await fetch('https://n8n.srv922914.hstgr.cloud/webhook/Transformation Framework', {
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

      let data;
      try {
        data = await response.json();
        console.log('Transformation Framework response:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        const responseText = await response.text();
        console.error('Raw response:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      setTransformationFrameworkData(data);
      toast.success('Transformation Framework generated successfully!');
      navigate(`/projects/${project?.id}/transformation_framework`);
      setTransformationFrameworkForm({ painPointInvestigated: '', extremeUserType: '' });
    } catch (error) {
      console.error('Error generating Transformation Framework:', error);
      if (error instanceof Error) {
        toast.error(`Failed to generate Transformation Framework: ${error.message}`);
      } else {
        toast.error('Failed to generate Transformation Framework. Please try again.');
      }
    } finally {
      setIsGeneratingTransformationFramework(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Modern Header */}
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
                    onClick={handleDelete}
                    className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-2xl text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    <FiTrash2 className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Project Information Card */}
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

                {/* Extreme User Analysis Metadata */}
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

                {/* Deep Empathy Research Metadata */}
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

                {/* Presentable Slide */}
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

                {/* Project Canvas */}
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
              </dl>
            </div>
          </div>

          {/* Analysis Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <FiTrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Project Analysis</h3>
                    <p className="text-sm text-gray-600">Comprehensive project assessments and insights</p>
                  </div>
                </div>
                <button
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  onClick={() => setShowAssessmentModal(true)}
                >
                  <FiTrendingUp className="mr-2 h-5 w-5" />
                  Analyse Project
                </button>
              </div>
            </div>
            <div className="p-8">
              {analysis.length > 0 ? (
                <div className="space-y-4">
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
                        <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                                  <FiTrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  {editingIdx === idx ? (
                                    <input
                                      className="w-full px-4 py-2 border border-gray-300 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                      value={editName}
                                      onChange={e => setEditName(e.target.value)}
                                      onBlur={() => {
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
                                    <h4 className="text-lg font-semibold text-gray-900">{name}</h4>
                                  )}
                                  <p className="text-sm text-gray-600 mt-1">
                                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : a.updatedAt ? new Date(a.updatedAt).toLocaleString() : 'Unknown'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                                onClick={() => setViewAssessmentIdx(idx)}
                              >
                                View Analysis
                              </button>
                              <button
                                className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200"
                                onClick={() => {
                                  setEditingIdx(idx);
                                  setEditName(a.name || name);
                                }}
                                title="Edit Assessment Name"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                className="p-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all duration-200"
                                onClick={() => {
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
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiTrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Available</h3>
                  <p className="text-gray-600">Start by analyzing your project to get insights and recommendations.</p>
                </div>
              )}
            </div>
          </div>

          {/* As-Is Map Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FiPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">As-Is Map</h3>
                  <p className="text-sm text-gray-600">Visualize the current state of your project or process</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {!hasAsIsMapData() ? (
                <div className="space-y-6">
                  <div className="bg-blue-50/80 p-6 rounded-2xl border border-blue-200">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Generate an "As-Is Map" to visualize the current state of your project or process. This helps identify pain points and opportunities for improvement.
                    </p>
                  </div>
                  <AsIsMapForm
                    projectId={project?.id || ''}
                    prompt={asIsMapPrompt}
                    onPromptChange={setAsIsMapPrompt}
                    onGenerate={(data) => {
                      setAsIsMapData(data);
                      setAsIsMapPrompt('');
                      navigate(`/projects/${project?.id}/as_is_map`);
                    }}
                    onGeneratingChange={setIsGeneratingAsIsMap}
                    isGenerating={isGeneratingAsIsMap}
                  />
                </div>
              ) : (
                <div className="bg-green-50/80 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <FiTrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">As-Is Map Generated</h4>
                        <p className="text-sm text-gray-600">Your process visualization is ready for viewing</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                        onClick={() => navigate(`/projects/${project?.id}/as_is_map`)}
                      >
                        View AS-IS Map
                      </button>
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                        onClick={() => {
                          setAsIsMapData(null);
                          setAsIsMapPrompt('');
                        }}
                      >
                        Generate New
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extreme User Generator for Design Research Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <FiPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Extreme User Generator</h3>
                    <p className="text-sm text-gray-600">Generate extreme user personas to identify edge cases and design opportunities</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  onClick={() => setShowPainPointsModal(true)}
                  title="Choose from AS-IS Map Pain Points"
                >
                  Choose Pain Point
                </button>
              </div>
            </div>
            <div className="p-8">
              {!hasExtremeUserData() ? (
                <div className="space-y-6">
                  <div className="bg-purple-50/80 p-6 rounded-2xl border border-purple-200">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Generate extreme user personas to identify edge cases and design opportunities for your project. This helps you understand the full spectrum of user needs.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="painPointStep" className="block text-sm font-semibold text-gray-700 mb-3">
                        Pain Point Step
                      </label>
                      <input
                        type="text"
                        id="painPointStep"
                        value={extremeUserForm.painPointStep}
                        onChange={(e) => setExtremeUserForm({ ...extremeUserForm, painPointStep: e.target.value })}
                        placeholder="e.g., Step 2.1: Harvest timing decisions"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="painPointDescription" className="block text-sm font-semibold text-gray-700 mb-3">
                        Pain Point Description
                      </label>
                      <textarea
                        id="painPointDescription"
                        value={extremeUserForm.painPointDescription}
                        onChange={(e) => setExtremeUserForm({ ...extremeUserForm, painPointDescription: e.target.value })}
                        rows={3}
                        placeholder="Describe the specific pain point or challenge..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="targetUserContext" className="block text-sm font-semibold text-gray-700 mb-3">
                        Target User Context
                      </label>
                      <textarea
                        id="targetUserContext"
                        value={extremeUserForm.targetUserContext}
                        onChange={(e) => setExtremeUserForm({ ...extremeUserForm, targetUserContext: e.target.value })}
                        rows={3}
                        placeholder="Describe the user's context, constraints, and environment..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleGenerateExtremeUser}
                        disabled={isGeneratingExtremeUser}
                        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingExtremeUser ? 'Generating...' : 'Generate Extreme User'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50/80 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <FiTrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Extreme User Analysis Generated</h4>
                        <p className="text-sm text-gray-600">Your user personas and insights are ready for viewing</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                        onClick={() => navigate(`/projects/${project?.id}/extreme_user`)}
                      >
                        View Report
                      </button>
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                        onClick={() => {
                          setExtremeUserData(null);
                          setExtremeUserForm({
                            painPointStep: '',
                            painPointDescription: '',
                            targetUserContext: ''
                          });
                        }}
                      >
                        Generate New
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Universal Deep Empathy Research Generator for Primary Research Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FiPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Deep Empathy Research Generator</h3>
                  <p className="text-sm text-gray-600">Generate universal deep empathy insights for primary research</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {!hasDeepEmpathyData() ? (
                <div className="space-y-6">
                  <div className="bg-indigo-50/80 p-6 rounded-2xl border border-indigo-200">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Generate universal deep empathy insights for primary research, mirroring the Extreme User workflow. This helps you understand user motivations and behaviors at a deeper level.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="prioritizedPainPoint" className="block text-sm font-semibold text-gray-700 mb-3">
                        Prioritized Pain Point
                      </label>
                      <input
                        type="text"
                        id="prioritizedPainPoint"
                        value={deepEmpathyForm.prioritizedPainPoint}
                        onChange={(e) => setDeepEmpathyForm({ ...deepEmpathyForm, prioritizedPainPoint: e.target.value })}
                        placeholder="e.g., Woman travels to healthcare facility or contacts healthcare provider"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="deepPainPointDescription" className="block text-sm font-semibold text-gray-700 mb-3">
                        Pain Point Description
                      </label>
                      <textarea
                        id="deepPainPointDescription"
                        value={deepEmpathyForm.painPointDescription}
                        onChange={(e) => setDeepEmpathyForm({ ...deepEmpathyForm, painPointDescription: e.target.value })}
                        rows={3}
                        placeholder="Transportation barriers, long distances, high costs preventing initial prenatal care access"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="selectedExtremeUser" className="block text-sm font-semibold text-gray-700 mb-3">
                        Selected Extreme User
                      </label>
                      <textarea
                        id="selectedExtremeUser"
                        value={deepEmpathyForm.selectedExtremeUser}
                        onChange={(e) => setDeepEmpathyForm({ ...deepEmpathyForm, selectedExtremeUser: e.target.value })}
                        rows={3}
                        placeholder="The Remote Island Expectant Mother - 28-year-old woman living on river island, accessible only by boat, 45km from mainland healthcare"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleGenerateDeepEmpathy}
                        disabled={isGeneratingDeepEmpathy}
                        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingDeepEmpathy ? 'Generating...' : 'Generate Deep Empathy Research'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50/80 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <FiTrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Deep Empathy Research Generated</h4>
                        <p className="text-sm text-gray-600">Your empathy insights and research framework are ready</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                        onClick={() => navigate(`/projects/${project?.id}/deep_empathy`)}
                      >
                        View Deep Empathy Research
                      </button>
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                        onClick={() => {
                          setDeepEmpathyData(null);
                          setDeepEmpathyForm({
                            prioritizedPainPoint: '',
                            painPointDescription: '',
                            selectedExtremeUser: ''
                          });
                        }}
                      >
                        Generate New
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FiPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Start Chat</h3>
                  <p className="text-sm text-gray-600">Start a conversation about your project with AI assistance</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                <div className="bg-cyan-50/80 p-6 rounded-2xl border border-cyan-200">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Start a conversation about your project with the same input fields as the Deep Empathy Research Generator. Get instant AI-powered insights and recommendations.
                  </p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="chatPrioritizedPainPoint" className="block text-sm font-semibold text-gray-700 mb-3">
                      Prioritized Pain Point
                    </label>
                    <input
                      type="text"
                      id="chatPrioritizedPainPoint"
                      value={deepEmpathyForm.prioritizedPainPoint}
                      onChange={(e) => setDeepEmpathyForm({ ...deepEmpathyForm, prioritizedPainPoint: e.target.value })}
                      placeholder="e.g., Woman travels to healthcare facility or contacts healthcare provider"
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="chatSelectedExtremeUser" className="block text-sm font-semibold text-gray-700 mb-3">
                      Selected Extreme User
                    </label>
                    <textarea
                      id="chatSelectedExtremeUser"
                      value={deepEmpathyForm.selectedExtremeUser}
                      onChange={(e) => setDeepEmpathyForm({ ...deepEmpathyForm, selectedExtremeUser: e.target.value })}
                      rows={3}
                      placeholder="The Remote Island Expectant Mother - 28-year-old woman living on river island, accessible only by boat, 45km from mainland healthcare"
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none transition-all duration-200"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                      onClick={() => navigate(`/projects/${project?.id}/chat`)}
                    >
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Psychological Analysis Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <FiPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Psychological Analysis</h3>
                  <p className="text-sm text-gray-600">Transform research data into deep behavioral insights</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {!hasPsychologicalAnalysisData() ? (
                <div className="space-y-6">
                  <div className="bg-orange-50/80 p-6 rounded-2xl border border-orange-200">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Transform unprocessed research data into deep behavioral insights through psychological analysis. This helps you understand the underlying motivations and patterns in user behavior.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="psychologicalPainPointInvestigated" className="block text-sm font-semibold text-gray-700 mb-3">
                        Pain Point Investigated
                      </label>
                      <input
                        type="text"
                        id="psychologicalPainPointInvestigated"
                        value={psychologicalAnalysisForm.painPointInvestigated}
                        onChange={(e) => setPsychologicalAnalysisForm(prev => ({ ...prev, painPointInvestigated: e.target.value }))}
                        placeholder="e.g., Young student accessing online education from rural area"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="psychologicalExtremeUserType" className="block text-sm font-semibold text-gray-700 mb-3">
                        Extreme User Type
                      </label>
                      <input
                        type="text"
                        id="psychologicalExtremeUserType"
                        value={psychologicalAnalysisForm.extremeUserType}
                        onChange={(e) => setPsychologicalAnalysisForm(prev => ({ ...prev, extremeUserType: e.target.value }))}
                        placeholder="e.g., Ravi, 16-year-old student in a remote village with unstable internet"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleGeneratePsychologicalAnalysis}
                        disabled={isGeneratingPsychologicalAnalysis}
                        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingPsychologicalAnalysis ? 'Generating...' : 'Generate Psychological Analysis'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50/80 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <FiTrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Psychological Analysis Generated</h4>
                        <p className="text-sm text-gray-600">Your behavioral insights and analysis are ready for viewing</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                        onClick={() => navigate(`/projects/${project?.id}/psychological_analysis`)}
                      >
                        View Psychological Analysis
                      </button>
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                        onClick={() => {
                          setPsychologicalAnalysisData(null);
                          setPsychologicalAnalysisForm({
                            painPointInvestigated: '',
                            extremeUserType: ''
                          });
                        }}
                      >
                        Generate New
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transformation Framework Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <FiPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Transformation Framework</h3>
                  <p className="text-sm text-gray-600">Convert insights into actionable transformation strategies</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              {!hasTransformationFrameworkData() ? (
                <div className="space-y-6">
                  <div className="bg-teal-50/80 p-6 rounded-2xl border border-teal-200">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      Convert insights into an actionable transformation framework tailored to the project. This helps you create a structured approach to implementing changes and improvements.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="tfPainPointInvestigated" className="block text-sm font-semibold text-gray-700 mb-3">
                        Pain Point Investigated
                      </label>
                      <input
                        type="text"
                        id="tfPainPointInvestigated"
                        value={transformationFrameworkForm.painPointInvestigated}
                        onChange={(e) => setTransformationFrameworkForm(prev => ({ ...prev, painPointInvestigated: e.target.value }))}
                        placeholder="e.g., Young student accessing online education from rural area"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="tfExtremeUserType" className="block text-sm font-semibold text-gray-700 mb-3">
                        Extreme User Type
                      </label>
                      <input
                        type="text"
                        id="tfExtremeUserType"
                        value={transformationFrameworkForm.extremeUserType}
                        onChange={(e) => setTransformationFrameworkForm(prev => ({ ...prev, extremeUserType: e.target.value }))}
                        placeholder="e.g., Ravi, 16-year-old student in a remote village with unstable internet"
                        className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleGenerateTransformationFramework}
                        disabled={isGeneratingTransformationFramework}
                        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isGeneratingTransformationFramework ? 'Generating...' : 'Generate Transformation Framework'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50/80 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <FiTrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Transformation Framework Generated</h4>
                        <p className="text-sm text-gray-600">Your actionable transformation strategies are ready for implementation</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                        onClick={() => navigate(`/projects/${project?.id}/transformation_framework`)}
                      >
                        View Transformation Framework
                      </button>
                      <button
                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                        onClick={() => {
                          setTransformationFrameworkData(null);
                          setTransformationFrameworkForm({ painPointInvestigated: '', extremeUserType: '' });
                        }}
                      >
                        Generate New
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assessment Modal */}
          <HorizontalModal open={showAssessmentModal} onClose={() => setShowAssessmentModal(false)}>
            <div className="p-8 no-scrollbar bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiTrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Assess Project</h2>
                  <p className="text-gray-600">Choose an assessment tier to analyze your project comprehensively</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                  <ResourceFrameworkSelector
                    onTierSelect={setSelectedTier}
                    selectedTier={selectedTier as any}
                  />
                </div>
                
                <div className="flex justify-center mt-8">
                  <button
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedTier}
                    onClick={async () => {
                      if (!project) return;
                      const now = new Date();
                      let newAssessment = {
                        name: '',
                        createdAt: now.toISOString(),
                        ...project,
                        tier: selectedTier,
                      };
                      if (!project.analysis || project.analysis.length === 0) {
                        newAssessment.name = 'Initial Analysis';
                        newAssessment.createdAt = project.created_at;
                      } else {
                        newAssessment.name = `Assessment - ${Math.floor(1000 + Math.random() * 9000)}`;
                      }
                      const updated = [...(project.analysis || []), newAssessment];
                      project.analysis = updated;
                      setShowAssessmentModal(false);
                    }}
                  >
                    {selectedTier ? `Start ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Assessment` : 'Select Assessment Tier'}
                  </button>
                </div>
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
                  {project?.deep_empathy_data?.generated_at && (
                    <p className="text-sm text-gray-500 mt-1">
                      Generated on: {new Date(project.deep_empathy_data.generated_at).toLocaleString()}
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

          {/* Behavioral Insights Modal */}
          <HorizontalModal open={showBehavioralInsightsModal} onClose={() => setShowBehavioralInsightsModal(false)}>
            <div className="p-6 max-w-6xl max-h-[70vh] overflow-y-auto pr-4 no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Behavioral Insights</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Generated from your research data
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBehavioralInsightsModal(false)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
              {behavioralInsightsData ? (
                <div className="space-y-6">
                  {/* Attempt to render structured content if present; fallback to JSON */}
                  {(() => {
                    const content = behavioralInsightsData;
                    if (!content || typeof content !== 'object') {
                      return (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <pre className="text-xs text-gray-700 overflow-auto max-h-96">{JSON.stringify(content || behavioralInsightsData, null, 2)}</pre>
                        </div>
                      );
                    }

                    const toArray = (val: any) => Array.isArray(val) ? val : (val ? [val] : []);

                    return (
                      <div className="space-y-6">
                        {content['BEHAVIORAL_INSIGHTS'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-indigo-800 mb-4">💡 Behavioral Insights</h3>
                            <div className="space-y-4">
                              {Object.entries(content['BEHAVIORAL_INSIGHTS']).map(([key, value]) => (
                                <div key={key}>
                                  <h4 className="font-semibold text-gray-800 mb-2">{key.replace(/_/g, ' ')}</h4>
                                  <ul className="space-y-1 text-sm">
                                    {toArray(value).map((item: any, i: number) => (
                                      <li key={i} className="text-gray-700">• {renderDataValue(item)}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {content['DESIGN_IMPLICATIONS'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-green-800 mb-4">🎨 Design Implications</h3>
                            <div className="space-y-4">
                              {Object.entries(content['DESIGN_IMPLICATIONS']).map(([key, value]) => (
                                <div key={key}>
                                  <h4 className="font-semibold text-gray-800 mb-2">{key.replace(/_/g, ' ')}</h4>
                                  <ul className="space-y-1 text-sm">
                                    {toArray(value).map((item: any, i: number) => (
                                      <li key={i} className="text-gray-700">• {renderDataValue(item)}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {content['PATTERNS_AND_TRENDS'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-purple-800 mb-4">📊 Patterns and Trends</h3>
                            <div className="space-y-4">
                              {Object.entries(content['PATTERNS_AND_TRENDS']).map(([key, value]) => (
                                <div key={key}>
                                  <h4 className="font-semibold text-gray-800 mb-2">{key.replace(/_/g, ' ')}</h4>
                                  <ul className="space-y-1 text-sm">
                                    {toArray(value).map((item: any, i: number) => (
                                      <li key={i} className="text-gray-700">• {renderDataValue(item)}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {content['RECOMMENDATIONS'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-orange-800 mb-4">🚀 Recommendations</h3>
                            <div className="space-y-4">
                              {Object.entries(content['RECOMMENDATIONS']).map(([key, value]) => (
                                <div key={key}>
                                  <h4 className="font-semibold text-gray-800 mb-2">{key.replace(/_/g, ' ')}</h4>
                                  <ul className="space-y-1 text-sm">
                                    {toArray(value).map((item: any, i: number) => (
                                      <li key={i} className="text-gray-700">• {renderDataValue(item)}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fallback: if none of the expected sections present, dump formatted JSON */}
                        {!content['BEHAVIORAL_INSIGHTS'] &&
                          !content['DESIGN_IMPLICATIONS'] &&
                          !content['PATTERNS_AND_TRENDS'] &&
                          !content['RECOMMENDATIONS'] && (
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <pre className="text-xs text-gray-700 overflow-auto max-h-96">{JSON.stringify(content, null, 2)}</pre>
                            </div>
                          )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">No Behavioral Insights data available</div>
              )}
            </div>
          </HorizontalModal>

          {/* Psychological Analysis Modal */}
          <HorizontalModal open={showPsychologicalAnalysisModal} onClose={() => setShowPsychologicalAnalysisModal(false)}>
            <div className="p-6 max-w-6xl max-h-[70vh] overflow-y-auto pr-4 no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Psychological Analysis</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Transforming unprocessed research data into behavioral insights
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPsychologicalAnalysisModal(false)}
                    className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
              {psychologicalAnalysisData ? (
                <div className="space-y-6">
                  {/* Attempt to render structured content if present; fallback to JSON */}
                  {(() => {
                    const content = psychologicalAnalysisData;
                    if (!content || typeof content !== 'object') {
                      return (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <pre className="text-xs text-gray-700 overflow-auto max-h-96">{JSON.stringify(content || psychologicalAnalysisData, null, 2)}</pre>
                        </div>
                      );
                    }

                    const toArray = (val: any) => Array.isArray(val) ? val : (val ? [val] : []);

                    return (
                      <div className="space-y-6">
                        {content['clusters'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-blue-800 mb-4">🧠 Behavioral Clusters</h3>
                            <div className="space-y-4">
                              {toArray(content['clusters']).map((cluster: any, i: number) => (
                                <div key={i} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                                  <h4 className="font-semibold text-blue-800 mb-2">Cluster {i + 1}</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <strong>Irrational Behavior:</strong> {cluster.irrationalBehavior}
                                    </div>
                                    <div>
                                      <strong>Rational Counterpart:</strong> {cluster.rationalCounterpart}
                                    </div>
                                    <div>
                                      <strong>Peculiarity Revealed:</strong> {cluster.peculiarityRevealed}
                                    </div>
                                    <div>
                                      <strong>Innovation Insight:</strong> {cluster.innovationInsight}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {content['comprehensiveMetaAnalysis'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-purple-800 mb-4">📊 Comprehensive Meta Analysis</h3>
                            <div className="space-y-4">
                              {Object.entries(content['comprehensiveMetaAnalysis']).map(([key, value]) => (
                                <div key={key}>
                                  <h4 className="font-semibold text-gray-800 mb-2">{key.replace(/_/g, ' ')}</h4>
                                  <ul className="space-y-1 text-sm">
                                    {toArray(value).map((item: any, i: number) => (
                                      <li key={i} className="text-gray-700">• {renderDataValue(item)}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {content['criticalRequirements'] && (
                          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xl font-bold text-orange-800 mb-4">⚡ Critical Requirements</h3>
                            <ul className="space-y-2 text-sm">
                              {toArray(content['criticalRequirements']).map((requirement: any, i: number) => (
                                <li key={i} className="text-gray-700">• {renderDataValue(requirement)}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Fallback: if none of the expected sections present, dump formatted JSON */}
                        {!content['clusters'] &&
                          !content['comprehensiveMetaAnalysis'] &&
                          !content['criticalRequirements'] && (
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <pre className="text-xs text-gray-700 overflow-auto max-h-96">{JSON.stringify(content, null, 2)}</pre>
                            </div>
                          )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">No Psychological Analysis data available</div>
              )}
            </div>
          </HorizontalModal>
        </div>
      </div>
    </div>
  );
};
