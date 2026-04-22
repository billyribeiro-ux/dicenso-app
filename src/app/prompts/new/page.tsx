'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { promptsRepo } from '@/lib/repositories';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

const USER_ID = 'local-user';
const WORKSPACE_ID = 'default';

export default function NewPromptPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [category, setCategory] = React.useState('general');
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required');
      return;
    }
    setSaving(true);
    try {
      await promptsRepo.create({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        title: title.trim(),
        body: body.trim(),
        category,
        isFavorite: false,
        version: 1,
      });
      toast.success('Prompt created');
      router.push('/prompts');
    } catch {
      toast.error('Failed to create prompt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/prompts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">New Prompt</h1>
        <div className="flex-1" />
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          Create
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Prompt title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg"
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
