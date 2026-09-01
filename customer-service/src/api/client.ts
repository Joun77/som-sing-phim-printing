// ============================================================
// API Client — Decoupled REST layer to the Go backend.
// Endpoints: GET /api/rates, POST /api/pricing/calculate,
//            GET /api/orders, POST /api/orders
// Falls back to a local mock store when the backend is offline,
// so the UI always remains fully functional (Demo Mode badge).
// ============================================================

import { round2 } from '../utils/pricing.ts'
import { generateOrderId } from '../utils/orderId.ts'

// API base URL. Defaults to the Go backend directly (CORS-enabled).
// Override in production with VITE_API_BASE_URL, e.g. https://api.somsingphim.com/api
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const TIMEOUT_MS = 5000
const MOCK_STORAGE_KEY = 'ssp_orders_v1'

export const DEMO_MODE: { enabled: boolean } = { enabled: false }

export interface RatesResponse {
  THB: number
  LAK: number
}

export interface HealthResponse {
  ok: boolean
  status: string
  baseUrl: string
}

export interface RemoteCategory {
  id: number
  slug: string
  nameLo: string
  nameEn: string
  taglineLo?: string
  taglineEn?: string
  descriptionLo?: string
  descriptionEn?: string
  icon: string
  sortOrder: number
  isActive: boolean
}

export interface PublicProductOptionItem {
  id?: number
  productId?: number
  optionType: string
  label: string
  labelLo?: string
  labelEn?: string
  hintLo?: string
  hintEn?: string
  value: string
  materialSku?: string
  paperCode?: string
  addPrice?: number
  isDefault?: boolean
  extraCostRate?: number
}

export interface PublicProductDiscountTier {
  id?: number
  productId?: number
  minQuantity: number
  discountPercentage: number
}

export interface RemoteSpecGroup {
  id: string
  titleLo: string
  titleEn: string
  displayType: 'cards' | 'dropdown'
  groupType: string
  options: PublicProductOptionItem[]
}

export interface RemoteFeaturesConfig {
  hasCoverUpload?: boolean
  hasInnerUpload?: boolean
  hasSpineCalc?: boolean
  hasPreflightCheck?: boolean
  hasCustomDim?: boolean
}

import type { ProductInfoTab } from '../data/catalog'

export interface RemoteProduct {
  id: number
  categoryId?: number
  categorySlug?: string
  name: string
  nameLo?: string
  nameEn?: string
  slug: string
  category: string
  description?: string
  descriptionLo?: string
  descriptionEn?: string
  pricingModel?: string
  basePrice?: number
  unit?: string
  bestseller?: boolean
  specGroups?: RemoteSpecGroup[]
  featuresConfig?: RemoteFeaturesConfig
  features?: string[]
  thumbnailUrl?: string
  galleryUrls?: string[]
  infoTabs?: ProductInfoTab[]
  minQuantity?: number
  isOnDemand?: boolean
  leadTimeDays?: number
  isActive: boolean
  sortOrder?: number
  options?: PublicProductOptionItem[]
  discountTiers?: PublicProductDiscountTier[]
}

export interface TimelineEntry {
  status: string
  label: string
  at: number
}

export interface OrderSpecs {
  size?: string
  paper?: string
  finishing?: string
}

export interface Order {
  order_id: string
  order_number?: string
  id?: string
  customer_name: string
  phone?: string
  address?: string
  product_id?: string
  specs?: OrderSpecs
  quantity: number
  total_price: number
  currency: string
  status: string
  created_at?: string
  timeline?: TimelineEntry[]
  tracking_number?: string
  tracking?: string
  shipping_courier?: string
  shipping_courier_id?: string
  shipping_fee?: number
  internal_tracking_code?: string
  courier_name?: string
  pod_image_url?: string
  drive_link?: string
  proof_url?: string
  proof_approved_at?: string
  proof_rejected_at?: string
  proof_rejection_reason?: string
  is_permission_confirmed?: boolean
  special_notes?: string
  payment_slip_url?: string
}

export interface PricingPayload {
  quantity: number
  paper_sku?: string
  paper_type?: string
  paper_cost_per_unit?: number
  ink_coverage_percent?: number
  ink_cost_per_ml?: number
  lamination_type?: string
  lamination_cost?: number
  binding_type?: string
  binding_cost?: number
  labor_cost_per_hour?: number
  estimated_hours?: number
  markup_margin?: number
  target_currency?: string
  job_name?: string
  [key: string]: any
}

