import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEMO_MODE, checkHealth, getRates, type Order } from '../api/client.ts'
import { convert } from '../utils/currency.ts'
import type { Product } from '../data/catalog.ts'
import type { PriceBreakdown } from '../utils/pricing.ts'

export type ConnectionStatus = 'checking' | 'connected' | 'demo' | 'offline'

export interface ConnectionInfo {
  status: ConnectionStatus
  message: string
  baseUrl: string
}

export interface OrderConfig {
  sizeId: string
  materialId: string
  finishingId: string
  quantity: number
  specLabels: { size: string; paper: string; finishing: string }
}

export interface OrderDraft {
  product: Product
  config: OrderConfig
  driveLink: string
  permissionConfirmed: boolean
  specialNotes: string
  price: PriceBreakdown
}

export interface ShopContextValue {
  currency: string
  rates: { THB: number; LAK: number }
  ratesLoaded: boolean
  demoMode: boolean
  setCurrency: (c: string) => void
  connection: ConnectionInfo
  testConnection: () => Promise<boolean>
  convertTo: (thb: number) => number
  orderDraft: OrderDraft | null
  setOrderDraft: (d: OrderDraft | null) => void
  placedOrder: Order | null
  setPlacedOrder: (o: Order | null) => void
}

const ShopContext = createContext<ShopContextValue | null>(null)

export function ShopProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState('THB')
  const [rates, setRates] = useState({ THB: 630.5, LAK: 1 })
  const [ratesLoaded, setRatesLoaded] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)
  const [connection, setConnection] = useState<ConnectionInfo>({
    status: 'checking', // checking | connected | demo | offline
    message: 'กำลังตรวจสอบการเชื่อมต่อ…',
    baseUrl: '',
  })

  useEffect(() => {
    let alive = true
    getRates().then((r) => {
      if (!alive) return
      setRates(r)
      setRatesLoaded(true)
      setDemoMode(DEMO_MODE.enabled)
      if (!DEMO_MODE.enabled) {
        setConnection({ status: 'connected', message: 'เชื่อมต่อกับระบบหลังบ้านแล้ว', baseUrl: '' })
      } else {
        setConnection({ status: 'demo', message: 'ใช้ข้อมูลตัวอย่าง (Demo Mode) — กดปุ่มเพื่อเชื่อมต่อ', baseUrl: '' })
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const testConnection = useMemo(
    () => async () => {
      setConnection({ status: 'checking', message: 'กำลังทดสอบการเชื่อมต่อ…', baseUrl: '' })
      const res = await checkHealth()
      if (res.ok) {
        setDemoMode(false)
        setConnection({ status: 'connected', message: 'เชื่อมต่อกับระบบหลังบ้านแล้ว', baseUrl: res.baseUrl })
        return true
      }
      setDemoMode(true)
      setConnection({ status: 'offline', message: 'ไม่พบระบบหลังบ้าน — ยังใช้ Demo Mode ได้', baseUrl: res.baseUrl })
      return false
    },
    []
  )

  // Save placed order so the receipt page survives refresh.
  useEffect(() => {
    const saved = localStorage.getItem('ssp_placed_order')
    if (saved) {
      try {
        setPlacedOrder(JSON.parse(saved))
      } catch {
        /* ignore */
      }
    }
  }, [])

  const value = useMemo(
    () => ({
      currency,
      rates,
      ratesLoaded,
      demoMode,
      setCurrency,
      connection,
      testConnection,
      // Convert a THB amount into the active display currency
      convertTo: (thb: number) => convert(thb, currency, rates.THB || rates.LAK),
      orderDraft,
      setOrderDraft,
      placedOrder,
      setPlacedOrder,
    }),
    [currency, rates, ratesLoaded, demoMode, connection, testConnection, orderDraft, placedOrder]
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}
