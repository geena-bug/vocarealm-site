# Vocabulary translation integration

The vocabulary page's **Translate** button fills the French word, English meaning, French example sentence and its English translation from the one word the learner knows (English → French or French → English). Learners edit the fields, then save through the existing vocabulary flow (Supabase for signed-in users, browser storage for guests).

1. **Word bank first.** If VocaRealm's built-in vocabulary or the learner's own words contain an exact match with an example sentence, the form is filled from that. No server call is made.
2. **Otherwise, the server.** The browser calls the Supabase Edge Function `vocabulary-translate` (this folder). It calls the Claude API (`claude-opus-5-5`) with structured JSON output and returns one validated card. The Anthropic API key exists only as a function secret and never reaches the browser.
3. **Not set up yet?** Nothing is filled in. The page says that automatic translation isn't configured and names the function and secret below. Learners can still use word-bank matches, open Google Translate, save the English word for later, or fill the form themselves.

## Setup

You need the [Supabase CLI](https://supabase.com/docs/guides/cli) logged in to the project `gizmaijlhtwjfmvrlzyv` and an API key from https://console.anthropic.com.

```sh
supabase login
mkdir -p supabase/functions/vocabulary-translate
cp integrations/translation/index.ts integrations/translation/response.js supabase/functions/vocabulary-translate/
supabase functions deploy vocabulary-translate --project-ref gizmaijlhtwjfmvrlzyv --no-verify-jwt
supabase secrets set --project-ref gizmaijlhtwjfmvrlzyv ANTHROPIC_API_KEY=sk-ant-...
```

`--no-verify-jwt` lets the page's readiness check (`GET`) and CORS preflight through. Every `POST` is still checked against Supabase Auth inside the function, as the pronunciation function does.

The function allows requests from `https://vocarealm.vercel.app` and the original Sites address. To test from your computer as well, set the full list:

```sh
supabase secrets set --project-ref gizmaijlhtwjfmvrlzyv ALLOWED_ORIGINS=https://vocarealm.vercel.app,http://localhost:4400
```

Check it: `curl https://gizmaijlhtwjfmvrlzyv.supabase.co/functions/v1/vocabulary-translate` should return `{"configured":true}`.

Never put the Anthropic key in `dist/`, in Vercel environment variables for this static site, or in the repository.

## Behaviour and limits

- **Signed-in learners only.** Guests can still use word-bank matches and manual entry; for new words they're asked to log in. This keeps the paid API behind an account.
- **Throttling.** 20 translations per learner per 10 minutes, counted per warm function instance. This is not a global quota. Set a monthly spend limit in the Anthropic Console before a wide public launch.
- **Model settings.** Low effort, 4,000 max tokens, and `fallbacks: "default"`, which reroutes a safety-declined request to Anthropic's recommended fallback model in the same call. An input that isn't a real word, or that is declined, returns a short message rather than a guessed card.
- **Validation.** `response.js` rejects incomplete cards and fields longer than the `user_vocabulary` column limits (term 120, meaning 250, sentences 500), and ignores invalid CEFR levels. The learner's input is limited to 120 characters and treated as data, not instructions.
- **Accuracy.** Translations and example sentences can be wrong. The page says so, and every field stays editable before saving.
- **Data.** The function stores nothing. Only the typed word and direction are sent to Anthropic; review Anthropic's data-handling terms before production.

## Validation

`npm test` covers request checks, output validation and the browser flow with a stubbed server. `npm run test:e2e` drives the real page with the function mocked. Real translations have not been tested, because the function has not been deployed with a key yet.
