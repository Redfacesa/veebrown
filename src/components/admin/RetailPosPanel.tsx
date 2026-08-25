'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, Copy, Delete, Minus, Plus, QrCode, Radio, ShoppingCart, Trash2, X } from 'lucide-react';
import { fmtZar } from '@/lib/api';
import {
  loadPosCatalog,
  recordPosCashSale,
  type CatalogProduct,
  type CatalogVariant,
} from '@/lib/merchant-dashboard';
import { cancelPosPaymentSession, createPosPaymentSession } from '@/lib/payment-sessions';
import {
  PANGOLIN_COUNTER_TAP_CODE,
  PANGOLIN_COUNTER_WAITING_URL,
  type PayStation,
} from '@/lib/pay-stations';
import { buildMerchantPayUrl, buildNfcTapUrl, buildQrImageUrl } from '@/lib/redface-pay';

type CartLine = {
  product: CatalogProduct;
  qty: number;
  variant?: CatalogVariant;
};

type PosMode = 'products' | 'custom';

const QUICK_AMOUNTS = [50, 100, 150, 200, 250, 500];

function lineKey(productId: string, variantId?: string) {
  return `${productId}:${variantId ?? 'base'}`;
}

function linePrice(line: CartLine) {
  return line.variant?.price ?? line.product.price;
}

function lineLabel(line: CartLine) {
  return line.variant ? `${line.product.name} (${line.variant.label})` : line.product.name;
}

