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
}

export const LightweightWysiwyg = ({
  value,
  onChange,
  placeholder = 'Write here...',
  minHeight = 110,
}: LightweightWysiwygProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'px-3 py-2 text-sm text-gray-700 focus:outline-none',
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

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor}
          className="px-2 py-1 text-xs font-semibold rounded bg-white border border-gray-200 hover:border-gray-300"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor}
          className="px-2 py-1 text-xs italic rounded bg-white border border-gray-200 hover:border-gray-300"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={!editor}
          className="px-2 py-1 text-xs rounded bg-white border border-gray-200 hover:border-gray-300"
        >
          Bullets
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={!editor}
          className="px-2 py-1 text-xs rounded bg-white border border-gray-200 hover:border-gray-300"
        >
          Numbered
        </button>
        <button
          type="button"
          onClick={setLink}
          disabled={!editor}
          className="px-2 py-1 text-xs rounded bg-white border border-gray-200 hover:border-gray-300"
        >
          Link
        </button>
      </div>
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
