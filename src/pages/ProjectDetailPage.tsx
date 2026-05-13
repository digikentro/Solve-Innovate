import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { FiArrowLeft, FiPlus, FiInfo, FiTrendingUp, FiMap, FiUsers, FiHeart, FiMessageCircle, FiActivity, FiTarget, FiZap, FiMenu, FiX, FiSearch, FiLock, FiMonitor, FiFileText } from 'react-icons/fi';
import { useProjectData } from '@/hooks/useProjectData';
import { useResearchData } from '@/hooks/useResearchData';
import { ProjectService } from '@/services/projectService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PainPointSelectionModal } from '@/components/project-detail/PainPointSelectionModal';
import { ExtremeUserSelectionModal } from '@/components/project-detail/ExtremeUserSelectionModal';
import { HorizontalModal } from '@/components/ui/Modal';
import { AssessmentProblemDetailedView } from '@/components/ui/AssessmentProblemDetailedView';

const ProjectInfo = lazy(() => import('@/components/project-detail/ProjectInfo').then((mod) => ({ default: mod.ProjectInfo })));
const SecondaryResearchSection = lazy(() => import('@/components/project-detail/ProjectInfo').then((mod) => ({ default: mod.SecondaryResearchSection })));
const ProjectAnalysisSection = lazy(() => import('@/components/project-detail/ProjectAnalysisSection').then((mod) => ({ default: mod.ProjectAnalysisSection })));
const AsIsMapSection = lazy(() => import('@/components/project-detail/AsIsMapSection').then((mod) => ({ default: mod.AsIsMapSection })));
const ResearchGeneratorSection = lazy(() => import('@/components/project-detail/ResearchGeneratorSection').then((mod) => ({ default: mod.ResearchGeneratorSection })));
const GenericReportViewer = lazy(() => import('@/components/project-detail/GenericReportViewer').then((mod) => ({ default: mod.GenericReportViewer })));
const AsIsMapReportViewer = lazy(() => import('@/components/project-detail/AsIsMapReportViewer').then((mod) => ({ default: mod.AsIsMapReportViewer })));
const ExtremeUserReportViewer = lazy(() => import('@/components/project-detail/ExtremeUserReportViewer').then((mod) => ({ default: mod.ExtremeUserReportViewer })));
const DeepEmpathyReportViewer = lazy(() => import('@/components/project-detail/DeepEmpathyReportViewer').then((mod) => ({ default: mod.DeepEmpathyReportViewer })));
const PsychologicalAnalysisReportViewer = lazy(() => import('@/components/project-detail/PsychologicalAnalysisReportViewer').then((mod) => ({ default: mod.PsychologicalAnalysisReportViewer })));
const OutcomeToBehaviorHMWReportViewer = lazy(() => import('@/components/project-detail/OutcomeToBehaviorHMWReportViewer').then((mod) => ({ default: mod.OutcomeToBehaviorHMWReportViewer })));
const HMWIdeationFrameworkReportViewer = lazy(() => import('@/components/project-detail/HMWIdeationFrameworkReportViewer').then((mod) => ({ default: mod.HMWIdeationFrameworkReportViewer })));
const IdeaClusteringReportViewer = lazy(() => import('@/components/project-detail/IdeaClusteringReportViewer').then((mod) => ({ default: mod.IdeaClusteringReportViewer })));
const EmbeddedChatSection = lazy(() => import('@/components/project-detail/EmbeddedChatSection').then((mod) => ({ default: mod.EmbeddedChatSection })));
const PrototypingToolsSection = lazy(() => import('@/components/project-detail/PrototypingToolsSection').then((mod) => ({ default: mod.PrototypingToolsSection })));
const TestingSection = lazy(() => import('@/components/project-detail/TestingSection').then((mod) => ({ default: mod.TestingSection })));
const MarketSearchSection = lazy(() => import('@/components/project-detail/MarketSearchSection').then((mod) => ({ default: mod.MarketSearchSection })));
const TransformationFrameworkSection = lazy(() => import('@/components/project-detail/TransformationFrameworkSection').then((mod) => ({ default: mod.TransformationFrameworkSection })));
const PresentationSection = lazy(() => import('@/components/presentation/PresentationSection').then((mod) => ({ default: mod.PresentationSection })));

