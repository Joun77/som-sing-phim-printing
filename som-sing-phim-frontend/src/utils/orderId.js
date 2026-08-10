// ============================================================
// Order ID generation + helpers
// ============================================================

export function generateOrderId() {
  const num = String(Math.floor(10000 + Math.random() * 90000))
  return `SSP-${num}`
}

export function generateTrackingNumber(courierId) {
  const digits = String(Math.floor(1000000000000 + Math.random() * 8999999999999))
  const prefix = (courierId || 'FL').toUpperCase().slice(0, 2).replace(/[^A-Z]/g, '')
  return `${prefix || 'SS'}${digits}`
}
