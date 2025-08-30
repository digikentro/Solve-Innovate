import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types/project';
import { useAuth } from '@/contexts/AuthContext';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { FiArrowLeft, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PresentableSlideCard } from '@/components/project/PresentableSlideCard';

export default function ProjectCanvasPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasData, setCanvasData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [presentableSlide, setPresentableSlide] = useState<any>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setProject(data);
        setCanvasData(data.canvas || null);
        setPresentableSlide(data.presentable_slide || null);
      } catch (e: any) {
        setError(e.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  const handleSave = async () => {
    if (!project || !excalidrawAPI) return;
    setSaving(true);
    try {
      const data = excalidrawAPI.getSceneElements ? {
        elements: excalidrawAPI.getSceneElements(),
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles ? excalidrawAPI.getFiles() : undefined,
      } : excalidrawAPI.getScene();
      await supabase.from('projects').update({ canvas: data }).eq('id', project.id);
      setCanvasData(data);
      alert('Canvas saved!');
    } catch (e) {
      alert('Failed to save canvas.');
    } finally {
      setSaving(false);
    }
  };

  // Autosave handler
  const handleAutoSave = async (elements: any, appState: any, files: any) => {
    if (!project) return;
    try {
      // Only persist relevant appState keys for viewport
      const { scrollX, scrollY, zoom, ...restAppState } = appState;
      const data = {
        elements,
        appState: {
          ...restAppState,
          scrollX,
          scrollY,
          zoom,
        },
        files,
      };
      await supabase.from('projects').update({ canvas: data }).eq('id', project.id);
      setCanvasData(data);
    } catch (e) {
      // Optionally handle error (e.g., show a toast)
    }
  };

  // Helper to ensure collaborators is a Map
  function fixCollaborators(appState: any) {
    if (!appState) return { collaborators: new Map() };
    if (appState.collaborators instanceof Map) return appState;
    // If it's an object, convert to Map
    if (typeof appState.collaborators === 'object' && appState.collaborators !== null) {
      return {
        ...appState,
        collaborators: new Map(Object.entries(appState.collaborators)),
      };
    }
    // Otherwise, set to empty Map
    return {
      ...appState,
      collaborators: new Map(),
    };
  }

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error || !project) return <div className="text-center py-12 text-red-600">{error || 'Project not found'}</div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center mb-6 gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-indigo-700 shadow hover:bg-indigo-50 hover:text-indigo-900 transition border border-indigo-200"
          type="button"
          aria-label="Back"
        >
          <FiArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2 m-0">Project Canvas</h1>
      </div>
      
      {/* Sidebar Toggle Button - Fixed Position */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-indigo-700 shadow-lg hover:bg-indigo-50 hover:text-indigo-900 transition border border-indigo-200"
        type="button"
        aria-label={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
      >
        {sidebarOpen ? <FiChevronRight className="w-6 h-6" /> : <FiChevronLeft className="w-6 h-6" />}
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Presentable Slide</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {presentableSlide ? (
                <div className="space-y-4">
                  {/* Slide Template */}
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm">
                    {/* HMW Section with Background Color */}
                    <div 
                      className="px-4 py-3 text-sm font-bold text-gray-900 leading-tight"
                      style={{ backgroundColor: presentableSlide.backgroundColor || '#FFD82B' }}
                    >
                      {presentableSlide.hmw || 'How might we...'}
                    </div>
                    
                    {/* Bullets Section */}
                    <div className="bg-white px-4 py-3">
                      <div className="space-y-2">
                        {presentableSlide.bullets && presentableSlide.bullets.length > 0 ? (
                          presentableSlide.bullets.map((bullet: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                              <p className="text-xs text-gray-700 leading-relaxed">{bullet}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500 italic">No bullet points available</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Slide Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Slide Details</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Background Color:</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: presentableSlide.backgroundColor || '#FFD82B' }}
                          ></div>
                          <span>{presentableSlide.backgroundColor || '#FFD82B'}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Bullet Points:</span>
                        <span>{presentableSlide.bullets?.length || 0}</span>
                      </div>
                      {presentableSlide.iconSet && presentableSlide.iconName && (
                        <div className="flex justify-between">
                          <span>Icon:</span>
                          <span className="capitalize">{presentableSlide.iconSet} - {presentableSlide.iconName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No presentable slide available</p>
                  <p className="text-sm mt-2">Generate a slide from the project details page</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <div style={{ height: 600 }}>
          <Excalidraw
            excalidrawAPI={setExcalidrawAPI}
            initialData={canvasData ? {
              ...canvasData,
              appState: {
                ...fixCollaborators(canvasData.appState || {}),
                // Use saved scrollX, scrollY, zoom if present, else default
                scrollX: canvasData.appState?.scrollX ?? 0,
                scrollY: canvasData.appState?.scrollY ?? 0,
                zoom: canvasData.appState?.zoom ?? 0.6,
              },
            } : { appState: { zoom: 0.6, scrollX: 0, scrollY: 0, collaborators: new Map() } }}
            UIOptions={{
              canvasActions: {
                saveToActiveFile: false,
                loadScene: false,
                export: false,
                toggleTheme: false,
                changeViewBackgroundColor: true,
                clearCanvas: true,
                // You can add undo/redo if you want
              }
            }}
            theme="light"
            onChange={handleAutoSave}
          />
        </div>
      </div>
    </div>
  );
} 