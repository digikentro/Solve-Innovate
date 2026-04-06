import { useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import ReactECharts from 'echarts-for-react';

import { LightweightWysiwyg } from '@/components/presentation/LightweightWysiwyg';
import type {
  SlideData,
  SpatialBlock,
  SpatialChartBlock,
  SpatialChartDataPoint,
  SpatialImageBlock,
  SpatialTextBlock,
  Theme,
} from '@/types/presentation';

interface SlideRendererProps {
  slide: SlideData;
  theme: Theme;
  className?: string;
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  role?: 'viewer' | 'thumbnail' | 'measure';
  selectedBlockIds?: string[];
  onSelectBlocks?: (ids: string[]) => void;
  onSlideChange?: (nextSlide: SlideData) => void;
  onBlockSelect?: (blockId: string | null) => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
};

const getNormalizedPosition = (
  block: SpatialBlock,
  fallbackIndex: number
): { x: number; y: number; width: number; height: number } => {
  const position = (block as any).position || {};
  const width = clamp(toFiniteNumber(position.width, 80), 4, 100);
  const height = clamp(toFiniteNumber(position.height, 18), 4, 100);
  const x = clamp(toFiniteNumber(position.x, 10), 0, 100 - width);
  const y = clamp(toFiniteNumber(position.y, 8 + fallbackIndex * 6), 0, 100 - height);
  return { x, y, width, height };
};

const pxToPercent = (px: number, total: number): number => {
  if (!total) return 0;
  return (px / total) * 100;
};

const toChartPoints = (raw: unknown): SpatialChartDataPoint[] => {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        const point = item as Record<string, unknown>;
        const label = typeof point.label === 'string' ? point.label : '';
        const value = typeof point.value === 'number' ? point.value : Number(point.value || 0);
        return { label: label || 'Item', value: Number.isFinite(value) ? value : 0 };
      })
      .filter((point) => point.label.trim().length > 0);
  }
  if (raw && typeof raw === 'object') {
    const candidate = raw as { headers?: unknown; rows?: unknown };
    if (Array.isArray(candidate.rows)) {
      return candidate.rows
        .map((row) => {
          if (!Array.isArray(row) || row.length < 2) return null;
          const label = String(row[0] ?? 'Item');
          const value = Number(row[1] ?? 0);
          return { label, value: Number.isFinite(value) ? value : 0 };
        })
        .filter((point): point is SpatialChartDataPoint => Boolean(point));
    }
  }
  return [];
};

const buildChartOption = (block: SpatialChartBlock, primary: string) => {
  const points = toChartPoints((block as unknown as { data?: unknown }).data);
  const labels = points.map((p: SpatialChartDataPoint) => p.label);
  const values = points.map((p: SpatialChartDataPoint) => p.value);

  if (block.chart_type === 'pie' || block.chart_type === 'donut') {
    return {
      animation: false,
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: block.chart_type === 'donut' ? ['45%', '70%'] : '70%',
        data: points.map((p) => ({ value: p.value, name: p.label })),
        itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
      }],
    };
  }
  if (block.chart_type === 'line' || block.chart_type === 'area') {
    return {
      animation: false,
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [{
        data: values,
        type: 'line',
        areaStyle: block.chart_type === 'area' ? {} : undefined,
        smooth: true,
        lineStyle: { width: 3, color: block.color || primary },
        itemStyle: { color: block.color || primary },
      }],
      grid: { left: 32, right: 16, top: 24, bottom: 28 },
    };
  }
  return {
    animation: false,
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value' },
    series: [{
      data: values,
      type: 'bar',
      itemStyle: { color: block.color || primary, borderRadius: [8, 8, 0, 0] },
    }],
    grid: { left: 32, right: 16, top: 24, bottom: 28 },
  };
};

// ─── Resize Handle ──────────────────────────────────────────────────────────

type ResizeHandleDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface ResizeHandleDivProps {
  direction: ResizeHandleDirection;
  blockPosition: { x: number; y: number; width: number; height: number };
  stageRef: React.RefObject<HTMLDivElement | null>;
  isInteractive: boolean;
  onSizeChange: (pos: { x: number; y: number; width: number; height: number }) => void;
  onDragStateChange: (dragging: boolean) => void;
  style: React.CSSProperties;
  className: string;
}

