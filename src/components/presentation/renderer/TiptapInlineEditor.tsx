import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { FiBold, FiItalic, FiList, FiLink, FiCheck } from 'react-icons/fi';

interface TiptapInlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  className?: string; // We'll pass the exact formatting classes from BlockRenderer
  placeholder?: string;
}

export const TiptapInlineEditor = ({
  value,
  onChange,
  onBlur,
  className = '',
  placeholder = 'Type here...',
}: TiptapInlineEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
    onBlur: () => {
      onBlur();
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-lg p-1 min-h-[1.5em] ${className}`,
        style: 'cursor: text;',
      },
      handleKeyDown: (view, event) => {
        // Prevent default drag scrolling inside bubble menu if we press escape
        if (event.key === 'Escape') {
          onBlur();
        }
        return false;
      }
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      if (!editor.isFocused) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  // Focus immediately when mounted
  useEffect(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="relative">
      {editor.isFocused && (
        <div className="absolute -top-12 left-0 flex bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-700 animate-fadeIn z-50">
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={`p-2 text-white hover:bg-gray-800 transition-colors ${editor.isActive('bold') ? 'bg-indigo-600' : ''}`}
        >
          <FiBold className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          className={`p-2 text-white hover:bg-gray-800 transition-colors ${editor.isActive('italic') ? 'bg-indigo-600' : ''}`}
        >
          <FiItalic className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          className={`p-2 text-white hover:bg-gray-800 transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-600' : ''}`}
        >
          <FiList className="w-4 h-4" />
        </button>
        <button
          onMouseDown={(e) => {
             e.preventDefault();
             const previousUrl = editor.getAttributes('link').href;
             const url = window.prompt('URL:', previousUrl || 'https://');
             if (url === null) return;
             if (url === '') { editor.chain().focus().unsetLink().run(); return; }
             editor.chain().focus().setLink({ href: url }).run();
          }}
          className={`p-2 text-white hover:bg-gray-800 transition-colors ${editor.isActive('link') ? 'bg-indigo-600' : ''}`}
        >
          <FiLink className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-700 my-1 mx-1" />
        <button
          onMouseDown={(e) => { e.preventDefault(); onBlur(); }}
          className="p-2 text-green-400 hover:bg-gray-800 transition-colors bg-green-900/20"
        >
          <FiCheck className="w-4 h-4" />
        </button>
      </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
