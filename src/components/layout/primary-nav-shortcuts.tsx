'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

const ROUTES: Record<string, string> = {
  '1': '/today',
  '2': '/notes',
  '3': '/tasks',
  '4': '/prompts',
  '5': '/lessons',
  '6': '/brainstorm',
};

function isTypingContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest('[role="combobox"]')) return true;
  return false;
}

/**
 * Matches sidebar hints: ⌘1–⌘6 (Ctrl on non-mac) jump to primary hubs.
 */
export function PrimaryNavShortcuts() {
  const router = useRouter();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.altKey || e.shiftKey) return;
      if (isTypingContext(e.target)) return;

      const path = ROUTES[e.key];
      if (!path) return;

      e.preventDefault();
      router.push(path);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  return null;
}
