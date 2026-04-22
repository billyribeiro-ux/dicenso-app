import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { Prompt, PromptTemplate } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import type { SharedPromptRecord } from '@/lib/shared-prompts';
import { toPrompt, toSharedPrompt } from '@/lib/shared-prompts';

type PromptPatch = Partial<Omit<Prompt, 'id' | 'createdAt'>>;

const LEGACY_PROMPTS_MIGRATION_KEY = 'dicenso:prompts-migrated:v1';
const PROMPTS_SYNC_SERVER = 'http://127.0.0.1:4546';

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function getTauriInvoke() {
  const mod = await import('@tauri-apps/api/core');
  return mod.invoke;
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(`Prompt sync API failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

class PromptsRepository {
  private migrationPromise: Promise<void> | null = null;

  private async legacyTable() {
    return (await getDb()).prompts;
  }

  private async upsertManyShared(items: Prompt[]): Promise<void> {
    const payload = items.map(toSharedPrompt);
    if (isTauriRuntime()) {
      const invoke = await getTauriInvoke();
      await invoke<number>('shared_prompts_upsert_many', { items: payload });
      return;
    }

    await fetchJson<{ ok: true }>(`${PROMPTS_SYNC_SERVER}/prompts/upsert-many`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: payload }),
    });
  }

  private async ensureLegacyMigration(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(LEGACY_PROMPTS_MIGRATION_KEY) === '1') return;
    if (this.migrationPromise) return this.migrationPromise;

    this.migrationPromise = (async () => {
      try {
        const table = (await getDb()).prompts;
        const legacy = await table.where({ userId }).toArray();
        if (legacy.length > 0) {
          await this.upsertManyShared(legacy);
        }
        localStorage.setItem(LEGACY_PROMPTS_MIGRATION_KEY, '1');
      } finally {
        this.migrationPromise = null;
      }
    })();

    await this.migrationPromise;
  }

  async getByUser(userId: string): Promise<Prompt[]> {
    await this.ensureLegacyMigration(userId);
    if (isTauriRuntime()) {
      const invoke = await getTauriInvoke();
      const rows = await invoke<SharedPromptRecord[]>('shared_prompts_list', { userId });
      return rows.map(toPrompt);
    }

    try {
      const { prompts } = await fetchJson<{ prompts: SharedPromptRecord[] }>(
        `${PROMPTS_SYNC_SERVER}/prompts?userId=${encodeURIComponent(userId)}`,
      );
      return prompts.map(toPrompt);
    } catch {
      // Fallback for environments without the local sync daemon.
      return (await this.legacyTable()).where({ userId }).reverse().sortBy('updatedAt');
    }
  }

  async getById(id: string): Promise<Prompt | undefined> {
    if (isTauriRuntime()) {
      const invoke = await getTauriInvoke();
      const row = await invoke<SharedPromptRecord | null>('shared_prompts_get', { id });
      return row ? toPrompt(row) : undefined;
    }

    try {
      const res = await fetch(`${PROMPTS_SYNC_SERVER}/prompts/${encodeURIComponent(id)}`);
      if (res.status === 404) return undefined;
      if (!res.ok) {
        throw new Error(`Prompt fetch failed: ${res.status}`);
      }
      const { prompt } = (await res.json()) as { prompt: SharedPromptRecord };
      return toPrompt(prompt);
    } catch {
      return (await this.legacyTable()).get(id);
    }
  }

  async create(entity: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prompt> {
    const now = new Date();
    const prompt: Prompt = {
      ...entity,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const payload = toSharedPrompt(prompt);

    if (isTauriRuntime()) {
      const invoke = await getTauriInvoke();
      const created = await invoke<SharedPromptRecord>('shared_prompts_create', { item: payload });
      return toPrompt(created);
    }

    try {
      const { prompt: created } = await fetchJson<{ prompt: SharedPromptRecord }>(
        `${PROMPTS_SYNC_SERVER}/prompts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      return toPrompt(created);
    } catch {
      await (await this.legacyTable()).add(prompt);
      return prompt;
    }
  }

  async update(id: string, changes: PromptPatch): Promise<Prompt | undefined> {
    const payload: Record<string, unknown> = { ...changes, updatedAt: new Date().toISOString() };
    if (changes.updatedAt instanceof Date) {
      payload.updatedAt = changes.updatedAt.toISOString();
    }

    if (isTauriRuntime()) {
      const invoke = await getTauriInvoke();
      const updated = await invoke<SharedPromptRecord | null>('shared_prompts_update', {
        id,
        changes: payload,
      });
      return updated ? toPrompt(updated) : undefined;
    }

    try {
      const res = await fetch(`${PROMPTS_SYNC_SERVER}/prompts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 404) return undefined;
      if (!res.ok) {
        throw new Error(`Prompt update failed: ${res.status}`);
      }
      const { prompt } = (await res.json()) as { prompt: SharedPromptRecord };
      return toPrompt(prompt);
    } catch {
      const t = await this.legacyTable();
      await t.update(id, {
        ...(changes as Partial<Prompt>),
        updatedAt: new Date(),
      });
      return t.get(id);
    }
  }

  async delete(id: string): Promise<void> {
    if (isTauriRuntime()) {
      const invoke = await getTauriInvoke();
      await invoke('shared_prompts_delete', { id });
      return;
    }
    try {
      await fetchJson<{ ok: true }>(`${PROMPTS_SYNC_SERVER}/prompts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      await (await this.legacyTable()).delete(id);
    }
  }

  async getByCategory(userId: string, category: string): Promise<Prompt[]> {
    const prompts = await this.getByUser(userId);
    return prompts.filter((p) => p.category === category);
  }

  async getFavorites(userId: string): Promise<Prompt[]> {
    const prompts = await this.getByUser(userId);
    return prompts.filter((p) => p.isFavorite);
  }

  async search(userId: string, query: string): Promise<Prompt[]> {
    const prompts = await this.getByUser(userId);
    const q = query.toLowerCase();
    return prompts.filter((p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
  }
}

class PromptTemplatesRepository extends BaseRepository<PromptTemplate> {
  constructor() {
    super(async () => (await getDb()).promptTemplates);
  }
}

export const promptsRepo = new PromptsRepository();
export const promptTemplatesRepo = new PromptTemplatesRepository();
