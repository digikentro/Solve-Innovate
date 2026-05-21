import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FiLayout, FiSliders, FiPlus } from 'react-icons/fi';
import { RteToolbar } from './RteToolbar';
import { ActiveEditorProvider } from './ActiveEditorContext';
import { PrintablePresentation } from './PrintablePresentation';
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCloud,
  FiCopy,
  FiCornerDownRight,
  FiMoreVertical,
  FiPlay,
  FiRotateCcw,
  FiRotateCw,
  FiTrash2,
  FiUpload,
  FiX,
} from 'react-icons/fi';

import { THEMES } from '@/themes';
import type {
  PresentationSettings,
  SlideData,
  SpatialBlock,
  SpatialChartBlock,
  SpatialImageBlock,
  SpatialTextBlock,
  Theme,
} from '@/types/presentation';
import { presentationApi } from '@/services/presentationApi';
import { SlideThumbnails } from './SlideThumbnails';
import { SlideRenderer, SLIDE_REFERENCE_WIDTH, SLIDE_REFERENCE_HEIGHT } from './renderer/SlideRenderer';

type PanelTab = 'design' | 'insert' | 'format';

interface PresentationViewerProps {
  title: string;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  slides: SlideData[];
  theme: Theme;
  settings: PresentationSettings;
  setSettings: React.Dispatch<React.SetStateAction<PresentationSettings>>;
  currentIndex: number;
  selectedBlockIds: string[];
  onSelectBlocks: (ids: string[]) => void;
  onSelectSlide: (index: number) => void;
  onUpdateSlide: (slideIndex: number, updater: (slide: SlideData) => SlideData) => void;
  onReorderSlides: (fromIndex: number, toIndex: number) => void;
  onSwitchTheme: (themeId: string) => void;
  onRegenerateSlide: (index: number, instructions?: string) => void;
  onExportPptx: () => void;
  onExportPdf: () => void;
  isExporting?: boolean;
  onAddSlide: (afterIndex?: number) => void;
  onDeleteSlide: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onBack: () => void;
  onTitleChange: (title: string) => void;
  onCopySelection: () => void;
  onPasteSelection: () => void;
  onDeleteSelection: () => void;
}

const getSaveLabel = (saveState: 'idle' | 'saving' | 'saved' | 'error'): string => {
  if (saveState === 'saving') {
    return 'Saving...';
  }
  if (saveState === 'saved') {
    return 'Saved';
  }
  if (saveState === 'error') {
    return 'Save error';
  }
  return 'Saved';
};

const addBlockAtCenter = (slide: SlideData, block: SpatialBlock): SlideData => {
  const nextZ = slide.blocks.reduce((acc, item) => Math.max(acc, item.z_index || 0), 0) + 1;
  return {
    ...slide,
    blocks: [
      ...slide.blocks,
      {
        ...block,
        z_index: block.type === 'shape' ? -1 : nextZ,
      },
    ],
  };
};

const applySelectedBlockUpdate = (
  slide: SlideData,
  selectedIds: string[],
  updater: (block: SpatialBlock) => SpatialBlock
): SlideData => ({
  ...slide,
  blocks: slide.blocks.map((block) =>
    selectedIds.includes(block.id)
      ? updater(block)
      : block
  ),
});

