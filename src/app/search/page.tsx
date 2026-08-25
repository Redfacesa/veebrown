'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <div className="pt-24 pb-16">
      <div className="section-padding max-w-2xl mx-auto">
        <h1 className="font-display text-3xl mb-8 text-center">Smart Search</h1>
        <form className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "I need office clothes" or "blue jacket"...'
            className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-4 text-lg focus:border-vbrown-gold outline-none"
          />
        </form>
        <p className="text-center text-white/40 text-sm">
          Natural language search powered by AI — Phase 2
        </p>
      </div>
    </div>
  );
}
