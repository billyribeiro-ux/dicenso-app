'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { notesRepo } from '@/lib/repositories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { slugify } from '@/lib/utils';
import { toast } from 'sonner';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

const USER_ID = 'local-user';
const WORKSPACE_ID = 'default';

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = React.useState('');
  const [editorJson, setEditorJson] = React.useState<Record<string, unknown>>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  const [plainText, setPlainText] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const handleSave = React.useCallback(async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const note = await notesRepo.create({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        title: title.trim(),
        slug: slugify(title.trim()),
        editorJson,
        plainTextExtract: plainText || undefined,
        status: 'active',
        isPinned: false,
        isFavorite: false,
        version: 1,
      });
      localStorage.removeItem('dicenso-note-draft');
      toast.success('Note saved');
      router.push(`/notes/${note.id}`);
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  }, [title, editorJson, plainText, router]);

  useKeyboardShortcut(
    { key: 'Enter', metaKey: true, ignoreWhenTyping: true },
    handleSave
  );

  // Autosave draft to localStorage
  React.useEffect(() => {
    const draft = localStorage.getItem('dicenso-note-draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setTitle(parsed.title ?? '');
        setEditorJson(parsed.editorJson ?? editorJson);
      } catch {
        // ignore
      }
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('dicenso-note-draft', JSON.stringify({ title, editorJson }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, editorJson]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/notes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1" />
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
      <Input
        placeholder="Note title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border-0 bg-transparent text-2xl font-bold shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
      />
      <TiptapEditor
        content={editorJson}
        placeholder="Start writing..."
        onUpdate={(json, _html, text) => {
          setEditorJson(json);
          setPlainText(text);
        }}
      />
    </div>
  );
}
