import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, RotateCcw, AlertTriangle, CheckCircle, XCircle, FileText, Calendar, Eye } from 'lucide-react';
import { StockInboundRecord, CancelInboundPayload } from '../types';
import { cancelInbound } from '../api/inventoryApi';

interface InboundHistoryTableProps {
  records: StockInboundRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export default function InboundHistoryTable({ records, loading, onRefresh }: InboundHistoryTableProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  
  // Cancellation Modal State
  const [selectedRecordToCancel, setSelectedRecordToCancel] = useState<StockInboundRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      (r.inbound_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.sku_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.item_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.po_number || '').toLowerCase().includes(searchQuery.toLowerCase());

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
      setCancelError('ກະລຸນາລະບຸເຫດຜົນໃນການຍົກເລີກບິນຮັບເຂົ້າ');
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
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setSelectedRecordToCancel(null);
      onRefresh();
    } catch (err: any) {
      setCancelError(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການຍົກເລີກບິນ');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາເລກບິນ, SKU, ຊື່ສິນຄ້າ, ຜູ້ສະໜອງ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ທັງໝົດ ({records.length})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ສຳເລັດ ({records.filter(r => r.status === 'COMPLETED').length})
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ຍົກເລີກແລ້ວ ({records.filter(r => r.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {/* Inbound Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">ວັນທີ / ເລກທີບິນ</th>
                <th className="py-3.5 px-4">ລາຍການສິນຄ້າ (SKU)</th>
                <th className="py-3.5 px-4 text-center">ຈຳນວນຮັບເຂົ້າ</th>
                <th className="py-3.5 px-4 text-right">ລາຄາຕໍ່ໜ່ວຍ</th>
                <th className="py-3.5 px-4 text-right">ຍອດລວມ (LAK)</th>
                <th className="py-3.5 px-4">ຜູ້ສະໜອງສິນຄ້າ</th>
                <th className="py-3.5 px-4 text-center">ສະຖານະ</th>
                <th className="py-3.5 px-4 text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ກຳລັງໂຫຼດປະຫວັດການຮັບເຂົ້າສິນຄ້າ...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ບໍ່ພົບລາຍການປະຫວັດການນຳເຂົ້າສິນຄ້າ
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
                        <span className="text-slate-500 text-xs">{r.purchase_unit || 'ໜ່ວຍ'}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                          (= {(Number(r.quantity_received) * Number(r.purchase_multiplier || 1)).toLocaleString()} ຕັດສະຕ໋ອກ)
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
                            ຍົກເລີກແລ້ວ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            ສົມບູນ
                          </span>
                        )}
                        {isCancelled && r.cancellation_reason && (
                          <div className="text-[10px] text-rose-500 mt-1 max-w-[140px] truncate" title={r.cancellation_reason}>
                            ເຫດຜົນ: {r.cancellation_reason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {!isCancelled ? (
                          <button
                            onClick={() => handleOpenCancelModal(r)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl transition-all border border-rose-100 hover:border-rose-200 shadow-sm flex items-center gap-1 text-xs font-semibold cursor-pointer"
                            title="ຍົກເລີກບິນນຳເຂົ້າ ແລະ ຫັກຄືນສະຕ໋ອກ"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            ຍົກເລີກບິນ
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">ຄືນສະຕ໋ອກແລ້ວ</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">ຢືນຢັນການຍົກເລີກບິນນຳເຂົ້າ (Rollback)</h3>
              <p className="text-xs text-slate-500 mb-4">
                ລະບົບຈະທຳການຫັກລົດຍອດສະຕ໋ອກຄົງເຫຼືອຄືນຈຳນວນ <strong className="text-rose-600 font-bold">{selectedRecordToCancel.quantity_received} {selectedRecordToCancel.purchase_unit}</strong> ({selectedRecordToCancel.item_name}) ທັນທີ
              </p>

              {cancelError && (
                <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs text-left">
                  {cancelError}
                </div>
              )}

              <div className="text-left mb-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ລະບຸເຫດຜົນໃນການຍົກເລີກ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="ເຊັ່ນ: ປ້ອນຈຳນວນຜິດພາດ, ສົ່ງສິນຄ້າຄືນຜູ້ສະໜອງ, ເອກະສານຊ້ຳຊ້ອນ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none h-20 font-medium"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRecordToCancel(null)}
                  disabled={cancelLoading}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  ຍ້ອນກັບ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {cancelLoading ? 'ກຳລັງຍົກເລີກ...' : 'ຢືນຢັນຫັກຄືນສະຕ໋ອກ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