export const PresentationViewer = ({
  title,
  saveState,
  slides,
  theme,
  settings,
  setSettings,
  currentIndex,
  selectedBlockIds,
  onSelectBlocks,
  onSelectSlide,
  onUpdateSlide,
  onReorderSlides,
  onSwitchTheme,
  onRegenerateSlide,
  onExportPptx,
  onExportPdf,
  isExporting,
  onAddSlide,
  onDeleteSlide,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onBack,
  onTitleChange,
  onCopySelection,
  onPasteSelection,
  onDeleteSelection,
}: PresentationViewerProps) => {
  const [activeTab, setActiveTab] = useState<PanelTab | null>(null);
  const [isExportingPdfLocal, setIsExportingPdfLocal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: title,
    onAfterPrint: () => setIsExportingPdfLocal(false),
  });

  const triggerPdfExport = () => {
    setIsExportingPdfLocal(true);
    setTimeout(() => {
      handlePrint();
    }, 500); // Give React time to render all slides into the hidden ref
  };
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState('');
  const [thumbnailsOpen, setThumbnailsOpen] = useState(true);

  // Image insertion state
  type ImageInsertMode = 'url' | 'upload' | 'ai';
  const [imageInsertOpen, setImageInsertOpen] = useState(false);
  const [imageInsertMode, setImageInsertMode] = useState<ImageInsertMode>('url');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePromptInput, setImagePromptInput] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');

  const stageRef = useRef<HTMLDivElement | null>(null);

  const slide = slides[currentIndex];
  if (!slide) {
    return null;
  }

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < slides.length - 1;

  const activeBlock = slide.blocks.find((block) => selectedBlockIds.includes(block.id)) || null;
  const brandColors = [
    settings.customColors?.primary || theme.colors.primary,
    settings.customColors?.accent || theme.colors.accent || '#22c55e',
    settings.customColors?.background || theme.colors.bg,
    settings.customColors?.text || theme.colors.text,
  ];

  const activeTheme = useMemo(() => {
    return {
      ...theme,
      colors: {
        ...theme.colors,
        primary: settings.customColors?.primary || theme.colors.primary,
        accent: settings.customColors?.accent || theme.colors.accent,
        bg: settings.customColors?.background || theme.colors.bg,
        text: settings.customColors?.text || theme.colors.text,
      },
    };
  }, [settings.customColors, theme]);

  const insertImageBlock = (url: string) => {
    if (!url.trim()) return;
    onUpdateSlide(currentIndex, (targetSlide) =>
      addBlockAtCenter(targetSlide, {
        id: `block-${Date.now()}`,
        type: 'image',
        position: { x: 20, y: 20, width: 60, height: 45 },
        prompt: url.trim(),
        caption: 'Image',
        object_fit: 'cover',
      } as SpatialImageBlock)
    );
    setImageInsertOpen(false);
    setImageUrlInput('');
    setImagePromptInput('');
    setImageError('');
  };

  const handleInsertImageFromUrl = () => {
    insertImageBlock(imageUrlInput);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageLoading(true);
    setImageError('');
    try {
      const url = await presentationApi.uploadImage(file);
      insertImageBlock(url);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setImageLoading(false);
      e.target.value = '';
    }
  };

  const handleGenerateAiImage = async () => {
    if (!imagePromptInput.trim()) return;
    setImageLoading(true);
    setImageError('');
    try {
      const url = await presentationApi.generateImage(imagePromptInput.trim());
      insertImageBlock(url);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setImageLoading(false);
    }
  };

  const [isPresentMode, setIsPresentMode] = useState(false);

  const enterPresentationMode = () => {
    setIsPresentMode(true);
  };

  const exitPresentationMode = useCallback(() => {
    setIsPresentMode(false);
  }, []);

  useEffect(() => {
    const handleArrowNavigation = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === 'ArrowLeft' && canGoPrevious) {
        event.preventDefault();
        onSelectSlide(currentIndex - 1);
      }

      if (event.key === 'ArrowRight' && canGoNext) {
        event.preventDefault();
        onSelectSlide(currentIndex + 1);
      }

      if (event.key === 'Escape' && isPresentMode) {
        event.preventDefault();
        exitPresentationMode();
      }
    };

    window.addEventListener('keydown', handleArrowNavigation);
    return () => window.removeEventListener('keydown', handleArrowNavigation);
  }, [canGoNext, canGoPrevious, currentIndex, isPresentMode, exitPresentationMode, onSelectSlide]);

  return (
    <ActiveEditorProvider>
    <div className="h-[calc(100vh-180px)] min-h-[680px] rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden relative flex flex-col">

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center px-4 relative flex-shrink-0 z-30">

        {/* Left: Back button */}
        <div className="absolute left-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Presentations
          </button>
        </div>

        {/* Center: Title */}
        <div className="flex-1 flex justify-center">
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-label="Presentation title"
            className="text-base font-semibold text-slate-900 bg-transparent text-center border-b border-transparent focus:outline-none focus:border-sky-500 w-64 max-w-[28vw] truncate"
          />
        </div>

        {/* Right: Save + Undo/Redo + Actions */}
        <div className="absolute right-4 flex items-center gap-1.5">
          {/* Save indicator — single colored cloud */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
            saveState === 'saving' ? 'text-amber-500' :
            saveState === 'error'  ? 'text-red-500'   : 'text-emerald-600'
          }`}>
            <FiCloud className="h-4 w-4" />
            <span>{getSaveLabel(saveState)}</span>
          </span>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          <button onClick={onUndo} disabled={!canUndo} title="Undo"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <FiRotateCcw className="h-3.5 w-3.5" /> Undo
          </button>
          <button onClick={onRedo} disabled={!canRedo} title="Redo"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <FiRotateCw className="h-3.5 w-3.5" /> Redo
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5" />

          <button onClick={enterPresentationMode}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <FiPlay className="h-4 w-4" /> Present
          </button>

          <div className="relative">
            <button onClick={() => setShowExportMenu((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-100 transition-colors"
            >
              Export <FiChevronDown className="h-4 w-4" />
            </button>
            {showExportMenu ? (
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg p-1 z-50">
                <button disabled={isExporting} onClick={onExportPptx}
                  className="w-full px-3 py-2 text-left text-sm rounded hover:bg-slate-100 disabled:opacity-50"
                >Export PPTX</button>
                <button disabled={isExporting || isExportingPdfLocal} onClick={triggerPdfExport}
                  className="w-full px-3 py-2 text-left text-sm rounded hover:bg-slate-100 disabled:opacity-50"
                >Export PDF</button>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button onClick={() => setShowSettingsMenu((prev) => !prev)}
              aria-label="Open slide settings"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              <FiMoreVertical className="h-4 w-4" />
            </button>
            {showSettingsMenu ? (
              <div className="absolute right-0 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg p-2 z-50 space-y-2">
                <label className="block text-xs text-slate-500">Single Slide AI Regeneration</label>
                <textarea value={regenInstructions} onChange={(e) => setRegenInstructions(e.target.value)}
                  aria-label="Single slide regeneration instructions"
                  className="w-full min-h-[80px] rounded-md border border-slate-200 px-2 py-1 text-sm"
                  placeholder="Add optional instructions"
                />
                <button onClick={() => onRegenerateSlide(currentIndex, regenInstructions || undefined)}
                  className="w-full px-3 py-2 rounded-md bg-sky-600 text-white text-sm"
                >Regenerate Current Slide</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left: Collapsible thumbnail sidebar */}
        <div className={`h-full relative flex-shrink-0 transition-[width] duration-300 ease-in-out ${thumbnailsOpen ? 'w-[220px]' : 'w-0'}`}>
          {/* Collapse toggle button */}
          <button
            onClick={() => setThumbnailsOpen((prev) => !prev)}
            aria-label={thumbnailsOpen ? 'Collapse slide panel' : 'Expand slide panel'}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-10 bg-white rounded-r-xl border border-l-0 border-slate-200 shadow-md px-1 py-4 hover:bg-slate-50 transition-colors"
          >
            {thumbnailsOpen
              ? <FiChevronLeft className="h-4 w-4 text-slate-500" />
              : <FiChevronRight className="h-4 w-4 text-slate-500" />}
          </button>
          {/* Sidebar panel */}
          <div className="w-[220px] h-full bg-white border-r border-slate-200 rounded-tr-2xl rounded-br-2xl shadow-xl overflow-hidden p-3">
            <SlideThumbnails
              slides={slides}
              theme={activeTheme}
              logoUrl={settings.logoUrl || undefined}
              logoPosition={settings.logoPosition}
              currentIndex={currentIndex}
              onSelect={onSelectSlide}
              onReorder={onReorderSlides}
              onAddSlide={() => onAddSlide(currentIndex)}
            />
          </div>
        </div>

        {/* Center: Slide canvas */}
        <main className="flex-1 relative overflow-hidden bg-slate-100">
          {/* RteToolbar when blocks are selected */}
          {selectedBlockIds.length > 0 && (
            <div className="absolute top-3 left-0 right-0 z-20 flex justify-center pointer-events-none">
              <div className="pointer-events-auto"><RteToolbar /></div>
            </div>
          )}

          {/* Slide — absolute fill, pb-24 reserves space for nav bar */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pb-24">
            <div className="w-full h-full">
              <SlideRenderer
                key={currentIndex}
                slide={slide}
                theme={activeTheme}
                logoUrl={settings.logoUrl || undefined}
                logoPosition={settings.logoPosition}
                role="viewer"
                selectedBlockIds={selectedBlockIds}
                onSelectBlocks={onSelectBlocks}
                onBlockSelect={() => {}}
                onSlideChange={(nextSlide) => onUpdateSlide(currentIndex, () => nextSlide)}
              />
            </div>
          </div>

          {/* Floating bottom nav bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white rounded-2xl shadow-lg border border-slate-200 px-4 py-2.5 min-w-[360px]">
            <div className="flex items-center gap-3">
              <button onClick={() => onSelectSlide(currentIndex - 1)} disabled={!canGoPrevious}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
              >
                <FiChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <input type="range" min={0} max={Math.max(0, slides.length - 1)} value={currentIndex}
                onChange={(e) => onSelectSlide(Number(e.target.value))}
                className="flex-1 accent-sky-600" aria-label="Slide navigation slider"
              />
              <button onClick={() => onSelectSlide(currentIndex + 1)} disabled={!canGoNext}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
              >
                Next <FiChevronRight className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[52px] text-right text-xs font-semibold text-slate-500">
                {currentIndex + 1} / {slides.length}
              </span>
            </div>
          </div>
        </main>

        {activeTab ? (
          <aside className="absolute right-[84px] top-4 bottom-16 w-72 z-30 shadow-2xl border border-slate-200 bg-white rounded-2xl overflow-hidden">
            <div className="h-12 border-b border-slate-200 flex items-center px-4 font-semibold text-slate-700 capitalize">
              {activeTab} Actions
              <button
                onClick={() => setActiveTab(null)}
                className="ml-auto text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-48px)] pb-16">
            {activeTab === 'design' ? (
              <>
                <section className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500">Theme</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {THEMES.map((candidate) => (
                      <button
                        key={candidate.id}
                        onClick={() => onSwitchTheme(candidate.id)}
                        aria-label={`Switch to ${candidate.name} theme`}
                        title={`Switch to ${candidate.name} theme`}
                        className={`h-9 rounded border-2 ${
                          candidate.id === settings.theme ? 'border-sky-500' : 'border-slate-200'
                        }`}
                        style={{ background: candidate.colors.bg }}
                      />
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500">Brand Colors</h4>
                  {[
                    { key: 'primary', label: 'Primary' },
                    { key: 'accent', label: 'Accent' },
                    { key: 'background', label: 'Background' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between text-sm">
                      <span>{item.label}</span>
                      <input
                        type="color"
                        value={
                          (settings.customColors?.[item.key as keyof NonNullable<typeof settings.customColors>] as string) ||
                          (item.key === 'background' ? theme.colors.bg : theme.colors.primary)
                        }
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            customColors: {
                              ...(prev.customColors || {}),
                              [item.key]: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500">Logo</h4>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-2 py-1.5 rounded border border-slate-200 text-xs cursor-pointer">
                      <FiUpload className="h-3.5 w-3.5" /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            setSettings((prev) => ({
                              ...prev,
                              logoUrl: String(reader.result || ''),
                            }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <input
                      value={settings.logoUrl || ''}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          logoUrl: event.target.value,
                        }))
                      }
                      aria-label="Logo URL"
                      placeholder="Logo URL"
                      className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-xs"
                    />
                  </div>
                  <select
                    value={settings.logoPosition || 'top-right'}
                    aria-label="Logo position"
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        logoPosition: event.target.value as PresentationSettings['logoPosition'],
                      }))
                    }
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </section>
              </>
            ) : null}

            {activeTab === 'insert' ? (
              <>
                <button
                  onClick={() =>
                    onUpdateSlide(currentIndex, (targetSlide) =>
                      addBlockAtCenter(targetSlide, {
                        id: `block-${Date.now()}`,
                        type: 'text',
                        position: { x: 12, y: 10, width: 76, height: 16 },
                        content: 'Heading',
                        style: { variant: 'title', emphasis: 'strong' },
                      } as SpatialTextBlock)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-left"
                >
                  Add Heading
                </button>
                <button
                  onClick={() =>
                    onUpdateSlide(currentIndex, (targetSlide) =>
                      addBlockAtCenter(targetSlide, {
                        id: `block-${Date.now()}`,
                        type: 'text',
                        position: { x: 12, y: 30, width: 76, height: 20 },
                        content: 'Paragraph text',
                        style: { variant: 'body' },
                      } as SpatialTextBlock)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-left"
                >
                  Add Paragraph
                </button>
                {/* ── Image Inserter ─────────────────────────────── */}
                {!imageInsertOpen ? (
                  <button
                    onClick={() => {
                      setImageInsertOpen(true);
                      setImageInsertMode('url');
                      setImageError('');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-left"
                  >
                    Add Image
                  </button>
                ) : (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 space-y-2">
                    {/* Mode tabs */}
                    <div className="flex items-center gap-1">
                      {(['url', 'upload', 'ai'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => { setImageInsertMode(mode); setImageError(''); }}
                          className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                            imageInsertMode === mode
                              ? 'bg-sky-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {mode === 'url' ? 'URL' : mode === 'upload' ? 'Upload' : 'AI Generate'}
                        </button>
                      ))}
                      <button
                        onClick={() => { setImageInsertOpen(false); setImageError(''); }}
                        className="ml-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-600"
                        aria-label="Close image panel"
                      >
                        ✕
                      </button>
                    </div>

                    {/* URL tab */}
                    {imageInsertMode === 'url' && (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleInsertImageFromUrl(); }}
                          placeholder="https://example.com/image.png"
                          className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-400"
                        />
                        <button
                          onClick={handleInsertImageFromUrl}
                          disabled={!imageUrlInput.trim()}
                          className="w-full px-3 py-1.5 rounded bg-sky-600 text-white text-xs disabled:opacity-40"
                        >
                          Insert
                        </button>
                      </div>
                    )}

                    {/* Upload tab */}
                    {imageInsertMode === 'upload' && (
                      <label className={`flex items-center justify-center gap-2 w-full px-3 py-2 rounded border-2 border-dashed border-sky-300 text-xs text-sky-700 cursor-pointer hover:bg-sky-100 transition-colors ${imageLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <FiUpload className="h-3.5 w-3.5" />
                        {imageLoading ? 'Uploading...' : 'Choose image from device'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleUploadImage}
                          disabled={imageLoading}
                        />
                      </label>
                    )}

                    {/* AI Generate tab */}
                    {imageInsertMode === 'ai' && (
                      <div className="space-y-2">
                        <textarea
                          value={imagePromptInput}
                          onChange={(e) => setImagePromptInput(e.target.value)}
                          placeholder="Describe the image you want to generate..."
                          rows={3}
                          className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 resize-none"
                        />
                        <button
                          onClick={handleGenerateAiImage}
                          disabled={!imagePromptInput.trim() || imageLoading}
                          className="w-full px-3 py-1.5 rounded bg-sky-600 text-white text-xs disabled:opacity-40"
                        >
                          {imageLoading ? 'Generating...' : 'Generate Image'}
                        </button>
                      </div>
                    )}

                    {/* Error message */}
                    {imageError && (
                      <p className="text-xs text-red-500">{imageError}</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() =>
                    onUpdateSlide(currentIndex, (targetSlide) =>
                      addBlockAtCenter(targetSlide, {
                        id: `block-${Date.now()}`,
                        type: 'chart',
                        position: { x: 12, y: 18, width: 72, height: 50 },
                        chart_type: 'bar',
                        data: [
                          { label: 'A', value: 24 },
                          { label: 'B', value: 18 },
                          { label: 'C', value: 30 },
                        ],
                        title: 'Chart',
                      } as SpatialChartBlock)
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-left"
                >
                  Add Chart
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      onUpdateSlide(currentIndex, (targetSlide) =>
                        addBlockAtCenter(targetSlide, {
                          id: `block-${Date.now()}`,
                          type: 'table',
                          position: { x: 10, y: 20, width: 80, height: 60 },
                          data: {
                            headers: ['Column 1', 'Column 2', 'Column 3'],
                            rows: [
                              ['Data A1', 'Data B1', 'Data C1'],
                              ['Data A2', 'Data B2', 'Data C2']
                            ]
                          }
                        } as any)
                      )
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-center"
                  >
                    Add Table
                  </button>
                </div>
                <details className="mt-2 text-sm border border-slate-200 rounded-lg group">
                  <summary className="w-full px-3 py-2 font-medium cursor-pointer outline-none bg-slate-50 hover:bg-slate-100 rounded-lg">Add Shape</summary>
                  <div className="grid grid-cols-2 gap-2 p-2 pt-2 border-t border-slate-100">
                    {['square', 'circle', 'rectangle', 'triangle', 'line'].map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          onUpdateSlide(currentIndex, (targetSlide) =>
                            addBlockAtCenter(targetSlide, {
                              id: `block-${Date.now()}`,
                              type: 'shape',
                              position: { x: 40, y: 30, width: s === 'rectangle' || s === 'line' ? 30 : 15, height: s === 'line' ? 2 : 15 },
                              shape_type: s,
                            } as any)
                          )
                        }
                        className="px-2 py-2 rounded-lg border border-slate-200 text-xs text-center capitalize hover:bg-sky-50 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </details>
              </>
            ) : null}

            {activeTab === 'format' && !activeBlock ? (
              <div className="text-sm text-slate-500 text-center py-8">Select a block on the slide to format it.</div>
            ) : null}

            {activeTab === 'format' && activeBlock ? (
              <>
                <section className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500">Brand Colors</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {brandColors.map((color) => (
                      <button
                        key={color}
                        aria-label={`Apply ${color} color`}
                        title={`Apply ${color} color`}
                        className="h-8 rounded border border-slate-200"
                        style={{ background: color }}
                        onClick={() => {
                          onUpdateSlide(currentIndex, (targetSlide) =>
                            applySelectedBlockUpdate(targetSlide, selectedBlockIds, (block) => {
                              if (block.type === 'text') {
                                return {
                                  ...block,
                                  style: {
                                    ...(block.style || {}),
                                    color,
                                  },
                                } as SpatialTextBlock;
                              }

                              if (block.type === 'chart' || block.type === 'shape' || block.type === 'table') {
                                return {
                                  ...block,
                                  color,
                                } as any;
                              }

                              return block;
                            })
                          );
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    aria-label="Choose custom block color"
                    onChange={(event) => {
                      const value = event.target.value;
                      onUpdateSlide(currentIndex, (targetSlide) =>
                        applySelectedBlockUpdate(targetSlide, selectedBlockIds, (block) => {
                          if (block.type === 'text') {
                            return {
                              ...block,
                              style: {
                                ...(block.style || {}),
                                color: value,
                              },
                            } as SpatialTextBlock;
                          }
                          if (block.type === 'chart' || block.type === 'shape' || block.type === 'table') {
                            return {
                              ...block,
                              color: value,
                            } as any;
                          }
                          return block;
                        })
                      );
                    }}
                  />
                </section>

                {activeBlock.type === 'image' ? (
                  <section className="space-y-2">
                    <h4 className="text-xs uppercase tracking-wide text-slate-500">Image</h4>
                    <input
                      className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                      value={activeBlock.prompt}
                      aria-label="Image URL or AI prompt"
                      onChange={(event) =>
                        onUpdateSlide(currentIndex, (targetSlide) =>
                          applySelectedBlockUpdate(targetSlide, selectedBlockIds, (block) =>
                            block.type === 'image'
                              ? ({ ...block, prompt: event.target.value } as SpatialImageBlock)
                              : block
                          )
                        )
                      }
                      placeholder="Replace image URL or AI prompt"
                    />
                    <select
                      value={activeBlock.object_fit || 'cover'}
                      aria-label="Image fit mode"
                      onChange={(event) =>
                        onUpdateSlide(currentIndex, (targetSlide) =>
                          applySelectedBlockUpdate(targetSlide, selectedBlockIds, (block) =>
                            block.type === 'image'
                              ? ({ ...block, object_fit: event.target.value as 'cover' | 'contain' } as SpatialImageBlock)
                              : block
                          )
                        )
                      }
                      className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                    >
                      <option value="contain">Show Entire Image (Contain)</option>
                      <option value="cover">Fill Box Visually Crop (Cover)</option>
                    </select>
                  </section>
                ) : null}

                <section className="space-y-2">
                  <h4 className="text-xs uppercase tracking-wide text-slate-500">Layer</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="px-2 py-1.5 rounded border border-slate-200 text-sm"
                      onClick={() =>
                        onUpdateSlide(currentIndex, (targetSlide) =>
                          applySelectedBlockUpdate(targetSlide, selectedBlockIds, (block) => ({
                            ...block,
                            z_index: (block.z_index || 0) + 1,
                          }))
                        )
                      }
                    >
                      Bring Forward
                    </button>
                    <button
                      className="px-2 py-1.5 rounded border border-slate-200 text-sm"
                      onClick={() =>
                        onUpdateSlide(currentIndex, (targetSlide) =>
                          applySelectedBlockUpdate(targetSlide, selectedBlockIds, (block) => ({
                            ...block,
                            z_index: Math.max(0, (block.z_index || 0) - 1),
                          }))
                        )
                      }
                    >
                      Send Backward
                    </button>
                  </div>
                </section>

                <section className="space-y-2">
                  <button
                    onClick={onCopySelection}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  >
                    <FiCopy className="h-4 w-4" /> Copy
                  </button>
                  <button
                    onClick={onPasteSelection}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  >
                    <FiCornerDownRight className="h-4 w-4" /> Paste
                  </button>
                  <button
                    onClick={onDeleteSelection}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm"
                  >
                    <FiTrash2 className="h-4 w-4" /> Delete
                  </button>
                </section>
              </>
            ) : null}

            <section className="pt-4 border-t border-slate-200 space-y-2">
              <button
                onClick={() => onAddSlide(currentIndex)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              >
                Add New Slide
              </button>
              <button
                onClick={() => onDeleteSlide(currentIndex)}
                className="w-full px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm"
              >
                Delete Slide
              </button>
            </section>
          </div>
        </aside>
        ) : null}

        {/* Right: Tool strip (Design / Insert / Format) */}
        <div className="flex-shrink-0 w-20 flex flex-col items-center justify-center py-6 z-20">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2 flex flex-col gap-1">
            {(['design', 'insert', 'format'] as const).map((tab) => {
              const Icon = tab === 'design' ? FiLayout : tab === 'insert' ? FiPlus : FiSliders;
              const label = tab === 'design' ? 'Design' : tab === 'insert' ? 'Insert' : 'Format';
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(activeTab === tab ? null : tab)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[10px] font-medium transition-colors ${
                    activeTab === tab ? 'bg-sky-100 text-sky-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
      {isExportingPdfLocal && (
        <div className="fixed inset-0 z-50 bg-white items-center flex justify-center text-xl font-semibold opacity-0 pointer-events-none">
          <PrintablePresentation ref={printRef} slides={slides} theme={activeTheme} settings={settings} />
        </div>
      )}
    </div>

    {/* ── Fullscreen Present Mode Overlay ──────────────────────────────── */}
    {isPresentMode && (
      <div
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
        onClick={exitPresentationMode}
      >
        {/* Slide — fills the screen while keeping 16:9 aspect ratio */}
        <div
          className="w-full h-full flex items-center justify-center p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* The SlideRenderer's ScaledSlideCanvas handles the scaling automatically */}
            <div className="w-full" style={{ maxHeight: '100vh', aspectRatio: `${SLIDE_REFERENCE_WIDTH} / ${SLIDE_REFERENCE_HEIGHT}` }}>
              <SlideRenderer
                key={`present-${currentIndex}`}
                slide={slide}
                theme={activeTheme}
                logoUrl={settings.logoUrl || undefined}
                logoPosition={settings.logoPosition}
                role="viewer"
                selectedBlockIds={[]}
                onSelectBlocks={() => {}}
                onBlockSelect={() => {}}
                onSlideChange={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Navigation controls at bottom */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onSelectSlide(currentIndex - 1)}
            disabled={!canGoPrevious}
            className="p-2 rounded-lg text-white disabled:opacity-30 hover:bg-white/20"
            aria-label="Previous slide"
          >
            <FiChevronLeft className="h-6 w-6" />
          </button>
          <span className="text-white text-sm font-semibold min-w-[64px] text-center">
            {currentIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => onSelectSlide(currentIndex + 1)}
            disabled={!canGoNext}
            className="p-2 rounded-lg text-white disabled:opacity-30 hover:bg-white/20"
            aria-label="Next slide"
          >
            <FiChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={exitPresentationMode}
          className="absolute top-4 right-4 p-2 rounded-lg text-white hover:bg-white/20"
          aria-label="Exit presentation mode"
        >
          <FiX className="h-6 w-6" />
        </button>
      </div>
    )}
    </ActiveEditorProvider>
  );
};
