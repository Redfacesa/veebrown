'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Banknote, CreditCard, Package, RefreshCw, TrendingUp } from 'lucide-react';
import { fmtZar } from '@/lib/api';
import {
  fetchInventory,
  fetchSalesFeed,
  formatLineItemsSummary,
  formatSoldAt,
  isLowStock,
  loadDashboardStats,
  paymentMethodLabel,
  type DashboardStats,
  type InventoryProduct,
  type SalesFeedRow,
} from '@/lib/merchant-dashboard';
import { buildMerchantPortalUrl } from '@/lib/redface-pay';

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof TrendingUp;
  accent?: boolean;
}) {
  return (
    <div className={`glass rounded-xl p-3.5 sm:p-5 ${accent ? 'border border-vbrown-gold/30' : ''}`}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-white/50 text-xs sm:text-sm">{label}</p>
          <p className={`text-lg sm:text-2xl font-bold mt-1 truncate ${accent ? 'text-vbrown-gold' : ''}`}>{value}</p>
          {hint && <p className="text-xs text-white/35 mt-1 line-clamp-2">{hint}</p>}
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-vbrown-gold/10 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-vbrown-gold" />
        </div>
      </div>
    </div>
  );
}

export default function SalesDashboard({
  merchantId,
  compact = false,
  refreshKey = 0,
}: {
  merchantId: string;
  compact?: boolean;
  refreshKey?: number;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sales, setSales] = useState<SalesFeedRow[]>([]);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    setError(null);
    const [dash, feed, stock] = await Promise.all([
      loadDashboardStats(merchantId),
      fetchSalesFeed(merchantId, compact ? 8 : 40),
      fetchInventory(merchantId),
    ]);
    if (dash?.error) setError(dash.error);
    setStats(dash);
    setSales(feed);
    setInventory(stock);
    setLoading(false);
  }, [merchantId, compact]);

  useEffect(() => {
    void reload();
    const id = window.setInterval(() => void reload(), 60_000);
    return () => window.clearInterval(id);
  }, [reload, refreshKey]);

  const lowStock = inventory.filter(isLowStock);
  const trackedStock = inventory.filter((p) => p.track_inventory && p.stock_quantity != null);
  const totalUnits = trackedStock.reduce((sum, p) => sum + (p.stock_quantity ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{compact ? 'Today at a glance' : 'Sales & stock'}</h2>
          {!compact && (
            <p className="text-sm text-white/50 mt-1">
              Card, online, and in-store cash sales — synced with RedFace Pay POS.
            </p>
          )}
        </div>
        <button type="button" onClick={() => void reload()} className="btn-secondary text-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Could not load sales data. Sign in with your RedFace Pay merchant account (SSO) if you only use Pangolin admin password.
        </div>
      )}

      <div className={`grid gap-4 ${compact ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        <StatCard
          label="Made today"
          value={fmtZar(stats?.today_total ?? 0)}
          hint={`${stats?.today_count ?? 0} sale${stats?.today_count === 1 ? '' : 's'}`}
          icon={TrendingUp}
          accent
        />
        <StatCard
          label="Card / online"
          value={fmtZar(stats?.today_digital ?? 0)}
          icon={CreditCard}
        />
        <StatCard
          label="Cash at counter"
          value={fmtZar(stats?.today_cash ?? 0)}
          icon={Banknote}
        />
        <StatCard
          label="Units in stock"
          value={String(totalUnits)}
          hint={lowStock.length ? `${lowStock.length} low-stock alert${lowStock.length === 1 ? '' : 's'}` : 'Tracked inventory'}
          icon={Package}
        />
      </div>

      {!compact && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent sales</h3>
              <span className="text-xs text-white/40">What customers bought</span>
            </div>
            {loading && !sales.length ? (
              <p className="text-white/40 text-sm">Loading sales…</p>
            ) : sales.length === 0 ? (
              <p className="text-white/40 text-sm">No sales yet today. Use the POS tab to record a cash sale.</p>
            ) : (
              <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {sales.map((row) => (
                  <li key={row.id} className="rounded-lg bg-black/20 px-3 py-3">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{formatLineItemsSummary(row.line_items)}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {row.customer} · {paymentMethodLabel(row.payment_method)} · {formatSoldAt(row.sold_at)}
                        </p>
                      </div>
                      <span className="text-vbrown-gold font-semibold shrink-0">{fmtZar(row.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Stock on hand</h3>
              <span className="text-xs text-white/40">Units left per product</span>
            </div>
            {lowStock.length > 0 && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 flex items-start gap-2 text-sm">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>{lowStock.length} product{lowStock.length === 1 ? '' : 's'} running low — restock soon.</span>
              </div>
            )}
            {loading && !inventory.length ? (
              <p className="text-white/40 text-sm">Loading inventory…</p>
            ) : inventory.length === 0 ? (
              <p className="text-white/40 text-sm">No tracked products yet. Add stock in Products.</p>
            ) : (
              <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {inventory.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{p.name}</p>
                      {p.category && <p className="text-xs text-white/35">{p.category}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-semibold ${isLowStock(p) ? 'text-amber-400' : 'text-white'}`}>
                        {p.track_inventory && p.stock_quantity != null ? p.stock_quantity : '—'}
                      </p>
                      {p.stock_sold > 0 && (
                        <p className="text-xs text-white/35">{p.stock_sold} sold</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <a
              href={buildMerchantPortalUrl('products')}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-4 text-sm text-vbrown-gold hover:underline"
            >
              Full inventory in RedFace Pay →
            </a>
          </div>
        </div>
      )}

      {compact && stats?.top_products && stats.top_products.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold mb-3 text-sm">Top sellers (7 days)</h3>
          <ul className="space-y-2">
            {stats.top_products.slice(0, 3).map((p) => (
              <li key={p.name} className="flex justify-between text-sm">
                <span className="text-white/70 truncate">{p.name}</span>
                <span className="text-vbrown-gold shrink-0 ml-2">{p.qty} sold</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
