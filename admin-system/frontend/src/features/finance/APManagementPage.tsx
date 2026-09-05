import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  DollarSign, 
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface AccountsPayableItem {
  id: string;
  supplier_name: string;
  inbound_transaction_id: string;
  amount: number;
  currency: string;
  due_date: string;
  paid_at?: string;
  status: string;
  notes: string;
  created_at: string;
}

export const APManagementPage: React.FC = () => {
  const [apList, setApList] = useState<AccountsPayableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const loadAP = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/finance/ap');
      if (res.ok) {
        const json = await res.json();
        setApList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load AP records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAP();
  }, []);

  const totalPendingAP = apList
    .filter(a => a.status === 'PENDING' || a.status === 'OVERDUE')
    .reduce((sum, item) => sum + item.amount, 0);

  const handleSettleAP = async (id: string) => {
    if (!window.confirm('ຢືນຢັນການຕັດຈ່າຍໜີ້ສິນໃຫ້ຊັບພລາຍເອີ?')) return;
    setSettlingId(id);
    try {
      const res = await fetch(`/api/v1/finance/ap/${id}/payment`, {
        method: 'POST'
      });
      if (res.ok) {
        loadAP();
      }
    } catch (err) {
      console.error('Failed to settle AP:', err);
    } finally {
      setSettlingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              ເຈົ້າໜີ້ການຄ້າ & ການຈັດຊື້ (Accounts Payable)
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              ຕິດຕາມກຳນົດຈ່າຍຄ່າວັດຖຸດິບ ແລະ ບັນທຶກຕັດຈ່າຍຊັບພລາຍເອີ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase block">ຍອດເຈົ້າໜີ້ຄ້າງຊຳລະ</span>
            <span className="text-xl font-black text-rose-600 font-sans">₭{totalPendingAP.toLocaleString()}</span>
          </div>
          <button onClick={loadAP} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="py-3 px-3">ຊັບພລາຍເອີ (Supplier)</th>
                <th className="py-3 px-3">Inbound Ref</th>
                <th className="py-3 px-3 text-right">ກຳນົດຈ່າຍ (Due Date)</th>
                <th className="py-3 px-3 text-right">ຈຳນວນເງິນ</th>
                <th className="py-3 px-3 text-center">ສະຖານະ</th>
                <th className="py-3 px-3 text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {apList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ບໍ່ມີລາຍການເຈົ້າໜີ້ຄ້າງຊຳລະ
                  </td>
                </tr>
              ) : (
                apList.map((ap) => (
                  <tr key={ap.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{ap.supplier_name}</div>
                      <div className="text-[10px] text-slate-400">{ap.notes || 'Procurement purchase'}</div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-500">
                      {ap.inbound_transaction_id || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-sans text-slate-600">
                      {ap.due_date || 'Net 30'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-sans font-black text-rose-600 text-sm">
                      {ap.currency === 'THB' ? '฿' : ap.currency === 'USD' ? '$' : '₭'}
                      {ap.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        ap.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ap.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ap.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {ap.status !== 'PAID' ? (
                        <button
                          disabled={settlingId === ap.id}
                          onClick={() => handleSettleAP(ap.id)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs"
                        >
                          {settlingId === ap.id ? 'ກຳລັງຕັດຈ່າຍ...' : 'ຕັດຈ່າຍ (Settle)'}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ຈ່າຍແລ້ວ
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
