import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectService } from '@/services/projectService';
import { toast } from 'react-hot-toast';
import type { Project } from '@/types/project';
import { FiArrowLeft } from 'react-icons/fi';
import { AssessmentForm } from '@/components/assessment/AssessmentForm';
import { DynamicIndicatorsForm } from '@/components/assessment/DynamicIndicatorsForm';
import { CulturalIntelligenceForm } from '@/components/assessment/CulturalIntelligenceForm';
import { CollaborativeAssessmentForm } from '@/components/assessment/CollaborativeAssessmentForm';
import { QualityReviewForm } from '@/components/assessment/QualityReviewForm';
import { AssessmentHistory } from '@/components/assessment/AssessmentHistory';
import { ResourceFrameworkSelector } from '@/components/assessment/ResourceFrameworkSelector';
import { SourceVerificationForm } from '@/components/assessment/SourceVerificationForm';
import { NotificationCenter } from '@/components/assessment/NotificationCenter';
import { generateDynamicIndicators, generateCulturalIntelligence, calculateAssessmentConfidence, assessQuality } from '@/services/automationService';
import { supabase } from '@/lib/supabase';

export const ProjectAssessmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Assessment state
  const [mode, setMode] = useState<'quantitative' | 'qualitative' | 'hybrid'>('quantitative');
  const [selectedTier, setSelectedTier] = useState<'express' | 'standard' | 'premium'>('standard');
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assessment' | 'indicators' | 'cultural' | 'sources' | 'collaborative' | 'quality' | 'notifications' | 'history'>('assessment');

  useEffect(() => {
    const loadProject = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        const data = await ProjectService.getProjectById(id, user.id);
        
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
        checkExistingAssessment();
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

  const checkExistingAssessment = async () => {
    if (!id) return;
    
    try {
      const { data } = await supabase
        .from('enhanced_scoring')
        .select('id')
        .eq('problem_id', id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setAssessmentId(data[0].id);
      } else {
        setAssessmentId(null);
      }
    } catch (error) {
      console.error('Error checking existing assessment:', error);
    }
  };

  const handleAssessmentSaved = (newAssessmentId: string) => {
    setAssessmentId(newAssessmentId);
    setMessage('Assessment saved! You can now add dynamic indicators and cultural intelligence.');
  };

  const handleAutomatedAnalysis = async () => {
    if (!id) return;
    
    setLoading(true);
    setMessage('Running automated analysis...');
    
    try {
      // Generate dynamic indicators
      await generateDynamicIndicators(id, 'technology');
      
      // Generate cultural intelligence
      await generateCulturalIntelligence(id, project?.title || 'Innovation opportunity assessment');
      
      // Calculate assessment confidence
      await calculateAssessmentConfidence(id);
      
      // Assess quality if assessment exists
      if (assessmentId) {
        await assessQuality(id, assessmentId);
      }
      
      setMessage('Automated analysis completed! Check the indicators and cultural intelligence sections.');
    } catch (error) {
      setMessage('Error running automated analysis: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const assessmentTabs = [
    { 
      id: 'assessment', 
      label: 'Assessment', 
      component: <AssessmentForm problemId={id!} mode={mode} /> 
    },
    { 
      id: 'indicators', 
      label: 'Dynamic Indicators', 
      component: <DynamicIndicatorsForm problemId={id!} /> 
    },
    { 
      id: 'cultural', 
      label: 'Cultural Intelligence', 
      component: <CulturalIntelligenceForm problemId={id!} /> 
    },
    { 
      id: 'sources', 
      label: 'Source Verification', 
      component: assessmentId ? <SourceVerificationForm problemId={id!} assessmentId={assessmentId} /> : <div className="text-gray-500">Complete assessment first</div> 
    },
    { 
      id: 'collaborative', 
      label: 'Collaborative', 
      component: assessmentId ? <CollaborativeAssessmentForm problemId={id!} assessmentId={assessmentId} /> : <div className="text-gray-500">Complete assessment first</div> 
    },
    { 
      id: 'quality', 
      label: 'Quality Review', 
      component: assessmentId ? <QualityReviewForm problemId={id!} assessmentId={assessmentId} /> : <div className="text-gray-500">Complete assessment first</div> 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      component: <NotificationCenter problemId={id!} /> 
    },
    { 
      id: 'history', 
      label: 'History', 
      component: <AssessmentHistory problemId={id!} /> 
    }
  ];

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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              to={`/projects/${id}`}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Assessment: {project.title}
            </h1>
            <p className="text-gray-600 mt-1">
              Innovation Opportunity Score Framework
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Tier Selection */}
      <div className="mb-6">
        <ResourceFrameworkSelector onTierSelect={setSelectedTier} selectedTier={selectedTier} />
      </div>

      {/* Assessment Mode Selection */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div>
          <label className="block font-medium mb-1">Assessment Mode</label>
          <select
            value={mode}
            onChange={e => setMode(e.target.value as any)}
            className="border p-2 rounded w-full"
          >
            <option value="quantitative">Quantitative</option>
            <option value="qualitative">Qualitative</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Automated Analysis Button */}
      <div className="mb-6">
        <button
          onClick={handleAutomatedAnalysis}
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Running Analysis...' : 'Run Automated Analysis'}
        </button>
        {message && (
          <div className={`mt-2 p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Assessment Tabs */}
      <div className="border-b mb-6 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max">
          {assessmentTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {assessmentTabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}