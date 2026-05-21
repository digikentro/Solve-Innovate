import { useEffect } from 'react';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import FontFamily from '@tiptap/extension-font-family';
import { EditorContent, useEditor } from '@tiptap/react';
import { useActiveEditor } from './ActiveEditorContext';
import { FontSize } from './FontSize';

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
  onFocus?: () => void;
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
  onFocus,
}: LightweightWysiwygProps) => {
  const { setEditor } = useActiveEditor();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    autofocus: transparent ? 'end' : false,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
    onFocus: ({ editor: instance }) => {
      setEditor(instance);
      if (onFocus) onFocus();
    },
    onBlur: () => {
      // We don't unset the editor here immediately because clicking a format button 
      // blurs the editor. The global toolbar needs the active editor reference.
      // We rely on another block focusing to overwrite it, or explicitly clearing it elsewhere.
      if (onBlur) onBlur();
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
    let preparedValue = value || '';
    if (!/<[a-z][\s\S]*>/i.test(preparedValue)) {
      preparedValue = preparedValue.replace(/\n/g, '<br>');
    }
    
    if (preparedValue !== current) {
      editor.commands.setContent(preparedValue, { emitUpdate: false });
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
      <div className="h-full w-full">
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
        <div>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
