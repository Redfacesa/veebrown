'use client';

import TailoringPos from '@/components/TailoringPos';

export default function TailoringPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="section-padding mb-10">
        <h1 className="font-display text-4xl lg:text-5xl mb-4">Tailoring POS</h1>
        <p className="text-white/50 max-w-2xl">
          Add alterations to the till — total updates automatically. Pay with card, cash, QR code, payment link, or
          RedFace Pay NFC tap at the counter.
        </p>
      </div>
      <div className="section-padding">
        <TailoringPos />
      </div>
    </div>
  );
}
