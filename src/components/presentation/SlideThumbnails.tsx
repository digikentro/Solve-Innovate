import type { SlideData, Theme } from '@/types/presentation';
import { SlideRenderer } from './renderer/SlideRenderer';

interface SlideThumbnailsProps {
  slides: SlideData[];
  theme: Theme;
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  currentIndex: number;
  onSelect: (index: number) => void;
}

// Scale factor for thumbnails. SlideRenderer renders at 960px natural width
// then scales it down by this factor → 960 * 0.208 ≈ 200px wide (fits the w-56 sidebar)
const THUMBNAIL_SCALE = 0.208;

export const SlideThumbnails = ({
  slides,
  theme,
  logoUrl,
  logoPosition,
  currentIndex,
  onSelect,
}: SlideThumbnailsProps) => {
  return (
    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] no-scrollbar pr-1">
      {slides.map((slide, i) => (
        <button
          key={slide.id}
          onClick={() => onSelect(i)}
          className={`w-full text-left transition-all duration-200 rounded-xl overflow-hidden border-2 ${
            i === currentIndex
              ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-200'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
        >
          {/* SlideRenderer already handles the scaled wrapper at the right aspect ratio */}
          <div className="pointer-events-none">
            <SlideRenderer
              blocks={slide.blocks}
              theme={theme}
              logoUrl={logoUrl}
              logoPosition={logoPosition}
              role="thumbnail"
              className="rounded-none"
              scale={THUMBNAIL_SCALE}
            />
          </div>
          {/* Slide number badge */}
          <div
            className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold"
            style={{ backgroundColor: theme.colors.bg, color: theme.colors.primary }}
          >
            <span>Slide {i + 1}</span>
          </div>
        </button>
      ))}
    </div>
  );
};
