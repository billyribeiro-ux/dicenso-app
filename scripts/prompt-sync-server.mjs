import { createServer } from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const HOST = '127.0.0.1';
const PORT = Number(process.env.DICENSO_PROMPTS_SYNC_PORT || 4546);

const STORE_DIR = join(homedir(), '.dicenso');
const STORE_FILE = join(STORE_DIR, 'shared-prompts.json');
const STORE_TMP_FILE = join(STORE_DIR, 'shared-prompts.tmp.json');

async function ensureStoreDir() {
  await mkdir(STORE_DIR, { recursive: true });
}

async function readStore() {
  await ensureStoreDir();
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.prompts)) {
      return { version: 1, prompts: [] };
    }
    return parsed;
  } catch {
    return { version: 1, prompts: [] };
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

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    return sendJson(res, 400, { error: 'Bad request' });
  }

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const segments = url.pathname.split('/').filter(Boolean);

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/prompts') {
      const userId = url.searchParams.get('userId');
      if (!userId) return sendJson(res, 400, { error: 'userId is required' });
      const store = await readStore();
      const prompts = store.prompts
        .filter((p) => p.userId === userId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return sendJson(res, 200, { prompts });
    }

    if (req.method === 'GET' && segments[0] === 'prompts' && segments[1]) {
      const id = decodeURIComponent(segments[1]);
      const store = await readStore();
      const prompt = store.prompts.find((p) => p.id === id);
      if (!prompt) return sendJson(res, 404, { error: 'Not found' });
      return sendJson(res, 200, { prompt });
    }

    if (req.method === 'POST' && url.pathname === '/prompts') {
      const prompt = await readBody(req);
      const store = await readStore();
      store.prompts = store.prompts.filter((p) => p.id !== prompt.id);
      store.prompts.push(prompt);
      await writeStore(store);
      return sendJson(res, 201, { prompt });
    }

    if (req.method === 'POST' && url.pathname === '/prompts/upsert-many') {
      const body = await readBody(req);
      const items = Array.isArray(body.items) ? body.items : [];
      const store = await readStore();
      for (const item of items) {
        store.prompts = store.prompts.filter((p) => p.id !== item.id);
        store.prompts.push(item);
      }
      await writeStore(store);
      return sendJson(res, 200, { ok: true, count: items.length });
    }

    if (req.method === 'PATCH' && segments[0] === 'prompts' && segments[1]) {
      const id = decodeURIComponent(segments[1]);
      const changes = await readBody(req);
      const store = await readStore();
      const idx = store.prompts.findIndex((p) => p.id === id);
      if (idx < 0) return sendJson(res, 404, { error: 'Not found' });
      const existing = store.prompts[idx];
      const updated = {
        ...existing,
        ...changes,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: changes.updatedAt || new Date().toISOString(),
      };
      store.prompts[idx] = updated;
      await writeStore(store);
      return sendJson(res, 200, { prompt: updated });
    }

    if (req.method === 'DELETE' && segments[0] === 'prompts' && segments[1]) {
      const id = decodeURIComponent(segments[1]);
      const store = await readStore();
      store.prompts = store.prompts.filter((p) => p.id !== id);
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

