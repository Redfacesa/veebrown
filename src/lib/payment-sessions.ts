import { getSupabase } from './supabase';

export type PaymentSession = {
  id: string;
  public_token: string;
  amount: number;
  currency: string;
  label: string | null;
  status: string;
  expires_at: string;
  payment_object_id: string | null;
};

/**
 * Arm a till amount onto a static NFC / printed QR station.
 * Customer already opened /t/RFP-XXXX (waiting). This pushes the amount to that link.
 */
export async function createPosPaymentSession(input: {
  merchantId: string;
  amountZar: number;
  label?: string;
  customerName?: string;
  /** payment_objects.id for the NFC card / counter QR station */
  paymentObjectId?: string | null;
  tapCode?: string;
}): Promise<PaymentSession> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const amount = Math.round(Number(input.amountZar));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Enter an amount greater than zero first');
  }

  let paymentObjectId = input.paymentObjectId?.trim() || null;
  const tapCode = input.tapCode?.trim() || null;

  // Resolve station id from tap code when UI only has RFP-XXXX
  if (!paymentObjectId && tapCode) {
    const { data: obj } = await supabase
      .from('payment_objects')
      .select('id')
      .eq('merchant_id', input.merchantId)
      .ilike('tap_code', tapCode)
      .maybeSingle();
    if (obj?.id) paymentObjectId = String(obj.id);
  }

  if (!paymentObjectId) {
    throw new Error(
      `Counter station ${tapCode || ''} is not linked in RedFace Pay yet. Open Get Paid and confirm the NFC card ${tapCode || ''} is active.`,
    );
  }

  const { data, error } = await supabase.functions.invoke('redface-pay', {
    body: {
      action: 'create_payment_session',
      merchant_id: input.merchantId,
      amount,
      currency: 'ZAR',
      label: (input.label || 'Pangolin POS').slice(0, 80),
      // Must match the station behind /t/RFP-XXXX so the waiting page picks it up
      payment_object_id: paymentObjectId,
      ttl_seconds: 900,
      business_intent: 'complete_sale',
      capture_method: 'nfc_tap',
      customer_name: input.customerName?.trim() || undefined,
      metadata: {
        channel: 'pangolin_pos',
        source: 'custom_amount',
        ecosystem_from: 'veebrown',
        tap_code: tapCode || undefined,
      },
    },
  });

  if (error) throw new Error(error.message || 'Could not set amount on counter link');
  if (!data?.status || !data?.session) {
    throw new Error(data?.message || 'Could not set amount on counter link');
  }

  const session = data.session as PaymentSession;
  if (!['waiting', 'opened', 'processing'].includes(session.status)) {
    throw new Error(data.message || 'Payment session was not activated');
  }
  return session;
}

export async function cancelPosPaymentSession(sessionId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.functions.invoke('redface-pay', {
    body: {
      action: 'cancel_payment_session',
      session_id: sessionId,
      reason: 'Cancelled from Pangolin POS',
    },
  });
}
