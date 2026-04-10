import React, { forwardRef } from 'react';
import type { SlideData, Theme, PresentationSettings } from '@/types/presentation';
import { SlideRenderer } from './renderer/SlideRenderer';

interface PrintablePresentationProps {
  slides: SlideData[];
  theme: Theme;
  settings: PresentationSettings;
}

export const PrintablePresentation = forwardRef<HTMLDivElement, PrintablePresentationProps>(
  ({ slides, theme, settings }, ref) => {
    return (
      <div ref={ref} className="hidden print:block w-[1056px]">
        <style type="text/css" media="print">{`
          @page { size: 1056px 594px; margin: 0; }
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .slide-page { page-break-after: always; height: 594px; width: 1056px; margin: 0; padding: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        `}</style>
        {slides.map((slide, i) => (
          <div key={slide.id || i} className="slide-page">
            <div className="w-[1056px] h-[594px] overflow-hidden relative">
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
                role="preview"
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
);
PrintablePresentation.displayName = 'PrintablePresentation';
