import { useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiBarChart2, FiFilePlus, FiLoader, FiPlus, FiTrash2, FiX, FiZap } from 'react-icons/fi';

import { usePresentation } from '@/hooks/usePresentation';
import { useProjectPresentations } from '@/hooks/useProjectPresentations';
import { presentationApi } from '@/services/presentationApi';
import { getThemeById } from '@/themes';
import type { Project } from '@/types/project';
import type {
  OutlineDraft,
  OutlineSlideDraft,
  PresentationSettings,
  ProjectPresentationSummary,
  SlideData,
  SpatialDeckPayload,
} from '@/types/presentation';
import { PresentationConfigForm } from './PresentationConfigForm';
import { PresentationViewer } from './PresentationViewer';

interface PresentationSectionProps {
  project: Project;
  onRefreshProject?: () => void;
}

type ViewMode = 'list' | 'editor';

interface PresentationSessionState {
  viewMode: ViewMode;
  activePresentationId: string | null;
  activeMarkdownId: string | null;
  phase: 'configure' | 'outline' | 'viewer';
  currentSlideIndex: number;
  titleDraft: string;
  settings?: PresentationSettings;
  editorPayload?: SpatialDeckPayload | null;
}

const getSessionStorageKey = (projectId: string): string => `presentationSectionSession_${projectId}`;

