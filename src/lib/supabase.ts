import { createClient } from "@supabase/supabase-js";

// These are public client credentials (URL + publishable key), not server secrets.
// Supabase Row Level Security protects user data; never put a service-role/secret key here.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://wuesuvvoqiwrvclbxlco.supabase.co";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "sb_publishable_6eaIM4hmftd1Dg93mya0yw_LPM0FIC3";

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
