import React, { useState, useEffect } from 'react';
import type { MarkdownBlock } from '@/types/presentation';
import type { Theme } from '@/types/presentation';
import { BlockRenderer } from './BlockRenderer';
import { TiptapInlineEditor } from './TiptapInlineEditor';
import { editorHtmlToMarkdown, richMarkdownToBlockValue, blockToRichHtml } from '@/utils/slideEditor';

interface SlideRendererProps {
  blocks: MarkdownBlock[];
  theme: Theme;
  className?: string;
  scale?: number;
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  role?: 'viewer' | 'thumbnail' | 'measure';
  // Inline editing callbacks
  dragIndex?: number | null;
  setDragIndex?: (index: number | null) => void;
  onBlockUpdate?: (index: number, newBlock: MarkdownBlock) => void;
  onBlockDelete?: (index: number) => void;
  onBlockReorder?: (from: number, to: number) => void;
  onBlockAdd?: (index: number, type: 'text' | 'image' | 'chart') => void;
}

export const SlideRenderer = ({
  blocks,
  theme,
  className = '',
  scale,
  logoUrl,
  logoPosition = 'top-right',
  role,
  dragIndex,
  setDragIndex,
  onBlockUpdate,
  onBlockDelete,
  onBlockReorder,
  onBlockAdd,
}: SlideRendererProps) => {
  const logoStyle: React.CSSProperties = (() => {
    switch (logoPosition) {
      case 'top-left':
        return { float: 'left', margin: '0 1rem 1rem 0' };
      case 'bottom-left':
        // using clear to try pushing it down can be tricky, typically floats stay at top.
        // We will default to float: left
        return { float: 'left', margin: '0 1rem 1rem 0' };
      case 'bottom-right':
        return { float: 'right', margin: '0 0 1rem 1rem' };
      default:
        return { float: 'right', margin: '0 0 1rem 1rem' };
    }
  })();

  return (
    <div
      data-slide-container="true"
      data-slide-role={role}
      className={`slide-container relative overflow-hidden ${className}`}
      style={{
        '--primary-color': theme.colors.primary,
        '--background-color': theme.colors.bg,
        '--text-color': theme.colors.text,
        '--subtext-color': theme.colors.subtext,
        '--heading-font': theme.fonts.heading,
        '--body-font': theme.fonts.body,
        backgroundColor: theme.colors.bg,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        aspectRatio: '16 / 9',
        padding: scale ? `${2 * (scale || 1)}rem` : '2.5rem 3rem',
        transform: scale ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      } as React.CSSProperties}
    >
      <div data-slide-content="true" className="h-full overflow-hidden relative">
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Logo"
            className="w-14 h-14 object-contain opacity-90 relative z-10"
            style={{ ...logoStyle, shapeOutside: 'margin-box' }}
          />
        )}
        {blocks.map((block, i) => {
          const isEditable = role === 'viewer' && onBlockUpdate;

          if (!isEditable) {
            return (
              <div key={i} className="mb-4">
                <BlockRenderer block={block} />
              </div>
            );
          }

          // In viewer mode with callbacks, wrap with EditableBlock
          return (
            <EditableBlock
              key={`${block.type}-${i}`}
              index={i}
              block={block}
              dragIndex={dragIndex ?? null}
              setDragIndex={setDragIndex}
              onUpdate={(newBlock) => onBlockUpdate?.(i, newBlock)}
              onDelete={() => onBlockDelete?.(i)}
              onReorder={(to) => onBlockReorder?.(dragIndex ?? i, to)}
              onAdd={(type) => onBlockAdd?.(i, type)}
            />
          );
        })}
      </div>
    </div>
  );
};

// ─── Inline Editable Block Wrapper ──────────────────────────────────────────

