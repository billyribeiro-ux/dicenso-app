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
import { notesRepo, tasksRepo, promptsRepo, lessonsRepo } from '@/lib/repositories';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';
import { FileText, CheckSquare, Terminal, BookOpen, ArrowRight } from 'lucide-react';
import type { Note, Task, Prompt, Lesson } from '@/types';

const USER_ID = 'local-user';

type SearchResult =
  | { type: 'note'; item: Note }
  | { type: 'task'; item: Task }
  | { type: 'prompt'; item: Prompt }
  | { type: 'lesson'; item: Lesson };

const typeConfig = {
  note: { icon: FileText, label: 'Note' },
  task: { icon: CheckSquare, label: 'Task' },
  prompt: { icon: Terminal, label: 'Prompt' },
  lesson: { icon: BookOpen, label: 'Lesson' },
};

export function QuickOpen() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  useKeyboardShortcut(
    { key: 'p', metaKey: true, ignoreWhenTyping: true },
    () => setOpen(true)
  );

  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    // Focus input when opened
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  React.useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const [notes, tasks, prompts, lessons] = await Promise.all([
        notesRepo.search(USER_ID, query),
        tasksRepo.search(USER_ID, query),
        promptsRepo.search(USER_ID, query),
        lessonsRepo.search(USER_ID, query),
      ]);
      const all: SearchResult[] = [
        ...notes.slice(0, 5).map((n) => ({ type: 'note' as const, item: n })),
        ...tasks.slice(0, 5).map((t) => ({ type: 'task' as const, item: t })),
        ...prompts.slice(0, 5).map((p) => ({ type: 'prompt' as const, item: p })),
        ...lessons.slice(0, 5).map((l) => ({ type: 'lesson' as const, item: l })),
      ];
      setResults(all);
      setSelectedIndex(0);
    }, 100);
    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = (result: SearchResult) => {
    setOpen(false);
    switch (result.type) {
      case 'note':
        router.push(`/notes/${result.item.id}`);
        break;
      case 'task':
        router.push(`/tasks/${result.item.id}`);
        break;
      case 'prompt':
        router.push(`/prompts/${result.item.id}`);
        break;
      case 'lesson':
        router.push(`/lessons/${result.item.id}`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        navigateTo(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick Open</DialogTitle>
        </DialogHeader>
        <div className="p-4 pb-2">
          <Input
            ref={inputRef}
            placeholder="Quick open notes, tasks, prompts, lessons..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 shadow-none focus-visible:ring-0 text-lg px-0"
          />
        </div>
        {results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto px-2 pb-2">
            {results.map((result, index) => {
              const config = typeConfig[result.type];
              const Icon = config.icon;
              return (
                <button
                  key={`${result.type}-${result.item.id}`}
                  onClick={() => navigateTo(result)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm font-medium">
                    {result.item.title}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {config.label}
                  </span>
                  {index === selectedIndex && (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        )}
        {query.trim().length > 0 && results.length === 0 && (
          <div className="px-4 pb-4 text-sm text-muted-foreground">
            No results found
          </div>
        )}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex gap-3">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
