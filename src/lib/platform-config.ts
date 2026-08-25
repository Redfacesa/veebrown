import { getSupabase, SITE_URL } from './supabase';

export type VeeBrownPlatformConfig = {
  slug: string;
  name: string;
  siteUrl: string;
  domains: string[];
  payMerchantId: string;
  adminEmails: string[];
  merchant?: {
    id: string;
    business_name: string;
    email: string;
    status: string;
    paystack_subaccount?: string;
    site_slug?: string;
  };
};

const MERCHANT_ID = '44ea657f-217c-4700-9441-ad391a13e354';

const FALLBACK: VeeBrownPlatformConfig = {
  slug: 'veebrown',
  name: 'VV Brown Fragrances',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veebrown.vercel.app',
  domains: ['veebrown.vercel.app', 'localhost', '127.0.0.1'],
  payMerchantId: process.env.NEXT_PUBLIC_VEEBROWN_MERCHANT_ID ?? MERCHANT_ID,
  adminEmails: ['valenciakabasele@gmail.com', 'redfacesa@gmail.com', 'info@redfacepay.co.za'],
};

let cached: VeeBrownPlatformConfig | null = null;

export async function getVeeBrownConfig(): Promise<VeeBrownPlatformConfig> {
  if (cached?.payMerchantId) return cached;

  const envMerchantId = process.env.NEXT_PUBLIC_VEEBROWN_MERCHANT_ID ?? '';
  if (envMerchantId) {
    cached = { ...FALLBACK, payMerchantId: envMerchantId };
    return cached;
  }

  const supabase = getSupabase();
  if (!supabase) return FALLBACK;

  try {
    const { data, error } = await supabase.rpc('get_ecosystem_app_config', { p_slug: 'veebrown' });
    if (error || !data?.ok) return FALLBACK;

    const adminEmails = Array.isArray(data.admin_emails)
      ? (data.admin_emails as string[])
      : FALLBACK.adminEmails;

    cached = {
      slug: String(data.slug ?? 'veebrown'),
      name: String(data.name ?? FALLBACK.name),
      siteUrl: String(data.site_url ?? FALLBACK.siteUrl),
      domains: Array.isArray(data.domains) ? (data.domains as string[]) : FALLBACK.domains,
      payMerchantId: String(data.pay_merchant_id ?? MERCHANT_ID),
      adminEmails,
      merchant: data.merchant as VeeBrownPlatformConfig['merchant'],
    };
    return cached;
  } catch {
    return FALLBACK;
  }
}

export function getMerchantIdFromConfig(config: VeeBrownPlatformConfig): string {
  return config.payMerchantId || process.env.NEXT_PUBLIC_VEEBROWN_MERCHANT_ID || MERCHANT_ID;
}

export function isVeeBrownAdmin(email: string | null | undefined, config?: VeeBrownPlatformConfig): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const admins = config?.adminEmails ?? FALLBACK.adminEmails;
  return admins.some((a) => a.toLowerCase() === normalized);
}

export function resolveSiteUrl(config?: VeeBrownPlatformConfig): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return config?.siteUrl ?? SITE_URL;
}
