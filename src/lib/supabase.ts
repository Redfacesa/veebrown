import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Lazy Supabase client — never throws when env vars are missing (e.g. Vercel build). */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

/** VV Brown Fragrances merchant on RedFace Pay */
export const PANGOLIN_MERCHANT_ID =
  process.env.NEXT_PUBLIC_VEEBROWN_MERCHANT_ID || '44ea657f-217c-4700-9441-ad391a13e354';
export const REDFACE_PAY_URL = (process.env.NEXT_PUBLIC_REDFACE_PAY_URL ?? 'https://www.redfacepay.co.za').replace(/\/$/, '');
export const COMMERCE_API = process.env.NEXT_PUBLIC_REDFACE_COMMERCE_API ?? '';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
