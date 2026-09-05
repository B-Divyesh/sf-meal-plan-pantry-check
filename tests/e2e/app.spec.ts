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

  const tomatoRecipe = page.locator('.clipping').filter({ has: page.getByRole('heading', { name: 'Tomato pasta' }) });
  await tomatoRecipe.getByLabel('Plan servings').fill('4');
  await tomatoRecipe.getByLabel('Plan servings').press('Enter');

  await page.getByRole('button', { name: /Pantry check/ }).click();
  await expect(page.getByRole('heading', { name: 'What’s already home?' })).toBeVisible();
  await page.getByText('olive oil', { exact: true }).click();
  await expect(page.getByText('IN PANTRY · SUBTRACTED')).toBeVisible();

  await page.getByRole('button', { name: /Shopping list/ }).click();
  await expect(page.getByRole('heading', { name: 'The shopping list' })).toBeVisible();
  await expect(page.getByText('olive oil', { exact: true })).toHaveCount(0);
  const pastaRow = page.locator('.row-copy > strong').filter({ hasText: /^pasta$/ }).locator('xpath=ancestor::li');
  await expect(pastaRow.locator('.quantity > strong')).toHaveText('400');
  await expect(pastaRow.locator('.quantity > small')).toHaveText('g');
  await pastaRow.getByText('Show the arithmetic').click();
  const contribution = pastaRow.locator('details li').filter({ hasText: 'Tomato pasta' });
  await expect(contribution).toContainText('Tomato pasta');
  await expect(contribution).toContainText('400 g');
});

test('@claim:ingredient-parsing exposes uncertainty and normalizes compatible units', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Recipe name').fill('Soup base');
  await page.getByLabel(/Ingredients/).fill('1 cup stock\n250 ml stock\n1 kg carrots\n500 g carrots\nsalt to taste');
  await expect(page.getByText('1 marked for review')).toBeVisible();
  await page.getByRole('button', { name: 'Add recipe' }).click();
  await page.getByText(/5 ingredients · 1 to check/).click();
  const uncertainLine = page.locator('.ingredient-lines li').filter({ has: page.getByText('salt to taste', { exact: true }) });
  await expect(uncertainLine.locator('small')).toContainText('?');
  await expect(uncertainLine.locator('small')).toContainText('salt to taste');
  await expect(uncertainLine.locator('small')).toContainText('CHECK');
  await page.getByRole('button', { name: /Shopping list/ }).click();
  const stockRow = page.locator('.row-copy > strong').filter({ hasText: /^stock$/ }).locator('xpath=ancestor::li');
  await expect(stockRow.locator('.quantity > strong')).toHaveText('490');
  await expect(stockRow.locator('.quantity > small')).toHaveText('ml');
  const carrotRow = page.locator('.row-copy > strong').filter({ hasText: /^carrots$/ }).locator('xpath=ancestor::li');
  await expect(carrotRow.locator('.quantity > strong')).toHaveText('1.5');
  await expect(carrotRow.locator('.quantity > small')).toHaveText('kg');
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

test('states the job, audience, facts, and one-click sample before scrolling', async ({ page }) => {
  await page.goto('/');
  const headline = page.getByRole('heading', { level: 1 });
  await expect(headline).toHaveText('Check recipes against your pantry');
  expect((await headline.innerText()).trim().split(/\s+/)).toHaveLength(5);
  const audience = page.getByText('For home cooks with personal recipes who want one list based only on pantry items they confirm.');
  await expect(audience).toBeVisible();
  expect((await audience.innerText()).trim().split(/\s+/).length).toBeLessThanOrEqual(22);
  await expect(page.locator('.plain-facts li')).toHaveCount(3);
  const sampleAction = page.getByRole('link', { name: 'Try it with sample data' });
  const box = await sampleAction.boundingBox();
  expect(box && box.y + box.height).toBeLessThanOrEqual(844);
  await sampleAction.click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.clipping')).toHaveCount(3);
});

test('moves keyboard focus to each selected workflow heading', async ({ page }) => {
  await page.goto('/demo');
  const pantryStep = page.getByRole('button', { name: /Pantry check/ });
  await pantryStep.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'What’s already home?' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.getByRole('button', { name: /Shopping list/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'The shopping list' })).toBeFocused();
});

