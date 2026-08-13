// ============================================================
// PromptPay QR Payload Generator (EMVCo / Thai QR standard)
// Produces a valid scannable QR string for Thai banking apps.
// ============================================================

function emvTlv(id: string, value: string | number) {
  const len = String(value).length
  return `${id}${String(len).padStart(2, '0')}${value}`
}

// CRC-16/CCITT-FALSE (0xFFFF)
function crc16ccitt(str: string) {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface PromptPayOptions {
  /** PromptPay target, digits only (phone 10 digits / ID 13 digits) */
  target: string
  /** amount in THB */
  amount: number
  /** bill/reference number (order id) */
  billRef?: string
}

/**
 * Build a PromptPay QR payload string.
 * @param {PromptPayOptions} opts
 */
export function buildPromptPayPayload({ target, amount, billRef }: PromptPayOptions) {
  if (!target) throw new Error('PromptPay target required')

  const digits = target.replace(/\D/g, '')
  // 10 digits => mobile (prefix 01), otherwise citizen/tax ID (prefix 02)
  const prefix = digits.length === 10 ? '01' : '02'
  const merchantId = emvTlv('00', 'A000000677010111') + emvTlv('01', prefix + digits)

  let payload = ''
  payload += emvTlv('00', '01')
  payload += emvTlv('01', '11')
  payload += emvTlv('29', merchantId)
  payload += emvTlv('52', '0000')
  payload += emvTlv('53', '764') // THB
  payload += emvTlv('54', amount.toFixed(2))
  payload += emvTlv('58', 'TH')
  payload += emvTlv('59', 'SOM SING PHIM')
  payload += emvTlv('60', 'BANGKOK')
  if (billRef) {
    const extra = emvTlv('05', billRef.replace(/[^A-Z0-9-]/gi, '').slice(0, 20))
    payload += emvTlv('62', extra)
  }
  payload += emvTlv('63', '') // CRC placeholder (length computed after)
  const crcBase = payload.slice(0, -4) + '6304'
  return crcBase + crc16ccitt(crcBase)
}
