/**
 * VV Brown Fragrances — indicative shipping (ZAR).
 * Benchmarks: The Courier Guy Economy ~R95 / Overnight ~R130 (≤2kg domestic);
 * DHL Express Worldwide from SA ~R550–R1,200 for 0.5–1kg by zone (2025 public guides).
 * Carrier choice at fulfilment — rates are estimates passed to checkout.
 */

export type ShippingRegion =
  | 'za_metro'
  | 'za_national'
  | 'za_remote'
  | 'intl_africa'
  | 'intl_europe_uk'
  | 'intl_us_ca'
  | 'intl_other';

export type ShippingService = 'standard' | 'express';

export type ShippingQuote = {
  region: ShippingRegion;
  service: ShippingService;
  label: string;
  carrierHint: string;
  amountZar: number;
  eta: string;
  bottles: number;
  weightKg: number;
};

/** ~50ml bottle + packaging */
export const GRAMS_PER_BOTTLE = 0.5;

const SA_REMOTE_PROVINCES = new Set([
  'Northern Cape',
  'Limpopo',
  'North West',
  'Mpumalanga',
]);

export function bottleWeightKg(quantity: number): number {
  return Math.max(0.5, Math.round(quantity * GRAMS_PER_BOTTLE * 10) / 10);
}

/** Courier Guy–aligned domestic bands (1–3 bottles). */
function zaStandardRate(bottles: number, remote: boolean): number {
  const base = bottles <= 1 ? 99 : bottles === 2 ? 115 : 135;
  return remote ? base + 35 : base;
}

function zaExpressRate(bottles: number, remote: boolean): number {
  const base = bottles <= 2 ? 139 : 169;
  return remote ? base + 40 : base;
}

/** DHL Express–aligned international bands by weight tier. */
function intlRate(region: ShippingRegion, weightKg: number): number {
  const w = weightKg <= 0.5 ? 0.5 : weightKg <= 1 ? 1 : 1.5;
  switch (region) {
    case 'intl_africa':
      return w <= 0.5 ? 520 : 680;
    case 'intl_europe_uk':
      return w <= 0.5 ? 890 : 1150;
    case 'intl_us_ca':
      return w <= 0.5 ? 980 : 1280;
    case 'intl_other':
    default:
      return w <= 0.5 ? 1050 : 1380;
  }
}

export function quoteShipping(opts: {
  region: ShippingRegion;
  service?: ShippingService;
  bottleCount: number;
  province?: string;
}): ShippingQuote {
  const bottles = Math.max(1, opts.bottleCount);
  const weightKg = bottleWeightKg(bottles);
  const service = opts.service ?? 'standard';
  const remote = Boolean(
    opts.region === 'za_remote' ||
      (opts.region === 'za_national' &&
        opts.province != null &&
        SA_REMOTE_PROVINCES.has(opts.province)),
  );

  if (opts.region.startsWith('intl_')) {
    const amountZar = intlRate(opts.region, weightKg);
    const zoneLabel =
      opts.region === 'intl_africa'
        ? 'Africa'
        : opts.region === 'intl_europe_uk'
          ? 'Europe & UK'
          : opts.region === 'intl_us_ca'
            ? 'USA & Canada'
            : 'Rest of world';
    return {
      region: opts.region,
      service: 'express',
      label: `International delivery — ${zoneLabel}`,
      carrierHint: 'DHL Express (or equivalent at dispatch)',
      amountZar,
      eta: '5–10 business days',
      bottles,
      weightKg,
    };
  }

  const isMetro = opts.region === 'za_metro';
  const amountZar =
    service === 'express'
      ? zaExpressRate(bottles, remote)
      : zaStandardRate(bottles, remote);

  return {
    region: remote ? 'za_remote' : opts.region,
    service,
    label: service === 'express' ? 'South Africa — Express' : 'South Africa — Standard',
    carrierHint: 'The Courier Guy (or equivalent at dispatch)',
    amountZar,
    eta: service === 'express' ? '1–2 business days' : isMetro ? '2–3 business days' : '3–5 business days',
    bottles,
    weightKg,
  };
}

export const SHIPPING_REGION_OPTIONS: { id: ShippingRegion; label: string; group: string }[] = [
  { id: 'za_metro', label: 'South Africa — major city', group: 'South Africa' },
  { id: 'za_national', label: 'South Africa — nationwide', group: 'South Africa' },
  { id: 'intl_africa', label: 'Africa (outside SA)', group: 'International' },
  { id: 'intl_europe_uk', label: 'Europe & United Kingdom', group: 'International' },
  { id: 'intl_us_ca', label: 'United States & Canada', group: 'International' },
  { id: 'intl_other', label: 'Rest of world', group: 'International' },
];

export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];
