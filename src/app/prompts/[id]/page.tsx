import { Suspense } from 'react';
import { DetailRouteFallback } from '@/components/layout/detail-route-fallback';
import PromptDetailClientPage from './client-page';

/**
 * Local-first IDs live in IndexedDB — they aren't known at build time.
 * We emit a single shell (`/prompts/_`) that client-side routing reuses for
 * every real id at runtime. In dev mode, Next.js routes any id here directly.
 */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<DetailRouteFallback label="Loading prompt" />}>
      <PromptDetailClientPage initialId={id} />
    </Suspense>
  );
}
