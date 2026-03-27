'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { FloatingMenu, BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import FloatingMenuExtension from '@tiptap/extension-floating-menu';
import { 
  Bold, Italic, List, ListOrdered, Link as LinkIcon, 
  Heading1, Heading2, Quote, Undo, Redo, 
  CheckCircle2
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  editable?: boolean;
  toolbar?: boolean;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
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

export const RichTextEditor = ({ content, onChange, editable = true, toolbar = true }: RichTextEditorProps) => {
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
      BubbleMenuExtension,
      FloatingMenuExtension,
    ],
    content: content,
    editable,
    onUpdate: ({ editor: e }) => {
      // Accessing markdown storage which is added by the extension
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (e as any).storage.markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg focus:outline-none min-h-[500px] max-w-none p-8 lg:p-12 text-zinc-900 selection:bg-orange-100',
      },
    },
  });

  // Sync content if it changes externally (but not if we are editing)
  useEffect(() => {
    if (!editor) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentMarkdown = (editor as any).storage.markdown.getMarkdown();
    if (content !== currentMarkdown) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  return (
    <div className="w-full border border-[var(--color-border)] rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-zinc-200">
      {(editable && toolbar) && <MenuBar editor={editor} />}
      
      {editor && (
        <>
          <BubbleMenu editor={editor} className="flex bg-zinc-900 text-white rounded-lg p-1 shadow-xl ring-1 ring-white/10">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 hover:bg-zinc-800 rounded transition-colors ${editor.isActive('bold') ? 'text-orange-400' : ''}`}
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 hover:bg-zinc-800 rounded transition-colors ${editor.isActive('italic') ? 'text-orange-400' : ''}`}
            >
              <Italic size={14} />
            </button>
          </BubbleMenu>

          <FloatingMenu editor={editor} className="flex flex-col bg-white border border-zinc-200 rounded-xl p-2 shadow-2xl ring-1 ring-zinc-200/50">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2 pb-2 border-b border-zinc-100 mb-2">Insert Blocks</p>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg text-left group transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-orange-100 group-hover:text-orange-600">
                <Heading1 size={14} />
              </div>
              <span className="font-bold">Heading 1</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg text-left group transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-orange-100 group-hover:text-orange-600">
                <Heading2 size={14} />
              </div>
              <span className="font-bold">Heading 2</span>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg text-left group transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-orange-100 group-hover:text-orange-600">
                <List size={14} />
              </div>
              <span className="font-bold">Bullet List</span>
            </button>
          </FloatingMenu>
        </>
      )}

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
