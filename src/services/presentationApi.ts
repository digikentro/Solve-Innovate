import type {
  CreatePresentationResponse,
  CreateProjectPresentationResponse,
  EditorStatePayload,
  EditorStateResponse,
  GenerateProjectPresentationResponse,
  OutlineDraft,
  ProjectPresentationSummary,
  PresentationSummaryResponse,
  RegenerateSlideResponse,
  SwitchThemeResponse,
  ExportPptxResponse,
  ExportPdfResponse,
  PresentationSettings,
} from '@/types/presentation';
import { logger } from '@/lib/logger';

const API_BASE = import.meta.env.VITE_PPT_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

const apiFetch = async (url: string, init?: RequestInit): Promise<Response> => {
  const method = init?.method || 'GET';
  try {
    const response = await fetch(url, init);

    if (!response.ok) {
      const clone = response.clone();
      let detail: unknown = null;
      try {
        detail = await clone.json();
      } catch {
        detail = await clone.text().catch(() => null);
      }

      logger.error('API response returned non-OK status', undefined, {
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        detail,
      });
    }

    return response;
  } catch (error) {
    logger.error('Network request failed', error, { method, url });
    throw error;
  }
};

const toBackendDensity = (value?: PresentationSettings['verbosity']): string => {
  switch (value) {
    case 'detailed':
      return 'standard';
    case 'extensive':
      return 'text_heavy';
    case 'minimal':
    case 'concise':
    case 'standard':
    case 'text_heavy':
      return value;
    default:
      return 'concise';
  }
};

// ─── API Service ─────────────────────────────────────────────────────────────

export const presentationApi = {
  /**
   * List saved project presentations.
   */
  listProjectPresentations: async (
    projectId: string
  ): Promise<ProjectPresentationSummary[]> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/${projectId}/presentations`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Create a new presentation record for a project.
   */
  createProjectPresentation: async (
    projectId: string,
    title?: string
  ): Promise<CreateProjectPresentationResponse> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/${projectId}/presentations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(title || 'Untitled Presentation'),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Rename a project presentation.
   */
  renameProjectPresentation: async (
    presentationId: string,
    title: string
  ): Promise<ProjectPresentationSummary> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/presentations/${presentationId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Delete a project presentation and associated revisions.
   */
  deleteProjectPresentation: async (
    presentationId: string
  ): Promise<{ success: boolean; presentation_id: string }> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/presentations/${presentationId}`,
      {
        method: 'DELETE',
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Generate a presentation revision for an existing project presentation.
   */
  generateProjectPresentation: async (
    presentationId: string,
    settings: Partial<PresentationSettings>
  ): Promise<GenerateProjectPresentationResponse> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/presentations/${presentationId}/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n_slides: settings.nSlides ?? 10,
          tone: settings.tone || 'professional',
          density: toBackendDensity(settings.verbosity),
          text_mode: settings.textMode || 'condense',
          theme: settings.theme || 'modern-dark',
          language: settings.language || 'English',
          visual_preference: settings.visualPreference || 'balanced',
          image_source: settings.imageSource || 'ai',
          write_for: settings.writingGuidance || settings.audience || '',
          logo_url: settings.logoUrl || null,
          logo_position: settings.logoPosition || null,
          image_model: settings.imageModel || 'none',
          image_art_style: settings.imageArtStyle || 'photo',
          image_keywords: settings.imageKeywords || [],
          chart_enabled: settings.chartEnabled ?? false,
          chart_types: settings.chartTypes || [],
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Generate an outline draft for a project presentation.
   */
  generateOutlineDraft: async (
    presentationId: string
  ): Promise<{ outline: OutlineDraft }> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/presentations/${presentationId}/outline`,
      { method: 'POST' }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Load an existing outline draft.
   */
  getOutlineDraft: async (
    presentationId: string
  ): Promise<{ outline: OutlineDraft }> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/presentations/${presentationId}/outline`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Not found' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Save an outline draft.
   */
  updateOutlineDraft: async (
    presentationId: string,
    outline: OutlineDraft
  ): Promise<{ outline: OutlineDraft }> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/presentations/${presentationId}/outline`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outline),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Load editor state for a generated project presentation.
   */
  getEditorState: async (
    presentationId: string
  ): Promise<EditorStateResponse> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/presentations/${presentationId}/editor-state`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Not found' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Persist editor state for a generated project presentation.
   */
  updateEditorState: async (
    presentationId: string,
    editor: EditorStatePayload
  ): Promise<EditorStateResponse> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/presentations/${presentationId}/editor-state`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editor),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Generate a presentation from a Solve Innovate project.
   * Returns a presentation_id — caller should then stream via getStreamUrl().
   */
  generateFromProject: async (
    projectId: string,
    settings: Partial<PresentationSettings>
  ): Promise<CreatePresentationResponse> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/project/${projectId}/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n_slides: settings.nSlides ?? 10,
          tone: settings.tone || 'professional',
          verbosity: settings.verbosity || 'concise',
          text_mode: settings.textMode || 'condense',
          theme: settings.theme || 'modern-dark',
          language: settings.language || 'English',
          image_source: settings.imageSource || 'ai',
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Create a presentation from raw content (card-by-card or freeform).
   */
  createPresentation: async (
    params: Record<string, unknown>
  ): Promise<CreatePresentationResponse> => {
    const res = await apiFetch(`${API_BASE}/api/v1/ppt/markdown/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Fetch a saved presentation by ID.
   */
  getPresentation: async (
    presentationId: string
  ): Promise<PresentationSummaryResponse> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/presentation/${presentationId}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Not found' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Switch theme for a presentation (no regeneration needed).
   */
  switchTheme: async (
    presentationId: string,
    newTheme: string
  ): Promise<SwitchThemeResponse> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/presentation/${presentationId}/switch-theme`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_theme: newTheme }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Regenerate a single slide.
   */
  regenerateSlide: async (
    presentationId: string,
    slideIndex: number,
    instructions?: string
  ): Promise<RegenerateSlideResponse> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/slide/regenerate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentation_id: presentationId,
          slide_index: slideIndex,
          instructions: instructions || null,
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Export presentation to PPTX.
   */
  exportPptx: async (presentationId: string): Promise<ExportPptxResponse> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/presentation/${presentationId}/export/pptx`,
      { method: 'POST' }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Export failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Export presentation to PDF.
   */
  exportPdf: async (presentationId: string): Promise<ExportPdfResponse> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/markdown/presentation/${presentationId}/export/pdf`,
      { method: 'POST' }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Export failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * Generate an image via AI from a text prompt.
   * Returns a fully-qualified URL served from the backend's /app_data static mount.
   */
  generateImage: async (prompt: string): Promise<string> => {
    const res = await apiFetch(
      `${API_BASE}/api/v1/ppt/images/generate?prompt=${encodeURIComponent(prompt)}`
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Image generation failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    // Backend returns the absolute filesystem path; extract the filename to build the URL
    const absolutePath: string = await res.json();
    const filename = absolutePath.replace(/\\/g, '/').split('/').pop() ?? '';
    return `${API_BASE}/app_data/images/${filename}`;
  },

  /**
   * Upload an image file from the user's device.
   * Returns a fully-qualified URL served from the backend's /app_data static mount.
   */
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch(`${API_BASE}/api/v1/ppt/images/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const filename = String(data.path ?? '').replace(/\\/g, '/').split('/').pop() ?? '';
    return `${API_BASE}/app_data/images/${filename}`;
  },
};
