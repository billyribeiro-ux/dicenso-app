import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { Prompt, PromptTemplate } from '@/types';

class PromptsRepository extends BaseRepository<Prompt> {
  constructor() {
    super(async () => (await getDb()).prompts);
  }

  async getByUser(userId: string): Promise<Prompt[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .reverse()
      .sortBy('updatedAt');
  }

  async getByCategory(userId: string, category: string): Promise<Prompt[]> {
    const t = await this.table();
    return t
      .where({ userId, category })
      .reverse()
      .sortBy('updatedAt');
  }

  async getFavorites(userId: string): Promise<Prompt[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .filter((p) => p.isFavorite)
      .reverse()
      .sortBy('updatedAt');
  }

  async search(userId: string, query: string): Promise<Prompt[]> {
    const t = await this.table();
    const q = query.toLowerCase();
    return t
      .where({ userId })
      .filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q)
      )
      .reverse()
      .sortBy('updatedAt');
  }
}

class PromptTemplatesRepository extends BaseRepository<PromptTemplate> {
  constructor() {
    super(async () => (await getDb()).promptTemplates);
  }
}

export const promptsRepo = new PromptsRepository();
export const promptTemplatesRepo = new PromptTemplatesRepository();
