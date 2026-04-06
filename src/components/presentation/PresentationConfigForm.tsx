import { useMemo, useState } from 'react';
import {
  FiCheck,
  FiChevronDown,
  FiCpu,
  FiEdit2,
  FiLoader,
  FiZap,
} from 'react-icons/fi';

import type { PresentationSettings } from '@/types/presentation';

type AccordionKey = 'text' | 'visuals';

interface PresentationConfigFormProps {
  settings: PresentationSettings;
  setSettings: React.Dispatch<React.SetStateAction<PresentationSettings>>;
  onGenerate: () => void;
  isGenerating: boolean;
  primaryLabel?: string;
  canGenerate?: boolean;
}

const TEXT_MODE_OPTIONS: Array<{
  value: PresentationSettings['textMode'];
  label: string;
}> = [
  { value: 'generate', label: '✨ Generate' },
  { value: 'condense', label: '📉 Condense' },
  { value: 'preserve', label: '🔒 Preserve' },
];

const DENSITY_OPTIONS: Array<{
  value: PresentationSettings['verbosity'];
  title: string;
  blurb: string;
  bars: number;
}> = [
  { value: 'minimal', title: 'Minimal', blurb: 'Headlines and short bullets', bars: 1 },
  { value: 'concise', title: 'Concise', blurb: 'Compact summaries and key stats', bars: 2 },
  { value: 'detailed', title: 'Detailed', blurb: 'Context-rich with examples', bars: 3 },
  { value: 'extensive', title: 'Extensive', blurb: 'Deep, text-forward narratives', bars: 4 },
];

const LANGUAGE_OPTIONS = [
  '🇺🇸 English (US)',
  '🇬🇧 English (UK)',
  '🇮🇳 English (India)',
  '🇪🇸 Spanish',
  '🇫🇷 French',
  '🇩🇪 German',
  '🇯🇵 Japanese',
  '🇰🇷 Korean',
];

