/**
 * usePresentation.ts
 *
 * Orchestrator hook managing the 3-phase presentation state machine:
 * configure → streaming → viewer
 */

import { useState, useCallback, useEffect } from 'react';
import { presentationApi } from '@/services/presentationApi';
import { parseSlideMarkdown } from '@/utils/markdownParser';
import { usePresentationStream } from './usePresentationStream';
import { DEFAULT_THEME } from '@/themes';
import type {
  PresentationPhase,
  PresentationSettings,
  SlideData,
} from '@/types/presentation';
import type { Project } from '@/types/project';

const DEFAULT_SETTINGS: PresentationSettings = {
  nSlides: 10,
  tone: 'professional',
  verbosity: 'concise',
  textMode: 'condense',
  audience: '',
  theme: DEFAULT_THEME.id,
  imageSource: 'ai',
  imageStyle: 'photo',
  language: 'English',
  instructions: '',
  logoUrl: null,
  logoPosition: 'top-right',
};

interface UsePresentationReturn {
  phase: PresentationPhase;
  setPhase: React.Dispatch<React.SetStateAction<PresentationPhase>>;
  settings: PresentationSettings;
  setSettings: React.Dispatch<React.SetStateAction<PresentationSettings>>;
  presentationId: string | null;
  slides: SlideData[];
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  isStreaming: boolean;
  streamProgress: string;
  error: string | null;
  isLoading: boolean;
  generate: (projectPresentationId: string) => Promise<void>;
  switchTheme: (themeId: string) => Promise<void>;
  regenerateSlide: (index: number, instructions?: string) => Promise<void>;
  exportPptx: () => Promise<void>;
  resetToConfig: () => void;
  replaceSlides: (slides: SlideData[]) => void;
}

export function usePresentation(
  project: Project,
  markdownPresentationId: string | null
): UsePresentationReturn {
  const [phase, setPhase] = useState<PresentationPhase>('configure');
  const [settings, setSettings] = useState<PresentationSettings>(DEFAULT_SETTINGS);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [viewerSlides, setViewerSlides] = useState<SlideData[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const stream = usePresentationStream();

  // Load a specific markdown presentation when provided
  useEffect(() => {
    if (markdownPresentationId) {
      loadExistingPresentation(markdownPresentationId);
    }
  }, [markdownPresentationId]);

  // When streaming completes, move to viewer phase
  useEffect(() => {
    if (!stream.isStreaming && stream.slides.length > 0 && phase === 'streaming') {
      setViewerSlides(stream.slides);
      setPhase('viewer');
      setCurrentSlideIndex(0);
    }
  }, [stream.isStreaming, stream.slides, phase]);

  const loadExistingPresentation = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await presentationApi.getPresentation(id);
      if (data.generated_slides && data.generated_slides.length > 0) {
        const slides: SlideData[] = data.generated_slides.map((md, idx) => ({
          id: `slide-${idx}`,
          index: idx,
          markdown: md,
          blocks: parseSlideMarkdown(md),
        }));
        setPresentationId(id);
        setViewerSlides(slides);
        setSettings((prev) => ({ ...prev, theme: data.theme }));
        setPhase('viewer');
      }
    } catch (e) {
      console.error('Failed to load presentation:', e);
      // Stay on configure phase
    } finally {
      setIsLoading(false);
    }
  };

  const generate = useCallback(async (projectPresentationId: string) => {
    setError(null);
    try {
      const response = await presentationApi.generateProjectPresentation(
        projectPresentationId,
        settings
      );
      setPresentationId(response.markdown_presentation_id);
      setPhase('streaming');
      stream.startStream(response.markdown_presentation_id);
    } catch (e: any) {
      setError(e.message || 'Failed to generate presentation');
    }
  }, [settings, stream]);

  const switchTheme = useCallback(
    async (themeId: string) => {
      setSettings((prev) => ({ ...prev, theme: themeId }));
      if (presentationId) {
        try {
          await presentationApi.switchTheme(presentationId, themeId);
        } catch (e) {
          console.error('Failed to switch theme on backend:', e);
        }
      }
    },
    [presentationId]
  );

  const regenerateSlide = useCallback(
    async (index: number, instructions?: string) => {
      if (!presentationId) return;
      try {
        const result = await presentationApi.regenerateSlide(
          presentationId,
          index,
          instructions
        );
        const newBlocks = parseSlideMarkdown(result.markdown);
        setViewerSlides((prev) =>
          prev.map((s, i) =>
            i === index
              ? { ...s, markdown: result.markdown, blocks: newBlocks }
              : s
          )
        );
      } catch (e: any) {
        setError(e.message || 'Failed to regenerate slide');
      }
    },
    [presentationId]
  );

  const exportPptx = useCallback(async () => {
    if (!presentationId) return;
    try {
      const result = await presentationApi.exportPptx(presentationId);
      // Open the file path (backend serves it as static)
      const apiBase = import.meta.env.VITE_PPT_API_URL || 'http://localhost:8000';
      window.open(`${apiBase}/app_data/${result.path.split('app_data/').pop() || ''}`, '_blank');
    } catch (e: any) {
      setError(e.message || 'Failed to export PPTX');
    }
  }, [presentationId]);

  const resetToConfig = useCallback(() => {
    setPhase('configure');
    setPresentationId(null);
    setViewerSlides([]);
    setCurrentSlideIndex(0);
    setError(null);
    stream.stopStream();
  }, [stream]);

  const replaceSlides = useCallback((nextSlides: SlideData[]) => {
    setViewerSlides(nextSlides);
    setCurrentSlideIndex((prev) => Math.max(0, Math.min(prev, nextSlides.length - 1)));
  }, []);

  return {
    phase,
    setPhase,
    settings,
    setSettings,
    presentationId,
    slides: phase === 'streaming' ? stream.slides : viewerSlides,
    currentSlideIndex,
    setCurrentSlideIndex,
    isStreaming: stream.isStreaming,
    streamProgress: stream.progress,
    error: error || stream.error,
    isLoading,
    generate,
    switchTheme,
    regenerateSlide,
    exportPptx,
    resetToConfig,
    replaceSlides,
  };
}
