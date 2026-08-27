import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  RefreshCw, 
  Search,
  X,
  CreditCard
} from 'lucide-react';

interface ARAgingItem {
  customer_id: string;
  customer_name: string;
  total_due: number;
  current: number;
  days_30: number;
  days_60: number;
  days_90_plus: number;
}

export const ARManagementPage: React.FC = () => {
  const [arList, setArList] = useState<ARAgingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Payment Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<ARAgingItem | null>(null);
  const [payAmount, setPayAmount] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState('BCEL Transfer');
  const [recording, setRecording] = useState(false);

  const loadAR = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/finance/ar');
      if (res.ok) {
        const json = await res.json();
        setArList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load AR aging:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAR();
  }, []);

  const totalAR = arList.reduce((sum, item) => sum + item.total_due, 0);

  const filtered = arList.filter(item => 
    item.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    item.customer_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const numAmt = parseFloat(String(payAmount));
    if (!numAmt || numAmt <= 0) return;

    setRecording(true);
    try {
      const res = await fetch(`/api/v1/finance/ar/${selectedCustomer.customer_id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmt, payment_method: paymentMethod })
      });
      if (res.ok) {
        setSelectedCustomer(null);
        setPayAmount('');
        loadAR();
      }
    } catch (err) {
      console.error('Payment record failed:', err);
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              ລູກໜີ້ການຄ້າ & ອາຍຸໜີ້ (Accounts Receivable & Aging)
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              ຕິດຕາມຍອດຄ້າງຊຳຣະ ແລະ ບັນທຶກຮັບເງິນຈາກລູກຄ້າ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase block">ຍອດໜີ້ລວມທັງໝົດ</span>
            <span className="text-xl font-black text-amber-600 font-sans">₭{totalAR.toLocaleString()}</span>
          </div>
          <button onClick={loadAR} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ລູກຄ້າ ຫຼື ລະຫັດ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="py-3 px-3">ລູກຄ້າ</th>
                <th className="py-3 px-3 text-right">0 - 30 ວັນ</th>
                <th className="py-3 px-3 text-right">31 - 60 ວັນ</th>
                <th className="py-3 px-3 text-right">61+ ວັນ</th>
                <th className="py-3 px-3 text-right">ຍອດຄ້າງລວມ</th>
                <th className="py-3 px-3 text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ບໍ່ມີຍອດໜີ້ຄ້າງຊຳຣະໃນລະບົບ
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.customer_id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{item.customer_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.customer_id}</div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-sans text-slate-600">
                      ₭{item.days_30.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-sans text-amber-600 font-bold">
                      ₭{item.days_60.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-sans text-rose-600 font-bold">
                      ₭{item.days_90_plus.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-sans font-black text-slate-900">
                      ₭{item.total_due.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedCustomer(item);
                          setPayAmount(item.total_due);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 transition cursor-pointer text-xs"
                      >
                        ບັນທຶກຮັບເງິນ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="font-extrabold text-sm text-slate-900">
                ບັນທຶກການຮັບຊຳຣະໜີ້ (AR Settlement)
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1 text-xs">
              <span className="text-slate-500 block">ລູກຄ້າ:</span>
              <div className="font-bold text-slate-900 text-sm">{selectedCustomer.customer_name}</div>
              <div className="text-amber-600 font-bold font-sans">
                ຍອດຄ້າງ: ₭{selectedCustomer.total_due.toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase">ຈຳນວນເງິນທີ່ຮັບ (Amount)</label>
                <input
                  type="number"
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl font-sans text-base font-black text-emerald-700"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase">ຊ່ອງທາງຮັບເງິນ</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl bg-white"
                >
                  <option value="BCEL Transfer">BCEL One (LAK)</option>
                  <option value="KBank Transfer">KBank (THB)</option>
                  <option value="Cash">ເງິນສົດ (Cash)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={recording}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-md shadow-emerald-500/20 transition cursor-pointer"
              >
                {recording ? 'ກຳລັງບັນທຶກ...' : 'ຢືນຢັນການຮັບເງິນ (Confirm Payment)'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
