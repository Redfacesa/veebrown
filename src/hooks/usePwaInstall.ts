'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  VEEBROWN_PWA,
  detectPwaPlatform,
  isIosDevice,
  isIosSafari,
  isMobileUserAgent,
  isPwaDismissed,
  isStandalonePwa,
  persistPwaDismiss,
  type PwaAppConfig,
  type PwaPlatform,
} from '@/lib/pwa-install';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let sharedDeferred: BeforeInstallPromptEvent | null = null;
let listenersAttached = false;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((fn) => fn());
}

function attachGlobalListeners(appId: string) {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  window.addEventListener('beforeinstallprompt', (e) => {
    if (isStandalonePwa() || isPwaDismissed(appId)) return;
    e.preventDefault();
    sharedDeferred = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    sharedDeferred = null;
    notify();
  });
}

export function usePwaInstall(app: PwaAppConfig = VEEBROWN_PWA, delayMs = 1200) {
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const [, tick] = useState(0);

  const platform: PwaPlatform = detectPwaPlatform();

  useEffect(() => {
    attachGlobalListeners(app.id);
    setInstalled(isStandalonePwa());
    setDismissed(isPwaDismissed(app.id));
    const timer = window.setTimeout(() => setReady(true), delayMs);

    const rerender = () => {
      setInstalled(isStandalonePwa());
      tick((n) => n + 1);
    };
    subscribers.add(rerender);
    return () => {
      window.clearTimeout(timer);
      subscribers.delete(rerender);
    };
  }, [app.id, delayMs]);

  const install = useCallback(async () => {
    const promptEvent = sharedDeferred;
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    sharedDeferred = null;
    notify();
    if (outcome === 'accepted') setInstalled(true);
    return outcome === 'accepted';
  }, []);

  const dismiss = useCallback(() => {
    persistPwaDismiss(app.id);
    sharedDeferred = null;
    setDismissed(true);
    notify();
  }, [app.id]);

  const canInstall = !!sharedDeferred && !installed && !dismissed;
  const showIosHint =
    ready && platform === 'ios' && isMobileUserAgent() && !installed && !dismissed && !sharedDeferred;
  const showBanner = ready && !installed && !dismissed && (canInstall || showIosHint);

  return {
    app,
    platform,
    canInstall,
    showIosHint,
    showIosSafariHint: showIosHint && isIosSafari(),
    showIosOpenSafariHint: showIosHint && isIosDevice() && !isIosSafari(),
    showBanner,
    installed,
    install,
    dismiss,
  };
}
