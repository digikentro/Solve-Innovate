import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types/project';
import { useAuth } from '@/contexts/AuthContext';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { FiArrowLeft } from 'react-icons/fi';

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

  // Only allow editing for project owner
  const isOwner = user && project.user_id === user.id;

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
            viewModeEnabled={!isOwner}
            onChange={isOwner ? handleAutoSave : undefined}
          />
        </div>
      </div>
    </div>
  );
} 