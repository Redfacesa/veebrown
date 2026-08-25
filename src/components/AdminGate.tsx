'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, LogOut, Shield } from 'lucide-react';
import { buildSsoLoginUrl } from '@/lib/redface-pay';
import {
  applySsoTokensFromUrl,
  isAllowedAdmin,
  readAdminSession,
  signInAdmin,
  signOutAdmin,
  type AdminSession,
} from '@/lib/admin-auth';
import type { VeeBrownPlatformConfig } from '@/lib/platform-config';
import { getSupabase } from '@/lib/supabase';

export default function AdminGate({
  config,
  children,
}: {
  config: VeeBrownPlatformConfig;
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState(config.adminEmails[0] ?? 'redfacesa@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    let unsub: (() => void) | undefined;

    void (async () => {
      await applySsoTokensFromUrl();
      const current = await readAdminSession();
      setSession(current);
      setReady(true);

      // Drop stale admin UI when refresh token fails / session expires.
      if (supabase) {
        const { data } = supabase.auth.onAuthStateChange((_event, next) => {
          if (!next?.user?.email) {
            setSession(null);
            return;
          }
          setSession({ email: next.user.email, userId: next.user.id });
        });
        unsub = () => data.subscription.unsubscribe();
      }
    })();

    return () => unsub?.();
  }, []);

  const allowed = isAllowedAdmin(session, config);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const next = await signInAdmin(email, password);
      if (!isAllowedAdmin(next, config)) {
        await signOutAdmin();
        setError('This account is not authorised for Pangolin admin.');
        setSession(null);
        return;
      }
      setSession(next);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    await signOutAdmin();
    setSession(null);
  }

  if (!ready) {
    return <div className="pt-32 section-padding text-white/40">Loading admin...</div>;
  }

  if (!allowed) {
    return (
      <div className="pt-32 pb-16 section-padding max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Shield size={48} className="mx-auto mb-6 text-vbrown-gold" />
          <h1 className="font-display text-3xl mb-4">Pangolin Admin</h1>
          <p className="text-white/50 text-sm">
            Sign in with your RedFace Pay password. Only approved admin emails can access this panel.
          </p>
        </div>

        <form onSubmit={onSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-vbrown-gold/50"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-sm text-white outline-none focus:border-vbrown-gold/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
            <LogIn size={18} />
            {busy ? 'Signing in…' : 'Sign in with password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href={buildSsoLoginUrl('/admin')} className="text-sm text-vbrown-gold hover:underline">
            Or continue via RedFace Pay SSO
          </a>
        </div>

        <p className="text-xs text-white/30 mt-6 text-center">
          Linked merchant: {config.merchant?.business_name ?? 'VV Brown Fragrances'}
          {config.payMerchantId && (
            <>
              <br />
              <span className="font-mono">{config.payMerchantId}</span>
            </>
          )}
          <br />
          Add products here in Admin → Products, or in RedFace Pay — same catalog, both stay in sync.
        </p>

        <Link href="/" className="block mt-6 text-center text-sm text-white/40 hover:text-white">
          ← Back to store
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-[4.5rem] right-3 sm:top-20 sm:right-4 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-vbrown-black/80 backdrop-blur-md text-white text-xs py-2.5 px-3 min-h-10 touch-manipulation hover:bg-white/10"
          aria-label={`Sign out${session?.email ? ` (${session.email})` : ''}`}
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
      {children}
    </div>
  );
}
