# VocaRealm account integration

Project: VocaRealm, inside Spine Project, Canada Central.
Project reference: gizmaijlhtwjfmvrlzyv.

The site uses the locally vendored @supabase/supabase-js 2.118.0 UMD build and its publishable key. No service-role or management key is included. Passwords are submitted directly to Supabase over HTTPS and are never stored by application code. SDK sessions are persisted in browser storage and refreshed by Supabase.

## Config required before public registration

1. In Supabase Authentication > URL Configuration, set Site URL to:
   https://vocarealm-explore.steadytern512.chatgpt.site
2. Add these exact allowed Redirect URLs:
   https://vocarealm-explore.steadytern512.chatgpt.site/auth-callback.html
   https://vocarealm-explore.steadytern512.chatgpt.site/reset-password.html
3. In Authentication > Email / SMTP settings, connect a production email sender. The default sender only delivers to project-team addresses and is not suitable for public signup. Keep email confirmation enabled. Verify your sending domain with your provider.
4. Configure password minimum length as 12 in the server Auth settings to match the form; review public-signup rate limits and abuse controls before launch.
5. Verify signup, confirmation, login, password reset, logout and expired-link recovery end to end with an inbox you control. Remove the pilot-registration notice from signup.html only after these pass.

The Supabase connector currently exposes project, SQL and key operations, but no Auth settings or SMTP configuration mutation. No settings were bypassed and no management credential was embedded in the site.

## Database

profiles.sql records the applied hosted migration create_vocarealm_profiles. The signup trigger provisions a unique lowercase username. Profiles are readable only by their owners via RLS; the anonymous role has no table privileges. Username metadata is display data, never an authorization claim. The trigger is private, has a fixed search_path and has no direct EXECUTE grants to public roles.

## Scope

Learning progress is still stored per user in this browser; anonymous practice has a separate existing guest key. It is not yet synced to Supabase. Lessons and demo remain available without logging in. Use server-side authorization and RLS for any future account-owned records; frontend navigation is not an access-control boundary.

## Verification

Two temporary synthetic accounts were used for password-login and RLS checks without sending emails. Automated cleanup was declined by Supabase; the qa_ test profiles remain and can be removed in Authentication > Users. Their generated passwords were not saved in this repository. Email delivery and redirect configuration cannot be claimed verified by those checks.

## Personal vocabulary

`user-vocabulary.sql` records the applied create_personal_vocabulary migration. Entries include a French term, English meaning, optional example and translation, realm, optional level and encounter note. Every operation is scoped to the authenticated owner via RLS; clients cannot reassign ownership. Account entries are fetched in pages and cached per user. Guests use a separate browser-only collection. Guest words are not silently merged into accounts.

Real REST tests verified owner insert/update/delete, blocked cross-user read/update/delete, blocked owner reassignment and denied anonymous writes. The newly created vocabulary test row was successfully removed. The two older synthetic Auth accounts remain as noted above.

Core A1 packs now merge additional vocabulary and appropriate personal entries with data-driven session sizes. Custom words with no sentence, or an example that does not contain the actual word, get vocabulary practice without an invented fill-in-the-blank sentence. Personal entries are never promoted into everyone's shared curriculum. Learning attempts and XP still remain in browser storage.
