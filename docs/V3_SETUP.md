# BANANA V3 setup

## Advanced AI

The `banana-ai` Supabase Edge Function is deployed with JWT verification enabled. It calls the OpenAI Responses API from the server; the browser never receives the provider key.

To activate replies, an adult who manages the project's API billing should add an `OPENAI_API_KEY` secret in the Supabase project's Edge Function secrets. Do not paste the key into the app, GitHub source, or a chat. API usage may incur separate charges.

If the secret is not configured, the function returns a setup message and the rest of BANANA continues to work.

## Spotify

Open BANANA Music, paste a Spotify share URL for a track, album, playlist, artist, show, or episode, then select **Load player**. Spotify renders its own player inside BANANA. Playback availability is controlled by Spotify and may vary by account, content, and device.

The Spotify embed is separate from BANANA's local/direct-audio mini-player; it does not make Spotify audio files available to BANANA's queue controls.
