export type LicenseState = { unlocked: boolean; notice: string; checking: boolean };

const SLUG = 'meal-plan-pantry-check';
const API = 'https://api.sociobot.in/api/v1';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `sb_license_verdict:${SLUG}`;

type Verdict = { valid: boolean; checkedAt: number };

export const checkoutUrl = `${API}/products/${SLUG}/checkout`;

export function captureLicense(): string {
  const url = new URL(location.href);
  const incoming = url.searchParams.get('license');
  if (incoming) {
    try {
      localStorage.setItem(TOKEN_KEY, incoming);
      localStorage.removeItem(VERDICT_KEY);
    } catch { /* The token still works for this session when storage is blocked. */ }
    url.searchParams.delete('license');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  if (incoming) return incoming;
  try { return localStorage.getItem(TOKEN_KEY) ?? ''; } catch { return ''; }
}

export function cachedLicenseState(token: string): LicenseState {
  if (!token) return { unlocked: false, notice: '', checking: false };
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as Verdict | null;
    return { unlocked: cached?.valid === true, notice: cached?.valid === false ? 'License no longer active.' : '', checking: false };
  } catch { return { unlocked: false, notice: '', checking: false }; }
}

export async function verifyLicense(token: string, force = false): Promise<LicenseState> {
  if (!token) return { unlocked: false, notice: '', checking: false };
  let cached: Verdict | null = null;
  try { cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null'); } catch { /* ignore invalid cache */ }
  if (!force && cached && Date.now() - cached.checkedAt < 86_400_000) {
    return { unlocked: cached.valid, notice: cached.valid ? '' : 'License no longer active.', checking: false };
  }
  try {
    const response = await fetch(`${API}/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification unavailable');
    const result = await response.json() as { valid: boolean };
    const verdict = { valid: result.valid === true, checkedAt: Date.now() };
    try { localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict)); } catch { /* Keep the live verdict for this session. */ }
    return { unlocked: verdict.valid, notice: verdict.valid ? '' : 'License no longer active.', checking: false };
  } catch {
    return {
      unlocked: cached?.valid === true,
      notice: cached?.valid === false ? 'License no longer active.' : cached ? '' : 'Could not verify while offline. Try again when connected.',
      checking: false,
    };
  }
}

export function storeLicense(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token.trim());
    localStorage.removeItem(VERDICT_KEY);
  } catch { /* Verification can still proceed for this session. */ }
}
