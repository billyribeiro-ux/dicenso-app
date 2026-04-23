import { test, expect } from '@playwright/test';

/**
 * Forensic reproduction of the Next.js dev-only warnings:
 *   - "The keys of `searchParams` were accessed directly..."
 *   - "params are being enumerated..."
 *
 * These only fire in dev (NODE_ENV=development) via params.browser.dev.js /
 * search-params.browser.dev.js Proxy traps (ownKeys). We load every app route
 * with a fresh console listener and assert NONE of these messages appear.
 *
 * The Playwright webServer runs `pnpm dev`, so dev-mode is guaranteed.
 */

const ROUTES = [
  '/today',
  '/notes',
  '/tasks',
  '/prompts',
  '/lessons',
  '/search',
  '/favorites',
  '/trash',
  '/brainstorm',
  '/settings',
];

async function navigateAndSettle(page: import('@playwright/test').Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Give React a beat to render and any effects to run
  await page.waitForTimeout(400);
}

function isOffender(text: string) {
  return (
    text.includes('params are being enumerated') ||
    text.includes('The keys of `searchParams` were accessed directly') ||
    text.includes('A param property was accessed directly') ||
    text.includes('A searchParam property was accessed directly')
  );
}

test.describe('No sync-dynamic-api warnings on client pages (dev)', () => {
  for (const route of ROUTES) {
    test(`route ${route} emits no params/searchParams warnings`, async ({ page }) => {
      const offenders: { type: string; text: string; stack?: string }[] = [];
      page.on('console', (msg) => {
        if (msg.type() !== 'error' && msg.type() !== 'warning') return;
        const text = msg.text();
        if (isOffender(text)) {
          offenders.push({
            type: msg.type(),
            text,
            stack: msg.location()
              ? `${msg.location().url}:${msg.location().lineNumber}`
              : undefined,
          });
        }
      });

      await navigateAndSettle(page, route);
      expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
    });
  }
});

test.describe('UI overlays do not emit sync-dynamic-api warnings', () => {
  test('command palette open/close', async ({ page }) => {
    const offenders: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        if (isOffender(msg.text())) offenders.push(msg.text());
      }
    });
    await navigateAndSettle(page, '/today');
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    expect(offenders).toEqual([]);
  });

  test('quick capture open/close', async ({ page }) => {
    const offenders: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        if (isOffender(msg.text())) offenders.push(msg.text());
      }
    });
    await navigateAndSettle(page, '/today');
    await page.keyboard.press('Meta+Shift+n');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    expect(offenders).toEqual([]);
  });
});

test.describe('Detail navigation does not emit sync-dynamic-api warnings', () => {
  const flows = [
    { list: '/prompts', create: '/prompts/new', titleSelector: 'input[placeholder*="title" i]' },
    { list: '/notes', create: '/notes/new', titleSelector: 'input[placeholder*="title" i]' },
    { list: '/tasks', create: '/tasks/new', titleSelector: 'input[placeholder*="title" i]' },
    { list: '/lessons', create: '/lessons/new', titleSelector: 'input[placeholder*="title" i]' },
  ];

  for (const flow of flows) {
    test(`navigate ${flow.list} -> detail`, async ({ page }) => {
      const offenders: { text: string; stack?: string }[] = [];
      page.on('console', (msg) => {
        if (msg.type() !== 'error' && msg.type() !== 'warning') return;
        const text = msg.text();
        if (isOffender(text)) {
          const loc = msg.location();
          offenders.push({
            text,
            stack: loc ? `${loc.url}:${loc.lineNumber}` : undefined,
          });
        }
      });

      await navigateAndSettle(page, flow.list);
      // Seed one item so we have something to click into
      await page.goto(flow.create, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      const input = page.locator(flow.titleSelector).first();
      if (await input.count()) {
        await input.fill(`spec-${Date.now()}`);
        const save =
          page.getByRole('button', { name: /save|create|add/i }).first();
        if (await save.count()) {
          await save.click().catch(() => {});
        }
      }
      await page.waitForTimeout(600);
      await navigateAndSettle(page, flow.list);
      const firstCard = page
        .locator('a[href^="' + flow.list + '/"]:not([href$="/new"])')
        .first();
      if (await firstCard.count()) {
        await firstCard.click();
        await page.waitForTimeout(800);
      }

      expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
    });
  }
});
