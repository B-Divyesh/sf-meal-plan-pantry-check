import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const baseUrl = (process.env.PRODUCT_URL ?? 'https://meal-plan-pantry-check.sociobot.in').replace(/\/$/, '');
const distDir = new URL('../dist/', import.meta.url);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const request = async (pathname, init = {}) => {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: 'manual', ...init });
  assert(response.ok, `${pathname} returned ${response.status}`);
  return response;
};

const filesUnder = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
};

const routeFor = (file) => {
  const path = relative(distDir.pathname, file).split(sep).join('/');
  if (path === 'index.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'index.html'.length)}`;
  return `/${path}`;
};

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const root = await request('/');
const rootHtml = await root.text();
assert(rootHtml.includes('<title>Meal Plan Pantry Check — an honest shopping list</title>'), 'Live root has the wrong product identity');
assert(/no-cache|no-store/.test(root.headers.get('cache-control') ?? ''), 'Root HTML is not updateable');

const csp = root.headers.get('content-security-policy') ?? '';
assert(csp.includes("default-src 'self'"), 'CSP default-src is missing');
assert(csp.includes('https://api.sociobot.in'), 'CSP blocks the Sociobot API');
assert(csp.includes("frame-ancestors 'none'"), 'CSP frame-ancestors is missing');
assert((root.headers.get('permissions-policy') ?? '').includes('camera=()'), 'Permissions-Policy is missing');
assert(root.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options is not DENY');

const assetPaths = [...rootHtml.matchAll(/(?:src|href)="(\/assets\/index-[^"]+\.(?:js|css))"/g)].map((match) => match[1]);
assert(assetPaths.length >= 2, 'Could not find both generated JS and CSS assets');
for (const assetPath of assetPaths) {
  const response = await request(assetPath, { method: 'HEAD' });
  const cacheControl = response.headers.get('cache-control') ?? '';
  assert(cacheControl.includes('immutable') && /max-age=(31536000|[4-9]\d{7,})/.test(cacheControl), `${assetPath} is not immutable for at least one year: ${cacheControl}`);
}

const manifest = await request('/manifest.webmanifest', { method: 'HEAD' });
assert((manifest.headers.get('content-type') ?? '').startsWith('application/manifest+json'), `Wrong manifest media type: ${manifest.headers.get('content-type')}`);

const worker = await request('/sw.js', { method: 'HEAD' });
const workerCache = worker.headers.get('cache-control') ?? '';
assert(/no-cache|no-store/.test(workerCache) && !workerCache.includes('immutable'), `Service worker is not updateable: ${workerCache}`);

const localFiles = (await filesUnder(distDir.pathname)).filter((file) => !file.endsWith('.map') && !file.endsWith('staticwebapp.config.json'));
for (const file of localFiles) {
  const response = await request(routeFor(file));
  const remote = Buffer.from(await response.arrayBuffer());
  const local = await readFile(file);
  assert(sha256(remote) === sha256(local), `Live artifact differs from dist: ${routeFor(file)}`);
}

const rateUrl = 'https://api.sociobot.in/api/v1/products/meal-plan-pantry-check/verify?license=repair-rate-limit-20260828';
const burst = await Promise.all(Array.from({ length: 60 }, () => fetch(rateUrl)));
const limited = burst.filter((response) => response.status === 429);
assert(limited.length > 0, `License verification did not rate limit a 60-request burst (${burst.map((response) => response.status).join(',')})`);
assert(limited.some((response) => response.headers.has('retry-after')), 'Rate-limited response has no Retry-After header');
const rateStatuses = burst.reduce((counts, response) => {
  const status = String(response.status);
  counts[status] = (counts[status] ?? 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  baseUrl,
  identityFiles: localFiles.length,
  immutableAssets: assetPaths,
  manifestType: manifest.headers.get('content-type'),
  rootCache: root.headers.get('cache-control'),
  workerCache,
  rateStatuses,
}, null, 2));
