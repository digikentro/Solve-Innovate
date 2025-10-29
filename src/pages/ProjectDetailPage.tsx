import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FiArrowLeft, FiPlus, FiInfo, FiTrendingUp, FiMap, FiUsers, FiHeart, FiMessageCircle, FiActivity, FiTarget, FiZap, FiMenu, FiX } from 'react-icons/fi';
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
import { TransformationFrameworkReportViewer } from '@/components/project-detail/TransformationFrameworkReportViewer';
import { OutcomeToBehaviorHMWReportViewer } from '@/components/project-detail/OutcomeToBehaviorHMWReportViewer';
import { HMWIdeationFrameworkReportViewer } from '@/components/project-detail/HMWIdeationFrameworkReportViewer';

// Section navigation items
const SECTIONS = [
  { id: 'project-info', label: 'Project Information', icon: FiInfo },
  { id: 'project-analysis', label: 'Project Analysis', icon: FiTrendingUp },
  { id: 'as-is-map', label: 'As-Is Map', icon: FiMap },
  { id: 'extreme-user', label: 'Extreme User Generator', icon: FiUsers },
  { id: 'deep-empathy', label: 'Deep Empathy Research', icon: FiHeart },
  { id: 'chat', label: 'Start Chat', icon: FiMessageCircle },
  { id: 'psychological', label: 'Psychological Analysis', icon: FiActivity },
  { id: 'transformation', label: 'Transformation Framework', icon: FiTarget },
  { id: 'hmw-framework', label: 'Outcome-to-Behavior HMW', icon: FiZap },
  { id: 'hmw-ideation', label: 'HMW Ideation Framework', icon: FiZap },
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

  // Form states for each research generator
  const [extremeUserForm, setExtremeUserForm] = useState({
    painPointStep: '',
    painPointDescription: '',
    targetUserContext: '',
    age: '',
    location: ''
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

  const [transformationFrameworkForm, setTransformationFrameworkForm] = useState({
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

  // Auth guards
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  // Custom hooks
  const { project, setProject, isLoading, error, handleDelete } = useProjectData(id, user.id);
  
  const {
    asIsMapData,
    extremeUserData,
    deepEmpathyData,
    psychologicalAnalysisData,
    transformationFrameworkData,
    hmwFrameworkData,
    hmwIdeationData,
    setAsIsMapData,
    setExtremeUserData,
    setDeepEmpathyData,
    setPsychologicalAnalysisData,
    setTransformationFrameworkData,
    setHmwFrameworkData,
    setHmwIdeationData,
  } = useResearchData(project);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                </div>
              )}

              {/* Project Analysis */}
              {activeSection === 'project-analysis' && (
                <div className="animate-fadeIn">
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
                    renderReport={(data, onGenerateNew) => (
                      <AsIsMapReportViewer 
                        data={data} 
                        onGenerateNew={onGenerateNew}
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
                        id: 'painPointStep',
                        label: 'Pain Point Step',
                        placeholder: 'e.g., Step 2.1: Harvest timing decisions',
                        type: 'text'
                      },
                      {
                        id: 'painPointDescription',
                        label: 'Pain Point Description',
                        placeholder: 'Describe the specific pain point or challenge...',
                        type: 'textarea',
                        rows: 3
                      },
                      {
                        id: 'targetUserContext',
                        label: 'Target User Context',
                        placeholder: "Describe the user's context, constraints, and environment...",
                        type: 'textarea',
                        rows: 3
                      },
                      {
                        id: 'age',
                        label: 'Age',
                        placeholder: 'e.g., 34',
                        type: 'number'
                      },
                      {
                        id: 'location',
                        label: 'Location',
                        placeholder: 'e.g., vadodara',
                        type: 'text'
                      }
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
                      "Target User Context": formData.targetUserContext,
                      age: parseInt(formData.age),
                      location: formData.location
                    })}
                    renderReport={(data, onGenerateNew) => <ExtremeUserReportViewer data={data} onGenerateNew={onGenerateNew} />}
                  />
                </div>
              )}

              {/* Deep Empathy Research */}
              {activeSection === 'deep-empathy' && (
                <div className="animate-fadeIn">
                  <ResearchGeneratorSection
                    title="Deep Empathy Research Generator"
                    description="Generate universal deep empathy insights for primary research, mirroring the Extreme User workflow. This helps you understand user motivations and behaviors at a deeper level."
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
                        placeholder: 'The Remote Island Expectant Mother - 28-year-old woman living on river island, accessible only by boat, 45km from mainland healthcare',
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
                    renderReport={(data, onGenerateNew) => <DeepEmpathyReportViewer data={data} onGenerateNew={onGenerateNew} />}
                  />
                </div>
              )}

              {/* Chat Section */}
              {activeSection === 'chat' && (
                <div className="animate-fadeIn">
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="px-8 py-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <FiMessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Chat with Your Project</h3>
                          <p className="text-sm text-gray-600">Interactive conversation about your project details and insights</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="space-y-6">
                        <div className="bg-cyan-50/80 p-6 rounded-2xl border border-cyan-200">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            Engage in an interactive conversation about your project. Ask questions, get insights, and explore different aspects of your project through AI-powered chat.
                          </p>
                        </div>
                        <div className="space-y-6">
                          <div className="flex justify-center">
                            <Link
                              to={`/projects/${project.id}/chat`}
                              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                            >
                              Start Chat
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                    formFields={[
                      {
                        id: 'painPointInvestigated',
                        label: 'Pain Point Investigated',
                        placeholder: 'e.g., Young student accessing online education from rural area',
                        type: 'text'
                      },
                      {
                        id: 'extremeUserType',
                        label: 'Extreme User Type',
                        placeholder: 'e.g., Ravi, 16-year-old student in a remote village with unstable internet',
                        type: 'text'
                      }
                    ]}
                    formData={psychologicalAnalysisForm}
                    setFormData={setPsychologicalAnalysisForm}
                    data={psychologicalAnalysisData}
                    setData={setPsychologicalAnalysisData}
                    isGenerating={false}
                    projectId={project.id}
                    apiEndpoint="https://n8n.srv922914.hstgr.cloud/webhook/psychological_analysis"
                    renderReport={(data, onGenerateNew) => <PsychologicalAnalysisReportViewer data={data} onGenerateNew={onGenerateNew} />}
                  />
                </div>
              )}

              {/* Transformation Framework */}
              {activeSection === 'transformation' && (
                <div className="animate-fadeIn">
                  <ResearchGeneratorSection
                    title="Transformation Framework"
                    description="Convert insights into an actionable transformation framework tailored to the project. This helps you create a structured approach to implementing changes and improvements."
                    gradientFrom="teal-50"
                    gradientTo="emerald-50"
                    iconBgFrom="teal-500"
                    iconBgTo="emerald-600"
                    formFields={[
                      {
                        id: 'painPointInvestigated',
                        label: 'Pain Point Investigated',
                        placeholder: 'e.g., Young student accessing online education from rural area',
                        type: 'text'
                      },
                      {
                        id: 'extremeUserType',
                        label: 'Extreme User Type',
                        placeholder: 'e.g., Ravi, 16-year-old student in a remote village with unstable internet',
                        type: 'text'
                      }
                    ]}
                    formData={transformationFrameworkForm}
                    setFormData={setTransformationFrameworkForm}
                    data={transformationFrameworkData}
                    setData={setTransformationFrameworkData}
                    isGenerating={false}
                    projectId={project.id}
                    apiEndpoint="https://n8n.srv922914.hstgr.cloud/webhook/Transformation Framework"
                    renderReport={(data, onGenerateNew) => <TransformationFrameworkReportViewer data={data} onGenerateNew={onGenerateNew} />}
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
                    formFields={[
                      {
                        id: 'painPointInvestigated',
                        label: 'Pain Point Investigated',
                        placeholder: 'e.g., Young student accessing online education from rural area',
                        type: 'text'
                      },
                      {
                        id: 'extremeUserType',
                        label: 'Extreme User Type',
                        placeholder: 'e.g., Ravi, 16-year-old student in a remote village with unstable internet',
                        type: 'text'
                      }
                    ]}
                    formData={hmwFrameworkForm}
                    setFormData={setHmwFrameworkForm}
                    data={hmwFrameworkData}
                    setData={setHmwFrameworkData}
                    isGenerating={false}
                    projectId={project.id}
                    apiEndpoint="https://n8n.srv922914.hstgr.cloud/webhook/hmw_framework"
                    renderReport={(data, onGenerateNew) => <OutcomeToBehaviorHMWReportViewer data={data} onGenerateNew={onGenerateNew} />}
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
                    formFields={[
                      {
                        id: 'painPointInvestigated',
                        label: 'Prioritized Pain Point',
                        placeholder: 'e.g., Woman travels to healthcare facility or contacts healthcare provider',
                        type: 'text'
                      },
                      {
                        id: 'extremeUserType',
                        label: 'Selected Extreme User',
                        placeholder: 'e.g., The Remote Island Expectant Mother - 28-year-old woman living on river island',
                        type: 'text'
                      }
                    ]}
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
                    renderReport={(data, onGenerateNew) => <HMWIdeationFrameworkReportViewer data={data} onGenerateNew={onGenerateNew} />}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
  );
};