const ResizeHandleDiv = ({
  direction,
  blockPosition,
  stageRef,
  isInteractive,
  onSizeChange,
  onDragStateChange,
  style,
  className,
}: ResizeHandleDivProps) => {
  const resizeStartPos = useRef({ ...blockPosition });

  const bind = useDrag(
    ({ first, last, movement: [mx, my], event }) => {
      if (!isInteractive) return;
      event?.stopPropagation();
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (first) {
        resizeStartPos.current = { ...blockPosition };
        onDragStateChange(true);
      }
      if (last) {
        onDragStateChange(false);
        return;
      }

      const dxPct = (mx / rect.width) * 100;
      const dyPct = (my / rect.height) * 100;
      const start = resizeStartPos.current;

      let newX = start.x;
      let newY = start.y;
      let newWidth = start.width;
      let newHeight = start.height;

      if (direction.includes('e')) {
        newWidth = clamp(start.width + dxPct, 4, 100 - start.x);
      }
      if (direction.includes('w')) {
        const maxDx = start.width - 4;
        const actualDx = clamp(dxPct, -start.x, maxDx);
        newX = start.x + actualDx;
        newWidth = start.width - actualDx;
      }
      if (direction.includes('s')) {
        newHeight = clamp(start.height + dyPct, 4, 100 - start.y);
      }
      if (direction.includes('n')) {
        const maxDy = start.height - 4;
        const actualDy = clamp(dyPct, -start.y, maxDy);
        newY = start.y + actualDy;
        newHeight = start.height - actualDy;
      }

      onSizeChange({ x: newX, y: newY, width: newWidth, height: newHeight });
    },
    {
      filterTaps: true,
      threshold: 2,
      pointer: { keys: false },
      from: () => [0, 0],
    }
  );

  return (
    <div
      {...bind()}
      className={className}
      style={{ ...style, touchAction: 'none' }}
    />
  );
};

// ─── Draggable Block ─────────────────────────────────────────────────────────

interface DraggableBlockProps {
  block: SpatialBlock;
  blockIndex: number;
  theme: Theme;
  stageRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  isEditing: boolean;
  isInteractive: boolean;
  isDragging: boolean;
  onSelect: (blockId: string, shiftKey: boolean) => void;
  onBlockSelect: (blockId: string | null) => void;
  onPositionChange: (blockId: string, x: number, y: number) => void;
  onSizeChange: (blockId: string, position: { x: number; y: number; width: number; height: number }) => void;
  onDoubleClick: (blockId: string) => void;
  onTextChange: (value: string) => void;
  onTextBlur: () => void;
  onChartRef: (instance: ReactECharts | null) => void;
  onDragStateChange: (dragging: boolean) => void;
}

