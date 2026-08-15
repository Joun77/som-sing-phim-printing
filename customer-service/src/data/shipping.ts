// ============================================================
// Shipping couriers & free-shipping conditions (Lao Logistics).
// Mirrors the backend configuration (Anousith Express & HAL Logistics).
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
    id: 'anousith_express',
    name: 'Anousith Express (ອະນຸສິດ ເອັກສະເປຣັສ)',
    short: 'Anousith',
    fee: 15000,
    eta: '1-2 ວັນ (1-2 Days)',
    freeAbove: 300000,
    color: '#d97706',
  },
  {
    id: 'hal_logistics',
    name: 'HAL Logistics (ຮົງອາລຸນ ຂົນສົ່ງ)',
    short: 'HAL',
    fee: 20000,
    eta: '1-2 ວັນ (1-2 Days)',
    freeAbove: 350000,
    color: '#2563eb',
  },
  {
    id: 'self_pickup',
    name: 'Self Pickup (ຮັບເອງທີ່ຮ້ານ)',
    short: 'Self Pickup',
    fee: 0,
    eta: 'ທັນທີ (Immediate)',
    freeAbove: 0,
    color: '#059669',
  },
]

export const FREE_SHIPPING_THRESHOLD = 300000

export const getCourier = (id: string) => COURIERS.find((c) => c.id === id)

// Bank account details shown on the payment step (BCEL OnePay)
export interface BankAccount {
  bank: string
  branch: string
  accountName: string
  accountNumber: string
  bcelOnePayQr: string
  promptpayName: string
}

export const BANK_ACCOUNT: BankAccount = {
  bank: 'BCEL (ທະນາຄານການຄ້າຕ່າງປະເທດລາວ ມະຫາຊົນ)',
  branch: 'Vientiane Head Office',
  accountName: 'Som-Sing Phim Printing Shop',
  accountNumber: '160-12-00-01234567-001',
  bcelOnePayQr: '/assets/images/bcel-qr-placeholder.png',
  promptpayName: 'Som-Sing Phim',
}
