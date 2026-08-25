'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import VeeBrownLogo from '@/components/VeeBrownLogo';
import { useCart } from '@/lib/store';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/#collections', label: 'Collections' },
  { href: '/#about', label: 'About' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const count = useCart((s) => s.itemCount());

  return (
    <header className="sticky top-0 z-50 bg-vbrown-ivory/95 border-b border-vbrown-charcoal/10 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <VeeBrownLogo href="/" />

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'text-vbrown-gold' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5 text-xs tracking-[0.15em] uppercase">
          <Link href="/search" className="nav-link hidden sm:inline">Search</Link>
          <Link href="/dashboard" className="nav-link hidden sm:inline">Account</Link>
          <Link href="/cart" className="nav-link">Bag ({count})</Link>
          <button type="button" className="md:hidden nav-link" onClick={() => setOpen(!open)} aria-label="Menu">
            Menu
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-vbrown-charcoal/10 px-6 py-4 flex flex-col gap-3 bg-vbrown-ivory">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="nav-link text-sm">
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
