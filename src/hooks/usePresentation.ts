import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'react-hot-toast';

import { presentationApi } from '@/services/presentationApi';
import { DEFAULT_THEME } from '@/themes';
import type { Project } from '@/types/project';
import type {
  PresentationPhase,
  PresentationSettings,
  SlideData,
  SpatialBlock,
  SpatialDeckPayload,
} from '@/types/presentation';

const DEFAULT_SETTINGS: PresentationSettings = {
  nSlides: 10,
  tone: 'professional',
  verbosity: 'concise',
  textMode: 'condense',
  audience: '',
  writingGuidance: '',
  theme: DEFAULT_THEME.id,
  language: 'English (US)',
  instructions: '',
  logoUrl: null,
  logoPosition: 'top-right',
  includeImages: true,
  includeCharts: true,
  visualPreference: 'balanced',
  imageSource: 'ai',
  customColors: {},
  imageModel: 'none',
  imageArtStyle: 'photo',
  imageKeywords: [],
  chartEnabled: false,
  chartTypes: ['bar'],
};

interface MutationOptions {
  recordHistory?: boolean;
  markDirty?: boolean;
}

interface UsePresentationReturn {
  phase: PresentationPhase;
  setPhase: React.Dispatch<React.SetStateAction<PresentationPhase>>;
  settings: PresentationSettings;
  setSettings: React.Dispatch<React.SetStateAction<PresentationSettings>>;
  presentationId: string | null;
  setPresentationId: (id: string | null) => void;
  slides: SlideData[];
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  selectedBlockIds: string[];
  setSelectedBlockIds: (ids: string[]) => void;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
  isLoading: boolean;
  generate: (projectPresentationId: string) => Promise<void>;
  switchTheme: (themeId: string) => Promise<void>;
  regenerateSlide: (index: number, instructions?: string) => Promise<void>;
  exportPptx: () => Promise<void>;
  exportPdf: () => Promise<void>;
  isExporting: boolean;
  resetToConfig: () => void;
  replaceSlides: (slides: SlideData[], options?: MutationOptions) => void;
  loadEditorPayload: (payload: SpatialDeckPayload, options?: MutationOptions) => void;
  addSlide: (afterIndex?: number) => void;
  deleteSlide: (index: number) => void;
  updateSlide: (slideIndex: number, updater: (slide: SlideData) => SlideData) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  copySelection: () => void;
  pasteSelection: () => void;
  deleteSelection: () => void;
}

const cloneSlides = (slides: SlideData[]): SlideData[] =>
  JSON.parse(JSON.stringify(slides)) as SlideData[];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
};

const normalizePosition = (position: unknown, index: number) => {
  const candidate = (position || {}) as Record<string, unknown>;
  const width = clamp(toFiniteNumber(candidate.width, 80), 4, 100);
  const height = clamp(toFiniteNumber(candidate.height, 18), 4, 100);
  const x = clamp(toFiniteNumber(candidate.x, 10), 0, 100 - width);
  const y = clamp(toFiniteNumber(candidate.y, 8 + index * 6), 0, 100 - height);

  return { x, y, width, height };
};

const normalizeBlock = (block: SpatialBlock, index: number): SpatialBlock => {
  const normalized = {
    ...block,
    position: normalizePosition((block as any).position, index),
    z_index: block.z_index ?? index,
  } as SpatialBlock;

  return normalized;
};

const normalizeSlide = (slide: SlideData, index: number): SlideData => ({
  ...slide,
  id: slide.id || `slide-${index + 1}`,
  title: slide.title || `Slide ${index + 1}`,
  blocks: (slide.blocks || []).map(normalizeBlock),
});

const normalizeVerbosity = (value: unknown): PresentationSettings['verbosity'] => {
  if (
    value === 'minimal' ||
    value === 'concise' ||
    value === 'detailed' ||
    value === 'extensive' ||
    value === 'standard' ||
    value === 'text_heavy'
  ) {
    return value;
  }
  return 'concise';
};

const normalizeTextMode = (value: unknown): PresentationSettings['textMode'] => {
  if (value === 'generate' || value === 'condense' || value === 'preserve') {
    return value;
  }
  return 'condense';
};

const normalizeImageArtStyle = (value: unknown): PresentationSettings['imageArtStyle'] => {
  if (
    value === 'photo' ||
    value === 'abstract' ||
    value === '3d' ||
    value === 'line-art' ||
    value === 'custom'
  ) {
    return value;
  }
  return 'photo';
};

const settingsToDeckConfig = (settings: PresentationSettings) => ({
  text_mode: settings.textMode,
  density: settings.verbosity,
  write_for: settings.writingGuidance || settings.audience || '',
  tone: settings.tone,
  output_language: settings.language,
  image_source: settings.imageSource,
  image_model: settings.imageModel,
  image_art_style: settings.imageArtStyle,
  image_keywords: settings.imageKeywords || [],
  theme: settings.theme,
  visual_preference: settings.visualPreference,
});

