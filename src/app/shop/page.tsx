import { Suspense } from 'react';
import ShopClient from './ShopClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="pt-20 section-padding text-vbrown-charcoal/40">Loading shop...</div>}>
      <ShopClient />
    </Suspense>
  );
}
