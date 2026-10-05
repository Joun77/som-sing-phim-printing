import { useEffect, useRef, useState } from 'react';
import { reviewPaymentSlip, uploadPaymentSlip, getPaymentHistory, getPaymentConfiguration, setPaymentPolicy, createPaymentRecord, reviewPaymentRecord, reversePaymentRecord, paymentDecimal, type PaymentSummary, type PaymentRecord } from '../api/paymentReview';

/** Pending and stale-order guards for real reception and details callers. */
export function usePaymentSlipReview(orderId: string) {
  const lock = useRef(false);
  const generation = useRef(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [legacyOpening, setLegacyOpening] = useState<Awaited<ReturnType<typeof getPaymentHistory>>['legacyOpening']>();
  const [historyError, setHistoryError] = useState('');
  const [configuration, setConfiguration] = useState<Awaited<ReturnType<typeof getPaymentConfiguration>> | null>(null);
  const keys = useRef(new Map<string, string>());
  const keyFor = (kind: string, payload: unknown) => {
    const fingerprint = JSON.stringify([orderId, kind, payload]);
    let key = keys.current.get(fingerprint);
    if (!key) { key = crypto.randomUUID(); keys.current.set(fingerprint, key); }
    return key;
  };
  const loadHistory = async () => {
    const current = generation.current;
    try {
      const history = await getPaymentHistory(orderId);
      if (current !== generation.current) return;
      setSummary(history.summary); setRecords(history.records); setLegacyOpening(history.legacyOpening); setHistoryError('');
      const config = await getPaymentConfiguration();
      if (current === generation.current) setConfiguration(config);
    } catch (err) { if (current === generation.current) setHistoryError(err instanceof Error ? err.message : 'ບໍ່ສາມາດໂຫຼດປະຫວັດການຊຳລະໄດ້'); }
  };
  useEffect(() => {
    generation.current++;
    lock.current = false;
    setPending(false);
    setLegacyOpening(undefined); setError(''); setSummary(null); setRecords([]); setConfiguration(null); setHistoryError('');
    if (orderId) void loadHistory();
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
  const operation = async <T extends { summary?: PaymentSummary; record?: PaymentRecord }>(run: () => Promise<T>) => {
    if (lock.current) return;
    lock.current = true; const current = generation.current; setPending(true); setError('');
    try {
      const result = await run(); if (current !== generation.current) return;
      if (result.summary) setSummary(result.summary);
      if (result.record) setRecords(previous => [result.record!, ...previous.filter(r => r.id !== result.record!.id)]);
      return result;
    } catch (err) { if (current === generation.current) setError(err instanceof Error ? err.message : 'ບໍ່ສາມາດບັນທຶກການຊຳລະໄດ້'); }
    finally { if (current === generation.current) { lock.current = false; setPending(false); } }
  };
  const changePolicy = (mode: 'OFF' | 'ON', percent = mode === 'OFF' ? '100.00' : '50.00') => operation(async () => {
    if (!summary) throw new Error('ກະລຸນາໂຫຼດຂໍ້ມູນການຊຳລະກ່ອນ');
    const payload = [mode, percent, summary.payment_revision];
    return { summary: await setPaymentPolicy(orderId, mode, percent, summary.payment_revision, keyFor('policy', payload)) };
  });
  const uploadSlip = (file: File) => operation(async () => {
    if (!summary) throw new Error('ກະລຸນາໂຫຼດຂໍ້ມູນຊຳລະກ່ອນ');
    return uploadPaymentSlip(orderId, file, summary.payment_revision, keyFor('upload-slip', [file.name, file.size, file.lastModified, summary.payment_revision]));
  });
  const requestReceipt = (amount: string, purpose: 'FULL' | 'DEPOSIT' | 'REMAINING', evidence: string, reference?: string) => operation(async () => {
    if (!summary || !configuration?.manual_qr_enabled || !configuration.payment_method_id) throw new Error('ຊ່ອງທາງຊຳລະຍັງບໍ່ພ້ອມ');
    const payload = { purpose, requested_amount_lak: paymentDecimal(amount), payment_method_id: configuration.payment_method_id, evidence_url: evidence, reference, expected_payment_revision: summary.payment_revision };
    return createPaymentRecord(orderId, payload, keyFor('request', payload));
  });
  const decideReceipt = (record: PaymentRecord, status: 'APPROVED' | 'REJECTED', actual: string, reason?: string) => operation(async () => {
    if (!summary) throw new Error('ກະລຸນາໂຫຼດຂໍ້ມູນການຊຳລະກ່ອນ');
    return reviewPaymentRecord(orderId, record.id, status, actual, summary.payment_revision, keyFor('review', [record.id, status, actual, summary.payment_revision, reason]), reason);
  });
  const reverseReceipt = (record: PaymentRecord, amount: string, reason: string) => operation(async () => {
    if (!summary) throw new Error('ກະລຸນາໂຫຼດຂໍ້ມູນການຊຳລະກ່ອນ');
    return reversePaymentRecord(orderId, record.id, amount, reason, summary.payment_revision, keyFor('reverse', [record.id, amount, reason, summary.payment_revision]));
  });
  return { uploadSlip, review, pending, error, summary, records, historyError, configuration, loadHistory, changePolicy, requestReceipt, decideReceipt, reverseReceipt, legacyOpening };
}