const deckConfigToSettings = (
  config: SpatialDeckPayload['config'] | undefined,
  prev: PresentationSettings
): PresentationSettings => {
  if (!config) {
    return prev;
  }

  return {
    ...prev,
    textMode: normalizeTextMode(config.text_mode ?? prev.textMode),
    verbosity: normalizeVerbosity(config.density ?? prev.verbosity),
    writingGuidance: config.write_for ?? prev.writingGuidance ?? prev.audience,
    audience: config.write_for ?? prev.audience,
    tone: config.tone ?? prev.tone,
    language: config.output_language ?? prev.language,
    imageSource: config.image_source ?? prev.imageSource,
    imageModel: config.image_model ?? prev.imageModel,
    imageArtStyle: normalizeImageArtStyle(config.image_art_style ?? prev.imageArtStyle),
    imageKeywords: config.image_keywords ?? prev.imageKeywords ?? [],
    theme: config.theme ?? prev.theme,
    visualPreference: config.visual_preference ?? prev.visualPreference,
  };
};

const deckToSlides = (deck: SpatialDeckPayload): SlideData[] =>
  (deck.slides || []).map((slide, index) =>
    normalizeSlide(
      {
        id: slide.id,
        title: slide.title,
        visual_intent: slide.visual_intent,
        chart_candidate: slide.chart_candidate,
        blocks: slide.blocks,
      },
      index
    )
  );

const slidesToDeck = (
  slides: SlideData[],
  settings: PresentationSettings
): SpatialDeckPayload => ({
  format: 'spatial-json-canvas',
  version: '1.0',
  slides: slides.map((slide) => ({
    id: slide.id,
    title: slide.title,
    visual_intent: slide.visual_intent || 'Narrative',
    chart_candidate: slide.chart_candidate || false,
    blocks: slide.blocks,
  })),
  config: settingsToDeckConfig(settings),
});

const createDefaultTextBlock = (blockIndex: number): SpatialBlock => ({
  id: `block-${Date.now()}-${blockIndex}`,
  type: 'text',
  position: { x: 8, y: 15 + blockIndex * 8, width: 84, height: 14 },
  z_index: blockIndex,
  content: 'Double-click to edit text',
  style: { variant: 'heading', align: 'left' },
});

