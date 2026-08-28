import './styles.css';
import { consolidate, parseIngredients } from './parser';
import { emptyState, loadState, saveState } from './db';
import { cachedLicenseState, captureLicense, checkoutUrl, storeLicense, verifyLicense, type LicenseState } from './license';
import type { AppState, ConsolidatedIngredient, Recipe } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
let state: AppState = emptyState();
let loading = true;
let storageNotice = '';
let formError = '';
let editingId = '';
let online = navigator.onLine;
let updateReady = false;
let reloadForUpdate = false;
let licenseToken = captureLicense();
let license: LicenseState = cachedLicenseState(licenseToken);

const esc = (value: unknown): string => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
const uid = (): string => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const safeSource = (value: string): string => {
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : ''; } catch { return ''; }
};

function persist(): void {
  state.updatedAt = Date.now();
  saveState(state).then(() => {
    if (storageNotice) { storageNotice = ''; render(); }
  }).catch(() => {
    storageNotice = 'Changes are working in this tab, but this browser blocked local storage. Export a backup before closing.';
    render();
  });
}

function selectedRecipes(): Recipe[] { return state.recipes.filter((recipe) => recipe.selected); }
function ingredients(): ConsolidatedIngredient[] { return consolidate(state.recipes); }

function masthead(): string {
  const selected = selectedRecipes().length;
  const allIngredients = ingredients();
  const pantryCount = allIngredients.filter((item) => state.pantry[item.key]?.inPantry).length;
  return `
    <header class="masthead">
      <div class="dateline">
        <span>THE PANTRY LEDGER</span><span>LOCAL EDITION</span><span>${online ? 'READY OFFLINE' : 'OFFLINE NOW'}</span>
      </div>
      <div class="title-row">
        <div><p class="eyebrow">An honest list for the week ahead</p><h1>Meal Plan<br><em>Pantry Check</em></h1></div>
        <p class="dek">Combine recipes. Set servings. Cross off only what <strong>you</strong> confirm is already home.</p>
      </div>
      <nav class="folio" aria-label="Plan steps">
        ${stepButton('recipes', '01', 'Recipes', `${selected} selected`)}
        ${stepButton('pantry', '02', 'Pantry check', `${pantryCount} confirmed`)}
        ${stepButton('list', '03', 'Shopping list', `${allIngredients.length - pantryCount} to buy`)}
      </nav>
    </header>`;
}

function stepButton(view: AppState['view'], number: string, label: string, meta: string): string {
  return `<button class="folio-step ${state.view === view ? 'active' : ''}" data-view="${view}" aria-current="${state.view === view ? 'step' : 'false'}"><span>${number}</span><strong>${label}</strong><small>${meta}</small></button>`;
}

function statusBars(): string {
  return `
    <div class="status-stack" aria-live="polite">
      ${!online ? '<p class="status offline"><strong>Offline edition.</strong> Your saved recipes and list still work on this device.</p>' : ''}
      ${storageNotice ? `<p class="status ${storageNotice.startsWith('Shopping list copied') ? 'note' : 'error'}">${esc(storageNotice)}</p>` : ''}
      ${license.notice ? `<p class="status note">${esc(license.notice)} ${!license.unlocked ? `<a href="${checkoutUrl}">View household edition</a>` : ''}</p>` : ''}
      ${updateReady ? '<p class="status update">A fresh edition is ready. <button data-action="reload-update">Update now</button></p>' : ''}
    </div>`;
}

