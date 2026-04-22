import type { BaseEntity } from '@/types';

export type SharedCollection = 'prompts' | 'notes' | 'tasks' | 'lessons';

const SYNC_SERVER = 'http://127.0.0.1:4546';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function tauriInvoke<T>(command: string, args: Record<string, unknown>): Promise<T> {
  const mod = await import('@tauri-apps/api/core');
  return mod.invoke<T>(command, args);
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(`Shared sync request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

function withDateFields<T>(value: T, dateFields: readonly string[]): T {
  const out: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  for (const key of dateFields) {
    const v = out[key];
    if (typeof v === 'string' && v.length > 0) {
      out[key] = new Date(v);
    }
  }
  return out as T;
}

function serializeDateFields<T extends Record<string, unknown>>(
  value: T,
  dateFields: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...value };
  for (const key of dateFields) {
    const v = out[key];
    if (v instanceof Date) {
      out[key] = v.toISOString();
    }
  }
  return out;
}

export async function listShared<T>(
  collection: SharedCollection,
  userId: string,
  dateFields: readonly string[],
): Promise<T[]> {
  if (isTauriRuntime()) {
    const rows = await tauriInvoke<Record<string, unknown>[]>('shared_entities_list', {
      collection,
      userId,
    });
    return rows.map((row) => withDateFields<T>(row as T, dateFields));
  }

  const { items } = await fetchJson<{ items: Record<string, unknown>[] }>(
    `${SYNC_SERVER}/entities/${collection}?userId=${encodeURIComponent(userId)}`,
  );
  return items.map((row) => withDateFields<T>(row as T, dateFields));
}

export async function getSharedById<T>(
  collection: SharedCollection,
  id: string,
  dateFields: readonly string[],
): Promise<T | undefined> {
  if (isTauriRuntime()) {
    const row = await tauriInvoke<Record<string, unknown> | null>('shared_entities_get', {
      collection,
      id,
    });
    return row ? withDateFields<T>(row as T, dateFields) : undefined;
  }

  const res = await fetch(`${SYNC_SERVER}/entities/${collection}/${encodeURIComponent(id)}`);
  if (res.status === 404) return undefined;
  if (!res.ok) {
    throw new Error(`Shared sync request failed: ${res.status}`);
  }
  const { item } = (await res.json()) as { item: Record<string, unknown> };
  return withDateFields<T>(item as T, dateFields);
}

export async function createShared<T extends BaseEntity>(
  collection: SharedCollection,
  item: T,
  dateFields: readonly string[],
): Promise<T> {
  const payload = serializeDateFields(item as unknown as Record<string, unknown>, dateFields);

  if (isTauriRuntime()) {
    const created = await tauriInvoke<Record<string, unknown>>('shared_entities_create', {
      collection,
      item: payload,
    });
    return withDateFields<T>(created as T, dateFields);
  }

  const { item: created } = await fetchJson<{ item: Record<string, unknown> }>(
    `${SYNC_SERVER}/entities/${collection}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: payload }),
    },
  );
  return withDateFields<T>(created as T, dateFields);
}

export async function updateShared<T>(
  collection: SharedCollection,
  id: string,
  changes: Record<string, unknown>,
  dateFields: readonly string[],
): Promise<T | undefined> {
  const payload = serializeDateFields(changes, dateFields);

  if (isTauriRuntime()) {
    const row = await tauriInvoke<Record<string, unknown> | null>('shared_entities_update', {
      collection,
      id,
      changes: payload,
    });
    return row ? withDateFields<T>(row as T, dateFields) : undefined;
  }

  const res = await fetch(`${SYNC_SERVER}/entities/${collection}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes: payload }),
  });
  if (res.status === 404) return undefined;
  if (!res.ok) {
    throw new Error(`Shared sync request failed: ${res.status}`);
  }
  const { item } = (await res.json()) as { item: Record<string, unknown> };
  return withDateFields<T>(item as T, dateFields);
}

export async function deleteShared(collection: SharedCollection, id: string): Promise<void> {
  if (isTauriRuntime()) {
    await tauriInvoke('shared_entities_delete', { collection, id });
    return;
  }
  await fetchJson<{ ok: true }>(`${SYNC_SERVER}/entities/${collection}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function upsertManyShared<T>(
  collection: SharedCollection,
  items: T[],
  dateFields: readonly string[],
): Promise<void> {
  if (items.length === 0) return;
  const payload = items.map((item) =>
    serializeDateFields(item as unknown as Record<string, unknown>, dateFields),
  );

  if (isTauriRuntime()) {
    await tauriInvoke('shared_entities_upsert_many', { collection, items: payload });
    return;
  }
  await fetchJson<{ ok: true }>(`${SYNC_SERVER}/entities/${collection}/upsert-many`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: payload }),
  });
}

