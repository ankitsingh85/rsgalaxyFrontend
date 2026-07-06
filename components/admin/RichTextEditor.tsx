'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Undo2,
} from 'lucide-react';

export default function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: 'min-h-[260px] rounded-xl bg-gray-950 border border-gray-700 px-4 py-3 text-sm text-gray-100 outline-none focus:border-amber-500',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const toolClass = (active = false) =>
    `p-2 rounded-lg border transition-colors ${active ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'}`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">Content *</label>
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={toolClass(editor.isActive('bold'))}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={toolClass(editor.isActive('italic'))}>
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} className={toolClass(editor.isActive('strike'))}>
          <Strikethrough className="w-4 h-4" />
        </button>
        <button type="button" title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolClass(editor.isActive('bulletList'))}>
          <List className="w-4 h-4" />
        </button>
        <button type="button" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toolClass(editor.isActive('orderedList'))}>
          <ListOrdered className="w-4 h-4" />
        </button>
        <button type="button" title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={toolClass(editor.isActive('blockquote'))}>
          <Quote className="w-4 h-4" />
        </button>
        <button type="button" title="Undo" onClick={() => editor.chain().focus().undo().run()} className={toolClass()}>
          <Undo2 className="w-4 h-4" />
        </button>
        <button type="button" title="Redo" onClick={() => editor.chain().focus().redo().run()} className={toolClass()}>
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
