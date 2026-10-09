import { apiFetch } from './client';

export interface PaymentReviewResult {
  status: 'success';
  orderId: string;
  newStatus: 'PAID_PREPRESS' | 'PAYMENT_REJECTED';
}

/** Only a committed, matching server decision may update the payment UI. */
export async function reviewPaymentSlip(orderId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string): Promise<PaymentReviewResult> {
  if (!orderId.trim()) throw new Error('Order ID is required for payment review');
  const response = await apiFetch<Response>('/api/v1/finance/verify-slip', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, status, rejection_reason: rejectionReason }),
  });
  if (!response.ok) throw new Error(`Payment review was not saved (HTTP ${response.status})`);
  const result: unknown = await response.json();
  const expected = status === 'APPROVED' ? 'PAID_PREPRESS' : 'PAYMENT_REJECTED';
  if (!result || typeof result !== 'object' || !('status' in result) || result.status !== 'success' || !('orderId' in result) || result.orderId !== orderId || !('newStatus' in result) || result.newStatus !== expected) {
    throw new Error('Payment review confirmation is invalid; refresh the order before retrying');
  }
  return result as PaymentReviewResult;
}

export interface PaymentSummary {
  order_id: string; deposit_mode: 'OFF' | 'ON' | null; deposit_target_percent: string; deposit_target_amount_lak: string;
  payment_revision: number; payment_status: 'UNPAID' | 'PARTIAL' | 'PAID'; received_net_lak: string; remaining_lak: string; total_lak: string; legacy_opening_received_lak: string;
}
export interface PaymentRecord {
  id: string; order_id: string; record_kind: 'RECEIPT' | 'REVERSAL'; state: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  requested_amount_lak: string; actual_received_amount_lak: string | null; evidence_url: string; reversal_of: string | null; reason: string | null;
  purpose: string; reference: string | null; created_at: string;
  payment_method_id?: string | null;
  method?: string | null;
}
export function paymentDecimal(value: string | number): string {
  const text = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('ຈຳນວນເງິນບໍ່ຖືກຕ້ອງ');
  const [whole, fraction = ''] = text.split('.');
  return `${BigInt(whole)}.${fraction.padEnd(2, '0')}`;
}
export function percentageTarget(outstanding: string | number, percent: string | number): string {
  const cents = BigInt(paymentDecimal(outstanding).replace('.', ''));
  const hundredths = BigInt(paymentDecimal(percent).replace('.', ''));
  if (hundredths <= 0n || hundredths > 10000n) throw new Error('ເປີເຊັນບໍ່ຖືກຕ້ອງ');
  const amount = (cents * hundredths + 5000n) / 10000n;
  return `${amount / 100n}.${String(amount % 100n).padStart(2, '0')}`;
}
export function confirmedPaymentSummary(value: unknown, orderId: string): PaymentSummary {
  const s = value as PaymentSummary;
  if (!s || s.order_id !== orderId || !['OFF','ON',null].includes(s.deposit_mode) || !Number.isInteger(s.payment_revision) || s.payment_revision < 0 || !['UNPAID','PARTIAL','PAID'].includes(s.payment_status)) throw new Error('ຂໍ້ມູນການຊຳລະບໍ່ກົງກັບອໍເດີ');
  for (const key of ['deposit_target_percent','deposit_target_amount_lak','received_net_lak','remaining_lak','total_lak','legacy_opening_received_lak'] as const) {
    if (typeof s[key] !== 'string' || !/^\d+\.\d{2}$/.test(s[key])) throw new Error('ຂໍ້ມູນຈຳນວນເງິນບໍ່ຖືກຕ້ອງ');
  }
  const cents = (v: string) => BigInt(v.replace('.', ''));
  if (cents(s.received_net_lak) + cents(s.remaining_lak) !== cents(s.total_lak)) throw new Error('ຍອດຊຳລະ ແລະ ຍອດຄ້າງບໍ່ກົງກັນ');
  const received = cents(s.received_net_lak), remaining = cents(s.remaining_lak), total = cents(s.total_lak);
  if (received > total || cents(s.legacy_opening_received_lak) > received ||
      (s.payment_status === 'UNPAID' && received !== 0n) ||
      (s.payment_status === 'PARTIAL' && (received === 0n || remaining === 0n)) ||
      (s.payment_status === 'PAID' && remaining !== 0n)) throw new Error('ສະຖານະຊຳລະບໍ່ກົງກັບຍອດເງິນ');
  return s;
}
async function paymentRequest(path: string, method?: string, payload?: unknown, key?: string) {
  const res = await apiFetch(path, { ...(method ? { method, body: JSON.stringify(payload) } : {}), ...(key ? { headers: { 'Idempotency-Key': key } } : {}) });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.status !== 'success' || (method && body.committed !== true)) throw new Error(body?.message || `ບໍ່ສາມາດຢືນຢັນການບັນທຶກໄດ້ (${res.status})`);
  return body;
}
export async function getPaymentHistory(orderId: string) {
  const body = await paymentRequest(`/api/v1/orders/${encodeURIComponent(orderId)}/payment-records`);
  const summary = confirmedPaymentSummary(body.data?.summary, orderId);
  if (!Array.isArray(body.data.records) || !body.data.records.every((r: PaymentRecord) => r.id && r.order_id === orderId && ['PENDING','CONFIRMED','REJECTED'].includes(r.state))) throw new Error('ປະຫວັດການຊຳລະບໍ່ຖືກຕ້ອງ');
  const opening = body.data.legacy_opening;
  if (Number(summary.legacy_opening_received_lak) > 0 && (!opening || opening.provenance !== 'UNKNOWN' || opening.reversible !== false || opening.received_lak !== summary.legacy_opening_received_lak)) throw new Error('ຂໍ້ມູນຍອດຊຳລະເດີມບໍ່ຖືກຕ້ອງ');
  return { records: body.data.records as PaymentRecord[], summary, legacyOpening: opening as { provenance: 'UNKNOWN'; received_lak: string; captured_at: string | null; reversible: false } | undefined };
}
export async function setPaymentPolicy(orderId: string, mode: 'OFF' | 'ON', percent: string, revision: number, key: string) {
  const body = await paymentRequest(`/api/v1/orders/${encodeURIComponent(orderId)}/payment-policy`, 'PUT', { deposit_mode: mode, deposit_target_percent: paymentDecimal(percent), expected_payment_revision: revision }, key);
  return confirmedPaymentSummary(body.data, orderId);
}
export async function createPaymentRecord(orderId: string, payload: { purpose: 'FULL' | 'DEPOSIT' | 'REMAINING'; requested_amount_lak: string; payment_method_id: string; evidence_url: string; expected_payment_revision: number; reference?: string; requested_percent?: string }, key: string) {
  const body = await paymentRequest(`/api/v1/orders/${encodeURIComponent(orderId)}/payment-records`, 'POST', { ...payload, channel: 'MANUAL_QR', currency: 'LAK' }, key);
  const summary = confirmedPaymentSummary(body.data?.summary, orderId);
  const record = body.data?.record as PaymentRecord;
  if (!record?.id || record.order_id !== orderId || record.state !== 'PENDING') throw new Error('ຍັງບໍ່ຢືນຢັນຄຳຂໍຊຳລະ');
  return { record, summary };
}
export async function reviewPaymentRecord(orderId: string, recordId: string, status: 'APPROVED' | 'REJECTED', actual: string, revision: number, key: string, reason?: string) {
  const body = await paymentRequest('/api/v1/finance/verify-slip', 'POST', { order_id: orderId, payment_record_id: recordId, status, actual_received_amount_lak: paymentDecimal(actual), expected_payment_revision: revision, rejection_reason: reason }, key);
  const summary = confirmedPaymentSummary(body.summary, orderId);
  if (body.orderId !== orderId || body.record?.id !== recordId || body.record.order_id !== orderId || body.record.state !== (status === 'APPROVED' ? 'CONFIRMED' : 'REJECTED')) throw new Error('ຜົນກວດສະລິບບໍ່ກົງກັບຄຳຂໍ');
  return { record: body.record as PaymentRecord, summary, productionStatus: body.newStatus as string };
}
export async function reversePaymentRecord(orderId: string, recordId: string, amount: string, reason: string, revision: number, key: string) {
  const body = await paymentRequest(`/api/v1/payment-records/${encodeURIComponent(recordId)}/reversals`, 'POST', { amount_lak: paymentDecimal(amount), reason, expected_payment_revision: revision }, key);
  const summary = confirmedPaymentSummary(body.data?.summary, orderId);
  if (body.data?.original_record_id !== recordId || body.data.record?.reversal_of !== recordId || body.data.record?.record_kind !== 'REVERSAL') throw new Error('ຜົນຍ້ອນການຊຳລະບໍ່ກົງກັນ');
  return { record: body.data.record as PaymentRecord, summary };
}
export async function getPaymentConfiguration() {
  const body = await paymentRequest('/api/v1/finance/payment-config');
  const config = body.data;
  if (!config || typeof config.manual_qr_enabled !== 'boolean' || (config.manual_qr_enabled && (typeof config.payment_method_id !== 'string' || !config.payment_method_id)) || config.portal_enabled !== false || config.gateway_enabled !== false || !Number.isInteger(config.revision)) throw new Error('ການຕັ້ງຄ່າຊຳລະບໍ່ຖືກຕ້ອງ');
  return config as { manual_qr_enabled: boolean; payment_method_id: string | null; portal_enabled: false; gateway_enabled: false; revision: number };
}