function recipesView(): string {
  return `
    ${state.recipes.length === 0 ? `<section class="hero" aria-labelledby="start-title">
      <div class="hero-copy"><p class="kicker">No inventory fiction. No mystery arithmetic.</p><h2 id="start-title">Recipes in.<br>Certainty out.</h2><p>Paste ingredient lines from recipes you already use. Pantry Check scales the amounts, shows its work, and waits for you to say what is on the shelf.</p><a class="text-link" href="#recipe-form">Start with a recipe ↓</a></div>
      <figure><picture><source media="(max-width: 720px)" srcset="/assets/pantry-ledger-960.avif" type="image/avif"><source media="(max-width: 720px)" srcset="/assets/pantry-ledger-960.webp" type="image/webp"><source srcset="/assets/pantry-ledger-1536.avif" type="image/avif"><source srcset="/assets/pantry-ledger-1536.webp" type="image/webp"><img src="/assets/pantry-ledger-960.jpg" width="960" height="640" fetchpriority="high" decoding="async" alt="Recipe clippings and pantry jars feeding into a single hand-checked grocery ledger"></picture><figcaption>ONE LIST · EVERY SOURCE ACCOUNTED FOR</figcaption></figure>
    </section>` : ''}
    <div class="editorial-grid">
      <section class="work-column" aria-labelledby="recipes-title">
        <div class="section-heading"><div><p class="section-no">SECTION 01</p><h2 id="recipes-title">Recipe desk</h2></div><p>${state.recipes.length} saved · ${selectedRecipes().length} in this plan</p></div>
        ${recipeForm()}
        <div class="clippings">${state.recipes.length ? state.recipes.map(recipeCard).join('') : '<p class="empty-line">Your saved clippings will appear here.</p>'}</div>
      </section>
      <aside class="rail" aria-labelledby="edition-title">
        ${editionPanel()}
        ${dataPanel()}
      </aside>
    </div>`;
}

function recipeForm(): string {
  const edit = state.recipes.find((recipe) => recipe.id === editingId);
  return `<form id="recipe-form" class="recipe-form" novalidate>
    <div class="form-heading"><h3>${edit ? 'Revise clipping' : 'Add a recipe'}</h3><span>Paste, don’t scrape</span></div>
    ${formError ? `<p class="form-error" id="form-error" role="alert">${esc(formError)}</p>` : ''}
    <div class="field-grid">
      <label class="field wide"><span>Recipe name <b aria-hidden="true">*</b></span><input name="title" required value="${esc(edit?.title)}" autocomplete="off" placeholder="Tuesday tomato pasta"></label>
      <label class="field"><span>Recipe serves <b aria-hidden="true">*</b></span><input name="servings" required min="0.25" step="0.25" type="number" inputmode="decimal" value="${edit?.baseServings ?? 4}"></label>
      <label class="field wide"><span>Source link <small>(optional)</small></span><input name="sourceUrl" type="url" value="${esc(edit?.sourceUrl)}" placeholder="https://…"></label>
    </div>
    <label class="field ingredients-field"><span>Ingredients — one per line <b aria-hidden="true">*</b></span><textarea name="ingredients" required rows="7" aria-describedby="line-help" placeholder="2 tbsp olive oil&#10;1 1/2 cups rice&#10;salt to taste">${esc(edit?.ingredientsText)}</textarea></label>
    <p class="field-help" id="line-help">Use “2 tbsp olive oil” or “1 ½ cups rice”. Keep preparation notes in the name; uncertain lines are flagged, never guessed.</p>
    <div id="parse-preview" class="parse-preview" aria-live="polite"></div>
    <div class="form-actions"><button class="button primary" type="submit">${edit ? 'Save revision' : 'Add recipe'}</button>${edit ? '<button class="button quiet" type="button" data-action="cancel-edit">Cancel</button>' : ''}</div>
  </form>`;
}

