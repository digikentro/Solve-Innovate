import React from 'react';
import './AnimatedBlob.css';

export function AnimatedBlob() {
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="0" height="0" className="absolute">
        <filter id="filmGrain">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="4" seed="42" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" result="desaturatedNoise" />
          <feComponentTransfer in="desaturatedNoise" result="grain">
            <feFuncA type="discrete" tableValues="0 0 0 1 1" />
          </feComponentTransfer>
        </filter>

        <filter id="edge-displacement">
          <feTurbulence type="fractalNoise" baseFrequency="1" numOctaves="1" />
          <feDisplacementMap in="SourceGraphic" scale="50" />
        </filter>

        <filter id="glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="50" result="blurred" />
          <feComponentTransfer in="blurred" result="brighterGlow">
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="brighterGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </svg>

      <div className="blob-wrapper scale-50 md:scale-75 lg:scale-100">
        <div className="blob blob-shape">
          <div className="grain-overlay"></div>
        </div>
      </div>
    </div>
  );
}
