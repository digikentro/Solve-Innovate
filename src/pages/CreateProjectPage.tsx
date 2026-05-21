import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProblemStatement } from '@/services/iosFramework';
import { IOSFrameworkService } from '@/services/iosFramework';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Info, ArrowUp, Paperclip } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SourceVerificationInfo } from '@/components/ui/SourceVerificationInfo';
import { SourceVerificationService } from '@/services/sourceVerificationService';
import { ProjectService } from '@/services/projectService';
import { FiArrowLeft } from 'react-icons/fi';
import Modal from '@/components/ui/Modal';
import { profileService } from '@/services/profileService';
import type { Profile } from '@/services/profileService';
import { AssessmentProblemDetailedView } from '@/components/ui/AssessmentProblemDetailedView';
import { PresentableSlideCard } from '@/components/project/PresentableSlideCard';

type ProblemStatementWithGeneratedAt = ProblemStatement & { generatedAt?: string };

const BUSINESS_SECTORS = [
  { id: 'technology', name: 'Technology' },
  { id: 'hardware_electronics', name: 'Hardware and Electronics' },
  { id: 'digital_services', name: 'Digital Services' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'pharmaceuticals_biotechnology', name: 'Pharmaceuticals and Biotechnology' },
  { id: 'medical_devices', name: 'Medical Devices and Equipment' },
  { id: 'finance', name: 'Financial Services' },
  { id: 'banking_credit', name: 'Banking and Credit' },
  { id: 'investment_asset_management', name: 'Investment and Asset Management' },
  { id: 'insurance', name: 'Insurance' },
  { id: 'retail', name: 'Retail Trade' },
  { id: 'consumer_products', name: 'Consumer Products' },
  { id: 'manufacturing', name: 'Manufacturing and Industrial' },
  { id: 'heavy_manufacturing', name: 'Heavy Manufacturing' },
  { id: 'light_manufacturing', name: 'Light Manufacturing' },
  { id: 'energy', name: 'Energy and Utilities' },
  { id: 'traditional_energy', name: 'Traditional Energy' },
  { id: 'renewable_energy', name: 'Renewable Energy' },
  { id: 'transportation', name: 'Transportation and Logistics' },
  { id: 'transportation_services', name: 'Transportation Services' },
  { id: 'automotive', name: 'Automotive Industry' },
  { id: 'real_estate', name: 'Real Estate' },
  { id: 'construction', name: 'Construction' },
  { id: 'media', name: 'Media and Entertainment' },
  { id: 'traditional_media', name: 'Traditional Media' },
  { id: 'digital_media', name: 'Digital Media' },
  { id: 'education', name: 'Education' },
  { id: 'traditional_education', name: 'Traditional Education' },
  { id: 'edtech', name: 'Educational Technology (EdTech)' },
  { id: 'agriculture', name: 'Agriculture and Food' },
  { id: 'agriculture_farming', name: 'Agriculture' },
  { id: 'food_industry', name: 'Food Industry' },
  { id: 'professional_services', name: 'Professional Services' },
  { id: 'business_services', name: 'Business Services' },
  { id: 'technical_services', name: 'Technical Services' },
  { id: 'government', name: 'Government and Public Sector' },
  { id: 'government_services', name: 'Government Services' },
  { id: 'public_infrastructure', name: 'Public Infrastructure' },
  { id: 'nonprofit', name: 'Non-Profit and Social Sector' },
  { id: 'nonprofit_organizations', name: 'Non-Profit Organizations' },
  { id: 'social_services', name: 'Social Services' },
  { id: 'emerging_cross_sector', name: 'Emerging and Cross-Sector Industries' },
  { id: 'sustainability_green_economy', name: 'Sustainability and Green Economy' },
  { id: 'digital_transformation', name: 'Digital Transformation' },
  { id: 'health_wellness', name: 'Health and Wellness' },
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

const LOADING_MESSAGES = [
  'Brainstorming creative challenges…',
  'Scouting for innovation opportunities…',
  'Consulting the wisdom of the crowd…',
  'Synthesizing insights from global experts…',
  'Shuffling through the innovation playbook…',
  'Finding the next big breakthrough…',
  'Turning problems into possibilities…',
];

const SKILL_MATCH_MESSAGES = [
  'Analyzing your skills…',
  'Finding the perfect match…',
  'Comparing with generated problems…',
  'Identifying best opportunities…',
  'Matching skills to challenges…',
  'Finding your ideal project…',
  'Connecting skills to impact…',
];

const INTEREST_MATCH_MESSAGES = [
  'Analyzing your interests…',
  'Finding the perfect match…',
  'Comparing with generated problems…',
  'Identifying best opportunities…',
  'Matching interests to challenges…',
  'Finding your ideal project…',
  'Connecting passions to impact…',
];

function LoadingOverlay({ show }: { show: boolean }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (show) {
      intervalRef.current = setInterval(() => {
        setMsgIdx(idx => (idx + 1) % LOADING_MESSAGES.length);
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setMsgIdx(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [show]);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black bg-opacity-60">
      <div className="flex flex-col items-center gap-6 p-8 bg-white bg-opacity-90 rounded-2xl shadow-2xl border-2 border-indigo-200 w-96 h-64">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-2" />
        <div className="text-xl font-semibold text-indigo-800 animate-pulse text-center h-16 w-full flex items-center justify-center px-4">
          {LOADING_MESSAGES[msgIdx]}
        </div>
        <div className="text-xs text-gray-500 mt-2">This may take a few seconds…</div>
      </div>
    </div>
  );
}

function SkillMatchOverlay({ show }: { show: boolean }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (show) {
      intervalRef.current = setInterval(() => {
        setMsgIdx(idx => (idx + 1) % SKILL_MATCH_MESSAGES.length);
      }, 1500);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setMsgIdx(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [show]);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black bg-opacity-60">
      <div className="flex flex-col items-center gap-6 p-8 bg-white bg-opacity-90 rounded-2xl shadow-2xl border-2 border-indigo-200">
        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-2" />
        <div className="text-xl font-semibold text-indigo-800 animate-pulse text-center min-h-[2.5em]">
          {SKILL_MATCH_MESSAGES[msgIdx]}
        </div>
        <div className="text-xs text-gray-500 mt-2">Finding your perfect match…</div>
      </div>
    </div>
  );
}

function InterestMatchOverlay({ show }: { show: boolean }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (show) {
      intervalRef.current = setInterval(() => {
        setMsgIdx(idx => (idx + 1) % INTEREST_MATCH_MESSAGES.length);
      }, 1500);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setMsgIdx(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [show]);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black bg-opacity-60">
      <div className="flex flex-col items-center gap-6 p-8 bg-white bg-opacity-90 rounded-2xl shadow-2xl border-2 border-green-200">
        <Loader2 className="w-16 h-16 text-green-600 animate-spin mb-2" />
        <div className="text-xl font-semibold text-green-800 animate-pulse text-center min-h-[2.5em]">
          {INTEREST_MATCH_MESSAGES[msgIdx]}
        </div>
        <div className="text-xs text-gray-500 mt-2">Finding your perfect match…</div>
      </div>
    </div>
  );
}

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectType, setProjectType] = useState<'social-impact' | 'business' | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblems, setGeneratedProblems] = useState<ProblemStatementWithGeneratedAt[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [inputMode, setInputMode] = useState<'predefined' | 'custom'>('predefined');
  const [detailedProblem, setDetailedProblem] = useState<ProblemStatementWithGeneratedAt | null>(null);
  const [sourcesProblem, setSourcesProblem] = useState<ProblemStatementWithGeneratedAt | null>(null);
  const [uploadedPdfs, setUploadedPdfs] = useState<File[]>([]);
  const [pdfContext, setPdfContext] = useState<string>('');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [generatingSlides, setGeneratingSlides] = useState<Set<string>>(new Set());
  const [problemSlides, setProblemSlides] = useState<Record<string, { hmw: string; bullets: string[] }>>({});
  const [viewingSlide, setViewingSlide] = useState<{
    problemId: string;
    slide: {
      hmw: string;
      bullets: string[];
      iconSet?: string;
      iconName?: string;
    };
  } | null>(null);
  const [isHmwTypeModalOpen, setIsHmwTypeModalOpen] = useState(false);
  const [selectedHmwType, setSelectedHmwType] = useState<null | 'human' | 'system' | 'business'>(null);
  const [lastHmwType, setLastHmwType] = useState<null | 'human' | 'system' | 'business'>(null);
  const isGeneratingMoreRef = useRef(false);
  const [isSkillMatching, setIsSkillMatching] = useState(false);
  const [skillMatchReasoning, setSkillMatchReasoning] = useState<{ problemId: string; reasoning: string } | null>(null);
  const [showSkillMatchModal, setShowSkillMatchModal] = useState(false);
  const [isInterestMatching, setIsInterestMatching] = useState(false);
  const [interestMatchReasoning, setInterestMatchReasoning] = useState<{ problemId: string; reasoning: string } | null>(null);
  const [showInterestMatchModal, setShowInterestMatchModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showHmwGuidelinesModal, setShowHmwGuidelinesModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const prof = await profileService.getProfile();
      setProfile(prof);
    };
    fetchProfile();
  }, []);

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
    setSkillMatchReasoning(null);

  };

  const handleSectorSelect = (sectorId: string) => {
    setSelectedSector(sectorId);
    setGeneratedProblems([]);
    setInputMode('predefined');
    setSelectedProblems(new Set());
    setSkillMatchReasoning(null);
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
        // Limit to 3 selections
        if (newSet.size < 3) {
          newSet.add(problemId);
        } else {
          toast.error('You can only select up to 3 problems at a time');
        }
      }
      return newSet;
    });
  };

  const handleSkillMatch = async () => {
    if (generatedProblems.length === 0) {
      toast.error('Please generate problems first');
      return;
    }

    let userSkills = profile?.skills;
    if (!Array.isArray(userSkills)) userSkills = [];
    if (userSkills.length === 0) {
      toast.error('No skills found in your profile. Please update your skills first.');
      return;
    }

    setIsSkillMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-skill', {
        body: {
          userSkills,
          generatedProblems
        }
      });

      if (error) throw error;

      if (data && data.success && data.matchedProblem) {
        setSelectedProblems(new Set([data.matchedProblem.id!]));

        // Store the reasoning for display
        setSkillMatchReasoning({
          problemId: data.matchedProblem.id!,
          reasoning: data.matchedProblem.reasoning
        });

        // Show simple success message with reasoning
        toast.success(
          `Matched: "${data.matchedProblem.title}"`,
          { duration: 3000 }
        );


      } else if (data && !data.success) {
        toast.error(data.message || 'No skills match found');
      } else {
        toast.error('No skills match found. Try updating your skills or generating more problems.');
      }
    } catch (error) {
      console.error('Error matching skills:', error);
      toast.error('Failed to match skills. Please try again.');
    } finally {
      setIsSkillMatching(false);
    }
  };

  const handleInterestMatch = async () => {
    if (generatedProblems.length === 0) {
      toast.error('Please generate problems first');
      return;
    }

    let userInterests = profile?.interests;
    if (!Array.isArray(userInterests)) userInterests = [];
    if (userInterests.length === 0) {
      toast.error('No interests found in your profile. Please update your interests first.');
      return;
    }

    setIsInterestMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-interest', {
        body: {
          userInterests,
          generatedProblems
        }
      });

      if (error) throw error;

      if (data && data.success && data.matchedProblem) {
        setSelectedProblems(new Set([data.matchedProblem.id!]));

        // Store the reasoning for display
        setInterestMatchReasoning({
          problemId: data.matchedProblem.id!,
          reasoning: data.matchedProblem.reasoning
        });

        // Show simple success message with reasoning
        toast.success(
          `Matched: "${data.matchedProblem.title}"`,
          { duration: 3000 }
        );


      } else if (data && !data.success) {
        toast.error(data.message || 'No interests match found');
      } else {
        toast.error('No interests match found. Try updating your interests or generating more problems.');
      }
    } catch (error) {
      console.error('Error matching interests:', error);
      toast.error('Failed to match interests. Please try again.');
    } finally {
      setIsInterestMatching(false);
    }
  };

  const handleGenerateSlideForProblem = async (problem: ProblemStatement) => {
    if (!problem.id) return;

    setGeneratingSlides(prev => new Set([...prev, problem.id!]));
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
            bullets: data.bullets,
            iconSet: data.iconSet || '',
            iconName: data.iconName || '',
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
      setGeneratingSlides(prev => {
        const newSet = new Set(prev);
        if (problem.id) {
          newSet.delete(problem.id);
        }
        return newSet;
      });
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
      const createdProjects = [];

      for (const problem of selectedProblemData) {
        // Remove HMW name/title from assessment if present
        let assessment = problem.iosAssessment ? { ...problem.iosAssessment } : undefined;
        if (assessment) {
          (assessment as any).name = 'Initial Analysis';
          (assessment as any).createdAt = problem.createdAt || new Date().toISOString();
        }
        const project = await ProjectService.createProject({
          title: problem.title,
          description: problem.description,
          skills: problem.requiredSkills,
          status: 'draft',
          analysis: assessment ? [assessment] : [],
          presentable_slide: problemSlides[problem.id!] || undefined,
        }, user.id);
        createdProjects.push(project);
      }

      toast.success('Project(s) created successfully!');

      // Navigate based on number of projects created
      if (createdProjects.length === 1) {
        // Single project - navigate to project detail page
        navigate(`/projects/${createdProjects[0].id}`);
      } else {
        // Multiple projects - navigate to projects list page
        navigate('/projects');
      }
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

  const generateHMW = async (hmwTypeToUse: 'human' | 'system' | 'business') => {
    setIsGenerating(true);
    isGeneratingMoreRef.current = true;
    const now = new Date();
    try {
      const previousHmws = generatedProblems.map(problem => ({
        title: problem.title,
        iosScore: problem.iosAssessment?.totalScore || problem.opportunityScore
      }));
      const { data, error } = await supabase.functions.invoke('generate-problem', {
        body: {
          projectType,
          inputMode,
          sector: inputMode === 'predefined' ? getSectorName(selectedSector || '') : '',
          problemDescription: inputMode === 'custom' ? problemDescription.trim() : '',
          pdfContext: pdfContext || undefined,
          hmwType: hmwTypeToUse,
          previousHmws,
        }
      });
      if (error) throw error;
      if (!data || !data.title) throw new Error('No problem received from generation');
      let iosAssessment = data.iosAssessment;
      if (iosAssessment && iosAssessment.dimensions) {
        iosAssessment = {
          ...iosAssessment,
          totalScore: IOSFrameworkService.calculateIOSScore(iosAssessment)
        };
      }
      const newProblem = {
        ...data,
        id: `problem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        iosAssessment,
        generatedAt: now.toISOString(),
      };
      setGeneratedProblems(prev => [...prev, newProblem]);
      // Clear skill match reasoning when new problems are generated
      setSkillMatchReasoning(null);
      setInterestMatchReasoning(null);
      toast.success('Problem generated successfully!');
    } catch (error) {
      console.error('Error generating problem:', error);
      alert('Failed to generate problem. Please try again.');
    } finally {
      setIsGenerating(false);
      isGeneratingMoreRef.current = false;
    }
  };



  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation with back button */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => {
              if (projectType) {
                // If we're in step 2 (Define Your Problem), go back to step 1 (Choose Project Type)
                setProjectType(null);
                setSelectedSector(null);
                setGeneratedProblems([]);
                setProblemDescription('');
                setInputMode('predefined');
                setSelectedProblems(new Set());
              } else {
                // If we're in step 1 (Choose Project Type), go back to projects page
                navigate('/projects');
              }
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white text-indigo-600 shadow-sm hover:bg-indigo-50 hover:text-indigo-800 transition border border-indigo-200 flex-shrink-0"
            type="button"
            aria-label="Back"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="text-gray-500">Create New Project</span>
            {projectType && (
              <>
                <span>/</span>
                <span className="text-gray-500">
                  {projectType === 'social-impact' ? 'Social Impact' : 'Business'}
                </span>
              </>
            )}
            {selectedSector && (
              <>
                <span>/</span>
                <span className="text-gray-500">
                  {getSectorName(selectedSector)}
                </span>
              </>
            )}
          </nav>
        </div>

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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Define Your Problem</h2>
              <button
                type="button"
                onClick={() => setShowHmwGuidelinesModal(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                <span>View HMW Framework Guidelines</span>
              </button>
            </div>

            {/* Custom Problem Description */}
            <div className="mb-6">
              {/* HMW Guidelines modal */}
              <Modal open={showHmwGuidelinesModal} onClose={() => setShowHmwGuidelinesModal(false)}>
                <h2 className="text-xl font-bold mb-4">HMW Framework Guidelines</h2>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Good HMW examples:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>"How might we help remote teams stay connected and informed?"</li>
                      <li>"How might we reduce food waste in urban households?"</li>
                      <li>"How might we improve access to mental health resources for students?"</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Key principles:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Focus on human problems, not technical solutions</li>
                      <li>Broad enough for discovery, specific enough to be actionable</li>
                      <li>Address genuine pain points experienced by real people</li>
                    </ul>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <p className="text-indigo-800"><strong>💡 Tip:</strong> Frame your problem as a "How Might We" statement for better results. Focus on the human experience and avoid prescribing solutions.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Three HMW prompt types:</p>
                    <div className="space-y-2">
                      <div className="p-2 bg-indigo-50 rounded-md"><span className="font-medium text-indigo-700">Human-Centred:</span> <span className="text-gray-600">"How might we help [target group] to [do / feel / understand X]?"</span></div>
                      <div className="p-2 bg-blue-50 rounded-md"><span className="font-medium text-blue-700">System-Focused:</span> <span className="text-gray-600">"How might we redesign [system component] to [deliver systemic outcome]?"</span></div>
                      <div className="p-2 bg-green-50 rounded-md"><span className="font-medium text-green-700">Pure-Business:</span> <span className="text-gray-600">"How might we [business action] to [achieve quantified outcome] within [timeframe]?"</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button onClick={() => setShowHmwGuidelinesModal(false)}>Got it</Button>
                </div>
              </Modal>

              {/* Claude/ChatGPT-style textarea card */}
              <div className={`relative rounded-2xl shadow-md border bg-white transition-all duration-200 focus-within:shadow-lg ${
                inputMode === 'custom' ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200 focus-within:border-gray-300'
              }`}>
                {/* Uploaded file chips (Claude-style) */}
                {uploadedPdfs.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 pt-3">
                    {uploadedPdfs.map((pdf, index) => (
                      <div key={index} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 max-w-[200px] transition-colors">
                        <Paperclip className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{pdf.name}</span>
                        <button
                          type="button"
                          onClick={() => removePdf(index)}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors ml-0.5"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Textarea */}
                <textarea
                  placeholder="How might we help [specific group] [achieve specific outcome] in [specific context]?"
                  value={problemDescription}
                  onChange={(e) => {
                    setProblemDescription(e.target.value);
                    setInputMode('custom');
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
                  }}
                  className="w-full min-h-[56px] max-h-[300px] px-4 pt-3 pb-2 text-base resize-none border-0 focus:outline-none bg-transparent placeholder-gray-400 text-gray-800 leading-relaxed"
                />

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between px-3 pb-3 pt-1">
                  {/* Left: Add Context (hover-expand) */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <button
                      type="button"
                      disabled={isProcessingPdf}
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                      className="group flex items-center gap-0 hover:gap-1.5 overflow-hidden rounded-full p-2 hover:px-3 border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 transition-all duration-200 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      title="Add context (PDF)"
                    >
                      {isProcessingPdf ? (
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      ) : (
                        <Paperclip className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium max-w-0 group-hover:max-w-[80px] overflow-hidden transition-all duration-200 whitespace-nowrap">
                        Add Context
                      </span>
                    </button>
                    {isProcessingPdf && (
                      <span className="text-xs text-gray-500">Processing…</span>
                    )}
                  </div>

                  {/* Right: Arrow send button */}
                  {((inputMode === 'predefined' && selectedSector) || (inputMode === 'custom' && problemDescription.trim())) ? (
                    <button
                      type="button"
                      disabled={isGenerating}
                      title="Generate Problem"
                      onClick={async () => {
                        if (inputMode === 'custom') {
                          const wordCount = problemDescription.trim().split(/\s+/).length;
                          if (wordCount < 10) { toast.error('Please describe more.'); return; }
                        }
                        setLastHmwType('human');
                        await generateHMW('human');
                      }}
                      className="group flex items-center gap-0 hover:gap-2 overflow-hidden rounded-full p-2 hover:px-3 bg-[#232323] hover:bg-[#111] text-white transition-all duration-200 disabled:opacity-50 justify-center flex-shrink-0"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                      ) : (
                        <ArrowUp className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium max-w-0 group-hover:max-w-[120px] overflow-hidden whitespace-nowrap transition-all duration-200">
                        {isGenerating ? 'Generating…' : 'Generate Problem'}
                      </span>
                    </button>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <ArrowUp className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>


            </div>



            {/* Simple separator */}
            <div className="my-8">
              <p className="text-sm text-gray-400">or use our prompts</p>
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

        {/* Generate Problem Modal */}
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
                    setLastHmwType(selectedHmwType); // Remember last used type
                    try {
                      await generateHMW(selectedHmwType);
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

        {/* Engaging loading overlay for initial HMW generation */}
        <LoadingOverlay show={isGenerating && generatedProblems.length === 0} />

        {/* Generated Problems Display */}
        {generatedProblems.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Generated Problems</h2>
              <div className="flex gap-2">
                <Button
                  onClick={handleSkillMatch}
                  variant="outline"
                  disabled={isSkillMatching}
                  className="flex items-center gap-2"
                >
                  {isSkillMatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Matching...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Skill Match
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleInterestMatch}
                  variant="outline"
                  disabled={isInterestMatching}
                  className="flex items-center gap-2"
                >
                  {isInterestMatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Matching...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Interest Match
                    </>
                  )}
                </Button>
                <div className="relative group">
                  <Button
                    onClick={handleSaveSelectedProblems}
                    disabled={selectedProblems.size === 0 || isSaving}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Project...
                      </>
                    ) : ('Create Project(s)'
                    )}
                  </Button>
                  {selectedProblems.size === 0 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Select at least 1 problem to create project
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Problems List - Vertical */}
            <div className="flex flex-col gap-6 overflow-y-auto p-2">
              {generatedProblems.map((problem) => {
                const isSelected = selectedProblems.has(problem.id || 'temp-id');
                return (
                  <div key={problem.id || 'temp-id'}>
                    <Card
                      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col h-full ${isSelected
                        ? 'ring-2 ring-indigo-500 bg-indigo-50'
                        : 'hover:bg-gray-50'
                        }`}
                      onClick={() => handleProblemToggle(problem.id || 'temp-id')}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-sm">{problem.title}</h3>
                            {skillMatchReasoning && skillMatchReasoning.problemId === problem.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowSkillMatchModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
                                title="Click to see why this problem matches your skills"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Skill Match
                              </button>
                            )}
                            {interestMatchReasoning && interestMatchReasoning.problemId === problem.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowInterestMatchModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium hover:bg-pink-200 transition-colors"
                                title="Click to see why this problem matches your interests"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                Interest Match
                              </button>
                            )}
                          </div>
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
                            <span>{problem.iosAssessment?.dimensions?.marketOpportunity?.score !== undefined ? problem.iosAssessment.dimensions.marketOpportunity.score : '-'}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Innovation Potential</span>
                            <span>{problem.iosAssessment?.dimensions?.innovationPotential?.score !== undefined ? problem.iosAssessment.dimensions.innovationPotential.score : '-'}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Feasibility</span>
                            <span>{problem.iosAssessment?.dimensions?.feasibility?.score !== undefined ? problem.iosAssessment.dimensions.feasibility.score : '-'}/10</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {problem.requiredSkills.slice(0, 3).map((skill: string, i: number) => (
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
                          {isSelected ? 'Selected' : `Click to select (${selectedProblems.size}/3 max)`}
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
                              disabled={generatingSlides.has(problem.id!)}
                            >
                              {generatingSlides.has(problem.id!) ? (
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

            {/* Generate More Button */}
            {generatedProblems.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={async () => {
                    if (lastHmwType) {
                      setIsGenerating(true);
                      await generateHMW(lastHmwType);
                    } else {
                      setIsHmwTypeModalOpen(true);
                    }
                  }}
                  disabled={isGenerating}
                  className="px-8 py-3 text-lg font-semibold bg-[#232323] text-white rounded-full shadow hover:bg-[#111] transition flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...
                    </>
                  ) : (
                    'Generate More'
                  )}
                </Button>
              </div>
            )}

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
                            const tierSources = Object.values(sourcesProblem.iosAssessment?.dimensions || {}).flatMap((d: any) =>
                              Array.isArray(d.sources) ? d.sources.filter((s: any) => s.tier === tier) : []
                            );
                            const tierInfo = SourceVerificationService.getTierInfo(tier);
                            return (
                              <div key={tier} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${SourceVerificationService.getTierColor(tier)}`}></span>
                                    <span className="font-medium">Tier {tier} - {tierInfo?.name}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">{tierSources.length} sources</span>
                                </div>
                                {tierSources.length > 0 ? (
                                  <div className="space-y-2">
                                    {tierSources.map((source, index) => (
                                      <div key={index} className="border-l-4 border-gray-200 pl-3 py-1">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center">                            <span className="text-xs font-medium text-gray-900">{source.name}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="px-2 py-1 rounded text-xs font-medium">&nbsp;</span>
                                            <span className={`text-xs ${SourceVerificationService.getBiasColor(source.biasScore || 75)}`}></span>
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-600 mb-1">{source.credibility}</div>
                                        {source.url && (
                                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>View Source →</a>
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

            {/* Problem Detailed View Modal (Reusable) */}
            <AssessmentProblemDetailedView
              open={!!detailedProblem}
              onClose={() => setDetailedProblem(null)}
              assessment={detailedProblem?.iosAssessment}
              problemTitle={detailedProblem?.title || ''}
              generatedAt={detailedProblem?.generatedAt ? new Date(detailedProblem.generatedAt) : undefined}
              viewType="problem"
            />

            {/* Slide View Modal (Reusable) */}
            {viewingSlide && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
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
                    <div className="overflow-y-auto">
                      <PresentableSlideCard
                        hmw={viewingSlide.slide.hmw}
                        bullets={viewingSlide.slide.bullets}
                        iconSet={viewingSlide.slide.iconSet as any}
                        iconName={viewingSlide.slide.iconName || ''}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skill Match Reasoning Modal */}
            {showSkillMatchModal && skillMatchReasoning && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Skill Match Reasoning
                      </h3>
                      <Button
                        onClick={() => setShowSkillMatchModal(false)}
                        variant="ghost"
                        size="sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>

                    <div className="overflow-y-auto max-h-[70vh]">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-green-800 mb-2">Why this problem matches your skills:</h4>
                        <p className="text-green-700 text-sm leading-relaxed">
                          {skillMatchReasoning.reasoning}
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Your Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile?.skills?.map((skill: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showInterestMatchModal && interestMatchReasoning && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Interest Match Reasoning
                      </h3>
                      <Button
                        onClick={() => setShowInterestMatchModal(false)}
                        variant="ghost"
                        size="sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>

                    <div className="overflow-y-auto max-h-[70vh]">
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-pink-800 mb-2">Why this problem matches your interests:</h4>
                        <p className="text-pink-700 text-sm leading-relaxed">
                          {interestMatchReasoning.reasoning}
                        </p>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-medium text-purple-800 mb-2">Your Interests:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile?.interests?.map((interest: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                            >
                              {interest}
                            </span>
                          ))}
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
      {/* Skill matching loading overlay */}
      <SkillMatchOverlay show={isSkillMatching} />
      {/* Interest matching loading overlay */}
      <InterestMatchOverlay show={isInterestMatching} />
    </div>
  );
} 