import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Send, 
  Printer, 
  PackageCheck, 
  RefreshCw, 
  Filter,
  CheckCircle2,
  Clock,
  Calendar
} from 'lucide-react';
import { CreatePOModal } from './CreatePOModal';
import { GoodsReceiptModal } from './GoodsReceiptModal';
import { useQueryClient } from '@tanstack/react-query';

interface POLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  received_qty: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  status: string;
  order_date: string;
  expected_delivery?: string;
  total_amount: number;
  currency: string;
  notes?: string;
  lines?: POLine[];
}

export const POListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [receiptTargetPO, setReceiptTargetPO] = useState<PurchaseOrder | null>(null);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/purchase-orders?status=${statusFilter}`);
      if (res.ok) {
        const json = await res.json();
        setPos(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch POs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, [statusFilter]);

  const handleSendPO = async (id: string) => {
    if (!window.confirm('ຢືນຢັນການປ່ຽນສະຖານະເປັນ SENT (ສົ່ງໃບສັ່ງຊື້ໃຫ້ຜູ້ສະໜອງແລ້ວ)?')) return;
    try {
      const res = await fetch(`/api/v1/purchase-orders/${id}/send`, { method: 'POST' });
      if (res.ok) {
        fetchPOs();
        queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintPO = (id: string) => {
    window.open(`/api/v1/purchase-orders/${id}/pdf`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              ໃບສັ່ງຊື້ວັດຖຸດິບ (Purchase Orders - PO)
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              ຕິດຕາມສະຖານະການສັ່ງຊື້, ອອກໃບ PO PDF ແລະ ບັນທຶກຮັບສິນຄ້າ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setCreateOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + ສ້າງໃບສັ່ງຊື້ (Create PO)
          </button>
          <button
            onClick={fetchPOs}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 border rounded-xl text-xs font-bold bg-white"
          >
            <option value="">ທຸກສະຖານະ (All Statuses)</option>
            <option value="DRAFT">DRAFT (ຮ່າງ)</option>
            <option value="SENT">SENT (ສົ່ງແລ້ວ)</option>
            <option value="PARTIAL_RECEIVED">PARTIAL RECEIVED (ຮັບບາງສ່ວນ)</option>
            <option value="RECEIVED">RECEIVED (ຮັບຄົບແລ້ວ)</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="py-3 px-3">ເລກທີ PO / ຜູ້ສະໜອງ</th>
                <th className="py-3 px-3">ວັນທີສັ່ງຊື້</th>
                <th className="py-3 px-3 text-right">ມູນຄ່າລວມ</th>
                <th className="py-3 px-3 text-center">ສະຖານະ</th>
                <th className="py-3 px-3 text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {pos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    ບໍ່ພົບໃບສັ່ງຊື້ໃນລະບົບ
                  </td>
                </tr>
              ) : (
                pos.map(po => (
                  <tr key={po.id || po.po_number} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 font-mono text-sm">{po.po_number}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">{po.supplier_name}</div>
                    </td>
                    <td className="py-3.5 px-3 font-sans text-slate-500">
                      <div>{po.order_date}</div>
                      {po.expected_delivery && (
                        <div className="text-[10px] text-indigo-600 font-semibold">
                          ຄາດຮັບ: {po.expected_delivery}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-sans font-black text-slate-900 text-sm">
                      {po.currency} {po.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        po.status === 'RECEIVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : po.status === 'PARTIAL_RECEIVED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : po.status === 'SENT'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {po.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSendPO(po.id)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                            title="Mark as Sent"
                          >
                            <Send className="w-3 h-3" /> ສົ່ງ PO
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintPO(po.id || po.po_number)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 transition"
                          title="Export PDF / Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {(po.status === 'SENT' || po.status === 'PARTIAL_RECEIVED') && (
                          <button
                            onClick={() => setReceiptTargetPO(po)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> ຮັບສິນຄ້າ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <CreatePOModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            fetchPOs();
          }}
        />
      )}

      {receiptTargetPO && (
        <GoodsReceiptModal
          po={receiptTargetPO}
          onClose={() => setReceiptTargetPO(null)}
          onSuccess={() => {
            setReceiptTargetPO(null);
            fetchPOs();
          }}
        />
      )}
    </div>
  );
};
