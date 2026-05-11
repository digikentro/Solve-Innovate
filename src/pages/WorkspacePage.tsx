import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useNavDirection } from '@/contexts/NavigationContext';
import { ProblemStatement, IOSFrameworkService } from '@/services/iosFramework';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowUp, ChevronDown, ChevronUp, User, Paperclip, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProjectService } from '@/services/projectService';
import { profileService, type Profile } from '@/services/profileService';
import { AssessmentProblemDetailedView } from '@/components/ui/AssessmentProblemDetailedView';
import { SourceVerificationInfo } from '@/components/ui/SourceVerificationInfo';
import { SourceVerificationService } from '@/services/sourceVerificationService';
import { AnimatedBlob } from '@/components/ui/AnimatedBlob';
import { IOSAssessmentCard } from '@/components/ui/IOSAssessmentCard';
import { Plasma } from '@/components/ui/Plasma';

type ProblemStatementWithGeneratedAt = ProblemStatement & { generatedAt?: string };

const BUSINESS_SECTORS = [
  { id: 'technology', name: 'Technology' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'finance', name: 'Financial Services' },
  { id: 'education', name: 'Education' },
  { id: 'retail', name: 'Retail Trade' },
  { id: 'manufacturing', name: 'Manufacturing' },
  { id: 'energy', name: 'Energy & Utilities' },
  { id: 'transportation', name: 'Transportation' },
];

const SDG_GOALS = [
  { id: 'sdg-1', name: 'No Poverty', number: 1 },
  { id: 'sdg-2', name: 'Zero Hunger', number: 2 },
  { id: 'sdg-3', name: 'Good Health & Well-being', number: 3 },
  { id: 'sdg-4', name: 'Quality Education', number: 4 },
  { id: 'sdg-5', name: 'Gender Equality', number: 5 },
  { id: 'sdg-13', name: 'Climate Action', number: 13 },
];


