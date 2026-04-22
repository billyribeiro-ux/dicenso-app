import { usePathname } from 'next/navigation';

/**
 * Resolves `[id]` for `/segment/[id]` detail routes.
 *
 * We intentionally avoid `useParams()` here: in Next.js 15+, dynamic `params`
 * are async/Promise-backed in dev, and reading `useParams().id` triggers the
 * "sync dynamic APIs" console warnings. `usePathname()` is synchronous and
 * matches the active URL for these flat routes.
 */
export function useRouteEntityId(
  segment: 'prompts' | 'notes' | 'tasks' | 'lessons',
  initialId?: string,
): string | undefined {
  const pathname = usePathname() ?? '';
  const pathParts = pathname.split('/').filter(Boolean);
  const pathId =
    pathParts.length >= 2 && pathParts[0] === segment ? pathParts[1] : undefined;

  const rawId =
    (pathId && pathId !== '_' ? pathId : undefined) ??
    (initialId && initialId !== '_' ? initialId : undefined);

  return rawId && rawId !== '_' ? rawId : undefined;
}
