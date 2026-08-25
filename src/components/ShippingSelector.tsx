'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  quoteShipping,
  SA_PROVINCES,
  SHIPPING_REGION_OPTIONS,
  type ShippingQuote,
  type ShippingRegion,
  type ShippingService,
} from '@/lib/shipping-rates';
import { fmtZar } from '@/lib/api';

type Props = {
  bottleCount: number;
  onQuote: (quote: ShippingQuote | null) => void;
  onMetaChange?: (meta: { region: ShippingRegion; province: string; city: string; postalCode: string }) => void;
};

export default function ShippingSelector({ bottleCount, onQuote, onMetaChange }: Props) {
  const [region, setRegion] = useState<ShippingRegion>('za_national');
  const [service, setService] = useState<ShippingService>('standard');
  const [province, setProvince] = useState('Gauteng');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const isInternational = region.startsWith('intl_');
  const isZa = region.startsWith('za_');

  const quote = useMemo(
    () =>
      quoteShipping({
        region,
        service: isInternational ? 'express' : service,
        bottleCount,
        province: isZa ? province : undefined,
      }),
    [region, service, bottleCount, province, isInternational, isZa],
  );

  useEffect(() => {
    onQuote(quote);
  }, [quote, onQuote]);

  function emitMeta(next: { region?: ShippingRegion; province?: string; city?: string; postalCode?: string }) {
    const meta = {
      region: next.region ?? region,
      province: next.province ?? province,
      city: next.city ?? city,
      postalCode: next.postalCode ?? postalCode,
    };
    onMetaChange?.(meta);
  }

  return (
    <div className="border border-vbrown-charcoal/10 bg-white p-5 space-y-4">
      <div>
        <h3 className="font-display text-lg text-vbrown-charcoal mb-1">Delivery</h3>
        <p className="text-xs admin-muted leading-relaxed">
          Launch delivery across South Africa: R50–R100 depending on location and bottle count. International rates
          quoted separately. Carrier confirmed when your order is packed.
        </p>
      </div>

      <div>
        <label htmlFor="ship-region" className="block text-[10px] tracking-[0.25em] uppercase admin-muted mb-2">
          Destination
        </label>
        <select
          id="ship-region"
          value={region}
          onChange={(e) => {
            const r = e.target.value as ShippingRegion;
            setRegion(r);
            emitMeta({ region: r });
          }}
          className="w-full border border-vbrown-charcoal/15 bg-vbrown-ivory px-3 py-2.5 text-sm text-vbrown-charcoal"
        >
          {['South Africa', 'International'].map((group) => (
            <optgroup key={group} label={group}>
              {SHIPPING_REGION_OPTIONS.filter((o) => o.group === group).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {isZa && (
        <>
          <div>
            <label htmlFor="ship-province" className="block text-[10px] tracking-[0.25em] uppercase admin-muted mb-2">
              Province
            </label>
            <select
              id="ship-province"
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                emitMeta({ province: e.target.value });
              }}
              className="w-full border border-vbrown-charcoal/15 bg-vbrown-ivory px-3 py-2.5 text-sm"
            >
              {SA_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ship-city" className="block text-[10px] tracking-[0.25em] uppercase admin-muted mb-2">
                City / suburb
              </label>
              <input
                id="ship-city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  emitMeta({ city: e.target.value });
                }}
                placeholder="Johannesburg"
                className="w-full border border-vbrown-charcoal/15 bg-vbrown-ivory px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ship-postal" className="block text-[10px] tracking-[0.25em] uppercase admin-muted mb-2">
                Postal code
              </label>
              <input
                id="ship-postal"
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                  emitMeta({ postalCode: e.target.value });
                }}
                placeholder="2000"
                className="w-full border border-vbrown-charcoal/15 bg-vbrown-ivory px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase admin-muted mb-2">Speed</p>
            <div className="flex flex-wrap gap-2">
              {(['standard', 'express'] as ShippingService[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setService(s)}
                  className={`px-4 py-2 text-xs tracking-wide uppercase border transition-colors ${
                    service === s
                      ? 'bg-vbrown-charcoal text-vbrown-cream border-vbrown-charcoal'
                      : 'border-vbrown-charcoal/20 text-vbrown-charcoal/60 hover:border-vbrown-gold'
                  }`}
                >
                  {s === 'standard' ? 'Standard' : 'Express'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="border-t border-vbrown-charcoal/10 pt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-sm text-vbrown-charcoal">{quote.label}</p>
          <p className="text-xs admin-muted mt-0.5">
            {quote.carrierHint} · {quote.eta} · ~{quote.weightKg}kg
          </p>
        </div>
        <p className="font-display text-xl text-vbrown-gold">{fmtZar(quote.amountZar)}</p>
      </div>
    </div>
  );
}

export function formatDeliveryAddress(opts: {
  region: ShippingRegion;
  province?: string;
  city?: string;
  postalCode?: string;
}): string {
  if (opts.region.startsWith('intl_')) {
    const label = SHIPPING_REGION_OPTIONS.find((o) => o.id === opts.region)?.label ?? opts.region;
    return `International — ${label}`;
  }
  const parts = [opts.city, opts.province, opts.postalCode, 'South Africa'].filter(Boolean);
  return parts.join(', ');
}