function recipeCard(recipe: Recipe, index: number): string {
  const uncertain = recipe.ingredients.filter((line) => line.uncertain).length;
  const source = safeSource(recipe.sourceUrl);
  return `<article class="clipping ${recipe.selected ? '' : 'excluded'}">
    <div class="clipping-index">CLIPPING ${String(index + 1).padStart(2, '0')}</div>
    <div class="clipping-title"><label class="check-label"><input type="checkbox" data-action="select-recipe" data-id="${recipe.id}" ${recipe.selected ? 'checked' : ''}><span>Use in this plan</span></label><h3>${esc(recipe.title)}</h3>${source ? `<a href="${esc(source)}" target="_blank" rel="noreferrer">Open source <span aria-hidden="true">↗</span><span class="sr-only"> in a new tab</span></a>` : '<span class="muted">Personal recipe · no link</span>'}</div>
    <div class="serving-control"><label for="servings-${recipe.id}">Plan servings</label><div><button type="button" data-action="servings-down" data-id="${recipe.id}" aria-label="Decrease servings for ${esc(recipe.title)}">−</button><input id="servings-${recipe.id}" data-action="servings" data-id="${recipe.id}" type="number" min="0.25" step="0.25" inputmode="decimal" value="${recipe.targetServings}"><button type="button" data-action="servings-up" data-id="${recipe.id}" aria-label="Increase servings for ${esc(recipe.title)}">+</button></div><small>Original: ${recipe.baseServings}</small></div>
    <details class="ingredient-lines"><summary>${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? '' : 's'}${uncertain ? ` · <strong>${uncertain} to check</strong>` : ''}</summary><ol>${recipe.ingredients.map((item) => `<li><span>${esc(item.raw)}</span><small>${item.quantity ?? '?'} ${esc(item.unit)} · ${esc(item.name)} ${item.uncertain ? '<b>CHECK</b>' : ''}</small></li>`).join('')}</ol></details>
    <div class="clipping-actions"><button type="button" data-action="edit-recipe" data-id="${recipe.id}">Edit</button><button class="danger-link" type="button" data-action="delete-recipe" data-id="${recipe.id}">Remove</button></div>
  </article>`;
}

function editionPanel(): string {
  return `<section class="edition-panel" aria-labelledby="edition-title"><p class="section-no">HOUSEHOLD EDITION</p><h2 id="edition-title">${license.unlocked ? 'Ledger unlocked' : 'Keep the whole recipe file.'}</h2><p>${license.unlocked ? 'Unlimited saved recipes are active on this device.' : 'The free edition plans four recipes—enough for a useful week. A one-time $9 household license unlocks unlimited recipes.'}</p>
    ${license.unlocked ? '<p class="stamp">PAID · ACTIVE</p>' : `<a class="button ink" href="${checkoutUrl}">Buy once for $9</a><details class="restore"><summary>Have a license? Restore it</summary><form id="license-form"><label class="field"><span>License token</span><input name="license" autocomplete="off" required></label><button class="button quiet" type="submit" aria-label="Verify license">Verify license</button></form></details>`}
    <p class="fineprint">Secure checkout by Sociobot/Dodo, merchant of record. Refunds are handled there. <a href="/terms/">Terms</a></p></section>`;
}

function dataPanel(): string {
  return `<section class="data-panel"><p class="section-no">YOUR DATA</p><h2>Stays in your pantry.</h2><p>Recipes are stored in this browser, not on our servers. Take a complete backup whenever you like.</p><div class="stacked-actions"><button class="text-button" data-action="export-json">Export recipe backup <span>↓</span></button><label class="text-button file-button">Import recipe backup <span>↑</span><input id="import-file" type="file" accept="application/json,.json"></label></div><p class="fineprint"><a href="/privacy/">Privacy</a> · Generated editorial imagery disclosed in the colophon.</p></section>`;
}

function pantryView(): string {
  const items = ingredients();
  return `<section class="stage" aria-labelledby="pantry-title"><div class="stage-heading"><div><p class="section-no">SECTION 02</p><h2 id="pantry-title">What’s already home?</h2><p>Look first, then tick. Pantry Check subtracts nothing automatically.</p></div><div class="issue-stat"><strong>${items.filter((item) => state.pantry[item.key]?.inPantry).length}</strong><span>of ${items.length}<br>confirmed</span></div></div>
    ${items.length ? `<div class="pantry-actions"><button class="text-button" data-action="clear-pantry">Clear pantry marks</button></div><ul class="ledger-list">${items.map((item, index) => ledgerRow(item, index, 'pantry')).join('')}</ul><div class="next-action"><p>Checked the shelves?</p><button class="button primary" data-view="list">Write the shopping list →</button></div>` : emptyPlan('Select at least one recipe to start the pantry check.', 'Back to recipes')}
  </section>`;
}

