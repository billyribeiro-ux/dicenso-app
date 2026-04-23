import { Suspense } from 'react';
import { DetailRouteFallback } from '@/components/layout/detail-route-fallback';
import NoteDetailClientPage from './client-page';

/**
 * Local-first IDs live in IndexedDB and aren't known at build time. We emit a
 * single shell (`/notes/_`) that the client router reuses for every real id at
 * runtime. In dev, Next.js routes any id here directly.
 */
export function generateStaticParams() {
  return [{ id: '_' }];
}

// In Next.js 16, `params` is a Promise and must be awaited in server
// components. We await it here so the initial id is fully resolved before the
// client component mounts — this eliminates "sync dynamic APIs" warnings and
// gives the client component a stable initial value.
export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<DetailRouteFallback label="Loading note" />}>
      <NoteDetailClientPage initialId={id} />
    </Suspense>
  );
}
