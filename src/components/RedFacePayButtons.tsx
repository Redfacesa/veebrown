'use client';

import { CreditCard, QrCode, Smartphone, Wallet, Split, Zap } from 'lucide-react';
import { buildDirectPayUrl } from '@/lib/redface-pay';
import { PANGOLIN_MERCHANT_ID } from '@/lib/supabase';
import { fmtZar } from '@/lib/api';

type Props = {
  amount: number;
  label: string;
  onBuyNow?: () => void;
  className?: string;
};

const METHODS = [
  { id: 'card', icon: CreditCard, label: 'Pay with RedFace Pay' },
  { id: 'qr', icon: QrCode, label: 'QR Pay' },
  { id: 'tap', icon: Smartphone, label: 'Tap to Pay' },
  { id: 'wallet', icon: Wallet, label: 'Wallet' },
  { id: 'split', icon: Split, label: 'Split Payment' },
] as const;

export default function RedFacePayButtons({ amount, label, onBuyNow, className = '' }: Props) {
  const payUrl = PANGOLIN_MERCHANT_ID
    ? buildDirectPayUrl({ merchantId: PANGOLIN_MERCHANT_ID, amountZar: amount, label })
    : '#';

  return (
    <div className={`space-y-3 ${className}`}>
      <button type="button" onClick={onBuyNow} className="btn-primary w-full text-lg">
        <Zap size={20} />
        Buy Now — {fmtZar(amount)}
      </button>

      <a
        href={payUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary w-full flex"
      >
        <CreditCard size={18} />
        Pay with RedFace Pay
      </a>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        {METHODS.slice(1).map((m) => (
          <a
            key={m.id}
            href={payUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl glass text-xs text-white/60 hover:text-vbrown-gold hover:border-vbrown-gold/30 transition-all"
          >
            <m.icon size={20} />
            {m.label}
          </a>
        ))}
      </div>

      {!PANGOLIN_MERCHANT_ID && (
        <p className="text-xs text-amber-400/80 text-center">
          Set NEXT_PUBLIC_VEEBROWN_MERCHANT_ID to enable RedFace Pay checkout.
        </p>
      )}
    </div>
  );
}
