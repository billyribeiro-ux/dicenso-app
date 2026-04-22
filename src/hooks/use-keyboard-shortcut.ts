import { useEffect, useCallback } from 'react';

interface ShortcutOptions {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: boolean;
  target?: 'document' | 'window';
  /** If true, ignores shortcuts when user is typing in an input/textarea/contenteditable */
  ignoreWhenTyping?: boolean;
}

function isTypingTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName.toLowerCase();
  const isEditable = target.isContentEditable;
  const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
  return isInput || isEditable;
}

export function useKeyboardShortcut(
  options: ShortcutOptions,
  callback: () => void
) {
  const {
    key,
    metaKey = false,
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    preventDefault = true,
    target = 'document',
    ignoreWhenTyping = true,
  } = options;

  const handler = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== key) return;
      if (metaKey && !event.metaKey) return;
      if (ctrlKey && !event.ctrlKey) return;
      if (shiftKey && !event.shiftKey) return;
      if (altKey && !event.altKey) return;
      if (ignoreWhenTyping && isTypingTarget(event)) return;

      if (preventDefault) {
        event.preventDefault();
      }
      callback();
    },
    [key, metaKey, ctrlKey, shiftKey, altKey, preventDefault, ignoreWhenTyping, callback]
  );

  useEffect(() => {
    const el = target === 'document' ? document : window;
    el.addEventListener('keydown', handler as EventListener);
    return () => el.removeEventListener('keydown', handler as EventListener);
  }, [handler, target]);
}
