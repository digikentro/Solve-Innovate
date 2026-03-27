/**
 * usePresentationStream.ts
 *
 * Custom hook using the native EventSource API to stream slides via SSE.
 * Parses incoming slide events and converts markdown to blocks.
 */

import { useState, useCallback, useRef } from 'react';
import { getStreamUrl } from '@/services/presentationApi';
import { parseSlideMarkdown } from '@/utils/markdownParser';
import type { SlideData } from '@/types/presentation';

interface UsePresentationStreamReturn {
  slides: SlideData[];
  isStreaming: boolean;
  error: string | null;
  progress: string;
  startStream: (presentationId: string) => void;
  stopStream: () => void;
}

export function usePresentationStream(): UsePresentationStreamReturn {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    (presentationId: string) => {
      // Reset state
      setSlides([]);
      setError(null);
      setIsStreaming(true);
      setProgress('Starting generation…');

      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = getStreamUrl(presentationId);
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('response', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'slide': {
              const blocks = parseSlideMarkdown(data.markdown);
              const slideData: SlideData = {
                id: `slide-${data.index}`,
                index: data.index,
                markdown: data.markdown,
                blocks,
              };
              setSlides((prev) => [...prev, slideData]);
              setProgress(`${data.index + 1} slides generated`);
              break;
            }
            case 'progress':
              setProgress(data.message);
              break;
            case 'done':
              setProgress(`Complete — ${data.total_slides} slides`);
              stopStream();
              break;
            case 'error':
              setError(data.detail);
              stopStream();
              break;
          }
        } catch (e) {
          console.error('Failed to parse SSE event:', e);
        }
      });

      es.onerror = () => {
        // EventSource auto-reconnects, but if the server is done sending
        // it'll close the connection which triggers onerror.
        // Only set error if we haven't received a 'done' event.
        if (eventSourceRef.current === es) {
          stopStream();
        }
      };
    },
    [stopStream]
  );

  return { slides, isStreaming, error, progress, startStream, stopStream };
}
