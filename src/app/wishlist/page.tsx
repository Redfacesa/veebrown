'use client';

import { useWishlist, useCart } from '@/lib/store';
import { useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/api';
import type { FashionProduct } from '@/lib/types';
import ProductGrid from '@/components/ProductGrid';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  const ids = useWishlist((s) => s.ids);
  const [products, setProducts] = useState<FashionProduct[]>([]);

  useEffect(() => {
    fetchProducts({ limit: 100 }).then((all) => {
      setProducts(all.filter((p) => ids.includes(p.id)));
    });
  }, [ids]);

  if (!ids.length) {
    return (
      <div className="pt-32 pb-16 section-padding text-center">
        <h1 className="font-display text-3xl mb-4">Your Wishlist</h1>
        <p className="text-white/50 mb-8">Save items you love by tapping the heart icon.</p>
        <Link href="/shop" className="btn-primary">Browse Shop <ArrowRight size={18} /></Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <ProductGrid products={products} title="Your Wishlist" />
    </div>
  );
}
