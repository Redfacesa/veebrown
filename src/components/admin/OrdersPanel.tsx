'use client';

import Link from 'next/link';
import { ExternalLink, Package, Truck } from 'lucide-react';
import { buildMerchantPortalUrl } from '@/lib/redface-pay';
import SalesDashboard from '@/components/admin/SalesDashboard';

/** Orders & delivery — sales feed here; full fulfilment in RedFace Pay merchant portal. */
export default function OrdersPanel({ merchantId, refreshKey = 0 }: { merchantId: string; refreshKey?: number }) {
  return (
    <div className="space-y-6">
      <div className="admin-card p-5 sm:p-6">
        <h2 className="font-display text-xl text-vbrown-charcoal mb-2">Orders & delivery</h2>
        <p className="text-sm text-vbrown-charcoal/55 mb-4">
          Online fragrance orders and delivery tracking are managed in RedFace Pay — the same account and password you
          use here.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={buildMerchantPortalUrl('orders')}
            target="_blank"
            rel="noreferrer"
            className="btn-classic inline-flex items-center gap-2"
          >
            <Truck size={16} />
            Track orders & delivery
          </a>
          <a
            href={buildMerchantPortalUrl('products')}
            target="_blank"
            rel="noreferrer"
            className="btn-outline inline-flex items-center gap-2"
          >
            <Package size={16} />
            Inventory in portal
          </a>
        </div>
      </div>

      <SalesDashboard merchantId={merchantId} refreshKey={refreshKey} />

      <p className="text-xs text-vbrown-charcoal/40">
        Need to update shipping status or print a receipt?{' '}
        <a href={buildMerchantPortalUrl('orders')} target="_blank" rel="noreferrer" className="text-vbrown-gold hover:underline inline-flex items-center gap-1">
          Open RedFace Pay orders <ExternalLink size={12} />
        </a>
      </p>
    </div>
  );
}
