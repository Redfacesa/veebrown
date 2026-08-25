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
import VeeBrownLogo from '@/components/VeeBrownLogo';

export default function AdminGate({
  config,
  children,
}: {
  config: VeeBrownPlatformConfig;
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('valenciakabasele@gmail.com');
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
      if (current?.email) setEmail(current.email);
      setReady(true);

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
        setError('This email is not authorised for VV Brown admin. Use valenciakabasele@gmail.com or info@redfacepay.co.za.');
        setSession(null);
        return;
      }
      setSession(next);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Use the same password as RedFace Pay.');
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    await signOutAdmin();
    setSession(null);
  }

  if (!ready) {
    return <div className="pt-32 section-padding admin-muted">Loading admin...</div>;
  }

  if (!allowed) {
    return (
      <div className="pt-24 pb-16 section-padding max-w-md mx-auto bg-vbrown-ivory min-h-[70vh]">
        <div className="text-center mb-10">
          <VeeBrownLogo href="/" size="footer" className="mx-auto mb-8" />
          <Shield size={32} className="mx-auto mb-4 text-vbrown-gold" />
          <h1 className="font-display text-2xl text-vbrown-charcoal mb-3">Merchant admin</h1>
          <p className="admin-muted text-sm leading-relaxed">
            Sign in with the <strong className="text-vbrown-charcoal font-normal">same email and password</strong> you
            use on RedFace Pay. One login for your merchant account and this storefront.
          </p>
        </div>

        <form onSubmit={onSubmit} className="admin-card p-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-[10px] tracking-[0.25em] uppercase admin-muted mb-2">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-vbrown-charcoal/15 bg-white px-4 py-3 text-sm text-vbrown-charcoal outline-none focus:border-vbrown-gold"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-[10px] tracking-[0.25em] uppercase admin-muted mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-vbrown-charcoal/15 bg-white px-4 py-3 pr-12 text-sm text-vbrown-charcoal outline-none focus:border-vbrown-gold"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 admin-muted hover:text-vbrown-charcoal"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={busy} className="btn-classic w-full justify-center gap-2">
            <LogIn size={16} />
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href={buildSsoLoginUrl('/admin')} className="text-sm text-vbrown-gold hover:underline">
            Continue via RedFace Pay SSO
          </a>
        </div>

        <p className="text-xs admin-muted mt-8 text-center leading-relaxed">
          Approved admins: valenciakabasele@gmail.com, info@redfacepay.co.za
          <br />
          Manage fragrances, sales, inventory, and delivery from this panel.
        </p>

        <Link href="/" className="block mt-6 text-center text-sm admin-muted hover:text-vbrown-gold">
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-[4.5rem] right-3 sm:top-20 sm:right-4 z-40">
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-2 border border-vbrown-charcoal/15 bg-vbrown-cream/95 text-vbrown-charcoal text-xs py-2 px-3 min-h-10 hover:border-vbrown-gold"
          aria-label={`Sign out${session?.email ? ` (${session.email})` : ''}`}
        >
          <LogOut size={14} />
          <span className="hidden sm:inline max-w-[140px] truncate">{session?.email ?? 'Sign out'}</span>
        </button>
      </div>
      {children}
    </div>
  );
}
