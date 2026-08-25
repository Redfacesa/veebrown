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
      <button
        type="button"
        onClick={onBuyNow}
        className="btn-classic w-full flex items-center justify-center gap-2 text-sm"
      >
        <Zap size={18} className="text-vbrown-cream" strokeWidth={1.75} />
        Buy now — {fmtZar(amount)}
      </button>

      <a
        href={payUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline w-full flex items-center justify-center gap-2 text-sm"
      >
        <CreditCard size={18} className="text-vbrown-charcoal" strokeWidth={1.75} />
        Pay with RedFace Pay
      </a>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {METHODS.map((m) => (
          <a
            key={m.id}
            href={payUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-center gap-2 p-3 min-h-[88px] bg-vbrown-cream border border-vbrown-charcoal/12 text-[10px] tracking-[0.12em] uppercase text-vbrown-charcoal/70 hover:border-vbrown-gold hover:bg-white transition-all duration-300"
          >
            <m.icon
              size={22}
              className="text-black group-hover:text-vbrown-charcoal transition-colors"
              strokeWidth={1.5}
            />
            <span className="text-center leading-tight group-hover:text-vbrown-charcoal">{m.label}</span>
          </a>
        ))}
      </div>

      {!PANGOLIN_MERCHANT_ID && (
        <p className="text-xs text-amber-800/80 text-center">
          Set NEXT_PUBLIC_VEEBROWN_MERCHANT_ID to enable RedFace Pay checkout.
        </p>
      )}
    </div>
  );
}
