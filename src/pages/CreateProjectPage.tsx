import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { aiService, ProblemStatement } from '@/services/aiService';
import { IOSAssessmentCard, IOSAssessmentCardCompact } from '@/components/ui/IOSAssessmentCard';
import { IOSFrameworkService, ProblemStatementEnhanced } from '@/services/iosFramework';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, Globe, Target, Users, Lightbulb, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SourceVerificationInfo } from '@/components/ui/SourceVerificationInfo';
import { SourceVerificationService } from '@/services/sourceVerificationService';
import { ProjectService } from '@/services/projectService';
import { FiArrowLeft, FiPlus, FiZap } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';

const BUSINESS_SECTORS = [
  { id: 'education', name: 'Education' },
  { id: 'finance', name: 'Finance' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'technology', name: 'Technology' },
  { id: 'environment', name: 'Environment' },
  { id: 'agriculture', name: 'Agriculture' },
  { id: 'transportation', name: 'Transportation' },
  { id: 'energy', name: 'Energy' }
];

const SDG_GOALS = [
  { id: 'sdg-1', name: 'No Poverty', number: 1 },
  { id: 'sdg-2', name: 'Zero Hunger', number: 2 },
  { id: 'sdg-3', name: 'Good Health and Well-being', number: 3 },
  { id: 'sdg-4', name: 'Quality Education', number: 4 },
  { id: 'sdg-5', name: 'Gender Equality', number: 5 },
  { id: 'sdg-6', name: 'Clean Water and Sanitation', number: 6 },
  { id: 'sdg-7', name: 'Affordable and Clean Energy', number: 7 },
  { id: 'sdg-8', name: 'Decent Work and Economic Growth', number: 8 },
  { id: 'sdg-9', name: 'Industry, Innovation and Infrastructure', number: 9 },
  { id: 'sdg-10', name: 'Reduced Inequalities', number: 10 },
  { id: 'sdg-11', name: 'Sustainable Cities and Communities', number: 11 },
  { id: 'sdg-12', name: 'Responsible Consumption and Production', number: 12 },
  { id: 'sdg-13', name: 'Climate Action', number: 13 },
  { id: 'sdg-14', name: 'Life Below Water', number: 14 },
  { id: 'sdg-15', name: 'Life on Land', number: 15 },
  { id: 'sdg-16', name: 'Peace, Justice and Strong Institutions', number: 16 },
  { id: 'sdg-17', name: 'Partnerships for the Goals', number: 17 }
];

