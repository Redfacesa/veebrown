'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  LayoutGrid,
  Image as ImageIcon,
  BarChart3,
  Settings,
  Users,
  Tag,
  ExternalLink,
  Store,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { fetchCategories, fetchProducts } from '@/lib/api';
import type { FashionProduct, Category } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { VeeBrownPlatformConfig } from '@/lib/platform-config';
import { getMerchantIdFromConfig } from '@/lib/platform-config';
import ProductManager from '@/components/admin/ProductManager';
import CategoryManager from '@/components/admin/CategoryManager';
import SalesDashboard from '@/components/admin/SalesDashboard';
import RetailPosPanel from '@/components/admin/RetailPosPanel';
import PayLinkStation from '@/components/admin/PayLinkStation';
import { PANGOLIN_COUNTER_TAP_CODE, type PayStation } from '@/lib/pay-stations';
import { buildMerchantPortalUrl } from '@/lib/redface-pay';

const NAV = [
  { id: 'overview', icon: BarChart3, label: 'Overview' },
  { id: 'pos', icon: Store, label: 'POS' },
  { id: 'products', icon: Package, label: 'Products' },
  { id: 'categories', icon: LayoutGrid, label: 'Categories' },
  { id: 'orders', icon: Tag, label: 'Orders' },
  { id: 'customers', icon: Users, label: 'Customers' },
  { id: 'banners', icon: ImageIcon, label: 'Banners' },
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

  const reloadCategories = useCallback(() => {
    fetchCategories(merchantId).then(setCategories);
  }, [merchantId]);

  useEffect(() => {
    fetchProducts({ merchantId, limit: 100 }).then(setProducts);
    fetchCategories(merchantId).then(setCategories);

    void fetch('/api/config')
      .then((r) => r.json())
      .then((c: { payStations?: PayStation[]; nfcTag?: string }) => {
        const stations = Array.isArray(c.payStations) ? c.payStations : [];
        setPayStations(stations);
        const preferred =
          stations.find((s) => s.tapCode.toUpperCase() === PANGOLIN_COUNTER_TAP_CODE) ||
          stations[0];
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
    <div className="pt-20 pb-20 lg:pb-16 min-h-screen">
      <div className="section-padding">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8">
          <div className="min-w-0 pr-16 sm:pr-0">
            <h1 className="font-display text-2xl sm:text-3xl">VV Brown Fragrances Admin</h1>
            <p className="text-white/50 text-xs sm:text-sm truncate">
              {config.merchant?.email ?? 'redfacesa@gmail.com'} · {config.siteUrl}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={buildMerchantPortalUrl('home')}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs sm:text-sm px-4 py-2.5"
            >
              <ExternalLink size={14} />
              <span className="sm:hidden">Portal</span>
              <span className="hidden sm:inline">RedFace Pay</span>
            </a>
            <Link href="/" className="btn-secondary text-xs sm:text-sm px-4 py-2.5">
              Store
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Mobile: horizontal scroll tabs */}
          <nav className="lg:hidden -mx-4 px-4 overflow-x-auto overscroll-x-contain">
            <div className="flex gap-2 min-w-max pb-1">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm whitespace-nowrap touch-manipulation transition-colors ${
                    tab === item.id
                      ? 'bg-vbrown-gold text-vbrown-black font-semibold'
                      : 'bg-white/5 text-white/65 border border-white/10'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Desktop sidebar */}
          <nav className="hidden lg:block lg:col-span-1 space-y-1 sticky top-24 self-start">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  tab === item.id ? 'bg-vbrown-gold/10 text-vbrown-gold' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={18} />
                {item.label === 'POS' ? 'POS & Sales' : item.label}
              </button>
            ))}
          </nav>

          <div className="lg:col-span-4 min-w-0">
            {tab === 'overview' && (
              <div className="space-y-6">
                <SalesDashboard merchantId={merchantId} compact refreshKey={posRefresh} />

                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  {[
                    { label: 'Fragrances', value: products.length },
                    { label: 'Categories', value: categories.length || DEFAULT_CATEGORIES.length },
                  ].map((stat) => (
                    <div key={stat.label} className="glass rounded-xl p-3 sm:p-6">
                      <p className="text-white/50 text-xs sm:text-sm">{stat.label}</p>
                      <p className="text-xl sm:text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="glass rounded-xl p-4 sm:p-6">
                  <h3 className="font-semibold mb-4">RedFace Pay Merchant · Subaccount</h3>
                  {merchantInfo ? (
                    <dl className="space-y-3 text-sm">
                      {[
                        ['Business', String(merchantInfo.business_name ?? '—')],
                        ['Email', String(merchantInfo.email ?? 'redfacesa@gmail.com')],
                        ['Status', String(merchantInfo.status ?? '—')],
                        ['Paystack Subaccount', String(merchantInfo.paystack_subaccount ?? 'Pending approval')],
                        ['Merchant ID', merchantId || '—'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                          <dt className="text-white/50 shrink-0">{label}</dt>
                          <dd className={`break-all sm:text-right ${label.includes('Paystack') || label.includes('Merchant') ? 'font-mono text-xs text-vbrown-gold' : ''} ${label === 'Status' ? 'capitalize' : ''}`}>
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-white/40 text-sm">
                      Merchant linked to VV Brown Fragrances on RedFace Pay. Products sync with this storefront automatically.
                    </p>
                  )}
                </div>

                <div className="glass rounded-xl p-4 sm:p-6">
                  <h3 className="font-semibold mb-3">Shared catalog</h3>
                  <p className="text-sm text-white/50">
                    Fragrances added here or in RedFace Pay share the same catalog. The website and Pay POS stay in sync.
                  </p>
                  <a
                    href={buildMerchantPortalUrl('products')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex mt-3 text-sm text-vbrown-gold hover:underline"
                  >
                    Open RedFace Pay merchant portal →
                  </a>
                </div>
              </div>
            )}

            {tab === 'pos' && (
              <div className="space-y-8">
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
                <SalesDashboard merchantId={merchantId} refreshKey={posRefresh} />
              </div>
            )}

            {tab === 'orders' && (
              <SalesDashboard merchantId={merchantId} refreshKey={posRefresh} />
            )}

            {tab === 'products' && (
              <ProductManager merchantId={merchantId} categories={categories} />
            )}

            {tab === 'categories' && (
              <CategoryManager
                merchantId={merchantId}
                categories={categories}
                onChange={reloadCategories}
              />
            )}

            {tab === 'settings' && (
              <div className="space-y-6">
                <PayLinkStation
                  merchantId={merchantId}
                  stations={payStations}
                  selectedStationId={selectedStation?.id}
                  selectedTapCode={selectedStation?.tapCode ?? selectedTapCode}
                  onSelectStation={selectStation}
                />
                <div className="glass rounded-xl p-4 sm:p-6 space-y-4">
                  <h2 className="text-xl font-semibold">Platform Settings</h2>
                  <div className="space-y-2 text-xs sm:text-sm font-mono bg-black/30 rounded-lg p-4 overflow-x-auto">
                    <p><span className="text-white/40">ECOSYSTEM_APP:</span> veebrown</p>
                    <p><span className="text-white/40">MERCHANT_ID:</span> {merchantId || 'from DB after migration'}</p>
                    <p><span className="text-white/40">SITE_URL:</span> {config.siteUrl}</p>
                    <p><span className="text-white/40">ADMIN:</span> {config.adminEmails.join(', ')}</p>
                    <p>
                      <span className="text-white/40">COUNTER_NFC:</span>{' '}
                      https://redfacepay.co.za/t/{PANGOLIN_COUNTER_TAP_CODE}
                    </p>
                    <p>
                      <span className="text-white/40">COUNTER_CODES:</span>{' '}
                      {payStations.length
                        ? payStations.map((s) => s.tapCode).join(', ')
                        : PANGOLIN_COUNTER_TAP_CODE}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!['overview', 'pos', 'orders', 'products', 'categories', 'settings'].includes(tab) && (
              <div className="glass rounded-xl p-8 sm:p-12 text-center text-white/40">
                <p>{NAV.find((n) => n.id === tab)?.label} management — coming in Phase 2</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
