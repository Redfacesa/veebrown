'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <div className="pt-20 pb-16 bg-vbrown-ivory">
      <div className="section-padding max-w-2xl mx-auto">
        <h1 className="font-display text-3xl mb-2 text-center text-vbrown-charcoal">Search fragrances</h1>
        <p className="text-center text-vbrown-charcoal/50 text-sm mb-8">Find a scent by name or note</p>
        <form className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vbrown-charcoal/40" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "MADAME" or "woody floral"...'
            className="w-full bg-vbrown-cream border border-vbrown-charcoal/15 pl-12 pr-6 py-4 text-lg focus:border-vbrown-gold outline-none text-vbrown-charcoal"
          />
        </form>
        <p className="text-center text-vbrown-charcoal/40 text-sm">
          Browse the full collection on the <a href="/shop" className="text-vbrown-gold hover:underline">shop page</a> for now.
        </p>
      </div>
    </div>
  );
}
