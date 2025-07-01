import React, { useState, useEffect } from 'react';
import { AssessmentForm } from '../components/assessment/AssessmentForm';
import { DynamicIndicatorsForm } from '../components/assessment/DynamicIndicatorsForm';
import { CulturalIntelligenceForm } from '../components/assessment/CulturalIntelligenceForm';
import { CollaborativeAssessmentForm } from '../components/assessment/CollaborativeAssessmentForm';
import { QualityReviewForm } from '../components/assessment/QualityReviewForm';
import { AssessmentHistory } from '../components/assessment/AssessmentHistory';
import { ResourceFrameworkSelector } from '../components/assessment/ResourceFrameworkSelector';
import { SourceVerificationForm } from '../components/assessment/SourceVerificationForm';
import { NotificationCenter } from '../components/assessment/NotificationCenter';
import { generateDynamicIndicators, generateCulturalIntelligence, calculateAssessmentConfidence, assessQuality } from '../services/automationService';
import { supabase } from '../lib/supabase';

// Mocked problem list for demonstration
const mockProblems = [
  { id: 'problem-1', title: 'Water Purification in Rural India' },
  { id: 'problem-2', title: 'Affordable Clean Energy Access' },
];

export const AssessmentPage: React.FC = () => {
  const [selectedProblem, setSelectedProblem] = useState<string>(mockProblems[0].id);
  const [mode, setMode] = useState<'quantitative' | 'qualitative' | 'hybrid'>('quantitative');
  const [selectedTier, setSelectedTier] = useState<'express' | 'standard' | 'premium'>('standard');
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tier' | 'assessment' | 'indicators' | 'cultural' | 'sources' | 'collaborative' | 'quality' | 'notifications' | 'history'>('tier');

  // Check for existing assessment
  useEffect(() => {
    checkExistingAssessment();
  }, [selectedProblem]);

  const checkExistingAssessment = async () => {
    try {
      const { data } = await supabase
        .from('enhanced_scoring')
        .select('id')
        .eq('problem_id', selectedProblem)
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
    setLoading(true);
    setMessage('Running automated analysis...');
    
    try {
      // Generate dynamic indicators
      await generateDynamicIndicators(selectedProblem, 'technology');
      
      // Generate cultural intelligence
      await generateCulturalIntelligence(selectedProblem, 'Innovation opportunity assessment');
      
      // Calculate assessment confidence
      await calculateAssessmentConfidence(selectedProblem);
      
      // Assess quality if assessment exists
      if (assessmentId) {
        await assessQuality(selectedProblem, assessmentId);
      }
      
      setMessage('Automated analysis completed! Check the indicators and cultural intelligence sections.');
    } catch (error) {
      setMessage('Error running automated analysis: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { 
      id: 'tier', 
      label: 'Assessment Tier', 
      component: <ResourceFrameworkSelector onTierSelect={setSelectedTier} selectedTier={selectedTier} /> 
    },
    { 
      id: 'assessment', 
      label: 'Assessment', 
      component: <AssessmentForm problemId={selectedProblem} mode={mode} /> 
    },
    { 
      id: 'indicators', 
      label: 'Dynamic Indicators', 
      component: <DynamicIndicatorsForm problemId={selectedProblem} /> 
    },
    { 
      id: 'cultural', 
      label: 'Cultural Intelligence', 
      component: <CulturalIntelligenceForm problemId={selectedProblem} /> 
    },
    { 
      id: 'sources', 
      label: 'Source Verification', 
      component: assessmentId ? <SourceVerificationForm problemId={selectedProblem} assessmentId={assessmentId} /> : <div className="text-gray-500">Complete assessment first</div> 
    },
    { 
      id: 'collaborative', 
      label: 'Collaborative', 
      component: assessmentId ? <CollaborativeAssessmentForm problemId={selectedProblem} assessmentId={assessmentId} /> : <div className="text-gray-500">Complete assessment first</div> 
    },
    { 
      id: 'quality', 
      label: 'Quality Review', 
      component: assessmentId ? <QualityReviewForm problemId={selectedProblem} assessmentId={assessmentId} /> : <div className="text-gray-500">Complete assessment first</div> 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      component: <NotificationCenter problemId={selectedProblem} /> 
    },
    { 
      id: 'history', 
      label: 'History', 
      component: <AssessmentHistory problemId={selectedProblem} /> 
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Innovation Opportunity Assessment</h1>
      
      {/* Problem and Mode Selection */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block font-medium mb-1">Select Problem</label>
          <select
            value={selectedProblem}
            onChange={e => setSelectedProblem(e.target.value)}
            className="border p-2 rounded w-full"
          >
            {mockProblems.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
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
        <div>
          <label className="block font-medium mb-1">Selected Tier</label>
          <div className="border p-2 rounded bg-gray-50">
            <span className="capitalize font-medium">{selectedTier}</span>
          </div>
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

      {/* Tab Navigation */}
      <div className="border-b mb-6 overflow-x-auto">
        <nav className="flex space-x-8 min-w-max">
          {tabs.map(tab => (
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
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}; 