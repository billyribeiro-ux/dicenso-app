'use client';

import * as React from 'react';
import Link from 'next/link';
import { tasksRepo } from '@/lib/repositories';
import { EntityHubHeader } from '@/components/layout/entity-hub-header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { CheckSquare, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/types';

const USER_ID = 'local-user';

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [query, setQuery] = React.useState('');
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setLoaded(false);
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    let data: Task[];
    if (filter === 'all') {
      data = await tasksRepo.getByUser(USER_ID);
    } else {
      data = await tasksRepo.getByStatus(USER_ID, filter);
    }
    setTasks(data);
    setLoaded(true);
  };

  const toggleTask = async (task: Task) => {
    if (task.status === 'done') {
      await tasksRepo.uncomplete(task.id);
    } else {
      await tasksRepo.complete(task.id);
    }
    await loadTasks();
  };

  const filtered = query
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          (t.description?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : tasks;

  const priorityColor = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  const filterLabels: Record<typeof filter, string> = {
    all: 'All tasks',
    todo: 'To do',
    in_progress: 'In progress',
    done: 'Done',
  };
  const active = tasks.filter((t) => t.status !== 'done').length;
  const subtitle =
    tasks.length === 0
      ? `${filterLabels[filter]} · Nothing here yet.`
      : `${filterLabels[filter]} · ${active} active · ${tasks.length} in this view`;

  return (
    <div className="space-y-6">
      <EntityHubHeader
        title="Tasks"
        subtitle={subtitle}
        newHref="/tasks/new"
        newLabel="New task"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Filter tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-md"
          aria-label="Filter tasks"
        />
        <div className="flex gap-2">
          {(['all', 'todo', 'in_progress', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors capitalize',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {!loaded ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading tasks">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 transition-colors">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
            <CheckSquare className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <h3 className="mt-4 font-medium">{query ? 'No matches found' : 'No tasks yet'}</h3>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {query ? 'Try adjusting your filter or search terms.' : 'Break down your goals into actionable tasks.'}
          </p>
          {!query && (
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/tasks/new">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="Your tasks">
          {filtered.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              role="listitem"
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:border-primary/20 hover:shadow-sm active:scale-[0.99]',
                task.status === 'done' && 'opacity-60 bg-muted/50 hover:bg-muted'
              )}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void toggleTask(task);
                }}
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                  task.status === 'done'
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-input hover:border-primary'
                )}
                aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
              >
                {task.status === 'done' && (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', task.status === 'done' && 'line-through text-muted-foreground')}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                )}
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {task.dueAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.dueAt)}
                    </span>
                  )}
                  {task.estimateMinutes && <span>{task.estimateMinutes}m</span>}
                </div>
              </div>
              <Badge variant="secondary" className={cn('shrink-0 text-[10px] capitalize', priorityColor[task.priority])}>
                {task.priority}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
