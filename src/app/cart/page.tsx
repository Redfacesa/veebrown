'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/store';
import { fmtZar } from '@/lib/api';
import { buildDirectPayUrl, createCommerceOrder } from '@/lib/redface-pay';
import ShippingSelector, { formatDeliveryAddress } from '@/components/ShippingSelector';
import type { ShippingQuote, ShippingRegion } from '@/lib/shipping-rates';
import { PANGOLIN_MERCHANT_ID, SITE_URL } from '@/lib/supabase';
import VeeBrownLogo from '@/components/VeeBrownLogo';

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [deliveryMeta, setDeliveryMeta] = useState({
    region: 'za_national' as ShippingRegion,
    province: 'Gauteng',
    city: '',
    postalCode: '',
  });

  const merchantId = PANGOLIN_MERCHANT_ID;
  const bottleCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = total();
  const shippingZar = shippingQuote?.amountZar ?? 0;
  const orderTotal = subtotal + shippingZar;
  const orderLabel =
    items.length === 1
      ? items[0].product.name
      : `VV Brown Fragrances order (${bottleCount} item${bottleCount === 1 ? '' : 's'})`;

  const handleShippingQuote = useCallback((quote: ShippingQuote | null) => {
    setShippingQuote(quote);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === '1') {
      checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  async function handleCheckout() {
    setCheckoutError('');
    if (!merchantId) {
      setCheckoutError('Checkout is not configured yet. Please contact the store.');
      return;
    }
    if (!items.length) return;
    if (!shippingQuote) {
      setCheckoutError('Choose your delivery destination above before paying.');
      checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setCheckingOut(true);
    try {
      const deliveryTo = formatDeliveryAddress(deliveryMeta);
      const result = await createCommerceOrder({
        merchantId,
        customerName: 'Customer',
        deliveryTo: `${deliveryTo} · ${shippingQuote.label}`,
        items: [
          ...items.map((i) => ({
            product_id: i.product.id,
            product_name: i.product.name,
            price_zar: i.product.price,
            quantity: i.quantity,
          })),
          {
            product_id: `shipping-${shippingQuote.region}`,
            product_name: `Delivery — ${shippingQuote.label}`,
            price_zar: shippingQuote.amountZar,
            quantity: 1,
          },
        ],
      });
      const orderId = String(result.order?.id ?? '');
      window.location.href = buildDirectPayUrl({
        merchantId,
        amountZar: orderTotal,
        label: orderLabel,
        returnUrl: `${SITE_URL}/dashboard/orders`,
        commerceOrderId: orderId || undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not start checkout.';
      setCheckoutError(message);
      window.location.href = buildDirectPayUrl({
        merchantId,
        amountZar: orderTotal,
        label: orderLabel,
        returnUrl: `${SITE_URL}/dashboard/orders`,
      });
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

  return (
    <div className="pt-20 pb-16 bg-vbrown-ivory">
      <div className="section-padding max-w-4xl mx-auto">
        <h1 className="font-display text-4xl text-vbrown-charcoal mb-8">Shopping bag</h1>

        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const key = `${item.product.id}-${item.size}-${item.color}`;
            return (
              <div key={key} className="border border-vbrown-charcoal/10 bg-vbrown-cream p-4 flex gap-4">
                <div className="relative w-24 h-28 overflow-hidden bg-black shrink-0 border border-vbrown-charcoal/10">
                  {item.product.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-contain p-1"
                    />
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

        <div className="mb-8">
          <ShippingSelector
            bottleCount={bottleCount}
            onQuote={handleShippingQuote}
            onMetaChange={setDeliveryMeta}
          />
        </div>

        <div ref={checkoutRef} className="border border-vbrown-charcoal/10 bg-vbrown-cream p-6 space-y-3">
          <div className="flex justify-between text-sm text-vbrown-charcoal/70">
            <span>Subtotal ({bottleCount} item{bottleCount === 1 ? '' : 's'})</span>
            <span>{fmtZar(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-vbrown-charcoal/70">
            <span>Delivery</span>
            <span>{shippingQuote ? fmtZar(shippingQuote.amountZar) : 'Choose delivery above'}</span>
          </div>
          <div className="flex justify-between text-lg text-vbrown-charcoal border-t border-vbrown-charcoal/10 pt-3">
            <span>Total</span>
            <span className="font-display text-vbrown-gold">{fmtZar(orderTotal)}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut}
            className="btn-classic w-full mt-2"
          >
            {checkingOut ? 'Opening RedFace Pay...' : `Pay with RedFace Pay — ${fmtZar(orderTotal)}`}
          </button>
          {checkoutError ? (
            <p className="text-xs text-red-800 text-center leading-relaxed">{checkoutError}</p>
          ) : (
            <p className="text-xs text-vbrown-charcoal/50 text-center leading-relaxed">
              Confirm delivery above, then pay securely with RedFace Pay.
            </p>
          )}
          <p className="text-[10px] admin-muted text-center leading-relaxed">
            Delivery is R50–R100 across South Africa for launch (1–3 bottles). International rates are higher.
            Final carrier is selected when your order is fulfilled.
          </p>
          <button
            type="button"
            onClick={() => clearCart()}
            className="text-xs tracking-widest uppercase text-vbrown-charcoal/40 hover:text-vbrown-gold w-full"
          >
            Clear bag
          </button>
        </div>
      </div>
    </div>
  );
}
