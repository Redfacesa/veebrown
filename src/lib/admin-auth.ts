import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { isVeeBrownAdmin, type VeeBrownPlatformConfig } from './platform-config';

export type AdminSession = {
  email: string;
  userId: string;
};

/** Apply SSO tokens returned from RedFace Pay ecosystem login. */
export async function applySsoTokensFromUrl(): Promise<AdminSession | null> {
  if (typeof window === 'undefined') return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error || !data.session?.user.email) return null;

  params.delete('access_token');
  params.delete('refresh_token');
  params.delete('redface_user_id');
  params.delete('email');
  params.delete('display_name');
  params.delete('merchant_id');
  const clean = params.toString();
  const nextUrl = `${window.location.pathname}${clean ? `?${clean}` : ''}`;
  window.history.replaceState({}, '', nextUrl);

  return {
    email: data.session.user.email,
    userId: data.session.user.id,
  };
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user?.email) return null;
  return { email: user.email, userId: user.id };
}

/** Validate (or refresh) the Supabase session; throws when admin auth is missing. */
export async function requireAdminAuth(): Promise<AdminSession> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (!userErr && userData.user?.email) {
    return { email: userData.user.email, userId: userData.user.id };
  }

  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (error || !refreshed.session?.user?.email) {
    throw new Error('Your admin session expired. Sign out and sign in again, then retry.');
  }
  return {
    email: refreshed.session.user.email,
    userId: refreshed.session.user.id,
  };
}

export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  if (!data.session?.user.email) throw new Error('Sign-in failed');

  return {
    email: data.session.user.email,
    userId: data.session.user.id,
  };
}

export async function signOutAdmin(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function isAllowedAdmin(session: AdminSession | null, config: VeeBrownPlatformConfig): boolean {
  return isVeeBrownAdmin(session?.email, config);
}

export function sessionFromSupabase(session: Session | null): AdminSession | null {
  const email = session?.user.email;
  if (!email) return null;
  return { email, userId: session.user.id };
}
