import React, { forwardRef } from 'react';
import type { SlideData, Theme, PresentationSettings } from '@/types/presentation';
import { SlideRenderer, SLIDE_REFERENCE_WIDTH, SLIDE_REFERENCE_HEIGHT } from './renderer/SlideRenderer';

interface PrintablePresentationProps {
  slides: SlideData[];
  theme: Theme;
  settings: PresentationSettings;
}

// Print scale: 1056×594 (standard 16:9 @ 96dpi) mapped to our 960×540 reference.
const PRINT_WIDTH = 1056;
const PRINT_HEIGHT = 594;
const PRINT_SCALE = PRINT_WIDTH / SLIDE_REFERENCE_WIDTH; // ≈ 1.1

export const PrintablePresentation = forwardRef<HTMLDivElement, PrintablePresentationProps>(
  ({ slides, theme, settings }, ref) => {
    return (
      <div ref={ref} className="hidden print:block" style={{ width: PRINT_WIDTH }}>
        <style type="text/css" media="print">{`
          @page { size: ${PRINT_WIDTH}px ${PRINT_HEIGHT}px; margin: 0; }
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .slide-page { page-break-after: always; height: ${PRINT_HEIGHT}px; width: ${PRINT_WIDTH}px; margin: 0; padding: 0; overflow: hidden; }
        `}</style>
        {slides.map((slide, i) => (
          <div key={slide.id || i} className="slide-page" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Scale the reference canvas (960×540) up to print size (1056×594) */}
            <div
              style={{
                width: SLIDE_REFERENCE_WIDTH,
                height: SLIDE_REFERENCE_HEIGHT,
                transform: `scale(${PRINT_SCALE})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <SlideRenderer
                slide={slide}
                theme={{
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary: settings.customColors?.primary || theme.colors.primary,
                    accent: settings.customColors?.accent || theme.colors.accent,
                    bg: settings.customColors?.background || theme.colors.bg,
                    text: settings.customColors?.text || theme.colors.text,
                  },
                }}
                logoUrl={settings.logoUrl || undefined}
                logoPosition={settings.logoPosition}
                role="measure"
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
);
PrintablePresentation.displayName = 'PrintablePresentation';
