import { usePathname, useSearchParams } from 'next/navigation';
import { isStaticDetailRouteId, type EntityDetailSegment } from '@/lib/entity-routes';

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Resolves `[id]` for `/segment/[id]` detail routes.
 *
 * We intentionally avoid `useParams()` here: in Next.js 15+, dynamic `params`
 * are async/Promise-backed in dev, and reading `useParams().id` triggers the
 * "sync dynamic APIs" console warnings. `usePathname()` is synchronous and
 * matches the active URL for these flat routes.
 *
 * In Tauri/static export, only `/<segment>/_` can exist at build time because
 * local IndexedDB entity IDs are unknown. Static links therefore pass the real
 * id as `?id=<entity-id>`, while web/dev routes continue to use `/segment/id`.
 */
export function useRouteEntityId(
  segment: EntityDetailSegment,
  initialId?: string,
): string | undefined {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const pathParts = pathname.split('/').filter(Boolean);
  const pathId =
    pathParts.length >= 2 && pathParts[0] === segment ? pathParts[1] : undefined;
  const queryId = searchParams.get('id') ?? undefined;

  const rawId =
    (!isStaticDetailRouteId(pathId) ? pathId : undefined) ??
    (!isStaticDetailRouteId(queryId) ? queryId : undefined) ??
    (!isStaticDetailRouteId(initialId) ? initialId : undefined);

  return rawId ? safeDecodeURIComponent(rawId) : undefined;
}
