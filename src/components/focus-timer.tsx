'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Play, Pause, RotateCcw, SkipForward, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusTimerProps {
  durationMinutes?: number;
  onComplete?: () => void;
}

export function FocusTimer({ durationMinutes = 25, onComplete }: FocusTimerProps) {
  const durationSeconds = durationMinutes * 60;
  const [elapsed, setElapsed] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);

  // Load from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('dicenso-focus-timer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const diff = Math.floor((now - parsed.lastTick) / 1000);
        if (parsed.running) {
          const newElapsed = Math.min(parsed.elapsed + diff, durationSeconds);
          setElapsed(newElapsed);
          setRunning(newElapsed < durationSeconds);
          if (newElapsed >= durationSeconds) {
            setCompleted(true);
          }
        } else {
          setElapsed(parsed.elapsed);
          setRunning(false);
        }
      } catch {
        // ignore
      }
    }
  }, [durationSeconds]);

  // Persist to localStorage
  React.useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(
        'dicenso-focus-timer',
        JSON.stringify({ elapsed, running, lastTick: Date.now() })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [elapsed, running]);

  // Timer tick
  React.useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= durationSeconds) {
          setRunning(false);
          setCompleted(true);
          if (onComplete) onComplete();
          toast.success('Focus session complete!');
          return durationSeconds;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, durationSeconds, onComplete]);

  const reset = () => {
    setElapsed(0);
    setRunning(false);
    setCompleted(false);
    localStorage.removeItem('dicenso-focus-timer');
  };

  const remaining = durationSeconds - elapsed;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = elapsed / durationSeconds;

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border p-6">
      <div className="flex items-center gap-2">
        <Flame className={cn('h-5 w-5', running ? 'text-orange-500' : 'text-muted-foreground')} />
        <span className="text-sm font-medium">Focus Timer</span>
        {completed && <Badge variant="default" className="bg-green-600 text-white">Completed</Badge>}
      </div>

      <div className="relative flex h-40 w-40 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress)}`}
            className={cn('transition-all duration-1000', running ? 'text-primary' : 'text-muted-foreground')}
          />
        </svg>
        <div className="absolute text-3xl font-bold tabular-nums">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      <div className="flex gap-2">
        {!running && !completed && (
          <Button onClick={() => setRunning(true)} className="gap-2">
            <Play className="h-4 w-4" />
            Start
          </Button>
        )}
        {running && (
          <Button onClick={() => setRunning(false)} variant="secondary" className="gap-2">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        )}
        {(elapsed > 0 || completed) && (
          <Button onClick={reset} variant="ghost" size="icon">
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
