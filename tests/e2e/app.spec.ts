import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@claim:source-aware-list builds a source-aware pantry-confirmed shopping list', async ({ page }) => {
  await page.goto('/demo');
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
  const pastaRow = page.locator('.row-copy > strong').filter({ hasText: /^pasta$/ }).locator('xpath=ancestor::li');
  await pastaRow.getByText('Show the arithmetic').click();
  await expect(pastaRow.getByText('Tomato pasta', { exact: true })).toBeVisible();
});

test('has no serious or critical accessibility findings', async ({ page }) => {
  await page.goto('/');
  const emptyResults = await new AxeBuilder({ page: page as never }).disableRules(['landmark-unique']).analyze();
  await page.goto('/demo');
  const demoResults = await new AxeBuilder({ page: page as never }).disableRules(['landmark-unique']).analyze();
  const serious = [...emptyResults.violations, ...demoResults.violations].filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(serious).toEqual([]);
});

test('offers a keyboard skip path into the workflow', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('preserves a rejected recipe draft and focuses the invalid source link', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Recipe name').fill('Pasta night');
  await page.getByLabel('Recipe serves').fill('4');
  await page.getByLabel('Source link').fill('javascript:alert(1)');
  await page.getByLabel(/Ingredients/).fill('200 g pasta\n2 tbsp olive oil\nsalt to taste');

  await page.getByRole('button', { name: 'Add recipe' }).click();

  await expect(page.getByRole('alert')).toHaveText('The source link must start with http:// or https://.');
  await expect(page.getByLabel('Recipe name')).toHaveValue('Pasta night');
  await expect(page.getByLabel('Recipe serves')).toHaveValue('4');
  await expect(page.getByLabel('Source link')).toHaveValue('javascript:alert(1)');
  await expect(page.getByLabel(/Ingredients/)).toHaveValue('200 g pasta\n2 tbsp olive oil\nsalt to taste');
  await expect(page.getByLabel('Source link')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Source link')).toHaveAttribute('aria-describedby', 'form-error');
  await expect(page.getByLabel('Source link')).toBeFocused();

  await page.getByLabel('Source link').fill('https://example.com/pasta');
  await page.getByRole('button', { name: 'Add recipe' }).click();
  await expect(page.getByRole('heading', { name: 'Pasta night' })).toBeVisible();
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

test('@claim:offline-reload opens the sample plan again while offline', async ({ page, context }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lemon herb pasta' })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline edition.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lemon herb pasta' })).toBeVisible();
});

test('@claim:csv-export exports every visible shopping line as CSV', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Shopping list/ }).click();
  const expectedRows = await page.locator('.ledger-row').count();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const csv = await (await import('node:fs/promises')).readFile(path!, 'utf8');
  expect(csv.split('\n')[0]).toBe('Group,Item,Quantity,Unit,Picked up,Sources,Source URLs');
  expect(csv.split('\n')).toHaveLength(expectedRows + 1);
  expect(csv).toContain('Lemon herb pasta');
});

test('@claim:demo-isolation keeps sample changes away from the saved ledger and the network', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Recipe name').fill('My real recipe');
  await page.getByLabel(/Ingredients/).fill('1 onion');
  await page.getByRole('button', { name: 'Add recipe' }).click();

  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(page.url()).origin) externalRequests.push(request.url());
  });
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Meal Plan Pantry Check');
  await expect(page.getByRole('heading', { name: 'My real recipe' })).toHaveCount(0);
  await expect(page.locator('.clipping')).toHaveCount(3);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.clipping').first().getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('.clipping')).toHaveCount(2);
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.clipping')).toHaveCount(3);
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.getByRole('heading', { name: 'My real recipe' })).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test('@claim:edition-limits keeps four recipes free and accepts a valid household license', async ({ browser }) => {
  const freeContext = await browser.newContext();
  const freePage = await freeContext.newPage();
  await freePage.goto('/');
  for (let index = 1; index <= 5; index += 1) {
    await freePage.getByLabel('Recipe name').fill(`Recipe ${index}`);
    await freePage.getByLabel(/Ingredients/).fill(`${index} onions`);
    await freePage.getByRole('button', { name: 'Add recipe' }).click();
  }
  await expect(freePage.locator('.clipping')).toHaveCount(4);
  await expect(freePage.getByRole('alert')).toContainText('free edition holds four recipes');
  await expect(freePage.getByRole('link', { name: 'Buy once for $9' })).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/checkout');
  await freeContext.close();

  const paidContext = await browser.newContext();
  const paidPage = await paidContext.newPage();
  await paidPage.route('https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/verify?license=test-household-license', (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await paidPage.goto('/?license=test-household-license');
  await expect(paidPage.getByRole('heading', { name: 'Ledger unlocked' })).toBeVisible();
  for (let index = 1; index <= 5; index += 1) {
    await paidPage.getByLabel('Recipe name').fill(`Licensed recipe ${index}`);
    await paidPage.getByLabel(/Ingredients/).fill(`${index} carrots`);
    await paidPage.getByRole('button', { name: 'Add recipe' }).click();
  }
  await expect(paidPage.locator('.clipping')).toHaveCount(5);
  await paidContext.close();
});
