import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { Tag, EntityTag, Notebook } from '@/types';

class TagsRepository extends BaseRepository<Tag> {
  constructor() {
    super(async () => (await getDb()).tags);
  }

  async getByWorkspace(workspaceId: string): Promise<Tag[]> {
    const t = await this.table();
    return t
      .where({ workspaceId })
      .sortBy('name');
  }

  async getByName(workspaceId: string, name: string): Promise<Tag | undefined> {
    const t = await this.table();
    const normalized = name.toLowerCase().trim();
    return t
      .where({ workspaceId, normalizedName: normalized })
      .first();
  }
}

class EntityTagsRepository extends BaseRepository<EntityTag> {
  constructor() {
    super(async () => (await getDb()).entityTags);
  }

  async getByEntity(entityType: string, entityId: string): Promise<EntityTag[]> {
    const t = await this.table();
    return t.where({ entityType, entityId }).toArray();
  }

  async getByTag(tagId: string): Promise<EntityTag[]> {
    const t = await this.table();
    return t.where({ tagId }).toArray();
  }

  async removeFromEntity(entityType: string, entityId: string): Promise<void> {
    const t = await this.table();
    const records = await this.getByEntity(entityType, entityId);
    await t.bulkDelete(records.map((r) => r.id) as unknown as Parameters<typeof t.bulkDelete>[0]);
  }
}

class NotebooksRepository extends BaseRepository<Notebook> {
  constructor() {
    super(async () => (await getDb()).notebooks);
  }

  async getByWorkspace(workspaceId: string): Promise<Notebook[]> {
    const t = await this.table();
    return t
      .where({ workspaceId })
      .sortBy('orderIndex');
  }
}

export const tagsRepo = new TagsRepository();
export const entityTagsRepo = new EntityTagsRepository();
export const notebooksRepo = new NotebooksRepository();
