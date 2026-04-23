export type EntityDetailSegment = 'prompts' | 'notes' | 'tasks' | 'lessons';

const STATIC_DETAIL_ROUTE_ID = '_';
const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';

/**
 * Dynamic entity IDs are stored locally and cannot be enumerated during static
 * export. Tauri therefore ships one generated detail shell per entity type
 * (`/<segment>/_`) and passes the real IndexedDB id through the query string.
 */
export function entityDetailHref(segment: EntityDetailSegment, id: string): string {
  const encodedId = encodeURIComponent(id);

  if (isStaticExport) {
    return `/${segment}/${STATIC_DETAIL_ROUTE_ID}?id=${encodedId}`;
  }

  return `/${segment}/${encodedId}`;
}

export function isStaticDetailRouteId(id: string | undefined): boolean {
  return !id || id === STATIC_DETAIL_ROUTE_ID;
}
