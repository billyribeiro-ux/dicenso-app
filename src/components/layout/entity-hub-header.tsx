import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EntityHubHeaderProps = {
  title: string;
  subtitle: string;
  newHref: string;
  newLabel: string;
};

/**
 * Shared header for vault hubs (notes, tasks, prompts, lessons).
 * Puts browse/list context first; create is a secondary action visually.
 */
export function EntityHubHeader({ title, subtitle, newHref, newLabel }: EntityHubHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {subtitle}
        </p>
      </div>
      <Button variant="secondary" className="w-full gap-2 sm:w-auto shrink-0" asChild>
        <Link href={newHref}>
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {newLabel}
        </Link>
      </Button>
    </header>
  );
}
