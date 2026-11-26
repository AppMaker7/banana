# Cloudflare Pages deployment

BANANA is a Vite single-page app. Cloudflare Pages can build it directly from this GitHub repository.

## Connect the repository

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Choose **Create application** → **Pages** → **Connect to Git**.
3. Authorize Cloudflare's GitHub app if prompted, then select `AppMaker7/banana`.
4. Use these build settings:
   - Production branch: `main`
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
5. Save and deploy. Future commits to `main` will trigger deployments automatically.

## Environment variables

The current frontend has public Supabase URL/publishable-key fallbacks in `src/lib/supabase.ts`. If switching to environment variables, set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (or the publishable key value used by the current client)

Only public/publishable Supabase credentials belong in Vite variables. Never add a Supabase service-role key or OpenAI API key to Cloudflare Pages frontend variables.

The BANANA AI Edge Function's `OPENAI_API_KEY` belongs in Supabase Edge Function secrets, not in Cloudflare.

## SPA routing

`public/_redirects` contains the Pages fallback so client-side routes resolve to `index.html`.
