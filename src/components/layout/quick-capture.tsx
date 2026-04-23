'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  CheckSquare,
  Terminal,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { notesRepo } from '@/lib/repositories';
import { tasksRepo } from '@/lib/repositories';
import { promptsRepo } from '@/lib/repositories';
import { lessonsRepo } from '@/lib/repositories';
import { slugify } from '@/lib/utils';

type CaptureType = 'note' | 'task' | 'prompt' | 'lesson' | 'brainstorm';

const types: { id: CaptureType; label: string; icon: React.ElementType }[] = [
  { id: 'note', label: 'Note', icon: FileText },
  { id: 'task', label: 'Task', icon: CheckSquare },
  { id: 'prompt', label: 'Prompt', icon: Terminal },
  { id: 'lesson', label: 'Lesson', icon: BookOpen },
  { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb },
];

const USER_ID = 'local-user';
const WORKSPACE_ID = 'default';

export function QuickCapture() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<CaptureType>('note');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');

  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-quick-capture', handler);
    return () => window.removeEventListener('open-quick-capture', handler);
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'N' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    try {
      switch (type) {
        case 'note':
          await notesRepo.create({
            workspaceId: WORKSPACE_ID,
            userId: USER_ID,
            title: title.trim(),
            slug: slugify(title.trim()),
            editorJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] },
            plainTextExtract: body,
            status: 'active',
            isPinned: false,
            isFavorite: false,
            version: 1,
          });
          toast.success('Note captured');
          break;
        case 'task':
          await tasksRepo.create({
            workspaceId: WORKSPACE_ID,
            userId: USER_ID,
            title: title.trim(),
            description: body,
            status: 'todo',
            priority: 'medium',
          });
          toast.success('Task captured');
          break;
        case 'prompt':
          await promptsRepo.create({
            workspaceId: WORKSPACE_ID,
            userId: USER_ID,
            title: title.trim(),
            body: body,
            category: 'general',
            isFavorite: false,
            version: 1,
          });
          toast.success('Prompt captured');
          break;
        case 'lesson':
          await lessonsRepo.create({
            workspaceId: WORKSPACE_ID,
            userId: USER_ID,
            title: title.trim(),
            body: body,
            status: 'not_started',
            masteryLevel: 1,
          });
          toast.success('Lesson captured');
          break;
        case 'brainstorm':
          await notesRepo.create({
            workspaceId: WORKSPACE_ID,
            userId: USER_ID,
            title: title.trim(),
            slug: slugify(title.trim()),
            editorJson: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] },
            plainTextExtract: body,
            status: 'active',
            isPinned: false,
            isFavorite: false,
            version: 1,
          });
          toast.success('Brainstorm captured');
          break;
      }
      setTitle('');
      setBody('');
      setOpen(false);

      const hubByType: Record<CaptureType, string> = {
        note: '/notes',
        task: '/tasks',
        prompt: '/prompts',
        lesson: '/lessons',
        brainstorm: '/brainstorm',
      };
      router.push(hubByType[type]);
    } catch {
      toast.error('Failed to capture');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Capture</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                  type === t.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
          <Input
            placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} title...`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            placeholder="Details (optional)..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="shadow-sm">Capture</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
