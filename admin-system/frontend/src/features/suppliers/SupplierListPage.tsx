import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Phone, 
  Mail, 
  CreditCard,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { SupplierFormModal, SupplierData } from './SupplierFormModal';
import { useQueryClient } from '@tanstack/react-query';

export const SupplierListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierData | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/suppliers?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const json = await res.json();
        setSuppliers(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('ຢືນຢັນການປິດການໃຊ້ງານຜູ້ສະໜອງນີ້?')) return;
    try {
      const res = await fetch(`/api/v1/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSuppliers();
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              ລາຍຊື່ຜູ້ສະໜອງວັດຖຸດິບ (Suppliers Master)
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              ບໍລິຫານຈັດການຂໍ້ມູນຊັບພລາຍເອີ, ເຄຣດິດ ແລະ ເງື່ອນໄຂການຄ້າ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingSupplier(null);
              setModalOpen(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + ເພີ່ມຜູ້ສະໜອງ (Add Supplier)
          </button>
          <button
            onClick={fetchSuppliers}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາຊື່ຜູ້ສະໜອງ ຫຼື ລະຫັດ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="py-3 px-3">ລະຫັດ / ຊື່ຜູ້ສະໜອງ</th>
                <th className="py-3 px-3">ຂໍ້ມູນຕິດຕໍ່</th>
                <th className="py-3 px-3 text-center">ເຄຣດິດ</th>
                <th className="py-3 px-3 text-center">ສະກຸນເງິນ</th>
                <th className="py-3 px-3 text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    ຍັງບໍ່ມີຂໍ້ມູນຜູ້ສະໜອງໃນລະບົບ
                  </td>
                </tr>
              ) : (
                suppliers.map(s => (
                  <tr key={s.id || s.code} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.code}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-800 font-semibold">{s.contact_name || '—'}</div>
                      <div className="text-[11px] text-slate-400">{s.phone || s.email || '—'}</div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-sans font-bold text-slate-700">
                      {s.payment_terms_days} ວັນ
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {s.currency}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingSupplier(s);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {s.id && (
                          <button
                            onClick={() => handleDeactivate(s.id!)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {modalOpen && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            fetchSuppliers();
          }}
        />
      )}
    </div>
  );
};
