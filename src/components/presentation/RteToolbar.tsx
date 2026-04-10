import React, { useEffect, useRef, useState } from 'react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
} from 'react-icons/fi';
import { useActiveEditor } from './ActiveEditorContext';

// ---------------------------------------------------------------------------
// Helpers – save / restore the native browser selection as a DOM Range so it
// survives the blur that a <select> click causes.
// ---------------------------------------------------------------------------
function saveNativeSelection(): Range | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0).cloneRange(); // cloneRange keeps the coordinates even after blur
}

function restoreNativeSelection(range: Range | null) {
  if (!range) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

// ---------------------------------------------------------------------------

export const RteToolbar = () => {
  const { editor } = useActiveEditor();
  const [, setTick] = useState(0);
  // Store a cloned DOM Range (not a ProseMirror Selection object)
  const savedRangeRef = useRef<Range | null>(null);

  // Force re-render when editor state changes
  useEffect(() => {
    if (!editor) return;
    const update = () => setTick((t) => t + 1);
    editor.on('transaction', update);
    editor.on('selectionUpdate', update);
    return () => {
      editor.off('transaction', update);
      editor.off('selectionUpdate', update);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const FONT_FAMILIES = [
    { label: 'System Default', value: '' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Comic Sans', value: '"Comic Sans MS", "Comic Sans", cursive' },
    { label: 'Serif', value: 'serif' },
    { label: 'Monospace', value: 'monospace' },
  ];

  const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64', '72'];

  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || '';
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '';

  // Called the moment the user starts pressing down on a SELECT or color INPUT
  const handleSelectMouseDown = (e: React.MouseEvent) => {
    // Save the current DOM selection BEFORE the <select> steals focus
    savedRangeRef.current = saveNativeSelection();
    // Do NOT call e.preventDefault() here – that would block the dropdown from opening
  };

  // Restore the saved range, re-focus the editor, then run the command
  const applyWithRestoredSelection = (command: () => void) => {
    restoreNativeSelection(savedRangeRef.current);
    editor.commands.focus();         // re-focus ProseMirror (it reads from DOM selection)
    command();
    savedRangeRef.current = null;
  };

  return (
    <div
      className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-md px-2 py-1 mx-auto"
      style={{ maxWidth: '900px', pointerEvents: 'auto' }}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        const tag = target.tagName;
        // Only prevent-default (= keep editor focus) for plain buttons/labels.
        // For SELECT and INPUT we let the event through so the native UI works,
        // but we save the selection first via the individual onMouseDown handlers.
        if (tag !== 'SELECT' && tag !== 'INPUT') {
          e.preventDefault();
        }
      }}
    >
      {/* ── Font Family ──────────────────────────────────────────────────── */}
      <select
        value={currentFontFamily}
        onMouseDown={handleSelectMouseDown}
        onChange={(e) => {
          const val = e.target.value;
          applyWithRestoredSelection(() => {
            if (val) {
              editor.chain().setFontFamily(val).run();
            } else {
              editor.chain().unsetFontFamily().run();
            }
          });
        }}
        className="text-sm border border-slate-200 rounded px-1 py-1 w-32 focus:outline-none"
        title="Font Family"
      >
        {FONT_FAMILIES.map((fn) => (
          <option key={fn.value} value={fn.value}>
            {fn.label}
          </option>
        ))}
      </select>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* ── Font Size ────────────────────────────────────────────────────── */}
      <select
        value={currentFontSize.replace('px', '')}
        onMouseDown={handleSelectMouseDown}
        onChange={(e) => {
          const val = e.target.value;
          applyWithRestoredSelection(() => {
            if (val) {
              editor.chain().setFontSize(`${val}px`).run();
            } else {
              editor.chain().unsetFontSize().run();
            }
          });
        }}
        className="text-sm border border-slate-200 rounded px-1 py-1 w-16 focus:outline-none"
        title="Font Size"
      >
        <option value="">--</option>
        {FONT_SIZES.map((fs) => (
          <option key={fs} value={fs}>
            {fs}
          </option>
        ))}
      </select>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* ── Bold / Italic / Underline / Strike ───────────────────────────── */}
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}
        title="Bold"
      >
        <FiBold className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}
        title="Italic"
      >
        <FiItalic className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
        className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}
        title="Underline"
      >
        <FiUnderline className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
        className={`p-1.5 rounded text-sm line-through font-semibold ${editor.isActive('strike') ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}
        title="Strikethrough"
      >
        S
      </button>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* ── Text Color ───────────────────────────────────────────────────── */}
      <label
        className="flex items-center gap-1 text-xs cursor-pointer px-1 hover:bg-slate-100 rounded"
        title="Text Color"
      >
        <div className="text-slate-500 font-semibold text-xs border border-transparent underline">A</div>
        <input
          type="color"
          className="w-5 h-5 rounded overflow-hidden cursor-pointer p-0 border-0"
          value={editor.getAttributes('textStyle').color || '#000000'}
          onMouseDown={handleSelectMouseDown}
          onChange={(e) => {
            const val = e.target.value;
            applyWithRestoredSelection(() => {
              editor.chain().setColor(val).run();
            });
          }}
        />
      </label>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* ── Alignment ────────────────────────────────────────────────────── */}
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); }}
        className={`p-1.5 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}
        title="Align Left"
      >
        <FiAlignLeft className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); }}
        className={`p-1.5 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}
        title="Align Center"
      >
        <FiAlignCenter className="w-4 h-4" />
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); }}
        className={`p-1.5 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}
        title="Align Right"
      >
        <FiAlignRight className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* ── Lists ────────────────────────────────────────────────────────── */}
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}
        title="Bullet List"
      >
        <FiList className="w-4 h-4" />
      </button>

      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
        className={`p-1.5 rounded text-xs font-semibold ${editor.isActive('orderedList') ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`}
        title="Numbered List"
      >
        1.
      </button>
    </div>
  );
};
