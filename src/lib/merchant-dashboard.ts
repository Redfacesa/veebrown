import { getSupabase } from './supabase';

export type DashboardStats = {
  ok?: boolean;
  error?: string;
  today_total?: number;
  today_digital?: number;
  today_cash?: number;
  today_count?: number;
  today_products_sold?: number;
  week_total?: number;
  month_total?: number;
  stock_alerts?: { id: string; name: string; stock?: number; stock_quantity?: number; threshold?: number }[];
  top_products?: { name: string; qty: number; revenue: number }[];
};

export type SalesFeedLine = {
  name: string;
  qty: number;
  line_total: number;
};

export type SalesFeedRow = {
  id: string;
  source: 'paystack' | 'manual';
  sold_at: string;
  customer: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  reference: string | null;
  line_items: SalesFeedLine[];
};

export type CatalogVariant = {
  id: string;
  label: string;
  price: number;
  stock_quantity?: number | null;
};

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  currency?: string;
  image_url?: string | null;
  stock_quantity?: number | null;
  track_inventory?: boolean;
  variants?: CatalogVariant[];
};

export type CatalogCategory = {
  id: string;
  name: string;
  emoji?: string | null;
  products: CatalogProduct[];
};

export type InventoryProduct = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  track_inventory: boolean;
  category: string | null;
  stock_sold: number;
};

export async function loadDashboardStats(merchantId: string): Promise<DashboardStats | null> {
  const supabase = getSupabase();
  if (!supabase || !merchantId) return null;
  const { data, error } = await supabase.rpc('merchant_dashboard_stats', { p_merchant_id: merchantId });
  if (error) return { ok: false, error: error.message };
  return (data ?? null) as DashboardStats | null;
}

export async function fetchSalesFeed(merchantId: string, limit = 50): Promise<SalesFeedRow[]> {
  const supabase = getSupabase();
  if (!supabase || !merchantId) return [];
  const { data, error } = await supabase.rpc('merchant_sales_feed', {
    p_merchant_id: merchantId,
    p_limit: limit,
  });
  if (error) return [];
  return (data ?? []) as SalesFeedRow[];
}

export async function fetchInventory(merchantId: string): Promise<InventoryProduct[]> {
  const supabase = getSupabase();
  if (!supabase || !merchantId) return [];
  const { data, error } = await supabase.rpc('merchant_inventory_list', { p_merchant_id: merchantId });
  if (error) return [];
  return (data ?? []) as InventoryProduct[];
}

export async function loadPosCatalog(merchantId: string): Promise<{
  ok: boolean;
  categories: CatalogCategory[];
  uncategorized: CatalogProduct[];
}> {
  const supabase = getSupabase();
  if (!supabase || !merchantId) return { ok: false, categories: [], uncategorized: [] };
  const { data, error } = await supabase.rpc('merchant_catalog', { p_merchant_id: merchantId });
  if (error) return { ok: false, categories: [], uncategorized: [] };
  const payload = data as {
    ok?: boolean;
    categories?: CatalogCategory[];
    uncategorized?: CatalogProduct[];
    error?: string;
  };
  return {
    ok: !!payload?.ok,
    categories: payload?.categories ?? [],
    uncategorized: payload?.uncategorized ?? [],
  };
}

export type PosLineItem = {
  product_id: string;
  name: string;
  qty: number;
  price: number;
};

export async function recordPosCashSale(input: {
  merchantId: string;
  lineItems: PosLineItem[];
  customerName?: string;
  paymentMethod?: string;
  cashReceived?: number;
}): Promise<{ saleId: string; amountDue: number; changeGiven?: number }> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const payload = input.lineItems.map((item) => ({
    product_id: item.product_id,
    name: item.name,
    qty: item.qty,
    price: item.price,
  }));

  const { data, error } = await supabase.rpc('record_pos_cash_sale', {
    p_merchant_id: input.merchantId,
    p_line_items: payload,
    p_customer_name: input.customerName ?? null,
    p_payment_method: input.paymentMethod ?? 'cash',
    p_notes: null,
    p_discount: 0,
    p_cash_received: input.cashReceived ?? null,
    p_processed_by: null,
  });
  if (error) throw error;

  const row = data as {
    sale_id: string;
    amount_due: number;
    change_given?: number;
  };
  return {
    saleId: row.sale_id,
    amountDue: Number(row.amount_due),
    changeGiven: row.change_given != null ? Number(row.change_given) : undefined,
  };
}

export function formatLineItemsSummary(items: SalesFeedLine[]): string {
  if (!items?.length) return 'Sale';
  return items.map((i) => `${i.name}${Number(i.qty) > 1 ? ` ×${i.qty}` : ''}`).join(', ');
}

export function paymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    nfc: 'NFC',
    transfer: 'Transfer',
    store_credit: 'Store credit',
  };
  return map[method] ?? method.replace(/_/g, ' ');
}

export function isLowStock(row: InventoryProduct): boolean {
  if (!row.track_inventory || row.stock_quantity == null) return false;
  const threshold = row.low_stock_threshold ?? 5;
  return row.stock_quantity <= threshold;
}

export function formatSoldAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-ZA', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Johannesburg',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
