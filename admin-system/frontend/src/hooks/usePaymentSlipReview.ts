import { useEffect, useRef, useState } from 'react';
import { reviewPaymentSlip } from '../api/paymentReview';

/** Pending and stale-order guards for real reception and details callers. */
export function usePaymentSlipReview(orderId: string) {
  const lock = useRef(false);
  const generation = useRef(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    generation.current++;
    lock.current = false;
    setPending(false);
    setError('');
    return () => { generation.current++; };
  }, [orderId]);
  const review = async (status: 'APPROVED' | 'REJECTED', reason?: string) => {
    if (lock.current) return;
    lock.current = true;
    const current = generation.current;
    setPending(true); setError('');
    try {
      const result = await reviewPaymentSlip(orderId, status, reason);
      return current === generation.current ? result : undefined;
    } catch (err) {
      if (current === generation.current) setError(err instanceof Error ? err.message : 'Payment review was not saved');
    } finally {
      if (current === generation.current) { lock.current = false; setPending(false); }
    }
  };
  return { review, pending, error };
}