function parseCustomAmount(raw: string): number {
  if (!raw || raw === '.') return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

export default function RetailPosPanel({
  merchantId,
  station,
  onSaleComplete,
}: {
  merchantId: string;
  /** Selected NFC / counter station — amount is pushed to its waiting /t/RFP-… link */
  station?: PayStation | null;
  onSaleComplete?: () => void;
}) {
  const [mode, setMode] = useState<PosMode>('products');
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof loadPosCatalog>>['categories']>([]);
  const [uncategorized, setUncategorized] = useState<CatalogProduct[]>([]);
  const [catalogOk, setCatalogOk] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [variantPick, setVariantPick] = useState<CatalogProduct | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChargeQr, setShowChargeQr] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [armedSessionId, setArmedSessionId] = useState<string | null>(null);
  const [armedAmount, setArmedAmount] = useState<number | null>(null);
  const [arming, setArming] = useState(false);

  const refresh = useCallback(async () => {
    const catalog = await loadPosCatalog(merchantId);
    setCatalogOk(catalog.ok);
    setCategories(catalog.categories);
    setUncategorized(catalog.uncategorized);
  }, [merchantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!checkoutOpen && !variantPick) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [checkoutOpen, variantPick]);

  const allProducts = useMemo(() => {
    return [...categories.flatMap((c) => c.products), ...uncategorized];
  }, [categories, uncategorized]);

  const visibleProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return allProducts;
    return allProducts.filter((p) => p.name.toLowerCase().includes(needle));
  }, [allProducts, search]);

  const productSubtotal = cart.reduce((sum, line) => sum + linePrice(line) * line.qty, 0);
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const customTotal = parseCustomAmount(customAmount);
  const amountDue = mode === 'custom' ? customTotal : productSubtotal;
  const canPay = amountDue > 0 && !busy;
  const chargeLabel =
    mode === 'custom'
      ? `Pangolin POS: ${customLabel.trim() || 'Custom amount'}`
      : `Pangolin POS: ${cart.map((l) => (l.qty > 1 ? `${l.qty}× ${lineLabel(l)}` : lineLabel(l))).join(', ') || 'Sale'}`;
  const pricedPayUrl =
    amountDue > 0
      ? buildMerchantPayUrl(merchantId, {
          amountZar: Math.round(amountDue),
          label: chargeLabel.slice(0, 80),
          returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined,
        })
      : '';
  const chargeQrSrc = pricedPayUrl ? buildQrImageUrl(pricedPayUrl, 220) : '';

  function switchMode(next: PosMode) {
    setMode(next);
    setCheckoutOpen(false);
    setShowChargeQr(false);
    setError(null);
    setMessage(null);
    if (armedSessionId) {
      void cancelPosPaymentSession(armedSessionId);
      setArmedSessionId(null);
      setArmedAmount(null);
    }
  }

  function addToCart(product: CatalogProduct, variant?: CatalogVariant) {
    const key = lineKey(product.id, variant?.id);
    setCart((prev) => {
      const idx = prev.findIndex((l) => lineKey(l.product.id, l.variant?.id) === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { product, qty: 1, variant }];
    });
    setVariantPick(null);
    setMessage(null);
    setError(null);
  }

  function onProductTap(product: CatalogProduct) {
    if (product.variants?.length) {
      setVariantPick(product);
      return;
    }
    addToCart(product);
  }

  function adjustQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) => {
          const k = lineKey(line.product.id, line.variant?.id);
          if (k !== key) return line;
          return { ...line, qty: line.qty + delta };
        })
        .filter((line) => line.qty > 0),
    );
  }

  function pressKey(key: string) {
    setCustomAmount((prev) => {
      if (key === 'C') return '';
      if (key === 'back') return prev.slice(0, -1);
      if (key === '.') return prev.includes('.') ? prev : `${prev || '0'}.`;

      const append = (digit: string) => {
        if (prev.includes('.')) {
          const [, dec = ''] = prev.split('.');
          if (dec.length >= 2) return prev;
        }
        if (!prev || prev === '0') return digit;
        return `${prev}${digit}`;
      };

      if (key === '00') {
        if (!prev || prev === '0') return '0';
        if (prev.includes('.')) {
          const [, dec = ''] = prev.split('.');
          if (dec.length >= 2) return prev;
          if (dec.length === 1) return `${prev}0`;
          return `${prev}00`.slice(0, prev.indexOf('.') + 3);
        }
        return `${prev}00`;
      }

      return append(key);
    });
    setError(null);
    setMessage(null);
  }

  function resetAfterSale() {
    setCart([]);
    setCashReceived('');
    setCustomerName('');
    setCustomAmount('');
    setCustomLabel('');
    setCheckoutOpen(false);
  }

  async function completeCashSale() {
    if (!canPay) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const received = cashReceived !== '' ? Number(cashReceived) : amountDue;
      if (!Number.isFinite(received) || received < amountDue) {
        throw new Error(`Cash received must be at least ${fmtZar(amountDue)}`);
      }

      const lineItems =
        mode === 'custom'
          ? [
              {
                product_id: '',
                name: customLabel.trim() || 'Custom amount',
                qty: 1,
                price: amountDue,
              },
            ]
          : cart.map((line) => ({
              product_id: line.product.id,
              name: lineLabel(line),
              qty: line.qty,
              price: linePrice(line),
            }));

      const result = await recordPosCashSale({
        merchantId,
        lineItems,
        customerName: customerName.trim() || undefined,
        paymentMethod: 'cash',
        cashReceived: received,
      });
      resetAfterSale();
      setMessage(
        result.changeGiven && result.changeGiven > 0
          ? `Sale recorded — change ${fmtZar(result.changeGiven)}`
          : 'Cash sale recorded',
      );
      onSaleComplete?.();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record sale');
    } finally {
      setBusy(false);
    }
  }

  function payByCard() {
    if (!canPay || !pricedPayUrl) return;
    window.open(pricedPayUrl, '_blank', 'noopener,noreferrer');
  }

  async function copyPricedLink() {
    if (!pricedPayUrl) return;
    try {
      await navigator.clipboard.writeText(pricedPayUrl);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      window.prompt('Copy payment link (includes amount):', pricedPayUrl);
    }
  }

  async function sendAmountToCounter() {
    if (!canPay) return;
    if (!station?.tapCode) {
      setError('No counter NFC/QR station linked. Create one in RedFace Pay → Get Paid, then refresh Admin.');
      return;
    }
    setArming(true);
    setError(null);
    setMessage(null);
    try {
      if (armedSessionId) {
        await cancelPosPaymentSession(armedSessionId);
        setArmedSessionId(null);
        setArmedAmount(null);
      }
      const session = await createPosPaymentSession({
        merchantId,
        amountZar: amountDue,
        label: chargeLabel,
        customerName: customerName.trim() || undefined,
        paymentObjectId: station.id || null,
        tapCode: station.tapCode,
      });
      setArmedSessionId(session.id);
      setArmedAmount(Math.round(amountDue));
      setMessage(
        `${fmtZar(amountDue)} sent to ${station.tapCode}. Anyone on the waiting page will see this amount now.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send amount to counter link');
    } finally {
      setArming(false);
    }
  }

  async function cancelArmedQr() {
    if (!armedSessionId) return;
    setArming(true);
    try {
      await cancelPosPaymentSession(armedSessionId);
      setArmedSessionId(null);
      setArmedAmount(null);
      setMessage('Counter amount cleared — waiting link is idle again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear counter amount');
    } finally {
      setArming(false);
    }
  }

  const waitingLink = !station
    ? ''
    : station.tapCode.toUpperCase() === PANGOLIN_COUNTER_TAP_CODE
      ? PANGOLIN_COUNTER_WAITING_URL
      : buildNfcTapUrl(station.tapCode);

  const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '00'] as const;

  const checkoutFields = (
    <div className="space-y-3">
      {mode === 'custom' && (
        <input
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          placeholder="What for? (optional)"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base sm:text-sm"
        />
      )}
      <input
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder="Customer name (optional)"
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base sm:text-sm"
      />
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="1"
        value={cashReceived}
        onChange={(e) => setCashReceived(e.target.value)}
        placeholder={amountDue ? `Cash received (default ${Math.round(amountDue)})` : 'Cash received'}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base sm:text-sm"
        disabled={!amountDue}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!canPay}
          onClick={() => void completeCashSale()}
          className="btn-primary text-sm justify-center min-h-12 disabled:opacity-40"
        >
          {busy ? 'Saving…' : 'Cash sale'}
        </button>
        <button
          type="button"
          disabled={!canPay}
          onClick={payByCard}
          className="btn-secondary text-sm justify-center min-h-12 disabled:opacity-40"
        >
          Card / link
        </button>
      </div>
      <button
        type="button"
        disabled={!canPay || arming || !station?.tapCode}
        onClick={() => void sendAmountToCounter()}
        className="btn-primary w-full text-sm justify-center min-h-12 disabled:opacity-40"
      >
        <Radio size={16} />
        {arming
          ? 'Sending…'
          : armedSessionId
            ? `Update counter · ${fmtZar(amountDue)}`
            : 'Send amount to counter QR / NFC'}
      </button>
      {station?.tapCode && (
        <p className="text-xs text-white/45">
          Sends to waiting link{' '}
          <span className="font-mono text-vbrown-gold">{waitingLink}</span>
        </p>
      )}
      {armedSessionId && armedAmount != null && station && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 space-y-2">
          <p className="text-sm text-emerald-300 font-semibold">
            Live on counter — {fmtZar(armedAmount)}
          </p>
          <p className="text-xs text-white/55">
            Customer already on “waiting for amount” (or scanning now) will get this price on:
          </p>
          <p className="text-[11px] font-mono text-white/40 break-all">{waitingLink}</p>
          <p className="text-xs text-white/45">Station code: <span className="font-mono text-vbrown-gold">{station.tapCode}</span></p>
          <button
            type="button"
            disabled={arming}
            onClick={() => void cancelArmedQr()}
            className="btn-secondary text-xs justify-center min-h-10 w-full"
          >
            Clear counter amount
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!canPay}
          onClick={() => setShowChargeQr((v) => !v)}
          className="btn-secondary text-sm justify-center min-h-12 disabled:opacity-40"
        >
          <QrCode size={16} />
          {showChargeQr ? 'Hide screen QR' : 'Screen QR (with amount)'}
        </button>
        <button
          type="button"
          disabled={!canPay}
          onClick={() => void copyPricedLink()}
          className="btn-secondary text-sm justify-center min-h-12 disabled:opacity-40"
        >
          <Copy size={16} />
          {linkCopied ? 'Copied!' : 'Copy link + amount'}
        </button>
      </div>
      {showChargeQr && pricedPayUrl && (
        <div className="rounded-xl border border-vbrown-gold/30 bg-vbrown-gold/5 p-4 text-center space-y-2">
          <p className="text-sm text-vbrown-gold font-semibold">
            On-screen QR — {fmtZar(amountDue)} in the link
          </p>
          <div className="inline-block rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={chargeQrSrc} alt="Priced payment QR" width={220} height={220} className="block" key={pricedPayUrl} />
          </div>
          <p className="text-xs text-white/45">
            Optional backup if you do not want to use the printed poster.
          </p>
        </div>
      )}
    </div>
  );

  const cartList = (
    <ul className="space-y-2 overflow-y-auto overscroll-contain">
      {cart.map((line) => {
        const key = lineKey(line.product.id, line.variant?.id);
        return (
          <li key={key} className="flex items-center gap-2 rounded-xl bg-black/25 px-3 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{lineLabel(line)}</p>
              <p className="text-xs text-vbrown-gold">{fmtZar(linePrice(line) * line.qty)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => adjustQty(key, -1)}
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg hover:bg-white/10 touch-manipulation"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center text-sm tabular-nums">{line.qty}</span>
              <button
                type="button"
                onClick={() => adjustQty(key, 1)}
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg hover:bg-white/10 touch-manipulation"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => adjustQty(key, -line.qty)}
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg hover:bg-white/10 text-red-400 touch-manipulation"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={`space-y-4 ${mode === 'products' && cartCount > 0 ? 'pb-24 lg:pb-0' : ''}`}>
      <div>
        <h2 className="text-xl font-semibold">In-store POS</h2>
        <p className="text-sm text-white/50 mt-1">
          Sell from the catalog, or enter any amount and take payment.
        </p>
      </div>

      <div className="flex w-full rounded-full border border-white/10 bg-black/30 p-1">
        <button
          type="button"
          onClick={() => switchMode('products')}
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm transition-colors touch-manipulation ${
            mode === 'products' ? 'bg-vbrown-gold text-vbrown-black font-semibold' : 'text-white/60'
          }`}
        >
          <ShoppingCart size={14} />
          Products
        </button>
        <button
          type="button"
          onClick={() => switchMode('custom')}
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm transition-colors touch-manipulation ${
            mode === 'custom' ? 'bg-vbrown-gold text-vbrown-black font-semibold' : 'text-white/60'
          }`}
        >
          <Banknote size={14} />
          Custom
        </button>
      </div>

      {!catalogOk && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Sign in with your RedFace Pay merchant account to use POS. Password-only admin can manage products but not record sales.
        </div>
      )}

      {mode === 'custom' ? (
        <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
          <div className="lg:col-span-3 glass rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="text-center lg:text-left">
              <p className="text-xs uppercase tracking-wide text-white/40">Amount to charge</p>
              <p className="mt-2 font-display text-4xl sm:text-5xl text-vbrown-gold tabular-nums break-all">
                {fmtZar(customTotal || 0)}
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {QUICK_AMOUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setCustomAmount(String(n));
                    setError(null);
                    setMessage(null);
                  }}
                  className="shrink-0 rounded-full border border-white/10 px-3.5 py-2 text-sm text-white/70 hover:border-vbrown-gold/50 touch-manipulation"
                >
                  R{n}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto lg:mx-0 w-full">
              {keypadKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => pressKey(key)}
                  className="rounded-xl border border-white/10 bg-black/30 min-h-14 text-xl font-semibold hover:border-vbrown-gold/40 active:scale-[0.98] transition touch-manipulation"
                >
                  {key}
                </button>
              ))}
              <button
                type="button"
                onClick={() => pressKey('back')}
                className="rounded-xl border border-white/10 bg-black/30 min-h-14 flex items-center justify-center hover:border-vbrown-gold/40 active:scale-[0.98] transition touch-manipulation"
                aria-label="Backspace"
              >
                <Delete size={20} />
              </button>
              <button
                type="button"
                onClick={() => pressKey('C')}
                className="col-span-2 rounded-xl border border-white/10 bg-black/30 min-h-14 text-sm font-semibold text-white/70 hover:border-red-400/40 hover:text-red-300 active:scale-[0.98] transition touch-manipulation"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 glass rounded-2xl p-4 sm:p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Banknote size={18} className="text-vbrown-gold" />
              <h3 className="font-semibold">Pay now</h3>
            </div>
            <div className="flex justify-between text-lg font-semibold mb-4">
              <span>Total</span>
              <span className="text-vbrown-gold">{fmtZar(amountDue)}</span>
            </div>
            {checkoutFields}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
          <div className="lg:col-span-3 space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base sm:text-sm"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-[min(60vh,520px)] lg:max-h-[480px] overflow-y-auto overscroll-contain pr-0.5">
              {visibleProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onProductTap(product)}
                  className="glass rounded-xl p-3 text-left border border-transparent hover:border-vbrown-gold/40 active:scale-[0.98] transition touch-manipulation min-h-[5.5rem]"
                >
                  <p className="font-medium text-sm line-clamp-2 leading-snug">{product.name}</p>
                  <p className="text-vbrown-gold text-sm mt-1.5 font-semibold">{fmtZar(product.price)}</p>
                  {product.track_inventory && product.stock_quantity != null && (
                    <p className="text-xs text-white/35 mt-1">{product.stock_quantity} left</p>
                  )}
                  {product.variants?.length ? (
                    <p className="text-xs text-white/40 mt-1">{product.variants.length} sizes</p>
                  ) : null}
                </button>
              ))}
              {!visibleProducts.length && (
                <p className="col-span-full text-white/40 text-sm py-8 text-center">No products found.</p>
              )}
            </div>
          </div>

          {/* Desktop cart */}
          <div className="hidden lg:flex lg:col-span-2 glass rounded-2xl p-5 flex-col min-h-[420px]">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={18} className="text-vbrown-gold" />
              <h3 className="font-semibold">Current sale</h3>
            </div>

            {cart.length === 0 ? (
              <p className="text-white/40 text-sm flex-1">Add products from the grid to start a sale.</p>
            ) : (
              <div className="flex-1 min-h-0 mb-4">{cartList}</div>
            )}

            <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-vbrown-gold">{fmtZar(productSubtotal)}</span>
              </div>
              {checkoutFields}
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky cart dock */}
      {mode === 'products' && cartCount > 0 && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-vbrown-black/95 backdrop-blur-xl px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="w-full btn-primary justify-between min-h-12 touch-manipulation"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingCart size={16} />
              {cartCount} item{cartCount === 1 ? '' : 's'}
            </span>
            <span>{fmtZar(productSubtotal)} · Checkout</span>
          </button>
        </div>
      )}

      {/* Mobile checkout sheet */}
      {checkoutOpen && mode === 'products' && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70">
          <button
            type="button"
            className="flex-1 w-full"
            aria-label="Close checkout"
            onClick={() => setCheckoutOpen(false)}
          />
          <div className="glass rounded-t-3xl border-b-0 max-h-[88vh] flex flex-col px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Checkout</h3>
                <p className="text-sm text-vbrown-gold">{fmtZar(productSubtotal)}</p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto space-y-4 pb-2">
              {cartList}
              {checkoutFields}
            </div>
          </div>
        </div>
      )}

      {variantPick && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="glass rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-sm pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <h3 className="font-semibold mb-1">{variantPick.name}</h3>
            <p className="text-sm text-white/50 mb-4">Choose size / variant</p>
            <div className="grid grid-cols-3 gap-2">
              {variantPick.variants?.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => addToCart(variantPick, v)}
                  className="rounded-xl border border-white/10 min-h-12 text-sm hover:border-vbrown-gold/50 touch-manipulation"
                >
                  {v.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setVariantPick(null)} className="btn-secondary w-full mt-4 text-sm min-h-12">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
