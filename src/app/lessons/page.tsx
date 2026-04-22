'use client';

import * as React from 'react';
import Link from 'next/link';
import { lessonsRepo } from '@/lib/repositories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Clock, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import type { Lesson } from '@/types';
import { cn } from '@/lib/utils';

const USER_ID = 'local-user';

export default function LessonsPage() {
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'not_started' | 'in_progress' | 'learned' | 'review'>('all');

  React.useEffect(() => {
    loadLessons();
  }, [filter]);

  const loadLessons = async () => {
    let data: Lesson[];
    if (filter === 'review') {
      data = await lessonsRepo.getDueForReview(USER_ID);
    } else if (filter === 'all') {
      data = await lessonsRepo.getByUser(USER_ID);
    } else {
      data = await lessonsRepo.getByStatus(USER_ID, filter);
    }
    setLessons(data);
  };

  const statusIcon = {
    not_started: Circle,
    in_progress: Clock,
    learned: CheckCircle2,
    review_later: ArrowRight,
  };

  const statusColor = {
    not_started: 'text-muted-foreground',
    in_progress: 'text-blue-500',
    learned: 'text-green-500',
    review_later: 'text-amber-500',
  };

  const filtered = query
    ? lessons.filter(
        (l) =>
          l.title.toLowerCase().includes(query.toLowerCase()) ||
          (l.summary?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : lessons;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lessons</h1>
          <p className="text-muted-foreground">{lessons.length} lessons</p>
        </div>
        <Link href="/lessons/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Lesson
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search lessons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {(['all', 'not_started', 'in_progress', 'learned', 'review'] as const).map((f) => (
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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            {query ? 'No lessons match your search' : 'No lessons yet'}
          </p>
          {!query && (
            <Link href="/lessons/new">
              <Button variant="link">Create your first lesson</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lesson) => {
            const Icon = statusIcon[lesson.status];
            return (
              <Link
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="flex flex-col rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{lesson.title}</h3>
                  <Icon className={cn('h-4 w-4 shrink-0', statusColor[lesson.status])} />
                </div>
                {lesson.summary && (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {lesson.summary}
                  </p>
                )}
                <div className="mt-auto flex items-center gap-2 pt-3">
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {lesson.status.replace('_', ' ')}
                  </Badge>
                  {lesson.reviewAt && (
                    <span className="text-xs text-muted-foreground">
                      Review {new Date(lesson.reviewAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
