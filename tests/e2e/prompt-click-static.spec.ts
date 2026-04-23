import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';

/**
 * Reproduces the Tauri symptom by serving the static export in `out/` with a
 * plain HTTP server. This mirrors Tauri's asset protocol behavior: real file
 * or 404 — no SPA fallback.
 *
 * The test flow mirrors what a user does:
 *   1. Open /prompts/new, create a prompt via the app UI
 *   2. Navigate back to /prompts/, click the card
 *   3. Assert we land on /prompts/<id>, NOT /today
 */

const PORT = 5150;
const OUT_DIR = path.resolve(__dirname, '..', '..', 'out');
let server: ChildProcess | null = null;

test.beforeAll(async () => {
  server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', OUT_DIR], {
    stdio: 'pipe',
  });
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/today/`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('static server failed to start');
});

test.afterAll(async () => {
  server?.kill();
});

test('click on prompt card stays on /prompts/<id> (does not redirect to /today)', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const base = `http://127.0.0.1:${PORT}`;

  const consoleMsgs: string[] = [];
  page.on('console', (msg) => {
    consoleMsgs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => consoleMsgs.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) =>
    consoleMsgs.push(`[requestfailed] ${req.url()} - ${req.failure()?.errorText}`),
  );

  // Step 1: Seed a prompt via the real UI flow.
  await page.goto(`${base}/prompts/new/`);
  await page.waitForLoadState('domcontentloaded');
  const titleInput = page.locator('input').first();
  await titleInput.waitFor({ state: 'visible', timeout: 8000 });
  await titleInput.fill('E2E Prompt ' + Date.now());
  // The body textarea
  const textarea = page.locator('textarea').first();
  await textarea.fill('prompt body');
  // Save button
  const saveBtn = page.getByRole('button', { name: /save|create/i }).first();
  await saveBtn.click();
  await page.waitForTimeout(800);

  // Step 2: Navigate to list
  await page.goto(`${base}/prompts/`);
  await page.waitForLoadState('domcontentloaded');
  const card = page.locator('a[aria-label^="Open prompt"]').first();
  await card.waitFor({ state: 'visible', timeout: 8000 });
  const href = await card.getAttribute('href');
  console.log('[diag] target href:', href);

  // Step 3: Click the card
  await card.click();

  // Let the router finish
  await page.waitForTimeout(2000);
  const url = page.url();
  console.log('[diag] final url:', url);
  console.log('[diag] tail console:\n' + consoleMsgs.slice(-20).join('\n'));

  // The real assertion
  expect(url).toMatch(/\/prompts\//);
  expect(url).not.toMatch(/\/today\/?$/);
  expect(url).not.toMatch(/\/$/); // not root
});
