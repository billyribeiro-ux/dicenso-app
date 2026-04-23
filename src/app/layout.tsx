import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/layout/command-palette';
import { QuickCapture } from '@/components/layout/quick-capture';
import { QuickOpen } from '@/components/layout/quick-open';
import { ErrorBoundary } from '@/components/error-boundary/error-boundary';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'DiCenso',
  description: 'Your personal knowledge and execution operating system',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProviders>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to main content
          </a>
          {/*
           * Top drag strip for Tauri (macOS `titleBarStyle: Overlay`).
           * Covers only the main-content band (to the right of the sidebar),
           * at a z-index BELOW the sidebar so sidebar interactions win, and
           * above normal content. 28px ≈ macOS traffic-light height.
           */}
          <div
            data-tauri-drag-region
            aria-hidden
            className="fixed right-0 top-0 z-30 h-7 lg:left-[var(--spacing-sidebar-current)]"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          />
          <Sidebar />
          <main
            id="main-content"
            className="min-h-screen pt-7 transition-all duration-200 lg:pl-[var(--spacing-sidebar-current)]"
          >
            <ErrorBoundary>
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {children}
              </div>
            </ErrorBoundary>
          </main>
          <CommandPalette />
          <QuickCapture />
          <QuickOpen />
        </AppProviders>
      </body>
    </html>
  );
}
