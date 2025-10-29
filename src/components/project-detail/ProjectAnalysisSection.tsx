import { useState } from 'react';
import { FiTrendingUp, FiEdit, FiTrash2 } from 'react-icons/fi';
import { HorizontalModal } from '@/components/ui/Modal';
import { ResourceFrameworkSelector } from '@/components/assessment/ResourceFrameworkSelector';
import { AssessmentProblemDetailedView } from '@/components/ui/AssessmentProblemDetailedView';
import type { Project } from '@/types/project';

interface ProjectAnalysisSectionProps {
  project: Project;
  setProject: (project: Project) => void;
}

export const ProjectAnalysisSection = ({ project, setProject }: ProjectAnalysisSectionProps) => {
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'express' | 'standard' | 'premium' | null>(null);
  const [viewAssessmentIdx, setViewAssessmentIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  
  const analysis = project?.analysis || [];

  const handleStartAssessment = () => {
    if (!project || !selectedTier) return;
    
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
    setProject({ ...project, analysis: updated });
    setShowAssessmentModal(false);
  };

  return (
    <>
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
                                setProject({ ...project, analysis: updated });
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
                onClick={handleStartAssessment}
              >
                {selectedTier ? `Start ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Assessment` : 'Select Assessment Tier'}
              </button>
            </div>
          </div>
        </div>
      </HorizontalModal>

      {/* View Assessment Modal */}
      <AssessmentProblemDetailedView
        open={viewAssessmentIdx !== null && !!analysis[viewAssessmentIdx]}
        onClose={() => setViewAssessmentIdx(null)}
        assessment={viewAssessmentIdx !== null ? analysis[viewAssessmentIdx] : undefined}
        problemTitle={project.title}
        viewType="assessment"
      />
    </>
  );
};