export function usePresentation(
  _project: Project,
  projectPresentationId: string | null,
  initialMarkdownPresentationId: string | null
): UsePresentationReturn {
  const [phase, setPhase] = useState<PresentationPhase>('configure');
  const [settings, setSettings] = useState<PresentationSettings>(DEFAULT_SETTINGS);
  const [presentationId, setPresentationIdState] = useState<string | null>(
    initialMarkdownPresentationId
  );
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [history, setHistory] = useState<SlideData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboardBlocks, setClipboardBlocks] = useState<SpatialBlock[]>([]);

  const hasMountedRef = useRef(false);
  const dirtyRevisionRef = useRef(0);

  const pushHistory = useCallback((nextSlides: SlideData[]) => {
    setHistory((prev) => {
      const base = prev.slice(0, historyIndex + 1);
      base.push(cloneSlides(nextSlides));
      return base.slice(-40);
    });
    setHistoryIndex((prev) => clamp(prev + 1, 0, 39));
  }, [historyIndex]);

  const mutateSlides = useCallback(
    (updater: (prev: SlideData[]) => SlideData[], options?: MutationOptions) => {
      const { recordHistory = true, markDirty = true } = options || {};
      setSlides((prev) => {
        const next = updater(prev).map(normalizeSlide);
        if (recordHistory) {
          pushHistory(next);
        }
        if (markDirty) {
          dirtyRevisionRef.current += 1;
          setSaveState('saving');
        }
        return next;
      });
    },
    [pushHistory]
  );

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!projectPresentationId || phase !== 'viewer') {
      return;
    }

    const currentRevision = dirtyRevisionRef.current;
    if (currentRevision === 0) {
      return;
    }

    const timer = setTimeout(async () => {
      if (dirtyRevisionRef.current !== currentRevision) {
        return;
      }

      try {
        setSaveState('saving');
        await presentationApi.updateEditorState(projectPresentationId, {
          markdown_presentation_id: presentationId,
          editor_payload: slidesToDeck(slides, settings),
          theme: settings.theme,
          logo_url: settings.logoUrl || null,
          logo_position: settings.logoPosition || null,
          custom_colors: settings.customColors || null,
        });
        setSaveState('saved');
      } catch (err: any) {
        setSaveState('error');
        setError(err?.message || 'Failed to save editor changes');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [projectPresentationId, phase, slides, settings, presentationId]);

  const replaceSlides = useCallback(
    (nextSlides: SlideData[], options?: MutationOptions) => {
      mutateSlides(() => nextSlides, options);
      setCurrentSlideIndex((prev) => clamp(prev, 0, Math.max(0, nextSlides.length - 1)));
    },
    [mutateSlides]
  );

  const loadEditorPayload = useCallback(
    (payload: SpatialDeckPayload, options?: MutationOptions) => {
      const hydrated = deckToSlides(payload);
      setSettings((prev) => deckConfigToSettings(payload.config, prev));
      replaceSlides(hydrated, {
        recordHistory: options?.recordHistory ?? true,
        markDirty: options?.markDirty ?? false,
      });
      setPhase('viewer');
      setCurrentSlideIndex(0);
      setSelectedBlockIds([]);
    },
    [replaceSlides]
  );

  const generate = useCallback(
    async (activeProjectPresentationId: string) => {
      setError(null);
      setIsLoading(true);
      try {
        const response = await presentationApi.generateProjectPresentation(
          activeProjectPresentationId,
          settings
        );
        const deckWithConfig = {
          ...response.editor_payload,
          config: settingsToDeckConfig(settings),
        };
        setPresentationIdState(response.markdown_presentation_id);
        loadEditorPayload(deckWithConfig, { recordHistory: true, markDirty: false });
        await presentationApi.updateEditorState(activeProjectPresentationId, {
          markdown_presentation_id: response.markdown_presentation_id,
          editor_payload: deckWithConfig,
          theme: settings.theme,
          logo_url: settings.logoUrl || null,
          logo_position: settings.logoPosition || null,
          custom_colors: settings.customColors || null,
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to generate presentation');
      } finally {
        setIsLoading(false);
      }
    },
    [loadEditorPayload, settings]
  );

  const switchTheme = useCallback(async (themeId: string) => {
    setSettings((prev) => ({ ...prev, theme: themeId }));
    dirtyRevisionRef.current += 1;
    setSaveState('saving');
  }, []);

  const regenerateSlide = useCallback(
    async (index: number, instructions?: string) => {
      if (!presentationId) {
        toast.error('Missing presentation identifier for regeneration');
        return;
      }
      try {
        await presentationApi.regenerateSlide(presentationId, index, instructions);
      } catch (err: any) {
        setError(err?.message || 'Slide regeneration is unavailable for this backend mode');
        toast.error('Slide regeneration is unavailable in this mode');
      }
    },
    [presentationId]
  );

  const exportPptx = useCallback(async () => {
    if (!presentationId) {
      toast.error('No generated deck to export');
      return;
    }
    setIsExporting(true);
    const toastId = toast.loading('Exporting to PPTX...');
    try {
      const apiBase = import.meta.env.VITE_PPT_API_URL || 'http://localhost:8000';
      const res = await fetch(
        `${apiBase}/api/v1/ppt/markdown/presentation/${presentationId}/export/pptx`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Export failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const nameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = nameMatch?.[1] || 'presentation.pptx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('PPTX downloaded', { id: toastId });
    } catch (err: any) {
      setError(err?.message || 'Failed to export PPTX');
      toast.error(err?.message || 'Failed to export PPTX', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  }, [presentationId]);

  const exportPdf = useCallback(async () => {
    toast.error('PDF export is not yet available. Please use PPTX export.');
  }, []);

  const resetToConfig = useCallback(() => {
    setPhase('configure');
    setSlides([]);
    setCurrentSlideIndex(0);
    setSelectedBlockIds([]);
    setError(null);
    setSaveState('idle');
  }, []);

  const addSlide = useCallback(
    (afterIndex?: number) => {
      const insertIndex = afterIndex !== undefined ? afterIndex + 1 : currentSlideIndex + 1;
      const newSlide: SlideData = {
        id: `slide-${Date.now()}`,
        title: `Slide ${insertIndex + 1}`,
        visual_intent: 'Narrative',
        chart_candidate: false,
        blocks: [createDefaultTextBlock(0)],
      };
      mutateSlides((prev) => {
        const next = [...prev];
        next.splice(clamp(insertIndex, 0, next.length), 0, newSlide);
        return next.map((slide, index) => ({ ...slide, title: slide.title || `Slide ${index + 1}` }));
      });
      setCurrentSlideIndex(clamp(insertIndex, 0, slides.length));
    },
    [currentSlideIndex, mutateSlides, slides.length]
  );

  const deleteSlide = useCallback(
    (index: number) => {
      if (slides.length <= 1) {
        toast.error('Cannot delete the last slide');
        return;
      }
      mutateSlides((prev) => prev.filter((_, idx) => idx !== index));
      setCurrentSlideIndex((prev) => clamp(prev > index ? prev - 1 : prev, 0, slides.length - 2));
      setSelectedBlockIds([]);
    },
    [slides.length, mutateSlides]
  );

  const updateSlide = useCallback(
    (slideIndex: number, updater: (slide: SlideData) => SlideData) => {
      mutateSlides((prev) =>
        prev.map((slide, idx) => (idx === slideIndex ? normalizeSlide(updater(slide), idx) : slide))
      );
    },
    [mutateSlides]
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) {
      return;
    }
    const nextIndex = historyIndex - 1;
    const state = history[nextIndex];
    if (!state) {
      return;
    }
    setSlides(cloneSlides(state));
    setHistoryIndex(nextIndex);
    setSelectedBlockIds([]);
    dirtyRevisionRef.current += 1;
    setSaveState('saving');
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) {
      return;
    }
    const nextIndex = historyIndex + 1;
    const state = history[nextIndex];
    if (!state) {
      return;
    }
    setSlides(cloneSlides(state));
    setHistoryIndex(nextIndex);
    setSelectedBlockIds([]);
    dirtyRevisionRef.current += 1;
    setSaveState('saving');
  }, [history, historyIndex]);

  const copySelection = useCallback(() => {
    const slide = slides[currentSlideIndex];
    if (!slide) {
      return;
    }
    const selected = slide.blocks.filter((block) => selectedBlockIds.includes(block.id));
    if (!selected.length) {
      return;
    }
    setClipboardBlocks(cloneSlides([{ id: 'tmp', title: '', blocks: selected }] as any)[0].blocks);
    toast.success(`${selected.length} block copied`);
  }, [currentSlideIndex, selectedBlockIds, slides]);

  const pasteSelection = useCallback(() => {
    if (!clipboardBlocks.length) {
      return;
    }
    updateSlide(currentSlideIndex, (slide) => {
      const maxZ = slide.blocks.reduce((acc, block) => Math.max(acc, block.z_index || 0), 0);
      const clones = clipboardBlocks.map((block, index) => ({
        ...block,
        id: `block-${Date.now()}-${index}`,
        position: {
          ...block.position,
          x: clamp(block.position.x + 2, 0, 100 - block.position.width),
          y: clamp(block.position.y + 2, 0, 100 - block.position.height),
        },
        z_index: maxZ + index + 1,
      }));
      return { ...slide, blocks: [...slide.blocks, ...clones] };
    });
  }, [clipboardBlocks, currentSlideIndex, updateSlide]);

  const deleteSelection = useCallback(() => {
    if (!selectedBlockIds.length) {
      return;
    }
    updateSlide(currentSlideIndex, (slide) => ({
      ...slide,
      blocks: slide.blocks.filter((block) => !selectedBlockIds.includes(block.id)),
    }));
    setSelectedBlockIds([]);
  }, [currentSlideIndex, selectedBlockIds, updateSlide]);

  useHotkeys('ctrl+c,meta+c', (event) => {
    event.preventDefault();
    copySelection();
  }, [copySelection]);

  useHotkeys('ctrl+v,meta+v', (event) => {
    event.preventDefault();
    pasteSelection();
  }, [pasteSelection]);

  useHotkeys('ctrl+z,meta+z', (event) => {
    event.preventDefault();
    undo();
  }, [undo]);

  useHotkeys('ctrl+shift+z,meta+shift+z', (event) => {
    event.preventDefault();
    redo();
  }, [redo]);

useHotkeys('backspace,delete', (event) => {
  const target = event.target as HTMLElement;
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
    return; // Let the user delete text inside TipTap normally
  }
  event.preventDefault();
  deleteSelection();
}, [deleteSelection]);

  const setPresentationId = useCallback((id: string | null) => {
    setPresentationIdState(id);
  }, []);

  const canUndo = useMemo(() => historyIndex > 0, [historyIndex]);
  const canRedo = useMemo(() => historyIndex >= 0 && historyIndex < history.length - 1, [historyIndex, history.length]);

  return {
    phase,
    setPhase,
    settings,
    setSettings,
    presentationId,
    setPresentationId,
    slides,
    currentSlideIndex,
    setCurrentSlideIndex,
    selectedBlockIds,
    setSelectedBlockIds,
    saveState,
    error,
    isLoading,
    generate,
    switchTheme,
    regenerateSlide,
    exportPptx,
    exportPdf,
    isExporting,
    resetToConfig,
    replaceSlides,
    loadEditorPayload,
    addSlide,
    deleteSlide,
    updateSlide,
    undo,
    redo,
    canUndo,
    canRedo,
    copySelection,
    pasteSelection,
    deleteSelection,
  };
}
