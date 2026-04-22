'use client';

import { ThemeProvider } from './theme-provider';
import { Toaster } from 'sonner';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'border-border bg-background text-foreground',
        }}
      />
    </ThemeProvider>
  );
}
