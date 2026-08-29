import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, CheckCircle2, AlertTriangle, XCircle, Search, X, Eye, Trash2 } from 'lucide-react';
import { MaterialMaster } from '../types';
import { updateMaterialDirect, deleteMaterial } from '../api/inventoryApi';
import { useApp } from '@store/AppContext';

interface StockTableProps {
  materials: MaterialMaster[];
  loading: boolean;
  onRefresh: () => void;
  onOpenInbound?: (material?: MaterialMaster) => void;
  onViewDetails?: (material: MaterialMaster) => void;
}

const normalizeLaoUnit = (unit?: string, fallback = 'ແຜ່ນ') => {
  if (!unit) return fallback;
  const u = unit.trim().toLowerCase();
  if (u === 'แผ่น' || u === 'sheet' || u === 'sheets' || u === 'แผ่น (sheet)' || u === 'ແຜ່ນ') return 'ແຜ່ນ';
  if (u === 'แพ็ก' || u === 'pack' || u === 'packs' || u === 'แพ็ค' || u === 'ແພ໊ກ' || u === 'ແພັກ') return 'ແພັກ';
  if (u === 'รีม' || u === 'ream' || u === 'reams' || u === 'ຣີມ') return 'ຣີມ';
  if (u === 'ขวด' || u === 'bottle' || u === 'bottles' || u === 'ຂວດ') return 'ຂວດ';
  if (u === 'ม้วน' || u === 'roll' || u === 'rolls' || u === 'ມ້ວນ') return 'ມ້ວນ';
  if (u === 'เครื่อง' || u === 'machine' || u === 'unit' || u === 'units' || u === 'ເຄື່ອງ') return 'ເຄື່ອງ';
  if (u === 'กล่อง' || u === 'box' || u === 'boxes' || u === 'ກ່ອງ') return 'ກ່ອງ';
  if (u === 'ชุด' || u === 'set' || u === 'sets' || u === 'ຊຸດ') return 'ຊຸດ';
  return unit;
};