export async function setPaymentConfiguration(manual: boolean, methodId: string | null, revision: number, key: string) {
  if (manual && !methodId) throw new Error('ກະລຸນາເລືອກບັນຊີຮັບເງິນ');
  const body = await paymentRequest('/api/v1/finance/payment-config', 'PUT', { manual_qr_enabled: manual, payment_method_id: methodId, expected_revision: revision }, key);
  const config = body.data;
  if (!config || config.manual_qr_enabled !== manual || config.payment_method_id !== methodId || config.portal_enabled !== false || config.gateway_enabled !== false || !Number.isInteger(config.revision) || config.revision <= revision) throw new Error('ຜົນບັນທຶກການຕັ້ງຄ່າບໍ່ກົງກັນ');
  return config as Awaited<ReturnType<typeof getPaymentConfiguration>>;
}


export async function uploadPaymentSlip(orderId: string, file: File, revision: number, key: string) {
  const data = new FormData();
  data.set('file', file); data.set('order_no', orderId); data.set('file_type', 'payment_slip');
  data.set('expected_payment_revision', String(revision));
  const response = await apiFetch('/api/v1/orders/upload', { method: 'POST', headers: { 'Idempotency-Key': key }, body: data });
  const body = await response.json().catch(() => null);
  const asset = body?.data;
  if (!response.ok || body?.status !== 'success' || body.committed !== true || asset?.order_id !== orderId ||
      typeof asset.asset_id !== 'string' || !asset.asset_id || typeof asset.file_name !== 'string' ||
      typeof asset.file_url !== 'string' || !asset.file_url.startsWith('/api/v1/orders/files/') ||
      !['application/pdf','image/png','image/jpeg'].includes(asset.mime_type) || asset.size !== file.size) {
    throw new Error(body?.message || body?.error || 'ບໍ່ສາມາດຢືນຢັນການບັນທຶກສະລິບໄດ້');
  }
  const summary = confirmedPaymentSummary(asset.summary, orderId);
  if (summary.payment_revision <= revision) throw new Error('ສະລິບບໍ່ມີເວີຊັນຢືນຢັນໃໝ່');
  return { ...asset, summary };
}