const DraggableBlock = ({
  block,
  blockIndex,
  theme,
  stageRef,
  isSelected,
  isEditing,
  isInteractive,
  isDragging,
  onSelect,
  onBlockSelect,
  onPositionChange,
  onSizeChange,
  onDoubleClick,
  onTextChange,
  onTextBlur,
  onChartRef,
  onDragStateChange,
}: DraggableBlockProps) => {
  const position = getNormalizedPosition(block, blockIndex);
  const dragStartPos = useRef({ x: position.x, y: position.y });

  const bind = useDrag(
    ({ first, last, movement: [mx, my], event }) => {
      // Don't drag while editing text
      if (!isInteractive || isEditing) return;
      event?.stopPropagation();
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (first) {
        dragStartPos.current = { x: position.x, y: position.y };
        onDragStateChange(true);
      }
      if (last) {
        onDragStateChange(false);
        return;
      }

      const dxPct = (mx / rect.width) * 100;
      const dyPct = (my / rect.height) * 100;
      const newX = clamp(dragStartPos.current.x + dxPct, 0, 100 - position.width);
      const newY = clamp(dragStartPos.current.y + dyPct, 0, 100 - position.height);
      onPositionChange(block.id, newX, newY);
    },
    {
      filterTaps: true,
      threshold: 3,
      pointer: { keys: false },
      from: () => [0, 0],
    }
  );

  const HANDLE_SIZE = 8;
  const HANDLE_OFFSET = -HANDLE_SIZE / 2;

  const handleSharedProps = {
    blockPosition: position,
    stageRef,
    isInteractive,
    onSizeChange: (pos: { x: number; y: number; width: number; height: number }) =>
      onSizeChange(block.id, pos),
    onDragStateChange,
  };

  const handleBase = 'absolute bg-white border-2 border-sky-500 rounded-sm z-20';

  return (
    <div
      {...bind()}
      data-block-id={block.id}
      className={`canvas-block absolute rounded-lg transition-shadow ${
        isSelected ? 'ring-2 ring-sky-500 shadow-lg' : ''
      } ${isInteractive && !isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        // left/top % are relative to the parent (stage) — correct for our position system
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
        zIndex: block.z_index ?? 0,
        transform: `rotate(${block.rotation || 0}deg)`,
        transformOrigin: 'center',
        border: isInteractive ? '1px dashed rgba(71,85,105,0.25)' : 'none',
        background: block.type === 'text' ? 'rgba(255,255,255,0.06)' : 'transparent',
        // overflow:visible when selected so resize handles render outside bounds,
        // and when editing so the Tiptap editor is not clipped
        overflow: isSelected || isEditing ? 'visible' : 'hidden',
        touchAction: 'none',
      }}
      onMouseDown={(e) => {
        if (!isInteractive) return;
        e.stopPropagation();
        onBlockSelect(block.id);
        onSelect(block.id, e.shiftKey);
      }}
      onDoubleClick={() => {
        if (block.type === 'text' && isInteractive) {
          onDoubleClick(block.id);
        }
      }}
    >
      <BlockBody
        block={block}
        theme={theme}
        isDragging={isDragging}
        isEditing={isEditing}
        onTextChange={onTextChange}
        onTextBlur={onTextBlur}
        onChartRef={onChartRef}
      />

      {/* Resize handles — only when selected and not editing text */}
      {isSelected && isInteractive && !isEditing && (
        <>
          <ResizeHandleDiv
            {...handleSharedProps}
            direction="n"
            className={`${handleBase} cursor-n-resize`}
            style={{ left: '50%', top: HANDLE_OFFSET, width: HANDLE_SIZE, height: HANDLE_SIZE, transform: 'translateX(-50%)' }}
          />
          <ResizeHandleDiv
            {...handleSharedProps}
            direction="s"
            className={`${handleBase} cursor-s-resize`}
            style={{ left: '50%', bottom: HANDLE_OFFSET, width: HANDLE_SIZE, height: HANDLE_SIZE, transform: 'translateX(-50%)' }}
          />
          <ResizeHandleDiv
            {...handleSharedProps}
            direction="e"
            className={`${handleBase} cursor-e-resize`}
            style={{ right: HANDLE_OFFSET, top: '50%', width: HANDLE_SIZE, height: HANDLE_SIZE, transform: 'translateY(-50%)' }}
          />
          <ResizeHandleDiv
            {...handleSharedProps}
            direction="w"
            className={`${handleBase} cursor-w-resize`}
            style={{ left: HANDLE_OFFSET, top: '50%', width: HANDLE_SIZE, height: HANDLE_SIZE, transform: 'translateY(-50%)' }}
          />
          <ResizeHandleDiv
            {...handleSharedProps}
            direction="ne"
            className={`${handleBase} cursor-ne-resize`}
            style={{ right: HANDLE_OFFSET, top: HANDLE_OFFSET, width: HANDLE_SIZE, height: HANDLE_SIZE }}
          />
          <ResizeHandleDiv
            {...handleSharedProps}
            direction="nw"
            className={`${handleBase} cursor-nw-resize`}
            style={{ left: HANDLE_OFFSET, top: HANDLE_OFFSET, width: HANDLE_SIZE, height: HANDLE_SIZE }}
          />
          <ResizeHandleDiv
            {...handleSharedProps}
            direction="se"
            className={`${handleBase} cursor-se-resize`}
            style={{ right: HANDLE_OFFSET, bottom: HANDLE_OFFSET, width: HANDLE_SIZE, height: HANDLE_SIZE }}
          />
          <ResizeHandleDiv
            {...handleSharedProps}
            direction="sw"
            className={`${handleBase} cursor-sw-resize`}
            style={{ left: HANDLE_OFFSET, bottom: HANDLE_OFFSET, width: HANDLE_SIZE, height: HANDLE_SIZE }}
          />
        </>
      )}
    </div>
  );
};

// ─── Slide Renderer ──────────────────────────────────────────────────────────

export const SlideRenderer = ({
  slide,
  theme,
  className = '',
  logoUrl,
  logoPosition = 'top-right',
  role = 'viewer',
  selectedBlockIds = [],
  onSelectBlocks,
  onSlideChange,
  onBlockSelect,
}: SlideRendererProps) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const chartRefs = useRef<Map<string, ReactECharts>>(new Map());

  const [editingTextBlockId, setEditingTextBlockId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isInteractive = role === 'viewer' && !!onSlideChange;
  const slideBlocks = Array.isArray(slide.blocks) ? slide.blocks : [];

  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver(() => {
      chartRefs.current.forEach((chart) => {
        chart.getEchartsInstance().resize();
      });
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const commitBlocks = (updater: (blocks: SpatialBlock[]) => SpatialBlock[]) => {
    if (!onSlideChange) return;
    onSlideChange({ ...slide, blocks: updater(slideBlocks) });
  };

  const updateBlock = (blockId: string, updater: (block: SpatialBlock) => SpatialBlock) => {
    commitBlocks((blocks) =>
      blocks.map((block) => (block.id === blockId ? updater(block) : block))
    );
  };

  const handlePositionChange = (blockId: string, x: number, y: number) => {
    updateBlock(blockId, (block) => ({
      ...block,
      position: { ...getNormalizedPosition(block, 0), x, y },
    }));
  };

  const handleSizeChange = (
    blockId: string,
    position: { x: number; y: number; width: number; height: number }
  ) => {
    updateBlock(blockId, (block) => ({ ...block, position }));
  };

  const handleSelect = (blockId: string, shiftKey: boolean) => {
    if (!onSelectBlocks) return;
    const isSelected = selectedBlockIds.includes(blockId);
    if (shiftKey) {
      const next = isSelected
        ? selectedBlockIds.filter((id) => id !== blockId)
        : [...selectedBlockIds, blockId];
      onSelectBlocks(next);
    } else {
      onSelectBlocks([blockId]);
    }
  };

  const logoStyle: Record<string, string> = {
    top: logoPosition.startsWith('top') ? '2%' : 'auto',
    left: logoPosition.endsWith('left') ? '2%' : 'auto',
    right: logoPosition.endsWith('right') ? '2%' : 'auto',
    bottom: logoPosition.startsWith('bottom') ? '2%' : 'auto',
  };

  return (
    <div className={`relative w-full aspect-video rounded-2xl overflow-hidden ${className}`}>
      <div
        ref={stageRef}
        className="relative h-full w-full"
        style={{
          background: theme.colors.bg,
          color: theme.colors.text,
          fontFamily: theme.fonts.body,
        }}
        onMouseDown={() => {
          if (isInteractive && onSelectBlocks) {
            onSelectBlocks([]);
            onBlockSelect?.(null);
            setEditingTextBlockId(null);
          }
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="absolute h-[8%] w-[8%] object-contain z-[999]"
            style={logoStyle}
          />
        ) : null}

        {slideBlocks.map((block, blockIndex) => {
          const isSelected = selectedBlockIds.includes(block.id);
          const isEditing = editingTextBlockId === block.id;

          return (
            <DraggableBlock
              key={block.id}
              block={block}
              blockIndex={blockIndex}
              theme={theme}
              stageRef={stageRef}
              isSelected={isSelected}
              isEditing={isEditing}
              isInteractive={isInteractive}
              isDragging={isDragging}
              onSelect={handleSelect}
              onBlockSelect={(id) => onBlockSelect?.(id)}
              onPositionChange={handlePositionChange}
              onSizeChange={handleSizeChange}
              onDoubleClick={(id) => setEditingTextBlockId(id)}
              onTextChange={(value) => {
                updateBlock(block.id, (target) => ({
                  ...(target as SpatialTextBlock),
                  content: value,
                }));
              }}
              onTextBlur={() => setEditingTextBlockId(null)}
              onChartRef={(instance) => {
                if (instance) {
                  chartRefs.current.set(block.id, instance);
                } else {
                  chartRefs.current.delete(block.id);
                }
              }}
              onDragStateChange={setIsDragging}
            />
          );
        })}
      </div>
    </div>
  );
};

// ─── Block Body ───────────────────────────────────────────────────────────────

interface BlockBodyProps {
  block: SpatialBlock;
  theme: Theme;
  isDragging: boolean;
  isEditing: boolean;
  onTextChange: (value: string) => void;
  onTextBlur: () => void;
  onChartRef: (instance: ReactECharts | null) => void;
}

const BlockBody = ({
  block,
  theme,
  isDragging,
  isEditing,
  onTextChange,
  onTextBlur,
  onChartRef,
}: BlockBodyProps) => {
  if (block.type === 'text') {
    const textStyle: React.CSSProperties = {
      textAlign: block.style?.align || 'left',
      color: block.style?.color || theme.colors.text,
      fontWeight: block.style?.emphasis === 'strong' ? 700 : 400,
      fontSize: block.style?.font_size
        ? `${block.style.font_size}px`
        : 'clamp(12px, 1.2vw, 26px)',
    };

    if (isEditing) {
      return (
        // Wrapper applies the same visual style as the non-editing view,
        // so the editor feels truly inline (Canva-style)
        <div className="h-full w-full" style={textStyle}>
          <LightweightWysiwyg
            value={block.content}
            onChange={onTextChange}
            placeholder="Type here..."
            minHeight={20}
            compact
            transparent
            readOnly={isDragging}
            onBlur={onTextBlur}
          />
        </div>
      );
    }

    return (
      <div
        className="h-full w-full px-3 py-2 whitespace-pre-wrap overflow-hidden"
        style={textStyle}
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
    );
  }

  if (block.type === 'image') {
    const imageSrc = block.prompt || '';
    return (
      <div className="h-full w-full bg-white/10 rounded-md overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={block.caption || 'Slide image'}
            className="h-full w-full"
            style={{ objectFit: (block.object_fit || 'cover') as 'cover' | 'contain' }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm opacity-80">
            Image
          </div>
        )}
      </div>
    );
  }

  const chartOption = buildChartOption(block, theme.colors.primary);
  return (
    <div className="h-full w-full rounded-md bg-white/80">
      <ReactECharts
        ref={onChartRef}
        option={chartOption}
        notMerge
        lazyUpdate
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
