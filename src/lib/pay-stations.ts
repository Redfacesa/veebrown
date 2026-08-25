export type PayStation = {
  /** payment_objects.id — required when arming a till session for this card/QR */
  id: string;
  tapCode: string;
  label: string;
};

/** Pangolin counter NFC tag (physical card / printed waiting QR). */
export const PANGOLIN_COUNTER_TAP_CODE = 'RFP-5CC82CE4';

export const PANGOLIN_COUNTER_WAITING_URL = `https://redfacepay.co.za/t/${PANGOLIN_COUNTER_TAP_CODE}`;

export function stationTapUrl(tapCode: string, payBase = 'https://redfacepay.co.za') {
  const base = payBase.replace(/\/+$/, '');
  return `${base}/t/${encodeURIComponent(tapCode.trim())}`;
}
