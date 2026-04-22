'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useRouteEntityId } from '@/hooks/use-route-entity-id';
import Link from 'next/link';
import { promptsRepo } from '@/lib/repositories';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { ArrowLeft, Save, Trash2, Copy } from 'lucide-react';
import type { Prompt } from '@/types';

type Props = { initialId?: string };

export default function PromptDetailClientPage({ initialId }: Props = {}) {
  const router = useRouter();
  const id = useRouteEntityId('prompts', initialId);

  const [prompt, setPrompt] = React.useState<Prompt | null>(null);
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [category, setCategory] = React.useState('general');
  const [saving, setSaving] = React.useState(false);

  const loadPrompt = React.useCallback(async () => {
    if (!id) return;
    const p = await promptsRepo.getById(id);
    if (!p) {
      router.push('/prompts');
      return;
    }
    setPrompt(p);
    setTitle(p.title);
    setBody(p.body);
    setCategory(p.category);
  }, [id, router]);

  React.useEffect(() => {
    void loadPrompt();
  }, [loadPrompt]);

  const handleSave = React.useCallback(async () => {
    if (!prompt) return;
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    setSaving(true);
    try {
      await promptsRepo.update(prompt.id, {
        title: title.trim(),
        body: body.trim(),
        category,
      });
      toast.success('Prompt updated');
      void loadPrompt();
    } catch {
      toast.error('Failed to update prompt');
    } finally {
      setSaving(false);
    }
  }, [prompt, title, body, category, loadPrompt]);

  const handleDelete = async () => {
    if (!prompt) return;
    await promptsRepo.delete(prompt.id);
    toast.success('Prompt deleted');
    router.push('/prompts');
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(body);
    toast.success('Copied to clipboard');
  };

  useKeyboardShortcut(
    { key: 'Enter', metaKey: true, ignoreWhenTyping: true },
    handleSave
  );

  if (!prompt) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2 border-b pb-4">
        <Link href="/prompts">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Edit Prompt</h1>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8 gap-1 shadow-sm">
          <Copy className="h-4 w-4" />
          Copy
        </Button>
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
          placeholder="Prompt title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-auto border-0 bg-transparent px-0 text-3xl font-semibold tracking-tight shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
        />
        <Input
          placeholder="Category..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Textarea
          placeholder="Paste or write your prompt here..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}
