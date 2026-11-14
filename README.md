# VocaRealm — full source code

This is the source for the VocaRealm website built with Sites, including the latest sentence-listening update (published version 20).

Source commit: `bf15834d6980bec9f10e946ad93a2acbbd33385e`.

The site is built with **React** and Vite. Every page is a React page; shared logic and content that several pages use (accounts, French audio, the word bank, saving vocabulary, level rules, lesson content and conversation-review storage) remain plain JavaScript files that each page loads before its React code.

| Page                                                              | React code                                    |
| ----------------------------------------------------------------- | --------------------------------------------- |
| Home, Demo                                                        | `web/src/home/`, `web/src/demo/`              |
| Log in, Sign up, Forgot/Reset password, email confirmation        | `web/src/accounts/`, `web/src/auth-callback/` |
| Explore realms                                                    | `web/src/realms/`                             |
| Realm lessons (19 packs)                                          | `web/src/realm-lesson/`                       |
| Hotel app (`learn.html`)                                          | `web/src/hotel/`                              |
| Vocabulary                                                        | `web/src/vocabulary/`                         |
| Levels, Placement, Level practice                                 | `web/src/levels/`                             |
| Read-aloud practice                                               | `web/src/pronunciation/`                      |
| Shared components (conversation review, English toggle, recorder) | `web/src/shared/`                             |

Each page is `web/<page>.html` (head, and for most pages the site navigation and footer) plus `web/src/<page>/`. To add a page, create `web/<name>.html` with `<div id="root"></div>` and a module script pointing at its React entry; Vite picks up every `web/*.html` automatically.

## Open and run

1. Open the `VocaRealm` folder in WebStorm, VS Code or Claude Code.
2. Install Node.js 22.12 or newer if needed.
3. Open a terminal in this folder and run:

```sh
npm install
npm start
```

4. Open http://localhost:4400 in your browser. Edits to React pages appear immediately.
5. Press Ctrl+C to stop the server.

If port 4400 is busy, run `npm start -- --port 4401` and open http://localhost:4401. To try the production build locally, run `npm run preview`.

Use localhost instead of opening HTML files directly, so browser audio, microphone and account features have the appropriate origin.

## What's included

- `web/`: the website source. `web/*.html` and `web/src/` are the React pages; `web/public/` holds shared scripts, styles, images, French learning content, the vendored Supabase SDK and the available Hotel video clips, copied to the site as-is.
- `dist/`: the built site produced by `npm run build` (not edited by hand; Vercel builds it on each deploy).
- `content/realm-course-source.json`: editable source data for the nineteen non-Hotel packs. The browser loads the corresponding `web/public/realm-courses.js` file; update both together when changing pack content.
- `integrations/supabase/`: database migrations and account setup notes.
- `integrations/pronunciation/`: server-side pronunciation assessment function and setup notes.
- `integrations/translation/`: server-side vocabulary translation function and setup notes.
- `tests/` and `e2e/`: unit/site checks and browser tests (see `tests/README.md`).
- `scripts/serve.mjs`: small static server for the built `web/public/` folder, used by `npm run preview` and the browser tests.

The live site is https://vocarealm.vercel.app (the original Sites copy remains at https://vocarealm-explore.steadytern512.chatgpt.site). `SOURCE-MANIFEST.json` describes the original export and still lists its old `dist/` paths.

## Useful entry points

| What you want to change                                | File                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Landing page                                           | `web/src/home/HomePage.jsx`, `web/public/welcome.css`                                             |
| Realm catalogue                                        | `web/src/realms/RealmsPage.jsx`, `web/src/realms/catalogue.json`                                  |
| Non-Hotel lessons and conversations                    | `web/src/realm-lesson/`, `web/public/realm-courses.js`                                            |
| Hotel lessons, conversation player and video role-play | `web/src/hotel/` (content in `data.js`, rules in `lesson.js`, player in `ConversationPlayer.jsx`) |
| Vocabulary page                                        | `web/src/vocabulary/`                                                                             |
| Word bank and saving personal vocabulary               | `web/public/vocabulary-base.js`, `web/public/vocabulary-store.js`                                 |
| Translate a word into the vocabulary form              | `web/src/vocabulary/translate.js`, `integrations/translation/`                                    |
| French audio playback                                  | `web/public/french-audio.js`                                                                      |
| Conversation recordings and correction review          | `web/src/shared/ConversationReview.jsx`, `web/public/conversation-review.js` (storage)            |
| Level pathway and placement                            | `web/src/levels/`, `web/public/level-content.js`, `web/public/level-core.js`                      |
| Login and signup                                       | `web/src/accounts/`, `web/public/auth-client.js`                                                  |

## Accounts and backend configuration

The exported browser code retains the existing Supabase project URL and public publishable key in `web/public/auth-client.js`. A publishable key is intended for browser use; database access must remain protected by the supplied owner-based row-level security policies. No server keys, passwords, private credentials, user records or browser recordings are included in this archive.

To use a different Supabase project, update the URL and publishable key, apply the SQL files in `integrations/supabase/`, and update the pronunciation endpoint in `web/public/pronunciation.js` if used.

For local email confirmation and password reset, add your exact localhost callback and reset URLs to Supabase's allowed redirect configuration, e.g. `http://localhost:4400/auth-callback.html` and `http://localhost:4400/reset-password.html`. Keep the production URLs if the live site still uses the project. Production email signup needs a configured email sender; see `integrations/supabase/README.md`.

## Current feature limits

- French listening uses browser/system speech voices; verify sound on your actual device. Recording requires microphone permission and a supported browser.
- Personal vocabulary can sync to the configured Supabase account. Learning progress remains in browser storage. Conversation review keeps the last five sessions per realm on that browser when storage is available; English-only pending words also stay on that browser.
- General conversation replies follow a prepared script. They are not dynamically assessed by an AI conversation service.
- Review highlights a few known written grammar patterns. It does not perform full grammar correction or pronunciation grading.
- Pronunciation assessment requires Azure Speech secrets on the server. It is not currently configured. Never put private keys in `web/public/`. The function currently allows the live site's origin; localhost needs an explicitly allowed development origin before assessment requests can succeed. See `integrations/pronunciation/README.md`.
- The vocabulary form translates English → French or French → English from the word bank first, then through the server-side `vocabulary-translate` function (Claude API) for new words. That function needs deploying with an `ANTHROPIC_API_KEY` secret before it works; until then the page says so and offers manual entry. See `integrations/translation/README.md`.
- Only the available Hotel clips are lip-synced video. Other dialogue uses text, browser audio and illustrations where available. Complete A1–C2 curricula are not included; level placement and starter content are included.

## Validate your changes

```sh
npm test
```

The source had 41 passing automated tests at export. Actual microphone/audio behavior and email delivery still require testing on a real browser and configured account environment.

## Continue with Claude Code

Open this folder and use a prompt such as:

> Read README.md, inspect the existing application, and help me continue VocaRealm. Preserve the current features, use the existing plain HTML/CSS/JavaScript structure, and run the relevant tests after changes. Do not replace this with a new template or put private API keys in browser code.

To move features into your separate Next.js project, ask Claude Code to port selected features after inspecting both projects; the file structures are different.

## Publishing elsewhere

Run `npm run build`; the `dist/` folder it produces is the deployable static website. A host must serve its named `.html` pages, assets and JavaScript. Vercel does this automatically using `vercel.json` (`npx vercel --prod`). Update Supabase redirect URLs and server-side CORS settings for any new domain. This export does not include the Sites hosting identity or Git history, so publishing a copy does not overwrite the existing live site.
