import 'server-only';

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import type { SharedPromptRecord } from '@/lib/shared-prompts';

interface SharedPromptsFile {
  version: 1;
  prompts: SharedPromptRecord[];
}

const STORE_DIR = path.join(homedir(), '.dicenso');
const STORE_FILE = path.join(STORE_DIR, 'shared-prompts.json');
const STORE_TMP_FILE = path.join(STORE_DIR, 'shared-prompts.tmp.json');

async function ensureStoreDir(): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
}

async function readStore(): Promise<SharedPromptsFile> {
  await ensureStoreDir();

  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as SharedPromptsFile;
    if (!Array.isArray(parsed.prompts)) {
      return { version: 1, prompts: [] };
    }
    return parsed;
  } catch {
    return { version: 1, prompts: [] };
  }
}

async function writeStore(store: SharedPromptsFile): Promise<void> {
  await ensureStoreDir();
  await writeFile(STORE_TMP_FILE, JSON.stringify(store, null, 2), 'utf8');
  await rename(STORE_TMP_FILE, STORE_FILE);
}

export async function listSharedPrompts(userId: string): Promise<SharedPromptRecord[]> {
  const store = await readStore();
  return store.prompts
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSharedPrompt(id: string): Promise<SharedPromptRecord | undefined> {
  const store = await readStore();
  return store.prompts.find((p) => p.id === id);
}

export async function upsertSharedPrompts(items: SharedPromptRecord[]): Promise<void> {
  if (items.length === 0) return;

  const store = await readStore();
  const byId = new Map(store.prompts.map((p) => [p.id, p]));

  for (const item of items) {
    byId.set(item.id, item);
  }

  store.prompts = Array.from(byId.values());
  await writeStore(store);
}

export async function createSharedPrompt(item: SharedPromptRecord): Promise<SharedPromptRecord> {
  await upsertSharedPrompts([item]);
  return item;
}

export async function updateSharedPrompt(
  id: string,
  changes: Partial<Omit<SharedPromptRecord, 'id' | 'createdAt'>>,
): Promise<SharedPromptRecord | undefined> {
  const store = await readStore();
  const idx = store.prompts.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;

  const existing = store.prompts[idx];
  const updated: SharedPromptRecord = {
    ...existing,
    ...changes,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: changes.updatedAt ?? new Date().toISOString(),
  };
  store.prompts[idx] = updated;
  await writeStore(store);
  return updated;
}

export async function deleteSharedPrompt(id: string): Promise<void> {
  const store = await readStore();
  const next = store.prompts.filter((p) => p.id !== id);
  if (next.length === store.prompts.length) return;
  store.prompts = next;
  await writeStore(store);
}