export interface PricingResult {
  job_name?: string
  quantity: number
  total_cost: number
  sale_price: number
  unit_price: number
  profit_margin: number
  currency: string
}

async function request<T = unknown>(path: string, { method = 'GET', body }: { method?: string; body?: unknown } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

function setDemo(on: boolean) {
  DEMO_MODE.enabled = on
}

// ---------- Mock stores ----------

function readLocalOrders(): Order[] {
  try {
    return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function writeLocalOrders(orders: Order[]) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(orders))
}

// Seed demo orders so the tracking page works out of the box.
function seedDemoOrders(): Order[] {
  const now = Date.now()
  return [
    {
      order_id: 'SSP-00001',
      customer_name: 'ທ່ານ ສົມໄຊ ໃຈດີ',
      phone: '020 55123456',
      product_id: 'album-classic',
      specs: { size: '8x8 ນິ້ວ', paper: 'Art Card 260g', finishing: 'ເຄືອບດ້ານ (Matte)' },
      quantity: 20,
      total_price: 617890.0,
      currency: 'LAK',
      status: 'PENDING_SLIP_CHECK',
      created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ໄດ້ຮັບອໍເດີແລ້ວ', at: now - 5 * 3600e3 },
      ],
    },
    {
      order_id: 'SSP-00002',
      customer_name: 'ທ່ານ ນາງ ນະພາ ພິມດີ',
      phone: '020 77889900',
      product_id: 'frame-acrylic-block',
      specs: { size: '5x7 ນິ້ວ', paper: 'ອາຄຣີລິກໃສ 20mm', finishing: 'ຂັດຂອບ Diamond' },
      quantity: 5,
      total_price: 485000.0,
      currency: 'LAK',
      status: 'PAYMENT_APPROVED',
      created_at: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ໄດ້ຮັບອໍເດີແລ້ວ', at: now - 26 * 3600e3 },
        { status: 'PAYMENT_APPROVED', label: 'ຢືນຢັນການຊຳລະເງິນແລ້ວ', at: now - 24 * 3600e3 },
      ],
    },
    {
      order_id: 'SSP-00003',
      customer_name: 'ຮ້ານຕົ້ນໄມ້ມິນິມອລ ວຽງຈັນ',
      phone: '020 22334455',
      product_id: 'sticker-pp-waterproof',
      specs: { size: 'ແຜ່ນ A3+', paper: 'PP ຂາວເງົາກັນນ້ຳ', finishing: 'ໄດຄັດ 50% ພ້ອມລອກ' },
      quantity: 50,
      total_price: 1250000.0,
      currency: 'LAK',
      status: 'IN_PRODUCTION',
      created_at: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ໄດ້ຮັບອໍເດີແລ້ວ', at: now - 72 * 3600e3 },
        { status: 'PAYMENT_APPROVED', label: 'ຢືນຢັນການຊຳລະເງິນແລ້ວ', at: now - 70 * 3600e3 },
        { status: 'IN_PRODUCTION', label: 'ກຳລັງດຳເນີນການພິມ', at: now - 48 * 3600e3 },
      ],
    },
    {
      order_id: 'SSP-00004',
      customer_name: 'ທ່ານ ນາງ ພິຊະຍາ ວົງສວຍ',
      phone: '020 99887766',
      product_id: 'card-gold-foil',
      specs: { size: '5x7 ນິ້ວ', paper: 'Art Card 350g', finishing: 'ປ້ຳຟອຍຄຳ (Gold Foil)' },
      quantity: 150,
      total_price: 2450000.0,
      currency: 'LAK',
      status: 'SHIPPED',
      tracking_number: 'AN-LAO-991283',
      shipping_courier: 'Anousith Express',
      created_at: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ໄດ້ຮັບອໍເດີແລ້ວ', at: now - 6 * 24 * 3600e3 },
        { status: 'PAYMENT_APPROVED', label: 'ຢືນຢັນການຊຳລະເງິນແລ້ວ', at: now - 6 * 24 * 3600e3 + 2 * 3600e3 },
        { status: 'IN_PRODUCTION', label: 'ກຳລັງດຳເນີນການພິມ', at: now - 5 * 24 * 3600e3 },
        { status: 'SHIPPED', label: 'ຈັດສົ່ງຮຽບຮ້ອຍແລ້ວ', at: now - 10 * 3600e3 },
      ],
    },
    {
      order_id: 'SSP-00005',
      customer_name: 'ຫ້ອງການ ບໍລິສັດ XYZ ລາວ',
      phone: '020 55667788',
      product_id: 'doc-catalog-staple',
      specs: { size: 'A4', paper: 'Art Paper 160g', finishing: 'ເຢັບມຸມມາດຕະຖານ' },
      quantity: 300,
      total_price: 3800000.0,
      currency: 'LAK',
      status: 'DELIVERED',
      tracking_number: 'HAL-VTE-882104',
      shipping_courier: 'HAL Logistics',
      created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ໄດ້ຮັບອໍເດີແລ້ວ', at: now - 10 * 24 * 3600e3 },
        { status: 'PAYMENT_APPROVED', label: 'ຢືນຢັນການຊຳລະເງິນແລ້ວ', at: now - 10 * 24 * 3600e3 + 3 * 3600e3 },
        { status: 'IN_PRODUCTION', label: 'ກຳລັງດຳເນີນການພິມ', at: now - 9 * 24 * 3600e3 },
        { status: 'SHIPPED', label: 'ຈັດສົ່ງຮຽບຮ້ອຍແລ້ວ', at: now - 3 * 24 * 3600e3 },
        { status: 'DELIVERED', label: 'ສິນຄ້າຮອດມືລູກຄ້າແລ້ວ', at: now - 20 * 3600e3 },
      ],
    },
  ]
}

