import { createClient } from '@supabase/supabase-js';

// Fallbacks prevent createClient from throwing "Invalid URL" when env vars are
// absent (e.g. a Vercel build before variables are configured). Auth calls will
// fail gracefully rather than crashing the app at module load time.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
  { auth: { flowType: 'pkce' } },
);
