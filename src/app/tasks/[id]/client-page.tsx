'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { tasksRepo } from '@/lib/repositories';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

export default function TaskDetailClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [task, setTask] = React.useState<Task | null>(null);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState<Task['priority']>('medium');
  const [dueAt, setDueAt] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    loadTask();
  }, [id]);

  const loadTask = async () => {
    const t = await tasksRepo.getById(id);
    if (!t) {
      router.push('/tasks');
      return;
    }
    setTask(t);
    setTitle(t.title);
    setDescription(t.description ?? '');
    setPriority(t.priority);
    setDueAt(t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 16) : '');
  };

  const handleSave = React.useCallback(async () => {
    if (!task) return;
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await tasksRepo.update(task.id, {
        title: title.trim(),
        description: description || undefined,
        priority,
        dueAt: dueAt ? new Date(dueAt) : undefined,
      });
      toast.success('Task updated');
      loadTask();
    } catch {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  }, [task, title, description, priority, dueAt]);

  const handleDelete = async () => {
    if (!task) return;
    await tasksRepo.update(task.id, { status: 'cancelled', updatedAt: new Date() });
    toast.success('Task moved to trash');
    router.push('/tasks');
  };

  useKeyboardShortcut(
    { key: 'Enter', metaKey: true, ignoreWhenTyping: true },
    handleSave
  );

  if (!task) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Edit Task</h1>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg"
        />
        <Textarea
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'urgent'] as Task['priority'][]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                    priority === p
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <Input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