// ---------- Public API ----------

// Ping the Go backend health endpoint to verify the live connection.
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const data = await request<{ status?: string }>('/health')
    setDemo(false)
    return { ok: true, status: data && data.status ? data.status : 'healthy', baseUrl: API_BASE }
  } catch {
    setDemo(true)
    return { ok: false, status: 'unreachable', baseUrl: API_BASE }
  }
}

export async function getRates(): Promise<RatesResponse> {
  try {
    const data = await request<{ THB?: { rate_to_lak?: number } }>('/rates')
    const thb = data && data.THB && data.THB.rate_to_lak
    if (typeof thb === 'number' && thb > 0) {
      setDemo(false)
      const res: RatesResponse = { THB: thb, LAK: 1 }
      try {
        localStorage.setItem('ssp_cached_rates', JSON.stringify(res))
      } catch {
        /* ignore */
      }
      return res
    }
    throw new Error('Invalid rates payload')
  } catch {
    setDemo(true)
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
  }
}

export async function calculatePrice(payload: PricingPayload): Promise<PricingResult> {
  try {
    const data = await request<PricingResult>('/pricing/calculate', { method: 'POST', body: payload })
    setDemo(false)
    return data
  } catch {
    setDemo(true)
    // Local fallback mirroring the backend math for parity.
    const qty = Math.max(1, payload.quantity)
    const paperCost = qty * (payload.paper_cost_per_unit || 0)
    const inkVolume = 0.007 * (payload.ink_coverage_percent || 0)
    const inkCost = qty * inkVolume * (payload.ink_cost_per_ml || 0)

    // Machine overhead (Depreciation + Maintenance Reserve)
    const machinePrice = (payload as any).machine_price || (payload as any).machine_price_lak || 0
    const expectedLife = (payload as any).target_total_pages || (payload as any).expected_life_pages || 0
    const deprPerSheet = expectedLife > 0 ? machinePrice / expectedLife : ((payload as any).machine_depreciation_rate || (payload as any).machine_depreciation_rate_lak || 0)
    const maintRate = (payload as any).maintenance_rate_percent !== undefined ? (payload as any).maintenance_rate_percent : 20
    const maintPerSheet = deprPerSheet * (maintRate / 100)
    const machineCost = qty * (deprPerSheet + maintPerSheet)

    const laminationCost =
      payload.lamination_type && payload.lamination_type !== 'none'
        ? qty * (payload.lamination_cost || 0)
        : 0
    const bindingCost =
      payload.binding_type && payload.binding_type !== 'none'
        ? qty * (payload.binding_cost || 0)
        : 0
    const laborCost = (payload.labor_cost_per_hour || 0) * (payload.estimated_hours || 0)
    const totalCost = paperCost + inkCost + machineCost + laminationCost + bindingCost + laborCost
    const salePrice = totalCost * (1 + (payload.markup_margin || 0))
    return {
      job_name: payload.job_name,
      quantity: qty,
      total_cost: round2(totalCost),
      sale_price: round2(salePrice),
      unit_price: round2(salePrice / qty),
      profit_margin: payload.markup_margin || 0,
      currency: payload.target_currency || 'LAK',
    }
  }
}

