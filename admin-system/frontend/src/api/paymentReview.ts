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
