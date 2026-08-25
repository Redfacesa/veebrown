'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, Zap } from 'lucide-react';
import type { FashionProduct } from '@/lib/types';
import { fetchProduct, fetchProducts, fmtZar } from '@/lib/api';
import { useCart, useWishlist } from '@/lib/store';
import ProductGrid from '@/components/ProductGrid';
import VeeBrownLogo from '@/components/VeeBrownLogo';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<FashionProduct | null>(null);
  const [similar, setSimilar] = useState<FashionProduct[]>([]);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const addItem = useCart((s) => s.addItem);
  const replaceCart = useCart((s) => s.replaceCart);
  const { toggle, has } = useWishlist();

  useEffect(() => {
    if (!id) return;
    fetchProduct(id).then((p) => {
      setProduct(p);
      setActiveImage(0);
    });
    fetchProducts({ limit: 4 }).then(setSimilar);
  }, [id]);

  if (!product) {
    return <div className="pt-24 section-padding text-vbrown-charcoal/40">Loading fragrance...</div>;
  }

  const images = product.images?.length ? product.images : product.image_url ? [product.image_url] : [];

  function handleBuyNow() {
    replaceCart(product, { quantity: qty });
    router.push('/cart?checkout=1');
  }

  return (
    <div className="pt-20 pb-16 bg-vbrown-ivory">
      <div className="section-padding">
        <nav className="text-sm text-vbrown-charcoal/40 mb-8">
          <Link href="/shop" className="hover:text-vbrown-gold">Shop</Link>
          {product.category_name && (
            <>
              <span className="mx-2">/</span>
              <span>{product.category_name}</span>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-vbrown-charcoal/70">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden bg-vbrown-cream border border-vbrown-charcoal/10">
              {images[activeImage] ? (
                <Image src={images[activeImage]} alt={product.name} fill className="object-cover" priority />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8 bg-vbrown-charcoal">
                  <VeeBrownLogo href={null} size="hero" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 8).map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-square overflow-hidden bg-vbrown-cream border-2 transition-colors ${
                      activeImage === idx ? 'border-vbrown-gold' : 'border-vbrown-charcoal/10'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-vbrown-gold text-xs tracking-[0.35em] uppercase mb-3">VV Brown Fragrances</p>
            <h1 className="font-display text-3xl lg:text-4xl text-vbrown-charcoal mb-2">{product.name}</h1>
            {product.rating != null && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.round(product.rating!) ? 'text-vbrown-gold fill-vbrown-gold' : 'text-vbrown-charcoal/15'} />
                  ))}
                </div>
                <span className="text-sm text-vbrown-charcoal/40">({product.review_count ?? 0} reviews)</span>
              </div>
            )}
            <p className="text-3xl text-vbrown-gold font-display mb-6">{fmtZar(product.price)}</p>
            {product.description && (
              <p className="text-vbrown-charcoal/70 leading-relaxed mb-8 whitespace-pre-line">{product.description}</p>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-vbrown-charcoal/20">
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 text-vbrown-charcoal/60 hover:text-vbrown-gold">
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button type="button" onClick={() => setQty(qty + 1)} className="p-3 text-vbrown-charcoal/60 hover:text-vbrown-gold">
                  <Plus size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggle(product.id)}
                className={`p-3 border border-vbrown-charcoal/20 ${has(product.id) ? 'text-vbrown-gold' : 'text-vbrown-charcoal/50 hover:text-vbrown-gold'}`}
              >
                <Heart size={20} fill={has(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="space-y-3 mb-8">
              <button
                type="button"
                onClick={() => addItem(product, { quantity: qty })}
                className="btn-classic w-full flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                Add to bag
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="btn-outline w-full flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Buy now
              </button>
            </div>

            <div className="flex items-start gap-3 text-sm text-vbrown-charcoal/55 border-t border-vbrown-charcoal/10 pt-6">
              <Truck size={18} className="text-vbrown-gold shrink-0 mt-0.5" />
              <p>{product.delivery_info ?? 'Delivery across South Africa. Checkout securely with RedFace Pay.'}</p>
            </div>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <ProductGrid products={similar.filter((p) => p.id !== product.id)} title="More fragrances" />
      )}
    </div>
  );
}
