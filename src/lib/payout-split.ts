/**
 * VV Brown card checkout settles via Paystack split:
 * merchant subaccount receives 90%, the remaining 10% covers Paystack processing + RedFace platform.
 */

/** Merchant share configured on the Paystack subaccount (ACCT_trzu9bozgbdkgl7). */
export const VEEBROWN_MERCHANT_SHARE_PERCENT = 90;

export type PayoutSplit = {
  gross: number;
  merchantNet: number;
  totalFees: number;
  paystackFee: number;
  redfaceFee: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Share of the 10% fee pool that goes to Paystack (rest is RedFace). Calibrated from live ZA card settlements. */
const PAYSTACK_FEE_POOL_SHARE = 11.67 / 31.5;

/** Estimate payout split for a card / online sale (major ZAR units). */
export function computeCardPayoutSplit(grossZar: number): PayoutSplit {
  const gross = round2(Math.max(0, grossZar));
  const merchantNet = round2((gross * VEEBROWN_MERCHANT_SHARE_PERCENT) / 100);
  const totalFees = round2(gross - merchantNet);
  const paystackFee = round2(totalFees * PAYSTACK_FEE_POOL_SHARE);
  const redfaceFee = round2(totalFees - paystackFee);
  return { gross, merchantNet, totalFees, paystackFee, redfaceFee };
}

/** Sum card splits for dashboard totals (cash stays 100% to merchant). */
export function computeTodayPayout(input: {
  digitalGross: number;
  cashGross: number;
}): PayoutSplit & { cashGross: number; digitalGross: number } {
  const digital = computeCardPayoutSplit(input.digitalGross);
  const cashGross = round2(Math.max(0, input.cashGross));
  return {
    gross: round2(digital.gross + cashGross),
    merchantNet: round2(digital.merchantNet + cashGross),
    totalFees: digital.totalFees,
    paystackFee: digital.paystackFee,
    redfaceFee: digital.redfaceFee,
    cashGross,
    digitalGross: digital.gross,
  };
}
