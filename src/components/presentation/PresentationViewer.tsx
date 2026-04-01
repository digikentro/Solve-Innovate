import { useEffect, useMemo, useState, useRef } from 'react';
import type { MarkdownBlock, SlideData, Theme, PresentationSettings } from '@/types/presentation';
import { THEMES } from '@/themes';
import { SlideRenderer } from './renderer/SlideRenderer';
import { SlideThumbnails } from './SlideThumbnails';
import { LightweightWysiwyg } from './LightweightWysiwyg';
import { FiDownload, FiRefreshCw, FiChevronLeft, FiChevronRight, FiPlus, FiPlay, FiMoreVertical, FiEdit2 } from 'react-icons/fi';
import { blocksToMarkdown, editorHtmlToMarkdown } from '@/utils/slideEditor';
import { parseSlideMarkdown } from '@/utils/markdownParser';

interface PresentationViewerProps {
  slides: SlideData[];
  theme: Theme;
  settings: PresentationSettings;
  setSettings: React.Dispatch<React.SetStateAction<PresentationSettings>>;
  currentIndex: number;
  onSelectSlide: (index: number) => void;
  onSwitchTheme: (themeId: string) => void;
  onRegenerateSlide: (index: number, instructions?: string) => void;
  onExportPptx: () => void;
  isExporting?: boolean;
  onNewPresentation: () => void;
  onSlidesUpdate: (slides: SlideData[]) => void;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
}

