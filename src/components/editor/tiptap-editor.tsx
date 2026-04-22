'use client';

import * as React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  Highlighter,
  Minus,
} from 'lucide-react';

const lowlight = createLowlight(common);

interface TiptapEditorProps {
  content?: Record<string, unknown>;
  placeholder?: string;
  onUpdate?: (json: Record<string, unknown>, html: string, text: string) => void;
  className?: string;
  editable?: boolean;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function TiptapEditor({
  content,
  placeholder = 'Start writing...',
  onUpdate,
  className,
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Typography,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: content ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        const json = editor.getJSON() as Record<string, unknown>;
        const html = editor.getHTML();
        const text = editor.getText();
        onUpdate(json, html, text);
      }
    },
  });

  if (!editor) {
    return (
      <div className={cn('min-h-[200px] animate-pulse rounded-md border bg-muted', className)} />
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {editable && <EditorToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none flex-1 rounded-md border bg-background p-4 focus-within:ring-1 focus-within:ring-ring"
      />
    </div>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const url = window.prompt('Enter URL');
    if (url && isValidUrl(url)) {
      editor.chain().focus().setLink({ href: url }).run();
    } else if (url) {
      window.alert('Please enter a valid http:// or https:// URL');
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url && isValidUrl(url)) {
      editor.chain().focus().setImage({ src: url }).run();
    } else if (url) {
      window.alert('Please enter a valid http:// or https:// URL');
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: 'bold' as const, title: 'Bold' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: 'italic' as const, title: 'Italic' },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: 'underline' as const, title: 'Underline' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: 'strike' as const, title: 'Strikethrough' },
    { icon: Highlighter, action: () => editor.chain().focus().toggleHighlight().run(), active: 'highlight' as const, title: 'Highlight' },
    null,
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: 'heading' as const, attrs: { level: 1 }, title: 'Heading 1' },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: 'heading' as const, attrs: { level: 2 }, title: 'Heading 2' },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: 'heading' as const, attrs: { level: 3 }, title: 'Heading 3' },
    null,
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: 'bulletList' as const, title: 'Bullet List' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: 'orderedList' as const, title: 'Ordered List' },
    { icon: CheckSquare, action: () => editor.chain().focus().toggleTaskList().run(), active: 'taskList' as const, title: 'Task List' },
    null,
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: 'blockquote' as const, title: 'Quote' },
    { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: 'codeBlock' as const, title: 'Code Block' },
    { icon: LinkIcon, action: setLink, active: 'link' as const, title: 'Link' },
    { icon: ImageIcon, action: addImage, title: 'Image' },
    { icon: TableIcon, action: insertTable, title: 'Table' },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), title: 'Divider' },
    null,
    { icon: Undo, action: () => editor.chain().focus().undo().run(), title: 'Undo' },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), title: 'Redo' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/50 p-1.5">
      {tools.map((tool, i) => {
        if (!tool) return <div key={i} className="mx-1 h-4 w-px bg-border" />;
        const isActive = tool.active
          ? editor.isActive(tool.active, tool.attrs as Record<string, unknown> | undefined)
          : false;
        return (
          <button
            key={tool.title}
            type="button"
            onClick={tool.action}
            title={tool.title}
            className={cn(
              'rounded p-1.5 transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <tool.icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
