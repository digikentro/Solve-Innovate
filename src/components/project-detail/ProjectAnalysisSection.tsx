import { useState } from 'react';
import { FiTrendingUp, FiSearch, FiCalendar, FiArrowRight, FiActivity } from 'react-icons/fi';
import { HorizontalModal } from '@/components/ui/Modal';
import { ResourceFrameworkSelector } from '@/components/assessment/ResourceFrameworkSelector';
import { AssessmentProblemDetailedView } from '@/components/ui/AssessmentProblemDetailedView';
import type { Project } from '@/types/project';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProjectAnalysisSectionProps {
  project: Project;
  setProject: (project: Project) => void;
}

export const ProjectAnalysisSection = ({ project, setProject }: ProjectAnalysisSectionProps) => {
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'express' | 'standard' | 'premium' | null>(null);
  const [viewAssessmentIdx, setViewAssessmentIdx] = useState<number | null>(null);
  
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
      <Card className="bg-white border border-gray-200 shadow-none rounded-xl overflow-hidden mb-8">
        <CardHeader className="border-b border-gray-100 py-6 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <FiActivity className="w-5 h-5 text-gray-400" />
            <div>
              <CardTitle className="text-xl font-medium text-gray-900">Project Analysis</CardTitle>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Assessments and insights</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAssessmentModal(true)}
            className="bg-[#0f121f] text-white hover:bg-[#0f121f]/90 rounded-xl h-10 px-6 font-normal"
          >
            Analyse Project
          </Button>
        </CardHeader>
        
        <CardContent className="p-8">
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
                    <div key={idx} className="group border border-gray-100 p-6 flex items-center justify-between transition-colors hover:border-gray-300">
                      <div className="flex items-center gap-6">
                        <FiSearch className="w-5 h-5 text-gray-300" />
                        <div>
                          <h4 className="text-base font-medium text-gray-900">{name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 uppercase tracking-widest">
                            <FiCalendar className="w-3 h-3" />
                            {a.createdAt ? new Date(a.createdAt).toLocaleString() : a.updatedAt ? new Date(a.updatedAt).toLocaleString() : 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-gray-400 hover:text-black group-hover:bg-gray-50 rounded-xl"
                        onClick={() => setViewAssessmentIdx(idx)}
                      >
                        View Analysis <FiArrowRight className="ml-2 w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-gray-100">
              <FiSearch className="w-8 h-8 text-gray-200 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-2">No Analysis Available</h3>
              <p className="text-xs text-gray-400">Start by analyzing your project to get insights.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment Modal */}
      <HorizontalModal open={showAssessmentModal} onClose={() => setShowAssessmentModal(false)}>
        <div className="p-12 bg-white min-h-screen">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-light text-gray-900 mb-2">Assess Project</h2>
              <p className="text-xs text-gray-400 uppercase tracking-[0.2em]">Comprehensive analysis configuration</p>
            </div>
            
            <div className="border border-gray-100 p-8 mb-12">
              <ResourceFrameworkSelector
                onTierSelect={setSelectedTier}
                selectedTier={selectedTier as any}
              />
            </div>
            
            <div className="flex justify-start">
              <Button
                className="bg-black text-white hover:bg-black/90 rounded-xl h-14 px-12 text-lg font-light transition-all disabled:opacity-30"
                disabled={!selectedTier}
                onClick={handleStartAssessment}
              >
                {selectedTier ? `Start ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Assessment` : 'Select Assessment Tier'}
              </Button>
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
