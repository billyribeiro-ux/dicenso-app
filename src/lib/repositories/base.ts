import type { EntityTable } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import type { BaseEntity } from '@/types';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export class BaseRepository<T extends BaseEntity> {
  private tablePromise: Promise<EntityTable<T, 'id'>>;

  constructor(tableFactory: () => Promise<EntityTable<T, 'id'>>) {
    this.tablePromise = tableFactory();
  }

  protected async table(): Promise<EntityTable<T, 'id'>> {
    return this.tablePromise;
  }

  async getById(id: string): Promise<T | undefined> {
    const t = await this.table();
    return t.get(id as unknown as Parameters<typeof t.get>[0]);
  }

  async getAll(options?: QueryOptions): Promise<T[]> {
    const t = await this.table();
    let collection = t.toCollection();
    if (options?.orderBy) {
      collection = options.order === 'desc'
        ? t.orderBy(options.orderBy).reverse()
        : t.orderBy(options.orderBy);
    }
    if (options?.offset) {
      collection = collection.offset(options.offset);
    }
    if (options?.limit) {
      collection = collection.limit(options.limit);
    }
    return collection.toArray();
  }

  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const t = await this.table();
    const now = new Date();
    const id = uuidv4();
    const full = {
      ...entity,
      id,
      createdAt: now,
      updatedAt: now,
    } as T;
    await t.add(full);
    return full;
  }

  async update(id: string, changes: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T | undefined> {
    const t = await this.table();
    const now = new Date();
    await t.update(id as unknown as Parameters<typeof t.update>[0], { ...changes, updatedAt: now } as unknown as Parameters<typeof t.update>[1]);
    return t.get(id as unknown as Parameters<typeof t.get>[0]);
  }

  async delete(id: string): Promise<void> {
    const t = await this.table();
    await t.delete(id as unknown as Parameters<typeof t.delete>[0]);
  }

  async count(): Promise<number> {
    const t = await this.table();
    return t.count();
  }
}
