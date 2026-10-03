export interface ConfirmedConversionOrder extends Record<string, unknown> {
  id: string;
  total_amount_lak: number;
  deposit_lak: number;
  remaining_lak: number;
  status: string;
  overall_status: string;
  items: Record<string, unknown>[];
}

/** Validate authoritative create/readback data; never fill money/items from the quote. */
export function confirmedConversionOrder(value: unknown): ConfirmedConversionOrder {
  if (!value || typeof value !== 'object') throw new Error('Order reconciliation requires a server response');
  const raw = value as Record<string, unknown>;
  const record = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<string, unknown>;
  const status = record.overall_status ?? record.status;
  if (typeof record.id !== 'string' || !record.id.trim() || typeof status !== 'string' || !status || (record.status && record.overall_status && record.status !== record.overall_status)) throw new Error('Order reconciliation requires a matching server identity/status');
  for (const field of ['total_amount_lak', 'deposit_lak', 'remaining_lak', 'total_cost']) {
    if (typeof record[field] !== 'number' || !Number.isFinite(record[field]) || record[field] < 0) throw new Error(`Order reconciliation requires authoritative ${field}`);
  }
  if (Math.abs(Number(record.remaining_lak) - Math.max(0, Number(record.total_amount_lak) - Number(record.deposit_lak))) > 0.01) throw new Error('Conflicting authoritative balance');
  for (const [alias, canonical] of [['total_price', 'total_amount_lak'], ['deposit_amount', 'deposit_lak']]) {
    if (record[alias] !== undefined && record[alias] !== record[canonical]) throw new Error('Order reconciliation returned conflicting money aliases');
  }
  if (!Array.isArray(record.items) || !record.items.length || !record.items.every(item => item && typeof item === 'object' && typeof item.id === 'string' && item.id && typeof item.quantity === 'number' && item.quantity > 0 && Number.isInteger(item.quantity) && typeof item.unit_cost_lak === 'number' && Number.isFinite(item.unit_cost_lak) && item.unit_cost_lak >= 0 && typeof item.unit_price_lak === 'number' && Number.isFinite(item.unit_price_lak) && item.unit_price_lak >= 0 && typeof item.total_price_lak === 'number' && Number.isFinite(item.total_price_lak) && item.total_price_lak >= 0)) throw new Error('Order reconciliation requires authoritative server items');
  return structuredClone({ ...record, status, overall_status: status }) as ConfirmedConversionOrder;
}

/** Server aliases always override stale cached financial/editor aliases, including zero. */
export function normalizeSavedQuotation(record: Record<string, unknown>) {
  const snapshot = record.commercial_snapshot as Record<string, unknown> | undefined;
  const metadata = snapshot?.metadata as Record<string, unknown> | undefined;
  const conversion = record.conversion as Record<string, unknown> | undefined;
  return {
    ...structuredClone(record),
    quotationNumber: record.quotation_no,
    customerName: record.customer_name,
    customerPhone: record.customer_phone, phone: record.customer_phone,
    customerAddress: record.customer_address,
    grandTotal: record.total_selling_price, totalCost: record.total_cost,
    profitMargin: record.overall_profit_percent, discountPercent: record.discount_percent,
    setupFee: record.setup_fee, packagingCost: record.packaging_cost,
    shippingFee: record.shipping_fee, expiresAt: record.expiry_date,
    updatedAt: record.updated_at,
    ...(snapshot ? { subtotal: snapshot.discounted_subtotal_lak, baseSellingPrice: snapshot.base_selling_price_lak, discountAmount: snapshot.discount_amount_lak, taxAmount: snapshot.tax_amount_lak,
      taxEnabled: metadata?.tax_enabled, taxRate: metadata?.tax_rate, taxMode: metadata?.tax_mode, shippingMethod: metadata?.shipping_method } : {}),
    convertedOrderId: conversion?.order_id,
    ...(conversion ? { pendingConversionOrderId: undefined, pendingConversionStatus: undefined } : {}),
    items: Array.isArray(record.items) ? record.items.map(value => {
      const item = value as Record<string, unknown>;
      return { ...item, unitPrice: item.unit_price_lak ?? item.unitPrice, subtotal: item.total_price_lak ?? item.subtotal, unitCost: item.unit_cost_lak ?? item.unitCost };
    }) : [],
  };
}

export function confirmedSavedQuotation(value: unknown, expectedId: string) {
  if (!value || typeof value !== 'object') throw new Error('Missing saved quotation confirmation');
  const record = value as Record<string, unknown>;
  if (record.committed !== true || record.id !== expectedId || typeof record.updated_at !== 'string' || !record.updated_at || typeof record.status !== 'string') throw new Error('Uncommitted or mismatched saved quotation');
  for (const field of ['total_cost', 'total_selling_price']) {
    if (typeof record[field] !== 'number' || !Number.isFinite(record[field]) || record[field] < 0) throw new Error('Missing canonical saved quotation money');
  }
  if (!Array.isArray(record.items) || !record.items.length || !record.commercial_snapshot) throw new Error('Missing saved quotation snapshot');
  const snapshot = record.commercial_snapshot as Record<string, unknown>;
  if (snapshot.version !== 1 || snapshot.currency !== 'LAK') throw new Error('Unsupported saved quotation snapshot');
  for (const field of ['total_cost_lak', 'final_total_lak', 'discounted_subtotal_lak', 'tax_amount_lak', 'shipping_fee_lak', 'setup_fee_lak', 'packaging_cost_lak']) {
    if (typeof snapshot[field] !== 'number' || !Number.isFinite(snapshot[field]) || snapshot[field] < 0) throw new Error('Incomplete saved quotation snapshot');
  }
  for (const [root, field] of [['total_cost', 'total_cost_lak'], ['total_selling_price', 'final_total_lak'], ['shipping_fee', 'shipping_fee_lak'], ['setup_fee', 'setup_fee_lak'], ['packaging_cost', 'packaging_cost_lak']]) {
    if (record[root] !== snapshot[field]) throw new Error('Conflicting saved quotation snapshot');
  }
  if (Math.abs(Number(snapshot.final_total_lak) - Number(snapshot.discounted_subtotal_lak) - Number(snapshot.tax_amount_lak) - Number(snapshot.shipping_fee_lak)) > 0.01 || Number(snapshot.final_total_lak) <= 0) throw new Error('Conflicting saved quotation adjustments');
  return normalizeSavedQuotation(record);
}

export function confirmedSavedConversion(value: unknown, quotationId: string) {
  if (!value || typeof value !== 'object') throw new Error('Missing conversion confirmation');
  const envelope = value as Record<string, unknown>;
  const order = confirmedConversionOrder(envelope.data);
  const key = `quotation-conversion:${quotationId}`;
  if (envelope.status !== 'success' || envelope.committed !== true || envelope.quotation_id !== quotationId || envelope.quotation_status !== 'CONVERTED' || envelope.idempotency_key !== key || order.idempotency_key !== key || envelope.order_id !== order.id || (envelope.orderId !== undefined && envelope.orderId !== order.id) || envelope.order_number !== order.order_no || (envelope.orderNumber !== undefined && envelope.orderNumber !== order.order_no) || typeof envelope.source_quotation_updated_at !== 'string' || !envelope.source_quotation_updated_at || typeof envelope.replayed !== 'boolean' || typeof envelope.approval_required !== 'boolean') throw new Error('Uncommitted or mismatched quotation conversion');
  if (envelope.replayed === false && (order.deposit_lak !== 0 || order.remaining_lak !== order.total_amount_lak)) throw new Error('New conversion cannot fabricate a receipt');
  return { envelope, order };
}
