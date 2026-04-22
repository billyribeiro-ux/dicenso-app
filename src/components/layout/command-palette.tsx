'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from 'cmdk';
import {
  FileText,
  CheckSquare,
  Terminal,
  BookOpen,
  CalendarDays,
  Lightbulb,
  Search,
  Moon,
  Sun,
  Monitor,
  Plus,
  Settings,
  Clock,
  Star,
  Trash2,
} from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { DialogTitle } from '@/components/ui/dialog';

type CommandItemDef = {
  id: string;
  title: string;
  icon: React.ElementType;
  shortcut?: string;
  keywords?: string[];
  action: () => void;
};

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  const navigationCommands: CommandItemDef[] = [
    {
      id: 'nav-today',
      title: 'Go to Today',
      icon: CalendarDays,
      shortcut: '⌘1',
      action: () => router.push('/today'),
    },
    {
      id: 'nav-notes',
      title: 'Go to Notes',
      icon: FileText,
      shortcut: '⌘2',
      action: () => router.push('/notes'),
    },
    {
      id: 'nav-tasks',
      title: 'Go to Tasks',
      icon: CheckSquare,
      shortcut: '⌘3',
      action: () => router.push('/tasks'),
    },
    {
      id: 'nav-prompts',
      title: 'Go to Prompts',
      icon: Terminal,
      shortcut: '⌘4',
      action: () => router.push('/prompts'),
    },
    {
      id: 'nav-lessons',
      title: 'Go to Lessons',
      icon: BookOpen,
      shortcut: '⌘5',
      action: () => router.push('/lessons'),
    },
    {
      id: 'nav-brainstorm',
      title: 'Go to Brainstorm',
      icon: Lightbulb,
      shortcut: '⌘6',
      action: () => router.push('/brainstorm'),
    },
    {
      id: 'nav-search',
      title: 'Go to Search',
      icon: Search,
      shortcut: '⌘⇧F',
      action: () => router.push('/search'),
    },
    {
      id: 'nav-favorites',
      title: 'Go to Favorites',
      icon: Star,
      action: () => router.push('/favorites'),
    },
    {
      id: 'nav-trash',
      title: 'Go to Trash',
      icon: Trash2,
      action: () => router.push('/trash'),
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      icon: Settings,
      action: () => router.push('/settings'),
    },
  ];

  const createCommands: CommandItemDef[] = [
    {
      id: 'create-note',
      title: 'New Note',
      icon: Plus,
      shortcut: '⌘N',
      action: () => router.push('/notes/new'),
    },
    {
      id: 'create-task',
      title: 'New Task',
      icon: Plus,
      action: () => router.push('/tasks/new'),
    },
    {
      id: 'create-prompt',
      title: 'New Prompt',
      icon: Plus,
      action: () => router.push('/prompts/new'),
    },
    {
      id: 'create-lesson',
      title: 'New Lesson',
      icon: Plus,
      action: () => router.push('/lessons/new'),
    },
    {
      id: 'quick-capture',
      title: 'Quick Capture',
      icon: Plus,
      shortcut: '⌘⇧N',
      action: () => {
        window.dispatchEvent(new CustomEvent('open-quick-capture'));
      },
    },
  ];

  const themeCommands: CommandItemDef[] = [
    {
      id: 'theme-light',
      title: 'Light Mode',
      icon: Sun,
      action: () => setTheme('light'),
    },
    {
      id: 'theme-dark',
      title: 'Dark Mode',
      icon: Moon,
      action: () => setTheme('dark'),
    },
    {
      id: 'theme-system',
      title: 'System Theme',
      icon: Monitor,
      action: () => setTheme('system'),
    },
  ];

  const timerCommands: CommandItemDef[] = [
    {
      id: 'timer-pomodoro',
      title: 'Start Pomodoro',
      icon: Clock,
      action: () => router.push('/today?timer=pomodoro'),
    },
  ];

  const allCommands = [...navigationCommands, ...createCommands, ...themeCommands, ...timerCommands];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Command Palette</DialogTitle>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Create">
          {createCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => run(cmd.action)}
              className="flex items-center gap-2"
            >
              <cmd.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{cmd.title}</span>
              {cmd.shortcut && (
                <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">
                  {cmd.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          {navigationCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => run(cmd.action)}
              className="flex items-center gap-2"
            >
              <cmd.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{cmd.title}</span>
              {cmd.shortcut && (
                <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px]">
                  {cmd.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          {themeCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => run(cmd.action)}
              className="flex items-center gap-2"
            >
              <cmd.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{cmd.title}</span>
              {theme === cmd.id.replace('theme-', '') && (
                <span className="text-xs text-muted-foreground">Active</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Focus">
          {timerCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={() => run(cmd.action)}
              className="flex items-center gap-2"
            >
              <cmd.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">{cmd.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
