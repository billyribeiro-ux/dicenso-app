'use client';

import * as React from 'react';
import { ThemeProvider } from './theme-provider';
import { Toaster } from 'sonner';
import { PrimaryNavShortcuts } from '@/components/layout/primary-nav-shortcuts';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <TooltipProvider delayDuration={200}>
        <PrimaryNavShortcuts />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'border-border bg-background text-foreground',
          }}
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}