test('keeps visible phone links at least 44 CSS pixels in both dimensions', async ({ page }) => {
  for (const path of ['/demo', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(path);
    const shortLinks = await page.locator('a:visible').evaluateAll((links) => links.map((link) => {
      const box = link.getBoundingClientRect();
      return { text: link.textContent?.trim(), width: box.width, height: box.height };
    }).filter((box) => box.width < 44 || box.height < 44));
    expect(shortLinks, path).toEqual([]);
  }
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

test('reloads the saved app while offline', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');
  await page.getByLabel('Recipe name').fill('Offline soup');
  await page.getByLabel(/Ingredients/).fill('1 onion');
  await page.getByRole('button', { name: 'Add recipe' }).click();
  await expect(page.getByRole('heading', { name: 'Offline soup' })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Offline soup' })).toBeVisible();
  await context.close();
});

test('@claim:offline-reload opens the sample plan again while offline', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lemon herb pasta' })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lemon herb pasta' })).toBeVisible();
  await context.close();
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

test('@claim:clipboard-export copies the grouped shopping list with quantities and recipe names', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: (value: string) => { (window as typeof window & { __copied?: string }).__copied = value; return Promise.resolve(); } } });
  });
  await page.goto('/demo');
  await page.getByRole('button', { name: /Shopping list/ }).click();
  await page.getByRole('button', { name: 'Copy list' }).click();
  await expect(page.getByText('Shopping list copied to the clipboard.')).toBeVisible();
  const copied = await page.evaluate(() => (window as typeof window & { __copied?: string }).__copied);
  expect(copied).toContain('PRODUCE');
  expect(copied).toContain('2 each lemons — Lemon herb pasta');
});

test('@claim:print-checklist sends the populated checklist to the browser print path', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => { (window as typeof window & { __printed?: string }).__printed = document.body.innerText; };
  });
  await page.goto('/demo');
  await page.getByRole('button', { name: /Shopping list/ }).click();
  await page.getByRole('button', { name: 'Print checklist' }).click();
  const printed = await page.evaluate(() => (window as typeof window & { __printed?: string }).__printed);
  expect(printed).toContain('The shopping list');
  expect(printed).toContain('spaghetti');
  expect(printed).toContain('400');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.masthead')).toBeHidden();
  await expect(page.locator('.export-bar')).toBeHidden();
  await expect(page.getByText('spaghetti', { exact: true })).toBeVisible();
});

