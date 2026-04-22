'use client';

import * as React from 'react';
import Link from 'next/link';
import { notesRepo } from '@/lib/repositories';
import { formatRelative, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Plus,
  Star,
  Pin,
  MoreHorizontal,
  Archive,
  Trash2,
} from 'lucide-react';
import type { Note } from '@/types';
import { toast } from 'sonner';

const USER_ID = 'local-user';

export default function NotesPage() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'pinned' | 'favorites' | 'archived'>('all');

  React.useEffect(() => {
    loadNotes();
  }, [filter]);

  const loadNotes = async () => {
    let data: Note[];
    switch (filter) {
      case 'pinned':
        data = await notesRepo.getPinned(USER_ID);
        break;
      case 'favorites':
        data = await notesRepo.getFavorites(USER_ID);
        break;
      case 'archived':
        data = await notesRepo.getArchived(USER_ID);
        break;
      default:
        data = await notesRepo.getByUser(USER_ID);
    }
    setNotes(data);
  };

  const filtered = query
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          (n.plainTextExtract?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : notes;

  const togglePin = async (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    e.stopPropagation();
    await notesRepo.pin(note.id, !note.isPinned);
    await loadNotes();
  };

  const toggleFavorite = async (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    e.stopPropagation();
    await notesRepo.favorite(note.id, !note.isFavorite);
    await loadNotes();
  };

  const archiveNote = async (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    e.stopPropagation();
    await notesRepo.archive(note.id);
    toast.success('Note archived');
    await loadNotes();
  };

  const deleteNote = async (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    e.stopPropagation();
    await notesRepo.softDelete(note.id);
    toast.success('Note moved to trash');
    await loadNotes();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground">{notes.length} notes</p>
        </div>
        <Link href="/notes/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          {(['all', 'pinned', 'favorites', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            {query ? 'No notes match your search' : 'No notes yet'}
          </p>
          {!query && (
            <Link href="/notes/new">
              <Button variant="link">Create your first note</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="group relative flex flex-col rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-medium group-hover:underline">{note.title}</h3>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => togglePin(e, note)}
                    className={cn(
                      'rounded p-1 transition-colors',
                      note.isPinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                    title={note.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => toggleFavorite(e, note)}
                    className={cn(
                      'rounded p-1 transition-colors',
                      note.isFavorite ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
                    )}
                    title={note.isFavorite ? 'Remove favorite' : 'Favorite'}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  {filter !== 'archived' && (
                    <button
                      onClick={(e) => archiveNote(e, note)}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      title="Archive"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => deleteNote(e, note)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {note.plainTextExtract && (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {note.plainTextExtract}
                </p>
              )}
              <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-muted-foreground">
                <span>{formatRelative(note.updatedAt)}</span>
                {note.isPinned && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    Pinned
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
