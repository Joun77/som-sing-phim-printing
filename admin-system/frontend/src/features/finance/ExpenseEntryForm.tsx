import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  RefreshCw
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  expense_date: string;
  receipt_url?: string;
}

interface COAAccount {
  code: string;
  name: string;
  account_type: string;
}

export const ExpenseEntryForm: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [coaList, setCoaList] = useState<COAAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [accountCode, setAccountCode] = useState('6500');
  const [category, setCategory] = useState('Overhead');
  const [amount, setAmount] = useState<number | string>('');
  const [currency, setCurrency] = useState('LAK');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expRes, coaRes] = await Promise.all([
        fetch('/api/v1/finance/expenses').then(r => r.json()),
        fetch('/api/v1/finance/chart-of-accounts').then(r => r.json())
      ]);
      setExpenses(expRes.data || []);
      setCoaList((coaRes.data || []).filter((c: any) => c.account_type === 'EXPENSE'));
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const numAmount = parseFloat(String(amount));
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('ກະລຸນາລະບຸຈຳນວນເງິນທີ່ຖືກຕ້ອງ');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        account_code: accountCode,
        category: category,
        amount: numAmount,
        currency: currency,
        description: description.trim() || category,
        receipt_url: receiptUrl.trim(),
        expense_date: expenseDate,
        recorded_by: 'ADMIN'
      };

      const res = await fetch('/api/v1/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save expense');
      }

      setSuccessMsg('ບັນທຶກລາຍຈ່າຍ ແລະ Auto-Journal ສຳເລັດແລ້ວ!');
      setAmount('');
      setDescription('');
      setReceiptUrl('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Column */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base">
          <Receipt className="w-5 h-5 text-indigo-600" />
          <span>ບັນທຶກລາຍຈ່າຍໃໝ່ (Record Expense)</span>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-slate-500 uppercase">ວັນທີຈ່າຍ (Date)</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-sans"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase">ໝວດໝູ່ບັນຊີ (COA Expense Account)</label>
            <select
              value={accountCode}
              onChange={(e) => {
                setAccountCode(e.target.value);
                const found = coaList.find(c => c.code === e.target.value);
                if (found) setCategory(found.name);
              }}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white"
            >
              {coaList.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
              {coaList.length === 0 && (
                <>
                  <option value="6100">6100 - ຄ່າຈ້າງ ແລະ ເງິນເດືອນ</option>
                  <option value="6200">6200 - ຄ່າເຊົ່າສະຖານທີ່</option>
                  <option value="6300">6300 - ຄ່າໄຟຟ້າ & ສາທາລະນູປະໂພກ</option>
                  <option value="6400">6400 - ຄ່າສ້ອມແປງເຄື່ອງຈັກ</option>
                  <option value="6500">6500 - ຄ່າໃຊ້ຈ່າຍທົ່ວໄປ (Overhead)</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase">ຈຳນວນເງິນ (Amount)</label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl font-sans text-sm font-black"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-500 uppercase">ສະກຸນເງິນ</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white font-sans"
              >
                <option value="LAK">LAK (₭)</option>
                <option value="THB">THB (฿)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase">ລາຍລະອຽດ (Description)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ເຊັ່ນ: ຄ່າໄຟຟ້າເດືອນ 2, ຄ່າຊື້ອຸປະກອນຫ້ອງການ"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-500 uppercase">ລິ້ງໃບຮັບເງິນ / ບິນ (Receipt URL)</label>
            <input
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold shadow-md shadow-indigo-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກລາຍຈ່າຍ (Save Expense)'}
          </button>
        </form>
      </div>

      {/* List Column */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-extrabold text-sm text-slate-800">
            ປະຫວັດລາຍຈ່າຍຫຼ້າສຸດ ({expenses.length} ລາຍການ)
          </h4>
          <button onClick={loadData} className="p-2 text-slate-400 hover:text-slate-600 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="py-3 px-3">ວັນທີ</th>
                <th className="py-3 px-3">ໝວດໝູ່ / ລາຍລະອຽດ</th>
                <th className="py-3 px-3 text-right">ຈຳນວນເງິນ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-400">
                    ຍັງບໍ່ມີລາຍການຄ່າໃຊ້ຈ່າຍທີ່ບັນທຶກ
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-sans text-slate-500 whitespace-nowrap">
                      {exp.expense_date}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{exp.category}</div>
                      <div className="text-[11px] text-slate-400">{exp.description}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-rose-600 font-sans">
                      {exp.currency === 'THB' ? '฿' : exp.currency === 'USD' ? '$' : '₭'}
                      {exp.amount.toLocaleString()}
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
