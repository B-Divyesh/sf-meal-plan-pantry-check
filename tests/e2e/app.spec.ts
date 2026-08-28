import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('builds a source-aware pantry-confirmed shopping list', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await page.getByLabel('Recipe name').fill('Tomato pasta');
  await page.getByLabel('Recipe serves').fill('2');
  await page.getByLabel('Source link').fill('https://example.com/pasta');
  await page.getByLabel(/Ingredients/).fill('200 g pasta\n2 tbsp olive oil\n1 onion\nsalt to taste');
  await expect(page.getByText('1 marked for review')).toBeVisible();
  await page.getByRole('button', { name: 'Add recipe' }).click();

  await page.getByRole('button', { name: /Pantry check/ }).click();
  await expect(page.getByRole('heading', { name: 'What’s already home?' })).toBeVisible();
  await page.getByText('olive oil', { exact: true }).click();
  await expect(page.getByText('IN PANTRY · SUBTRACTED')).toBeVisible();

  await page.getByRole('button', { name: /Shopping list/ }).click();
  await expect(page.getByRole('heading', { name: 'The shopping list' })).toBeVisible();
  await expect(page.getByText('olive oil', { exact: true })).toHaveCount(0);
  const pastaRow = page.locator('.ledger-row').filter({ hasText: 'pasta' }).first();
  await pastaRow.getByText('Show the arithmetic').click();
  await expect(pastaRow.getByText('Tomato pasta', { exact: true })).toBeVisible();
});

test('has no serious or critical accessibility findings', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page: page as never }).disableRules(['landmark-unique']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('reloads the saved app while offline', async ({ page, context }) => {
  await page.goto('/');
  await page.getByLabel('Recipe name').fill('Offline soup');
  await page.getByLabel(/Ingredients/).fill('1 onion');
  await page.getByRole('button', { name: 'Add recipe' }).click();
  await expect(page.getByRole('heading', { name: 'Offline soup' })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline edition.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Offline soup' })).toBeVisible();
});
