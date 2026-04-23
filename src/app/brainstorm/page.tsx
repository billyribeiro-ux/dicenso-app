'use client';

import * as React from 'react';
import Link from 'next/link';
import { notesRepo } from '@/lib/repositories';
import { entityDetailHref } from '@/lib/entity-routes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Lightbulb,
  Plus,
  Trash2,
  FileText,
  CheckSquare,
  ArrowRight,
} from 'lucide-react';
import type { Note } from '@/types';
import { cn, slugify } from '@/lib/utils';

const USER_ID = 'local-user';
const WORKSPACE_ID = 'default';

export default function BrainstormPage() {
  const [items, setItems] = React.useState<Note[]>([]);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');

  React.useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const all = await notesRepo.getByUser(USER_ID);
    // Brainstorm items: notes with no plain text (empty/draft) OR explicitly tagged as brainstorm
    // For now, show notes that have empty content as "brainstorm items"
    setItems(
      all
        .filter((n) => !n.deletedAt && (!n.plainTextExtract || n.plainTextExtract.length < 100))
        .slice(0, 50)
    );
  };

  const addItem = async () => {
    if (!title.trim() && !body.trim()) return;
    await notesRepo.create({
      workspaceId: WORKSPACE_ID,
      userId: USER_ID,
      title: title.trim() || 'Untitled Idea',
      slug: slugify(title.trim() || 'untitled-idea'),
      editorJson: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }],
      },
      plainTextExtract: body,
      status: 'active',
      isPinned: false,
      isFavorite: false,
      version: 1,
    });
    setTitle('');
    setBody('');
    toast.success('Idea captured');
    await loadItems();
  };

  const deleteItem = async (id: string) => {
    await notesRepo.softDelete(id);
    await loadItems();
  };

  return (
    <div className="space-y-6">
      <div className="premium-panel rounded-xl p-6">
        <h1 className="text-3xl font-extrabold tracking-[-0.05em]">Brainstorm</h1>
        <p className="text-sm font-medium text-muted-foreground">Freeform ideas and scratchpad</p>
      </div>

      <div className="premium-panel rounded-xl p-5 space-y-3">
        <Input
          placeholder="Idea title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Jot down your idea..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button onClick={addItem} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Idea
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="entity-card group relative flex flex-col rounded-xl p-4 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium">{item.title}</h3>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100 rounded p-1 text-muted-foreground hover:text-destructive"
                aria-label="Delete idea"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {item.plainTextExtract && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {item.plainTextExtract}
              </p>
            )}
            <div className="mt-auto flex gap-2 pt-3">
              <Link href={entityDetailHref('notes', item.id)} prefetch={false}>
                <Button variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs">
                  <FileText className="h-3 w-3" />
                  Open
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="empty-state flex flex-col items-center justify-center rounded-xl py-20">
          <Lightbulb className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No ideas yet. Start brainstorming above.</p>
        </div>
      )}
    </div>
  );
}
