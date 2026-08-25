'use client';

import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { isStandalonePwa } from '@/lib/pwa-install';

function InstallHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-vbrown-cream p-5 shadow-2xl text-sm text-vbrown-charcoal/75">
        <p className="font-display text-lg text-vbrown-charcoal mb-2">Save VV Brown on your device</p>
        <ul className="space-y-2 mb-4 list-disc pl-4">
          <li>
            <strong>iPhone:</strong> Safari → Share → Add to Home Screen
          </li>
          <li>
            <strong>Android:</strong> Chrome menu → Install app or Add to Home screen
          </li>
          <li>
            <strong>Computer:</strong> Install icon in the Chrome or Edge address bar
          </li>
        </ul>
        <p className="text-xs text-vbrown-charcoal/50 mb-4">No App Store or Play Store download required.</p>
        <button type="button" onClick={onClose} className="btn-classic w-full">
          Got it
        </button>
      </div>
    </div>
  );
}

export default function PwaInstallButton({ className = '' }: { className?: string }) {
  const { canInstall, showIosHint, installed, install } = usePwaInstall(undefined, 400);
  const [helpOpen, setHelpOpen] = useState(false);
  const [hide, setHide] = useState(true);

  useEffect(() => {
    setHide(isStandalonePwa() || installed);
  }, [installed]);

  if (hide) return null;

  const handleClick = async () => {
    if (canInstall) {
      const ok = await install();
      if (ok) return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className={`inline-flex items-center gap-1.5 min-h-[44px] text-[10px] tracking-[0.2em] uppercase text-vbrown-gold hover:text-vbrown-cream transition-colors ${className}`}
        title={showIosHint ? 'Add to Home Screen' : 'Install app'}
      >
        <Download className="h-3.5 w-3.5" />
        Get app
      </button>
      {helpOpen ? <InstallHelpModal onClose={() => setHelpOpen(false)} /> : null}
    </>
  );
}
