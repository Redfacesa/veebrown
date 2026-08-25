'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/store';
import { fmtZar } from '@/lib/api';
import RedFacePayButtons from '@/components/RedFacePayButtons';
import { createCommerceOrder } from '@/lib/redface-pay';
import { useEffect, useState } from 'react';
import VeeBrownLogo from '@/components/VeeBrownLogo';

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [merchantId, setMerchantId] = useState('');

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((c) => setMerchantId(c.payMerchantId ?? ''));
  }, []);

  async function handleCheckout() {
    if (!merchantId || !items.length) return;
    setCheckingOut(true);
    try {
      const result = await createCommerceOrder({
        merchantId,
        customerName: 'Customer',
        deliveryTo: 'To be confirmed',
        items: items.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          price_zar: i.product.price,
          quantity: i.quantity,
        })),
      });
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } finally {
      setCheckingOut(false);
    }
  }

  if (!items.length) {
    return (
      <div className="pt-24 pb-16 section-padding text-center bg-vbrown-ivory min-h-[60vh]">
        <h1 className="font-display text-3xl text-vbrown-charcoal mb-4">Your bag is empty</h1>
        <p className="text-vbrown-charcoal/50 mb-8">Explore the VV Brown Fragrances collection.</p>
        <Link href="/shop" className="btn-classic inline-flex items-center gap-2">
          Shop fragrances <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const cartTotal = total();

  return (
    <div className="pt-20 pb-16 bg-vbrown-ivory">
      <div className="section-padding max-w-4xl mx-auto">
        <h1 className="font-display text-4xl text-vbrown-charcoal mb-8">Shopping bag</h1>

        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const key = `${item.product.id}-${item.size}-${item.color}`;
            return (
              <div key={key} className="border border-vbrown-charcoal/10 bg-vbrown-cream p-4 flex gap-4">
                <div className="relative w-24 h-28 overflow-hidden bg-vbrown-charcoal shrink-0 border border-vbrown-charcoal/10">
                  {item.product.image_url ? (
                    <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      <VeeBrownLogo href={null} variant="mark" size="footer" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg text-vbrown-charcoal">{item.product.name}</h3>
                  <p className="text-vbrown-gold mt-1">{fmtZar(item.product.price)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id, item.size, item.color)}
                    className="text-vbrown-charcoal/30 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center gap-2 border border-vbrown-charcoal/15">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.color)}
                      className="p-1.5 text-vbrown-charcoal/50 hover:text-vbrown-gold"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.color)}
                      className="p-1.5 text-vbrown-charcoal/50 hover:text-vbrown-gold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border border-vbrown-charcoal/10 bg-vbrown-cream p-6 space-y-4">
          <div className="flex justify-between text-lg text-vbrown-charcoal">
            <span>Subtotal</span>
            <span className="font-display text-vbrown-gold">{fmtZar(cartTotal)}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut}
            className="btn-classic w-full"
          >
            {checkingOut ? 'Redirecting to RedFace Pay...' : 'Checkout with RedFace Pay'}
          </button>
          <RedFacePayButtons amount={cartTotal} label="VV Brown Fragrances order" onBuyNow={handleCheckout} />
          <button type="button" onClick={() => clearCart()} className="text-xs tracking-widest uppercase text-vbrown-charcoal/40 hover:text-vbrown-gold w-full">
            Clear bag
          </button>
        </div>
      </div>
    </div>
  );
}
