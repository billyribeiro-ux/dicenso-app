'use client';

import * as React from 'react';
import Link from 'next/link';
import { notesRepo, promptsRepo } from '@/lib/repositories';
import { formatRelative } from '@/lib/utils';
import { Star, FileText, Terminal } from 'lucide-react';
import type { Note, Prompt } from '@/types';

const USER_ID = 'local-user';

export default function FavoritesPage() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);

  React.useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const [n, p] = await Promise.all([
      notesRepo.getFavorites(USER_ID),
      promptsRepo.getFavorites(USER_ID),
    ]);
    setNotes(n);
    setPrompts(p);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Favorites</h1>
        <p className="text-muted-foreground">Your starred notes and prompts</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Notes</h2>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No favorite notes</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">{note.title}</h3>
                </div>
                {note.plainTextExtract && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {note.plainTextExtract}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatRelative(note.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Prompts</h2>
        {prompts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No favorite prompts</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {prompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompts/${prompt.id}`}
                className="block rounded-lg border p-4 transition-colors hover:bg-accent/60"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">{prompt.title}</h3>
                </div>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap">
                  {prompt.body}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