export const PresentationViewer = ({
  slides,
  theme,
  settings,
  setSettings,
  currentIndex,
  onSelectSlide,
  onSwitchTheme,
  onRegenerateSlide,
  onExportPptx,
  isExporting,
  onNewPresentation,
  onSlidesUpdate,
  saveState,
}: PresentationViewerProps) => {
  const [regenInstructions, setRegenInstructions] = useState('');
  const [showRegenInput, setShowRegenInput] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isSlideEditing, setIsSlideEditing] = useState(false);
  
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentSlide = slides[currentIndex];
  if (!currentSlide) return null;

  const logoUrl = settings.logoUrl || '';
  const logoPosition = settings.logoPosition || 'top-right';
  const customColors = settings.customColors || {};

  // Compute active theme combined with custom overrides
  const activeTheme: Theme = useMemo(() => ({
    ...theme,
    colors: {
      ...theme.colors,
      ...(customColors.primary ? { primary: customColors.primary } : {}),
      ...(customColors.secondary ? { secondary: customColors.secondary } : {}),
      ...(customColors.accent ? { accent: customColors.accent } : {}),
      ...(customColors.bg ? { bg: customColors.bg } : {}),
      ...(customColors.text ? { text: customColors.text } : {}),
    } as any
  }), [theme, customColors]);

  const handleCustomColor = (key: keyof typeof customColors, val: string) => {
    setSettings((prev: any) => ({
      ...prev,
      customColors: { ...(prev.customColors || {}), [key]: val }
    }));
  };

  const handleLogoFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSettings((prev: any) => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      fullscreenRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const updateBlocks = (nextBlocks: MarkdownBlock[]) => {
    const markdown = blocksToMarkdown(nextBlocks);
    const parsed = parseSlideMarkdown(markdown);
    const updated = slides.map((slide, i) =>
      i === currentIndex
        ? { ...slide, markdown, blocks: parsed }
        : slide
    );
    onSlidesUpdate(updated);
  };

  const handleBlockUpdate = (i: number, newBlock: MarkdownBlock) => {
    const next = [...currentSlide.blocks];
    next[i] = newBlock;
    updateBlocks(next);
  };

  const handleBlockDelete = (i: number) => {
    const next = currentSlide.blocks.filter((_, idx) => idx !== i);
    updateBlocks(next);
  };

  const handleBlockReorder = (from: number, to: number) => {
    if (from === to) return;
    const next = [...currentSlide.blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateBlocks(next);
  };

  const handleBlockAdd = (idx: number, type: 'text' | 'image' | 'chart') => {
    const next = [...currentSlide.blocks];
    let newBlock: MarkdownBlock;
    if (type === 'image') newBlock = { type: 'image', src: 'image:A new image...', alt: '' };
    else if (type === 'chart') newBlock = { type: 'chart', chartType: 'bar', data: { headers: ['Cat', 'Val'], rows: [['A', '10']] } };
    else newBlock = { type: 'paragraph', text: 'New text block' };
    
    next.splice(idx + 1, 0, newBlock);
    updateBlocks(next);
  };

  const saveBadge = useMemo(() => {
    if (saveState === 'saving') return 'Saving...';
    if (saveState === 'saved') return 'Saved';
    if (saveState === 'error') return 'Save error';
    return 'Idle';
  }, [saveState]);

  // When navigating slides, exit edit mode
  const handleNavigate = (newIndex: number) => {
    setIsSlideEditing(false);
    onSelectSlide(newIndex);
  };

  return (
    <div className="space-y-4">
      {/* ─── Top Toolbar ─── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 flex gap-4 items-end justify-between flex-wrap">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Theme Picker */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Theme</span>
            <div className="flex items-center gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSwitchTheme(t.id)}
                  className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                    theme.id === t.id ? 'border-indigo-500 shadow-md scale-110' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: t.colors.bg }}
                  title={t.name}
                >
                  <div className="w-2 h-2 rounded-full mx-auto mt-1" style={{ backgroundColor: t.colors.primary }} />
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom Colors */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom Colors</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-[11px] text-gray-600 font-medium">
                P <input type="color" value={activeTheme.colors.primary || '#000000'} onChange={(e) => handleCustomColor('primary', e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 p-0 overflow-hidden bg-transparent" />
              </label>
              <label className="flex items-center gap-1 text-[11px] text-gray-600 font-medium">
                Bg <input type="color" value={activeTheme.colors.bg || '#ffffff'} onChange={(e) => handleCustomColor('bg', e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 p-0 overflow-hidden bg-transparent" />
              </label>
              <label className="flex items-center gap-1 text-[11px] text-gray-600 font-medium">
                Tx <input type="color" value={activeTheme.colors.text || '#000000'} onChange={(e) => handleCustomColor('text', e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 p-0 overflow-hidden bg-transparent" />
              </label>
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Logo</span>
            <div className="flex gap-2 items-center">
              <input type="file" accept="image/*" onChange={(e) => handleLogoFile(e.target.files?.[0] || null)} className="text-[10px] w-48 text-gray-500" />
              <select value={logoPosition} onChange={(e) => setSettings((prev: any) => ({ ...prev, logoPosition: e.target.value }))} className="text-xs px-2 py-1 rounded-lg border border-gray-200">
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Right Toolbar */}
        <div className="flex items-center gap-3 relative">
          <span className="text-xs font-medium text-gray-500">{saveBadge}</span>
          <button onClick={toggleFullscreen} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-105 transition-all shadow border border-indigo-500">
            <FiPlay className="w-4 h-4 fill-white" /> Present
          </button>
          
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">
            <FiMoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <div className="absolute top-12 right-0 w-48 bg-white/95 backdrop-blur rounded-xl shadow-xl border border-gray-200 flex flex-col p-1 z-50 animate-fadeIn">
              <button onClick={() => { setShowRegenInput(!showRegenInput); setShowMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-left">
                <FiRefreshCw className="w-4 h-4" /> Regenerate Slide
              </button>
              <button disabled={isExporting} onClick={() => { onExportPptx(); setShowMenu(false); }} className={`flex items-center gap-2 px-3 py-2 text-sm text-left font-medium rounded-lg ${isExporting ? 'text-indigo-400 bg-indigo-50 cursor-not-allowed' : 'text-indigo-700 hover:bg-indigo-50'}`}>
                <FiDownload className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} /> {isExporting ? 'Exporting...' : 'Export PPTX'}
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button onClick={() => { onNewPresentation(); setShowMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left">
                <FiPlus className="w-4 h-4" /> New Deck
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Regenerate input */}
      {showRegenInput && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md border border-indigo-100 p-4 space-y-3 animate-fadeIn flex flex-col">
          <textarea
            value={regenInstructions}
            onChange={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
              setRegenInstructions(e.target.value);
            }}
            onFocus={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Instructions (e.g., make this slide highly visual, add a comparison table...)"
            className="w-full min-h-[60px] p-2 text-sm border rounded outline-none ring-1 ring-indigo-300 focus:ring-indigo-500 resize-none"
            style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflow: 'hidden' }}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowRegenInput(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
            <button
              onClick={() => {
                onRegenerateSlide(currentIndex, regenInstructions.trim() || undefined);
                setShowRegenInput(false);
                setRegenInstructions('');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600"
            >
              Regenerate Slide {currentIndex + 1}
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Two-column layout ─── */}
      <div className="flex gap-4">
        {/* Thumbnails sidebar */}
        {!isFullscreen && (
          <div className="hidden md:flex w-52 flex-col flex-shrink-0 overflow-y-auto max-h-[calc(100vh-260px)] pb-12 pr-1 custom-scrollbar">
            <SlideThumbnails
              slides={slides}
              theme={activeTheme}
              logoUrl={logoUrl || undefined}
              logoPosition={logoPosition}
              currentIndex={currentIndex}
              onSelect={handleNavigate}
            />
          </div>
        )}

        {/* Current Slide */}
        <div className="flex-1 min-w-0 flex flex-col gap-3" ref={fullscreenRef}>

          {/* ─── EDIT BUTTON (always visible, above slide) ─── */}
          {!isFullscreen && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Slide {currentIndex + 1} of {slides.length}
              </span>
              <button
                onClick={() => setIsSlideEditing((prev) => !prev)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow ${
                  isSlideEditing
                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700'
                }`}
              >
                <FiEdit2 className="w-4 h-4" />
                {isSlideEditing ? 'Done Editing' : 'Edit Slide'}
              </button>
            </div>
          )}

          {/* ─── Slide Canvas ─── */}
          <div
            className={`relative overflow-hidden transition-all ${
              isFullscreen
                ? 'w-full h-full flex flex-col justify-center rounded-none bg-black'
                : 'w-full rounded-2xl shadow-2xl border border-white/20'
            }`}
          >
            <div className={isFullscreen ? 'w-full aspect-video max-h-screen mx-auto' : 'w-full'}>
              <SlideRenderer
                blocks={currentSlide.blocks}
                theme={activeTheme}
                logoUrl={logoUrl || undefined}
                logoPosition={logoPosition}
                role={isFullscreen ? 'measure' : 'viewer'}
                className={isFullscreen ? '' : 'rounded-2xl'}
                dragIndex={isSlideEditing ? dragIndex : undefined}
                setDragIndex={isSlideEditing ? setDragIndex : undefined}
                onBlockUpdate={isSlideEditing ? handleBlockUpdate : undefined}
                onBlockDelete={isSlideEditing ? handleBlockDelete : undefined}
                onBlockReorder={isSlideEditing ? handleBlockReorder : undefined}
                onBlockAdd={isSlideEditing ? handleBlockAdd : undefined}
              />
            </div>

            {/* Fullscreen exit button */}
            {isFullscreen && (
              <div className="absolute top-4 right-4 z-50">
                <button onClick={toggleFullscreen} className="bg-black/50 hover:bg-black/70 text-white rounded-xl px-3 py-2 text-sm backdrop-blur">
                  Exit
                </button>
              </div>
            )}
          </div>

          {/* ─── Navigation ─── */}
          <div className={`flex items-center justify-between transition-all ${
            isFullscreen
              ? 'absolute bottom-0 w-full px-8 py-4 bg-white/90 backdrop-blur'
              : 'px-2'
          }`}>
            <button
              onClick={() => handleNavigate(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <FiChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm font-medium tracking-widest text-gray-500">
              {currentIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => handleNavigate(Math.min(slides.length - 1, currentIndex + 1))}
              disabled={currentIndex === slides.length - 1}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile thumbnails */}
      {!isFullscreen && (
        <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => handleNavigate(i)}
              className={`flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === currentIndex ? 'border-indigo-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: activeTheme.colors.bg }}
            >
              <div className="flex items-center justify-center h-full">
                <span className="text-[8px] font-bold" style={{ color: activeTheme.colors.primary }}>
                  {i + 1}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
