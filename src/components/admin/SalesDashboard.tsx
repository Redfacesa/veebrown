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
import { computeCardPayoutSplit, computeTodayPayout } from '@/lib/payout-split';
import PayoutSplitCard from '@/components/admin/PayoutSplitCard';
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
    <div className={`admin-card rounded-none p-3.5 sm:p-5 ${accent ? 'border-vbrown-gold/40' : ''}`}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="admin-muted text-xs sm:text-sm">{label}</p>
          <p className={`text-lg sm:text-2xl font-display mt-1 truncate ${accent ? 'text-vbrown-gold' : 'text-vbrown-charcoal'}`}>{value}</p>
          {hint && <p className="text-xs admin-muted mt-1 line-clamp-2">{hint}</p>}
        </div>
        <div className="w-9 h-9 sm:w-10 sm:h-10 border border-vbrown-charcoal/10 flex items-center justify-center shrink-0">
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
  const todayPayout = computeTodayPayout({
    digitalGross: stats?.today_digital ?? 0,
    cashGross: stats?.today_cash ?? 0,
  });
  const latestCardSale = sales.find((row) => row.source === 'paystack' && row.status === 'success');
  const latestSplit = latestCardSale ? computeCardPayoutSplit(latestCardSale.amount) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-vbrown-charcoal">{compact ? 'Today at a glance' : 'Sales & stock'}</h2>
          {!compact && (
            <p className="text-sm admin-muted mt-1">
              Fragrance sales from your website, card checkout, and in-store counter.
            </p>
          )}
        </div>
        <button type="button" onClick={() => void reload()} className="btn-outline text-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Could not load sales data. Sign in with your RedFace Pay merchant account (same password as this admin login).
        </div>
      )}

      <div className={`grid gap-4 ${compact ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        <StatCard
          label="Made today"
          value={fmtZar(stats?.today_total ?? 0)}
          hint={`${stats?.today_count ?? 0} sale${stats?.today_count === 1 ? '' : 's'} · what customers paid`}
          icon={TrendingUp}
          accent
        />
        <StatCard
          label="You receive today"
          value={fmtZar(todayPayout.merchantNet)}
          hint={
            todayPayout.totalFees > 0
              ? `After Paystack + RedFace (~${fmtZar(todayPayout.totalFees)} on card)`
              : 'Card and cash combined'
          }
          icon={Banknote}
          accent
        />
        <StatCard
          label="Card / online"
          value={fmtZar(stats?.today_digital ?? 0)}
          hint={
            stats?.today_digital
              ? `You keep ~${fmtZar(computeCardPayoutSplit(stats.today_digital).merchantNet)}`
              : undefined
          }
          icon={CreditCard}
        />
        <StatCard
          label="Cash at counter"
          value={fmtZar(stats?.today_cash ?? 0)}
          hint="No card processing fee"
          icon={Banknote}
        />
      </div>

      {(todayPayout.digitalGross > 0 || latestSplit) && (
        <PayoutSplitCard
          split={latestSplit ?? computeCardPayoutSplit(todayPayout.digitalGross)}
          title={latestSplit ? 'Latest card payment split' : 'Today’s card sales split'}
          reference={latestCardSale?.reference}
          compact={compact}
        />
      )}

      {!compact && (
        <StatCard
          label="Units in stock"
          value={String(totalUnits)}
          hint={lowStock.length ? `${lowStock.length} low-stock alert${lowStock.length === 1 ? '' : 's'}` : 'Tracked inventory'}
          icon={Package}
        />
      )}

      {!compact && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="admin-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">Recent sales</h3>
              <span className="text-xs admin-muted">What customers bought</span>
            </div>
            {loading && !sales.length ? (
              <p className="admin-muted text-sm">Loading sales…</p>
            ) : sales.length === 0 ? (
              <p className="admin-muted text-sm">No sales yet. They will appear here once customers checkout.</p>
            ) : (
              <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {sales.map((row) => {
                  const split = row.source === 'paystack' ? computeCardPayoutSplit(row.amount) : null;
                  return (
                  <li key={row.id} className="border border-vbrown-charcoal/8 bg-white px-3 py-3">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate text-vbrown-charcoal">{formatLineItemsSummary(row.line_items)}</p>
                        <p className="text-xs admin-muted mt-0.5">
                          {row.customer} · {paymentMethodLabel(row.payment_method)} · {formatSoldAt(row.sold_at)}
                        </p>
                        {split && (
                          <p className="text-xs text-vbrown-gold/90 mt-1">
                            You receive {fmtZar(split.merchantNet)} · Paystack {fmtZar(split.paystackFee)} · RedFace {fmtZar(split.redfaceFee)}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-vbrown-gold font-display block">{fmtZar(row.amount)}</span>
                        {split && <span className="text-[11px] admin-muted">paid</span>}
                      </div>
                    </div>
                  </li>
                );})}
              </ul>
            )}
          </div>

          <div className="admin-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">Stock on hand</h3>
              <span className="text-xs admin-muted">Units per fragrance</span>
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
                  <li key={p.id} className="flex items-center justify-between gap-3 border border-vbrown-charcoal/8 bg-white px-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-vbrown-charcoal">{p.name}</p>
                      {p.category && <p className="text-xs admin-muted">{p.category}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-semibold ${isLowStock(p) ? 'text-amber-700' : 'text-vbrown-charcoal'}`}>
                        {p.track_inventory && p.stock_quantity != null ? p.stock_quantity : '—'}
                      </p>
                      {p.stock_sold > 0 && (
                        <p className="text-xs admin-muted">{p.stock_sold} sold</p>
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
