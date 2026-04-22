import { getDb } from '@/lib/db';
import { BaseRepository } from './base';
import type { Note, NoteVersion } from '@/types';

class NotesRepository extends BaseRepository<Note> {
  constructor() {
    super(async () => (await getDb()).notes);
  }

  async getByUser(userId: string, includeDeleted = false): Promise<Note[]> {
    const t = await this.table();
    if (includeDeleted) {
      return t.where('userId').equals(userId).reverse().sortBy('updatedAt');
    }
    return t
      .where({ userId })
      .filter((n) => !n.deletedAt)
      .reverse()
      .sortBy('updatedAt');
  }

  async getByNotebook(notebookId: string): Promise<Note[]> {
    const t = await this.table();
    return t
      .where({ notebookId })
      .filter((n) => !n.deletedAt && n.status !== 'archived')
      .reverse()
      .sortBy('updatedAt');
  }

  async getFavorites(userId: string): Promise<Note[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .filter((n) => n.isFavorite && !n.deletedAt)
      .reverse()
      .sortBy('updatedAt');
  }

  async getPinned(userId: string): Promise<Note[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .filter((n) => n.isPinned && !n.deletedAt)
      .reverse()
      .sortBy('updatedAt');
  }

  async getRecent(userId: string, limit = 20): Promise<Note[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .filter((n) => !n.deletedAt)
      .reverse()
      .sortBy('updatedAt')
      .then((items) => items.slice(0, limit));
  }

  async getArchived(userId: string): Promise<Note[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .filter((n) => !!n.archivedAt && !n.deletedAt)
      .reverse()
      .sortBy('updatedAt');
  }

  async getTrash(userId: string): Promise<Note[]> {
    const t = await this.table();
    return t
      .where({ userId })
      .filter((n) => !!n.deletedAt)
      .reverse()
      .sortBy('deletedAt');
  }

  async softDelete(id: string): Promise<void> {
    const t = await this.table();
    await t.update(id as unknown as Parameters<typeof t.update>[0], { deletedAt: new Date(), updatedAt: new Date() } as unknown as Parameters<typeof t.update>[1]);
  }

  async restore(id: string): Promise<void> {
    const t = await this.table();
    await t.update(id as unknown as Parameters<typeof t.update>[0], { deletedAt: undefined, archivedAt: undefined, updatedAt: new Date() } as unknown as Parameters<typeof t.update>[1]);
  }

  async archive(id: string): Promise<void> {
    const t = await this.table();
    await t.update(id as unknown as Parameters<typeof t.update>[0], { archivedAt: new Date(), updatedAt: new Date() } as unknown as Parameters<typeof t.update>[1]);
  }

  async unarchive(id: string): Promise<void> {
    const t = await this.table();
    await t.update(id as unknown as Parameters<typeof t.update>[0], { archivedAt: undefined, updatedAt: new Date() } as unknown as Parameters<typeof t.update>[1]);
  }

  async pin(id: string, pinned: boolean): Promise<void> {
    const t = await this.table();
    await t.update(id as unknown as Parameters<typeof t.update>[0], { isPinned: pinned, updatedAt: new Date() } as unknown as Parameters<typeof t.update>[1]);
  }

  async favorite(id: string, favorite: boolean): Promise<void> {
    const t = await this.table();
    await t.update(id as unknown as Parameters<typeof t.update>[0], { isFavorite: favorite, updatedAt: new Date() } as unknown as Parameters<typeof t.update>[1]);
  }

  async search(userId: string, query: string): Promise<Note[]> {
    const t = await this.table();
    const q = query.toLowerCase();
    return t
      .where({ userId })
      .filter((n) => !n.deletedAt && (
        n.title.toLowerCase().includes(q) ||
        (n.plainTextExtract?.toLowerCase().includes(q) ?? false)
      ))
      .reverse()
      .sortBy('updatedAt');
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
