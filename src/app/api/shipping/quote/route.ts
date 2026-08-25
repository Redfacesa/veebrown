import { NextResponse } from 'next/server';
import { bottleWeightKg, quoteShipping, type ShippingRegion, type ShippingService } from '@/lib/shipping-rates';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      region?: ShippingRegion;
      service?: ShippingService;
      bottleCount?: number;
      province?: string;
    };

    const region = body.region ?? 'za_national';
    const bottleCount = Math.max(1, Number(body.bottleCount ?? 1));
    const quote = quoteShipping({
      region,
      service: body.service ?? 'standard',
      bottleCount,
      province: body.province,
    });

    return NextResponse.json({
      ok: true,
      quote,
      weightKg: bottleWeightKg(bottleCount),
      note: 'Indicative rates aligned to Courier Guy (SA) and DHL Express (international). Final carrier selected when the order is packed.',
    });
  } catch {
    return NextResponse.json({ ok: false, message: 'Could not calculate shipping' }, 400);
  }
}
