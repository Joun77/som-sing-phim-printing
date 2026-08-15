// ============================================================
// BCEL OnePay & LAK Payment QR Generator (Lao PDR Standard)
// Produces BCEL OnePay compatible QR payload and payment slip models.
// ============================================================

function emvTlv(id: string, value: string | number) {
  const len = String(value).length;
  return `${id}${String(len).padStart(2, '0')}${value}`;
}

// CRC-16/CCITT-FALSE (0xFFFF)
function crc16ccitt(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface BcelOnePayOptions {
  /** BCEL Account Number or Merchant Mobile Number */
  accountNo: string;
  /** Account Holder Name */
  accountName: string;
  /** Amount in Lao Kip (LAK) */
  amountLAK: number;
  /** Order ID / Bill Reference */
  orderId?: string;
  /** Static QR image URL fallback if configured */
  qrImageUrl?: string;
}

export interface PaymentSlipUploadPayload {
  orderId: string;
  slipUrl: string;
  amountLAK: number;
  paymentMethod: 'BCEL_ONEPAY_QR' | 'BANK_TRANSFER';
  uploadedAt: string;
}

/**
 * Build a BCEL OnePay LAK QR payload string.
 */
export function buildBcelOnePayPayload({ accountNo, amountLAK, orderId }: BcelOnePayOptions): string {
  if (!accountNo) throw new Error('BCEL account number is required');

  const cleanAcc = accountNo.replace(/\D/g, '');
  const merchantId = emvTlv('00', 'LAO_BCEL_ONEPAY') + emvTlv('01', cleanAcc);

  let payload = '';
  payload += emvTlv('00', '01');
  payload += emvTlv('01', '11');
  payload += emvTlv('29', merchantId);
  payload += emvTlv('52', '0000');
  payload += emvTlv('53', '418'); // 418 = LAK ISO Currency Code
  payload += emvTlv('54', Math.round(amountLAK).toString());
  payload += emvTlv('58', 'LA');
  payload += emvTlv('59', 'SOM SING PHIM');
  payload += emvTlv('60', 'VIENTIANE');
  if (orderId) {
    const extra = emvTlv('05', orderId.replace(/[^A-Z0-9-]/gi, '').slice(0, 20));
    payload += emvTlv('62', extra);
  }
  payload += emvTlv('63', '');
  const crcBase = payload.slice(0, -4) + '6304';
  return crcBase + crc16ccitt(crcBase);
}

// Backward-compatible alias
export const buildPromptPayPayload = buildBcelOnePayPayload;
