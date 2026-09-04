import React, { useState, useMemo } from 'react';
import { 
  Scissors, 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  MapPin, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown,
  Box,
  Scale,
  RefreshCw,
  MinusCircle
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

interface OffcutsTabProps {
  onOpenAddModal: () => void;
}

export const OffcutsTab: React.FC<OffcutsTabProps> = ({ onOpenAddModal }) => {
  const { 
    offcuts = [], 
    inventory = [], 
    consumeOffcut, 
    deleteOffcut, 
    formatCurrency, 
    showToast,
    askConfirmation,
    refreshData
  } = useApp();

  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const formatLAK = formatCurrency;

  const [searchQuery, setSearchQuery] = useState('');
  const [paperTypeFilter, setPaperTypeFilter] = useState('ALL');
  const [selectedOffcutForConsume, setSelectedOffcutForConsume] = useState<any>(null);
  const [consumeQty, setConsumeQty] = useState<number>(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Derive unique paper types from offcuts
  const availablePaperTypes = useMemo(() => {
    const set = new Set<string>();
    offcuts.forEach(o => {
      const pType = o.specs?.paperType || o.paperType;
      if (pType) set.add(pType);
    });
    return Array.from(set);
  }, [offcuts]);

  // Filtered Offcuts list
  const filteredOffcuts = useMemo(() => {
    return offcuts.filter(off => {
      const name = (off.name || '').toLowerCase();
      const id = (off.id || off.sku || '').toLowerCase();
      const parentSku = (off.paperId || off.specs?.parentMaterialId || '').toLowerCase();
      const loc = (off.location || off.specs?.location || off.notes || '').toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = !q || name.includes(q) || id.includes(q) || parentSku.includes(q) || loc.includes(q);
      
      const pType = off.specs?.paperType || off.paperType;
      const matchesType = paperTypeFilter === 'ALL' || pType === paperTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [offcuts, searchQuery, paperTypeFilter]);

  // Summary Metrics KPIs
  const stats = useMemo(() => {
    let totalPieces = 0;
    let totalSqMeters = 0;
    let totalValueLAK = 0;

    offcuts.forEach(off => {
      const q = Number(off.stockQty || off.qty || 0);
      const w = Number(off.specs?.widthMm || off.widthMm || 148);
      const h = Number(off.specs?.heightMm || off.heightMm || 210);
      const cost = Number(off.costPerConsumptionUnit || off.costPerSheet || 400);

      totalPieces += q;
      totalSqMeters += (w * h * q) / 1_000_000;
      totalValueLAK += q * cost;
    });

    return {
      totalBatches: offcuts.length,
      totalPieces,
      totalSqMeters: Math.round(totalSqMeters * 100) / 100,
      totalValueLAK
    };
  }, [offcuts]);

  const handleConfirmConsume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffcutForConsume || consumeQty <= 0) return;

    const available = Number(selectedOffcutForConsume.stockQty || selectedOffcutForConsume.qty || 0);
    if (consumeQty > available) {
      showToast(`ຈຳນວນທີ່ເບີກເກີນສະຕັອກທີ່ມີ (${available} ແຜ່ນ)`, 'warning');
      return;
    }

    consumeOffcut(selectedOffcutForConsume.id, consumeQty);
    showToast(`ເບີກໃຊ້ເສດເຈ້ຍ ${consumeQty.toLocaleString()} ແຜ່ນ ຮຽບຮ້ອຍ!`, 'success');
    setSelectedOffcutForConsume(null);
  };

  const handleDelete = (offcut: any) => {
    const msg = currentLang === 'lo'
      ? `ທ່ານຕ້ອງການລຶບລາຍການເສດເຈ້ຍ "${offcut.name}" ອອກຈາກລະບົບແທ້ບໍ?`
      : `Delete offcut scrap "${offcut.name}" from inventory?`;

    askConfirmation(msg, () => {
      if (deleteOffcut) {
        deleteOffcut(offcut.id);
      }
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      showToast(currentLang === 'lo' ? 'ອັບເດດຂໍ້ມູນເສດເຈ້ຍແລ້ວ' : 'Offcuts updated', 'success');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* 1. KPI Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {currentLang === 'lo' ? 'ເສດເຈ້ຍທັງໝົດ' : 'Total Offcuts'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5 font-sans">
              {stats.totalPieces.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ແຜ່ນ</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {currentLang === 'lo' ? 'ຈຳນວນລາຍການ / ໄຊສ໌' : 'Active Sizes'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5 font-sans">
              {stats.totalBatches} <span className="text-xs font-semibold text-slate-500">ລາຍການ</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {currentLang === 'lo' ? 'ພື້ນທີ່ນຳໃຊ້ໄດ້' : 'Total Usable Area'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5 font-sans">
              {stats.totalSqMeters} <span className="text-xs font-semibold text-slate-500">ຕລ.ມ (m²)</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {currentLang === 'lo' ? 'ມູນຄ່າຕົ້ນທຶນທີ່ປະຢັດ' : 'Reclaimed Value'}
            </div>
            <div className="text-xl font-black text-emerald-600 mt-0.5 font-sans">
              {formatLAK(stats.totalValueLAK)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Actions & Filter Toolbar */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາຊື່ເສດເຈ້ຍ, SKU ຕົ້ນທາງ, ຊັ້ນວາງ...' : 'Search offcuts, parent SKU, location...'}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          {availablePaperTypes.length > 0 && (
            <select
              value={paperTypeFilter}
              onChange={(e) => setPaperTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="ALL">{currentLang === 'lo' ? 'ທຸກປະເພດເຈ້ຍ' : 'All Paper Types'}</option>
              {availablePaperTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition cursor-pointer"
            title="Refresh Offcuts"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" />
          <span>{currentLang === 'lo' ? '+ ລົງທະບຽນເສດເຈ້ຍໃໝ່' : '+ Register Offcut Scrap'}</span>
        </button>
      </div>

      {/* 3. Offcuts Ledger Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-4 px-5">ລາຍການເສດເຈ້ຍ (Offcut Name)</th>
                <th className="py-4 px-4">SKU / ຕົ້ນທາງ (Parent)</th>
                <th className="py-4 px-4">ຂະໜາດ (W × H mm)</th>
                <th className="py-4 px-4">ສະຕັອກຄົງເຫຼືອ (Available)</th>
                <th className="py-4 px-4">ມູນຄ່າປະຢັດ (Est. Value)</th>
                <th className="py-4 px-4">ສະຖານທີ່ເກັບ (Location)</th>
                <th className="py-4 px-5 text-right">ຈັດການ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {filteredOffcuts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Scissors className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold">{currentLang === 'lo' ? 'ບໍ່ພົບລາຍການເສດເຈ້ຍ' : 'No offcut scraps found'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {currentLang === 'lo' ? 'ຄລິກ "+ ລົງທະບຽນເສດເຈ້ຍໃໝ່" ເພື່ອບັນທຶກເສດເຈ້ຍທີ່ເຫຼືອຈາກການຕັດ' : 'Click "+ Register Offcut Scrap" to add remnants from cutting'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOffcuts.map(off => {
                  const qty = Number(off.stockQty || off.qty || 0);
                  const w = Number(off.specs?.widthMm || off.widthMm || 148);
                  const h = Number(off.specs?.heightMm || off.heightMm || 210);
                  const costPerSheet = Number(off.costPerConsumptionUnit || off.costPerSheet || 400);
                  const totalVal = qty * costPerSheet;
                  const location = off.location || off.specs?.location || off.notes || 'Shelf A-01';

                  return (
                    <tr key={off.id} className="hover:bg-indigo-50/30 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 font-black">
                            <Scissors className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 text-xs block">{off.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {off.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono text-[10px] font-bold uppercase">
                          {off.paperId || off.specs?.parentMaterialId || 'PAP-SCRAP'}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-indigo-700">
                        <span className="px-2 py-0.5 bg-indigo-50/80 rounded-md border border-indigo-100">
                          {w} × {h} mm
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-sans inline-flex items-center gap-1.5 ${
                          qty <= 20 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{qty.toLocaleString()} ແຜ່ນ</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {formatLAK(totalVal)}
                        <span className="block text-[10px] text-slate-400 font-sans font-medium">({formatLAK(costPerSheet)}/ແຜ່ນ)</span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[130px] font-semibold">{location}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedOffcutForConsume(off);
                              setConsumeQty(Math.min(10, qty));
                            }}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            title="Discharge / Use scrap for job"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span>{currentLang === 'lo' ? 'ເບີກໃຊ້' : 'Use'}</span>
                          </button>

                          <button
                            onClick={() => handleDelete(off)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                            title="Delete offcut entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Discharge / Consume Scrap Modal */}
      {selectedOffcutForConsume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-scale-up p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">
                  {currentLang === 'lo' ? 'ເບີກໃຊ້ເສດເຈ້ຍ (Consume Scrap)' : 'Consume Scrap Offcut'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOffcutForConsume(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="bg-indigo-50/60 rounded-2xl p-3.5 space-y-1 text-xs">
              <div className="font-black text-slate-900">{selectedOffcutForConsume.name}</div>
              <div className="text-slate-500">
                <span>ສະຕັອກທີ່ມີ: </span>
                <span className="font-black text-indigo-700 font-sans">
                  {Number(selectedOffcutForConsume.stockQty || selectedOffcutForConsume.qty || 0).toLocaleString()} ແຜ່ນ
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmConsume} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {currentLang === 'lo' ? 'ຈຳນວນແຜ່ນທີ່ຕ້ອງການເບີກ:' : 'Quantity to Consume (Sheets):'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={Number(selectedOffcutForConsume.stockQty || selectedOffcutForConsume.qty || 1)}
                  value={consumeQty}
                  onChange={(e) => setConsumeQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-2xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  required
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedOffcutForConsume(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer border-none"
                >
                  {currentLang === 'lo' ? 'ຢືນຢັນການເບີກ' : 'Confirm Use'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OffcutsTab;
