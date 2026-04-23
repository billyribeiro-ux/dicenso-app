'use client';

import * as React from 'react';
import Link from 'next/link';
import { tasksRepo, dailyPlansRepo, notesRepo } from '@/lib/repositories';
import { entityDetailHref } from '@/lib/entity-routes';
import { formatDate, formatRelative } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FocusTimer } from '@/components/focus-timer';
import { useDebounce } from '@/hooks/use-debounce';
import {
  CheckSquare,
  FileText,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, Note } from '@/types';

const USER_ID = 'local-user';
const WORKSPACE_ID = 'default';

export default function TodayPage() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [overdue, setOverdue] = React.useState<Task[]>([]);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [planText, setPlanText] = React.useState('');
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      const [todayTasks, overdueTasks, recentNotes, plan] = await Promise.all([
        tasksRepo.getDueToday(USER_ID),
        tasksRepo.getOverdue(USER_ID),
        notesRepo.getRecent(USER_ID, 5),
        dailyPlansRepo.getOrCreate(WORKSPACE_ID, USER_ID, new Date()),
      ]);
      setTasks(todayTasks);
      setOverdue(overdueTasks);
      setNotes(recentNotes);
      setPlanText(plan.planText ?? '');
      setLoaded(true);
    }
    load();
  }, []);

  const toggleTask = async (task: Task) => {
    if (task.status === 'done') {
      await tasksRepo.uncomplete(task.id);
    } else {
      await tasksRepo.complete(task.id);
    }
    const [todayTasks, overdueTasks] = await Promise.all([
      tasksRepo.getDueToday(USER_ID),
      tasksRepo.getOverdue(USER_ID),
    ]);
    setTasks(todayTasks);
    setOverdue(overdueTasks);
  };

  const savePlan = React.useCallback(
    async (text: string) => {
      const plan = await dailyPlansRepo.getOrCreate(WORKSPACE_ID, USER_ID, new Date());
      await dailyPlansRepo.update(plan.id, { planText: text });
    },
    []
  );

  const debouncedSavePlan = useDebounce(savePlan, 1000);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="premium-panel relative overflow-hidden rounded-3xl p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">{dateString}</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl">{dayName}</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">
          Turn the day into a clean sequence of decisions, focus, and follow-through.
        </p>
      </div>

      {/* Daily Plan */}
      <section className="premium-panel rounded-3xl p-5 space-y-3">
        <h2 className="text-lg font-semibold">Plan for Today</h2>
        <Textarea
          placeholder="What do you want to accomplish today?"
          value={planText}
          onChange={(e) => {
            setPlanText(e.target.value);
            debouncedSavePlan(e.target.value);
          }}
          className="min-h-[80px] resize-none"
        />
      </section>

      {/* Focus Timer */}
      <section className="premium-panel rounded-3xl p-5 space-y-3">
        <FocusTimer />
      </section>

      {/* Overdue */}
      {overdue.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-destructive">Overdue ({overdue.length})</h2>
          <div className="space-y-2">
            {overdue.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} />
            ))}
          </div>
        </section>
      )}

      {/* Today's Tasks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tasks Today ({tasks.length})</h2>
          <Link href="/tasks/new">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </Link>
        </div>
        {tasks.length === 0 ? (
          <div className="empty-state flex flex-col items-center justify-center rounded-3xl py-12 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/70 shadow-sm">
              <CheckSquare className="h-5 w-5 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-medium">No tasks due today</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/tasks/new">
                <Plus className="mr-2 h-4 w-4" />
                Create a task
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Notes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Notes</h2>
          <Link href="/notes/new">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </Link>
        </div>
        {notes.length === 0 ? (
          <div className="empty-state flex flex-col items-center justify-center rounded-3xl py-12 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/70 shadow-sm">
              <FileText className="h-5 w-5 text-muted-foreground" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-medium">No recent notes</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={entityDetailHref('notes', note.id)}
                prefetch={false}
                className="entity-card group flex flex-col rounded-2xl p-4 transition-all active:scale-[0.99]"
              >
                <h3 className="font-medium group-hover:underline">{note.title}</h3>
                {note.plainTextExtract && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {note.plainTextExtract}
                  </p>
                )}
                <p className="mt-auto pt-3 text-xs text-muted-foreground">
                  {formatRelative(note.updatedAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const priorityColor = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div
      className={cn(
        'entity-card group flex items-center gap-3 rounded-2xl p-3.5 transition-all active:scale-[0.99]',
        task.status === 'done' && 'opacity-60'
      )}
    >
      <button
        onClick={onToggle}
        role="checkbox"
        aria-checked={task.status === 'done'}
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
        <p className={cn('truncate text-sm', task.status === 'done' && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        {task.description && (
          <p className="truncate text-xs text-muted-foreground">{task.description}</p>
        )}
      </div>
      <Badge variant="secondary" className={cn('shrink-0 text-[10px] capitalize', priorityColor[task.priority])}>
        {task.priority}
      </Badge>
    </div>
  );
}
