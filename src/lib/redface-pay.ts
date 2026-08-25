import { REDFACE_PAY_URL, SITE_URL } from './supabase';

export type PayMethod = 'card' | 'qr' | 'tap' | 'wallet' | 'split';

export function buildCheckoutUrl(opts: {
  orderId: string;
  merchantId: string;
  amountZar: number;
  label: string;
  returnUrl?: string;
}) {
  const q = new URLSearchParams({
    utm_source: 'veebrown',
    utm_medium: 'fashion_checkout',
    ecosystem_from: 'veebrown',
    commerce_order_id: opts.orderId,
    merchant_id: opts.merchantId,
    amount: String(opts.amountZar),
    label: opts.label.slice(0, 80),
    return_url: opts.returnUrl ?? `${SITE_URL}/dashboard/orders`,
  });
  return `${REDFACE_PAY_URL}/pay?${q.toString()}`;
}

/** Open-amount merchant pay page — use on QR posters and NFC cards. */
export function buildMerchantPayUrl(
  merchantId: string,
  opts?: { amountZar?: number; label?: string; returnUrl?: string },
) {
  const q = new URLSearchParams({
    ecosystem_from: 'veebrown',
    merchant_id: merchantId,
  });
  if (opts?.amountZar != null && opts.amountZar > 0) q.set('amount', String(Math.round(opts.amountZar)));
  if (opts?.label?.trim()) q.set('label', opts.label.trim().slice(0, 80));
  if (opts?.returnUrl) q.set('return_url', opts.returnUrl);
  const qs = q.toString();
  return `${REDFACE_PAY_URL}/pay/${merchantId}${qs ? `?${qs}` : ''}`;
}

export function buildDirectPayUrl(opts: {
  merchantId: string;
  amountZar: number;
  label: string;
  returnUrl?: string;
}) {
  return buildMerchantPayUrl(opts.merchantId, {
    amountZar: opts.amountZar,
    label: opts.label,
    returnUrl: opts.returnUrl ?? SITE_URL,
  });
}

export function buildSsoLoginUrl(returnPath = '/dashboard') {
  const returnUrl = `${SITE_URL}${returnPath}`;
  const q = new URLSearchParams({
    ecosystem_from: 'veebrown',
    return_url: returnUrl,
    role: 'customer',
  });
  return `${REDFACE_PAY_URL}/ecosystem/login?${q.toString()}`;
}

/** RedFace Pay merchant portal — products, payments, inventory (same DB as this store). */
export function buildMerchantPortalUrl(portalTab = 'products') {
  const q = new URLSearchParams({ view: 'portal' });
  if (portalTab && portalTab !== 'home') q.set('portalTab', portalTab);
  return `${REDFACE_PAY_URL}/merchant?${q.toString()}`;
}

export type TailoringPayOptions = {
  merchantId: string;
  amountZar: number;
  label: string;
  returnUrl?: string;
  bookingRef?: string;
};

/** Card / link checkout — amount pre-filled for tailoring POS. */
export function buildTailoringPayUrl(opts: TailoringPayOptions) {
  const q = new URLSearchParams({
    ecosystem_from: 'veebrown',
    utm_source: 'veebrown',
    utm_medium: 'tailoring_pos',
    amount: String(opts.amountZar),
    label: opts.label.slice(0, 80),
    return_url: opts.returnUrl ?? `${SITE_URL}/tailoring?paid=1`,
  });
  if (opts.bookingRef) q.set('reference', opts.bookingRef);
  return `${REDFACE_PAY_URL}/pay/${opts.merchantId}?${q.toString()}`;
}

/**
 * NFC / printed counter waiting link.
 * Keep this URL stable (no amount query) so the physical QR/NFC never changes.
 * Prefer apex host to match programmed tags: https://redfacepay.co.za/t/RFP-…
 */
export function buildNfcTapUrl(tagCode: string, opts?: { amountZar?: number; label?: string; tracking?: boolean }) {
  const host = REDFACE_PAY_URL.replace('://www.', '://');
  const base = `${host}/t/${encodeURIComponent(tagCode.trim())}`;
  // Waiting links must stay clean — amount is pushed from POS as a payment session.
  if (!opts?.tracking && opts?.amountZar == null && !opts?.label) return base;

  const q = new URLSearchParams();
  if (opts?.tracking) {
    q.set('utm_source', 'veebrown');
    q.set('utm_medium', 'counter_nfc');
  }
  if (opts?.amountZar) q.set('amount', String(opts.amountZar));
  if (opts?.label) q.set('label', opts.label.slice(0, 80));
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

export function buildQrImageUrl(payUrl: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payUrl)}`;
}

export function buildTailoringPayLabel(lines: Array<{ name: string; quantity: number }>) {
  const summary = lines.map((l) => (l.quantity > 1 ? `${l.name} x${l.quantity}` : l.name)).join(', ');
  return `VV Brown: ${summary}`.slice(0, 80);
}

export async function createCommerceOrder(payload: {
  merchantId: string;
  customerName: string;
  customerContact?: string;
  deliveryTo: string;
  items: Array<{
    product_id: string;
    product_name: string;
    price_zar: number;
    quantity: number;
    size?: string;
    color?: string;
  }>;
}) {
  const res = await fetch(
    process.env.NEXT_PUBLIC_REDFACE_COMMERCE_API ??
      'https://bpzzgilwlkghgfkvkkxx.supabase.co/functions/v1/ecosystem-commerce',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
        ...(process.env.ECOSYSTEM_API_KEY
          ? { 'X-Ecosystem-Key': process.env.ECOSYSTEM_API_KEY }
          : {}),
      },
      body: JSON.stringify({
        action: 'create_order',
        ecosystem_app: 'veebrown',
        merchant_id: payload.merchantId,
        customer_name: payload.customerName,
        customer_contact: payload.customerContact,
        delivery_to: payload.deliveryTo,
        return_url: `${SITE_URL}/dashboard/orders`,
        items: payload.items,
      }),
    },
  );
  return res.json();
}