export const StockTable = React.memo(function StockTable({ materials, loading, onRefresh, onOpenInbound, onViewDetails }: StockTableProps) {
  const queryClient = useQueryClient();
  const { showToast, deleteInventorySku, formatCurrency, updateMaterialReorderPoint } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Edit Material State
  const [editingMaterial, setEditingMaterial] = useState<MaterialMaster | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPurchaseUnit, setEditPurchaseUnit] = useState('');
  const [editConsumptionUnit, setEditConsumptionUnit] = useState('');
  const [editMultiplier, setEditMultiplier] = useState<number | string>(1);
  const [editPurchaseCost, setEditPurchaseCost] = useState<number | string>(0);
  const [editMinAlert, setEditMinAlert] = useState<number | string>(10);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleDeleteMaterial = async (m: MaterialMaster) => {
    const targetId = m.id || m.sku;
    const confirmMsg = `ທ່ານຕັ້ງໃຈລຶບສິນຄ້າ "${m.name}" (${m.sku || m.id}) ອອກຈາກຄັງສິນຄ້າແທ້ບໍ?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteMaterial(targetId);
      if (deleteInventorySku) {
        deleteInventorySku(targetId);
      }
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      showToast(`ລຶບສິນຄ້າ "${m.name}" ສຳເລັດ!`, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການລຶບສິນຄ້າ', 'error');
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || (m.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleOpenEdit = (m: MaterialMaster) => {
    setEditingMaterial(m);
    setEditName(m.name);
    setEditCategory(m.category || 'paper');
    setEditPurchaseUnit(m.purchase_unit || 'ຮີມ');
    setEditConsumptionUnit(m.consumption_unit || 'ແຜ່ນ');
    setEditMultiplier(m.purchase_multiplier || 500);
    setEditPurchaseCost(m.cost_per_purchase_unit || 0);
    setEditMinAlert(m.min_stock_alert || 10);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;

    setEditLoading(true);
    setEditError(null);
    try {
      const pCost = Number(editPurchaseCost) || 0;
      const mult = Number(editMultiplier) || 1;
      const cCost = mult > 0 ? (pCost / mult) : pCost;

      await updateMaterialDirect(editingMaterial.id || editingMaterial.sku, {
        name: editName,
        category: editCategory,
        purchase_unit: editPurchaseUnit,
        consumption_unit: editConsumptionUnit,
        purchase_multiplier: mult,
        cost_per_purchase_unit: pCost,
        cost_per_consumption_unit: cCost,
        min_stock_alert: Number(editMinAlert),
      });

      if (updateMaterialReorderPoint) {
        updateMaterialReorderPoint(editingMaterial.id || editingMaterial.sku, Number(editMinAlert));
      }

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setEditingMaterial(null);
      onRefresh();
    } catch (err: any) {
      setEditError(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການແກ້ໄຂຂໍ້ມູນ');
    } finally {
      setEditLoading(false);
    }
  };


  const renderStockBadge = (stockQty: number, minAlert: number, status?: string) => {
    const qty = Number(stockQty || 0);
    const alert = Number(minAlert || 10);

    if (qty <= 0 || status === 'OUT_OF_STOCK') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          ສິນຄ້າຫມດ (Out of Stock)
        </span>
      );
    }
    if (qty <= alert || status === 'LOW_STOCK') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          ສິນຄ້າໃກ້ຫມດ (Low Stock)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
          ມີສິນຄ້າ (In Stock)
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ຄົ້ນຫາ SKU, ຊື່ສິນຄ້າ, ໝວດໝູ່..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'paper', 'offcut', 'ink', 'lamination', 'binding'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'ທັງໝວດໝູ່' : cat === 'offcut' ? 'ເສດເຈ້ຍ (OFFCUT)' : cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">ລະຫັດ / ຊື່ສິນຄ້າ (Master SKU)</th>
                <th className="py-3.5 px-4">ໝວດໝູ່</th>
                <th className="py-3.5 px-4 text-center">ຍອດສະຕັອກຄົງເຫຼືອ</th>
                <th className="py-3.5 px-4 text-right">ຕົ້ນທຶນ/ໜ່ວຍຍ່ອຍໃຊ້</th>
                <th className="py-3.5 px-4 text-right">ຕົ້ນທຶນ/ໜ່ວຍຊື້</th>
                <th className="py-3.5 px-4 text-center">ສະຖານະສະຕັອກ</th>
                <th className="py-3.5 px-4 text-center">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    ກຳລັງໂຫຼດຂໍ້ມູນສະຕັອກ...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    ບໍ່ພົບຂໍ້ມູນສິນຄ້າໃນລະບົບ
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{m.name}</span>
                        {(m.category?.toLowerCase() === 'offcut' || m.technical_specs?.dimensionFormatted) && (
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-mono font-bold">
                            {m.technical_specs?.dimensionFormatted || 'Offcut'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-blue-600 font-mono mt-0.5">{m.sku || m.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        m.category?.toLowerCase() === 'offcut'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {m.category || 'General'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="font-black text-slate-900 text-sm sm:text-base">
                        {Number(m.stock_qty || 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium font-sans">
                        {normalizeLaoUnit(m.consumption_unit, 'ແຜ່ນ')} (ເກນເຕືອນ: <span className="font-sans">{m.min_stock_alert || 10}</span>)
                      </div>
                    </td>

                    {(() => {
                      const purchaseCost = Number(m.cost_per_purchase_unit || (m as any).costPerPurchaseUnit || 0);
                      const mult = Number(m.purchase_multiplier || (m as any).purchaseMultiplier || 1);
                      const rawConsCost = Number(m.cost_per_consumption_unit || (m as any).costPerConsumptionUnit || 0);
                      const resolvedConsCost = (rawConsCost > 0 && (mult <= 1 || rawConsCost < purchaseCost))
                        ? rawConsCost
                        : (mult > 0 && purchaseCost > 0 ? (purchaseCost / mult) : rawConsCost);

                      return (
                        <>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                            {formatCurrency(resolvedConsCost)}
                            <div className="text-[10px] text-slate-400 font-normal font-sans">/ {normalizeLaoUnit(m.consumption_unit, 'ແຜ່ນ')}</div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                            {formatCurrency(purchaseCost)}
                            <div className="text-[10px] text-slate-400 font-normal font-sans">/ {normalizeLaoUnit(m.purchase_unit, 'ແພັກ')} (<span className="font-sans">{mult}</span>x)</div>
                          </td>
                        </>
                      );
                    })()}


                    <td className="py-3.5 px-4 text-center">
                      {renderStockBadge(m.stock_qty, m.min_stock_alert, m.stock_status)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(m)}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-xl transition-all border border-indigo-100 hover:border-indigo-200 shadow-sm flex items-center gap-1 text-xs font-semibold cursor-pointer"
                            title="ລາຍລະອຽດສິນຄ້າ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            ລາຍລະອຽດ
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-xl transition-all border border-blue-100 hover:border-blue-200 shadow-sm flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          title="ແກ້ໄຂຂໍ້ມູນສິນຄ້າ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          ແກ້ໄຂ
                        </button>
                        {onOpenInbound && (
                          <button
                            onClick={() => onOpenInbound(m)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-xl transition-all border border-emerald-100 hover:border-emerald-200 shadow-sm flex items-center gap-1 text-xs font-semibold cursor-pointer"
                            title="ຮັບເຂົ້າເພີ່ມ (Restock)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            ຮັບເຂົ້າ
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMaterial(m)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-all border border-rose-100 hover:border-rose-200 shadow-sm flex items-center gap-1 text-xs font-semibold cursor-pointer"
                          title="ລຶບສິນຄ້າ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          ລຶບ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">ແກ້ໄຂຂໍ້ມູນສິນຄ້າ Master Material</h3>
              </div>
              <button
                onClick={() => setEditingMaterial(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  ຮຫັດສິນຄ້າ (SKU)
                </label>
                <input
                  type="text"
                  value={editingMaterial.sku || editingMaterial.id}
                  disabled
                  className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  ຊື່ສິນຄ້າ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">ໝວດໝູ່</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="paper">ເຈ້ຍ (Paper)</option>
                    <option value="ink">ໝຶກພິມ (Ink)</option>
                    <option value="lamination">ຟີຼ໅ເຄືອບ (Lamination)</option>
                    <option value="binding">ເຂ້າເຼ່ມ (Binding)</option>
                    <option value="spare_parts">ອະໄຫຼ່ (Spare Parts)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">ເກຓຒໄກ້ສະຕ໋ອກໃກ້ຫມດ</label>
                  <input
                    type="number"
                    step="any"
                    value={editMinAlert}
                    onChange={(e) => setEditMinAlert(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">ຫນ່ວຍຊື້</label>
                  <input
                    type="text"
                    value={editPurchaseUnit}
                    onChange={(e) => setEditPurchaseUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">ຫນ່ວຍຕັດໃຊ້</label>
                  <input
                    type="text"
                    value={editConsumptionUnit}
                    onChange={(e) => setEditConsumptionUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">ຕັວຄູນ (Multiplier)</label>
                  <input
                    type="number"
                    step="any"
                    value={editMultiplier}
                    onChange={(e) => setEditMultiplier(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  ຕົ້ນທຶນ/ຫນ່ວຍຊື້ (LAK / {editPurchaseUnit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={editPurchaseCost}
                  onChange={(e) => setEditPurchaseCost(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span>ຕົ້ນທຶນ/ຫນ່ວຍຕັດໃຊ້ (ຄຳນວນອັດຕະໂນມັດ):</span>
                  <span className="font-sans font-bold text-slate-600">{(Number(editPurchaseCost) / (Number(editMultiplier) || 1)).toFixed(2)}</span>
                  <span>LAK / {editConsumptionUnit}</span>
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  disabled={editLoading}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  {editLoading ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການແກ້ໄຂ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default StockTable;