const THEME_GALLERY: Array<{
  title: string;
  themeId: string;
  previewClass: string;
  accentClass: string;
}> = [
  { title: 'Verdigris', themeId: 'nature', previewClass: 'bg-gradient-to-br from-emerald-950 via-emerald-700 to-teal-100', accentClass: 'bg-teal-200' },
  { title: 'Snowball', themeId: 'clean-light', previewClass: 'bg-gradient-to-br from-sky-50 via-blue-100 to-blue-200', accentClass: 'bg-blue-600' },
  { title: 'Gamma Dark', themeId: 'modern-dark', previewClass: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700', accentClass: 'bg-indigo-300' },
  { title: 'Canaveral', themeId: 'sunset', previewClass: 'bg-gradient-to-br from-amber-950 via-orange-800 to-amber-300', accentClass: 'bg-amber-100' },
  { title: 'Dialogue', themeId: 'clean-light', previewClass: 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200', accentClass: 'bg-slate-600' },
  { title: 'Shadow', themeId: 'midnight', previewClass: 'bg-gradient-to-br from-slate-950 via-slate-800 to-indigo-700', accentClass: 'bg-indigo-200' },
];

const ART_STYLES: Array<{
  value: NonNullable<PresentationSettings['imageArtStyle']>;
  label: string;
  previewClass: string;
}> = [
  { value: 'photo', label: 'Photo', previewClass: 'bg-gradient-to-br from-slate-400 via-slate-200 to-slate-50' },
  { value: 'abstract', label: 'Abstract', previewClass: 'bg-gradient-to-br from-fuchsia-500 via-violet-600 to-cyan-500' },
  { value: '3d', label: '3D', previewClass: 'bg-gradient-to-br from-amber-100 via-orange-400 to-red-500' },
  { value: 'line-art', label: 'Line Art', previewClass: 'bg-[repeating-linear-gradient(135deg,_#f8fafc_0px,_#f8fafc_8px,_#cbd5e1_8px,_#cbd5e1_10px)]' },
  { value: 'custom', label: 'Custom', previewClass: 'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400' },
];

const QUICK_TAGS = ['vibrant', 'bold', 'playful', 'organic'];

const BAR_WIDTHS = ['w-[82%]', 'w-[70%]', 'w-[58%]', 'w-[46%]'];

const renderDensityBars = (bars: number) => (
  <div className="mt-2 grid gap-1">
    {Array.from({ length: bars }).map((_, index) => (
      <div
        // These line bars intentionally visualize text density in-card.
        key={`density-${bars}-${index}`}
        className={`h-1.5 rounded-full bg-slate-400/80 ${BAR_WIDTHS[index] || 'w-[46%]'}`}
      />
    ))}
  </div>
);

export const PresentationConfigForm = ({
  settings,
  setSettings,
  onGenerate,
  isGenerating,
  primaryLabel = 'Generate Slides',
  canGenerate = true,
}: PresentationConfigFormProps) => {
  const [openAccordion, setOpenAccordion] = useState<AccordionKey>('text');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [keywordDraft, setKeywordDraft] = useState('');

  const selectedTheme = useMemo(
    () => THEME_GALLERY.find((theme) => theme.themeId === settings.theme) || THEME_GALLERY[0],
    [settings.theme]
  );

  const update = <K extends keyof PresentationSettings>(key: K, value: PresentationSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleKeyword = (value: string) => {
    const current = settings.imageKeywords || [];
    if (current.includes(value)) {
      update(
        'imageKeywords',
        current.filter((item) => item !== value)
      );
      return;
    }
    update('imageKeywords', [...current, value]);
  };

  const appendKeywordDraft = () => {
    const draft = keywordDraft.trim();
    if (!draft) {
      return;
    }

    const segments = draft
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!segments.length) {
      return;
    }

    const deduped = Array.from(new Set([...(settings.imageKeywords || []), ...segments]));
    update('imageKeywords', deduped);
    setKeywordDraft('');
  };

  return (
    <div className="space-y-2 text-slate-800">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <button
          type="button"
          onClick={() => setOpenAccordion((prev) => (prev === 'text' ? 'visuals' : 'text'))}
          className="flex w-full items-center justify-between"
        >
          <span className="text-sm font-semibold">Text content</span>
          <FiChevronDown
            className={`h-4 w-4 transition-transform ${openAccordion === 'text' ? 'rotate-180' : ''}`}
          />
        </button>

        {openAccordion === 'text' ? (
          <div className="mt-3 space-y-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Text mode</p>
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                {TEXT_MODE_OPTIONS.map((option) => {
                  const isActive = settings.textMode === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => update('textMode', option.value)}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Amount of text</p>
              <div className="grid grid-cols-2 gap-2">
                {DENSITY_OPTIONS.map((option) => {
                  const isActive = settings.verbosity === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => update('verbosity', option.value)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        isActive
                          ? 'border-2 border-blue-600 bg-blue-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-800">{option.title}</div>
                      <div className="text-xs text-slate-500">{option.blurb}</div>
                      {renderDensityBars(option.bars)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Write for...</label>
              <div className="relative">
                <textarea
                  value={settings.writingGuidance || settings.audience || ''}
                  onChange={(event) => {
                    update('writingGuidance', event.target.value);
                    update('audience', event.target.value);
                  }}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none focus:border-indigo-400"
                  placeholder="Audience, context, and communication constraints"
                />
                <FiEdit2 className="absolute bottom-2 right-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tone</label>
              <div className="relative">
                <textarea
                  value={settings.tone}
                  onChange={(event) => update('tone', event.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm outline-none focus:border-indigo-400"
                  placeholder="Professional, conversational, assertive, data-backed..."
                />
                <FiEdit2 className="absolute bottom-2 right-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Output language</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLanguageMenu((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <span>{settings.language || '🇺🇸 English (US)'}</span>
                  <FiChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                {showLanguageMenu ? (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                    {LANGUAGE_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={option}
                        onClick={() => {
                          update('language', option);
                          setShowLanguageMenu(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm ${
                          settings.language === option ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span>{option}</span>
                        {settings.language === option ? <FiCheck className="h-4 w-4" /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <button
          type="button"
          onClick={() => setOpenAccordion((prev) => (prev === 'visuals' ? 'text' : 'visuals'))}
          className="flex w-full items-center justify-between"
        >
          <span className="text-sm font-semibold">Visuals</span>
          <FiChevronDown
            className={`h-4 w-4 transition-transform ${openAccordion === 'visuals' ? 'rotate-180' : ''}`}
          />
        </button>

        {openAccordion === 'visuals' ? (
          <div className="mt-3 space-y-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Theme selection</p>
              <div className="grid grid-cols-2 gap-2">
                {THEME_GALLERY.map((theme) => {
                  const isSelected = settings.theme === theme.themeId;
                  return (
                    <button
                      type="button"
                      key={`${theme.title}-${theme.themeId}`}
                      onClick={() => update('theme', theme.themeId)}
                      className={`relative rounded-xl border p-2 text-left ${
                        isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`h-14 rounded-lg p-2 ${theme.previewClass}`}>
                        <div className={`h-1.5 w-2/3 rounded-full ${theme.accentClass}`} />
                        <div className="mt-2 h-1 w-1/2 rounded-full bg-white/70" />
                        <div className="mt-1 h-1 w-3/4 rounded-full bg-white/55" />
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-700">{theme.title}</div>
                      {isSelected ? (
                        <div className="absolute right-2 top-2 rounded-full bg-blue-600 p-1 text-white">
                          <FiCheck className="h-3 w-3" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-slate-500">Selected: {selectedTheme.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Image source</label>
                <select
                  value={settings.imageSource || 'ai'}
                  onChange={(event) => update('imageSource', event.target.value as PresentationSettings['imageSource'])}
                  title="Image source"
                  aria-label="Image source"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                >
                  <option value="ai">AI images</option>
                  <option value="stock">Stock images</option>
                  <option value="none">No images</option>
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI image model</label>
                <div className="relative">
                  <FiCpu className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <FiZap className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={settings.imageModel || 'none'}
                    onChange={(event) => update('imageModel', event.target.value as PresentationSettings['imageModel'])}
                    title="AI image model"
                    aria-label="AI image model"
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-9 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="none">Auto-select</option>
                    <option value="gpt-image-1.5">GPT Image 1.5</option>
                    <option value="dalle3">DALL-E 3</option>
                    <option value="gemini-flash">Gemini Flash</option>
                    <option value="pexels">Pexels</option>
                    <option value="pixabay">Pixabay</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Image art style</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {ART_STYLES.map((style) => {
                  const active = settings.imageArtStyle === style.value;
                  return (
                    <button
                      type="button"
                      key={style.value}
                      onClick={() => update('imageArtStyle', style.value)}
                      className={`min-w-[108px] rounded-xl border p-2 text-left ${
                        active ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`h-12 rounded-md ${style.previewClass}`} />
                      <div className="mt-1 text-xs font-medium text-slate-700">{style.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Keywords <span className="font-normal text-slate-400">Optional</span>
              </label>
              <input
                value={keywordDraft}
                onChange={(event) => setKeywordDraft(event.target.value)}
                onBlur={appendKeywordDraft}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    appendKeywordDraft();
                  }
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                placeholder="e.g. cinematic, matte texture"
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => {
                  const active = (settings.imageKeywords || []).includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleKeyword(tag)}
                      className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      + {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !canGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <FiLoader className="h-4 w-4 animate-spin" />
            Generating Slides...
          </>
        ) : (
          primaryLabel
        )}
      </button>
    </div>
  );
};
