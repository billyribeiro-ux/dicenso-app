'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { lessonsRepo } from '@/lib/repositories';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

const USER_ID = 'local-user';
const WORKSPACE_ID = 'default';

export default function NewLessonPage() {
  const router = useRouter();
  const [title, setTitle] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [body, setBody] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await lessonsRepo.create({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        title: title.trim(),
        summary: summary || undefined,
        body: body || undefined,
        status: 'not_started',
        masteryLevel: 1,
      });
      toast.success('Lesson created');
      router.push('/lessons');
    } catch {
      toast.error('Failed to create lesson');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/lessons">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">New Lesson</h1>
        <div className="flex-1" />
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          Create
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Lesson title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg"
        />
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
