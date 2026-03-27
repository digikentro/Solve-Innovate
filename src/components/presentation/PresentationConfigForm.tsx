import { THEMES } from '@/themes';
import type { PresentationSettings } from '@/types/presentation';
import { FiMonitor, FiLoader } from 'react-icons/fi';

interface PresentationConfigFormProps {
  settings: PresentationSettings;
  setSettings: React.Dispatch<React.SetStateAction<PresentationSettings>>;
  onGenerate: () => void;
  isGenerating: boolean;
  primaryLabel?: string;
}

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'academic', label: 'Academic' },
  { value: 'educational', label: 'Educational' },
  { value: 'sales_pitch', label: 'Sales Pitch' },
];

const VERBOSITY_OPTIONS = [
  { value: 'minimal', label: 'Minimal', desc: '≤3 bullets, headlines only, prefer charts' },
  { value: 'concise', label: 'Concise', desc: '≤5 bullets, one sentence each' },
  { value: 'standard', label: 'Standard', desc: 'Short paragraphs, all data points' },
  { value: 'text_heavy', label: 'Text Heavy', desc: 'Full explanations, sub-bullets, tables' },
] as const;

const TEXT_MODE_OPTIONS = [
  { value: 'generate', label: 'Generate', desc: 'Create new content, expand ideas' },
  { value: 'condense', label: 'Condense', desc: 'Summarize to key points only' },
  { value: 'preserve', label: 'Preserve', desc: 'Keep exact text, only format into slides' },
] as const;

const IMAGE_SOURCE_OPTIONS = [
  { value: 'ai', label: 'AI Generated' },
  { value: 'stock', label: 'Stock Photos' },
  { value: 'none', label: 'No Images' },
] as const;

export const PresentationConfigForm = ({
  settings,
  setSettings,
  onGenerate,
  isGenerating,
  primaryLabel = 'Generate Presentation',
}: PresentationConfigFormProps) => {
  const update = <K extends keyof PresentationSettings>(key: K, value: PresentationSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl shadow-lg p-6">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-white/10">
            <FiMonitor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Create Presentation</h2>
            <p className="text-sm text-indigo-100 mt-1">
              Generate a professional presentation from your project data. Configure settings below and click Generate.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 md:p-8 space-y-6">
        {/* Tone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tone</label>
          <select
            value={settings.tone}
            onChange={(e) => update('tone', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Target Slides</label>
          <input
            type="number"
            min={3}
            max={40}
            value={settings.nSlides}
            onChange={(e) => update('nSlides', Math.max(3, Math.min(40, Number(e.target.value) || 10)))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Verbosity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Content Density</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {VERBOSITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update('verbosity', opt.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                  settings.verbosity === opt.value
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`text-sm font-bold ${settings.verbosity === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {opt.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Text Mode */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Text Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TEXT_MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update('textMode', opt.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                  settings.textMode === opt.value
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`text-sm font-bold ${settings.textMode === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {opt.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
          <input
            type="text"
            value={settings.audience}
            onChange={(e) => update('audience', e.target.value)}
            placeholder="e.g., Investors, Students, Executives..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Image Source */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Image Source</label>
          <div className="flex gap-3">
            {IMAGE_SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update('imageSource', opt.value)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  settings.imageSource === opt.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Picker */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Theme</label>
          <div className="flex gap-3 flex-wrap">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => update('theme', theme.id)}
                className={`relative w-14 h-14 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                  settings.theme === theme.id
                    ? 'border-indigo-500 shadow-lg scale-110'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: theme.colors.bg }}
                title={theme.name}
              >
                {/* Primary color accent dot */}
                <div
                  className="absolute bottom-1 right-1 w-4 h-4 rounded-full border border-white/30"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                {settings.theme === theme.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-5 h-5" fill={theme.colors.primary} viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {THEMES.find((t) => t.id === settings.theme)?.name || 'Select a theme'}
          </p>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Additional Instructions <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={settings.instructions}
            onChange={(e) => update('instructions', e.target.value)}
            placeholder="Any specific instructions for the AI..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
        >
          {isGenerating ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              Generating Presentation...
            </>
          ) : (
            <>
              <FiMonitor className="w-5 h-5" />
              {primaryLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
