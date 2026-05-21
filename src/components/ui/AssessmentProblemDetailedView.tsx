import React from 'react';
import ReactDOM from 'react-dom';
import { Button } from './button';
import { IOSAssessmentCard } from './IOSAssessmentCard';
import { useRef, useEffect, useState, useLayoutEffect } from 'react';

interface AssessmentProblemDetailedViewProps {
  open: boolean;
  onClose: () => void;
  assessment: any;
  problemTitle: string;
  generatedAt?: Date;
  viewType: 'problem' | 'assessment';
}

export const AssessmentProblemDetailedView: React.FC<AssessmentProblemDetailedViewProps> = ({
  open,
  onClose,
  assessment,
  problemTitle,
  generatedAt,
  viewType
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(1);
  const [clientHeight, setClientHeight] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartScroll, setDragStartScroll] = useState(0);

  const updateSizes = () => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
      setScrollHeight(scrollRef.current.scrollHeight);
      setClientHeight(scrollRef.current.clientHeight);
    }
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateSizes();
    const ro = new window.ResizeObserver(updateSizes);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => {
      ro.disconnect();
    };
  }, [open, assessment, problemTitle, generatedAt]);

  // Drag logic
  useEffect(() => {
    if (!dragging) return;
    // Prevent text selection while dragging
    const oldUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    const onMove = (e: MouseEvent) => {
      if (!scrollRef.current) return;
      const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 40);
      const maxScroll = scrollHeight - clientHeight;
      const maxThumbMove = clientHeight - thumbHeight;
      const deltaY = e.clientY - dragStartY;
      const ratio = maxScroll / maxThumbMove;
      scrollRef.current.scrollTop = dragStartScroll + deltaY * ratio;
    };
    const onUp = () => {
      setDragging(false);
      document.body.style.userSelect = oldUserSelect;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = oldUserSelect;
    };
  }, [dragging, dragStartY, dragStartScroll, scrollHeight, clientHeight]);

  if (!open) return null;

  const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 40);
  const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbHeight) || 0;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      {/* Modal and custom scrollbar as siblings */}
      <div className="relative flex items-center">
        <div className="bg-white rounded-md max-w-3xl w-full max-h-[90vh] overflow-hidden relative">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {viewType === 'problem' ? 'Problem Detailed View' : 'Assessment Detailed View'}
              </h3>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div className="relative flex">
              <div
                ref={scrollRef}
                className="overflow-y-auto hide-scrollbar pr-4"
                style={{ maxHeight: '75vh', width: '100%' }}
                onScroll={updateSizes}
              >
                <IOSAssessmentCard
                  assessment={assessment}
                  problemTitle={problemTitle}
                  generatedAt={generatedAt}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Custom Scrollbar OUTSIDE the modal */}
        <div
          className="ml-2 flex items-center"
          style={{ height: clientHeight, width: 36, pointerEvents: 'auto' }}
        >
          <div
            className="relative mx-auto"
            style={{ height: clientHeight, width: 20, background: 'transparent', borderRadius: 12 }}
          >
            <div
              className="absolute left-0"
              style={{
                top: thumbTop,
                width: 20,
                height: thumbHeight,
                borderRadius: 9999,
                background: dragging ? 'rgba(255,255,255,0.5)' : 'rgb(255,255,255)',
                opacity: dragging ? 0.95 : 0.7,
                border: dragging ? '1.5px solid rgba(255,255,255,0.5)' : '1.5px solid #fff',
                cursor: 'pointer',
                transition: 'background 0.2s, box-shadow 0.2s, border 0.2s, opacity 0.2s',
                zIndex: 2,
              }}
              onMouseDown={e => {
                setDragging(true);
                setDragStartY(e.clientY);
                setDragStartScroll(scrollTop);
              }}
            >
              {/* No inner circle, just the pill thumb */}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}; 