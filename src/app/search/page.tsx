'use client';

import * as React from 'react';
import Link from 'next/link';
import { notesRepo, tasksRepo, promptsRepo, lessonsRepo } from '@/lib/repositories';
import { entityDetailHref } from '@/lib/entity-routes';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, CheckSquare, Terminal, BookOpen } from 'lucide-react';
import type { Note, Task, Prompt, Lesson } from '@/types';

const USER_ID = 'local-user';

export default function SearchPage() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<{
    notes: Note[];
    tasks: Task[];
    prompts: Prompt[];
    lessons: Lesson[];
  }>({ notes: [], tasks: [], prompts: [], lessons: [] });

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ notes: [], tasks: [], prompts: [], lessons: [] });
      return;
    }
    const timer = setTimeout(async () => {
      const [notes, tasks, prompts, lessons] = await Promise.all([
        notesRepo.search(USER_ID, query),
        tasksRepo.search(USER_ID, query),
        promptsRepo.search(USER_ID, query),
        lessonsRepo.search(USER_ID, query),
      ]);
      setResults({ notes, tasks, prompts, lessons });
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const total =
    results.notes.length +
    results.tasks.length +
    results.prompts.length +
    results.lessons.length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="premium-panel rounded-xl p-6">
        <h1 className="text-3xl font-extrabold tracking-[-0.05em]">Search</h1>
        <p className="text-sm font-medium text-muted-foreground">
          {query.trim().length < 2 ? 'Type to search across your vault' : `${total} results`}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes, tasks, prompts, lessons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>

      {query.trim().length >= 2 && total === 0 && (
        <div className="empty-state rounded-xl py-12 text-center text-muted-foreground">No results found</div>
      )}

      {results.notes.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Notes
          </h2>
          {results.notes.map((note) => (
            <Link
              key={note.id}
              href={entityDetailHref('notes', note.id)}
              prefetch={false}
              className="entity-card flex items-center gap-3 rounded-xl p-3 transition-all"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{note.title}</p>
                {note.plainTextExtract && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {note.plainTextExtract}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}

      {results.tasks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Tasks
          </h2>
          {results.tasks.map((task) => (
            <Link
              key={task.id}
              href={entityDetailHref('tasks', task.id)}
              prefetch={false}
              className="entity-card flex items-center gap-3 rounded-xl p-3 transition-all"
            >
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{task.title}</p>
                <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </Link>
          ))}
        </section>
      )}

      {results.prompts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Prompts
          </h2>
          {results.prompts.map((prompt) => (
            <Link
              key={prompt.id}
              href={entityDetailHref('prompts', prompt.id)}
              prefetch={false}
              className="entity-card flex items-center gap-3 rounded-xl p-3 transition-all"
            >
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{prompt.title}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{prompt.body}</p>
              </div>
            </Link>
          ))}
        </section>
      )}

      {results.lessons.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Lessons
          </h2>
          {results.lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={entityDetailHref('lessons', lesson.id)}
              prefetch={false}
              className="entity-card flex items-center gap-3 rounded-xl p-3 transition-all"
            >
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{lesson.title}</p>
                <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
                  {lesson.status.replace('_', ' ')}
                </Badge>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
