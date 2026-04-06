import { useEffect } from 'react';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';

interface LightweightWysiwygProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  compact?: boolean;
  /** When true, renders without the white card wrapper — for inline slide editing */
  transparent?: boolean;
  readOnly?: boolean;
  onBlur?: () => void;
}

export const LightweightWysiwyg = ({
  value,
  onChange,
  placeholder = 'Write here...',
  minHeight = 110,
  compact = false,
  transparent = false,
  readOnly = false,
  onBlur,
}: LightweightWysiwygProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    autofocus: transparent ? 'end' : false,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
    editorProps: {
      attributes: {
        // In transparent mode: no text color override, inherits from parent (the slide block)
        // In normal mode: standard gray text for the white card
        class: transparent
          ? 'px-3 py-2 focus:outline-none h-full w-full'
          : 'px-3 py-2 text-sm text-gray-700 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || '') !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  // Auto-focus when entering transparent/inline editing mode
  useEffect(() => {
    if (!editor || !transparent) return;
    // Small timeout to let the DOM settle before focusing
    const timer = setTimeout(() => {
      editor.commands.focus('end');
    }, 30);
    return () => clearTimeout(timer);
  }, [editor, transparent]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Transparent / inline mode — no white card, fills parent container
  if (transparent) {
    return (
      <div className="h-full w-full" onBlur={onBlur}>
        <EditorContent editor={editor} className="h-full w-full" />
      </div>
    );
  }

  // Standard mode — white card with optional toolbar
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {!compact && (
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor || readOnly}
            className="px-2 py-1 text-xs font-semibold rounded bg-white border border-gray-200 hover:border-gray-300"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor || readOnly}
            className="px-2 py-1 text-xs italic rounded bg-white border border-gray-200 hover:border-gray-300"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={!editor || readOnly}
            className="px-2 py-1 text-xs rounded bg-white border border-gray-200 hover:border-gray-300"
          >
            Bullets
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            disabled={!editor || readOnly}
            className="px-2 py-1 text-xs rounded bg-white border border-gray-200 hover:border-gray-300"
          >
            Numbered
          </button>
          <button
            type="button"
            onClick={setLink}
            disabled={!editor || readOnly}
            className="px-2 py-1 text-xs rounded bg-white border border-gray-200 hover:border-gray-300"
          >
            Link
          </button>
        </div>
      )}
      <div style={{ minHeight }}>
        <div onBlur={onBlur}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
