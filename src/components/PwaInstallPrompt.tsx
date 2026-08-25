'use client';

import { Download, PlusSquare, Share, X } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

function IosSteps({ appName }: { appName: string }) {
  return (
    <ol className="mt-4 space-y-3 text-sm text-vbrown-charcoal/70">
      <li className="flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vbrown-gold/15 text-xs font-bold text-vbrown-gold">
          1
        </span>
        <span>
          Tap <Share className="mx-0.5 inline h-4 w-4 align-text-bottom text-[#007AFF]" />{' '}
          <strong className="text-vbrown-charcoal">Share</strong> in Safari (bottom toolbar on iPhone).
        </span>
      </li>
      <li className="flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vbrown-gold/15 text-xs font-bold text-vbrown-gold">
          2
        </span>
        <span>
          Tap <PlusSquare className="mx-0.5 inline h-4 w-4 align-text-bottom" />{' '}
          <strong className="text-vbrown-charcoal">Add to Home Screen</strong>.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vbrown-gold/15 text-xs font-bold text-vbrown-gold">
          3
        </span>
        <span>
          Tap <strong className="text-vbrown-charcoal">Add</strong>. {appName} opens full screen from your home screen.
        </span>
      </li>
    </ol>
  );
}

export default function PwaInstallPrompt() {
  const {
    app,
    platform,
    canInstall,
    showIosHint,
    showIosOpenSafariHint,
    showBanner,
    install,
    dismiss,
  } = usePwaInstall();

  if (!showBanner) return null;

  if (showIosHint) {
    return (
      <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true">
        <div className="w-full max-w-sm rounded-3xl bg-vbrown-cream p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <img src={app.iconUrl} alt="" className="h-14 w-14 shrink-0 rounded-2xl border border-vbrown-charcoal/10 bg-white p-1 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] tracking-[0.35em] uppercase text-vbrown-gold">Save to your phone</p>
              <h2 className="font-display text-xl text-vbrown-charcoal mt-1">{app.name}</h2>
              <p className="mt-1 text-sm text-vbrown-charcoal/60">{app.installTagline}</p>
            </div>
            <button type="button" onClick={dismiss} className="shrink-0 p-1 text-vbrown-charcoal/40 hover:text-vbrown-charcoal" aria-label="Dismiss">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-3 rounded-xl border border-vbrown-gold/25 bg-vbrown-ivory px-3 py-2.5 text-xs text-vbrown-charcoal/75">
            {app.noAppStoreNote}
          </p>
          {showIosOpenSafariHint ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold">Open in Safari first</p>
              <p className="mt-1">Copy this page link, open Safari, paste it, then follow the steps below.</p>
            </div>
          ) : (
            <IosSteps appName={app.shortName} />
          )}
          <button type="button" onClick={dismiss} className="btn-classic w-full mt-6">
            Got it
          </button>
        </div>
      </div>
    );
  }

  const isDesktop = platform === 'desktop' && canInstall;

  return (
    <div
      className={
        isDesktop
          ? 'fixed bottom-6 left-1/2 z-40 hidden w-[min(100%-1.5rem,28rem)] -translate-x-1/2 md:block'
          : 'fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] inset-x-3 z-40 md:hidden'
      }
    >
      <div
        className={`mx-auto flex max-w-lg items-start gap-3 rounded-2xl p-4 shadow-xl ${
          isDesktop ? 'border border-vbrown-gold/30 bg-black' : 'border border-vbrown-charcoal/10 bg-vbrown-cream'
        }`}
      >
        <img
          src={app.iconUrl}
          alt=""
          className={`h-11 w-11 shrink-0 rounded-xl object-contain p-0.5 ${
            isDesktop ? 'border border-white/15 bg-[#111]' : 'border border-vbrown-charcoal/10 bg-white'
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${isDesktop ? 'text-vbrown-cream' : 'text-vbrown-charcoal'}`}>
            {isDesktop ? `Install ${app.name}` : `Save ${app.shortName}`}
          </p>
          <p className={`mt-0.5 text-xs ${isDesktop ? 'text-vbrown-cream/55' : 'text-vbrown-charcoal/55'}`}>
            {app.noAppStoreNote}
          </p>
          <button
            type="button"
            onClick={() => void install()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-vbrown-charcoal px-3 py-2 text-xs font-semibold text-vbrown-cream hover:bg-black"
          >
            <Download className="h-3.5 w-3.5" />
            {isDesktop ? 'Install app' : 'Add to home screen'}
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className={`shrink-0 p-1 ${isDesktop ? 'text-white/40 hover:text-white' : 'text-vbrown-charcoal/40 hover:text-vbrown-charcoal'}`}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
