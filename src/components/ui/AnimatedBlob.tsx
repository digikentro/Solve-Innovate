import React, { useState, useEffect, useRef } from 'react';
import './AnimatedBlob.css';

const LOADING_MESSAGES = [
  'Brainstorming creative challenges...',
  'Scouting for innovation opportunities...',
  'Synthesizing insights from global experts...',
];

export function AnimatedBlob() {
  const [msgIdx, setMsgIdx] = useState(0);
  const blobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(idx => (idx + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleMouseEnter = () => {
    if (blobRef.current) {
      const animations = blobRef.current.getAnimations({ subtree: true });
      animations.forEach(anim => {
        anim.playbackRate = 4;
      });
    }
  };

  const handleMouseLeave = () => {
    if (blobRef.current) {
      const animations = blobRef.current.getAnimations({ subtree: true });
      animations.forEach(anim => {
        anim.playbackRate = 1;
      });
    }
  };

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

      <div 
        ref={blobRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="blob-wrapper scale-50 md:scale-75 lg:scale-100 cursor-pointer transition-transform duration-500 hover:scale-[1.05]"
      >
        <div className="blob blob-shape">
          <div className="grain-overlay"></div>
        </div>
      </div>

      <div className="text-xl font-medium text-gray-700 animate-pulse text-center mt-12 transition-all duration-500 min-h-[2em] max-w-md">
        {LOADING_MESSAGES[msgIdx]}
      </div>
    </div>
  );
}