export const calculatePricing = calculatePrice;

export async function submitOrder(order: Order): Promise<Order> {
  const idempotencyKey = (order as any).idempotency_key || `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const orderWithKey = { ...order, idempotency_key: idempotencyKey }
  try {
    const data = await request<Partial<Order>>('/orders', { method: 'POST', body: orderWithKey })
    setDemo(false)
    return { ...orderWithKey, ...data, _live: true } as Order
  } catch {
    setDemo(true)
    const orderId = order.order_id || generateOrderId()
    const saved: Order = {
      ...orderWithKey,
      order_id: orderId,
      status: 'PENDING_SLIP_CHECK',
      created_at: new Date().toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ໄດ້ຮັບອໍເດີແລ້ວ', at: Date.now() },
      ],
    }
    const all = readLocalOrders()
    all.push(saved)
    writeLocalOrders(all)
    return saved
  }
}

export async function getOrders(): Promise<Order[]> {
  const local = readLocalOrders()
  try {
    const remote = await request<RawOrder[]>('/orders')
    setDemo(false)
    return remote.map((o) => normalizeRemoteOrder(o)).concat(local)
  } catch {
    setDemo(true)
    return seedDemoOrders().concat(local)
  }
}

export async function trackOrder(orderId?: string | number | null): Promise<Order | null> {
  const id = String(orderId || '').trim()
  if (!id) return null

  try {
    let raw: RawOrder | null = null
    try {
      raw = await request<RawOrder>(`/v1/orders/track?q=${encodeURIComponent(id)}`)
    } catch {
      raw = await request<RawOrder>(`/v1/orders/track/${encodeURIComponent(id)}`)
    }
    if (raw) {
      setDemo(false)
      return normalizeRemoteOrder(raw)
    }
  } catch (err: any) {
    // Check local store
    const localOrders = readLocalOrders()
    const match = localOrders.find(
      (o) =>
        o.order_id === id ||
        o.order_number === id ||
        o.phone === id ||
        String(o.id || '') === id ||
        String(o.order_id || '').toUpperCase() === id.toUpperCase()
    )
    if (match) return match

    // Check demo orders only in demo mode
    if (DEMO_MODE.enabled) {
      const demoMatch = seedDemoOrders().find(
        (o) =>
          o.order_id === id ||
          o.order_number === id ||
          o.phone === id ||
          String(o.id || '') === id ||
          String(o.order_id || '').toUpperCase() === id.toUpperCase()
      )
      if (demoMatch) return demoMatch
    }

    return null
  }
  return null
}

export async function fetchCatalogProducts(category?: string): Promise<RemoteProduct[]> {
  return fetchPublicProducts(category)
}

interface RawOrder {
  order_number?: string
  id?: string
  customer_name?: string
  customer_phone?: string
  items?: { specs?: OrderSpecs; quantity?: number }[]
  total_price?: number
  currency?: string
  status?: string
  created_at?: string
  timeline?: TimelineEntry[]
  tracking_number?: string
  tracking?: string
  shipping_courier?: string
  shipping_courier_id?: string
  shipping_fee?: number
  internal_tracking_code?: string
  courier_name?: string
  pod_image_url?: string
  drive_link?: string
  proof_url?: string
  proof_approved_at?: string
  proof_rejected_at?: string
  proof_rejection_reason?: string
  is_permission_confirmed?: boolean
  special_notes?: string
  payment_slip_url?: string
}

// Map backend order model (order_number, Status*) into frontend tracking shape.
function normalizeRemoteOrder(o: RawOrder): Order {
  const statusMap: Record<string, string> = {
    DRAFT: 'PENDING_SLIP_CHECK',
    QUOTATION: 'PENDING_SLIP_CHECK',
    PENDING_PAYMENT: 'PENDING_SLIP_CHECK',
    PENDING_SLIP_CHECK: 'PENDING_SLIP_CHECK',
    WAITING_DEPOSIT: 'PENDING_SLIP_CHECK',
    PAYMENT_APPROVED: 'PAYMENT_APPROVED',
    PAID_PREPRESS: 'PAYMENT_APPROVED',
    PREPRESS_CHECK: 'PREPRESS_CHECK',
    WAITING_APPROVAL: 'WAITING_APPROVAL',
    PROOF_REJECTED: 'PROOF_REJECTED',
    FILE_CONFIRMED: 'FILE_CONFIRMED',
    READY_TO_PRINT: 'READY_TO_PRINT',
    ORDER_CREATED: 'READY_TO_PRINT',
    IN_PRODUCTION: 'IN_PRODUCTION',
    POST_PRESS: 'POST_PRESS',
    FINISHING: 'POST_PRESS',
    SHIPPED: 'SHIPPED',
    READY_FOR_DELIVERY: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
  }
  return {
    order_id: o.order_number || o.id || '',
    order_number: o.order_number,
    customer_name: o.customer_name || '',
    phone: o.customer_phone,
    specs: (o.items && o.items[0] && o.items[0].specs) || {},
    quantity: o.items && o.items[0] ? o.items[0].quantity : 1,
    total_price: o.total_price || 0,
    currency: o.currency || 'LAK',
    status: (o.status && statusMap[o.status]) || o.status || 'PENDING_SLIP_CHECK',
    created_at: o.created_at,
    timeline: o.timeline || [],
    tracking_number: o.tracking_number || o.tracking,
    tracking: o.tracking || o.tracking_number,
    shipping_courier: o.shipping_courier || o.courier_name,
    shipping_courier_id: o.shipping_courier_id,
    shipping_fee: o.shipping_fee,
    internal_tracking_code: o.internal_tracking_code,
    courier_name: o.courier_name || o.shipping_courier,
    pod_image_url: o.pod_image_url,
    drive_link: o.drive_link,
    proof_url: o.proof_url,
    proof_approved_at: o.proof_approved_at,
    proof_rejected_at: o.proof_rejected_at,
    proof_rejection_reason: o.proof_rejection_reason,
    is_permission_confirmed: o.is_permission_confirmed,
    special_notes: o.special_notes,
    payment_slip_url: o.payment_slip_url,
  }
}

export async function fetchPublicCategories(): Promise<RemoteCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/public/categories?active=true`).catch(() => null)
    if (!res || !res.ok) return []
    const json = await res.json()
    if (Array.isArray(json)) return json
    if (json && Array.isArray(json.data)) return json.data
    return []
  } catch {
    return []
  }
}