test('@claim:json-backup exports and restores every part of the sample ledger', async ({ page }) => {
  await page.goto('/demo');
  const pasta = page.locator('.clipping').filter({ has: page.getByRole('heading', { name: 'Lemon herb pasta' }) });
  await pasta.getByLabel('Plan servings').fill('8');
  await pasta.getByLabel('Plan servings').press('Enter');
  await page.getByRole('button', { name: /Pantry check/ }).click();
  await page.getByText('spaghetti', { exact: true }).click();
  await page.getByRole('button', { name: /Shopping list/ }).click();
  const lemonsBeforeExport = page.locator('.row-copy > strong').filter({ hasText: /^lemons$/ }).locator('xpath=ancestor::li');
  await lemonsBeforeExport.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Recipes/ }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export recipe backup' }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const backupText = await (await import('node:fs/promises')).readFile(path!, 'utf8');
  const backup = JSON.parse(backupText);
  expect(backup.recipes).toHaveLength(3);
  expect(backup.recipes.find((recipe: { title: string }) => recipe.title === 'Lemon herb pasta')).toMatchObject({ baseServings: 4, targetServings: 8, ingredientsText: expect.stringContaining('400 g spaghetti') });
  expect(Object.values(backup.pantry).some((mark) => (mark as { inPantry: boolean }).inPantry)).toBe(true);
  expect(Object.values(backup.pantry).some((mark) => (mark as { checked: boolean }).checked)).toBe(true);

  await page.getByRole('button', { name: 'Reset demo' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#import-file').setInputFiles(path!);
  await expect(page.getByLabel('Plan servings').first()).toHaveValue('8');
  await page.getByRole('button', { name: /Pantry check/ }).click();
  const spaghetti = page.locator('.row-copy > strong').filter({ hasText: /^spaghetti$/ }).locator('xpath=ancestor::li');
  await expect(spaghetti.getByRole('checkbox')).toBeChecked();
  await page.getByRole('button', { name: /Shopping list/ }).click();
  const lemonsAfterImport = page.locator('.row-copy > strong').filter({ hasText: /^lemons$/ }).locator('xpath=ancestor::li');
  await expect(lemonsAfterImport.getByRole('checkbox')).toBeChecked();
});

test('@claim:pwa-install exposes an installable manifest and a controlling service worker', async ({ page }) => {
  await page.goto('/demo');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const result = await page.evaluate(async () => {
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const manifest = await fetch(manifestLink!.href).then((response) => response.json());
    const registration = await navigator.serviceWorker.getRegistration();
    return { manifest, controlled: Boolean(navigator.serviceWorker.controller), active: Boolean(registration?.active) };
  });
  expect(result.manifest).toMatchObject({ display: 'standalone', start_url: expect.stringContaining('/?source=pwa'), scope: '/' });
  expect(result.manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({ sizes: '192x192' }), expect.objectContaining({ sizes: '512x512', purpose: expect.stringContaining('maskable') })]));
  expect(result).toMatchObject({ controlled: true, active: true });
});

test('installs a waiting service-worker update and keeps the open demo', async ({ page }) => {
  const { readFile, writeFile } = await import('node:fs/promises');
  const workerPath = new URL('../../dist/sw.js', import.meta.url);
  const originalWorker = await readFile(workerPath, 'utf8');
  const updatedWorker = originalWorker.replace('pantry-ledger-v5', 'pantry-ledger-v5-regression');
  expect(updatedWorker).not.toBe(originalWorker);

  await page.goto('/demo');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  try {
    await writeFile(workerPath, updatedWorker);
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
    await expect(page.getByText('An update is ready.')).toBeVisible({ timeout: 15_000 });
    const reloaded = page.waitForEvent('load');
    await page.getByRole('button', { name: 'Install update' }).click();
    await reloaded;
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
    await expect(page.locator('.clipping')).toHaveCount(3);
  } finally {
    await writeFile(workerPath, originalWorker);
  }
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
  await expect(page.getByRole('heading', { name: 'Lemon herb pasta' })).toHaveCount(0);
  await expect(page.locator('.clipping')).toHaveCount(1);
  expect(externalRequests).toEqual([]);
});

test('opens a direct demo without creating real storage or reading a saved license', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('sb_license:meal-plan-pantry-check', 'must-not-be-read-in-demo'));
  const page = await context.newPage();
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') externalRequests.push(request.url());
  });
  await page.goto('/demo');
  await expect(page.locator('.clipping')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Household Edition active' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Plan with more recipes' })).toBeVisible();
  const databaseNames = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databaseNames).not.toContain('meal-plan-pantry-check');
  expect(externalRequests).toEqual([]);
  await context.close();
});

