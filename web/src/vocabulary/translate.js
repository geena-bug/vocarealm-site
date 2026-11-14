// Word-bank lookup and the server-side translation call used by the vocabulary form.
// Pure functions only, so they can be unit-tested in Node without a browser.

export const endpoint = 'https://gizmaijlhtwjfmvrlzyv.supabase.co/functions/v1/vocabulary-translate';
const setupHelp =
  'To turn it on, deploy the vocabulary-translate Supabase function and add its ANTHROPIC_API_KEY secret (see integrations/translation/README.md).';

export const normalize = (s) =>
  String(s || '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/^(?:an?|the|to)\s+/, '')
    .replace(/[.,;:!?]+$/, '');

export const normalizeFrench = (s) =>
  String(s || '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/^(?:un|une|le|la|les|des|du|de la|l'|de l')\s*/, '')
    .replace(/[.,;:!?]+$/, '');

// rank 0 = exact meaning (including one of several "a / b" alternatives), rank 1 = related phrase.
function rank(query, words, field, norm) {
  const q = norm(query);
  if (!q) return [];
  const seen = new Set();
  return words
    .map((w) => {
      const value = norm(field(w));
      const exact =
        value === q ||
        String(field(w) || '')
          .split(/\s*(?:\/|;|,|\bor\b)\s*/)
          .some((part) => norm(part) === q);
      const related = (' ' + value + ' ').includes(' ' + q + ' ');
      return { ...w, rank: exact ? 0 : related ? 1 : 2 };
    })
    .filter((w) => w.rank < 2)
    .sort((a, b) => a.rank - b.rank)
    .filter((w) => {
      const key = w.term + '|' + (w.translation || w.meaning);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

export const lookup = (query, words) => rank(query, words, (w) => w.translation || w.meaning, normalize);
export const lookupFrench = (query, words) => rank(query, words, (w) => w.term, normalizeFrench);

// Asks the server-side translation function to fill a vocabulary card. The API key never reaches the browser.
export async function translateRemote(text, direction, { auth, fetch }) {
  let session = null;
  try {
    session = (await auth?.client?.auth.getSession())?.data?.session || null;
  } catch {}
  if (!session) {
    let configured = null;
    try {
      configured = (await (await fetch(endpoint)).json()).configured === true;
    } catch {}
    return configured ? { error: 'sign_in_required', message: 'Log in to translate words that are not in the word bank yet.' } : { error: 'not_configured' };
  }
  let response;
  let body = null;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
      body: JSON.stringify({ text, direction }),
    });
  } catch {
    return { error: 'not_configured' };
  }
  try {
    body = await response.json();
  } catch {}
  if (!body || response.status === 404) return { error: 'not_configured' };
  return response.ok && !body.error ? body : { error: body.error || 'translation_unavailable', message: body.message };
}

export function explain(result) {
  if (result.error === 'not_configured') {
    return 'Automatic translation isn’t set up yet, so nothing was filled in. ' + (result.message ? result.message + ' ' : '') + setupHelp;
  }
  return result.message || 'Translation is unavailable right now. Please try again later.';
}
