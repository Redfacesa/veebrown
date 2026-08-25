'use client';

import Link from 'next/link';
import { Plus, Shirt } from 'lucide-react';

const COLLECTIONS = ['Summer', 'Winter', 'Work', 'Church', 'Date Night', 'Vacation'];

export default function WardrobePage() {
  return (
    <div className="pt-24 pb-16">
      <div className="section-padding max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-display text-4xl mb-2">My Wardrobe</h1>
            <p className="text-white/50">Save and organize your favorite outfits</p>
          </div>
          <button type="button" className="btn-primary text-sm">
            <Plus size={16} /> New Outfit
          </button>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {COLLECTIONS.map((c) => (
            <button key={c} type="button" className="px-4 py-2 rounded-full glass text-sm whitespace-nowrap hover:border-vbrown-gold/30">
              {c}
            </button>
          ))}
        </div>

        <div className="glass rounded-2xl p-16 text-center">
          <Shirt size={48} className="mx-auto mb-4 text-white/20" />
          <h2 className="text-xl font-semibold mb-2">Outfit Builder</h2>
          <p className="text-white/40 mb-6 max-w-md mx-auto">
            Drag shirt, pants, shoes, and accessories to build complete outfits. Coming in Phase 2.
          </p>
          <Link href="/shop" className="btn-secondary text-sm">Shop to Build Outfits</Link>
        </div>
      </div>
    </div>
  );
}