export function WorkspacePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setTopBarTitle, setShowPlasma } = useWorkspace();
  const { setDirection } = useNavDirection();
  
  const [profileLoading, setProfileLoading] = useState(true);
  const [projectType, setProjectType] = useState<'social-impact' | 'business' | null>(null);
  const [prompt, setPrompt] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblem, setGeneratedProblem] = useState<ProblemStatementWithGeneratedAt | null>(null);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  
  const [isSkillMatching, setIsSkillMatching] = useState(false);
  const [isInterestMatching, setIsInterestMatching] = useState(false);
  const [matchReasoning, setMatchReasoning] = useState<{ type: 'skill' | 'interest', reasoning: string } | null>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDetailedViewOpen, setIsDetailedViewOpen] = useState(false);
  
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showSkillMatchModal, setShowSkillMatchModal] = useState(false);
  const [showInterestMatchModal, setShowInterestMatchModal] = useState(false);

  // PDF Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPdfs, setUploadedPdfs] = useState<File[]>([]);
  const [pdfContext, setPdfContext] = useState<string>('');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);


  const [contentVisible, setContentVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setTopBarTitle(generatedProblem ? generatedProblem.title : 'New Project');
  }, [generatedProblem, setTopBarTitle]);


  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      try {
        console.log('Fetching profile for user:', user.id);
        const prof = await profileService.getProfile();
        console.log('Fetched profile:', prof);
        setProfile(prof);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Handle Global Plasma visibility
  useEffect(() => {
    // Show plasma if we haven't generated a problem and aren't generating one
    const shouldShow = !generatedProblem && !isGenerating;
    setShowPlasma(shouldShow);
    
    // Clean up on unmount
    return () => setShowPlasma(false);
  }, [generatedProblem, isGenerating, setShowPlasma]);

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      toast.error('Please select PDF files only');
      return;
    }

    setIsProcessingPdf(true);
    try {
      const newPdfs = [...uploadedPdfs, ...pdfFiles];
      setUploadedPdfs(newPdfs);

      // Simulate extracting text
      await new Promise(r => setTimeout(r, 1000));
      const extractedText = pdfFiles.map(f => `Simulated content of ${f.name}`).join('\n');
      setPdfContext(prev => prev + '\n' + extractedText);
      toast.success(`Attached ${pdfFiles.length} PDF(s)`);
    } catch (error) {
      toast.error('Failed to process PDFs');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const removePdf = (index: number) => {
    const newPdfs = uploadedPdfs.filter((_, i) => i !== index);
    setUploadedPdfs(newPdfs);
    if (newPdfs.length === 0) setPdfContext('');
  };

  const handleGenerate = async (sectorFallback?: string) => {
    const finalPrompt = prompt.trim() || sectorFallback;
    if (!finalPrompt || !user) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-problem', {
        body: {
          projectType: projectType || 'business',
          inputMode: 'custom',
          sector: '',
          problemDescription: finalPrompt,
          pdfContext: pdfContext || undefined,
          hmwType: 'human',
          previousHmws: [],
        }
      });
      if (error) throw error;
      if (!data || !data.title) throw new Error('No problem received');

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
        generatedAt: new Date().toISOString(),
      };
      
      setGeneratedProblem(newProblem);
      setMatchReasoning(null);

      // Auto-save the project so it appears in sidebar immediately
      const assessment = newProblem.iosAssessment ? { ...newProblem.iosAssessment } : undefined;
      if (assessment) {
        (assessment as any).name = 'Initial Analysis';
        (assessment as any).createdAt = newProblem.generatedAt;
      }
      
      const project = await ProjectService.createProject({
        title: newProblem.title,
        description: newProblem.description,
        skills: newProblem.requiredSkills,
        status: 'draft',
        analysis: assessment ? [assessment] : [],
      }, user.id);
      
      setSavedProjectId(project.id);
      
    } catch (error) {
      console.error('Error generating problem:', error);
      toast.error('Failed to generate problem. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeepDive = () => {
    if (savedProjectId) {
      setDirection('forward');
      navigate(`/projects/${savedProjectId}`);
    }
  };

  const handleMatch = async (type: 'skill' | 'interest') => {
    if (!generatedProblem) return;

    const items = type === 'skill' ? profile?.skills : profile?.interests;
    if (!Array.isArray(items) || items.length === 0) {
      toast.error(`No ${type}s found in your profile. Please update your profile first.`);
      return;
    }

    type === 'skill' ? setIsSkillMatching(true) : setIsInterestMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke(`match-${type}`, {
        body: {
          [`user${type === 'skill' ? 'Skills' : 'Interests'}`]: items,
          generatedProblems: [generatedProblem]
        }
      });

      if (error) throw error;

      if (data && data.success && data.matchedProblem) {
        setMatchReasoning({
          type,
          reasoning: data.matchedProblem.reasoning
        });
        type === 'skill' ? setShowSkillMatchModal(true) : setShowInterestMatchModal(true);
        toast.success(`Matched based on your ${type}s!`);
      } else {
        toast.error(`No strong match found based on your ${type}s.`);
      }
    } catch (error) {
      console.error(`Error matching ${type}:`, error);
      toast.error(`Failed to match ${type}.`);
    } finally {
      type === 'skill' ? setIsSkillMatching(false) : setIsInterestMatching(false);
    }
  };

  const isProfileIncomplete = !profile?.skills?.length && !profile?.interests?.length;
  const sectors = projectType === 'social-impact' ? SDG_GOALS : BUSINESS_SECTORS;

  // Extract first name from available sources
  const getFirstName = () => {
    const fullName = profile?.full_name || 
                     user?.user_metadata?.full_name || 
                     user?.user_metadata?.name || 
                     user?.user_metadata?.display_name ||
                     user?.email?.split('@')[0];
    
    if (fullName && fullName !== 'there') {
      return fullName.trim().split(/\s+/)[0];
    }
    return '';
  };

  const firstName = getFirstName();

  return (
    <div className={`h-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full relative overflow-hidden transition-opacity duration-300 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* State 1: Input / Chat Prompt */}
      {!generatedProblem && !isGenerating && (
        <>
          <div className="w-full flex flex-col items-center space-y-6 mt-2 md:mt-4 relative z-10">
            {/* Greeting */}
            <p style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'min(12vw, 5rem)',
              fontStyle: 'italic',
              color: '#111827',
              marginBottom: '-12px',
              letterSpacing: '-0.03em',
              lineHeight: 0.9,
              minHeight: '1em'
            }}>
              {profileLoading ? '' : firstName ? `Hello, ${firstName}` : 'Hello there'}
            </p>
            <h2 className="text-xl md:text-2xl font-medium text-gray-400 text-center tracking-tight mb-8">
              What would you like to build?
            </h2>

          {/* Project Type Selection Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
            <div 
              onClick={() => setProjectType('social-impact')}
              className={`p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300 flex flex-col items-center justify-center text-center ${
                projectType === 'social-impact' 
                  ? 'bg-black text-white border-black shadow-lg scale-105' 
                  : 'bg-white text-black border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="text-xl font-bold mb-2">Social Impact</h3>
              <p className={`text-sm ${projectType === 'social-impact' ? 'text-gray-300' : 'text-gray-500'}`}>
                Focus on UN Sustainable Development Goals and social challenges.
              </p>
            </div>
            
            <div 
              onClick={() => setProjectType('business')}
              className={`p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300 flex flex-col items-center justify-center text-center ${
                projectType === 'business' 
                  ? 'bg-black text-white border-black shadow-lg scale-105' 
                  : 'bg-white text-black border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="text-xl font-bold mb-2">Business</h3>
              <p className={`text-sm ${projectType === 'business' ? 'text-gray-300' : 'text-gray-500'}`}>
                Focus on market opportunities and commercial sectors.
              </p>
            </div>
          </div>
          
          {/* Input Area (only visible if projectType is selected) */}
          {projectType && (
            <div className="w-full relative max-w-3xl space-y-4">
              
              {/* PDF Preview */}
              {uploadedPdfs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {uploadedPdfs.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg text-sm text-gray-700">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button onClick={() => removePdf(idx)} className="ml-1 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                  placeholder="Describe your idea or choose a sector below..."
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 pl-12 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[60px] max-h-[200px] shadow-sm transition-shadow"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />
                
                {/* Paperclip Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3 bottom-3 w-10 h-10 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
                  disabled={isProcessingPdf}
                >
                  {isProcessingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePdfUpload}
                  className="hidden"
                  accept="application/pdf"
                  multiple
                />

                {/* Submit Arrow */}
                <button
                  onClick={() => handleGenerate()}
                  disabled={!prompt.trim() && uploadedPdfs.length === 0}
                  className="absolute right-3 bottom-3 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#1f2438] transition-colors"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>

              {/* Suggestions */}
              <div className="pt-4">
                <p className="text-xs text-gray-500 text-center mb-3">Or, use our pre-written prompts</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {sectors.map((sector) => (
                    <button
                      key={sector.id}
                      onClick={() => {
                        setPrompt(`I want to build something in ${sector.name}`);
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors shadow-sm"
                    >
                      {sector.name}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {isProfileIncomplete && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 cursor-pointer hover:bg-gray-100 transition mt-4" onClick={() => navigate('/profile')}>
              <User className="w-4 h-4" />
              <span>Complete your profile for better AI matching</span>
            </div>
          )}
          </div>
        </>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center mt-8">
          <AnimatedBlob />
        </div>
      )}

      {/* State 2: Generated Problem */}
      {generatedProblem && !isGenerating && (
        <div className="w-full space-y-6 pb-20">
          
          {/* Top Actions */}
          <div className="flex justify-end gap-3 mb-2">
            <Button variant="outline" size="sm" onClick={() => setShowSourcesModal(true)} className="bg-white text-gray-900 border-gray-300">
              Sources
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMatch('skill')}
              disabled={isSkillMatching}
              className="bg-white text-gray-900 border-gray-300"
            >
              {isSkillMatching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Skill Match
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMatch('interest')}
              disabled={isInterestMatching}
              className="bg-white text-gray-900 border-gray-300"
            >
              {isInterestMatching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Interest Match
            </Button>
          </div>

          {/* Match Reasoning Box (Fallback) */}
          {matchReasoning && (!showSkillMatchModal && !showInterestMatchModal) && (
            <div className={`p-4 rounded-lg text-sm ${matchReasoning.type === 'skill' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-pink-50 text-pink-800 border border-pink-200'}`}>
              <span className="font-semibold">{matchReasoning.type === 'skill' ? 'Skill Match: ' : 'Interest Match: '}</span>
              {matchReasoning.reasoning}
            </div>
          )}

          {/* Main Problem Card */}
          <Card className="bg-white border-0 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <h2 className="text-2xl font-semibold text-gray-900 leading-tight">
                  {generatedProblem.title}
                </h2>
                <div className="text-center flex-shrink-0 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-3xl font-bold text-primary">
                    {generatedProblem.iosAssessment?.totalScore || generatedProblem.opportunityScore}
                  </div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mt-1">
                    Score
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
                {generatedProblem.description}
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {generatedProblem.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Detailed View Toggle */}
            <div 
              className="border-t border-gray-100 bg-gray-50/50 p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-gray-600"
              onClick={() => setIsDetailedViewOpen(!isDetailedViewOpen)}
            >
              {isDetailedViewOpen ? 'Hide Details' : 'View Scoring & Tiers'}
              {isDetailedViewOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {/* Detailed View Content */}
            {isDetailedViewOpen && (
              <div className="border-t border-gray-100 p-6 md:p-8 bg-white">
                <AssessmentProblemDetailedView
                  assessment={generatedProblem.iosAssessment}
                  problemTitle={generatedProblem.title}
                  viewType="problem"
                  hideHeader={true}
                />
              </div>
            )}
          </Card>

          {/* Bottom Actions */}
          <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-background border-t border-gray-200/50 flex justify-center gap-4 z-10 backdrop-blur-md">
            <Button
              variant="outline"
              size="lg"
              className="w-full max-w-[200px] bg-white text-gray-900 border-gray-300"
              onClick={() => {
                setGeneratedProblem(null);
                setPrompt('');
                setSavedProjectId(null);
              }}
            >
              Start New Chat
            </Button>
            <Button
              size="lg"
              className="w-full max-w-[300px] bg-primary hover:bg-[#1f2438] text-white"
              onClick={handleDeepDive}
            >
              Deep Dive
            </Button>
          </div>

          {/* Modals */}
          
          {/* Problem Sources Modal */}
          {showSourcesModal && generatedProblem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Problem Sources & Verification Framework</h3>
                    <Button onClick={() => setShowSourcesModal(false)} variant="ghost" size="sm">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[70vh]">
                    {/* Left Column */}
                    <div className="lg:border-r lg:border-gray-200 lg:pr-6">
                      <h4 className="font-medium text-gray-900 mb-3">Source Verification Framework</h4>
                      <SourceVerificationInfo showDetails={true} />
                    </div>

                    {/* Right Column */}
                    <div className="overflow-y-auto">
                      <h4 className="font-medium text-gray-900 mb-3">Problem Sources by Tier</h4>
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(tier => {
                          const tierSources = Object.values(generatedProblem.iosAssessment?.dimensions || {}).flatMap((d: any) =>
                            Array.isArray(d.sources) ? d.sources.filter((s: any) => s.tier === tier) : []
                          );
                          const tierInfo = SourceVerificationService.getTierInfo(tier);
                          return (
                            <div key={tier} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${SourceVerificationService.getTierColor(tier)}`}></span>
                                  <span className="font-medium text-gray-900">Tier {tier} - {tierInfo?.name}</span>
                                </div>
                                <span className="text-sm text-gray-500">{tierSources.length} sources</span>
                              </div>
                              {tierSources.length > 0 ? (
                                <div className="space-y-2">
                                  {tierSources.map((source, index) => (
                                    <div key={index} className="border-l-4 border-gray-200 pl-3 py-1">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center">
                                          <span className="text-xs font-medium text-gray-900">{source.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className={`text-xs ${SourceVerificationService.getBiasColor(source.biasScore || 75)}`}></span>
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-600 mb-1">{source.credibility}</div>
                                      {source.url && (
                                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View Source →</a>
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

          {/* Skill Match Reasoning Modal */}
          {showSkillMatchModal && matchReasoning && matchReasoning.type === 'skill' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      Skill Match Reasoning
                    </h3>
                    <Button onClick={() => setShowSkillMatchModal(false)} variant="ghost" size="sm">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="overflow-y-auto max-h-[70vh]">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-green-800 mb-2">Why this problem matches your skills:</h4>
                      <p className="text-green-700 text-sm leading-relaxed">{matchReasoning.reasoning}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Your Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile?.skills?.map((skill: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interest Match Reasoning Modal */}
          {showInterestMatchModal && matchReasoning && matchReasoning.type === 'interest' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      Interest Match Reasoning
                    </h3>
                    <Button onClick={() => setShowInterestMatchModal(false)} variant="ghost" size="sm">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="overflow-y-auto max-h-[70vh]">
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-pink-800 mb-2">Why this problem matches your interests:</h4>
                      <p className="text-pink-700 text-sm leading-relaxed">{matchReasoning.reasoning}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-medium text-purple-800 mb-2">Your Interests:</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile?.interests?.map((interest: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{interest}</span>
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
  );
}
