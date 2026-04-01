import { useEffect, useMemo, useState } from 'react';
import type { Project } from '@/types/project';
import type {
  OutlineDraft,
  OutlineSlideDraft,
  ProjectPresentationSummary,
} from '@/types/presentation';
import { usePresentation } from '@/hooks/usePresentation';
import { useProjectPresentations } from '@/hooks/useProjectPresentations';
import { presentationApi } from '@/services/presentationApi';
import { getThemeById, THEMES } from '@/themes';
import { PresentationStreamView } from './PresentationStreamView';
import { PresentationViewer } from './PresentationViewer';
import { paginateSlidesByDomMeasurement } from '@/utils/domSlidePagination';
import { parseSlideMarkdown } from '@/utils/markdownParser';
import {
  FiArrowLeft,
  FiEdit3,
  FiFilePlus,
  FiLoader,
  FiPlus,
  FiX,
} from 'react-icons/fi';

interface PresentationSectionProps {
  project: Project;
  onRefreshProject?: () => void;
}

type ViewMode = 'list' | 'editor';

const detailLinesToText = (details: string[]): string => details.join('\n');

const textToDetailLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const PresentationSection = ({ project }: PresentationSectionProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activePresentationId, setActivePresentationId] = useState<string | null>(null);
  const [activeMarkdownId, setActiveMarkdownId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [outline, setOutline] = useState<OutlineDraft | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('Presentation Draft');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [layoutVersion, setLayoutVersion] = useState(0);

  const {
    presentations,
    isLoading: listLoading,
    error: listError,
    createPresentation,
    renamePresentation,
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
    isStreaming,
    streamProgress,
    error,
    isLoading,
    generate,
    switchTheme,
    regenerateSlide,
    exportPptx,
    resetToConfig,
    presentationId,
    isExporting,
    replaceSlides,
  } = usePresentation(project, activeMarkdownId);

  const theme = getThemeById(settings.theme);
  const activePresentation = useMemo(
    () => presentations.find((p) => p.id === activePresentationId) || null,
    [presentations, activePresentationId]
  );

  useEffect(() => {
    if (phase === 'viewer' && activePresentationId) {
      refresh();
    }
  }, [phase, activePresentationId, refresh]);

  useEffect(() => {
    const onResize = () => setLayoutVersion((prev) => prev + 1);
    window.addEventListener('resize', onResize);

    const fonts = (document as any).fonts;
    if (fonts?.ready && typeof fonts.ready.then === 'function') {
      fonts.ready.then(() => setLayoutVersion((prev) => prev + 1)).catch(() => {});
    }

    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (phase !== 'viewer' || slides.length === 0) return;
    const repaged = paginateSlidesByDomMeasurement(slides, {
      theme,
      logoUrl: settings.logoUrl || undefined,
      logoPosition: settings.logoPosition || 'top-right',
    });
    const changed =
      repaged.length !== slides.length ||
      repaged.some(
        (slide, index) =>
          slide.markdown !== slides[index]?.markdown || slide.id !== slides[index]?.id
      );
    if (changed) {
      replaceSlides(repaged);
    }
  }, [phase, theme, settings.logoUrl, settings.logoPosition, slides, replaceSlides, layoutVersion]);

  useEffect(() => {
    if (phase !== 'viewer' || !activePresentationId) return;
    const markdownId = activeMarkdownId || presentationId;
    if (!markdownId || slides.length === 0) return;

    setSaveState('saving');
    const timer = setTimeout(async () => {
      try {
        await presentationApi.updateEditorState(activePresentationId, {
          markdown_presentation_id: markdownId,
          slides: slides.map((slide) => ({
            id: slide.id,
            markdown: slide.markdown,
            blocks: slide.blocks,
          })),
          theme: settings.theme,
          logo_url: settings.logoUrl || null,
          logo_position: settings.logoPosition || null,
          custom_colors: settings.customColors || null,
        });
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [
    phase,
    activePresentationId,
    activeMarkdownId,
    presentationId,
    slides,
    settings.theme,
    settings.logoUrl,
    settings.logoPosition,
  ]);

  const loadOutline = async (presentationId: string): Promise<boolean> => {
    try {
      const result = await presentationApi.getOutlineDraft(presentationId);
      setOutline(result.outline);
      setPhase('outline');
      return true;
    } catch {
      return false;
    }
  };

  const createOutline = async (presentationId: string) => {
    const result = await presentationApi.generateOutlineDraft(presentationId);
    setOutline(result.outline);
    setPhase('outline');
  };

  const saveOutline = async () => {
    if (!activePresentationId || !outline) return;
    await presentationApi.updateOutlineDraft(activePresentationId, outline);
  };

  const openPresentationItem = async (item: ProjectPresentationSummary) => {
    resetToConfig();
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
      setPhase('viewer');
      try {
        const editor = await presentationApi.getEditorState(item.id);
        if (editor.editor) {
          setSettings((prev) => ({
            ...prev,
            theme: editor.editor.theme || prev.theme,
            logoUrl: editor.editor.logo_url || prev.logoUrl || null,
            logoPosition: editor.editor.logo_position || prev.logoPosition || 'top-right',
            customColors: editor.editor.custom_colors || prev.customColors || {},
          }));
        }

        const hydrated = editor.editor.slides.map((slide, index) => ({
          id: slide.id || `slide-${index}`,
          index,
          markdown: slide.markdown,
          blocks: slide.blocks && slide.blocks.length ? slide.blocks : parseSlideMarkdown(slide.markdown),
        }));
        if (hydrated.length) {
          replaceSlides(
            paginateSlidesByDomMeasurement(hydrated, {
              theme,
              logoUrl: settings.logoUrl || undefined,
              logoPosition: settings.logoPosition || 'top-right',
            })
          );
        }
      } catch {
        // Existing generated presentations might not have editor payload yet.
      }
      return;
    }

    setActiveMarkdownId(null);
    const hasOutline = await loadOutline(item.id);
    if (!hasOutline) {
      await createOutline(item.id);
    }
  };

  const openPresentation = async (presentationId: string) => {
    const item = presentations.find((p) => p.id === presentationId);
    if (!item) return;
    await openPresentationItem(item);
  };

  const handleCreate = async () => {
    const cleanTitle = createTitle.trim() || 'Presentation Draft';
    const created = await createPresentation(cleanTitle);
    if (!created) return;
    setShowCreateModal(false);
    setCreateTitle('Presentation Draft');
    await openPresentationItem(created);
  };

  const handleRename = async () => {
    if (!activePresentationId) return;
    const clean = titleDraft.trim();
    if (!clean) return;
    await renamePresentation(activePresentationId, clean);
    await refresh();
  };

  const updateSlideOutline = (index: number, next: OutlineSlideDraft) => {
    if (!outline) return;
    const slidesCopy = [...outline.slides];
    slidesCopy[index] = next;
    setOutline({ slides: slidesCopy });
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Name your presentation</h3>
            <input
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
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
      )}

      {viewMode === 'list' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Presentations</h2>
              <p className="text-sm text-gray-600">Create, rename, and reopen decks for this project.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all"
            >
              <FiFilePlus className="w-4 h-4" />
              Create New
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="min-w-[170px] h-[180px] rounded-3xl border-2 border-dashed border-indigo-200 bg-white/80 p-4 flex flex-col items-center justify-center gap-2 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
            >
              <FiPlus className="w-7 h-7" />
              <div className="text-sm font-semibold">Create New</div>
            </button>

            {presentations.map((p) => (
              <button
                key={p.id}
                onClick={() => openPresentation(p.id)}
                className="min-w-[170px] h-[180px] rounded-3xl bg-white/90 border border-white/30 shadow-lg p-4 flex flex-col items-stretch text-left hover:shadow-xl transition-all"
              >
                <div className="text-sm font-semibold text-gray-900 truncate">{p.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
                <div className="flex-1 mt-3 rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-indigo-50 p-2 text-[11px] text-gray-500 overflow-hidden">
                  {p.preview_title || p.preview_snippet || 'No preview'}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                  <span>{p.status}</span>
                  <div className="text-indigo-600 inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <FiEdit3 className="w-3 h-3" />
                      {p.current_markdown_presentation_id ? 'Open' : 'Edit'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'editor' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setViewMode('list');
                  resetToConfig();
                  setOutline(null);
                  setActivePresentationId(null);
                  setActiveMarkdownId(null);
                }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                <FiArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">PPT Name</div>
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleRename}
                  className="text-lg font-semibold text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {activePresentation?.status ? `Status: ${activePresentation.status}` : ''}
            </div>
          </div>

          {phase === 'outline' && outline && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <aside className="xl:col-span-3">
                <div className="xl:sticky xl:top-20 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">PPT Edits</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tone</label>
                    <select
                      value={settings.tone}
                      onChange={(e) => setSettings((prev) => ({ ...prev, tone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="academic">Academic</option>
                      <option value="educational">Educational</option>
                      <option value="sales_pitch">Sales Pitch</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Density</label>
                    <select
                      value={settings.verbosity}
                      onChange={(e) => setSettings((prev) => ({ ...prev, verbosity: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                    >
                      <option value="minimal">Minimal</option>
                      <option value="concise">Concise</option>
                      <option value="standard">Standard</option>
                      <option value="text_heavy">Text Heavy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Text Mode</label>
                    <select
                      value={settings.textMode}
                      onChange={(e) => setSettings((prev) => ({ ...prev, textMode: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                    >
                      <option value="generate">Generate</option>
                      <option value="condense">Condense</option>
                      <option value="preserve">Preserve</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Target Slides</label>
                    <input
                      type="number"
                      min={3}
                      max={40}
                      value={settings.nSlides}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          nSlides: Math.max(3, Math.min(40, Number(e.target.value) || 10)),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => switchTheme(t.id)}
                        className={`h-8 rounded-lg border-2 ${
                          theme.id === t.id ? 'border-indigo-500 shadow-md' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: t.colors.bg }}
                        title={t.name}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () =>
                          setSettings((prev) => ({ ...prev, logoUrl: reader.result as string }));
                        reader.readAsDataURL(file);
                      }}
                      className="text-xs"
                    />
                    <select
                      value={settings.logoPosition || 'top-right'}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, logoPosition: e.target.value as any }))
                      }
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs"
                    >
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                  <button
                    onClick={async () => {
                      await saveOutline();
                      if (!activePresentationId) return;
                      generate(activePresentationId);
                    }}
                    className="w-full px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg transition-all"
                  >
                    Generate Slides
                  </button>
                </div>
              </aside>

              <div className="xl:col-span-9 space-y-4">
                {outline.slides.map((slide, idx) => (
                  <div key={`${slide.title}-${idx}`} className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        value={slide.title}
                        onChange={(e) => updateSlideOutline(idx, { ...slide, title: e.target.value })}
                        className="flex-1 text-sm font-semibold text-gray-800 bg-transparent border-b border-gray-200 focus:border-indigo-500 outline-none"
                      />
                      <button
                        onClick={() => {
                          const next = outline.slides.filter((_, i) => i !== idx);
                          setOutline({ slides: next });
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={detailLinesToText(slide.details)}
                      onChange={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                        updateSlideOutline(idx, { ...slide, details: textToDetailLines(e.target.value) });
                      }}
                      onFocus={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      placeholder="Outline notes for this slide (one point per line)"
                      style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflow: 'hidden' }}
                      className="w-full min-h-[110px] px-3 py-2 text-sm text-gray-700 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    if (!outline) return;
                    setOutline({
                      slides: [...outline.slides, { title: 'New Slide', details: ['Key points for this slide.'] }],
                    });
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Slide
                </button>
              </div>
            </div>
          )}

          {phase === 'configure' && (
            <div className="bg-white/85 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
              <div className="text-sm text-gray-600 mb-4">Preparing outline editor...</div>
              <button
                onClick={() => activePresentationId && createOutline(activePresentationId)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                Generate Outline
              </button>
            </div>
          )}

          {phase === 'streaming' && (
            <PresentationStreamView
              slides={slides}
              theme={theme}
              progress={streamProgress}
              isStreaming={isStreaming}
            />
          )}

          {phase === 'viewer' && slides.length > 0 && (
            <PresentationViewer
              slides={slides}
              theme={theme}
              settings={settings}
              setSettings={setSettings}
              currentIndex={currentSlideIndex}
              onSelectSlide={setCurrentSlideIndex}
              onSwitchTheme={switchTheme}
              onRegenerateSlide={regenerateSlide}
              onExportPptx={exportPptx}
              isExporting={isExporting}
              onSlidesUpdate={replaceSlides}
              saveState={saveState}
              onNewPresentation={() => {
                setViewMode('list');
                resetToConfig();
                setOutline(null);
                setActiveMarkdownId(null);
                setActivePresentationId(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