export async function correctOrderTotal(orderId: string, sourceId: string, sourceVersion: string, total: string, reason: string, revision: number, key: string) {
  const body = await paymentRequest(`/api/v1/orders/${encodeURIComponent(orderId)}`, 'PUT', { total_price: paymentDecimal(total), reason, expected_payment_revision: revision, source_quotation_id: sourceId, source_quotation_updated_at: sourceVersion }, key);
  const review = body.price_review;
  if (review?.source !== 'approved_quotation' || review.source_quotation_id !== sourceId || review.source_quotation_updated_at !== sourceVersion || review.target_order_id !== orderId || !review.approval_audit_id || !review.commercial_fingerprint || review.total_lak !== paymentDecimal(total)) throw new Error('ບໍ່ສາມາດຢືນຢັນແຫຼ່ງລາຄາໄດ້');
  const summary = confirmedPaymentSummary(body.data, orderId);
  if (summary.total_lak !== paymentDecimal(total) || summary.payment_revision <= revision ||
      !['approval_audit_id','commercial_fingerprint','customer_id','reviewer_id'].every(field => typeof review[field] === 'string' && review[field].trim()) ||
      typeof review.previous_total_lak !== 'string' || !/^\d+\.\d{2}$/.test(review.previous_total_lak) || review.reason !== reason) throw new Error('ຜົນປັບລາຄາບໍ່ກົງກັບຄຳຂໍ');
  return { summary, priceReview: review };
}
