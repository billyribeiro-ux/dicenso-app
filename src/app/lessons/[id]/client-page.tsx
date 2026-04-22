'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { lessonsRepo } from '@/lib/repositories';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lesson } from '@/types';

type Props = { initialId?: string };

export default function LessonDetailClientPage({ initialId }: Props = {}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rawId = params?.id ?? initialId;
  const id = rawId && rawId !== '_' ? rawId : undefined;

  const [lesson, setLesson] = React.useState<Lesson | null>(null);
  const [title, setTitle] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [body, setBody] = React.useState('');
  const [status, setStatus] = React.useState<Lesson['status']>('not_started');
  const [saving, setSaving] = React.useState(false);

  const loadLesson = React.useCallback(async () => {
    if (!id) return;
    const l = await lessonsRepo.getById(id);
    if (!l) {
      router.push('/lessons');
      return;
    }
    setLesson(l);
    setTitle(l.title);
    setSummary(l.summary ?? '');
    setBody(l.body ?? '');
    setStatus(l.status);
  }, [id, router]);

  React.useEffect(() => {
    void loadLesson();
  }, [loadLesson]);

  const handleSave = React.useCallback(async () => {
    if (!lesson) return;
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await lessonsRepo.update(lesson.id, {
        title: title.trim(),
        summary: summary || undefined,
        body: body || undefined,
        status,
      });
      toast.success('Lesson updated');
      void loadLesson();
    } catch {
      toast.error('Failed to update lesson');
    } finally {
      setSaving(false);
    }
  }, [lesson, title, summary, body, status, loadLesson]);

  const handleDelete = async () => {
    if (!lesson) return;
    await lessonsRepo.delete(lesson.id);
    toast.success('Lesson deleted');
    router.push('/lessons');
  };

  useKeyboardShortcut(
    { key: 'Enter', metaKey: true, ignoreWhenTyping: true },
    handleSave
  );

  if (!lesson) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2 border-b pb-4">
        <Link href="/lessons">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Edit Lesson</h1>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button onClick={handleSave} disabled={saving} className="h-8 gap-2 shadow-sm">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="space-y-6 pt-2">
        <Input
          placeholder="Lesson title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-auto border-0 bg-transparent px-0 text-3xl font-semibold tracking-tight shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />

        <div className="flex gap-2">
          {(['not_started', 'in_progress', 'learned', 'review_later'] as Lesson['status'][]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                status === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Summary / key takeaways..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
        />
        <Textarea
          placeholder="Full notes..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
        />
      </div>
    </div>
  );
}
