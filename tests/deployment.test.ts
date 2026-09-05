import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

type Route = { route: string; rewrite?: string; headers?: Record<string, string> };
type StaticWebAppConfig = {
  routes: Route[];
  globalHeaders: Record<string, string>;
  mimeTypes: Record<string, string>;
  responseOverrides: Record<string, { rewrite: string }>;
};

const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as StaticWebAppConfig;
const route = (path: string): Route => {
  const match = config.routes.find((candidate) => candidate.route === path);
  if (!match) throw new Error(`Missing deployment route ${path}`);
  return match;
};

describe('Azure Static Web Apps response policy', () => {
  test('keeps generated content-hashed bundles immutable for one year', () => {
    expect(route('/assets/*').headers?.['Cache-Control']).toBe('public, max-age=31536000, immutable');
  });

  test('keeps the app shell and worker updateable', () => {
    expect(route('/').headers?.['Cache-Control']).toContain('no-cache');
    expect(route('/sw.js').headers?.['Cache-Control']).toContain('no-cache');
    expect(route('/sw.js').headers?.['Cache-Control']).not.toContain('immutable');
  });

  test('serves the manifest with its registered media type', () => {
    expect(route('/manifest.webmanifest').headers?.['Content-Type']).toBe('application/manifest+json; charset=utf-8');
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json');
  });

  test('ships CSP, browser permissions, and framing protections', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain('connect-src \'self\' https://api.sociobot.in');
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Content-Security-Policy']).not.toContain("'unsafe-inline'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  });

  test('serves the demo route and a designed HTTP 404 response', () => {
    expect(route('/demo').rewrite).toBe('/index.html');
    expect(route('/demo/').rewrite).toBe('/index.html');
    expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
    const notFound = readFileSync('public/404.html', 'utf8');
    expect(notFound).toContain('<h1>This page does not exist</h1>');
    expect(notFound).toContain('href="/"');
  });
});
