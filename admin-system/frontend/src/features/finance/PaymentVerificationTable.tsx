import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Eye, DollarSign, ShieldAlert, RefreshCw } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { apiFetch } from '../../api/client';
import { reviewPaymentSlip, reviewPaymentRecord } from '../../api/paymentReview';
import ArtworkThumbnail from '../../components/common/ArtworkThumbnail';

interface PendingSlipOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  paymentSlipUrl: string;
  createdAt: string;
  paymentRecordId?: string;
  payment_record_id?: string;
  expectedPaymentRevision?: number;
  expected_payment_revision?: number;
  requestedAmountLak?: string;
  requested_amount_lak?: string;
}

const translatePaymentError = (err: unknown): string => {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('LEGACY_PARTIAL_REQUIRES_RECEIPT') || msg.includes('409')) {
    return 'ລາຍການນີ້ມີຍອດຊຳລະບາງສ່ວນແລ້ວ ກະລຸນາກວດສອບຜ່ານໃບຮັບເງິນສະເພາະ';
  }
  if (msg.includes('PAYMENT_CHANNEL_DISABLED')) {
    return 'ຊ່ອງທາງການຊຳລະເງິນຖືກປິດໃຊ້ງານ';
  }
  if (msg.includes('PAYMENT_ALREADY_DECIDED')) {
    return 'ລາຍການນີ້ໄດ້ຮັບການກວດສອບແລ້ວ';
  }
  if (msg.includes('REVISION_MISMATCH')) {
    return 'ຂໍ້ມູນການຊຳລະມີການປ່ຽນແປງ ກະລຸນາໂຫຼດຄືນໃໝ່';
  }
  if (msg.includes('Payment review was not saved')) {
    return 'ບໍ່ສາມາດບັນທຶກການກວດສອບສະລິບໄດ້';
  }
  if (msg.includes('Payment list unavailable')) {
    return 'ບໍ່ສາມາດດຶງລາຍການສະລິບໄດ້';
  }
  return msg || 'ການກວດສອບສະລິບບໍ່ສຳເລັດ';
};

interface PaymentVerificationTableProps {
  onCountChange?: (count: number) => void;
}

