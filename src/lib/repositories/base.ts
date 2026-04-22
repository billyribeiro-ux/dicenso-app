import type { EntityTable } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import type { BaseEntity } from '@/types';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: keyof BaseEntity | string;
  order?: 'asc' | 'desc';
}

export type TableFactory<T extends BaseEntity> = () => Promise<EntityTable<T, 'id'>>;

/**
 * Base class for Dexie-backed repositories.
 *
 * Dexie is browser-only (IndexedDB). We therefore **defer** resolving the table
 * until the first call — constructing a repo must be safe at module load on the
 * server too (it can be imported by any shared module).
 */
export class BaseRepository<T extends BaseEntity> {
  private tablePromise: Promise<EntityTable<T, 'id'>> | null = null;

  constructor(private readonly tableFactory: TableFactory<T>) {}

  protected async table(): Promise<EntityTable<T, 'id'>> {
    if (typeof window === 'undefined') {
      throw new Error(
        'Repository accessed on the server. Access data from client components only.',
      );
    }
    if (!this.tablePromise) {
      this.tablePromise = this.tableFactory();
    }
    return this.tablePromise;
  }

  async getById(id: string): Promise<T | undefined> {
    const t = await this.table();
    return t.get(id as unknown as Parameters<typeof t.get>[0]);
  }

  async getAll(options?: QueryOptions): Promise<T[]> {
    const t = await this.table();
    let collection = options?.orderBy
      ? options.order === 'desc'
        ? t.orderBy(String(options.orderBy)).reverse()
        : t.orderBy(String(options.orderBy))
      : t.toCollection();
    if (options?.offset) collection = collection.offset(options.offset);
    if (options?.limit) collection = collection.limit(options.limit);
    return collection.toArray();
  }

  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const t = await this.table();
    const now = new Date();
    const full = {
      ...entity,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    } as T;
    await t.add(full);
    return full;
  }

  async update(
    id: string,
    changes: Partial<Omit<T, 'id' | 'createdAt'>>,
  ): Promise<T | undefined> {
    const t = await this.table();
    const now = new Date();
    await t.update(
      id as unknown as Parameters<typeof t.update>[0],
      { ...changes, updatedAt: now } as Parameters<typeof t.update>[1],
    );
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
