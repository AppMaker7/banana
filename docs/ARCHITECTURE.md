# BANANA architecture

## Stack
- React 19 + TypeScript + Vite for the web/PWA application.
- Supabase Auth for accounts and sessions.
- Supabase Postgres for application data.
- Supabase Storage for private user-uploaded audio and avatars, with per-user access policies.
- Server-side/Edge Function boundary for AI requests and privileged operations. Never expose service-role keys or AI provider secrets in browser code.

## Feature domains
- Home: dashboard composition and summaries.
- Health: workout plans, sessions, sets, exercise catalogue, recovery logs and muscle-volume summaries.
- Focus: focus sessions, challenge completion and unlock history. A browser PWA cannot enforce restrictions on other Android apps; that requires a separately built Android companion and explicit permissions.
- Music: playlists and track metadata. External streaming integrations must use supported authorization/player SDKs; imported audio belongs in private storage.
- AI: task/workout generation and progress explanations through a server-side endpoint with user consent and rate limits.
- Profile: Supabase Auth identity, profile and achievements.
- Settings: preferences, privacy controls, export and notification preferences.

## Data ownership
Every user-owned row includes user_id (or is linked through a parent row) and is protected by Postgres Row Level Security. Never trust a client-supplied user ID: derive it from the authenticated session in server-side operations. Keep public reference/catalogue data separate from private user records.

## Database
The initial schema is in supabase/migrations/0001_initial_schema.sql. It creates profiles, settings, tasks, workout plans/sessions/sets, focus sessions, recovery logs, achievements, playlists and tracks, plus indexes, account bootstrap triggers and RLS policies.

## Environment
Copy .env.example to .env.local and fill in the Supabase project URL and publishable/anon key from the Supabase project dashboard. These are browser-safe project values; never place a service-role key in VITE_ variables or commit real credentials.

## Development order
1. Apply the initial SQL migration in the Supabase SQL Editor.
2. Add the Supabase JS client and typed client wrapper.
3. Implement sign-up/sign-in and session handling.
4. Migrate feature data from local-only state to user-scoped database records.
5. Add Storage buckets and policies only when upload features are implemented.
6. Add server-side AI and export endpoints; keep secrets server-side.
7. Test RLS with two separate test accounts before production use.
