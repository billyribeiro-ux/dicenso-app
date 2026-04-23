'use client';

import * as React from 'react';
import Link from 'next/link';
import { notesRepo } from '@/lib/repositories';
import { entityDetailHref } from '@/lib/entity-routes';
import { formatRelative, cn } from '@/lib/utils';
import { EntityHubHeader } from '@/components/layout/entity-hub-header';
import { Input } from '@/components/ui/input';
import { FileText, Star, Pin, Archive, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Note } from '@/types';
import { toast } from 'sonner';

const USER_ID = 'local-user';

export default function NotesPage() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'pinned' | 'favorites' | 'archived'>('all');
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setLoaded(false);
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
    setLoaded(true);
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

  const filterLabel =
    filter === 'all'
      ? 'All notes'
      : filter === 'pinned'
        ? 'Pinned'
        : filter === 'favorites'
          ? 'Favorites'
          : 'Archived';
  const subtitle =
    notes.length === 0
      ? `${filterLabel} · Nothing here yet.`
      : `${filterLabel} · ${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`;

  return (
    <div className="space-y-6">
      <EntityHubHeader
        title="Notes"
        subtitle={subtitle}
        newHref="/notes/new"
        newLabel="New note"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Filter notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-md"
          aria-label="Filter notes"
        />
        <div className="flex gap-2">
          {(['all', 'pinned', 'favorites', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f
                  ? 'filter-chip-active'
                  : 'filter-chip'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {!loaded ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading notes"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg border bg-muted/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state flex flex-col items-center justify-center rounded-3xl py-16 transition-colors">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/70 shadow-sm">
            <FileText className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <h3 className="mt-4 font-medium">{query ? 'No matches found' : 'No notes yet'}</h3>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {query ? 'Try adjusting your filter or search terms.' : 'Create a note to start capturing thoughts and ideas.'}
          </p>
          {!query && (
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/notes/new">
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Your notes">
          {filtered.map((note) => (
            <div
              key={note.id}
              role="listitem"
              className="entity-card group relative flex flex-col rounded-2xl transition-all active:scale-[0.99]"
            >
              <Link
                href={entityDetailHref('notes', note.id)}
                prefetch={false}
                className="absolute inset-0 z-0 rounded-lg"
                aria-label={`Open note: ${note.title}`}
              />
              <div className="pointer-events-none relative z-10 flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-medium group-hover:underline">{note.title}</h3>
                  <div className="pointer-events-auto flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
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
                      type="button"
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
                        type="button"
                        onClick={(e) => archiveNote(e, note)}
                        className="rounded p-1 text-muted-foreground hover:text-foreground"
                        title="Archive"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
