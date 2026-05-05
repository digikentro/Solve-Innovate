import { useState } from 'react';
import { FiTrendingUp, FiSearch, FiCalendar, FiArrowRight, FiActivity } from 'react-icons/fi';
import { HorizontalModal } from '@/components/ui/Modal';
import { ResourceFrameworkSelector } from '@/components/assessment/ResourceFrameworkSelector';
import { AssessmentProblemDetailedView } from '@/components/ui/AssessmentProblemDetailedView';
import type { Project } from '@/types/project';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
      <Card className="overflow-hidden border border-gray-200 bg-white shadow-none">
        <CardHeader className="flex flex-col items-start gap-4 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5 text-left">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight text-gray-900">
              <FiActivity className="size-5 shrink-0 text-gray-400" />
              Project Analysis
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-wide text-gray-500">
              Assessments and insights
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => setShowAssessmentModal(true)}
            className="w-full shrink-0 sm:w-auto"
          >
            Analyse Project
          </Button>
        </CardHeader>
        
        <CardContent className="px-6 pb-6 pt-6">
          {analysis.length > 0 ? (
            <div className="flex flex-col gap-3">
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
                    <div key={idx} className="group flex items-center justify-between gap-4 rounded-md border border-gray-200 p-4 transition-colors hover:border-gray-300 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white">
                          <FiSearch className="size-4 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{name}</h4>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                            <FiCalendar className="size-3" />
                            {a.createdAt ? new Date(a.createdAt).toLocaleString() : a.updatedAt ? new Date(a.updatedAt).toLocaleString() : 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewAssessmentIdx(idx)}
                        className="shrink-0"
                      >
                        View Analysis <FiArrowRight className="ml-2 size-3" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-gray-200 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-md bg-gray-50">
                <FiSearch className="size-6 text-gray-300" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-gray-900">No Analysis Available</h3>
                <p className="text-xs text-gray-500">Start by analyzing your project to get insights.</p>
              </div>
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
                className="bg-black text-white hover:bg-black/90 rounded-md h-14 px-12 text-lg font-light transition-all disabled:opacity-30"
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
