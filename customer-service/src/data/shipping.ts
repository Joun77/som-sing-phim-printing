// ============================================================
// Shipping couriers & free-shipping conditions.
// Mirrors the backend configuration (fetched via REST when online).
// ============================================================

export interface Courier {
  id: string
  name: string
  short: string
  fee: number
  eta: string
  freeAbove: number
  color: string
}

export const COURIERS: Courier[] = [
  {
    id: 'flash_express',
    name: 'Flash Express',
    short: 'Flash',
    fee: 40,
    eta: '1-2 วัน',
    freeAbove: 800,
    color: '#ff7a00',
  },
  {
    id: 'jnt',
    name: 'J&T Express',
    short: 'J&T',
    fee: 45,
    eta: '1-3 วัน',
    freeAbove: 800,
    color: '#0084ff',
  },
  {
    id: 'kerry',
    name: 'Kerry Express',
    short: 'Kerry',
    fee: 55,
    eta: '1-3 วัน',
    freeAbove: 1000,
    color: '#d82b23',
  },
]

export const FREE_SHIPPING_THRESHOLD = 800

export const getCourier = (id: string) => COURIERS.find((c) => c.id === id)

// Bank account details shown on the payment step
export interface BankAccount {
  bank: string
  branch: string
  accountName: string
  accountNumber: string
  promptpay: string
  promptpayName: string
}

export const BANK_ACCOUNT: BankAccount = {
  bank: 'ธนาคารกสิกรไทย',
  branch: 'สาขาเซ็นทรัลเวิลด์',
  accountName: 'หจก. ส้มสิ่งพิมพ์',
  accountNumber: '064-2-12345-6',
  promptpay: '0812345678',
  promptpayName: 'ส้มสิ่งพิมพ์',
}
