'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import type { Category, FashionProduct } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import { fetchCategories, fetchProducts } from '@/lib/api';
import { sortSignatureFragrancesFirst } from '@/lib/fragrance-catalog';

export default function ShopClient() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<FashionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const cats = await fetchCategories().catch(() => []);
      setCategories(cats);

      const cat = cats.find((c) => c.slug === categorySlug);
      const prods = await fetchProducts({
        categoryId: cat?.id,
        limit: 50,
      }).catch(() => []);
      setProducts(sortSignatureFragrancesFirst(prods));
      setLoading(false);
    }
    load();
  }, [categorySlug]);

  const allCats = categories.length
    ? categories
    : DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `cat-${i}`, merchant_id: '' }));

  return (
    <div className="pt-20 pb-16 bg-vbrown-ivory">
      <div className="section-padding mb-12">
        <p className="text-vbrown-gold text-xs tracking-[0.35em] uppercase mb-3">Shop</p>
        <h1 className="font-display text-4xl lg:text-5xl text-vbrown-charcoal mb-4">All fragrances</h1>
        <p className="text-vbrown-charcoal/60">Elegant eau de parfum for women and men</p>
      </div>

      <div className="section-padding mb-8 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          <a
            href="/shop"
            className={`px-4 py-2 text-xs tracking-[0.15em] uppercase whitespace-nowrap transition-colors border ${
              !categorySlug
                ? 'bg-vbrown-charcoal text-vbrown-cream border-vbrown-charcoal'
                : 'border-vbrown-charcoal/20 text-vbrown-charcoal/60 hover:border-vbrown-gold hover:text-vbrown-gold'
            }`}
          >
            All
          </a>
          {allCats.map((cat) => (
            <a
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className={`px-4 py-2 text-xs tracking-[0.15em] uppercase whitespace-nowrap transition-colors border ${
                categorySlug === cat.slug
                  ? 'bg-vbrown-charcoal text-vbrown-cream border-vbrown-charcoal'
                  : 'border-vbrown-charcoal/20 text-vbrown-charcoal/60 hover:border-vbrown-gold hover:text-vbrown-gold'
              }`}
            >
              {cat.emoji} {cat.name}
            </a>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="section-padding py-24 text-center text-vbrown-charcoal/40">Loading collection...</div>
      ) : (
        <ProductGrid products={products} title="" />
      )}
    </div>
  );
}
