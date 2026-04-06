import type { SlideData, Theme } from '@/types/presentation';
import { SlideRenderer } from './renderer/SlideRenderer';
import { FiLoader } from 'react-icons/fi';

interface PresentationStreamViewProps {
  slides: SlideData[];
  theme: Theme;
  progress: string;
  isStreaming: boolean;
}

export const PresentationStreamView = ({
  slides,
  theme,
  progress,
  isStreaming,
}: PresentationStreamViewProps) => {
  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center gap-3">
          {isStreaming && <FiLoader className="w-5 h-5 text-indigo-500 animate-spin" />}
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isStreaming ? 'Generating Your Presentation...' : 'Generation Complete!'}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{progress}</p>
          </div>
        </div>
        {/* Progress bar */}
        {isStreaming && (
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: slides.length > 0 ? `${Math.min((slides.length / 10) * 100, 95)}%` : '5%' }}
            />
          </div>
        )}
      </div>

      {/* Streaming Slides */}
      <div className="grid gap-6">
        {slides.map((slide) => (
          <div key={slide.id} className="animate-fadeIn">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-2">
                <SlideRenderer slide={slide} theme={theme} className="rounded-2xl" role="thumbnail" />
              </div>
              <div className="px-4 py-2 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-medium">
                  Slide
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