function listView(): string {
  const all = ingredients();
  const buy = all.filter((item) => !state.pantry[item.key]?.inPantry);
  const groups = [...new Set(buy.map((item) => item.group))];
  return `<section class="stage" aria-labelledby="list-title"><div class="stage-heading"><div><p class="section-no">SECTION 03 · FINAL COPY</p><h2 id="list-title">The shopping list</h2><p>${all.length - buy.length} pantry item${all.length - buy.length === 1 ? '' : 's'} held back. Every total keeps its sources.</p></div><div class="issue-stat"><strong>${buy.filter((item) => state.pantry[item.key]?.checked).length}</strong><span>of ${buy.length}<br>picked up</span></div></div>
    ${all.length ? `<div class="export-bar"><button class="button ink" data-action="copy-list">Copy list</button><button class="button quiet" data-action="export-csv">Export CSV</button><button class="button quiet" data-action="print">Print checklist</button></div>${buy.length ? groups.map((group) => `<section class="shopping-group" aria-labelledby="group-${group.replace(/\W/g, '')}"><h3 id="group-${group.replace(/\W/g, '')}"><span>${esc(group)}</span><small>${buy.filter((item) => item.group === group).length} lines</small></h3><ul class="ledger-list">${buy.filter((item) => item.group === group).map((item, index) => ledgerRow(item, index, 'list')).join('')}</ul></section>`).join('') : '<div class="all-home"><span aria-hidden="true">✓</span><h3>The cupboard wins.</h3><p>Every ingredient is confirmed at home. Clear a pantry mark if that changes.</p><button class="button quiet" data-view="pantry">Review pantry</button></div>'}` : emptyPlan('Add and select recipes before writing the shopping list.', 'Back to recipes')}
  </section>`;
}

function ledgerRow(item: ConsolidatedIngredient, index: number, mode: 'pantry' | 'list'): string {
  const mark = state.pantry[item.key] ?? { inPantry: false, checked: false };
  const checked = mode === 'pantry' ? mark.inPantry : mark.checked;
  const action = mode === 'pantry' ? 'pantry-mark' : 'shopping-check';
  return `<li class="ledger-row ${checked ? 'checked' : ''}"><label><input type="checkbox" data-action="${action}" data-key="${esc(item.key)}" ${checked ? 'checked' : ''}><span class="row-number">${String(index + 1).padStart(2, '0')}</span><span class="row-copy"><strong>${esc(item.name)}</strong><small>${mode === 'pantry' && checked ? 'IN PANTRY · SUBTRACTED' : item.uncertain ? 'CHECK AMOUNT' : mode === 'list' && checked ? 'PICKED UP' : 'NEEDED'}</small></span><span class="quantity"><strong>${esc(item.displayQuantity)}</strong><small>${esc(item.unit)}</small></span></label><details><summary>Show the arithmetic</summary><ul>${item.contributions.map((source) => { const href = safeSource(source.sourceUrl); return `<li><span>${esc(source.recipeTitle)}</span><span>${esc(source.displayQuantity)} ${href ? `<a href="${esc(href)}" target="_blank" rel="noreferrer" aria-label="Open source for ${esc(source.recipeTitle)} in a new tab">↗</a>` : ''}</span></li>`; }).join('')}</ul>${item.uncertain ? `<p class="uncertainty"><strong>Red-pencil note:</strong> ${esc([...new Set(item.notes)].join(' '))}</p>` : ''}</details></li>`;
}

function emptyPlan(message: string, button: string): string {
  return `<div class="empty-state"><p>NO LINES TO PRINT</p><h3>${esc(message)}</h3><button class="button primary" data-view="recipes">${esc(button)}</button></div>`;
}

function footer(): string {
  return `<footer><div><strong>MEAL PLAN PANTRY CHECK</strong><p>A private, offline-first household utility.</p></div><div><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-meal-plan-pantry-check" rel="noreferrer">Source</a></div><p class="colophon">Original hero generated with the factory image model · No analytics · No grocery affiliates</p></footer>`;
}

function render(): void {
  app.innerHTML = `${masthead()}${statusBars()}<main id="main" tabindex="-1">${loading ? '<div class="loading" role="status"><span></span>Opening your local ledger…</div>' : state.view === 'recipes' ? recipesView() : state.view === 'pantry' ? pantryView() : listView()}</main>${footer()}`;
  if (!loading && state.view === 'recipes') updatePreview();
}