export async function fetchPublicProducts(category?: string): Promise<RemoteProduct[]> {
  try {
    const qs = category ? `?category=${encodeURIComponent(category)}` : ''
    const res = await fetch(`${API_BASE}/v1/public/products${qs}`).catch(() => null)
    if (!res || !res.ok) return []
    const json = await res.json()
    if (Array.isArray(json)) return json
    if (json && Array.isArray(json.data)) return json.data
    return []
  } catch {
    return []
  }
}

export async function fetchPublicProductBySlug(slug: string): Promise<RemoteProduct | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/public/products/${encodeURIComponent(slug)}`).catch(() => null)
    if (!res || !res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch {
    return null
  }
}

export async function fetchLaoLocations(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/public/locations/provinces`).catch(() => null)
    if (!res || !res.ok) return []
    const json = await res.json()
    if (Array.isArray(json)) return json
    if (json && Array.isArray(json.data)) return json.data
    return []
  } catch {
    return []
  }
}

export async function uploadArtworkFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/v1/orders/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Upload failed')
  const json = await res.json()
  return json.url || `${API_BASE}/v1/orders/files/${file.name}`
}

export interface VerifySlipRequest {
  order_id: string
  qr_payload?: string
  slip_image?: string
  amount?: number
  trans_ref?: string
}

export interface VerifySlipResult {
  status: string
  message: string
  order_id: string
  new_status: string
  trans_ref?: string
  amount?: number
  verified_at?: string
}

