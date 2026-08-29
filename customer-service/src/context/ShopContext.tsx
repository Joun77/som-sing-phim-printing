import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEMO_MODE, checkHealth, getRates, fetchPublicCategories, fetchPublicProducts, type Order, type RemoteCategory, type RemoteProduct } from '../api/client.ts'
import { convert } from '../utils/currency.ts'
import type { Category, Product, SpecOption } from '../data/catalog.ts'
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

import type { BookOrderItem } from '../types/order.ts'

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
  bookItems?: BookOrderItem[]
  coverFileName?: string
  coverFileUrl?: string
  innerFileName?: string
  innerFileUrl?: string
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
  // Dynamic Catalog state
  categories: Category[]
  products: Product[]
  catalogLoading: boolean
  refreshCatalog: () => Promise<void>
  getCategory: (slug?: string) => Category | undefined
  getProduct: (slug?: string) => Product | undefined
  getProductsByCategory: (catSlug?: string) => Product[]
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

  const [rates, setRates] = useState<{ THB: number; LAK: number }>(() => {
    try {
      const cached = localStorage.getItem('ssp_cached_rates')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && typeof parsed.THB === 'number' && parsed.THB > 0) {
          return parsed
        }
      }
    } catch {
      /* ignore */
    }
    return { THB: 630.5, LAK: 1 }
  })
  const [ratesLoaded, setRatesLoaded] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Dynamic Catalog State (Live from DB)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

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

  // Catalog Fetcher & Transformer (Live from Database)
  const refreshCatalog = async () => {
    setCatalogLoading(true)
    try {
      const [remoteCats, remoteProds] = await Promise.all([
        fetchPublicCategories(),
        fetchPublicProducts(),
      ])

      if (remoteCats) {
        const transformedCats: Category[] = (remoteCats || []).map((rc: RemoteCategory) => ({
          id: rc.slug,
          slug: rc.slug,
          name: rc.nameLo || rc.slug,
          nameEn: rc.nameEn || rc.slug,
          short: rc.nameLo || rc.slug,
          shortEn: rc.nameEn,
          tagline: rc.taglineLo || '',
          taglineEn: rc.taglineEn || '',
          icon: rc.icon || 'doc',
          description: rc.descriptionLo || '',
          descriptionEn: rc.descriptionEn || '',
          sortOrder: rc.sortOrder,
        }))
        setCategories(transformedCats)
      }

      if (remoteProds) {
        const transformedProds: Product[] = (remoteProds || []).map((rp: RemoteProduct) => {
          const sizes: SpecOption[] = (rp.options || [])
            .filter((o) => o.optionType === 'size')
            .map((o) => ({
              id: o.value,
              label: o.labelLo || o.label,
              labelEn: o.labelEn || o.label,
              hint: o.hintLo || '',
              hintEn: o.hintEn || '',
              add: o.addPrice || 0,
            }))

          const materials: SpecOption[] = (rp.options || [])
            .filter((o) => o.optionType === 'material' || o.optionType === 'paper')
            .map((o) => ({
              id: o.value,
              label: o.labelLo || o.label,
              labelEn: o.labelEn || o.label,
              hint: o.hintLo || '',
              hintEn: o.hintEn || '',
              add: o.addPrice || 0,
              materialSku: o.materialSku,
              paperCode: o.paperCode,
            }))

          const finishings: SpecOption[] = (rp.options || [])
            .filter((o) => o.optionType === 'finishing' || o.optionType === 'cutting' || o.optionType === 'binding')
            .map((o) => ({
              id: o.value,
              label: o.labelLo || o.label,
              labelEn: o.labelEn || o.label,
              hint: o.hintLo || '',
              hintEn: o.hintEn || '',
              add: o.addPrice || 0,
            }))

          // Fallback defaults if options array is empty
          if (sizes.length === 0) {
            sizes.push({ id: 'standard', label: 'ມາດຕະຖານ (Standard)', labelEn: 'Standard Size', hint: '', add: 0 })
          }
          if (materials.length === 0) {
            materials.push({ id: 'standard_paper', label: 'ກະດາດມາດຕະຖານ', labelEn: 'Standard Paper', hint: '', add: 0 })
          }
          if (finishings.length === 0) {
            finishings.push({ id: 'none', label: 'ບໍ່ເຄືອບ / ຕັດກົງ', labelEn: 'None / Straight Cut', hint: '', add: 0 })
          }

          return {
            id: String(rp.id),
            slug: rp.slug,
            name: rp.nameLo || rp.name,
            nameEn: rp.nameEn || '',
            category: rp.categorySlug || rp.category,
            bestseller: rp.bestseller || false,
            basePrice: rp.basePrice || 0,
            unit: rp.unit || 'ຊິ້ນ',
            minQuantity: rp.minQuantity || 1,
            isOnDemand: rp.isOnDemand ?? true,
            image: rp.thumbnailUrl || 'doc',
            thumbnailUrl: rp.thumbnailUrl || '',
            galleryUrls: rp.galleryUrls || [],
            short: rp.descriptionLo || rp.description || '',
            shortEn: rp.descriptionEn || '',
            description: rp.descriptionLo || rp.description || '',
            descriptionEn: rp.descriptionEn || '',
            pricingModel: rp.pricingModel || 'STANDARD_FLAT',
            features: rp.features || [],
            sizes,
            materials,
            finishings,
            options: rp.options,
            discountTiers: rp.discountTiers,
          }
        })

        setProducts(transformedProds)
      }
    } catch (err) {
      console.warn('[Catalog Refresh Error]', err)
    } finally {
      setCatalogLoading(false)
    }
  }

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

    // Fetch dynamic catalog on mount
    refreshCatalog()

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
        refreshCatalog()
        return true
      }
      setDemoMode(true)
      setConnection({ status: 'offline', message: 'ບໍ່ພົບລະບົບຫຼັງບ້ານ — ຍັງໃຊ້ Demo Mode ໄດ້', baseUrl: res.baseUrl })
      return false
    },
    []
  )

  const getCategory = (slug?: string) => {
    if (!slug) return undefined
    const s = slug.toLowerCase()
    return categories.find(
      (c) =>
        c.slug.toLowerCase() === s ||
        c.id.toLowerCase() === s ||
        (s === 'sticker' && c.slug === 'stickers') ||
        (s === 'stickers' && c.slug === 'sticker') ||
        (s === 'business_card' && c.slug === 'business_cards') ||
        (s === 'business_cards' && c.slug === 'business_card') ||
        (s === 'book' && c.slug === 'documents') ||
        (s === 'photo' && c.slug === 'photos')
    )
  }

  const getProduct = (slug?: string) => {
    if (!slug) return undefined
    return products.find((p) => p.slug === slug || p.id === slug)
  }

  const getProductsByCategory = (catSlug?: string) => {
    if (!catSlug) return products
    const s = catSlug.toLowerCase()
    return products.filter((p) => {
      const pCat = (p.category || '').toLowerCase()
      return (
        pCat === s ||
        (s === 'stickers' && pCat === 'sticker') ||
        (s === 'sticker' && pCat === 'stickers') ||
        (s === 'business_cards' && pCat === 'business_card') ||
        (s === 'business_card' && pCat === 'business_cards') ||
        (s === 'documents' && (pCat === 'book' || pCat === 'doc' || pCat === 'documents')) ||
        (s === 'photos' && pCat === 'photo')
      )
    })
  }

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
      // Dynamic Catalog
      categories,
      products,
      catalogLoading,
      refreshCatalog,
      getCategory,
      getProduct,
      getProductsByCategory,
      // Cart
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
      categories,
      products,
      catalogLoading,
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