// Section navigation items
const SECTIONS = [
  { id: 'project-info', label: 'Project Information', icon: FiInfo },
  { id: 'secondary-research', label: 'Secondary Research', icon: FiFileText },
  { id: 'as-is-map', label: 'As-Is Map', icon: FiMap },
  { id: 'extreme-user', label: 'Extreme User Generator', icon: FiUsers },
  { id: 'deep-empathy', label: 'Deep Empathy Research', icon: FiHeart },
  { id: 'chat', label: 'Interact with User', icon: FiMessageCircle },
  { id: 'psychological', label: 'Psychological Analysis', icon: FiActivity },
  { id: 'transformation-framework', label: 'Transformation Framework', icon: FiTarget },
  { id: 'hmw-framework', label: 'Outcome-to-Behavior HMW', icon: FiZap },
  { id: 'hmw-ideation', label: 'HMW Ideation Framework', icon: FiZap },
  { id: 'idea-clustering', label: 'Idea Clustering and Idea Cards', icon: FiZap },
  { id: 'prototyping-tools', label: 'Prototyping Tools', icon: FiTrendingUp },
  { id: 'testing', label: 'Testing', icon: FiActivity },
  { id: 'market-search', label: 'Market Search', icon: FiSearch },
  { id: 'presentation', label: 'Presentation', icon: FiMonitor },
];

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setTopBarTitle, setActiveProjectScore, setActiveProjectAssessment } = useWorkspace();

  // Active section state
  const [activeSection, setActiveSection] = useState('project-info');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [headerActionsNode, setHeaderActionsNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // We delay slightly to ensure the node is rendered by SidebarLayout
    const timer = setTimeout(() => {
      setHeaderActionsNode(document.getElementById('project-header-actions'));
    }, 10);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Track sections with no generate button (chat, prototyping-tools) — visiting completes them
  const [visitedSections, setVisitedSections] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`visitedSections_${id}`);
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    if (id) {
      localStorage.setItem(`visitedSections_${id}`, JSON.stringify(Array.from(visitedSections)));
    }
  }, [visitedSections, id]);

  // Pain Point Modal state
  const [isPainPointModalOpen, setIsPainPointModalOpen] = useState(false);

  // Extreme User Modal state
  const [isExtremeUserModalOpen, setIsExtremeUserModalOpen] = useState(false);

  // Form states for each research generator
  const [extremeUserForm, setExtremeUserForm] = useState({
    painPointStep: '',
    painPointDescription: '',
    targetUserContext: ''
  });

  const [deepEmpathyForm, setDeepEmpathyForm] = useState({
    prioritizedPainPoint: '',
    painPointDescription: '',
    selectedExtremeUser: ''
  });

  const [psychologicalAnalysisForm, setPsychologicalAnalysisForm] = useState({
    painPointInvestigated: '',
    extremeUserType: ''
  });





  const [hmwFrameworkForm, setHmwFrameworkForm] = useState({
    painPointInvestigated: '',
    extremeUserType: ''
  });

  const [contentVisible, setContentVisible] = useState(false);


  const [hmwIdeationForm, setHmwIdeationForm] = useState({
    painPointInvestigated: '',
    extremeUserType: ''
  });

  const [ideaClusteringForm, setIdeaClusteringForm] = useState({
    projectId: ''
  });

  const [transformationFrameworkForm, setTransformationFrameworkForm] = useState({
    painPointInvestigated: '',
    extremeUserType: ''
  });

  const [testingForm, setTestingForm] = useState({
    productName: '',
    problemStatement: '',
    targetUsers: ''
  });

  // Pain Point Modal handlers
  const handleShowPainPointsModal = () => {
    setIsPainPointModalOpen(true);
  };

  const handleSelectPainPoint = (painPoint: { step: string; description: string }) => {
    setExtremeUserForm(prev => ({
      ...prev,
      painPointStep: painPoint.step,
      painPointDescription: painPoint.description
    }));

    // Also update Deep Empathy form immediately when pain point is selected
    setDeepEmpathyForm(prev => ({
      ...prev,
      prioritizedPainPoint: painPoint.step,
      painPointDescription: painPoint.description
    }));
  };

  const handleSelectAllPainPoints = (payload: { steps: string; descriptions: string; items: any[] }) => {
    // Populate both forms with aggregated steps/descriptions
    setExtremeUserForm(prev => ({
      ...prev,
      painPointStep: 'All Stages',
      painPointDescription: payload.descriptions
    }));

    setDeepEmpathyForm(prev => ({
      ...prev,
      prioritizedPainPoint: 'All Stages',
      painPointDescription: payload.descriptions
    }));
  };

  // Extreme User Modal handlers
  const handleShowUsersModal = () => {
    setIsExtremeUserModalOpen(true);
  };

  const handleSelectExtremeUser = (userSummary: string) => {
    setDeepEmpathyForm(prev => ({
      ...prev,
      selectedExtremeUser: userSummary
    }));
  };

  // Auth guards
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  // Custom hooks
  const { project, setProject, isLoading, error, handleDelete, refetchProject } = useProjectData(id, user.id);

  // Sync content visible state
  useEffect(() => {
    if (!isLoading && project) {
      const timer = setTimeout(() => setContentVisible(true), 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, project]);

  // Set Topbar Title and Assessment Data
  useEffect(() => {
    if (project?.title) {
      setTopBarTitle(project.title);
      setActiveProjectScore(project.score || project.iosAssessment?.overallScore || null);
      setActiveProjectAssessment(project.iosAssessment || null);
    }
    
    // Cleanup on unmount
    return () => {
      setTopBarTitle('New Project');
      setActiveProjectScore(null);
      setActiveProjectAssessment(null);
    };
  }, [project?.title, setTopBarTitle, setActiveProjectScore, setActiveProjectAssessment, project?.score, project?.iosAssessment]);

  // Populate Deep Empathy form from research_data when project loads
  useEffect(() => {
    if (project?.research_data) {
      console.log('ProjectDetailPage - research_data found:', project.research_data);

      let researchData: any;
      try {
        // Parse research_data (handle escaped newlines like other data)
        if (typeof project.research_data === 'string') {
          const cleanedData = project.research_data
            .replace(/\\n/g, '')  // Remove escaped newlines
            .replace(/\\r/g, '')  // Remove escaped carriage returns
            .replace(/\n/g, '')   // Remove actual newlines
            .replace(/\r/g, '');  // Remove actual carriage returns
          researchData = JSON.parse(cleanedData);
        } else {
          researchData = project.research_data;
        }

        console.log('Parsed research_data:', researchData);

        // Update Deep Empathy form with research data
        if (researchData?.painPointStep || researchData?.painPointDescription) {
          setDeepEmpathyForm(prev => ({
            ...prev,
            prioritizedPainPoint: researchData.painPointStep || prev.prioritizedPainPoint,
            painPointDescription: researchData.painPointDescription || prev.painPointDescription
          }));
          console.log('Updated Deep Empathy form with research data');
        }
      } catch (error) {
        console.error('Failed to parse research_data:', error);
      }
    }
  }, [project]);

  const {
    asIsMapData,
    extremeUserData,
    deepEmpathyData,
    psychologicalAnalysisData,
    hmwFrameworkData,
    hmwIdeationData,
    ideaClusteringData,
    transformationFrameworkData,
    testingData,
    marketSearchData,
    setAsIsMapData,
    setExtremeUserData,
    setDeepEmpathyData,
    setPsychologicalAnalysisData,
    setHmwFrameworkData,
    setHmwIdeationData,
    setIdeaClusteringData,
    setTransformationFrameworkData,
    setTestingData,
    setMarketSearchData,
  } = useResearchData(project);



  // Function to extract Target Users from As-Is Map and populate Extreme User form
  const populateTargetUserFromAsIsMap = () => {
    if (!asIsMapData) return;

    const reportData = asIsMapData?.content || asIsMapData;
    if (reportData?.hmw_statement_analysis?.target_users) {
      const targetUsers = Array.isArray(reportData.hmw_statement_analysis.target_users)
        ? reportData.hmw_statement_analysis.target_users[0]
        : reportData.hmw_statement_analysis.target_users;

      if (targetUsers) {
        setExtremeUserForm(prev => ({
          ...prev,
          targetUserContext: targetUsers
        }));
      }
    }
  };

  // Maps a section ID to whether it is "completed" (data generated or always-complete)
  // Used to decide whether the NEXT section should be unlocked.
  const isSectionCompleted = (sectionId: string): boolean => {
    const hasData = (d: any) =>
      d !== null && d !== undefined &&
      typeof d === 'object' && Object.keys(d).length > 0;
    switch (sectionId) {
      case 'project-info':             return true; // info only, always complete
      case 'secondary-research':       return true; // always complete to prevent hiding other sections
      case 'as-is-map':                return hasData(asIsMapData);
      case 'extreme-user':             return hasData(extremeUserData);
      case 'deep-empathy':             return hasData(deepEmpathyData);
      case 'chat':                     return true; // always complete to prevent hiding psychological analysis
      case 'psychological':            return hasData(psychologicalAnalysisData);
      case 'transformation-framework': return hasData(transformationFrameworkData);
      case 'hmw-framework':            return hasData(hmwFrameworkData);
      case 'hmw-ideation':             return hasData(hmwIdeationData);
      case 'idea-clustering':          return hasData(ideaClusteringData);
      case 'prototyping-tools':        return true; // always complete to prevent hiding testing/market search
      case 'testing':                  return hasData(testingData);
      case 'market-search':            return hasData(marketSearchData);
      case 'presentation':             return true; // last section
      default:                         return false;
    }
  };

  // Function to sync Extreme User data to Deep Empathy (called on Generate)
  const syncExtremeUserToDeepEmpathy = () => {
    if (extremeUserForm.painPointStep && extremeUserForm.painPointDescription) {
      setDeepEmpathyForm(prev => ({
        ...prev,
        prioritizedPainPoint: extremeUserForm.painPointStep,
        painPointDescription: extremeUserForm.painPointDescription
      }));
    }
  };

  // Loading state - removed spinning buffer for smoother feel
  if (isLoading && !project) {
    return (
      <div className="h-full flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 animate-pulse">
        {/* Sidebar Skeleton */}
        <aside className="hidden lg:block w-64 bg-white/50 border-r border-gray-200" />
        
        {/* Content Skeleton */}
        <div className="flex-1 p-8 space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg w-1/4"></div>
          <div className="h-64 bg-gray-100 rounded-3xl"></div>
          <div className="h-48 bg-gray-50 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  // Error state
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
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-[#faf8f5] text-sm text-gray-500">
          Loading project details...
        </div>
      }
    >
      <div className="h-full flex bg-[#faf8f5] overflow-hidden font-sans">
      {/* Left Sidebar - relative instead of fixed to stay inside the layout flow */}
      <aside className={`
        absolute lg:relative top-0 left-0 h-full w-64 flex-shrink-0
        bg-[#f5f3ef] border-r border-gray-200/50
        transition-transform duration-300 ease-in-out z-30
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <nav className="h-full overflow-y-auto py-8 px-4 space-y-3 custom-scrollbar">
            {SECTIONS.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isUnlocked =
                section.id === 'presentation' ||
                index === 0 ||
                isSectionCompleted(SECTIONS[index - 1].id);

              if (isActive) {
                return (
                  <Button
                    key={section.id}
                    variant="default"
                    className="w-full justify-start bg-[#0f121f] text-white hover:bg-[#0f121f]/90 transition-all duration-200 shadow-sm h-11 px-4"
                    onClick={() => {
                      setActiveSection(section.id);
                      setVisitedSections(prev => new Set([...prev, section.id]));
                      setIsMobileSidebarOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate flex-1 text-left">{section.label}</span>
                  </Button>
                );
              }

              return (
                  <Button
                    key={section.id}
                    variant="ghost"
                    disabled={!isUnlocked}
                    onClick={() => {
                      if (!isUnlocked) return;
                      setActiveSection(section.id);
                      setVisitedSections(prev => new Set([...prev, section.id]));
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`
                      w-full justify-start h-10 px-4 border-none shadow-none
                      transition-all duration-200 bg-transparent hover:bg-transparent
                      ${!isUnlocked
                        ? 'text-gray-300 opacity-50'
                        : 'text-gray-500 hover:text-[#0f121f] font-normal'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 mr-3 flex-shrink-0 ${!isUnlocked ? 'text-gray-300' : 'text-gray-400'}`} />
                    <span className="truncate flex-1 text-left">{section.label}</span>
                    {!isUnlocked && <FiLock className="w-3.5 h-3.5 flex-shrink-0 text-gray-300 ml-2" />}
                  </Button>
              );
            })}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sources Button Portal */}
      {headerActionsNode && createPortal(
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsSourcesModalOpen(true)}
          className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-gray-200"
        >
          <FiFileText className="w-4 h-4" />
          Sources
        </Button>,
        headerActionsNode
      )}

      {/* Sources Modal */}
      {isSourcesModalOpen && (
        <AssessmentProblemDetailedView
          open={isSourcesModalOpen}
          onClose={() => setIsSourcesModalOpen(false)}
          assessment={
            project?.analysis && project.analysis.length > 0 
              ? [...project.analysis].sort((x, y) => {
                  const d1 = new Date(x.createdAt || x.updatedAt || 0).getTime();
                  const d2 = new Date(y.createdAt || y.updatedAt || 0).getTime();
                  return d2 - d1;
                })[0] 
              : undefined
          }
          problemTitle={project?.title || 'Project'}
          viewType="assessment"
        />
      )}

      {/* Right Side - Content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto custom-scrollbar">
        <main className="flex-1">
          <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
            {/* Project Information */}
            {activeSection === 'project-info' && (
              <div className="flex flex-col gap-10">
                <ProjectInfo project={project} />
              </div>
            )}

            {/* Secondary Research */}
            {activeSection === 'secondary-research' && (
              <SecondaryResearchSection
                projectId={project.id}
                userId={user.id}
                secondaryresearch={project.secondaryresearch}
                onRefreshProject={refetchProject}
              />
            )}

            {/* As-Is Map */}
            {activeSection === 'as-is-map' && (
              <div>
                <AsIsMapSection
                  project={project}
                  asIsMapData={asIsMapData}
                  setAsIsMapData={setAsIsMapData}
                  onRefreshProject={refetchProject}
                  renderReport={(data, onGenerateNew) => (
                    <AsIsMapReportViewer
                      data={data}
                      onGenerateNew={onGenerateNew}
                      projectId={project?.id}
                      onSave={async (updatedData) => {
                        await ProjectService.updateProject(
                          project!.id,
                          { as_is_map: updatedData },
                          user!.id
                        );
                        setAsIsMapData(updatedData);
                        await refetchProject();
                      }}
                    />
                  )}
                />
              </div>
            )}

            {/* Extreme User Generator */}
            {activeSection === 'extreme-user' && (
              <div>
                <ResearchGeneratorSection
                  title="Extreme User Generator"
                  description="Generate extreme user personas to identify edge cases and design opportunities for your project. This helps you understand the full spectrum of user needs."
                  gradientFrom="purple-50"
                  gradientTo="pink-50"
                  iconBgFrom="purple-500"
                  iconBgTo="pink-600"
                  variant="asIs"
                  formFields={[
                    {
                      type: 'inline',
                      fields: [
                        {
                          id: 'painPointStep',
                          label: 'Pain Point Step',
                          placeholder: 'e.g., Step 2.1: Harvest timing decisions',
                          type: 'text',
                          width: '1/3'
                        },
                        {
                          id: 'painPointDescription',
                          label: 'Pain Point Description',
                          placeholder: 'Describe the specific pain point or challenge...',
                          type: 'textarea',
                          rows: 3,
                          width: '2/3'
                        }
                      ]
                    },
                    {
                      id: 'targetUserContext',
                      label: 'Target User Context',
                      placeholder: "Describe the user's context, constraints, and environment...",
                      type: 'textarea',
                      rows: 3
                    },

                  ]}
                  formData={extremeUserForm}
                  setFormData={setExtremeUserForm}
                  data={extremeUserData}
                  setData={setExtremeUserData}
                  isGenerating={false}
                  projectId={project.id}
                  apiEndpoint="https://n8n.srv922914.hstgr.cloud/webhook/UniversalExtreme"
                  requestBodyMapper={(formData, projectId) => ({
                    project_id: projectId,
                    "Pain Point Step": formData.painPointStep,
                    "Pain Point Description": formData.painPointDescription,
                    "Target User Context": formData.targetUserContext
                  })}
                  onShowPainPointsModal={handleShowPainPointsModal}
                  onPopulateFromAsIsMap={populateTargetUserFromAsIsMap}
                  onGenerate={syncExtremeUserToDeepEmpathy}
                  onRefreshProject={refetchProject}
                  renderReport={(data, onGenerateNew) => <ExtremeUserReportViewer
                    data={data}
                    onGenerateNew={onGenerateNew}
                    projectId={project?.id}
                    onSave={async (updatedData) => {
                      await ProjectService.updateProject(project!.id, { extreme_user_data: updatedData }, user?.id);
                      setExtremeUserData(updatedData);
                      refetchProject();
                    }}
                  />}
                />
              </div>
            )}

            {/* Deep Empathy Research */}
            {activeSection === 'deep-empathy' && (
              <div>
                <ResearchGeneratorSection
                  title="Deep Empathy Research Generator"
                  description="Generate universal deep empathy insights for primary research, mirroring the Extreme User workflow. Pain points will be automatically copied from the Extreme User Generator when you click 'Generate' above. You can edit any field as needed."
                  gradientFrom="indigo-50"
                  gradientTo="purple-50"
                  iconBgFrom="indigo-500"
                  iconBgTo="purple-600"
                  formFields={[
                    {
                      id: 'prioritizedPainPoint',
                      label: 'Prioritized Pain Point',
                      placeholder: 'e.g., Woman travels to healthcare facility or contacts healthcare provider',
                      type: 'text'
                    },
                    {
                      id: 'painPointDescription',
                      label: 'Pain Point Description',
                      placeholder: 'Transportation barriers, long distances, high costs preventing initial prenatal care access',
                      type: 'textarea',
                      rows: 3
                    },
                    {
                      id: 'selectedExtremeUser',
                      label: 'Selected Extreme User',
                      placeholder: 'Select the User from Choose User',
                      type: 'textarea',
                      rows: 3
                    }
                  ]}
                  formData={deepEmpathyForm}
                  setFormData={setDeepEmpathyForm}
                  data={deepEmpathyData}
                  setData={setDeepEmpathyData}
                  isGenerating={false}
                  projectId={project.id}
                  apiEndpoint="https://n8n.srv922914.hstgr.cloud/webhook/UniversalDeepEmpathy"
                  requestBodyMapper={(formData, projectId) => ({
                    project_id: projectId,
                    "Prioritized Pain Point": formData.prioritizedPainPoint,
                    "Pain Point Description": formData.painPointDescription,
                    "Selected Extreme User": formData.selectedExtremeUser
                  })}
                  onRefreshProject={refetchProject}
                  onShowUsersModal={handleShowUsersModal}
                  renderReport={(data, onGenerateNew) => <DeepEmpathyReportViewer
                    data={data}
                    onGenerateNew={onGenerateNew}
                    projectId={project?.id}
                    onSave={async (updatedData) => {
                      await ProjectService.updateProject(project!.id, { deep_empathy_data: updatedData }, user?.id);
                      setDeepEmpathyData(updatedData);
                      refetchProject();
                    }}
                  />}
                />
              </div>
            )}

            {/* Chat Section */}
            {activeSection === 'chat' && (
              <div>
                <EmbeddedChatSection projectId={project.id} extremeUserData={extremeUserData} project={project} userId={user.id} />
              </div>
            )}

            {/* Psychological Analysis */}
            {activeSection === 'psychological' && (
              <div>
                <ResearchGeneratorSection
                  title="Psychological Analysis"
                  description="Transform unprocessed research data into deep behavioral insights through psychological analysis. This helps you understand the underlying motivations and patterns in user behavior."
                  gradientFrom="orange-50"
                  gradientTo="red-50"
                  iconBgFrom="orange-500"
                  iconBgTo="red-600"
                  formFields={[]}
                  formData={psychologicalAnalysisForm}
                  setFormData={setPsychologicalAnalysisForm}
                  data={psychologicalAnalysisData}
                  setData={setPsychologicalAnalysisData}
                  isGenerating={false}
                  projectId={project.id}
                  apiEndpoint="https://n8n.srv922914.hstgr.cloud/webhook/psychological_analysis"
                  onRefreshProject={refetchProject}
                  renderReport={(data, onGenerateNew) => <PsychologicalAnalysisReportViewer
                    data={data}
                    onGenerateNew={onGenerateNew}
                    projectId={project?.id}
                    onSave={async (updatedData) => {
                      await ProjectService.updateProject(project!.id, { psychological_analysis: updatedData }, user?.id);
                      setPsychologicalAnalysisData(updatedData);
                      refetchProject();
                    }}
                  />}
                />
              </div>
            )}

            {/* Transformation Framework */}
            {activeSection === 'transformation-framework' && (
              <div>
                <TransformationFrameworkSection
                  project={project}
                  transformationFrameworkData={transformationFrameworkData}
                  setTransformationFrameworkData={setTransformationFrameworkData}
                  onRefreshProject={refetchProject}
                  onSaveData={async (updatedData) => {
                    await ProjectService.updateProject(project!.id, { transformation_framework: updatedData }, user?.id);
                    setTransformationFrameworkData(updatedData);
                    refetchProject();
                  }}
                />
              </div>
            )}

            {/* HMW Framework */}
            {activeSection === 'hmw-framework' && (
              <div>
                <ResearchGeneratorSection
                  title="Outcome-to-Behavior HMW Framework"
                  description="Convert insights into actionable HMW (How Might We) questions tailored to the project. This helps you create a structured approach to problem-solving and innovation."
                  gradientFrom="purple-50"
                  gradientTo="pink-50"
                  iconBgFrom="purple-500"
                  iconBgTo="pink-600"
                  formFields={[]}
                  formData={hmwFrameworkForm}
                  setFormData={setHmwFrameworkForm}
                  data={hmwFrameworkData}
                  setData={setHmwFrameworkData}
                  isGenerating={false}
                  projectId={project.id}
                  apiEndpoint="https://n8n.srv922914.hstgr.cloud/webhook/hmw_framework"
                  onRefreshProject={refetchProject}
                  renderReport={(data, onGenerateNew) => <OutcomeToBehaviorHMWReportViewer
                    data={data}
                    onGenerateNew={onGenerateNew}
                    projectId={project?.id}
                    onSave={async (updatedData) => {
                      await ProjectService.updateProject(project!.id, { Behaviour_Framework: updatedData }, user?.id);
                      setHmwFrameworkData(updatedData);
                      refetchProject();
                    }}
                  />}
                />
              </div>
            )}

            {/* HMW Ideation Framework */}
            {activeSection === 'hmw-ideation' && (
              <div>
                <ResearchGeneratorSection
                  title="HMW Ideation Framework"
                  description="Generate comprehensive ideation solutions using four distinct creative approaches: Simple Ideas, Outside Category Inspiration, Feature Addition, and Feature Removal. Each approach provides unique perspectives for solving the identified pain points."
                  gradientFrom="indigo-50"
                  gradientTo="blue-50"
                  iconBgFrom="indigo-500"
                  iconBgTo="blue-600"
                  formFields={[]}
                  formData={hmwIdeationForm}
                  setFormData={setHmwIdeationForm}
                  data={hmwIdeationData}
                  setData={setHmwIdeationData}
                  isGenerating={false}
                  projectId={project.id}
                  apiEndpoint="https://n8n.srv922914.hstgr.cloud/webhook/Ideation_Framework"
                  requestBodyMapper={(formData, projectId) => ({
                    project_id: projectId,
                    "Prioritized Pain Point": formData.painPointInvestigated,
                    "Selected Extreme User": formData.extremeUserType
                  })}
                  onRefreshProject={refetchProject}
                  renderReport={(data, onGenerateNew) => <HMWIdeationFrameworkReportViewer
                    data={data}
                    onGenerateNew={onGenerateNew}
                    projectId={project?.id}
                    onSave={async (updatedData) => {
                      await ProjectService.updateProject(project!.id, { HMW_Ideation_Framework: updatedData }, user?.id);
                      setHmwIdeationData(updatedData);
                      refetchProject();
                    }}
                  />}
                />
              </div>
            )}

            {/* Idea Clustering and Idea Cards */}
            {activeSection === 'idea-clustering' && (
              <div>
                <ResearchGeneratorSection
                  title="Idea Clustering and Idea Cards"
                  description="Generate idea clusters and detailed idea cards from your ideation framework. This analysis groups related ideas, evaluates innovation potential, and provides actionable implementation pathways for the most promising concepts."
                  gradientFrom="emerald-50"
                  gradientTo="teal-50"
                  iconBgFrom="emerald-500"
                  iconBgTo="teal-600"
                  formFields={[]}
                  formData={ideaClusteringForm}
                  setFormData={setIdeaClusteringForm}
                  data={ideaClusteringData}
                  setData={setIdeaClusteringData}
                  isGenerating={false}
                  projectId={project.id}
                  apiEndpoint="https://n8n.srv922914.hstgr.cloud/webhook/Idea_Clustering_and_Idea_Cards"
                  requestBodyMapper={(formData, projectId) => ({
                    project_id: projectId
                  })}
                  onRefreshProject={refetchProject}
                  renderReport={(data, onGenerateNew) => <IdeaClusteringReportViewer
                    data={data}
                    onGenerateNew={onGenerateNew}
                    projectId={project?.id}
                    onSave={async (updatedData) => {
                      await ProjectService.updateProject(project!.id, { Idea_Clustering_and_Idea_Cards: updatedData }, user?.id);
                      setIdeaClusteringData(updatedData);
                      refetchProject();
                    }}
                  />}
                />
              </div>
            )}

            {/* Prototyping Tools */}
            {activeSection === 'prototyping-tools' && (
              <div>
                <PrototypingToolsSection
                  ideaClusteringData={ideaClusteringData}
                  project={project}
                  onRefreshProject={refetchProject}
                />
              </div>
            )}

            {/* Testing */}
            {activeSection === 'testing' && (
              <div>
                <TestingSection
                  project={project}
                  asIsMapData={asIsMapData}
                  extremeUserData={extremeUserData}
                  deepEmpathyData={deepEmpathyData}
                  ideaClusteringData={ideaClusteringData}
                  testingData={testingData}
                  setTestingData={setTestingData}
                  onRefreshProject={refetchProject}
                />
              </div>
            )}

            {/* Market Search */}
            {activeSection === 'market-search' && (
              <div>
                <MarketSearchSection
                  project={project}
                  asIsMapData={asIsMapData}
                  extremeUserData={extremeUserData}
                  deepEmpathyData={deepEmpathyData}
                  ideaClusteringData={ideaClusteringData}
                  testingData={testingData}
                  marketSearchData={marketSearchData}
                  setMarketSearchData={setMarketSearchData}
                  onRefreshProject={refetchProject}
                />
              </div>
            )}

            {/* Presentation */}
            {activeSection === 'presentation' && (
              <div className="animate-fadeIn">
                <PresentationSection
                  project={project}
                  onRefreshProject={refetchProject}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Pain Point Selection Modal */}
      <PainPointSelectionModal
        isOpen={isPainPointModalOpen}
        onClose={() => setIsPainPointModalOpen(false)}
        onSelectPainPoint={handleSelectPainPoint}
        onSelectAllPainPoints={handleSelectAllPainPoints}
        asIsMapData={asIsMapData}
        project={project}
      />

      {/* Extreme User Selection Modal */}
      <ExtremeUserSelectionModal
        isOpen={isExtremeUserModalOpen}
        onClose={() => setIsExtremeUserModalOpen(false)}
        onSelectUser={handleSelectExtremeUser}
        extremeUserData={extremeUserData}
      />
    </div>
    </Suspense>
  );
};