function updatePreview(): void {
  const textarea = document.querySelector<HTMLTextAreaElement>('textarea[name="ingredients"]');
  const preview = document.querySelector<HTMLDivElement>('#parse-preview');
  if (!textarea || !preview) return;
  const parsed = parseIngredients(textarea.value);
  if (!parsed.length) { preview.innerHTML = ''; return; }
  const uncertain = parsed.filter((line) => line.uncertain).length;
  preview.innerHTML = `<strong>${parsed.length} line${parsed.length === 1 ? '' : 's'} read</strong><span>${uncertain ? `${uncertain} marked for review` : 'All quantities look structured'}</span>`;
}

function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: string): string { return `"${value.replace(/"/g, '""')}"`; }
function shoppingCsv(): string {
  const rows = ingredients().filter((item) => !state.pantry[item.key]?.inPantry);
  return ['Group,Item,Quantity,Unit,Picked up,Sources,Source URLs', ...rows.map((item) => [item.group, item.name, item.displayQuantity, item.unit, state.pantry[item.key]?.checked ? 'yes' : 'no', item.contributions.map((source) => source.recipeTitle).join('; '), item.contributions.map((source) => source.sourceUrl).filter(Boolean).join('; ')].map(csvCell).join(','))].join('\n');
}

function shoppingText(): string {
  const rows = ingredients().filter((item) => !state.pantry[item.key]?.inPantry);
  const groups = [...new Set(rows.map((item) => item.group))];
  return groups.map((group) => `${group.toUpperCase()}\n${rows.filter((item) => item.group === group).map((item) => `☐ ${item.displayQuantity} ${item.unit} ${item.name} — ${item.contributions.map((source) => source.recipeTitle).join(', ')}`).join('\n')}`).join('\n\n');
}

function changeServings(id: string, value: number): void {
  const recipe = state.recipes.find((item) => item.id === id);
  if (!recipe || !Number.isFinite(value)) return;
  recipe.targetServings = Math.max(.25, Math.round(value * 4) / 4);
  persist(); render();
}

app.addEventListener('input', (event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (target.matches('textarea[name="ingredients"]')) updatePreview();
});

app.addEventListener('change', async (event) => {
  const target = event.target as HTMLInputElement;
  const action = target.dataset.action;
  if (action === 'select-recipe') { const recipe = state.recipes.find((item) => item.id === target.dataset.id); if (recipe) recipe.selected = target.checked; persist(); render(); }
  if (action === 'servings') changeServings(target.dataset.id!, Number(target.value));
  if (action === 'pantry-mark' || action === 'shopping-check') {
    const key = target.dataset.key!;
    const old = state.pantry[key] ?? { inPantry: false, checked: false, updatedAt: 0 };
    state.pantry[key] = { ...old, [action === 'pantry-mark' ? 'inPantry' : 'checked']: target.checked, updatedAt: Date.now() };
    persist(); render();
  }
  if (target.id === 'import-file' && target.files?.[0]) {
    try {
      const incoming = JSON.parse(await target.files[0].text()) as AppState;
      if (incoming.version !== 1 || !Array.isArray(incoming.recipes) || typeof incoming.pantry !== 'object') throw new Error('shape');
      if (!confirm(`Replace this device's ledger with a backup containing ${incoming.recipes.length} recipes?`)) return;
      state = { ...incoming, view: 'recipes', updatedAt: Date.now() }; persist(); render();
    } catch { storageNotice = 'That file is not a Pantry Check backup. Choose an exported JSON file.'; render(); }
  }
});

