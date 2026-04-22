'use client';

import * as React from 'react';
import Link from 'next/link';
import { promptsRepo } from '@/lib/repositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Terminal, Star, Copy } from 'lucide-react';
import type { Prompt } from '@/types';
import { cn } from '@/lib/utils';

const USER_ID = 'local-user';

export default function PromptsPage() {
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    const data = await promptsRepo.getByUser(USER_ID);
    setPrompts(data);
  };

  const toggleFavorite = async (prompt: Prompt) => {
    await promptsRepo.update(prompt.id, { isFavorite: !prompt.isFavorite });
    await loadPrompts();
  };

  const copyPrompt = async (body: string) => {
    await navigator.clipboard.writeText(body);
    toast.success('Copied to clipboard');
  };

  const filtered = query
    ? prompts.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.body.toLowerCase().includes(query.toLowerCase())
      )
    : prompts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prompts</h1>
          <p className="text-muted-foreground">{prompts.length} prompts</p>
        </div>
        <Link href="/prompts/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </Link>
      </div>

      <Input
        placeholder="Search prompts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <Terminal className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            {query ? 'No prompts match your search' : 'No prompts yet'}
          </p>
          {!query && (
            <Link href="/prompts/new">
              <Button variant="link">Create your first prompt</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prompt) => (
            <Link
              key={prompt.id}
              href={`/prompts/${prompt.id}`}
              className="group flex flex-col rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{prompt.title}</h3>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => toggleFavorite(prompt)}
                    className={cn(
                      'rounded p-1 transition-colors',
                      prompt.isFavorite ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Star className={cn('h-3.5 w-3.5', prompt.isFavorite && 'fill-current')} />
                  </button>
                  <button
                    onClick={() => copyPrompt(prompt.body)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2 w-fit text-[10px]">
                {prompt.category}
              </Badge>
              <p className="mt-3 line-clamp-4 text-sm text-muted-foreground whitespace-pre-wrap">
                {prompt.body}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
