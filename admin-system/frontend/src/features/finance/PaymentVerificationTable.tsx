import React, { useState } from 'react';
import { CheckCircle2, XCircle, Eye, DollarSign, ShieldAlert } from 'lucide-react';

interface PendingSlipOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  paymentSlipUrl: string;
  createdAt: string;
}

export const PaymentVerificationTable: React.FC = () => {
  const [selectedSlip, setSelectedSlip] = useState<PendingSlipOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [slips, setSlips] = useState<PendingSlipOrder[]>([
    {
      id: 'ord-101',
      orderNumber: 'ORD-2026-0815',
      customerName: 'Vientiane Publishing House',
      totalAmount: 14500000,
      currency: 'LAK',
      paymentSlipUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      createdAt: '2026-08-15 10:30',
    },
    {
      id: 'ord-102',
      orderNumber: 'ORD-2026-0816',
      customerName: 'Som-Sing Commercial Packaging',
      totalAmount: 8200000,
      currency: 'LAK',
      paymentSlipUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
      createdAt: '2026-08-15 11:45',
    },
  ]);

  const handleApprove = async (orderId: string) => {
    try {
      await fetch('/api/v1/finance/verify-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: 'APPROVED' }),
      });
      setSlips((prev) => prev.filter((s) => s.id !== orderId));
      setSelectedSlip(null);
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleReject = async () => {
    if (!selectedSlip) return;
    try {
      await fetch('/api/v1/finance/verify-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedSlip.id,
          status: 'REJECTED',
          rejection_reason: rejectReason || 'ສລິບບໍ່ຖືກຕ້ອງ ຫຼື ຍອດເງິນບໍ່ຄົບ',
        }),
      });
      setSlips((prev) => prev.filter((s) => s.id !== selectedSlip.id));
      setShowRejectModal(false);
      setSelectedSlip(null);
      setRejectReason('');
    } catch (err) {
      console.error('Reject failed:', err);
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
            ກວດສອບສລິບການໂອນ ແລະ ກົດອະນຸມັດຍອດເພື່ອປ່ຽນສະຖານະເປັນ Paid & ເຂົ້າສູ່ການຜະລິດ
          </p>
        </div>
        <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 font-extrabold text-sm rounded-full border border-emerald-200">
          {slips.length} ລາຍການຄ້າງກວດສອບ
        </span>
      </div>

      {slips.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <p className="text-base font-bold text-slate-700">ບໍ່ມີສລິບຄ້າງອະນຸມັດໃນຂະນະນີ້</p>
          <p className="text-xs text-slate-400 font-medium">ທຸກອໍເດີໄດ້ຮັບການກວດສອບສລິບ ແລະ ປັບສະຖານະຮຽບຮ້ອຍແລ້ວ</p>
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
                        onClick={() => handleApprove(item.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        ອະນຸມັດຍອດ (Approve)
                      </button>
                      <button
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

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">ຍອດທີ່ຕ້ອງໂອນຕົວຈິງ:</span>
                <span className="text-xl font-black text-emerald-600">
                  {selectedSlip.totalAmount.toLocaleString()} {selectedSlip.currency}
                </span>
              </div>

              <div className="border-2 border-slate-100 rounded-2xl overflow-hidden max-h-96 flex items-center justify-center bg-slate-900">
                <img
                  src={selectedSlip.paymentSlipUrl}
                  alt="Payment Slip Preview"
                  className="max-h-96 w-auto object-contain"
                />
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