const EditableBlock = ({
  index,
  block,
  dragIndex,
  setDragIndex,
  onUpdate,
  onDelete,
  onReorder,
  onAdd,
}: {
  index: number;
  block: MarkdownBlock;
  dragIndex: number | null;
  setDragIndex?: (idx: number | null) => void;
  onUpdate: (b: MarkdownBlock) => void;
  onDelete: () => void;
  onReorder: (to: number) => void;
  onAdd: (type: 'text' | 'image' | 'chart') => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  
  // Custom states for images and charts
  const [imgPrompt, setImgPrompt] = useState(block.type === 'image' && block.src.startsWith('image:') ? block.src.slice(6) : '');
  const [chartDataStr, setChartDataStr] = useState(block.type === 'chart' ? JSON.stringify(block.data, null, 2) : '');

  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  const isDraggable = setDragIndex !== undefined;
  const isDraggingOver = dragIndex !== null && dragIndex !== index;

  useEffect(() => {
    if (isEditing) {
      if (['paragraph', 'heading', 'bullet_list', 'numbered_list', 'quote'].includes(block.type)) {
        setEditValue(blockToRichHtml(block));
      } else {
        setEditValue(blockTextValue(block));
      }
    }
  }, [isEditing, block]);

  const handleTextSave = (htmlContent: string) => {
    try {
      const markdown = editorHtmlToMarkdown(htmlContent);
      const newBlock = richMarkdownToBlockValue(block, markdown);
      onUpdate(newBlock);
    } catch {
      // fallback if parsing fails
      onUpdate(patchBlockText(block, htmlContent.replace(/<[^>]*>?/gm, '')));
    }
    setIsEditing(false);
  };

  const handleImageUpdate = async () => {
    if (!imgPrompt.trim()) return;
    setIsGeneratingImg(true);
    try {
      const qs = new URLSearchParams({ prompt: imgPrompt.trim() });
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/v1/images/generate?${qs}`);
      if (!res.ok) throw new Error("API responded with an error");
      let data = await res.json();
      let pathStr = typeof data === 'string' ? data : (data.path || data.url || '');
      
      let finalUrl = pathStr;
      if (pathStr && !pathStr.startsWith('http')) {
          // Normalize Windows paths and extract relative path assuming server mounts assets, or if it isn't mounted, at least try
          const relPath = pathStr.replace(/\\/g, '/').split('/assets/').pop();
          finalUrl = `${apiBase}/assets/${relPath}`;
      }
      onUpdate({ ...block, type: 'image', src: finalUrl, alt: imgPrompt } as any);
      setIsEditing(false);
    } catch (err) {
      alert("Failed to generate image: " + err);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleChartUpdate = () => {
    try {
      const parsedData = JSON.parse(chartDataStr);
      onUpdate({ ...block, type: 'chart', data: parsedData } as any);
      setIsEditing(false);
    } catch {
      alert("Invalid JSON data for chart.");
    }
  };

  const isTextLike = ['paragraph', 'heading', 'bullet_list', 'numbered_list', 'quote'].includes(block.type);

  return (
    <div
      draggable={isDraggable && !isEditing}
      onDragStart={(e) => {
        if (!isEditing && setDragIndex) setDragIndex(index);
      }}
      onDragOver={(e) => {
        if (isDraggingOver) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onReorder(index);
      }}
      onDragEnd={() => {
        if (setDragIndex) setDragIndex(null);
      }}
      className={`group relative mb-2 transition-all p-1 border-2 min-w-[150px]
        ${isEditing ? 'border-indigo-400 border-dashed bg-white/5 shadow-sm' : 'border-transparent hover:border-blue-400 hover:border-dashed'}
        ${!isEditing && 'resize-x overflow-auto' /* allow resizing horizontal when not actively editing text */}
      `}
      style={!isEditing ? { resize: 'horizontal', overflow: 'visible', maxWidth: '100%' } : {}}
      onDoubleClick={() => { if (!isEditing) setIsEditing(true); }}
    >
      {!isEditing && (
        <div className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-xl border rounded-lg flex items-center p-0.5 gap-0.5 z-50">
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 text-[10px] uppercase font-bold text-indigo-700 hover:bg-indigo-50 rounded"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1 text-[10px] uppercase font-bold text-red-600 hover:bg-red-50 rounded"
          >
            Del
          </button>
        </div>
      )}

      {!isEditing && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-xl border rounded-lg flex items-center p-0.5 z-50">
          <button onClick={() => onAdd('text')} className="px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-100 rounded">+ Text</button>
          <button onClick={() => onAdd('image')} className="px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-100 rounded">+ Image</button>
          <button onClick={() => onAdd('chart')} className="px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-100 rounded">+ Chart</button>
        </div>
      )}

      {isEditing ? (
        <div className="relative">
          {isTextLike ? (
            <TiptapInlineEditor 
              value={editValue} 
              onChange={setEditValue} 
              onBlur={() => handleTextSave(editValue)}
              className="w-full text-base md:text-lg"
            />
          ) : block.type === 'image' ? (
            <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border p-3 flex flex-col gap-2">
              <span className="text-xs font-semibold text-gray-600">AI Image Assignment</span>
              <input 
                 value={imgPrompt} 
                 onChange={e => setImgPrompt(e.target.value)} 
                 placeholder="Describe the image you want here..."
                 className="w-fulltext-sm p-2 border rounded focus:ring-1 focus:ring-indigo-500 outline-none text-black bg-white"
                 autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded" disabled={isGeneratingImg}>Cancel</button>
                <button onClick={handleImageUpdate} disabled={isGeneratingImg} className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium disabled:opacity-50">
                   {isGeneratingImg ? 'Generating...' : 'Generate AI Image'}
                </button>
              </div>
            </div>
          ) : block.type === 'chart' ? (
            <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border p-3 flex flex-col gap-2">
               <span className="text-xs font-semibold text-gray-600">Edit Chart Data (JSON)</span>
               <textarea 
                  value={chartDataStr} 
                  onChange={e => setChartDataStr(e.target.value)}
                  className="font-mono text-xs p-2 h-32 border outline-none rounded text-black bg-slate-50"
                  autoFocus
               />
               <div className="flex justify-end gap-2">
                 <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded">Cancel</button>
                 <button onClick={handleChartUpdate} className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium">Update Chart</button>
               </div>
            </div>
          ) : (
             <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg border p-3 flex flex-col gap-2">
                <textarea 
                  value={editValue} 
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full h-24 p-2 text-sm border rounded outline-none text-black"
                />
                <button onClick={() => { onUpdate(patchBlockText(block, editValue)); setIsEditing(false); }} className="self-end px-3 py-1 text-xs bg-indigo-600 font-medium text-white rounded">Save</button>
             </div>
          )}
        </div>
      ) : (
        <BlockRenderer block={block} />
      )}
    </div>
  );
};

// ─── Utilities for block text extraction ───
function blockTextValue(block: MarkdownBlock): string {
  switch (block.type) {
    case 'heading':
    case 'paragraph':
      return block.text;
    case 'bullet_list':
    case 'numbered_list':
      return block.items.join('\n');
    case 'quote':
      return `${block.text}\n- ${block.attribution || ''}`;
    case 'code':
      return block.code;
    default:
      return JSON.stringify(block, null, 2);
  }
}

function patchBlockText(block: MarkdownBlock, value: string): MarkdownBlock {
  switch (block.type) {
    case 'heading':
    case 'paragraph':
      return { ...block, text: value };
    case 'bullet_list':
    case 'numbered_list':
      return { ...block, items: value.split('\n').map(l => l.trim()).filter(Boolean) };
    case 'quote': {
      const parts = value.split('\n- ');
      return { ...block, text: parts[0], attribution: parts[1] || undefined };
    }
    case 'code':
      return { ...block, code: value };
    default:
      return block;
  }
}
