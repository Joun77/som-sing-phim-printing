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
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
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
  drive_link?: string
  is_permission_confirmed?: boolean
  special_notes?: string
  payment_slip_url?: string
}

export interface PricingPayload {
  quantity: number
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
      customer_name: 'คุณสมชาย ใจดี',
      phone: '0812345678',
      product_id: 'album-classic',
      specs: { size: '4x6 นิ้ว', paper: 'กระดาษอาร์ตการ์ด 300g', finishing: 'เคลือบด้าน (Matte)' },
      quantity: 20,
      total_price: 980.0,
      currency: 'THB',
      status: 'PENDING_SLIP_CHECK',
      created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ได้รับออเดอร์แล้ว', at: now - 5 * 3600e3 },
      ],
    },
    {
      order_id: 'SSP-00002',
      customer_name: 'คุณนภา พิมพ์ดี',
      phone: '0898765432',
      product_id: 'acrylic-frame',
      specs: { size: '8x10 นิ้ว', paper: 'อะคริลิกใส 3 มม.', finishing: 'ขอบตัดมุมทอง' },
      quantity: 5,
      total_price: 1450.0,
      currency: 'THB',
      status: 'PAYMENT_APPROVED',
      created_at: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ได้รับออเดอร์แล้ว', at: now - 26 * 3600e3 },
        { status: 'PAYMENT_APPROVED', label: 'ยืนยันการชำระเงินแล้ว', at: now - 24 * 3600e3 },
      ],
    },
    {
      order_id: 'SSP-00003',
      customer_name: 'ร้านต้นไม้มินิมอล',
      phone: '0623456789',
      product_id: 'sticker-diecut',
      specs: { size: 'ขนาด M (6x8 ซม.)', paper: 'สติ๊กเกอร์ PP กันน้ำ', finishing: 'เคลือบเงา (Glossy)' },
      quantity: 200,
      total_price: 4200.0,
      currency: 'THB',
      status: 'IN_PRODUCTION',
      created_at: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ได้รับออเดอร์แล้ว', at: now - 72 * 3600e3 },
        { status: 'PAYMENT_APPROVED', label: 'ยืนยันการชำระเงินแล้ว', at: now - 70 * 3600e3 },
        { status: 'IN_PRODUCTION', label: 'กำลังดำเนินการพิมพ์ / ขึ้นงาน', at: now - 48 * 3600e3 },
      ],
    },
    {
      order_id: 'SSP-00004',
      customer_name: 'คุณพิชญา วงศ์สวย',
      phone: '0611112222',
      product_id: 'wedding-card',
      specs: { size: 'การ์ด A6', paper: 'อาร์ตการ์ด 350g', finishing: 'ปั๊มเคทอง (Foil Gold)' },
      quantity: 150,
      total_price: 7950.0,
      currency: 'THB',
      status: 'SHIPPED',
      tracking_number: 'FL9E8123456789',
      shipping_courier: 'Flash Express',
      created_at: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ได้รับออเดอร์แล้ว', at: now - 6 * 24 * 3600e3 },
        { status: 'PAYMENT_APPROVED', label: 'ยืนยันการชำระเงินแล้ว', at: now - 6 * 24 * 3600e3 + 2 * 3600e3 },
        { status: 'IN_PRODUCTION', label: 'กำลังดำเนินการพิมพ์ / ขึ้นงาน', at: now - 5 * 24 * 3600e3 },
        { status: 'SHIPPED', label: 'จัดส่งเรียบร้อยแล้ว', at: now - 10 * 3600e3 },
      ],
    },
    {
      order_id: 'SSP-00005',
      customer_name: 'สำนักงาน XYZ',
      phone: '0644443333',
      product_id: 'booklet',
      specs: { size: 'A5 (5.8x8.3 นิ้ว)', paper: 'กระดาษอาร์ตมัน 120g', finishing: 'เย็บมุม / เย็บกี่' },
      quantity: 300,
      total_price: 9800.0,
      currency: 'THB',
      status: 'DELIVERED',
      tracking_number: 'JTK9012345678',
      shipping_courier: 'J&T Express',
      created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ได้รับออเดอร์แล้ว', at: now - 10 * 24 * 3600e3 },
        { status: 'PAYMENT_APPROVED', label: 'ยืนยันการชำระเงินแล้ว', at: now - 10 * 24 * 3600e3 + 3 * 3600e3 },
        { status: 'IN_PRODUCTION', label: 'กำลังดำเนินการพิมพ์ / ขึ้นงาน', at: now - 9 * 24 * 3600e3 },
        { status: 'SHIPPED', label: 'จัดส่งเรียบร้อยแล้ว', at: now - 3 * 24 * 3600e3 },
        { status: 'DELIVERED', label: 'ถึงมือผู้รับแล้ว', at: now - 20 * 3600e3 },
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
      return { THB: thb, LAK: 1 }
    }
    throw new Error('Invalid rates payload')
  } catch {
    setDemo(true)
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
    const qty = payload.quantity
    const paperCost = qty * (payload.paper_cost_per_unit || 0)
    const inkVolume = 0.007 * (payload.ink_coverage_percent || 0)
    const inkCost = qty * inkVolume * (payload.ink_cost_per_ml || 0)
    const laminationCost =
      payload.lamination_type && payload.lamination_type !== 'none'
        ? qty * (payload.lamination_cost || 0)
        : 0
    const bindingCost =
      payload.binding_type && payload.binding_type !== 'none'
        ? qty * (payload.binding_cost || 0)
        : 0
    const laborCost = (payload.labor_cost_per_hour || 0) * (payload.estimated_hours || 0)
    const totalCost = paperCost + inkCost + laminationCost + bindingCost + laborCost
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

export async function submitOrder(order: Order): Promise<Order> {
  try {
    const data = await request<Partial<Order>>('/orders', { method: 'POST', body: order })
    setDemo(false)
    return { ...order, ...data, _live: true } as Order
  } catch {
    setDemo(true)
    const orderId = order.order_id || generateOrderId()
    const saved: Order = {
      ...order,
      order_id: orderId,
      status: 'PENDING_SLIP_CHECK',
      created_at: new Date().toISOString(),
      timeline: [
        { status: 'PENDING_SLIP_CHECK', label: 'ได้รับออเดอร์แล้ว', at: Date.now() },
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
  const orders = await getOrders()
  const match =
    orders.find(
      (o) =>
        o.order_id === id ||
        o.order_number === id ||
        String(o.id || '') === id ||
        String(o.order_id || '').toUpperCase() === id.toUpperCase()
    ) || null
  return match
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
}

// Map backend order model (order_number, Status*) into frontend tracking shape.
function normalizeRemoteOrder(o: RawOrder): Order {
  const statusMap: Record<string, string> = {
    DRAFT: 'PENDING_SLIP_CHECK',
    WAITING_DEPOSIT: 'PENDING_SLIP_CHECK',
    PREPRESS_CHECK: 'PENDING_SLIP_CHECK',
    WAITING_APPROVAL: 'PAYMENT_APPROVED',
    READY_TO_PRINT: 'PAYMENT_APPROVED',
    IN_PRODUCTION: 'IN_PRODUCTION',
    COMPLETED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
  }
  return {
    order_id: o.order_number || o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    phone: o.customer_phone,
    specs: (o.items && o.items[0] && o.items[0].specs) || {},
    quantity: o.items && o.items[0] ? o.items[0].quantity : 1,
    total_price: o.total_price,
    currency: o.currency || 'LAK',
    status: statusMap[o.status] || 'PENDING_SLIP_CHECK',
    created_at: o.created_at,
    timeline: o.timeline || [],
  }
}