app.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  if (form.id === 'recipe-form') {
    const data = new FormData(form);
    const title = String(data.get('title') ?? '').trim();
    const ingredientsText = String(data.get('ingredients') ?? '').trim();
    const baseServings = Number(data.get('servings'));
    const sourceUrl = String(data.get('sourceUrl') ?? '').trim();
    if (!title || !ingredientsText || !Number.isFinite(baseServings) || baseServings <= 0) { formError = 'Add a recipe name, valid serving count, and at least one ingredient line.'; render(); document.querySelector<HTMLElement>('#form-error')?.focus(); return; }
    if (sourceUrl) { try { const parsed = new URL(sourceUrl); if (!/^https?:$/.test(parsed.protocol)) throw new Error(); } catch { formError = 'The source link must start with http:// or https://.'; render(); return; } }
    if (!editingId && !license.unlocked && state.recipes.length >= 4) { formError = 'The free edition holds four recipes. Remove one, or unlock the household edition for unlimited recipes.'; render(); return; }
    const parsed = parseIngredients(ingredientsText);
    const old = state.recipes.find((recipe) => recipe.id === editingId);
    const recipe: Recipe = { id: old?.id ?? uid(), title, baseServings, targetServings: old ? old.targetServings * baseServings / old.baseServings : baseServings, sourceUrl, ingredientsText, ingredients: parsed, selected: old?.selected ?? true, updatedAt: Date.now() };
    if (old) state.recipes[state.recipes.indexOf(old)] = recipe; else state.recipes.push(recipe);
    editingId = ''; formError = ''; persist(); render(); document.querySelector('.clippings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (form.id === 'license-form') {
    const token = String(new FormData(form).get('license') ?? '').trim();
    if (!token) return;
    storeLicense(token); licenseToken = token; license = { unlocked: false, notice: 'Verifying license…', checking: true }; render();
    license = await verifyLicense(token, true); render();
  }
});

app.addEventListener('click', async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-action],[data-view]');
  if (!button) return;
  const view = button.dataset.view as AppState['view'] | undefined;
  if (view) { state.view = view; persist(); render(); document.querySelector('#main')?.scrollIntoView(); return; }
  const action = button.dataset.action;
  const recipe = state.recipes.find((item) => item.id === button.dataset.id);
  if (action === 'cancel-edit') { editingId = ''; formError = ''; render(); }
  if (action === 'edit-recipe' && recipe) { editingId = recipe.id; state.view = 'recipes'; render(); document.querySelector('#recipe-form')?.scrollIntoView({ behavior: 'smooth' }); }
  if (action === 'delete-recipe' && recipe && confirm(`Remove “${recipe.title}” and its ingredient lines? This cannot be undone.`)) { state.recipes = state.recipes.filter((item) => item.id !== recipe.id); persist(); render(); }
  if (action === 'servings-down' && recipe) changeServings(recipe.id, recipe.targetServings - .25);
  if (action === 'servings-up' && recipe) changeServings(recipe.id, recipe.targetServings + .25);
  if (action === 'clear-pantry' && confirm('Clear every pantry confirmation for this plan?')) { Object.values(state.pantry).forEach((mark) => { mark.inPantry = false; mark.updatedAt = Date.now(); }); persist(); render(); }
  if (action === 'export-json') download(`pantry-check-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state, null, 2), 'application/json');
  if (action === 'export-csv') download(`shopping-list-${new Date().toISOString().slice(0, 10)}.csv`, shoppingCsv(), 'text/csv;charset=utf-8');
  if (action === 'copy-list') { try { await navigator.clipboard.writeText(shoppingText()); storageNotice = 'Shopping list copied to the clipboard.'; } catch { storageNotice = 'Clipboard access was blocked. Use Export CSV instead.'; } render(); }
  if (action === 'print') window.print();
  if (action === 'reload-update') { reloadForUpdate = true; navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' }); }
});

window.addEventListener('online', () => { online = true; render(); });
window.addEventListener('offline', () => { online = false; render(); });

async function start(): Promise<void> {
  try { state = await loadState(); } catch { storageNotice = 'Local storage is unavailable. You can still make a list in this tab and export it.'; }
  loading = false; render();
  if (licenseToken) { license = await verifyLicense(licenseToken); render(); }
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      if (registration.waiting) { updateReady = true; render(); }
      registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => { if (registration.waiting && navigator.serviceWorker.controller) { updateReady = true; render(); } }));
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloadForUpdate) location.reload(); });
    } catch { /* The core app still works where service workers are unavailable. */ }
  }
}

render();
void start();
