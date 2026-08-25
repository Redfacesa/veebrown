'use client';

import { useState } from 'react';
import {
  Banknote,
  Copy,
  CreditCard,
  Link2,
  QrCode,
  Smartphone,
  Check,
} from 'lucide-react';
import {
  buildQrImageUrl,
  buildTailoringPayLabel,
} from '@/lib/redface-pay';
import { fmtZar } from '@/lib/api';

type Line = { name: string; quantity: number };

type Props = {
  merchantId: string;
  nfcTag?: string;
  amount: number;
  lines: Line[];
  disabled?: boolean;
  onPrepareCheckout: () => Promise<string>;
  onPayCash: () => void;
};

export default function TailoringPaymentPanel({
  merchantId,
  nfcTag,
  amount,
  lines,
  disabled,
  onPrepareCheckout,
  onPayCash,
}: Props) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [payUrl, setPayUrl] = useState('');
  const [busy, setBusy] = useState(false);

  if (!merchantId || amount <= 0) {
    return (
      <p className="text-sm text-white/40">Add services to see payment options.</p>
    );
  }

  const label = buildTailoringPayLabel(lines);
  const qrUrl = payUrl ? buildQrImageUrl(payUrl) : '';

  async function resolvePayUrl() {
    if (payUrl) return payUrl;
    setBusy(true);
    try {
      const url = await onPrepareCheckout();
      setPayUrl(url);
      return url;
    } finally {
      setBusy(false);
    }
  }

  async function handlePayCard() {
    const url = await resolvePayUrl();
    window.location.href = url;
  }

  async function handleShowQr() {
    if (!showQr) await resolvePayUrl();
    setShowQr((v) => !v);
  }

  async function copyLink() {
    const url = await resolvePayUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy payment link:', url);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-vbrown-gold/30 bg-vbrown-gold/5 p-4 flex justify-between items-center">
        <span className="text-white/70">Total due</span>
        <span className="text-2xl font-bold text-vbrown-gold">{fmtZar(amount)}</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void handlePayCard()}
          className="btn-primary w-full justify-center"
        >
          <CreditCard size={18} />
          Pay with card
        </button>

        <button
          type="button"
          disabled={disabled || busy}
          onClick={onPayCash}
          className="btn-secondary w-full justify-center"
        >
          <Banknote size={18} />
          Pay cash in store
        </button>

        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void handleShowQr()}
          className="btn-secondary w-full justify-center"
        >
          <QrCode size={18} />
          {showQr ? 'Hide QR' : 'Show QR code'}
        </button>

        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void copyLink()}
          className="btn-secondary w-full justify-center"
        >
          {copied ? <Check size={18} /> : <Link2 size={18} />}
          {copied ? 'Link copied' : 'Copy payment link'}
        </button>

        {nfcTag && (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => void resolvePayUrl().then((url) => window.open(url, '_blank'))}
            className="btn-secondary w-full justify-center sm:col-span-2"
          >
            <Smartphone size={18} />
            Tap / open RedFace Pay checkout
          </button>
        )}
      </div>

      {showQr && payUrl && (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-sm text-white/50 mb-4">Scan with any phone camera to pay {fmtZar(amount)}</p>
          <div className="inline-block rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="Payment QR code" width={220} height={220} />
          </div>
          <p className="text-xs text-white/30 mt-3 break-all">{payUrl}</p>
        </div>
      )}

      <p className="text-xs text-white/30 text-center">
        Secured by RedFace Pay · Card, QR, link & NFC tap settle to VV Brown Fragrances
      </p>
    </div>
  );
}
