'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Inbox,
  CalendarDays,
  FileText,
  Terminal,
  BookOpen,
  CheckSquare,
  Lightbulb,
  Search,
  Star,
  Settings,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
}

const primaryNav: NavItem[] = [
  { href: '/today', label: 'Today', icon: CalendarDays, shortcut: '1' },
  { href: '/notes', label: 'Notes', icon: FileText, shortcut: '2' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, shortcut: '3' },
  { href: '/prompts', label: 'Prompts', icon: Terminal, shortcut: '4' },
  { href: '/lessons', label: 'Lessons', icon: BookOpen, shortcut: '5' },
  { href: '/brainstorm', label: 'Brainstorm', icon: Lightbulb, shortcut: '6' },
];

const secondaryNav: NavItem[] = [
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favorites', label: 'Favorites', icon: Star },
  { href: '/trash', label: 'Trash', icon: Trash2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const sidebarRef = React.useRef<HTMLElement>(null);
  const lastFocusedRef = React.useRef<HTMLElement | null>(null);

  // Load collapsed state
  React.useEffect(() => {
    const saved = localStorage.getItem('dicenso-sidebar-collapsed');
    if (saved) setCollapsed(saved === 'true');
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('dicenso-sidebar-collapsed', String(next));
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Focus trap for mobile sidebar
  React.useEffect(() => {
    if (!mobileOpen) return;

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    // Store last focused element
    lastFocusedRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusable = sidebar.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !('disabled' in el && (el as HTMLButtonElement).disabled) && el.offsetParent !== null);

      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      lastFocusedRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-md border bg-background shadow-sm lg:hidden"
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
        aria-controls="main-sidebar"
      >
        <Command className="h-4 w-4" />
      </button>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="main-sidebar"
        className={cn(
          'fixed top-0 left-0 z-50 flex h-screen flex-col border-r bg-sidebar-background transition-all duration-200 ease-in-out',
          collapsed ? 'w-[var(--spacing-sidebar-collapsed)]' : 'w-[var(--spacing-sidebar)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex h-14 items-center border-b px-3">
          {!collapsed && (
            <Link href="/today" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
                <Command className="h-4 w-4" />
              </div>
              <span className="truncate">DiCenso</span>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Command className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Quick Capture */}
        <div className="px-3 py-2">
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start gap-2 text-muted-foreground',
              collapsed && 'justify-center px-2'
            )}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-quick-capture'));
            }}
          >
            <Inbox className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Quick Capture</span>
                <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] xl:inline-block">
                  ⌘⇧N
                </kbd>
              </>
            )}
          </Button>
        </div>

        {/* Primary Nav */}
        <nav className="flex-1 space-y-1 px-2 py-2" aria-label="Primary">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                isActive(item.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={item.label}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] xl:inline-block">
                      ⌘{item.shortcut}
                    </kbd>
                  )}
                </>
              )}
            </Link>
          ))}
        </nav>

        {/* Secondary Nav */}
        <nav className="space-y-1 border-t px-2 py-2" aria-label="Secondary">
          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                isActive(item.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={item.label}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden border-t p-2 lg:block">
          <button
            onClick={toggleCollapse}
            className="flex w-full items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
