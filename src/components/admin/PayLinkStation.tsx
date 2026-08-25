'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, QrCode, Wifi } from 'lucide-react';
import {
  buildMerchantPortalUrl,
  buildNfcTapUrl,
  buildQrImageUrl,
} from '@/lib/redface-pay';
import {
  PANGOLIN_COUNTER_TAP_CODE,
  PANGOLIN_COUNTER_WAITING_URL,
  type PayStation,
} from '@/lib/pay-stations';

type Props = {
  merchantId: string;
  stations: PayStation[];
  selectedStationId?: string | null;
  selectedTapCode?: string | null;
  onSelectStation?: (station: PayStation) => void;
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    window.prompt('Copy this link:', value);
    return false;
  }
}

export default function PayLinkStation({
  merchantId,
  stations,
  selectedStationId,
  selectedTapCode,
  onSelectStation,
}: Props) {
  const [copied, setCopied] = useState(false);
  const selected =
    stations.find(
      (s) =>
        (selectedStationId && s.id && s.id === selectedStationId) ||
        (selectedTapCode && s.tapCode.toUpperCase() === selectedTapCode.toUpperCase()),
    ) ||
    stations.find((s) => s.tapCode.toUpperCase() === PANGOLIN_COUNTER_TAP_CODE) ||
    stations[0] ||
    null;

  useEffect(() => {
    if (!selected || !onSelectStation) return;
    const same =
      (selected.id && selected.id === selectedStationId) ||
      selected.tapCode.toUpperCase() === (selectedTapCode || '').toUpperCase();
    if (!same) onSelectStation(selected);
  }, [selected, selectedStationId, selectedTapCode, onSelectStation]);

  const waitingUrl = useMemo(() => {
    if (!selected) return PANGOLIN_COUNTER_WAITING_URL;
    if (selected.tapCode.toUpperCase() === PANGOLIN_COUNTER_TAP_CODE) {
      return PANGOLIN_COUNTER_WAITING_URL;
    }
    return buildNfcTapUrl(selected.tapCode);
  }, [selected]);
  const qrSrc = waitingUrl ? buildQrImageUrl(waitingUrl, 260) : '';

  async function onCopy() {
    if (!waitingUrl) return;
    const ok = await copyText(waitingUrl);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!merchantId) {
    return (
      <div className="glass rounded-2xl p-5 text-sm text-amber-200 border border-amber-500/30">
        Merchant ID missing.
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Wifi size={20} className="text-vbrown-gold" />
          Counter QR / NFC (always waiting)
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Print this QR once. Customer opens it and sees “waiting for amount”. You set the price on POS —
          the same link updates automatically. Do not put <span className="font-mono text-white/70">amount=</span> in the printed QR.
        </p>
      </div>

      {stations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center space-y-3">
          <p className="text-sm text-white/50">
            No NFC / counter stations found for this merchant yet.
          </p>
          <p className="text-xs text-white/40">
            In RedFace Pay → Get Paid, create an NFC card / station. It gets a code like <span className="font-mono text-vbrown-gold">RFP-XXXXXXXX</span>.
          </p>
          <a
            href={buildMerchantPortalUrl('home')}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm inline-flex"
          >
            <ExternalLink size={14} />
            Open RedFace Pay portal
          </a>
        </div>
      ) : (
        <>
          {stations.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {stations.map((s) => {
                const isSelected =
                  selected?.tapCode.toUpperCase() === s.tapCode.toUpperCase() ||
                  (!!selected?.id && selected.id === s.id);
                return (
                  <button
                    key={s.id || s.tapCode}
                    type="button"
                    onClick={() => onSelectStation?.(s)}
                    className={`rounded-full px-3 py-2 text-sm border transition ${
                      isSelected
                        ? 'bg-vbrown-gold text-vbrown-black border-vbrown-gold font-semibold'
                        : 'border-white/15 text-white/65 hover:border-white/30'
                    }`}
                  >
                    {s.label}
                    <span className="ml-2 font-mono text-xs opacity-70">{s.tapCode}</span>
                  </button>
                );
              })}
            </div>
          )}

          {selected && (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-vbrown-gold/30 bg-vbrown-gold/5 p-4 space-y-3 text-center">
                <p className="text-xs uppercase tracking-wide text-vbrown-gold/80">Print this QR on the counter</p>
                <div className="mx-auto w-fit rounded-xl bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrSrc} alt="Waiting counter QR" width={260} height={260} className="block" key={waitingUrl} />
                </div>
                <p className="text-sm font-semibold text-white">Always the same link — never regenerates</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-white/40">NFC / station code</p>
                  <p className="font-mono text-lg text-vbrown-gold">{selected.tapCode}</p>
                  <p className="text-sm text-white/50">{selected.label}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-white/40">Link to program on NFC / print as QR</p>
                  <p className="font-mono text-xs text-white/70 break-all">{waitingUrl}</p>
                </div>
                <ol className="text-xs text-white/50 space-y-1.5 list-decimal list-inside">
                  <li>Customer scans this QR (or taps the NFC card)</li>
                  <li>Phone shows “waiting for amount”</li>
                  <li>On POS you enter the price and tap “Send amount to counter”</li>
                  <li>Their phone updates with that amount — same link, no new QR</li>
                </ol>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button type="button" onClick={() => void onCopy()} className="btn-primary text-sm justify-center min-h-11">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy waiting link'}
                  </button>
                  <a
                    href={waitingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-sm justify-center min-h-11"
                  >
                    <QrCode size={16} />
                    Test waiting page
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-white/35 font-mono break-all">Merchant ID: {merchantId}</p>
    </div>
  );
}
