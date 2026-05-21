import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiPlus } from 'react-icons/fi';

import type { SlideData, Theme } from '@/types/presentation';
import { SlideRenderer } from './renderer/SlideRenderer';

interface SlideThumbnailsProps {
  slides: SlideData[];
  theme: Theme;
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  currentIndex: number;
  onSelect: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onAddSlide: () => void;
}

interface SortableThumbProps {
  id: string;
  slide: SlideData;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  theme: Theme;
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const SortableThumb = ({
  id,
  slide,
  index,
  isActive,
  onSelect,
  theme,
  logoUrl,
  logoPosition,
}: SortableThumbProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <button
      ref={setNodeRef}
      onClick={() => onSelect(index)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className={`w-full text-left rounded-xl border bg-white overflow-hidden ${
        isActive ? 'border-sky-500 shadow-md' : 'border-slate-200'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="pointer-events-none p-2">
        <SlideRenderer
          slide={slide}
          theme={theme}
          logoUrl={logoUrl}
          logoPosition={logoPosition}
          role="thumbnail"
          className="rounded-lg border border-slate-200"
        />
      </div>
      <div className="px-2 pb-2 text-[11px] text-slate-600 font-medium">Slide {index + 1}</div>
    </button>
  );
};

export const SlideThumbnails = ({
  slides,
  theme,
  logoUrl,
  logoPosition,
  currentIndex,
  onSelect,
  onReorder,
  onAddSlide,
}: SlideThumbnailsProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const ids = slides.map((slide) => slide.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    onReorder(oldIndex, newIndex);
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            {slides.map((slide, index) => (
              <SortableThumb
                key={slide.id}
                id={slide.id}
                slide={slide}
                index={index}
                isActive={index === currentIndex}
                onSelect={onSelect}
                theme={theme}
                logoUrl={logoUrl}
                logoPosition={logoPosition}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <button
        onClick={onAddSlide}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-700 hover:border-sky-400 hover:text-sky-700"
      >
        <FiPlus className="h-4 w-4" />
        Add New Slide
      </button>
    </div>
  );
};