export const PaymentVerificationTable: React.FC<PaymentVerificationTableProps> = ({ onCountChange }) => {
  const { refreshData } = useApp();
  const [selectedSlip, setSelectedSlip] = useState<PendingSlipOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [slips, setSlips] = useState<PendingSlipOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');

  const reviewLock = useRef(false);
  const loadGeneration = useRef(0);

  const fetchPendingSlips = async () => {
    if (reviewLock.current) return;
    const generation = ++loadGeneration.current;
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<Response>('/api/v1/finance/pending-slips');
      if (!res.ok) throw new Error(`ບໍ່ສາມາດໂຫຼດລາຍການສະລິບໄດ້ (HTTP ${res.status})`);
      const data: unknown = await res.json();
      if (!Array.isArray(data) || !data.every(item => item && typeof item.id === 'string' && typeof item.orderNumber === 'string' && typeof item.customerName === 'string' && typeof item.totalAmount === 'number' && Number.isFinite(item.totalAmount) && typeof item.currency === 'string' && typeof item.paymentSlipUrl === 'string' && typeof item.createdAt === 'string')) throw new Error('ລາຍການສະລິບບໍ່ຖືກຕ້ອງ');
      if (generation === loadGeneration.current) {
        setSlips(data as PendingSlipOrder[]);
        onCountChange?.(data.length);
      }
    } catch (err) {
      if (generation === loadGeneration.current) setError(translatePaymentError(err));
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPendingSlips();
    return () => { loadGeneration.current++; };
  }, []);

  const handleApprove = async (orderId: string) => {
    if (reviewLock.current) return;
    reviewLock.current = true;
    loadGeneration.current++;
    setLoading(false);
    setReviewing(true);
    setError('');
    try {
      const slip = slips.find(s => s.id === orderId);
      const recordId = slip?.paymentRecordId || slip?.payment_record_id;
      if (recordId) {
        const rev = slip?.expectedPaymentRevision ?? slip?.expected_payment_revision ?? 0;
        const amount = slip?.requestedAmountLak || slip?.requested_amount_lak || String(slip?.totalAmount ?? 0);
        const idempotencyKey = `payment-review:${recordId}:${Date.now()}`;
        await reviewPaymentRecord(orderId, recordId, 'APPROVED', amount, rev, idempotencyKey);
      } else {
        await reviewPaymentSlip(orderId, 'APPROVED');
      }
      const nextSlips = slips.filter((s) => s.id !== orderId);
      setSlips(nextSlips);
      onCountChange?.(nextSlips.length);
      setSelectedSlip(null);
      if (refreshData) refreshData();
    } catch (err) {
      setError(translatePaymentError(err));
    } finally {
      reviewLock.current = false;
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSlip) return;
    if (reviewLock.current) return;
    reviewLock.current = true;
    loadGeneration.current++;
    setLoading(false);
    setReviewing(true);
    setError('');
    try {
      const recordId = selectedSlip.paymentRecordId || selectedSlip.payment_record_id;
      const reason = rejectReason || 'ສລິບບໍ່ຖືກຕ້ອງ ຫຼື ຍອດເງິນບໍ່ຄົບ';
      if (recordId) {
        const rev = selectedSlip.expectedPaymentRevision ?? selectedSlip.expected_payment_revision ?? 0;
        const amount = selectedSlip.requestedAmountLak || selectedSlip.requested_amount_lak || String(selectedSlip.totalAmount);
        const idempotencyKey = `payment-review:${recordId}:${Date.now()}`;
        await reviewPaymentRecord(selectedSlip.id, recordId, 'REJECTED', amount, rev, idempotencyKey, reason);
      } else {
        await reviewPaymentSlip(selectedSlip.id, 'REJECTED', reason);
      }
      const nextSlips = slips.filter((s) => s.id !== selectedSlip.id);
      setSlips(nextSlips);
      onCountChange?.(nextSlips.length);
      setShowRejectModal(false);
      setSelectedSlip(null);
      setRejectReason('');
      if (refreshData) refreshData();
    } catch (err) {
      setError(translatePaymentError(err));
    } finally {
      reviewLock.current = false;
      setReviewing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            ລາຍການສລິບໂອນເງິນລໍຖ້າກວດສອບ (Payment Slip Audits)
          </h3>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            ກວດສອບສລິບການໂອນ ແລະ ກົດອະນຸມັດຍອດເພື່ອປ່ຽນສະຖານະເປັນ Paid & ສົ່ງຕໍ່ Pre-Press
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPendingSlips}
            disabled={loading || reviewing}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer"
            title="ໂຫຼດຂໍ້ມູນໃໝ່"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 font-extrabold text-sm rounded-full border border-emerald-200">
            {slips.length} ລາຍການຄ້າງກວດສອບ
          </span>
        </div>
      </div>

      {error && !selectedSlip && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {loading ? <p role="status">ກຳລັງໂຫຼດລາຍການສະລິບ...</p> : slips.length === 0 && error ? null : slips.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-base font-bold text-slate-700">ບໍ່ມີສລິບຄ້າງອະນຸມັດໃນຂະນະນີ້</p>
          <p className="text-xs text-slate-400 font-medium">ບໍ່ພົບລາຍການລໍຖ້າກວດສອບຈາກລະບົບ</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-extrabold border-b border-slate-200">
                <th className="p-4">ເລກທີອໍເດີ</th>
                <th className="p-4">ຊື່ລູກຄ້າ</th>
                <th className="p-4 text-right">ຍອດຊຳຣະ</th>
                <th className="p-4">ເວລາແຈ້ງໂອນ</th>
                <th className="p-4 text-center">ຫຼັກຖານສລິບ</th>
                <th className="p-4 text-center">ການຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-800">
              {slips.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 text-blue-600 font-extrabold">{item.orderNumber}</td>
                  <td className="p-4">{item.customerName}</td>
                  <td className="p-4 text-right font-black text-slate-900">
                    {item.totalAmount.toLocaleString()} {item.currency}
                  </td>
                  <td className="p-4 text-slate-500 font-medium">{item.createdAt}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedSlip(item)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      ເບິ່ງສລິບໂອນເງິນ
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        disabled={reviewing}
                        onClick={() => handleApprove(item.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        ອະນຸມັດຍອດ (Approve)
                      </button>
                      <button
                        disabled={reviewing}
                        onClick={() => {
                          setSelectedSlip(item);
                          setShowRejectModal(true);
                        }}
                        className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        ປະຕິເສດ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slip Preview Modal */}
      {selectedSlip && !showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-xl font-black text-slate-900">ກວດສອບສລິບໂອນເງິນ</h4>
                <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedSlip.orderNumber} • {selectedSlip.customerName}</p>
              </div>
              <button
                onClick={() => setSelectedSlip(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                ×
              </button>
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">ຍອດທີ່ຕ້ອງໂອນຕົວຈິງ:</span>
                <span className="text-xl font-black text-emerald-600">
                  {selectedSlip.totalAmount.toLocaleString()} {selectedSlip.currency}
                </span>
              </div>

              <div className="border-2 border-slate-100 rounded-2xl overflow-hidden max-h-96 flex items-center justify-center bg-slate-900">
                <ArtworkThumbnail url={selectedSlip.paymentSlipUrl} name="payment-slip" alt="Payment Slip Preview" fit="contain" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex-1 py-3.5 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-2xl text-sm font-extrabold transition active:scale-95 cursor-pointer"
              >
                ປະຕິເສດສລິບນີ້
              </button>
              <button
                disabled={reviewing}
                        onClick={() => handleApprove(selectedSlip.id)}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/25 active:scale-95 transition cursor-pointer"
              >
                ອະນຸມັດເງິນເຂົ້າ (Approve Payment)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <h4 className="text-xl font-black text-slate-900">ລະບຸເຫດຜົນໃນການປະຕິເສດສລິບ</h4>
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="ລະບຸເຫດຜົນ ເຊັ່ນ ຍອດໂອນບໍ່ກົງກັບໃບແຈ້ງໜີ້, ສລິບຊ້ຳ..."
              className="w-full p-4 bg-slate-50 border-2 border-slate-200 focus:border-red-500 rounded-2xl text-sm font-bold outline-none h-32"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-sm font-bold"
              >
                ຍົກເລີກ
              </button>
              <button
                disabled={reviewing}
                onClick={handleReject}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-red-600/25"
              >
                ຢືນຢັນປະຕິເສດສລິບ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
