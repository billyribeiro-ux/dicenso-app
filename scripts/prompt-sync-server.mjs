import { createServer } from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const HOST = '127.0.0.1';
const PORT = Number(process.env.DICENSO_PROMPTS_SYNC_PORT || 4546);

const STORE_DIR = join(homedir(), '.dicenso');
const STORE_FILE = join(STORE_DIR, 'shared-entities.json');
const STORE_TMP_FILE = join(STORE_DIR, 'shared-entities.tmp.json');
const LEGACY_PROMPTS_FILE = join(STORE_DIR, 'shared-prompts.json');

const ALLOWED_COLLECTIONS = new Set(['prompts', 'notes', 'tasks', 'lessons']);

async function ensureStoreDir() {
  await mkdir(STORE_DIR, { recursive: true });
}

function emptyStore() {
  return {
    version: 1,
    collections: { prompts: [], notes: [], tasks: [], lessons: [] },
  };
}

function normalizeStore(parsed) {
  const store = emptyStore();
  if (parsed && typeof parsed === 'object' && parsed.collections && typeof parsed.collections === 'object') {
    for (const collection of ALLOWED_COLLECTIONS) {
      if (Array.isArray(parsed.collections[collection])) {
        store.collections[collection] = parsed.collections[collection];
      }
    }
  }
  return store;
}

async function readStore() {
  await ensureStoreDir();
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    return normalizeStore(JSON.parse(raw));
  } catch {
    try {
      const rawLegacy = await readFile(LEGACY_PROMPTS_FILE, 'utf8');
      const legacy = JSON.parse(rawLegacy);
      const migrated = emptyStore();
      if (Array.isArray(legacy.prompts)) {
        migrated.collections.prompts = legacy.prompts;
      }
      await writeStore(migrated);
      return migrated;
    } catch {
      return emptyStore();
    }
  }
}

async function writeStore(store) {
  await ensureStoreDir();
  await writeFile(STORE_TMP_FILE, JSON.stringify(store, null, 2), 'utf8');
  await rename(STORE_TMP_FILE, STORE_FILE);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function getCollectionName(segments) {
  if (segments[0] !== 'entities') return null;
  const collection = segments[1];
  if (!collection || !ALLOWED_COLLECTIONS.has(collection)) return null;
  return collection;
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) return sendJson(res, 400, { error: 'Bad request' });

  if (req.method === 'OPTIONS') return sendJson(res, 204, {});

  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const segments = url.pathname.split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true });
    }

    const collection = getCollectionName(segments);

    if (req.method === 'GET' && collection && segments.length === 2) {
      const userId = url.searchParams.get('userId');
      if (!userId) return sendJson(res, 400, { error: 'userId is required' });
      const store = await readStore();
      const items = store.collections[collection]
        .filter((item) => item.userId === userId)
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      return sendJson(res, 200, { items });
    }

    if (req.method === 'GET' && collection && segments.length === 3) {
      const id = decodeURIComponent(segments[2]);
      const store = await readStore();
      const item = store.collections[collection].find((value) => value.id === id);
      if (!item) return sendJson(res, 404, { error: 'Not found' });
      return sendJson(res, 200, { item });
    }

    if (req.method === 'POST' && collection && segments.length === 2) {
      const body = await readBody(req);
      const item = body.item ?? body;
      const store = await readStore();
      store.collections[collection] = store.collections[collection].filter((value) => value.id !== item.id);
      store.collections[collection].push(item);
      await writeStore(store);
      return sendJson(res, 201, { item });
    }

    if (req.method === 'POST' && collection && segments.length === 3 && segments[2] === 'upsert-many') {
      const body = await readBody(req);
      const items = Array.isArray(body.items) ? body.items : [];
      const store = await readStore();
      for (const item of items) {
        store.collections[collection] = store.collections[collection].filter((value) => value.id !== item.id);
        store.collections[collection].push(item);
      }
      await writeStore(store);
      return sendJson(res, 200, { ok: true, count: items.length });
    }

    if (req.method === 'PATCH' && collection && segments.length === 3) {
      const id = decodeURIComponent(segments[2]);
      const body = await readBody(req);
      const changes = body.changes ?? body;
      const store = await readStore();
      const idx = store.collections[collection].findIndex((value) => value.id === id);
      if (idx < 0) return sendJson(res, 404, { error: 'Not found' });
      const existing = store.collections[collection][idx];
      const updated = {
        ...existing,
        ...changes,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: changes.updatedAt || new Date().toISOString(),
      };
      store.collections[collection][idx] = updated;
      await writeStore(store);
      return sendJson(res, 200, { item: updated });
    }

    if (req.method === 'DELETE' && collection && segments.length === 3) {
      const id = decodeURIComponent(segments[2]);
      const store = await readStore();
      store.collections[collection] = store.collections[collection].filter((value) => value.id !== id);
      await writeStore(store);
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Internal server error',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[prompt-sync] listening on http://${HOST}:${PORT}`);
});

