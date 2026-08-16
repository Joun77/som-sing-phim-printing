import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEMO_MODE, checkHealth, getRates, type Order } from '../api/client.ts'
import { convert } from '../utils/currency.ts'
import type { Product } from '../data/catalog.ts'
import type { PriceBreakdown } from '../utils/pricing.ts'
import { TRANSLATIONS, type Language } from '../utils/i18n.ts'

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

export interface CartItem {
  id: string
  product: Product
  config: OrderConfig
  driveLink: string
  permissionConfirmed: boolean
  specialNotes: string
  price: PriceBreakdown
  selected: boolean
  createdAt: number
}

export interface ShopContextValue {
  currency: string
  language: Language
  setLanguage: (l: Language) => void
  t: (key: keyof typeof TRANSLATIONS['lo']) => string
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
  // Cart state & actions
  cart: CartItem[]
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  openCart: () => void
  closeCart: () => void
  addToCart: (item: Omit<CartItem, 'id' | 'createdAt' | 'selected'>) => void
  removeFromCart: (id: string) => void
  updateCartItemQuantity: (id: string, qty: number, newPrice?: PriceBreakdown) => void
  toggleCartItemSelection: (id: string) => void
  toggleSelectAll: (selected: boolean) => void
  clearCart: () => void
  clearSelectedCartItems: () => void
  selectedCartItems: CartItem[]
  selectedTotalTHB: number
  cartCount: number
}

const ShopContext = createContext<ShopContextValue | null>(null)

export function ShopProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState('LAK')
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('ssp_customer_lang')
    return (saved === 'en' || saved === 'lo') ? saved : 'lo'
  })

  const setLanguage = (l: Language) => {
    setLanguageState(l)
    localStorage.setItem('ssp_customer_lang', l)
  }

  const t = (key: keyof typeof TRANSLATIONS['lo']): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['lo']?.[key] || (key as string)
  }

  const [rates, setRates] = useState({ THB: 630.5, LAK: 1 })
  const [ratesLoaded, setRatesLoaded] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ssp_cart_items')
      if (saved) return JSON.parse(saved)
    } catch {
      /* ignore */
    }
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem('ssp_cart_items', JSON.stringify(cart))
    } catch {
      /* ignore */
    }
  }, [cart])

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

  const addToCart = (item: Omit<CartItem, 'id' | 'createdAt' | 'selected'>) => {
    const newItem: CartItem = {
      ...item,
      id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      selected: true,
      createdAt: Date.now()
    }
    setCart((prev) => [newItem, ...prev])
    setIsCartOpen(true)
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const updateCartItemQuantity = (id: string, qty: number, newPrice?: PriceBreakdown) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          config: { ...item.config, quantity: qty },
          price: newPrice || item.price,
        }
      })
    )
  }

  const toggleCartItemSelection = (id: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    )
  }

  const toggleSelectAll = (selected: boolean) => {
    setCart((prev) => prev.map((item) => ({ ...item, selected })))
  }

  const clearCart = () => {
    setCart([])
  }

  const clearSelectedCartItems = () => {
    setCart((prev) => prev.filter((item) => !item.selected))
  }

  const selectedCartItems = useMemo(() => cart.filter((item) => item.selected), [cart])
  const selectedTotalTHB = useMemo(
    () => selectedCartItems.reduce((sum, item) => sum + (item.price?.totalTHB || item.price?.total || 0), 0),
    [selectedCartItems]
  )
  const cartCount = cart.length

  const [connection, setConnection] = useState<ConnectionInfo>({
    status: 'checking',
    message: '',
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
        setConnection({ status: 'connected', message: 'ເຊື່ອມຕໍ່ກັບລະບົບຫຼັງບ້ານແລ້ວ', baseUrl: '' })
      } else {
        setConnection({ status: 'demo', message: 'ໃຊ້ຂໍ້ມູນຕົວຢ່າງ (Demo Mode)', baseUrl: '' })
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const testConnection = useMemo(
    () => async () => {
      setConnection({ status: 'checking', message: 'ກຳລັງທົດສອບການເຊື່ອມຕໍ່…', baseUrl: '' })
      const res = await checkHealth()
      if (res.ok) {
        setDemoMode(false)
        setConnection({ status: 'connected', message: 'ເຊື່ອມຕໍ່ກັບລະບົບຫຼັງບ້ານແລ້ວ', baseUrl: res.baseUrl })
        return true
      }
      setDemoMode(true)
      setConnection({ status: 'offline', message: 'ບໍ່ພົບລະບົບຫຼັງບ້ານ — ຍັງໃຊ້ Demo Mode ໄດ້', baseUrl: res.baseUrl })
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
      language,
      setLanguage,
      t,
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
      cart,
      isCartOpen,
      setIsCartOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      toggleCartItemSelection,
      toggleSelectAll,
      clearCart,
      clearSelectedCartItems,
      selectedCartItems,
      selectedTotalTHB,
      cartCount,
    }),
    [
      currency,
      language,
      rates,
      ratesLoaded,
      demoMode,
      connection,
      testConnection,
      orderDraft,
      placedOrder,
      cart,
      isCartOpen,
      selectedCartItems,
      selectedTotalTHB,
      cartCount,
    ]
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}
