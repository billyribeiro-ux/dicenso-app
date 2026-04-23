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
    <header className="premium-panel relative overflow-hidden rounded-3xl p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="pointer-events-none absolute -top-20 right-8 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
      <div className="min-w-0 space-y-0.5">
        <h1 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{title}</h1>
        <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
          {subtitle}
        </p>
      </div>
      <Button variant="default" className="mt-4 w-full gap-2 sm:mt-0 sm:w-auto shrink-0" asChild>
        <Link href={newHref}>
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {newLabel}
        </Link>
      </Button>
    </header>
  );
}