export async function verifySlipPayment(payload: VerifySlipRequest): Promise<VerifySlipResult> {
  try {
    const res = await fetch(`${API_BASE}/v1/checkout/verify-slip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.message || `Slip verification failed with status ${res.status}`)
    }
    const json = await res.json()
    return json
  } catch (err: any) {
    if (DEMO_MODE.enabled || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('unreachable')) {
      return {
        status: 'success',
        message: 'Slip verified in demo mode',
        order_id: payload.order_id,
        new_status: 'PAID_PREPRESS',
        trans_ref: payload.trans_ref || `DEMO-SLIP-${Date.now()}`,
        amount: payload.amount,
        verified_at: new Date().toISOString(),
      }
    }
    throw err
  }
}

export async function approveDigitalProof(orderId: string, signatureName: string = 'Customer'): Promise<{ status: string; message: string; approved_at: string }> {
  try {
    const res = await fetch(`${API_BASE}/v1/orders/${encodeURIComponent(orderId)}/proof/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature_name: signatureName }),
    })
    if (!res.ok) {
      throw new Error(`Failed to approve proof with status ${res.status}`)
    }
    return await res.json()
  } catch (err: any) {
    if (DEMO_MODE.enabled || err.message?.includes('Failed to fetch')) {
      return {
        status: 'success',
        message: 'Proof approved in demo mode',
        approved_at: new Date().toISOString(),
      }
    }
    throw err
  }
}

export async function rejectDigitalProof(orderId: string, reason: string): Promise<{ status: string; message: string; rejected_at: string }> {
  try {
    const res = await fetch(`${API_BASE}/v1/orders/${encodeURIComponent(orderId)}/proof/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (!res.ok) {
      throw new Error(`Failed to reject proof with status ${res.status}`)
    }
    return await res.json()
  } catch (err: any) {
    if (DEMO_MODE.enabled || err.message?.includes('Failed to fetch')) {
      return {
        status: 'success',
        message: 'Proof rejection recorded in demo mode',
        rejected_at: new Date().toISOString(),
      }
    }
    throw err
  }
}

export async function fetchDigitalProof(orderId: string): Promise<{ order_id: string; proof_url?: string; is_approved: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/v1/orders/${encodeURIComponent(orderId)}/proof`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    return await res.json()
  } catch {
    return {
      order_id: orderId,
      is_approved: false,
    }
  }
}

export async function fetchCouriers(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/public/couriers`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
      return json.data
    }
    return []
  } catch {
    return []
  }
}

export async function fetchPaymentMethods(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/public/payment-methods`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
      return json.data
    }
    return []
  } catch {
    return []
  }
}

export interface DynamicPricingRequest {
  template_id: string
  quantity: number
  actual_coverage?: number
  width_mm?: number
  height_mm?: number
  grommets_count?: number
  lamination_type?: string
  edge_folding?: boolean
  selected_addons?: Record<string, any>
}

export interface AddonItemBreakdown {
  name: string
  type: string
  quantity: number
  unit_price: number
  total_cost: number
}

export interface DynamicPriceBreakdown {
  template_id: string
  template_name: string
  material_id: string
  material_name: string
  quantity: number
  min_order_quantity: number
  area_m2: number
  perimeter_m: number
  base_unit_price: number
  base_material_cost: number
  baseline_coverage_percent: number
  actual_coverage_percent: number
  coverage_delta_percent: number
  coverage_surcharge_multiplier: number
  coverage_surcharge: number
  addon_cost: number
  itemized_addons?: AddonItemBreakdown[]
  subtotal: number
  min_total_price: number
  min_price_applied: boolean
  final_price: number
  final_unit_price: number
}

export interface ProductPricingTemplateItem {
  id: string
  name: string
  material_id: string
  baseline_coverage_percent: number
  coverage_surcharge_multiplier: number
  min_order_quantity: number
  min_total_price: number
  addon_rates?: Record<string, any>
  is_active: boolean
}