test('@claim:local-privacy stores recipes in IndexedDB without third-party runtime requests', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') externalRequests.push(request.url());
  });
  await page.goto('/');
  await page.getByLabel('Recipe name').fill('Private lentil soup');
  await page.getByLabel('Source link').fill('https://example.invalid/private-lentil-soup');
  await page.getByLabel(/Ingredients/).fill('200 g lentils\n1 onion');
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const recipe = page.locator('.clipping').filter({ has: page.getByRole('heading', { name: 'Private lentil soup' }) });
  await recipe.getByLabel('Plan servings').fill('8');
  await recipe.getByLabel('Plan servings').press('Enter');
  await page.getByRole('button', { name: /Pantry check/ }).click();
  await page.getByText('onion', { exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'What’s already home?' })).toBeVisible();
  await page.getByRole('button', { name: /Recipes/ }).click();
  await expect(page.getByRole('heading', { name: 'Private lentil soup' })).toBeVisible();
  const stored = await page.evaluate(async () => new Promise<{ recipes: Array<{ title: string; targetServings: number }>; pantry: Record<string, { inPantry: boolean }> }>((resolve, reject) => {
    const open = indexedDB.open('meal-plan-pantry-check');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction('ledger').objectStore('ledger').get('current');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    };
  }));
  expect(stored.recipes.map((recipe) => recipe.title)).toContain('Private lentil soup');
  expect(stored.recipes[0].targetServings).toBe(8);
  expect(Object.values(stored.pantry).some((mark) => mark.inPantry)).toBe(true);
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { name: 'How we handle your data' })).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test('handles form, serving, import, and delete recovery paths', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add recipe' }).click();
  await expect(page.getByRole('alert')).toContainText('Add a recipe name');
  await expect(page.getByLabel('Recipe name')).toBeFocused();

  await page.getByLabel('Recipe name').fill('Boundary soup');
  await page.getByLabel(/Ingredients/).fill('1 onion');
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const recipe = page.locator('.clipping').filter({ has: page.getByRole('heading', { name: 'Boundary soup' }) });
  await recipe.getByLabel('Plan servings').fill('-4');
  await recipe.getByLabel('Plan servings').press('Enter');
  await expect(recipe.getByLabel('Plan servings')).toHaveValue('0.25');

  await page.locator('#import-file').setInputFiles({
    name: 'wrong.json', mimeType: 'application/json', buffer: Buffer.from('{"wrong":true}'),
  });
  await expect(page.getByText('That file is not a Pantry Check backup.')).toBeVisible();

  page.once('dialog', (dialog) => dialog.dismiss());
  await recipe.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByRole('heading', { name: 'Boundary soup' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await recipe.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByRole('heading', { name: 'Boundary soup' })).toHaveCount(0);
});

test('keeps phone and desktop layouts within the viewport and removes motion when requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  const phone = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(phone.scroll).toBe(phone.client);
  const motion = await page.locator('.clipping').first().evaluate((element) => {
    const style = getComputedStyle(element);
    const duration = Number.parseFloat(style.animationDuration) * (style.animationDuration.endsWith('ms') ? 1 : 1000);
    return { animationDurationMs: duration, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };
  });
  expect(motion.animationDurationMs).toBeLessThanOrEqual(0.01);
  expect(motion.scrollBehavior).toBe('auto');
  await page.setViewportSize({ width: 1440, height: 1000 });
  const desktop = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(desktop.scroll).toBe(desktop.client);
});

test('@claim:localstorage-scope keeps only license state in localStorage', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/verify?license=scope-test-license', (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.goto('/?license=scope-test-license');
  await expect(page.getByRole('heading', { name: 'Household Edition active' })).toBeVisible();
  await page.getByLabel('Recipe name').fill('Local recipe');
  await page.getByLabel(/Ingredients/).fill('1 onion');
  await page.getByRole('button', { name: 'Add recipe' }).click();
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys).toEqual(['sb_license:meal-plan-pantry-check', 'sb_license_verdict:meal-plan-pantry-check']);
  expect(new URL(page.url()).searchParams.has('license')).toBe(false);
});

test('@claim:daily-license-check verifies a saved license no more than once per day', async ({ page }) => {
  let verificationRequests = 0;
  await page.route('https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/verify?license=daily-test-license', (route) => {
    verificationRequests += 1;
    return route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } });
  });
  await page.goto('/?license=daily-test-license');
  await expect(page.getByRole('heading', { name: 'Household Edition active' })).toBeVisible();
  expect(verificationRequests).toBe(1);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Household Edition active' })).toBeVisible();
  expect(verificationRequests).toBe(1);
  await page.evaluate(() => localStorage.setItem('sb_license_verdict:meal-plan-pantry-check', JSON.stringify({ valid: true, checkedAt: Date.now() - 86_400_001 })));
  await page.reload();
  await expect.poll(() => verificationRequests).toBe(2);
});

