import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_MODE, checkHealth, getRates } from '../api/client.js'
import { convert } from '../utils/currency.js'

const ShopContext = createContext(null)

export function ShopProvider({ children }) {
  const [currency, setCurrency] = useState('THB')
  const [rates, setRates] = useState({ THB: 630.5, LAK: 1 })
  const [ratesLoaded, setRatesLoaded] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [orderDraft, setOrderDraft] = useState(null)
  const [placedOrder, setPlacedOrder] = useState(null)
  const [connection, setConnection] = useState({
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
      convertTo: (thb) => convert(thb, currency, rates.THB || rates.LAK),
      orderDraft,
      setOrderDraft,
      placedOrder,
      setPlacedOrder,
    }),
    [currency, rates, ratesLoaded, demoMode, connection, testConnection, orderDraft, placedOrder]
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}
