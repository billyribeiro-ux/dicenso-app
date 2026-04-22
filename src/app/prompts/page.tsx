'use client';

import * as React from 'react';
import Link from 'next/link';
import { promptsRepo } from '@/lib/repositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EntityHubHeader } from '@/components/layout/entity-hub-header';
import { toast } from 'sonner';
import { Terminal, Star, Copy } from 'lucide-react';
import type { Prompt } from '@/types';
import { cn } from '@/lib/utils';

const USER_ID = 'local-user';

export default function PromptsPage() {
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  const [query, setQuery] = React.useState('');
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    const data = await promptsRepo.getByUser(USER_ID);
    setPrompts(data);
    setLoaded(true);
  };

  const toggleFavorite = async (e: React.MouseEvent, prompt: Prompt) => {
    e.preventDefault();
    e.stopPropagation();
    await promptsRepo.update(prompt.id, { isFavorite: !prompt.isFavorite });
    await loadPrompts();
  };

  const copyPrompt = async (e: React.MouseEvent, body: string) => {
    e.preventDefault();
    e.stopPropagation();
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

  const subtitle =
    prompts.length === 0
      ? 'Saved prompts appear here, newest first.'
      : `${prompts.length} saved ${prompts.length === 1 ? 'prompt' : 'prompts'} · Newest first`;

  return (
    <div className="space-y-6">
      <EntityHubHeader
        title="Prompts"
        subtitle={subtitle}
        newHref="/prompts/new"
        newLabel="New prompt"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter prompts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
          aria-label="Filter prompts"
        />
      </div>

      {!loaded ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading prompts"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border bg-muted/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Terminal className="h-10 w-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 text-center text-muted-foreground">
            {query ? 'No prompts match your filter.' : 'No prompts yet.'}
          </p>
          {!query && (
            <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
              When you are ready, use <span className="font-medium text-foreground">New prompt</span> above to
              add one.
            </p>
          )}
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Your prompts"
        >
          {filtered.map((prompt) => (
            <Link
              key={prompt.id}
              href={`/prompts/${prompt.id}`}
              role="listitem"
              className="group flex flex-col rounded-lg border bg-card p-4 transition-colors hover:bg-accent/60"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{prompt.title}</h3>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => void toggleFavorite(e, prompt)}
                    className={cn(
                      'rounded p-1 transition-colors',
                      prompt.isFavorite ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
                    )}
                    aria-label={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={cn('h-3.5 w-3.5', prompt.isFavorite && 'fill-current')} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => void copyPrompt(e, prompt.body)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Copy prompt body"
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
