'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import VeeBrownLogo from '@/components/VeeBrownLogo';
import PwaInstallButton from '@/components/PwaInstallButton';
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
    <header className="sticky top-0 z-50 bg-black border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <VeeBrownLogo href="/" />

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-link-light ${pathname === item.href ? '!text-vbrown-gold' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 sm:gap-5 text-xs tracking-[0.15em] uppercase">
          <PwaInstallButton className="hidden sm:inline-flex" />
          <Link href="/search" className="nav-link-light hidden sm:inline">Search</Link>
          <Link href="/dashboard" className="nav-link-light hidden sm:inline">Account</Link>
          <Link href="/cart" className="nav-link-light">Bag ({count})</Link>
          <button type="button" className="md:hidden nav-link-light" onClick={() => setOpen(!open)} aria-label="Menu">
            Menu
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t border-white/10 px-6 py-4 flex flex-col gap-3 bg-black">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="nav-link-light text-sm">
              {item.label}
            </Link>
          ))}
          <PwaInstallButton />
        </nav>
      )}
    </header>
  );
}
