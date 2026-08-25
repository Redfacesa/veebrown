'use client';

import { useEffect } from 'react';
import { registerVeeBrownServiceWorker } from '@/lib/pwa-install';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

export default function PwaShell() {
  useEffect(() => {
    registerVeeBrownServiceWorker();
  }, []);

  return <PwaInstallPrompt />;
}