const readSessionState = (projectId: string): PresentationSessionState | null => {
  try {
    const raw = localStorage.getItem(getSessionStorageKey(projectId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PresentationSessionState>;
    return {
      viewMode: parsed.viewMode === 'editor' ? 'editor' : 'list',
      activePresentationId: typeof parsed.activePresentationId === 'string' ? parsed.activePresentationId : null,
      activeMarkdownId: typeof parsed.activeMarkdownId === 'string' ? parsed.activeMarkdownId : null,
      phase:
        parsed.phase === 'outline' || parsed.phase === 'viewer' || parsed.phase === 'configure'
          ? parsed.phase
          : 'configure',
      currentSlideIndex: typeof parsed.currentSlideIndex === 'number' && Number.isFinite(parsed.currentSlideIndex)
        ? Math.max(0, parsed.currentSlideIndex)
        : 0,
      titleDraft: typeof parsed.titleDraft === 'string' ? parsed.titleDraft : '',
      settings: parsed.settings && typeof parsed.settings === 'object'
        ? (parsed.settings as PresentationSettings)
        : undefined,
      editorPayload: parsed.editorPayload && typeof parsed.editorPayload === 'object'
        ? (parsed.editorPayload as SpatialDeckPayload)
        : null,
    };
  } catch {
    return null;
  }
};

export const PresentationSection = ({ project }: PresentationSectionProps) => {
  const sessionKey = getSessionStorageKey(project.id);
  const initialSession = readSessionState(project.id);
  const hasRestoredSessionRef = useRef(false);

  const [viewMode, setViewMode] = useState<ViewMode>(initialSession?.viewMode ?? 'list');
  const [activePresentationId, setActivePresentationId] = useState<string | null>(
    initialSession?.activePresentationId ?? null
  );
  const [activeMarkdownId, setActiveMarkdownId] = useState<string | null>(initialSession?.activeMarkdownId ?? null);
  const [titleDraft, setTitleDraft] = useState('');
  const [outline, setOutline] = useState<OutlineDraft | null>(null);
  const [outlineError, setOutlineError] = useState<string | null>(null);
  const [isOutlineGenerating, setIsOutlineGenerating] = useState(false);
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('Presentation Draft');

  const {
    presentations,
    isLoading: listLoading,
    error: listError,
    createPresentation,
    renamePresentation,
    deletePresentation,
    refresh,
  } = useProjectPresentations(project.id);

  const {
    phase,
    setPhase,
    settings,
    setSettings,
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
    resetToConfig,
    presentationId,
    setPresentationId,
    isExporting,
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
  } = usePresentation(project, activePresentationId, activeMarkdownId, {
    phase: initialSession?.phase ?? 'configure',
    currentSlideIndex: initialSession?.currentSlideIndex ?? 0,
    settings: initialSession?.settings,
    slides:
      initialSession?.phase === 'viewer' && initialSession.editorPayload?.slides
        ? (initialSession.editorPayload.slides.map((slide) => ({
            id: slide.id,
            title: slide.title,
            visual_intent: slide.visual_intent,
            chart_candidate: slide.chart_candidate,
            blocks: slide.blocks,
          })) as SlideData[])
        : [],
  });

  useEffect(() => {
    if (!initialSession) {
      return;
    }

    setCurrentSlideIndex(initialSession.currentSlideIndex);
    setTitleDraft(initialSession.titleDraft);
  }, []);

  useEffect(() => {
    try {
      const payload: PresentationSessionState = {
        viewMode,
        activePresentationId,
        activeMarkdownId,
        phase,
        currentSlideIndex,
        titleDraft,
        settings,
        editorPayload: {
          format: 'spatial-json-canvas',
          version: '1.0',
          slides: slides.map((slide) => ({
            id: slide.id,
            title: slide.title,
            visual_intent: slide.visual_intent || 'Narrative',
            chart_candidate: slide.chart_candidate || false,
            blocks: slide.blocks,
          })),
          config: {
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
          },
        },
      };
      localStorage.setItem(sessionKey, JSON.stringify(payload));
    } catch {
      // Ignore storage failures and continue with in-memory state.
    }
  }, [activeMarkdownId, activePresentationId, currentSlideIndex, phase, sessionKey, settings, slides, titleDraft, viewMode]);

  const theme = getThemeById(settings.theme);

  const activePresentation = useMemo(
    () => presentations.find((item) => item.id === activePresentationId) || null,
    [presentations, activePresentationId]
  );

  useEffect(() => {
    if (!activePresentationId) {
      return;
    }

    const timer = setTimeout(() => {
      const current = activePresentation?.title || '';
      if (titleDraft.trim() && titleDraft.trim() !== current) {
        renamePresentation(activePresentationId, titleDraft.trim());
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [activePresentation?.title, activePresentationId, renamePresentation, titleDraft]);

  const loadOutline = async (currentPresentationId: string): Promise<boolean> => {
    try {
      setOutlineError(null);
      const result = await presentationApi.getOutlineDraft(currentPresentationId);
      if (!result?.outline) {
        return false;
      }
      setOutline(result.outline);
      setPhase('outline');
      return true;
    } catch {
      return false;
    }
  };

  const createOutline = async (currentPresentationId: string) => {
    try {
      setIsOutlineGenerating(true);
      setOutlineError(null);
      const result = await presentationApi.generateOutlineDraft(currentPresentationId);
      setOutline(result.outline);
      setPhase('outline');
    } catch (err: any) {
      setOutlineError(err?.message || 'Failed to generate outline. Please try again.');
    } finally {
      setIsOutlineGenerating(false);
    }
  };

  const generatePitchDeck = async () => {
    const deckTitle = `${project.title || 'Project'} Pitch Deck`;
    setIsGeneratingDeck(true);
    try {
      setOutlineError(null);
      const created = await createPresentation(deckTitle);
      if (!created) {
        return;
      }

      setViewMode('editor');
      setTitleDraft(deckTitle);
      setActivePresentationId(created.id);
      setActiveMarkdownId(null);
      setOutline(null);
      resetToConfig();

      const generated = await generate(created.id);
      if (generated?.markdown_presentation_id) {
        setActiveMarkdownId(generated.markdown_presentation_id);
      }
    } catch (err: any) {
      setOutlineError(err?.message || 'Failed to generate pitch deck.');
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  const saveOutline = async () => {
    if (!activePresentationId || !outline) {
      return;
    }
    try {
      setOutlineError(null);
      await presentationApi.updateOutlineDraft(activePresentationId, outline);
    } catch (err: any) {
      setOutlineError(err?.message || 'Failed to save outline changes.');
      throw err;
    }
  };

  const openPresentationItem = async (item: ProjectPresentationSummary, restoreSession?: PresentationSessionState | null) => {
    const shouldPreserveRestoredDeck = Boolean(
      restoreSession?.phase === 'viewer' && restoreSession.editorPayload
    );

    if (!shouldPreserveRestoredDeck) {
      resetToConfig();
    }
    setOutlineError(null);
    setActivePresentationId(item.id);
    setTitleDraft(item.title);
    setViewMode('editor');

    if (item.current_slide_count) {
      setSettings((prev) => ({
        ...prev,
        nSlides: Math.max(3, Math.min(40, item.current_slide_count || prev.nSlides)),
      }));
    }

    if (item.logo_url || item.logo_position) {
      setSettings((prev) => ({
        ...prev,
        logoUrl: item.logo_url || prev.logoUrl || null,
        logoPosition: item.logo_position || prev.logoPosition || 'top-right',
      }));
    }

    if (item.current_markdown_presentation_id) {
      setActiveMarkdownId(item.current_markdown_presentation_id);
      setPresentationId(item.current_markdown_presentation_id);
      setPhase('viewer');
      try {
        const editorState = await presentationApi.getEditorState(item.id);
        loadEditorPayload(editorState.editor, { markDirty: false, recordHistory: true });
        const targetIndex = restoreSession?.currentSlideIndex ?? 0;
        setCurrentSlideIndex(Math.min(targetIndex, Math.max(0, editorState.editor.slides.length - 1)));
      } catch {
        // Existing records may not have editor state yet.
      }
      return;
    }

    if (shouldPreserveRestoredDeck && restoreSession?.editorPayload) {
      setActiveMarkdownId(restoreSession.activeMarkdownId ?? null);
      setPresentationId(restoreSession.activeMarkdownId ?? null);
      setPhase('viewer');
      loadEditorPayload(restoreSession.editorPayload, { markDirty: false, recordHistory: true });
      setCurrentSlideIndex(
        Math.min(
          restoreSession.currentSlideIndex,
          Math.max(0, restoreSession.editorPayload.slides.length - 1)
        )
      );
      return;
    }

    setActiveMarkdownId(null);
    const hasOutline = await loadOutline(item.id);
    if (!hasOutline) {
      await createOutline(item.id);
    }

    if (restoreSession?.phase === 'outline') {
      setPhase('outline');
    }
  };

  const openPresentation = async (presentationIdToOpen: string) => {
    const item = presentations.find((entry) => entry.id === presentationIdToOpen);
    if (!item) {
      return;
    }
    await openPresentationItem(item, readSessionState(project.id));
  };

  const handleCreate = async () => {
    const cleanTitle = createTitle.trim() || 'Presentation Draft';
    const created = await createPresentation(cleanTitle);
    if (!created) {
      return;
    }
    setShowCreateModal(false);
    setCreateTitle('Presentation Draft');
    await openPresentationItem(created, null);
  };

  useEffect(() => {
    if (hasRestoredSessionRef.current || listLoading || presentations.length === 0) {
      return;
    }

    if (!initialSession?.activePresentationId) {
      hasRestoredSessionRef.current = true;
      return;
    }

    const item = presentations.find((entry) => entry.id === initialSession.activePresentationId);
    if (!item) {
      hasRestoredSessionRef.current = true;
      return;
    }

    hasRestoredSessionRef.current = true;
    void openPresentationItem(item, initialSession);
  }, [initialSession, listLoading, presentations]);

  const updateSlideOutline = (index: number, next: OutlineSlideDraft) => {
    if (!outline) {
      return;
    }
    const nextSlides = [...outline.slides];
    nextSlides[index] = next;
    setOutline({ slides: nextSlides });
  };

  const reorderSlides = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }
    replaceSlides(
      (() => {
        const next = [...slides];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      })()
    );
    if (currentSlideIndex === fromIndex) {
      setCurrentSlideIndex(toIndex);
    }
  };

  if (isLoading || listLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex items-center gap-3 text-gray-500">
          <FiLoader className="w-6 h-6 animate-spin" />
          <span>Loading presentations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {(error || listError) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 text-sm">
          <strong>Error:</strong> {error || listError}
        </div>
      )}

      {outlineError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-sm">
          <strong>Outline Error:</strong> {outlineError}
        </div>
      )}

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Name your presentation</h3>
            <input
              value={createTitle}
              onChange={(event) => setCreateTitle(event.target.value)}
              aria-label="New presentation title"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Presentation Draft"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-2 rounded-xl text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-3 py-2 rounded-xl text-sm bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewMode === 'list' ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Presentations</h2>
              <p className="text-sm text-gray-600">Create, rename, and reopen decks for this project.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={generatePitchDeck}
                disabled={isGeneratingDeck}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                <FiBarChart2 className="w-4 h-4" />
                {isGeneratingDeck ? 'Generating Deck...' : 'Generate Pitch Deck'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 text-white text-sm font-semibold"
              >
                <FiFilePlus className="w-4 h-4" />
                Create Draft
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button
              onClick={generatePitchDeck}
              disabled={isGeneratingDeck}
              className="w-full h-[200px] rounded-3xl border-2 border-dashed border-sky-200 bg-white p-4 flex flex-col items-center justify-center gap-2 text-sky-700 disabled:opacity-60"
            >
              <FiZap className="w-7 h-7" />
              <div className="text-sm font-semibold">
                {isGeneratingDeck ? 'Generating...' : 'Generate Pitch Deck'}
              </div>
              <div className="text-xs text-sky-600 text-center max-w-[160px]">
                Turn project data into a polished, investor-ready deck
              </div>
            </button>

            {presentations.map((item) => (
              <div
                key={item.id}
                className="relative w-full h-[200px] rounded-3xl bg-white border border-slate-200 p-4 text-left"
              >
                <button
                  onClick={() => openPresentation(item.id)}
                  className="w-full h-full text-left"
                >
                  <div className="pr-9 text-sm font-semibold text-gray-900 truncate">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex-1 mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-600 overflow-hidden">
                    {item.preview_title || item.preview_snippet || 'No preview'}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">{item.status}</div>
                </button>

                <button
                  onClick={async (event) => {
                    event.stopPropagation();
                    const confirmed = window.confirm(`Delete \"${item.title}\"? This cannot be undone.`);
                    if (!confirmed) {
                      return;
                    }

                    const deleted = await deletePresentation(item.id);
                    if (!deleted) {
                      return;
                    }

                    if (activePresentationId === item.id) {
                      setActivePresentationId(null);
                      setActiveMarkdownId(null);
                      setViewMode('list');
                      setOutline(null);
                      resetToConfig();
                    }
                  }}
                  aria-label={`Delete ${item.title}`}
                  title={`Delete ${item.title}`}
                  className="absolute right-3 top-3 inline-flex items-center justify-center h-8 w-8 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {viewMode === 'editor' ? (
        <div className="space-y-5">
          {phase === 'outline' && outline ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:h-[calc(100vh-220px)]">
              <aside className="xl:col-span-3 xl:h-full xl:overflow-y-auto xl:pr-1">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
                  <button
                    onClick={() => {
                      setViewMode('list');
                      resetToConfig();
                      setOutline(null);
                      setActivePresentationId(null);
                      setActiveMarkdownId(null);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Target Slides</label>
                    <input
                      type="number"
                      min={3}
                      max={40}
                      aria-label="Target slide count"
                      value={settings.nSlides}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          nSlides: Math.max(3, Math.min(40, Number(event.target.value) || 10)),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                    />
                  </div>
                  <PresentationConfigForm
                    settings={settings}
                    setSettings={setSettings}
                    isGenerating={isLoading || isOutlineGenerating}
                    primaryLabel="Generate Slides"
                    canGenerate={Boolean(project.id && activePresentationId && titleDraft.trim())}
                    onGenerate={async () => {
                      if (!project.id || !activePresentationId || !titleDraft.trim()) {
                        return;
                      }
                      try {
                        await saveOutline();
                        await generate(activePresentationId);
                      } catch {
                        // Error is surfaced in existing banners.
                      }
                    }}
                  />
                </div>
              </aside>

              <div className="xl:col-span-9 space-y-4 xl:h-full xl:overflow-y-auto xl:pr-2">
                {outline.slides.map((slideDraft, index) => (
                  <div key={`${slideDraft.title}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <input
                          value={slideDraft.title}
                          aria-label={`Outline title for slide ${index + 1}`}
                          onChange={(event) =>
                            updateSlideOutline(index, {
                              ...slideDraft,
                              title: event.target.value,
                            })
                          }
                          className="w-full text-sm font-semibold text-gray-800 bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none"
                        />
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-sky-50 text-sky-700">
                            {slideDraft.visual_intent}
                          </span>
                          {slideDraft.has_quantitative_data ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                              <FiBarChart2 className="h-3 w-3" />
                              Quantitative Data
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const next = outline.slides.filter((_, idx) => idx !== index);
                          setOutline({ slides: next });
                        }}
                        aria-label={`Remove slide ${index + 1} from outline`}
                        title={`Remove slide ${index + 1}`}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {slideDraft.bullets.map((bullet, bulletIndex) => (
                        <input
                          key={`${slideDraft.title}-${bulletIndex}`}
                          value={bullet}
                          aria-label={`Bullet ${bulletIndex + 1} for slide ${index + 1}`}
                          onChange={(event) => {
                            const nextBullets = [...slideDraft.bullets];
                            nextBullets[bulletIndex] = event.target.value;
                            updateSlideOutline(index, {
                              ...slideDraft,
                              bullets: nextBullets,
                            });
                          }}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      ))}
                      <button
                        onClick={() =>
                          updateSlideOutline(index, {
                            ...slideDraft,
                            bullets: [...slideDraft.bullets, 'New bullet'],
                          })
                        }
                        className="text-sm text-sky-700"
                      >
                        + Add bullet
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setOutline({
                      slides: [
                        ...outline.slides,
                        {
                          title: 'New Slide',
                          bullets: ['Key point'],
                          visual_intent: 'Narrative',
                          has_quantitative_data: false,
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Slide
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'configure' ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="text-sm text-slate-600 mb-4">Preparing outline editor...</div>
              <button
                onClick={() => activePresentationId && createOutline(activePresentationId)}
                disabled={isOutlineGenerating || !activePresentationId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOutlineGenerating ? 'Generating Outline...' : 'Generate Outline'}
              </button>
            </div>
          ) : null}

        {phase === 'viewer' ? (
          slides.length > 0 ? (
            <PresentationViewer
              title={titleDraft}
              saveState={saveState}
              slides={slides}
              theme={theme}
              settings={settings}
              setSettings={setSettings}
              currentIndex={currentSlideIndex}
              selectedBlockIds={selectedBlockIds}
              onSelectBlocks={setSelectedBlockIds}
              onSelectSlide={setCurrentSlideIndex}
              onUpdateSlide={updateSlide}
              onReorderSlides={reorderSlides}
              onSwitchTheme={switchTheme}
              onRegenerateSlide={regenerateSlide}
              onExportPptx={exportPptx}
              onExportPdf={exportPdf}
              isExporting={isExporting}
              onAddSlide={addSlide}
              onDeleteSlide={deleteSlide}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onBack={() => {
                setViewMode('list');
                resetToConfig();
                setOutline(null);
                setActiveMarkdownId(null);
                setActivePresentationId(null);
                setPresentationId(null);
              }}
              onTitleChange={setTitleDraft}
              onCopySelection={copySelection}
              onPasteSelection={pasteSelection}
              onDeleteSelection={deleteSelection}
            />
          ) : (
            <div className="flex justify-center items-center py-20">
              <FiLoader className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading slides...</span>
            </div>
          )
        ) : null}
        </div>
      ) : null}
    </div>
  );
};
