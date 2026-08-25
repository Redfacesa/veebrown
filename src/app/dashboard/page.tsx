'use client';

import Link from 'next/link';
import {
  Package,
  Scissors,
  Heart,
  Ruler,
  CreditCard,
  Sparkles,
  Shirt,
  Gift,
  MessageSquare,
} from 'lucide-react';
import { buildSsoLoginUrl } from '@/lib/redface-pay';

const SECTIONS = [
  { href: '/dashboard/orders', icon: Package, label: 'Orders' },
  { href: '/dashboard/appointments', icon: Scissors, label: 'Appointments' },
  { href: '/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/wardrobe', icon: Shirt, label: 'Saved Outfits' },
  { href: '/measurements', icon: Ruler, label: 'Measurements' },
  { href: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  { href: '/dashboard/loyalty', icon: Gift, label: 'Loyalty Points' },
  { href: '/assistant', icon: Sparkles, label: 'AI History' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
];

export default function DashboardPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="section-padding max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-display text-4xl mb-2">My Account</h1>
            <p className="text-white/50">Manage orders, appointments, and your style profile</p>
          </div>
          <a href={buildSsoLoginUrl('/dashboard')} className="btn-secondary text-sm">
            Sign in with RedFace Pay
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="glass rounded-2xl p-6 hover:border-vbrown-gold/30 transition-all group"
            >
              <section.icon size={28} className="text-vbrown-gold mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-lg">{section.label}</h3>
            </Link>
          ))}
        </div>

        <div className="mt-12 glass rounded-2xl p-8 text-center">
          <Gift size={40} className="text-vbrown-gold mx-auto mb-4" />
          <h2 className="font-display text-2xl mb-2">RedFace Points</h2>
          <p className="text-white/50 mb-4">Earn points on every purchase. Redeem for discounts and free tailoring.</p>
          <p className="text-4xl font-bold text-vbrown-gold">0 pts</p>
          <p className="text-xs text-white/30 mt-2">Sign in to view your balance</p>
        </div>
      </div>
    </div>
  );
}
