'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Minus, Plus, Scissors, Trash2 } from 'lucide-react';
import type { TailoringService } from '@/lib/types';
import { createTailoringPosOrder, fetchTailoringServices, fmtZar } from '@/lib/api';
import { useTailoringCart, type TailoringUrgency } from '@/lib/tailoring-store';
import { buildTailoringPayLabel, buildTailoringPayUrl } from '@/lib/redface-pay';
import TailoringPaymentPanel from '@/components/TailoringPaymentPanel';

type ShopConfig = {
  payMerchantId: string;
  nfcTag?: string;
};

export default function TailoringPos() {
  const cart = useTailoringCart();
  const [services, setServices] = useState<TailoringService[]>([]);
  const [config, setConfig] = useState<ShopConfig>({ payMerchantId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ mode: 'card' | 'cash'; reference: string; amount: number } | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '10:00',
    notes: '',
  });

  useEffect(() => {
    fetchTailoringServices().then(setServices);
    fetch('/api/config')
      .then((r) => r.json())
      .then((c) =>
        setConfig({
          payMerchantId: c.payMerchantId ?? '',
          nfcTag: c.nfcTag,
        }),
      );
  }, []);

  const total = cart.total();
  const lines = cart.lines.map((l) => ({
    name: l.service.name,
    quantity: l.quantity,
    service_id: l.service.id,
    service_name: l.service.name,
    price: l.service.price,
  }));

  function validateForm(): boolean {
    if (!cart.lines.length) {
      setError('Add at least one tailoring service.');
      return false;
    }
    if (!form.name.trim()) {
      setError('Enter customer name.');
      return false;
    }
    if (!form.date) {
      setError('Pick a drop-off or appointment date.');
      return false;
    }
    if (!config.payMerchantId) {
      setError('Merchant is not linked yet.');
      return false;
    }
    setError(null);
    return true;
  }

  async function createOrder(paymentMethod: 'card' | 'cash' | 'qr' | 'nfc' | 'link') {
    const scheduled = new Date(`${form.date}T${form.time || '10:00'}`);
    return createTailoringPosOrder({
      merchant_id: config.payMerchantId,
      customer_name: form.name.trim(),
      customer_email: form.email.trim() || undefined,
      customer_phone: form.phone.trim() || undefined,
      scheduled_at: scheduled.toISOString(),
      urgency: cart.urgency,
      pickup_method: cart.pickup,
      notes: form.notes.trim() || undefined,
      amount: total,
      payment_method: paymentMethod,
      items: lines.map(({ service_id, service_name, price, quantity }) => ({
        service_id,
        service_name,
        price,
        quantity,
      })),
    });
  }

  async function prepareCardCheckout(): Promise<string> {
    if (!validateForm()) throw new Error('Complete the form and add services');
    const order = await createOrder('card');
    const label = buildTailoringPayLabel(lines);
    return buildTailoringPayUrl({
      merchantId: config.payMerchantId,
      amountZar: total,
      label,
      bookingRef: order.reference,
    });
  }

  async function handlePayCash(e?: FormEvent) {
    e?.preventDefault();
    if (!validateForm()) return;
    setBusy(true);
    setError(null);
    try {
      const order = await createOrder('cash');
      cart.clear();
      setDone({ mode: 'cash', reference: order.reference, amount: total });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save order');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="glass rounded-2xl p-8 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-vbrown-gold/20 flex items-center justify-center mx-auto mb-6">
          <Scissors size={32} className="text-vbrown-gold" />
        </div>
        <h2 className="font-display text-2xl mb-2">Order saved</h2>
        <p className="text-white/50 mb-2">Reference: <strong className="text-white">{done.reference}</strong></p>
        {done.mode === 'cash' ? (
          <p className="text-vbrown-gold font-semibold text-lg mb-6">
            Pay {fmtZar(done.amount)} cash at the counter
          </p>
        ) : (
          <p className="text-white/50 mb-6">Payment complete — we&apos;ll notify you when ready.</p>
        )}
        <button type="button" onClick={() => setDone(null)} className="btn-primary">
          New tailoring order
        </button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-4 lg:gap-8 pb-8">
      <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
        <h2 className="text-lg font-semibold text-white/80">Select services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] lg:max-h-[55vh] overflow-y-auto overscroll-contain pr-1">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => cart.addService(service)}
              className="text-left glass rounded-xl p-4 border border-transparent hover:border-vbrown-gold/40 active:scale-[0.99] transition touch-manipulation min-h-[5rem]"
            >
              <h3 className="font-medium mb-1">{service.name}</h3>
              {service.description && (
                <p className="text-xs text-white/40 line-clamp-2 mb-2">{service.description}</p>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-vbrown-gold font-semibold">{fmtZar(service.price)}</span>
                <span className="text-white/40">{service.estimated_days}d</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 order-1 lg:order-2">
        <form onSubmit={handlePayCash} className="glass rounded-2xl p-4 sm:p-6 space-y-5 lg:sticky lg:top-28">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Tailoring till</h2>
            <span className="text-xs text-white/40 shrink-0">{cart.lineCount()} item(s)</span>
          </div>

          {cart.lines.length === 0 ? (
            <p className="text-sm text-white/40 py-4 sm:py-6 text-center">Tap services to add them to the order</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto overscroll-contain">
              {cart.lines.map((line) => (
                <li key={line.service.id} className="flex items-center gap-2 text-sm bg-black/20 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{line.service.name}</p>
                    <p className="text-vbrown-gold">{fmtZar(line.service.price * line.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => cart.setQuantity(line.service.id, line.quantity - 1)}
                      className="min-h-10 min-w-10 inline-flex items-center justify-center text-white/50 hover:text-white touch-manipulation"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-5 text-center tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => cart.setQuantity(line.service.id, line.quantity + 1)}
                      className="min-h-10 min-w-10 inline-flex items-center justify-center text-white/50 hover:text-white touch-manipulation"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => cart.removeService(line.service.id)}
                      className="min-h-10 min-w-10 inline-flex items-center justify-center text-red-400/70 hover:text-red-400 touch-manipulation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="block sm:col-span-2">
              <span className="text-white/40 text-xs">Customer name *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-base sm:text-sm"
              />
            </label>
            <label className="block">
              <span className="text-white/40 text-xs">Phone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-base sm:text-sm"
              />
            </label>
            <label className="block">
              <span className="text-white/40 text-xs">Date *</span>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-base sm:text-sm"
              />
            </label>
            <label className="block">
              <span className="text-white/40 text-xs">Urgency</span>
              <select
                value={cart.urgency}
                onChange={(e) => cart.setUrgency(e.target.value as TailoringUrgency)}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-base sm:text-sm"
              >
                <option value="standard">Standard</option>
                <option value="express">Express (+50%)</option>
                <option value="rush">Rush (+100%)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-white/40 text-xs">Pickup</span>
              <select
                value={cart.pickup}
                onChange={(e) => cart.setPickup(e.target.value as 'pickup' | 'delivery')}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-base sm:text-sm"
              >
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </label>
          </div>

          {cart.urgency !== 'standard' && cart.subtotal() > 0 && (
            <p className="text-xs text-white/40">
              Subtotal {fmtZar(cart.subtotal())} · Urgency {cart.urgency}
            </p>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <TailoringPaymentPanel
            merchantId={config.payMerchantId}
            nfcTag={config.nfcTag}
            amount={total}
            lines={lines}
            disabled={busy}
            onPrepareCheckout={prepareCardCheckout}
            onPayCash={() => void handlePayCash()}
          />
        </form>
      </div>
    </div>
  );
}
