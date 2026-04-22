'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { notesRepo, noteVersionsRepo } from '@/lib/repositories';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import {
  ArrowLeft,
  Save,
  Star,
  Pin,
  Archive,
  Trash2,
  History,
  RotateCcw,
} from 'lucide-react';
import type { Note, NoteVersion } from '@/types';
import { cn } from '@/lib/utils';

export default function NoteDetailClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [note, setNote] = React.useState<Note | null>(null);
  const [title, setTitle] = React.useState('');
  const [editorJson, setEditorJson] = React.useState<Record<string, unknown>>({});
  const [plainText, setPlainText] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [showVersions, setShowVersions] = React.useState(false);
  const [versions, setVersions] = React.useState<NoteVersion[]>([]);
  const [hasChanges, setHasChanges] = React.useState(false);
  const lastVersionAtRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!id) return;
    loadNote();
  }, [id]);

  const loadNote = async () => {
    const n = await notesRepo.getById(id);
    if (!n) {
      router.push('/notes');
      return;
    }
    setNote(n);
    setTitle(n.title);
    setEditorJson(n.editorJson);
    setPlainText(n.plainTextExtract ?? '');
  };

  const handleSave = React.useCallback(async () => {
    if (!note) return;
    setSaving(true);
    try {
      // Only create version snapshot if it's been at least 60 seconds since last version
      const now = Date.now();
      if (now - lastVersionAtRef.current > 60000) {
        await noteVersionsRepo.createVersion(note);
        lastVersionAtRef.current = now;
      }
      // Update note
      await notesRepo.update(note.id, {
        title: title.trim(),
        editorJson,
        plainTextExtract: plainText || undefined,
        version: note.version + 1,
      });
      setHasChanges(false);
      toast.success('Note saved');
      loadNote();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [note, title, editorJson, plainText]);

  // Autosave (no version snapshot — just update content)
  React.useEffect(() => {
    if (!hasChanges || !note) return;
    const timer = setTimeout(async () => {
      try {
        await notesRepo.update(note.id, {
          title: title.trim(),
          editorJson,
          plainTextExtract: plainText || undefined,
        });
        setHasChanges(false);
      } catch {
        // silent fail on autosave
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [hasChanges, title, editorJson, plainText, note]);

  const togglePin = async () => {
    if (!note) return;
    await notesRepo.pin(note.id, !note.isPinned);
    loadNote();
  };

  const toggleFavorite = async () => {
    if (!note) return;
    await notesRepo.favorite(note.id, !note.isFavorite);
    loadNote();
  };

  const archiveNote = async () => {
    if (!note) return;
    await notesRepo.archive(note.id);
    toast.success('Note archived');
    router.push('/notes');
  };

  const deleteNote = async () => {
    if (!note) return;
    await notesRepo.softDelete(note.id);
    toast.success('Note moved to trash');
    router.push('/notes');
  };

  const loadVersions = async () => {
    const v = await noteVersionsRepo.getByNote(id);
    setVersions(v);
    setShowVersions(true);
  };

  const restoreVersion = async (version: NoteVersion) => {
    if (!note) return;
    await notesRepo.update(note.id, {
      editorJson: version.editorJson,
      plainTextExtract: version.plainTextExtract,
    });
    toast.success('Version restored');
    setShowVersions(false);
    loadNote();
  };

  useKeyboardShortcut(
    { key: 'Enter', metaKey: true, ignoreWhenTyping: true },
    handleSave
  );

  if (!note) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Link href="/notes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePin}
            title={note.isPinned ? 'Unpin' : 'Pin'}
            aria-pressed={note.isPinned}
          >
            <Pin className={cn('h-4 w-4', note.isPinned && 'fill-current text-primary')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            title={note.isFavorite ? 'Unfavorite' : 'Favorite'}
            aria-pressed={note.isFavorite}
          >
            <Star className={cn('h-4 w-4', note.isFavorite && 'fill-current text-amber-500')} />
          </Button>
          <Button variant="ghost" size="icon" onClick={loadVersions} title="Version history">
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={archiveNote} title="Archive">
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={deleteNote} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Title */}
      <Input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setHasChanges(true);
        }}
        className="border-0 bg-transparent text-2xl font-bold shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
      />

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Version {note.version}</span>
        {note.isPinned && <Badge variant="outline">Pinned</Badge>}
        {note.isFavorite && <Badge variant="outline">Favorite</Badge>}
        {note.archivedAt && <Badge variant="secondary">Archived</Badge>}
      </div>

      {/* Editor */}
      <TiptapEditor
        content={editorJson}
        placeholder="Start writing..."
        onUpdate={(json, _html, text) => {
          setEditorJson(json);
          setPlainText(text);
          setHasChanges(true);
        }}
      />

      {/* Versions sidebar */}
      {showVersions && (
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Version History</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowVersions(false)}>
              Close
            </Button>
          </div>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions yet</p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => restoreVersion(v)}>
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
