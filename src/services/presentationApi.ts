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
  PresentationSettings,
} from '@/types/presentation';

const API_BASE = import.meta.env.VITE_PPT_API_URL || 'http://localhost:8000';

// ─── API Service ─────────────────────────────────────────────────────────────

export const presentationApi = {
  /**
   * List saved project presentations.
   */
  listProjectPresentations: async (
    projectId: string
  ): Promise<ProjectPresentationSummary[]> => {
    const res = await fetch(
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
    const res = await fetch(
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
    const res = await fetch(
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
   * Generate a presentation revision for an existing project presentation.
   */
  generateProjectPresentation: async (
    presentationId: string,
    settings: Partial<PresentationSettings>
  ): Promise<GenerateProjectPresentationResponse> => {
    const res = await fetch(
      `${API_BASE}/api/v1/ppt/markdown/project/presentations/${presentationId}/generate`,
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
          logo_url: settings.logoUrl || null,
          logo_position: settings.logoPosition || null,
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
    const res = await fetch(
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
    const res = await fetch(
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
    const res = await fetch(
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
    const res = await fetch(
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
    const res = await fetch(
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
    const res = await fetch(
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
    const res = await fetch(`${API_BASE}/api/v1/ppt/markdown/create`, {
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
    const res = await fetch(
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
    const res = await fetch(
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
    const res = await fetch(
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
    const res = await fetch(
      `${API_BASE}/api/v1/ppt/markdown/presentation/${presentationId}/export/pptx`,
      { method: 'POST' }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Export failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },
};

/**
 * Returns the full SSE stream URL for a presentation ID.
 */
export const getStreamUrl = (presentationId: string): string =>
  `${API_BASE}/api/v1/ppt/markdown/presentation/${presentationId}/stream`;
