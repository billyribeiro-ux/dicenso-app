import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { Note, NoteVersion } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  createShared,
  deleteShared,
  getSharedById,
  listShared,
  updateShared,
  upsertManyShared,
} from '@/lib/shared-entity-client';

const LEGACY_NOTES_MIGRATION_KEY = 'dicenso:notes-migrated:v1';
const NOTE_DATE_FIELDS = ['createdAt', 'updatedAt', 'archivedAt', 'deletedAt'] as const;

class NotesRepository {
  private migrationPromise: Promise<void> | null = null;

  private async legacyTable() {
    return (await getDb()).notes;
  }

  private async ensureLegacyMigration(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(LEGACY_NOTES_MIGRATION_KEY) === '1') return;
    if (this.migrationPromise) return this.migrationPromise;

    this.migrationPromise = (async () => {
      try {
        const legacy = await (await this.legacyTable()).where({ userId }).toArray();
        if (legacy.length > 0) {
          await upsertManyShared('notes', legacy, NOTE_DATE_FIELDS);
        }
        localStorage.setItem(LEGACY_NOTES_MIGRATION_KEY, '1');
      } finally {
        this.migrationPromise = null;
      }
    })();
    await this.migrationPromise;
  }

  async getById(id: string): Promise<Note | undefined> {
    try {
      return await getSharedById<Note>('notes', id, NOTE_DATE_FIELDS);
    } catch {
      return (await this.legacyTable()).get(id);
    }
  }

  async create(entity: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const now = new Date();
    const note: Note = { ...entity, id: uuidv4(), createdAt: now, updatedAt: now };
    try {
      return await createShared<Note>('notes', note, NOTE_DATE_FIELDS);
    } catch {
      await (await this.legacyTable()).add(note);
      return note;
    }
  }

  async update(
    id: string,
    changes: Partial<Omit<Note, 'id' | 'createdAt'>>,
  ): Promise<Note | undefined> {
    const payload: Record<string, unknown> = { ...changes, updatedAt: new Date() };
    try {
      return await updateShared<Note>('notes', id, payload, NOTE_DATE_FIELDS);
    } catch {
      const t = await this.legacyTable();
      await t.update(id, { ...(changes as Partial<Note>), updatedAt: new Date() });
      return t.get(id);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteShared('notes', id);
    } catch {
      await (await this.legacyTable()).delete(id);
    }
  }

  async getByUser(userId: string, includeDeleted = false): Promise<Note[]> {
    await this.ensureLegacyMigration(userId);
    let all: Note[];
    try {
      all = await listShared<Note>('notes', userId, NOTE_DATE_FIELDS);
    } catch {
      all = await (await this.legacyTable()).where('userId').equals(userId).reverse().sortBy('updatedAt');
    }
    if (includeDeleted) return all;
    return all.filter((n) => !n.deletedAt);
  }

  async getByNotebook(notebookId: string): Promise<Note[]> {
    const t = await this.legacyTable();
    return t.where({ notebookId }).filter((n) => !n.deletedAt && n.status !== 'archived').reverse().sortBy('updatedAt');
  }

  async getFavorites(userId: string): Promise<Note[]> {
    const all = await this.getByUser(userId);
    return all.filter((n) => n.isFavorite && !n.deletedAt);
  }

  async getPinned(userId: string): Promise<Note[]> {
    const all = await this.getByUser(userId);
    return all.filter((n) => n.isPinned && !n.deletedAt);
  }

  async getRecent(userId: string, limit = 20): Promise<Note[]> {
    return (await this.getByUser(userId)).slice(0, limit);
  }

  async getArchived(userId: string): Promise<Note[]> {
    const all = await this.getByUser(userId);
    return all.filter((n) => !!n.archivedAt && !n.deletedAt);
  }

  async getTrash(userId: string): Promise<Note[]> {
    const all = await this.getByUser(userId, true);
    return all
      .filter((n) => !!n.deletedAt)
      .sort((a, b) => (b.deletedAt?.getTime() ?? 0) - (a.deletedAt?.getTime() ?? 0));
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { deletedAt: new Date() });
  }

  async restore(id: string): Promise<void> {
    await this.update(id, { deletedAt: undefined, archivedAt: undefined });
  }

  async archive(id: string): Promise<void> {
    await this.update(id, { archivedAt: new Date() });
  }

  async unarchive(id: string): Promise<void> {
    await this.update(id, { archivedAt: undefined });
  }

  async pin(id: string, pinned: boolean): Promise<void> {
    await this.update(id, { isPinned: pinned });
  }

  async favorite(id: string, favorite: boolean): Promise<void> {
    await this.update(id, { isFavorite: favorite });
  }

  async search(userId: string, query: string): Promise<Note[]> {
    const all = await this.getByUser(userId);
    const q = query.toLowerCase();
    return all.filter(
      (n) =>
        !n.deletedAt &&
        (n.title.toLowerCase().includes(q) || (n.plainTextExtract?.toLowerCase().includes(q) ?? false)),
    );
  }
}

class NoteVersionsRepository extends BaseRepository<NoteVersion> {
  constructor() {
    super(async () => (await getDb()).noteVersions);
  }

  async getByNote(noteId: string, limit = 50): Promise<NoteVersion[]> {
    const t = await this.table();
    return t
      .where({ noteId })
      .reverse()
      .sortBy('createdAt')
      .then((items) => items.slice(0, limit));
  }

  async createVersion(note: Note): Promise<NoteVersion> {
    return this.create({
      noteId: note.id,
      editorJson: note.editorJson,
      plainTextExtract: note.plainTextExtract,
      createdBy: note.userId,
    });
  }
}

export const notesRepo = new NotesRepository();
export const noteVersionsRepo = new NoteVersionsRepository();
