import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle, XCircle, Search, Calendar, User, FileText } from 'lucide-react';
import { StockInboundRecord, CancelInboundPayload } from '../types';
import { cancelInbound } from '../api/inventoryApi';

interface InboundHistoryTableProps {
  records: StockInboundRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export default function InboundHistoryTable({ records, loading, onRefresh }: InboundHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  
  // Reversal / Cancellation Modal State
  const [selectedRecordToCancel, setSelectedRecordToCancel] = useState<StockInboundRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      (r.inbound_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.item_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.sku_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCancelModal = (record: StockInboundRecord) => {
    setSelectedRecordToCancel(record);
    setCancelReason('');
    setCancelError(null);
  };

  const handleConfirmCancel = async () => {
    if (!selectedRecordToCancel) return;
    if (!cancelReason.trim()) {
      setCancelError('กรุณาระบุเหตุผลในการยกเลิกบิลนำเข้า');
      return;
    }

    setCancelLoading(true);
    setCancelError(null);
    try {
      const payload: CancelInboundPayload = {
        inbound_id: selectedRecordToCancel.id,
        user_id: 'ADMIN',
        reason: cancelReason.trim(),
      };

      await cancelInbound(payload);
      setSelectedRecordToCancel(null);
      onRefresh();
    } catch (err: any) {
      setCancelError(err.message || 'เกิดข้อผิดพลาดในการยกเลิกบิล');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่บิล, SKU, ชื่อสินค้า, ซัพพลายเออร์..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({records.length})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            สำเร็จ ({records.filter(r => r.status === 'COMPLETED').length})
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ยกเลิกแล้ว ({records.filter(r => r.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {/* Inbound Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">วันที่ / เลขที่บิล</th>
                <th className="py-3.5 px-4">รายการสินค้า (SKU)</th>
                <th className="py-3.5 px-4 text-center">จำนวนรับเข้า</th>
                <th className="py-3.5 px-4 text-right">ราคาต่อหน่วย</th>
                <th className="py-3.5 px-4 text-right">ยอดรวม (LAK)</th>
                <th className="py-3.5 px-4">ผู้จัดจำหน่าย</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    กำลังโหลดประวัติการรับเข้าสินค้า...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ไม่พบรายการประวัติการนำเข้าสินค้า
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isCancelled = r.status === 'CANCELLED';
                  return (
                    <tr 
                      key={r.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isCancelled ? 'bg-slate-50/40 opacity-75' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-900">{r.inbound_date}</span>
                        </div>
                        <div className="text-[11px] text-blue-600 font-mono mt-0.5">{r.inbound_number}</div>
                        {r.po_number && (
                          <div className="text-[10px] text-slate-400">PO: {r.po_number}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.item_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.sku_code}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                          {r.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-900">
                          {Number(r.quantity_received).toLocaleString()}
                        </span>{' '}
                        <span className="text-slate-500 text-xs">{r.purchase_unit || 'หน่วย'}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          (= {(Number(r.quantity_received) * Number(r.purchase_multiplier || 1)).toLocaleString()} ตัดสต็อก)
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        {Number(r.unit_purchase_price).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {Number(r.total_price).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {r.supplier_name || '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            ยกเลิกแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            สมบูรณ์
                          </span>
                        )}
                        {isCancelled && r.cancellation_reason && (
                          <div className="text-[10px] text-rose-500 mt-1 max-w-[140px] truncate" title={r.cancellation_reason}>
                            เหตุผล: {r.cancellation_reason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {!isCancelled ? (
                          <button
                            onClick={() => handleOpenCancelModal(r)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl transition-all border border-rose-100 hover:border-rose-200 shadow-sm flex items-center gap-1 text-xs font-semibold"
                            title="ยกเลิกบิลนำเข้าและหักคืนสต็อก"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            ยกเลิกบิล
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">คืนสต็อกแล้ว</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {selectedRecordToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">ยืนยันการยกเลิกบิลนำเข้า (Rollback)</h3>
              <p className="text-xs text-slate-500 mb-4">
                ระบบจะทำการหักลดยอดสต็อกคงเหลือคืนจำนวน <strong className="text-rose-600 font-bold">{selectedRecordToCancel.quantity_received} {selectedRecordToCancel.purchase_unit}</strong> ({selectedRecordToCancel.item_name}) ทันที
              </p>

              {cancelError && (
                <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-left">
                  {cancelError}
                </div>
              )}

              <div className="text-left mb-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ระบุเหตุผลในการยกเลิก <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="เช่น กรอกจำนวนผิดพลาด, คืนสินค้าซัพพลายเออร์, เอกสารซ้ำซ้อน..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none h-20"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRecordToCancel(null)}
                  disabled={cancelLoading}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cancelLoading ? 'กำลังยกเลิก...' : 'ยืนยันหักคืนสต็อก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
