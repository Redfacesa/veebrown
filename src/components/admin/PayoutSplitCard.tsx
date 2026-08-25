'use client';

import { fmtZar } from '@/lib/api';
import type { PayoutSplit } from '@/lib/payout-split';

function SplitRow({
  label,
  amount,
  muted,
  highlight,
  sub,
}: {
  label: string;
  amount: number;
  muted?: boolean;
  highlight?: boolean;
  sub?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 py-2 ${muted ? 'text-vbrown-charcoal/55' : ''}`}>
      <div className="min-w-0">
        <p className={`text-sm ${highlight ? 'font-display text-vbrown-charcoal' : ''}`}>{label}</p>
        {sub && <p className="text-xs admin-muted mt-0.5">{sub}</p>}
      </div>
      <span
        className={`shrink-0 tabular-nums text-sm ${
          highlight ? 'font-display text-lg text-vbrown-gold' : muted ? 'text-vbrown-charcoal/70' : 'text-vbrown-charcoal'
        }`}
      >
        {fmtZar(amount)}
      </span>
    </div>
  );
}

export default function PayoutSplitCard({
  split,
  title = 'How this payment splits',
  reference,
  compact,
}: {
  split: PayoutSplit;
  title?: string;
  reference?: string | null;
  compact?: boolean;
}) {
  if (split.gross <= 0) return null;

  return (
    <div className={`admin-card ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-display text-lg text-vbrown-charcoal">{title}</h3>
          <p className="text-xs admin-muted mt-1">
            Customer pays the full price. Paystack settles to your bank. RedFace takes its share from the split, not from your pocket separately.
          </p>
        </div>
        {reference && (
          <span className="text-[11px] font-mono admin-muted truncate max-w-[180px]" title={reference}>
            {reference}
          </span>
        )}
      </div>

      <div className="divide-y divide-vbrown-charcoal/8 border border-vbrown-charcoal/10 bg-white px-4">
        <SplitRow label="Customer paid" amount={split.gross} />
        <SplitRow
          label="Paystack processing"
          amount={split.paystackFee}
          muted
          sub="Card / online fee (your bank partner)"
        />
        <SplitRow
          label="RedFace platform"
          amount={split.redfaceFee}
          muted
          sub="RedFace fee from the 10% split (website, checkout, and dashboard)"
        />
        <SplitRow
          label="You receive"
          amount={split.merchantNet}
          highlight
          sub="Settled to VV Brown Fragrances PTY (about 90% of card sales)"
        />
      </div>

      {!compact && (
        <p className="text-xs admin-muted mt-3">
          Cash at the counter has no card processing fee. Figures for card sales are estimates until Paystack confirms settlement.
        </p>
      )}
    </div>
  );
}
