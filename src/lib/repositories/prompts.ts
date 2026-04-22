import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { Prompt, PromptTemplate } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  createShared,
  deleteShared,
  getSharedById,
  listShared,
  updateShared,
  upsertManyShared,
} from '@/lib/shared-entity-client';

const LEGACY_PROMPTS_MIGRATION_KEY = 'dicenso:prompts-migrated:v1';
const PROMPT_DATE_FIELDS = ['createdAt', 'updatedAt'] as const;

class PromptsRepository {
  private migrationPromise: Promise<void> | null = null;

  private async legacyTable() {
    return (await getDb()).prompts;
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
          await upsertManyShared('prompts', legacy, PROMPT_DATE_FIELDS);
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
    try {
      return await listShared<Prompt>('prompts', userId, PROMPT_DATE_FIELDS);
    } catch {
      // Fallback for environments without the local sync daemon.
      return (await this.legacyTable()).where({ userId }).reverse().sortBy('updatedAt');
    }
  }

  async getById(id: string): Promise<Prompt | undefined> {
    try {
      return await getSharedById<Prompt>('prompts', id, PROMPT_DATE_FIELDS);
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

    try {
      return await createShared<Prompt>('prompts', prompt, PROMPT_DATE_FIELDS);
    } catch {
      await (await this.legacyTable()).add(prompt);
      return prompt;
    }
  }

  async update(id: string, changes: Partial<Omit<Prompt, 'id' | 'createdAt'>>): Promise<Prompt | undefined> {
    const payload: Record<string, unknown> = { ...changes, updatedAt: new Date().toISOString() };
    if (changes.updatedAt instanceof Date) {
      payload.updatedAt = changes.updatedAt.toISOString();
    }

    try {
      return await updateShared<Prompt>('prompts', id, payload, PROMPT_DATE_FIELDS);
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
    try {
      await deleteShared('prompts', id);
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
