'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import type { FashionProduct } from '@/lib/types';
import { fmtZar } from '@/lib/api';
import { useCart, useWishlist } from '@/lib/store';
import VeeBrownLogo from '@/components/VeeBrownLogo';

type Props = {
  products: FashionProduct[];
  title?: string;
};

export default function ProductGrid({ products, title = 'Featured fragrances' }: Props) {
  const addItem = useCart((s) => s.addItem);
  const { toggle, has } = useWishlist();

  if (!products.length) {
    return (
      <section className="section-padding py-24">
        {title ? <h2 className="font-display text-3xl text-vbrown-charcoal mb-8">{title}</h2> : null}
        <p className="text-vbrown-charcoal/50">No products yet. Add items from your RedFace Pay merchant portal.</p>
      </section>
    );
  }

  return (
    <section className="section-padding py-12 lg:py-16">
      {title ? (
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl text-vbrown-charcoal mb-2">{title}</h2>
            <p className="text-vbrown-charcoal/50">From the VV Brown collection</p>
          </div>
          <Link href="/shop" className="text-vbrown-gold hover:text-vbrown-charcoal transition-colors text-xs tracking-[0.2em] uppercase hidden sm:block">
            View all
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product, i) => {
          const cover = product.images?.[0] ?? product.image_url;
          return (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group text-center"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-vbrown-cream border border-vbrown-charcoal/10 mb-4">
                <Link href={`/product/${product.id}`}>
                  {cover ? (
                    <Image
                      src={cover}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width:768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-6 bg-vbrown-charcoal">
                      <VeeBrownLogo href="" variant="mark" size="footer" />
                    </div>
                  )}
                </Link>

                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => toggle(product.id)}
                    className={`w-9 h-9 bg-vbrown-ivory/95 border border-vbrown-charcoal/10 flex items-center justify-center transition-colors ${has(product.id) ? 'text-vbrown-gold' : 'text-vbrown-charcoal/50 hover:text-vbrown-gold'}`}
                    aria-label="Add to wishlist"
                  >
                    <Heart size={16} fill={has(product.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => addItem(product)}
                    className="w-9 h-9 bg-vbrown-ivory/95 border border-vbrown-charcoal/10 flex items-center justify-center text-vbrown-charcoal/50 hover:text-vbrown-gold transition-colors"
                    aria-label="Quick add to cart"
                  >
                    <ShoppingBag size={16} />
                  </button>
                </div>

                {product.stock_quantity != null && product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                  <span className="absolute top-3 left-3 px-2 py-1 bg-vbrown-charcoal/90 text-vbrown-cream text-[10px] tracking-wider uppercase">
                    Only {product.stock_quantity} left
                  </span>
                )}
              </div>

              <Link href={`/product/${product.id}`}>
                <h3 className="font-display text-lg text-vbrown-charcoal group-hover:text-vbrown-gold transition-colors line-clamp-1">
                  {product.name}
                </h3>
              </Link>

              <p className="text-vbrown-gold text-sm mt-1">{fmtZar(product.price)}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
