import { NextResponse } from 'next/server';
import { getVeeBrownConfig, getMerchantIdFromConfig } from '@/lib/platform-config';
import { PANGOLIN_COUNTER_TAP_CODE, type PayStation } from '@/lib/pay-stations';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  const config = await getVeeBrownConfig();
  const payMerchantId = getMerchantIdFromConfig(config);

  let nfcTag: string | undefined;
  let nfcTags: string[] = [];
  let payStations: PayStation[] = [];
  const supabase = getSupabase();

  if (supabase && payMerchantId) {
    const [{ data: tags }, { data: objects }, { data: knownObject }] = await Promise.all([
      supabase
        .from('nfc_tags')
        .select('tag_code')
        .eq('merchant_id', payMerchantId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(20),
      supabase
        .from('payment_objects')
        .select('id, tap_code, label, medium')
        .eq('merchant_id', payMerchantId)
        .eq('status', 'active')
        .not('tap_code', 'is', null)
        .order('created_at', { ascending: true })
        .limit(20),
      // Prefer the programmed Pangolin counter tag even if status/filter differs
      supabase
        .from('payment_objects')
        .select('id, tap_code, label, medium, status')
        .eq('merchant_id', payMerchantId)
        .ilike('tap_code', PANGOLIN_COUNTER_TAP_CODE)
        .maybeSingle(),
    ]);

    payStations = (objects ?? [])
      .map((r) => ({
        id: String(r.id),
        tapCode: String(r.tap_code || '').trim(),
        label: String(r.label || r.tap_code || 'Counter').trim() || 'Counter',
      }))
      .filter((s) => s.id && s.tapCode);

    if (knownObject?.id && knownObject?.tap_code) {
      const known: PayStation = {
        id: String(knownObject.id),
        tapCode: String(knownObject.tap_code).trim(),
        label: String(knownObject.label || 'Pangolin counter').trim() || 'Pangolin counter',
      };
      payStations = [known, ...payStations.filter((s) => s.id !== known.id)];
    }

    const objectCodes = new Set(payStations.map((s) => s.tapCode.toLowerCase()));
    for (const row of tags ?? []) {
      const code = String(row.tag_code || '').trim();
      if (!code || objectCodes.has(code.toLowerCase())) continue;
      nfcTags.push(code);
    }

    // Always surface the known physical tag code first.
    if (!payStations.some((s) => s.tapCode.toUpperCase() === PANGOLIN_COUNTER_TAP_CODE)) {
      // Placeholder so UI shows the correct waiting link;
      // arming resolves payment_object_id by tap code at send-time.
      payStations.unshift({
        id: '',
        tapCode: PANGOLIN_COUNTER_TAP_CODE,
        label: 'Pangolin counter NFC',
      });
    }

    nfcTags = [
      ...new Set([
        PANGOLIN_COUNTER_TAP_CODE,
        ...payStations.map((s) => s.tapCode),
        ...nfcTags,
      ]),
    ];
    nfcTag = PANGOLIN_COUNTER_TAP_CODE;
  } else {
    nfcTag = PANGOLIN_COUNTER_TAP_CODE;
    nfcTags = [PANGOLIN_COUNTER_TAP_CODE];
    payStations = [
      {
        id: '',
        tapCode: PANGOLIN_COUNTER_TAP_CODE,
        label: 'Pangolin counter NFC',
      },
    ];
  }

  return NextResponse.json({
    payMerchantId,
    nfcTag,
    nfcTags,
    payStations,
    counterWaitingUrl: `https://redfacepay.co.za/t/${PANGOLIN_COUNTER_TAP_CODE}`,
    siteUrl: config.siteUrl,
    domains: config.domains,
    adminEmails: config.adminEmails,
    merchant: config.merchant,
  });
}
