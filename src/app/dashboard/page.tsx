'use client';

import Link from 'next/link';
import { Package, Heart, CreditCard, Gift, MessageSquare } from 'lucide-react';
import { buildSsoLoginUrl } from '@/lib/redface-pay';

const SECTIONS = [
  { href: '/dashboard/orders', icon: Package, label: 'Orders' },
  { href: '/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { href: '/dashboard/loyalty', icon: Gift, label: 'Loyalty' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
];

export default function DashboardPage() {
  return (
    <div className="pt-20 pb-16 bg-vbrown-ivory">
      <div className="section-padding max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
          <div>
            <h1 className="font-display text-4xl text-vbrown-charcoal mb-2">My account</h1>
            <p className="text-vbrown-charcoal/50">Orders and saved fragrances</p>
          </div>
          <a href={buildSsoLoginUrl('/dashboard')} className="btn-outline text-sm">
            Sign in with RedFace Pay
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="border border-vbrown-charcoal/10 bg-vbrown-cream p-6 hover:border-vbrown-gold/40 transition-all group"
            >
              <section.icon size={28} className="text-vbrown-gold mb-4 group-hover:scale-105 transition-transform" />
              <p className="font-display text-lg text-vbrown-charcoal">{section.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
