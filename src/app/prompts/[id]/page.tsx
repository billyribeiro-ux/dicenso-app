import PromptDetailClientPage from './client-page';

/**
 * Local-first IDs live in IndexedDB — they aren't known at build time.
 * We emit a single shell (`/prompts/_`) that client-side routing reuses for
 * every real id at runtime. In dev mode, Next.js routes any id here directly
 * (no static pre-render needed).
 */
export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function PromptDetailPage() {
  return <PromptDetailClientPage />;
}
