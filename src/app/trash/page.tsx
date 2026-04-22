'use client';

import * as React from 'react';
import { notesRepo, tasksRepo, promptsRepo, lessonsRepo } from '@/lib/repositories';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, RotateCcw, FileText, CheckSquare, Terminal, BookOpen } from 'lucide-react';
import type { Note, Task, Prompt, Lesson } from '@/types';
import { formatRelative } from '@/lib/utils';

const USER_ID = 'local-user';

type TrashedItem =
  | { type: 'note'; data: Note }
  | { type: 'task'; data: Task }
  | { type: 'prompt'; data: Prompt }
  | { type: 'lesson'; data: Lesson };

const typeIcons = {
  note: FileText,
  task: CheckSquare,
  prompt: Terminal,
  lesson: BookOpen,
};

export default function TrashPage() {
  const [items, setItems] = React.useState<TrashedItem[]>([]);

  React.useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    const [notes, tasks, prompts, lessons] = await Promise.all([
      notesRepo.getTrash(USER_ID),
      tasksRepo.getByUser(USER_ID).then((list) => list.filter((t) => t.status === 'cancelled')),
      // Prompts and lessons don't have soft delete yet, so we show none for now
      Promise.resolve([] as Prompt[]),
      Promise.resolve([] as Lesson[]),
    ]);

    const all: TrashedItem[] = [
      ...notes.map((n) => ({ type: 'note' as const, data: n })),
      ...tasks.map((t) => ({ type: 'task' as const, data: t })),
    ];

    setItems(all);
  };

  const restore = async (item: TrashedItem) => {
    try {
      switch (item.type) {
        case 'note':
          await notesRepo.restore(item.data.id);
          break;
        case 'task':
          await tasksRepo.update(item.data.id, { status: 'todo', completedAt: undefined });
          break;
      }
      toast.success('Restored');
      await loadTrash();
    } catch {
      toast.error('Failed to restore');
    }
  };

  const permanentDelete = async (item: TrashedItem) => {
    try {
      switch (item.type) {
        case 'note':
          await notesRepo.delete(item.data.id);
          break;
        case 'task':
          await tasksRepo.delete(item.data.id);
          break;
      }
      toast.success('Permanently deleted');
      await loadTrash();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
        <p className="text-muted-foreground">{items.length} deleted items</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <Trash2 className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Trash is empty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <div
                key={`${item.type}-${item.data.id}`}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.data.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.type} · {item.data.updatedAt ? formatRelative(item.data.updatedAt) : ''}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => restore(item)} className="gap-1">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => permanentDelete(item)}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