test('keeps paid features locked when license verification rejects the token', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/verify?license=rejected-test-license', (route) => route.fulfill({ json: { valid: false, reason: 'revoked', expires_at: null } }));
  await page.goto('/?license=rejected-test-license');
  await expect(page.getByText('License no longer active.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Plan with more recipes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy once for $9' })).toBeVisible();
  expect(new URL(page.url()).searchParams.has('license')).toBe(false);
});

test('restores a household license pasted on a second device', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/verify?license=restored-household-license', (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.goto('/');
  await page.getByText('Have a license? Restore it').click();
  await page.getByLabel('License token').fill('restored-household-license');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByRole('heading', { name: 'Household Edition active' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sb_license:meal-plan-pantry-check'))).toBe('restored-household-license');
});

test('@claim:edition-limits keeps four recipes free, reaches the $9 checkout, and accepts a valid license', async ({ browser, request }) => {
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
  const checkoutUrl = await freePage.getByRole('link', { name: 'Buy once for $9' }).getAttribute('href');
  expect(checkoutUrl).toBe('https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/checkout');
  const checkout = await request.get(checkoutUrl!, { maxRedirects: 0 });
  expect(checkout.status()).toBe(303);
  const hostedUrl = checkout.headers().location;
  expect(new URL(hostedUrl).hostname).toBe('checkout.dodopayments.com');
  const hosted = await request.get(hostedUrl);
  expect(hosted.status()).toBe(200);
  const hostedHtml = await hosted.text();
  expect(hostedHtml).toContain('Meal Plan Pantry Check Household License');
  expect(hostedHtml).toContain('$9.00');
  await freeContext.close();

  const paidContext = await browser.newContext();
  const paidPage = await paidContext.newPage();
  await paidPage.route('https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/verify?license=test-household-license', (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await paidPage.goto('/?license=test-household-license');
  await expect(paidPage.getByRole('heading', { name: 'Household Edition active' })).toBeVisible();
  for (let index = 1; index <= 5; index += 1) {
    await paidPage.getByLabel('Recipe name').fill(`Licensed recipe ${index}`);
    await paidPage.getByLabel(/Ingredients/).fill(`${index} carrots`);
    await paidPage.getByRole('button', { name: 'Add recipe' }).click();
  }
  await expect(paidPage.locator('.clipping')).toHaveCount(5);
  await paidContext.close();
});

test('uses route titles, sharing metadata, internal links, and the designed error page', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Meal Plan Pantry Check — Check recipes and pantry');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /pantry-check-social\.jpg$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const socialImage = await page.evaluate(async () => {
    const url = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')!.content;
    const candidate = new Image();
    candidate.src = new URL(url).pathname;
    await candidate.decode();
    return { width: candidate.naturalWidth, height: candidate.naturalHeight };
  });
  expect(socialImage).toEqual({ width: 1200, height: 630 });
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icons/apple-touch-icon.png');
  for (const path of ['/demo', '/privacy/', '/terms/', '/offline.html', '/404.html']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
  await page.goto('/privacy/');
  await expect(page).toHaveTitle('Privacy — Meal Plan Pantry Check');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How we handle your data');
  await page.goto('/terms/');
  await expect(page).toHaveTitle('Terms — Meal Plan Pantry Check');
  await expect(page.getByRole('link', { name: /Source code/ })).toHaveAccessibleName('Source code on an external site');
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Meal Plan Pantry Check');
  await expect(page.getByRole('link', { name: 'Return to the planner' })).toBeVisible();
  await page.goto('/demo');
  await expect(page.getByRole('link', { name: /Open source/ })).toHaveCount(0);
  await expect(page.getByText('Local recipe · no source link')).toHaveCount(3);
});