// Type guard helpers
function isSystemProblem(problem: any): problem is import('@/types/project').SystemProblem {
  return problem && problem.hmwType === 'system' && problem.iosAssessment?.dimensions?.systemImpactPotential;
}
function isBusinessProblem(problem: any): problem is import('@/types/project').BusinessProblem {
  return problem && problem.hmwType === 'business' && problem.iosAssessment?.dimensions?.businessImpactPotential;
}

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectType, setProjectType] = useState<'social-impact' | 'business' | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblems, setGeneratedProblems] = useState<ProblemStatementEnhanced[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [inputMode, setInputMode] = useState<'predefined' | 'custom'>('predefined');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [detailedProblem, setDetailedProblem] = useState<ProblemStatementEnhanced | null>(null);
  const [sourcesProblem, setSourcesProblem] = useState<ProblemStatementEnhanced | null>(null);
  const [uploadedPdfs, setUploadedPdfs] = useState<File[]>([]);
  const [pdfContext, setPdfContext] = useState<string>('');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isGeneratingSlide, setIsGeneratingSlide] = useState(false);
  const [presentableSlide, setPresentableSlide] = useState<string>('');
  const [problemSlides, setProblemSlides] = useState<Record<string, { hmw: string; bullets: string[] }>>({});
  const [viewingSlide, setViewingSlide] = useState<{ problemId: string; slide: { hmw: string; bullets: string[] } } | null>(null);
  const [isHmwTypeModalOpen, setIsHmwTypeModalOpen] = useState(false);
  const [selectedHmwType, setSelectedHmwType] = useState<null | 'human' | 'system' | 'business'>(null);

  const getSectorsForType = () => {
    if (projectType === 'social-impact') {
      return SDG_GOALS;
    } else if (projectType === 'business') {
      return BUSINESS_SECTORS;
    }
    return [];
  };

  const sectorsWithCustom = getSectorsForType();

  const handleProjectTypeSelect = (type: 'social-impact' | 'business') => {
    setProjectType(type);
    setSelectedSector(null);
    setGeneratedProblems([]);
    setProblemDescription('');
    setInputMode('predefined');
    setSelectedProblems(new Set());
  };

  const handleSectorSelect = (sectorId: string) => {
    setSelectedSector(sectorId);
    setGeneratedProblems([]);
    setInputMode('predefined');
    setSelectedProblems(new Set());
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProblemDescription(e.target.value);
    setInputMode('custom');
    setGeneratedProblems([]);
    setSelectedProblems(new Set());
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      alert('Please select PDF files only');
      return;
    }

    setIsProcessingPdf(true);
    try {
      // For now, we'll simulate PDF processing
      // In a real implementation, you'd send these to your backend for text extraction
      const newPdfs = [...uploadedPdfs, ...pdfFiles];
      setUploadedPdfs(newPdfs);
      
      // Simulate extracting text from PDFs
      const extractedText = await simulatePdfTextExtraction(pdfFiles);
      setPdfContext(extractedText);
      
      toast.success(`Successfully uploaded ${pdfFiles.length} PDF(s)`);
    } catch (error) {
      console.error('Error processing PDFs:', error);
      toast.error('Failed to process PDFs');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const simulatePdfTextExtraction = async (files: File[]): Promise<string> => {
    // This is a placeholder - in real implementation, you'd use a PDF parsing library
    // or send to backend for processing
    return new Promise((resolve) => {
      setTimeout(() => {
        const context = files.map(file => 
          `Content from ${file.name}: This is simulated extracted text from the PDF. In a real implementation, this would contain the actual text content extracted from the PDF file.`
        ).join('\n\n');
        resolve(context);
      }, 2000);
    });
  };

  const removePdf = (index: number) => {
    const newPdfs = uploadedPdfs.filter((_, i) => i !== index);
    setUploadedPdfs(newPdfs);
    if (newPdfs.length === 0) {
      setPdfContext('');
    }
  };

  const handleProblemToggle = (problemId: string) => {
    setSelectedProblems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(problemId)) {
        newSet.delete(problemId);
      } else {
        newSet.add(problemId);
      }
      return newSet;
    });
  };

  const handleSkillMatch = () => {
    if (generatedProblems.length === 0) {
      alert('Please generate problems first');
      return;
    }
    const userSkills = user?.user_metadata?.skills || [];
    const scoredProblems = generatedProblems.map(problem => {
      const problemSkills = problem.requiredSkills.map(skill => skill.toLowerCase());
      const userSkillMatches = userSkills.filter((userSkill: string) => 
        problemSkills.some(problemSkill => 
          problemSkill.includes(userSkill.toLowerCase()) || 
          userSkill.toLowerCase().includes(problemSkill)
        )
      );
      const matchScore = userSkillMatches.length / Math.max(problemSkills.length, 1);
      const iosScore = problem.iosAssessment ? problem.iosAssessment.totalScore / 100 : problem.opportunityScore / 100;
      const combinedScore = (matchScore * 0.4) + (iosScore * 0.6);
      return {
        ...problem,
        skillMatchScore: combinedScore,
        matchedSkills: userSkillMatches
      };
    });
    const topProblem = scoredProblems.sort((a, b) => b.skillMatchScore - a.skillMatchScore)[0];
    if (topProblem) {
      setSelectedProblems(new Set([topProblem.id!]));
      toast.success('Matched 1 problem with your skills!');
    } else {
      toast.error('No problems matched your skills. Try generating more problems.');
    }
  };

  const handleGenerateSlideForProblem = async (problem: ProblemStatementEnhanced) => {
    if (!problem.id) return;
    
    setIsGeneratingSlide(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-presentable-slide', {
        body: { 
          title: problem.title, 
          description: problem.description 
        }
      });
      
      if (error) throw error;
      
      // Store the raw JSON data from the edge function
      if (data && typeof data === 'object' && data.hmw && data.bullets) {
        setProblemSlides(prev => ({
          ...prev,
          [problem.id!]: {
            hmw: data.hmw,
            bullets: data.bullets
          }
        }));
        toast.success('Presentable slide generated successfully!');
      } else {
        throw new Error('Invalid slide data received');
      }
    } catch (err: any) {
      console.error('Error generating slide:', err);
      toast.error('Failed to generate slide.');
    } finally {
      setIsGeneratingSlide(false);
    }
  };

  const handleSaveSelectedProblems = async () => {
    if (selectedProblems.size === 0 || !user) {
      alert('Please select a problem to save');
      return;
    }

    setIsSaving(true);
    try {
      const selectedProblemData = generatedProblems.filter(p => selectedProblems.has(p.id!));
      for (const problem of selectedProblemData) {
        // Create project using ProjectService
        await ProjectService.createProject({
          title: problem.title,
          description: problem.description,
          tags: problem.sdgGoals,
        status: 'draft'
        }, user.id);
      }

      toast.success('Project(s) created successfully!');
      navigate('/projects');
    } catch (error) {
      console.error('Error saving problem:', error);
      alert('Failed to save problem. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getSectorName = (sectorId: string) => {
    const sector = sectorsWithCustom.find(s => s.id === sectorId);
    return sector?.name || sectorId;
  };

  const getDimensionIcon = (dimensionKey: string) => {
    switch (dimensionKey) {
      case 'marketOpportunity':
        return <TrendingUp className="w-4 h-4" />;
      case 'innovationPotential':
        return <Lightbulb className="w-4 h-4" />;
      case 'feasibility':
        return <Shield className="w-4 h-4" />;
      case 'impactPotential':
        return <Target className="w-4 h-4" />;
      case 'indiaContext':
        return <Users className="w-4 h-4" />;
      case 'globalRelevance':
        return <Globe className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <span className="text-gray-900 font-medium">Create New Project</span>
          {projectType && (
            <>
              <span>/</span>
              <span 
                className="hover:text-gray-700 cursor-pointer"
                onClick={() => {
                  setProjectType(null);
                  setSelectedSector(null);
                  setGeneratedProblems([]);
                  setProblemDescription('');
                  setInputMode('predefined');
                  setSelectedProblems(new Set());
                }}
              >
                {projectType === 'social-impact' ? 'Social Impact' : 'Business'}
              </span>
            </>
          )}
          {selectedSector && (
            <>
              <span>/</span>
              <span 
                className="hover:text-gray-700 cursor-pointer"
                onClick={() => {
                  setGeneratedProblems([]);
                  setSelectedProblems(new Set());
                }}
              >
                {getSectorName(selectedSector)}
              </span>
            </>
          )}
        </nav>

        <h1 className="text-3xl font-bold mb-8">Create New Project</h1>

        {/* Project Type Selection */}
        {!projectType && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Choose Project Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="p-6 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-indigo-300"
                onClick={() => handleProjectTypeSelect('social-impact')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Social Impact</h3>
                  <p className="text-gray-600 mb-4">Address societal challenges and contribute to UN Sustainable Development Goals</p>
                  <div className="text-sm text-gray-500">
                    <strong>17 SDG Categories:</strong> No Poverty, Zero Hunger, Good Health, Quality Education, and more...
                  </div>
                </div>
              </Card>

              <Card 
                className="p-6 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-indigo-300"
                onClick={() => handleProjectTypeSelect('business')}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Business</h3>
                  <p className="text-gray-600 mb-4">Solve business challenges and create market opportunities</p>
                  <div className="text-sm text-gray-500">
                    <strong>Business Sectors:</strong> Technology, Healthcare, Finance, Education, and more...
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Problem Input Section */}
        {projectType && generatedProblems.length === 0 && (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Define Your Problem</h2>
            
            {/* Custom Problem Description */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-700">Write your own problem:</h3>
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">
                  💡 <strong>Tip:</strong> Frame your problem as a "How Might We" statement for better results. 
                  Focus on the human experience and avoid prescribing solutions.
                </p>
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">View HMW Framework Guidelines</summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md space-y-2">
                    <p><strong>Good HMW examples:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>"How might we help remote teams stay connected and informed?"</li>
                      <li>"How might we reduce food waste in urban households?"</li>
                      <li>"How might we improve access to mental health resources for students?"</li>
                    </ul>
                    <p className="mt-2"><strong>Key principles:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Focus on human problems, not technical solutions</li>
                      <li>Broad enough for discovery, specific enough to be actionable</li>
                      <li>Address genuine pain points experienced by real people</li>
                    </ul>
                  </div>
                </details>
              </div>
              
              {/* Enhanced Text Input with PDF Upload */}
              <div className={`border-2 rounded-lg overflow-hidden transition-all duration-200 focus-within:ring-4 ${
                inputMode === 'custom' 
                  ? 'border-indigo-500 ring-indigo-200 bg-white' 
                  : 'border-gray-300 focus-within:border-indigo-400 focus-within:ring-indigo-100 bg-white'
              }`}>
                <textarea
                  placeholder="How might we help [specific group] [achieve specific outcome] in [specific context]?"
                  value={problemDescription}
                  onChange={(e) => {
                    setProblemDescription(e.target.value);
                    setInputMode('custom');
                    // Auto-resize the textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
                  }}
                  className="w-full min-h-[80px] max-h-[300px] p-4 text-base resize-none border-0 focus:outline-none bg-transparent"
                  style={{ fontSize: '16px' }}
                />
                {/* Toolbar: PDF Upload (System/Business toggles removed) */}
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-4 mt-1">
                  <label className="cursor-pointer flex items-center gap-2">
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isProcessingPdf}
                      className="flex items-center gap-2 w-auto rounded-full p-2 bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400"
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                    >
                      {isProcessingPdf ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                      <span className="text-sm text-gray-700">Add Context</span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Uploaded PDFs Display */}
              {uploadedPdfs.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">
                      📎 {uploadedPdfs.length} PDF(s) uploaded
                    </span>
                    <span className="text-xs text-green-600">
                      Context will be included in problem generation
                    </span>
                  </div>
                  <div className="space-y-1">
                    {uploadedPdfs.map((pdf, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-green-700 truncate flex-1">{pdf.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePdf(index)}
                          className="text-red-500 hover:text-red-700 p-1 h-6"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Predefined Sectors */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700">
                Select from {projectType === 'social-impact' ? 'SDG Goals' : 'Business Sectors'}:
              </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sectorsWithCustom.map((sector) => (
              <button
                key={sector.id}
                type="button"
                    onClick={() => handleSectorSelect(sector.id)}
                    className={`w-full py-4 px-3 rounded-lg border text-sm font-medium transition-all duration-150 focus:outline-none
                      ${selectedSector === sector.id && inputMode === 'predefined'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-indigo-50'}
                `}
                    aria-pressed={selectedSector === sector.id && inputMode === 'predefined'}
              >
                {sector.name}
              </button>
            ))}
          </div>
            </div>
            </div>
          )}

        {/* Generate Problem Button */}
        {((inputMode === 'predefined' && selectedSector) || (inputMode === 'custom' && problemDescription.trim())) && generatedProblems.length === 0 && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={() => setIsHmwTypeModalOpen(true)}
              disabled={isGenerating}
              className="shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-indigo-200 hover:border-indigo-300 bg-white"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Problem...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Generate Problem
                </>
              )}
            </Button>
            <Modal open={isHmwTypeModalOpen} onClose={() => setIsHmwTypeModalOpen(false)}>
              <h2 className="text-xl font-bold mb-4">Select HMW Prompt Type</h2>
              <div className="space-y-4">
                <div
                  className={`border rounded-lg p-4 cursor-pointer hover:border-indigo-400 transition ${selectedHmwType === 'human' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white'}`}
                  onClick={() => setSelectedHmwType('human')}
                >
                  <div className="font-semibold text-indigo-700 mb-1">Human-Centred HMW Prompt</div>
                  <div className="text-sm text-gray-700 mb-1">A people-focused challenge for creative ways to improve user experience or behaviour.</div>
                  <div className="text-xs text-gray-500 mb-1">Structure: "How might we help [target group] to [do / feel / understand X]?"</div>
                  <div className="text-xs text-gray-400 italic">Ex: How might we help first-time smartphone users in rural India feel confident making digital payments?</div>
                </div>
                <div
                  className={`border rounded-lg p-4 cursor-pointer hover:border-blue-400 transition ${selectedHmwType === 'system' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}`}
                  onClick={() => setSelectedHmwType('system')}
                >
                  <div className="font-semibold text-blue-700 mb-1">System-Focused HMW Prompt</div>
                  <div className="text-sm text-gray-700 mb-1">Tackles structures, policies, or processes for root-cause redesign.</div>
                  <div className="text-xs text-gray-500 mb-1">Structure: "How might we redesign / restructure [system component] to [deliver systemic outcome]?"</div>
                  <div className="text-xs text-gray-400 italic">Ex: How might we redesign India's agricultural supply-chain information system to create end-to-end traceability with real-time pricing for farmers?</div>
                </div>
                <div
                  className={`border rounded-lg p-4 cursor-pointer hover:border-green-400 transition ${selectedHmwType === 'business' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'}`}
                  onClick={() => setSelectedHmwType('business')}
                >
                  <div className="font-semibold text-green-700 mb-1">Pure-Business HMW Prompt</div>
                  <div className="text-sm text-gray-700 mb-1">A commercial strategy tool focused on financial impact, market opportunity, or efficiency.</div>
                  <div className="text-xs text-gray-500 mb-1">Structure: "How might we [business action] to [achieve quantified business outcome] by [X % / ₹ Y] within [timeframe] while [key constraint]?"</div>
                  <div className="text-xs text-gray-400 italic">Ex: How might we optimise our freemium pricing to raise conversion from 2% to 10% and reach ₹10 crore ARR within 12 months?</div>
                </div>
              </div>
              <div className="flex justify-end mt-6 gap-2">
                <Button variant="outline" onClick={() => setIsHmwTypeModalOpen(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!selectedHmwType) return;
                    setIsHmwTypeModalOpen(false);
                    setIsGenerating(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('generate-problem', {
                        body: {
                          projectType,
                          sector: inputMode === 'predefined' ? getSectorName(selectedSector || '') : '',
                          problemDescription: inputMode === 'custom' ? problemDescription.trim() : '',
                          pdfContext: pdfContext || undefined,
                          hmwType: selectedHmwType,
                        }
                      });
                      if (error) throw error;
                      if (!data || !data.title) throw new Error('No problem received from generation');
                      const newProblem = {
                        ...data,
                        hmwType: selectedHmwType,
                        id: `problem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      };
                      setGeneratedProblems(prev => [...prev, newProblem]);
                      toast.success('Problem generated successfully!');
                    } catch (error) {
                      console.error('Error generating problem:', error);
                      alert('Failed to generate problem. Please try again.');
                    } finally {
                      setIsGenerating(false);
                      setSelectedHmwType(null);
                    }
                  }}
                  disabled={!selectedHmwType || isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </Modal>
          </div>
        )}

        {/* Generated Problems Display */}
        {generatedProblems.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Generated Problem</h2>
              <div className="flex gap-2">
                <Button
                  onClick={handleSkillMatch}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Skill Match
                </Button>
                {selectedProblems.size > 0 && (
                  <Button
                    onClick={handleSaveSelectedProblems}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Project...
                      </>
                    ) : (
                      `Create Project`
                    )}
                  </Button>
                )}
                </div>
                  </div>

            {/* Selection Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 Select the problem that best matches your interests and skills. 
                Use the "Skill Match" button to automatically find the best match for your profile.
                Each problem includes a comprehensive Innovation Opportunity Score (IOS) assessment with verified sources from Tier 1-5 credibility framework.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                <strong>Source Verification Framework:</strong> Tier 1 (Government/UN) → Tier 5 (News/Blogs). Higher tiers = higher credibility and trust.
                </div>
              </div>

            {/* Problems List - Vertical */}
            <div className="flex flex-col gap-6 overflow-y-auto p-2">
              {generatedProblems.map((problem) => {
                const isSelected = selectedProblems.has(problem.id || 'temp-id');
                return (
                  <div key={problem.id || 'temp-id'}>
                    <Card 
                      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col h-full ${
                        isSelected 
                          ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleProblemToggle(problem.id || 'temp-id')}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-2">{problem.title}</h3>
                          <p className="text-xs text-gray-600">{problem.description}</p>
                        </div>
                        <div className="ml-2 text-right">
                          <div className="text-lg font-bold text-primary">
                            {problem.iosAssessment?.totalScore || problem.opportunityScore}%
                          </div>
                          <div className="text-xs text-gray-500">IOS Score</div>
                        </div>
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="text-xs">
                    <div className="flex justify-between">
                            <span>Market Opportunity</span>
                            <span>{problem.iosAssessment?.dimensions.marketOpportunity.score || problem.subscores.marketPotential}/20</span>
                    </div>
                    <div className="flex justify-between">
                            <span>Innovation Potential</span>
                            <span>{problem.iosAssessment?.dimensions.innovationPotential.score || problem.subscores.solutionGap}/20</span>
                    </div>
                    <div className="flex justify-between">
                            <span>Feasibility</span>
                            <span>{problem.iosAssessment?.dimensions.feasibility.score || problem.subscores.technicalFeasibility}/20</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {problem.requiredSkills.slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {problem.requiredSkills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                              +{problem.requiredSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="text-xs text-gray-500">
                          {isSelected ? 'Selected' : 'Click to select'}
                        </div>
                        <div className="flex gap-2">
                          {problemSlides[problem.id!] ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                setViewingSlide({ 
                                  problemId: problem.id!, 
                                  slide: problemSlides[problem.id!] 
                                });
                              }}
                              className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                            >
                              View Slide
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                handleGenerateSlideForProblem(problem);
                              }}
                              disabled={isGeneratingSlide}
                            >
                              {isGeneratingSlide ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                'Generate Slide'
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              setSourcesProblem(problem);
                            }}
                          >
                            Sources
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              setDetailedProblem(problem);
                            }}
                          >
                            Detailed View
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* Problem Sources Modal */}
            {sourcesProblem && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Problem Sources & Verification Framework</h3>
                      <Button
                        onClick={() => setSourcesProblem(null)}
                        variant="ghost"
                        size="sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                    
                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
                      {/* Left Column - Source Verification Framework */}
                      <div className="lg:border-r lg:border-gray-200 lg:pr-6">
                        <h4 className="font-medium text-gray-900 mb-3">Source Verification Framework</h4>
                        <SourceVerificationInfo showDetails={true} />
                      </div>
                      
                      {/* Right Column - Scrollable Sources */}
                      <div className="overflow-y-auto">
                        <h4 className="font-medium text-gray-900 mb-3">Problem Sources by Tier</h4>
                        <div className="space-y-4">
                          {[1, 2, 3, 4, 5].map(tier => {
                            const tierSources = Object.values(sourcesProblem.iosAssessment?.dimensions || {}).flatMap(d => 
                              d.sources.filter(s => s.tier === tier)
                            );
                            const tierInfo = SourceVerificationService.getTierInfo(tier);
                            return (
                              <div key={tier} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                      tier <= 2 ? 'bg-green-400' : 
                                      tier <= 3 ? 'bg-yellow-400' : 'bg-red-400'
                                    }`}></span>
                                    <span className="font-medium">Tier {tier} - {tierInfo?.name}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">{tierSources.length} sources</span>
                                </div>
                                {tierSources.length > 0 ? (
                                  <div className="space-y-2">
                                    {tierSources.map((source, index) => (
                                      <div key={index} className="border-l-4 border-gray-200 pl-3 py-1">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm font-medium text-gray-900">{source.name}</span>
                                          <span className={`text-xs ${SourceVerificationService.getBiasColor(source.biasScore || 75)}`}>
                                            Bias: {source.biasScore || 75}%
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600 mb-1">{source.credibility}</div>
                                        {source.url && (
                                          <a 
                                            href={source.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                          >
                                            View Source
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">No sources in this tier</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Problem Detailed View Modal */}
            {detailedProblem && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Problem Detailed View</h3>
                      <Button
                        onClick={() => setDetailedProblem(null)}
                        variant="ghost"
                        size="sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                    {detailedProblem.iosAssessment && (
                      <IOSAssessmentCard
                        assessment={detailedProblem.iosAssessment}
                        problemTitle={detailedProblem.title}
                      />
                    )}
                    {/* Type-specific fields */}
                    {isSystemProblem(detailedProblem) && (
                      <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                        <h4 className="font-semibold text-blue-800 mb-2">System Impact Potential</h4>
                        <div className="text-sm text-gray-700 mb-1">Score: {detailedProblem.iosAssessment.dimensions.systemImpactPotential.score}</div>
                        <div className="text-xs text-gray-500 mb-1">{detailedProblem.iosAssessment.dimensions.systemImpactPotential.name}</div>
                        {/* Render subscores, evidence, sources as needed */}
                      </div>
                    )}
                    {isBusinessProblem(detailedProblem) && (
                      <div className="mt-4 p-4 border rounded-lg bg-green-50">
                        <h4 className="font-semibold text-green-800 mb-2">Business Impact Potential</h4>
                        <div className="text-sm text-gray-700 mb-1">Score: {detailedProblem.iosAssessment.dimensions.businessImpactPotential.score}</div>
                        <div className="text-xs text-gray-500 mb-1">{detailedProblem.iosAssessment.dimensions.businessImpactPotential.name}</div>
                        {/* Render subscores, evidence, sources as needed */}
                      </div>
                    )}
                    {isBusinessProblem(detailedProblem) && detailedProblem.businessMetrics && (
                      <div className="mt-4 p-4 border rounded-lg bg-yellow-50">
                        <h4 className="font-semibold text-yellow-800 mb-2">Business Metrics</h4>
                        <ul className="text-sm text-gray-700">
                          {Object.entries(detailedProblem.businessMetrics).map(([key, value]) => (
                            <li key={key}><span className="font-medium">{key}:</span> {value}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Slide View Modal */}
            {viewingSlide && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Presentable Slide</h3>
                      <Button
                        onClick={() => setViewingSlide(null)}
                        variant="ghost"
                        size="sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                    
                    <div className="overflow-y-auto max-h-[70vh]">
                      <div className="relative rounded-2xl border-2 border-gray-300 shadow p-0 overflow-hidden">
                        {/* HMW Statement */}
                        <div className="bg-yellow-200 text-gray-900 font-bold text-2xl text-center px-12 py-8">
                          {viewingSlide.slide.hmw}
                        </div>
                        {/* Bullets */}
                        <div className="bg-white px-16 py-10">
                          <ul className="list-disc space-y-3 text-gray-800 ml-8">
                            {viewingSlide.slide.bullets.map((bullet, i) => (
                              <li key={i}>{bullet}</li>
                    ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 