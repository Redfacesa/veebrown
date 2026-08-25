export type PwaAppConfig = {
  id: string;
  name: string;
  shortName: string;
  iconUrl: string;
  themeColor: string;
  hostname?: string;
  installTagline?: string;
  noAppStoreNote?: string;
};

export const VEEBROWN_PWA: PwaAppConfig = {
  id: 'veebrown',
  name: 'VV Brown Fragrances',
  shortName: 'VV Brown',
  iconUrl: '/icons/icon-192.png',
  themeColor: '#0a0a0a',
  installTagline: 'Shop signature scents and checkout with RedFace Pay from your home screen.',
  noAppStoreNote:
    'No App Store or Play Store needed. Save once to your home screen and open full screen like an app.',
};

export function pwaDismissKey(appId: string): string {
  return `${appId}_pwa_install_dismissed`;
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

export function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

export function isIosSafari(): boolean {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/crios|fxios|edgios|opios|mercury/i.test(ua);
}

export type PwaPlatform = 'android' | 'ios' | 'desktop' | 'unknown';

export function detectPwaPlatform(): PwaPlatform {
  if (isAndroidDevice()) return 'android';
  if (isIosDevice()) return 'ios';
  if (typeof navigator !== 'undefined' && !isMobileUserAgent()) return 'desktop';
  return 'unknown';
}

export function isPwaDismissed(appId: string): boolean {
  try {
    return localStorage.getItem(pwaDismissKey(appId)) === '1';
  } catch {
    return false;
  }
}

export function persistPwaDismiss(appId: string): void {
  try {
    localStorage.setItem(pwaDismissKey(appId), '1');
  } catch {
    /* private mode */
  }
}

export function registerVeeBrownServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline install optional */
    });
  });
}
