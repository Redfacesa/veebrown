'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, BarChart3, Settings, Tag, ExternalLink, Store } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { fetchCategories, fetchProducts } from '@/lib/api';
import type { FashionProduct, Category } from '@/lib/types';
import type { VeeBrownPlatformConfig } from '@/lib/platform-config';
import { getMerchantIdFromConfig } from '@/lib/platform-config';
import ProductManager from '@/components/admin/ProductManager';
import SalesDashboard from '@/components/admin/SalesDashboard';
import OrdersPanel from '@/components/admin/OrdersPanel';
import RetailPosPanel from '@/components/admin/RetailPosPanel';
import PayLinkStation from '@/components/admin/PayLinkStation';
import { PANGOLIN_COUNTER_TAP_CODE, type PayStation } from '@/lib/pay-stations';
import { buildMerchantPortalUrl } from '@/lib/redface-pay';

const NAV = [
  { id: 'overview', icon: BarChart3, label: 'Overview' },
  { id: 'products', icon: Package, label: 'Fragrances' },
  { id: 'orders', icon: Tag, label: 'Sales & orders' },
  { id: 'pos', icon: Store, label: 'In-store POS' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function AdminClient({ config }: { config: VeeBrownPlatformConfig }) {
  const merchantId = getMerchantIdFromConfig(config);
  const [tab, setTab] = useState('overview');
  const [posRefresh, setPosRefresh] = useState(0);
  const [products, setProducts] = useState<FashionProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchantInfo, setMerchantInfo] = useState<Record<string, unknown> | null>(
    config.merchant ? (config.merchant as Record<string, unknown>) : null,
  );
  const [payStations, setPayStations] = useState<PayStation[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedTapCode, setSelectedTapCode] = useState<string | null>(PANGOLIN_COUNTER_TAP_CODE);

  const selectedStation =
    payStations.find(
      (s) =>
        (selectedStationId && s.id && s.id === selectedStationId) ||
        (selectedTapCode && s.tapCode.toUpperCase() === selectedTapCode.toUpperCase()),
    ) ||
    payStations.find((s) => s.tapCode.toUpperCase() === PANGOLIN_COUNTER_TAP_CODE) ||
    payStations[0] ||
    null;

  const selectStation = useCallback((station: PayStation) => {
    setSelectedStationId(station.id || null);
    setSelectedTapCode(station.tapCode);
  }, []);

  useEffect(() => {
    fetchProducts({ merchantId, limit: 100 }).then(setProducts);
    fetchCategories(merchantId).then(setCategories);

    void fetch('/api/config')
      .then((r) => r.json())
      .then((c: { payStations?: PayStation[] }) => {
        const stations = Array.isArray(c.payStations) ? c.payStations : [];
        setPayStations(stations);
        const preferred =
          stations.find((s) => s.tapCode.toUpperCase() === PANGOLIN_COUNTER_TAP_CODE) || stations[0];
        if (preferred) {
          setSelectedStationId((prev) => prev ?? (preferred.id || null));
          setSelectedTapCode((prev) => prev ?? preferred.tapCode);
        }
      })
      .catch(() => {});

    const supabase = getSupabase();
    if (merchantId && supabase && !config.merchant) {
      supabase
        .from('merchants')
        .select('business_name, status, paystack_subaccount, paystack_split_code, email')
        .eq('id', merchantId)
        .maybeSingle()
        .then(({ data }) => setMerchantInfo(data));
    }
  }, [merchantId, config.merchant]);

  return (
    <div className="pt-16 pb-20 lg:pb-16 min-h-screen bg-vbrown-ivory">
      <div className="section-padding">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8 border-b border-vbrown-charcoal/10 pb-6">
          <div className="min-w-0 pr-16 sm:pr-0">
            <p className="text-[10px] tracking-[0.35em] uppercase text-vbrown-gold mb-2">Merchant admin</p>
            <h1 className="font-display text-2xl sm:text-3xl text-vbrown-charcoal">VV Brown Fragrances</h1>
            <p className="admin-muted text-xs sm:text-sm truncate mt-1">
              {config.merchant?.email ?? 'valenciakabasele@gmail.com'} · Same login as RedFace Pay
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={buildMerchantPortalUrl('home')}
              target="_blank"
              rel="noreferrer"
              className="btn-outline text-xs sm:text-sm px-4 py-2.5 inline-flex items-center gap-2"
            >
              <ExternalLink size={14} />
              RedFace Pay portal
            </a>
            <Link href="/" className="btn-outline text-xs sm:text-sm px-4 py-2.5">
              View store
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          <nav className="lg:hidden -mx-4 px-4 overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-1">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs tracking-wide uppercase whitespace-nowrap border transition-colors ${
                    tab === item.id
                      ? 'bg-vbrown-charcoal text-vbrown-cream border-vbrown-charcoal'
                      : 'border-vbrown-charcoal/15 text-vbrown-charcoal/60 hover:border-vbrown-gold'
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          <nav className="hidden lg:block lg:col-span-1 space-y-1 sticky top-24 self-start">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all border-l-2 ${
                  tab === item.id
                    ? 'border-vbrown-gold text-vbrown-charcoal bg-vbrown-cream/80'
                    : 'border-transparent admin-muted hover:text-vbrown-charcoal hover:bg-vbrown-cream/50'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="lg:col-span-4 min-w-0 text-vbrown-charcoal">
            {tab === 'overview' && (
              <div className="space-y-6">
                <SalesDashboard merchantId={merchantId} compact refreshKey={posRefresh} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="admin-card p-5">
                    <p className="admin-muted text-sm">Fragrances live</p>
                    <p className="font-display text-3xl mt-1">{products.length}</p>
                  </div>
                  <div className="admin-card p-5">
                    <p className="admin-muted text-sm">Categories</p>
                    <p className="font-display text-3xl mt-1">{categories.length}</p>
                  </div>
                </div>
                {merchantInfo && (
                  <div className="admin-card p-5 sm:p-6">
                    <h3 className="font-display text-lg mb-4">Merchant</h3>
                    <dl className="space-y-2 text-sm">
                      {[
                        ['Business', String(merchantInfo.business_name ?? 'VV Brown Fragrances')],
                        ['Email', String(merchantInfo.email ?? '—')],
                        ['Status', String(merchantInfo.status ?? '—')],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4">
                          <dt className="admin-muted">{label}</dt>
                          <dd className="text-right capitalize">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )}

            {tab === 'products' && (
              <ProductManager merchantId={merchantId} categories={categories} />
            )}

            {tab === 'orders' && <OrdersPanel merchantId={merchantId} refreshKey={posRefresh} />}

            {tab === 'pos' && (
              <div className="space-y-8">
                <p className="admin-muted text-sm">
                  Record in-store fragrance sales at your counter. Online orders appear under Sales & orders.
                </p>
                <PayLinkStation
                  merchantId={merchantId}
                  stations={payStations}
                  selectedStationId={selectedStation?.id}
                  selectedTapCode={selectedStation?.tapCode ?? selectedTapCode}
                  onSelectStation={selectStation}
                />
                <RetailPosPanel
                  merchantId={merchantId}
                  station={selectedStation}
                  onSaleComplete={() => setPosRefresh((n) => n + 1)}
                />
              </div>
            )}

            {tab === 'settings' && (
              <div className="admin-card p-5 sm:p-6 space-y-4">
                <h2 className="font-display text-xl">Settings</h2>
                <dl className="text-xs sm:text-sm space-y-2 font-mono">
                  <div><span className="admin-muted">ECOSYSTEM:</span> veebrown</div>
                  <div><span className="admin-muted">MERCHANT_ID:</span> {merchantId}</div>
                  <div><span className="admin-muted">SITE:</span> {config.siteUrl}</div>
                  <div><span className="admin-muted">ADMINS:</span> {config.adminEmails.join(', ')}</div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
