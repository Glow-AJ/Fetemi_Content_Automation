'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { 
  Bold, Italic, List, ListOrdered, Link as LinkIcon, 
  Heading1, Heading2, Quote, Undo, Redo, 
  Code as CodeIcon, Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  editable?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--color-border)] bg-zinc-50/50 sticky top-0 z-10">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${editor.isActive('bold') ? 'bg-zinc-200 text-[var(--color-primary)]' : 'text-zinc-600'}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${editor.isActive('italic') ? 'bg-zinc-200 text-[var(--color-primary)]' : 'text-zinc-600'}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <div className="w-px h-4 bg-zinc-300 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-zinc-200 text-[var(--color-primary)]' : 'text-zinc-600'}`}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-zinc-200 text-[var(--color-primary)]' : 'text-zinc-600'}`}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>
      <div className="w-px h-4 bg-zinc-300 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${editor.isActive('bulletList') ? 'bg-zinc-200 text-[var(--color-primary)]' : 'text-zinc-600'}`}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${editor.isActive('orderedList') ? 'bg-zinc-200 text-[var(--color-primary)]' : 'text-zinc-600'}`}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>
      <div className="w-px h-4 bg-zinc-300 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${editor.isActive('blockquote') ? 'bg-zinc-200 text-[var(--color-primary)]' : 'text-zinc-600'}`}
        title="Quote"
      >
        <Quote size={16} />
      </button>
      <button
        type="button"
        onClick={addLink}
        className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${editor.isActive('link') ? 'bg-zinc-200 text-[var(--color-primary)]' : 'text-zinc-600'}`}
        title="Add Link"
      >
        <LinkIcon size={16} />
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded hover:bg-zinc-200 transition-colors text-zinc-400 disabled:opacity-30"
        title="Undo"
      >
        <Undo size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded hover:bg-zinc-200 transition-colors text-zinc-400 disabled:opacity-30"
        title="Redo"
      >
        <Redo size={16} />
      </button>
    </div>
  );
};

export const RichTextEditor = ({ content, onChange, editable = true }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[var(--color-primary)] underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your amazing story...',
      }),
      Markdown,
    ],
    content: content,
    editable,
    onUpdate: ({ editor }) => {
      // @ts-ignore - tiptap-markdown type issue
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[400px] max-w-none p-6 text-[var(--color-text)]',
      },
    },
  });

  // Sync content if it changes externally
  useEffect(() => {
    if (editor && content !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="w-full border border-[var(--color-border)] rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-zinc-200">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
      <div className="px-4 py-2 bg-zinc-50 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-zinc-400">
        <div className="flex items-center gap-2">
           <CheckCircle2 size={12} className="text-green-500" />
           Manual Saved
        </div>
        <div>Markdown Mode</div>
      </div>
    </div>
  );
};