export async function fetchPricingTemplates(): Promise<ProductPricingTemplateItem[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/pricing/templates`)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const json = await res.json()
    if (json.status === 'success' && Array.isArray(json.data)) {
      return json.data
    }
    return []
  } catch {
    return [
      {
        id: 'tpl_vinyl_outdoor',
        name: 'ไวนิล Outdoor Hi-Res 440g',
        material_id: 'mat_vinyl_440',
        baseline_coverage_percent: 15,
        coverage_surcharge_multiplier: 1.25,
        min_order_quantity: 1,
        min_total_price: 35000,
        addon_rates: {
          grommets_unit_price: 500,
          lamination_price_per_m2: 15000,
          folding_price_per_meter: 3000,
        },
        is_active: true,
      },
      {
        id: 'tpl_canvas_cotton',
        name: 'ผ้าใบแคนวาส Premium Cotton 380g',
        material_id: 'mat_canvas_380',
        baseline_coverage_percent: 20,
        coverage_surcharge_multiplier: 1.5,
        min_order_quantity: 1,
        min_total_price: 80000,
        addon_rates: {
          grommets_unit_price: 1000,
          lamination_price_per_m2: 25000,
          folding_price_per_meter: 5000,
        },
        is_active: true,
      },
      {
        id: 'tpl_pp_sticker',
        name: 'PP Sticker กันน้ำ + ไดคัท',
        material_id: 'mat_pp_sticker',
        baseline_coverage_percent: 15,
        coverage_surcharge_multiplier: 1.1,
        min_order_quantity: 2,
        min_total_price: 50000,
        addon_rates: {
          lamination_price_per_m2: 18000,
        },
        is_active: true,
      },
    ]
  }
}

export async function calculateDynamicPrice(req: DynamicPricingRequest): Promise<DynamicPriceBreakdown> {
  try {
    const res = await fetch(`${API_BASE}/v1/pricing/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      throw new Error(errJson.message || `Status ${res.status}`)
    }
    const json = await res.json()
    if (json.status === 'success' && json.data) {
      return json.data
    }
    throw new Error('Invalid calculation response format')
  } catch (err: any) {
    // Client-side fallback calculation for seamless offline / demo mode
    const qty = Math.max(1, req.quantity)
    const widthM = (req.width_mm || 1000) / 1000
    const heightM = (req.height_mm || 2000) / 1000
    const areaM2 = Math.round(widthM * heightM * 10000) / 10000
    const perimeterM = Math.round((widthM + heightM) * 2 * 10000) / 10000

    const baseUnitRate = 45000 // 45,000 LAK per m2 base
    const baseMaterialCost = Math.round(baseUnitRate * areaM2 * qty)
    const baseline = 15
    const actual = req.actual_coverage || 15
    let coverageSurcharge = 0
    let coverageDelta = 0
    if (actual > baseline) {
      coverageDelta = actual - baseline
      coverageSurcharge = Math.round(baseMaterialCost * ((actual - baseline) / baseline) * 1.25)
    }

    const itemizedAddons: AddonItemBreakdown[] = []
    let addonCost = 0

    if (req.grommets_count && req.grommets_count > 0) {
      const totalG = req.grommets_count * qty
      const gCost = totalG * 500
      itemizedAddons.push({
        name: `ตอกตาไก่ (${req.grommets_count} จุด/ชิ้น)`,
        type: 'grommets',
        quantity: totalG,
        unit_price: 500,
        total_cost: gCost,
      })
      addonCost += gCost
    }

    if (req.lamination_type && req.lamination_type !== 'NONE') {
      const lCost = Math.round(areaM2 * qty * 15000)
      itemizedAddons.push({
        name: `เคลือบผิว (${req.lamination_type})`,
        type: 'lamination',
        quantity: areaM2 * qty,
        unit_price: 15000,
        total_cost: lCost,
      })
      addonCost += lCost
    }

    if (req.edge_folding) {
      const fCost = Math.round(perimeterM * qty * 3000)
      itemizedAddons.push({
        name: 'พับขอบรอบด้าน',
        type: 'folding',
        quantity: perimeterM * qty,
        unit_price: 3000,
        total_cost: fCost,
      })
      addonCost += fCost
    }

    const subtotal = baseMaterialCost + coverageSurcharge + addonCost
    const minTotalPrice = 35000
    const minPriceApplied = subtotal < minTotalPrice
    const finalPrice = minPriceApplied ? minTotalPrice : subtotal

    return {
      template_id: req.template_id || 'demo_template',
      template_name: 'ไวนิล Outdoor Hi-Res (Simulation)',
      material_id: 'mat_default',
      material_name: 'ไวนิล 440g',
      quantity: qty,
      min_order_quantity: 1,
      area_m2: areaM2,
      perimeter_m: perimeterM,
      base_unit_price: Math.round(baseMaterialCost / qty),
      base_material_cost: baseMaterialCost,
      baseline_coverage_percent: baseline,
      actual_coverage_percent: actual,
      coverage_delta_percent: coverageDelta,
      coverage_surcharge_multiplier: 1.25,
      coverage_surcharge: coverageSurcharge,
      addon_cost: addonCost,
      itemized_addons: itemizedAddons,
      subtotal: subtotal,
      min_total_price: minTotalPrice,
      min_price_applied: minPriceApplied,
      final_price: finalPrice,
      final_unit_price: Math.round(finalPrice / qty),
    }
  }
}



