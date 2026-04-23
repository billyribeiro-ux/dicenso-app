'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root landing page.
 *
 * We intentionally do NOT use the server-side `redirect('/today')` here.
 * In a static export (`output: 'export'`), a server `redirect()` bakes a
 * `NEXT_REDIRECT;/today` directive into `out/index.html` with `__next_error__`
 * markup. If a hard navigation ever falls back to `/` (e.g. Tauri's asset
 * protocol 404's on an unknown dynamic route like `/prompts/<uuid>/`), that
 * error shell snaps the URL to `/today` — which is the "click sends me to
 * dashboard" bug.
 *
 * A client-side redirect via `router.replace` keeps the root page a valid,
 * non-error HTML shell and only navigates once the app has actually hydrated.
 */
export default function HomePage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/today');
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-label="Loading"
        role="status"
      />
    </div>
  );
}
