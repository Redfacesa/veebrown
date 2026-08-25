'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/store';
import { fmtZar } from '@/lib/api';
import RedFacePayButtons from '@/components/RedFacePayButtons';
import { createCommerceOrder } from '@/lib/redface-pay';
import { useEffect, useState } from 'react';

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
          size: i.size,
          color: i.color,
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
      <div className="pt-32 pb-16 section-padding text-center">
        <h1 className="font-display text-3xl mb-4">Your Cart is Empty</h1>
        <p className="text-white/50 mb-8">Discover something you love.</p>
        <Link href="/shop" className="btn-primary">
          Shop Now <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  const cartTotal = total();

  return (
    <div className="pt-24 pb-16">
      <div className="section-padding max-w-4xl mx-auto">
        <h1 className="font-display text-4xl mb-8">Shopping Cart</h1>

        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const key = `${item.product.id}-${item.size}-${item.color}`;
            return (
              <div key={key} className="glass rounded-xl p-4 flex gap-4">
                <div className="relative w-24 h-28 rounded-lg overflow-hidden bg-white/5 shrink-0">
                  {item.product.image_url ? (
                    <Image src={item.product.image_url} alt={item.product.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">👕</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.product.name}</h3>
                  {(item.size || item.color) && (
                    <p className="text-sm text-white/40">
                      {[item.size, item.color].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-vbrown-gold mt-1">{fmtZar(item.product.price)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id, item.size, item.color)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.color)}
                      className="p-1 text-white/50 hover:text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.color)}
                      className="p-1 text-white/50 hover:text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex justify-between text-lg">
            <span>Subtotal</span>
            <span className="font-semibold text-vbrown-gold">{fmtZar(cartTotal)}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut}
            className="btn-primary w-full"
          >
            {checkingOut ? 'Redirecting to RedFace Pay...' : 'Checkout with RedFace Pay'}
          </button>
          <RedFacePayButtons amount={cartTotal} label="Pangolin Order" onBuyNow={handleCheckout} />
        </div>
      </div>
    </div>
  );
}
