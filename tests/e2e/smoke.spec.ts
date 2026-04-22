import { test, expect } from '@playwright/test';

test('homepage redirects to today', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/.*today/);
});

test('today page renders', async ({ page }) => {
  await page.goto('/today');
  await expect(page.getByRole('heading', { name: /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/ })).toBeVisible();
});

test('command palette opens with Cmd+K', async ({ page }) => {
  await page.goto('/today');
  await page.keyboard.press('Meta+k');
  await expect(page.getByText('Command Palette')).toBeVisible();
});

test('navigation to notes works', async ({ page }) => {
  await page.goto('/today');
  await page.click('text=Notes');
  await expect(page).toHaveURL(/.*notes/);
  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
});

test('quick capture modal opens', async ({ page }) => {
  await page.goto('/today');
  await page.keyboard.press('Meta+Shift+n');
  await expect(page.getByRole('dialog')).toContainText('Quick Capture');
});
