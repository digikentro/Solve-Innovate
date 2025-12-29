import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FiArrowLeft, FiPlus, FiInfo, FiTrendingUp, FiMap, FiUsers, FiHeart, FiMessageCircle, FiActivity, FiTarget, FiZap, FiMenu, FiX, FiSearch } from 'react-icons/fi';
import { useProjectData } from '@/hooks/useProjectData';
import { useResearchData } from '@/hooks/useResearchData';
import { ProjectInfo } from '@/components/project-detail/ProjectInfo';
import { PresentableSlideSection } from '@/components/project-detail/PresentableSlideSection';
import { ProjectCanvasSection } from '@/components/project-detail/ProjectCanvasSection';
import { ProjectAnalysisSection } from '@/components/project-detail/ProjectAnalysisSection';
import { AsIsMapSection } from '@/components/project-detail/AsIsMapSection';
import { ResearchGeneratorSection } from '@/components/project-detail/ResearchGeneratorSection';
import { GenericReportViewer } from '@/components/project-detail/GenericReportViewer';
import { AsIsMapReportViewer } from '@/components/project-detail/AsIsMapReportViewer';
import { ExtremeUserReportViewer } from '@/components/project-detail/ExtremeUserReportViewer';
import { DeepEmpathyReportViewer } from '@/components/project-detail/DeepEmpathyReportViewer';
import { PsychologicalAnalysisReportViewer } from '@/components/project-detail/PsychologicalAnalysisReportViewer';

import { PainPointSelectionModal } from '@/components/project-detail/PainPointSelectionModal';
import { ExtremeUserSelectionModal } from '@/components/project-detail/ExtremeUserSelectionModal';

import { OutcomeToBehaviorHMWReportViewer } from '@/components/project-detail/OutcomeToBehaviorHMWReportViewer';
import { HMWIdeationFrameworkReportViewer } from '@/components/project-detail/HMWIdeationFrameworkReportViewer';
import { IdeaClusteringReportViewer } from '@/components/project-detail/IdeaClusteringReportViewer';
import { EmbeddedChatSection } from '@/components/project-detail/EmbeddedChatSection';
import { PrototypingToolsSection } from '@/components/project-detail/PrototypingToolsSection';
import { TestingSection } from '@/components/project-detail/TestingSection';
import { MarketSearchSection } from '@/components/project-detail/MarketSearchSection';
import { TransformationFrameworkSection } from '@/components/project-detail/TransformationFrameworkSection';

// Section navigation items
const SECTIONS = [
  { id: 'project-info', label: 'Project Information', icon: FiInfo },
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
];

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active section state
  const [activeSection, setActiveSection] = useState('project-info');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // State for presentable slide
  const [presentableSlide, setPresentableSlide] = useState<any | null>(null);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                type="button"
                aria-label="Back to Projects"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                <p className="text-sm text-gray-600">Project Detail</p>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
            >
              {isMobileSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex">
        {/* Left Sidebar - 17% */}
        <aside className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-56 lg:w-[17%]
          bg-white/80 backdrop-blur-sm border-r border-gray-200
          transition-transform duration-300 ease-in-out z-30
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="h-full overflow-y-auto p-4 space-y-2">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                    `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="truncate">{section.label}</span>
                </button>
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

        {/* Right Content Area - 83% */}
        <main className="flex-1 lg:w-[83%] min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Project Information */}
            {activeSection === 'project-info' && (
              <div className="space-y-6 animate-fadeIn">
                <ProjectInfo project={project} />
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="p-8">
                    <dl className="space-y-8">
                      <PresentableSlideSection
                        project={project}
                        presentableSlide={presentableSlide}
                        setPresentableSlide={setPresentableSlide}
                      />
                      <ProjectCanvasSection project={project} />
                    </dl>
                  </div>
                </div>
                <ProjectAnalysisSection project={project} setProject={setProject} />
              </div>
            )}

            {/* As-Is Map */}
            {activeSection === 'as-is-map' && (
              <div className="animate-fadeIn">
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
                        const { ProjectService } = await import('@/services/projectService');
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
              <div className="animate-fadeIn">
                <ResearchGeneratorSection
                  title="Extreme User Generator"
                  description="Generate extreme user personas to identify edge cases and design opportunities for your project. This helps you understand the full spectrum of user needs."
                  gradientFrom="purple-50"
                  gradientTo="pink-50"
                  iconBgFrom="purple-500"
                  iconBgTo="pink-600"
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
                      const { ProjectService } = await import('@/services/projectService');
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
              <div className="animate-fadeIn">
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
                      const { ProjectService } = await import('@/services/projectService');
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
              <div className="animate-fadeIn">
                <EmbeddedChatSection projectId={project.id} />
              </div>
            )}

            {/* Psychological Analysis */}
            {activeSection === 'psychological' && (
              <div className="animate-fadeIn">
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
                      const { ProjectService } = await import('@/services/projectService');
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
              <div className="animate-fadeIn">
                <TransformationFrameworkSection
                  project={project}
                  transformationFrameworkData={transformationFrameworkData}
                  setTransformationFrameworkData={setTransformationFrameworkData}
                  onRefreshProject={refetchProject}
                  onSaveData={async (updatedData) => {
                    const { ProjectService } = await import('@/services/projectService');
                    await ProjectService.updateProject(project!.id, { transformation_framework: updatedData }, user?.id);
                    setTransformationFrameworkData(updatedData);
                    refetchProject();
                  }}
                />
              </div>
            )}

            {/* HMW Framework */}
            {activeSection === 'hmw-framework' && (
              <div className="animate-fadeIn">
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
                      const { ProjectService } = await import('@/services/projectService');
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
              <div className="animate-fadeIn">
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
                      const { ProjectService } = await import('@/services/projectService');
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
              <div className="animate-fadeIn">
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
                      const { ProjectService } = await import('@/services/projectService');
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
              <div className="animate-fadeIn">
                <PrototypingToolsSection
                  ideaClusteringData={ideaClusteringData}
                  project={project}
                  onRefreshProject={refetchProject}
                />
              </div>
            )}

            {/* Testing */}
            {activeSection === 'testing' && (
              <div className="animate-fadeIn">
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
              <div className="animate-fadeIn">
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
  );
};
