import React from 'react';
import { 
  Wrench, 
  Search, 
  CheckSquare, 
  Square, 
  Package, 
  Plus, 
  Trash2, 
  Scissors 
} from 'lucide-react';
import type { QuotationItem, FinishingMaterialItem } from '../QuotationManager';

interface QuotationPostPressTabProps {
  activeItem: QuotationItem;
  updateActiveItem: (patch: Partial<QuotationItem>) => void;
  activeCalc: any;
  postPressEquipment: any[];
  inventory: any[];
  onOpenPostPressModal: () => void;
  onOpenMaterialModal: () => void;
  formatCurrency: (val: number) => string;
  currentLang: string;
}

export const QuotationPostPressTab: React.FC<QuotationPostPressTabProps> = ({
  activeItem,
  updateActiveItem,
  activeCalc,
  postPressEquipment,
  inventory: _inventory,
  onOpenPostPressModal,
  onOpenMaterialModal,
  formatCurrency,
  currentLang,
}) => {
  const [postPressCategory, setPostPressCategory] = React.useState<'all' | 'cut' | 'fold' | 'laminat' | 'bind'>('all');

  const filteredPostPress = React.useMemo(() => {
    return postPressEquipment.filter(mach => {
      if (postPressCategory === 'all') return true;
      const cat = (mach.category || '').toLowerCase();
      const name = (mach.name || '').toLowerCase();
      if (postPressCategory === 'cut') return cat.includes('cut') || cat.includes('trim') || name.includes('ຕັດ') || name.includes('cut');
      if (postPressCategory === 'fold') return cat.includes('fold') || cat.includes('crease') || name.includes('ພັບ') || name.includes('crease');
      if (postPressCategory === 'laminat') return cat.includes('laminat') || name.includes('ເຄືອບ') || name.includes('laminat');
      if (postPressCategory === 'bind') return cat.includes('bind') || name.includes('ເຂົ້າເຫຼັ້ມ') || name.includes('binder');
      return true;
    });
  }, [postPressEquipment, postPressCategory]);

  const handleToggleActivePostPress = (machineId: string) => {
    const currentList = activeItem.selectedPostPressIds || [];
    const updated = currentList.includes(machineId)
      ? currentList.filter(id => id !== machineId)
      : [...currentList, machineId];
    updateActiveItem({ selectedPostPressIds: updated });
  };

  const handleAddFinishingMaterial = (customItem?: Partial<FinishingMaterialItem>) => {
    const currentList = activeItem.finishingMaterials || [];
    const pkgPrice = customItem?.packagePrice !== undefined ? customItem.packagePrice : 50000;
    const unitsPkg = customItem?.unitsPerPackage !== undefined ? customItem.unitsPerPackage : 1000;
    const isBox = customItem?.calcMode === 'box' || (customItem?.packagePrice !== undefined && customItem?.unitsPerPackage !== undefined);
    const resolvedUnitCost = customItem?.unitCost !== undefined 
      ? customItem.unitCost 
      : (isBox && unitsPkg > 0 ? Math.round(pkgPrice / unitsPkg) : 500);

    const newMat: FinishingMaterialItem = {
      id: `mat-${Date.now()}-${Math.random().toString().slice(-3)}`,
      name: customItem?.name || 'ວັດຖຸດິບຫຼັງພິມໃໝ່',
      calcMode: isBox ? 'box' : 'unit',
      packagePrice: pkgPrice,
      unitsPerPackage: unitsPkg,
      unitCost: resolvedUnitCost,
      qtyPerItem: customItem?.qtyPerItem !== undefined ? customItem.qtyPerItem : 1,
      unitName: customItem?.unitName || 'ອັນ',
      category: customItem?.category || 'other',
      materialId: customItem?.materialId,
    };
    updateActiveItem({
      finishingMaterials: [...currentList, newMat],
    });
  };

  const handleRemoveFinishingMaterial = (matId: string) => {
    const currentList = activeItem.finishingMaterials || [];
    updateActiveItem({
      finishingMaterials: currentList.filter(m => m.id !== matId),
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Post-Press Machinery */}
      <div id="sec-phase5" className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">5</span>
            <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
              {currentLang === 'lo' ? 'ວຽກຫຼັງພິມ & ເຄື່ອງຈັກ (Post-Press)' : 'Post-Press Machinery'}
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-sans flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            {activeItem.selectedPostPressIds?.length || 0} ວຽກ • {formatCurrency(activeCalc.postPressCost)}
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium pb-1">
            <span>ກົດເລືອກເຄື່ອງຈັກທີ່ຕ້ອງໃຊ້ສຳລັບງານນີ້:</span>
            <button
              type="button"
              onClick={onOpenPostPressModal}
              className="text-[10px] font-black text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Search className="w-3 h-3" />
              <span>ຄົ້ນຫາເຄື່ອງຈັກ ({postPressEquipment.length})</span>
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
            {[
              { id: 'all', label: currentLang === 'lo' ? 'ທັງໝົດ' : 'All' },
              { id: 'cut', label: currentLang === 'lo' ? 'ຕັດ/ຊອຍ' : 'Cutting' },
              { id: 'fold', label: currentLang === 'lo' ? 'ພັບ/ເສັ້ນພັບ' : 'Folding' },
              { id: 'laminat', label: currentLang === 'lo' ? 'ເຄືອບ' : 'Laminating' },
              { id: 'bind', label: currentLang === 'lo' ? 'ເຂົ້າເຫຼັ້ມ' : 'Binding' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setPostPressCategory(cat.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  postPressCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredPostPress.length > 0 ? (
              filteredPostPress.map((mach) => {
                const isSelected = (activeItem.selectedPostPressIds || []).includes(mach.id);
                const rate = Number((mach as any).costPerPage) || Number((mach as any).calculatedCostPerPage) || 300;
                const subCost = Math.round(rate * Math.max(1, activeItem.printVolume));

                return (
                  <div 
                    key={mach.id}
                    onClick={() => handleToggleActivePostPress(mach.id)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer select-none flex items-center justify-between ${
                      isSelected 
                        ? 'bg-amber-50/80 border-amber-400 shadow-xs' 
                        : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="text-xs font-black text-slate-900 block truncate">
                          {mach.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold block font-sans">
                          {formatCurrency(rate)} / ຫົວ
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className={`text-xs font-black font-sans block ${isSelected ? 'text-amber-950' : 'text-slate-400'}`}>
                        {isSelected ? `+${formatCurrency(subCost)}` : `${formatCurrency(0)}`}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500 font-medium">
                -- ບໍ່ມີເຄື່ອງຈັກໃນໝວດນີ້ --
              </div>
            )}
          </div>

          {/* Optional Controllable Guillotine Cutting Setup Flat Fee */}
          <div className={`p-3 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-2.5 text-xs ${
            activeItem.requiresGuillotineCut 
              ? 'bg-amber-50/90 border-amber-300 shadow-2xs' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <Scissors className={`w-4 h-4 shrink-0 ${activeItem.requiresGuillotineCut ? 'text-amber-700' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-slate-800 block">
                  {currentLang === 'lo' ? 'ຄ່າຕັ້ງເຄື່ອງຕັດ Guillotine (Flat Setup Fee):' : 'Guillotine Cutting Flat Setup Fee:'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {activeCalc.cutsPerSheet > 1
                    ? (currentLang === 'lo' ? `ງານມີການຕັດ ${activeCalc.cutsPerSheet} ຊິ້ນ/ແຜ່ນ ➜ ຄິດຄ່າຕັ້ງເຄື່ອງຕັດ 10,000 LAK/ຈັອບ` : `Requires multi-cut (${activeCalc.cutsPerSheet} cuts/sheet) ➜ Flat 10,000 LAK`)
                    : (currentLang === 'lo' ? 'ຕັດແຍກຂະໜາດພິເສດຕາມມາດຕະຖານ 10,000 LAK' : 'Optional flat 10,000 LAK fee')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeItem.requiresGuillotineCut && (
                <span className="font-mono font-black text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-lg text-xs">
                  +{formatCurrency(10000)}
                </span>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(activeItem.requiresGuillotineCut)}
                onClick={() => updateActiveItem({ requiresGuillotineCut: !activeItem.requiresGuillotineCut })}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer ${
                  activeItem.requiresGuillotineCut ? 'bg-amber-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
                    activeItem.requiresGuillotineCut ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Finishing Materials & Consumables */}
      <div id="sec-phase6" className={`border rounded-2xl overflow-hidden bg-white shadow-xs transition ${
        activeItem.activeModules?.finishingMaterials ? 'border-emerald-200/80' : 'border-slate-200 opacity-60'
      }`}>
        <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-sans font-black text-xs shadow-xs">6</span>
            <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
              {currentLang === 'lo' ? 'ວັດຖຸດິບຫຼັງພິມ & ອຸປະກອນສິ້ນເປືອງ (Consumables)' : 'Finishing Materials & Consumables'}
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-sans flex items-center gap-1">
            <Package className="w-3 h-3" />
            {(activeItem.finishingMaterials || []).length} ລາຍການ • {formatCurrency(activeCalc.finishingMaterialsCost)}
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Quick Add Consumables Pills */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-500 block">
                {currentLang === 'lo' ? 'ກົດເພີ່ມວັດຖຸດິບສຳເລັດຮູບດ່ວນ (ມີສູດຄິດໄລ່ຍົກກ່ອງ):' : 'Quick Add Consumables:'}
              </label>
              <button
                type="button"
                onClick={onOpenMaterialModal}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ຄົ້ນຫາວັດຖຸດິບໃນຄັງ</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'ລວດເຢັບແມັກ (#10)', calcMode: 'box' as const, packagePrice: 50000, unitsPerPackage: 1000, unitCost: 50, qtyPerItem: 2, unitName: 'ໂຕ', category: 'staple' },
                { name: 'ຫ່ວງກະດູກງູ Wire-O', calcMode: 'box' as const, packagePrice: 180000, unitsPerPackage: 100, unitCost: 1800, qtyPerItem: 1, unitName: 'ຂໍ້', category: 'wire' },
                { name: 'ກາວຮ້ອນສັນປຶ້ມ (Hot Melt)', calcMode: 'box' as const, packagePrice: 125000, unitsPerPackage: 250, unitCost: 500, qtyPerItem: 1, unitName: 'ກຣາມ', category: 'glue' },
                { name: 'ຟິມເຄືອບ BOPP Thermal', calcMode: 'box' as const, packagePrice: 400000, unitsPerPackage: 500, unitCost: 800, qtyPerItem: 1, unitName: 'ແຜ່ນ', category: 'film' },
                { name: 'ກ່ອງໃສ່ນາມບັດອະຄຣິລິກໃສ', calcMode: 'box' as const, packagePrice: 350000, unitsPerPackage: 100, unitCost: 3500, qtyPerItem: 1, unitName: 'ກ່ອງ', category: 'box' },
                { name: 'ຂາຕັ້ງປະຕິທິນແຂງ', calcMode: 'unit' as const, unitCost: 4500, qtyPerItem: 1, unitName: 'ອັນ', category: 'other' },
              ].map((matPreset) => (
                <button
                  key={matPreset.name}
                  type="button"
                  onClick={() => handleAddFinishingMaterial(matPreset)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3 h-3 text-emerald-600" />
                  <span>{matPreset.name} {matPreset.calcMode === 'box' ? `(${formatCurrency(matPreset.packagePrice)}/ກ່ອງ)` : `(${formatCurrency(matPreset.unitCost)})`}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Material Items Table / List with Box Breakdown Calculator */}
          <div className="space-y-3">
            {(activeItem.finishingMaterials || []).length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
                -- ບໍ່ມີວັດຖຸດິບຫຼັງການພິມສຳລັບລາຍການນີ້ --
              </div>
            ) : (
              (activeItem.finishingMaterials || []).map((mat, mIdx) => {
                const isBoxMode = mat.calcMode === 'box';
                const unitPrice = isBoxMode && (mat.unitsPerPackage || 0) > 0
                  ? Math.round(Number(mat.packagePrice || 0) / Number(mat.unitsPerPackage || 1))
                  : Number(mat.unitCost || 0);
                const costPerFinishedJob = Math.round(unitPrice * Number(mat.qtyPerItem || 1));
                const totalMatCost = Math.round(costPerFinishedJob * activeItem.printVolume);

                return (
                  <div key={mat.id || mIdx} className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-xs">
                    {/* Row Header: Name & Calculation Mode Switch */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex-1 min-w-[200px] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center shrink-0">
                          {mIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={mat.name}
                          onChange={(e) => {
                            const updated = [...(activeItem.finishingMaterials || [])];
                            updated[mIdx] = { ...updated[mIdx], name: e.target.value };
                            updateActiveItem({ finishingMaterials: updated });
                          }}
                          placeholder="ຊື່ວັດຖຸດິບ ເຊັ່ນ: ລວດເຢັບແມັກ..."
                          className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(activeItem.finishingMaterials || [])];
                              updated[mIdx] = { ...updated[mIdx], calcMode: 'box' };
                              updateActiveItem({ finishingMaterials: updated });
                            }}
                            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                              isBoxMode ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            ຄິດໄລ່ຍົກກ່ອງ (Box/Pack)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(activeItem.finishingMaterials || [])];
                              updated[mIdx] = { ...updated[mIdx], calcMode: 'unit' };
                              updateActiveItem({ finishingMaterials: updated });
                            }}
                            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                              !isBoxMode ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            ລາຄາຕໍ່ໜ່ວຍ (Per Unit)
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFinishingMaterial(mat.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Calculation Fields Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      {isBoxMode ? (
                        <>
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-bold text-slate-500 block">ລາຄາຕໍ່ກ່ອງ (LAK):</label>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={mat.packagePrice || 50000}
                              onChange={(e) => {
                                const pPrice = Math.max(0, Number(e.target.value));
                                const uPkg = Number(mat.unitsPerPackage || 1000);
                                const calculatedUnitCost = uPkg > 0 ? Math.round(pPrice / uPkg) : 0;
                                const updated = [...(activeItem.finishingMaterials || [])];
                                updated[mIdx] = { 
                                  ...updated[mIdx], 
                                  packagePrice: pPrice,
                                  unitCost: calculatedUnitCost
                                };
                                updateActiveItem({ finishingMaterials: updated });
                              }}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-right font-mono font-bold text-xs bg-slate-50"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[10px] font-bold text-slate-500 block">ຈຳນວນຕໍ່ 1 ກ່ອງ:</label>
                            <input
                              type="number"
                              min="1"
                              value={mat.unitsPerPackage || 1000}
                              onChange={(e) => {
                                const uPkg = Math.max(1, Number(e.target.value));
                                const pPrice = Number(mat.packagePrice || 0);
                                const calculatedUnitCost = Math.round(pPrice / uPkg);
                                const updated = [...(activeItem.finishingMaterials || [])];
                                updated[mIdx] = { 
                                  ...updated[mIdx], 
                                  unitsPerPackage: uPkg,
                                  unitCost: calculatedUnitCost
                                };
                                updateActiveItem({ finishingMaterials: updated });
                              }}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg text-right font-mono font-bold text-xs bg-slate-50"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-0.5 col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 block">ຕົ້ນທຶນຕໍ່ 1 ໜ່ວຍ (LAK):</label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={mat.unitCost || 0}
                            onChange={(e) => {
                              const updated = [...(activeItem.finishingMaterials || [])];
                              updated[mIdx] = { ...updated[mIdx], unitCost: Math.max(0, Number(e.target.value)) };
                              updateActiveItem({ finishingMaterials: updated });
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-right font-mono font-bold text-xs bg-slate-50"
                          />
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-500 block">ຈຳນວນໃຊ້ຕໍ່ 1 ຊິ້ນງານ:</label>
                        <input
                          type="number"
                          min="1"
                          value={mat.qtyPerItem}
                          onChange={(e) => {
                            const updated = [...(activeItem.finishingMaterials || [])];
                            updated[mIdx] = { ...updated[mIdx], qtyPerItem: Math.max(1, Number(e.target.value)) };
                            updateActiveItem({ finishingMaterials: updated });
                          }}
                          className="w-full px-2 py-1 border border-emerald-300 bg-emerald-50/50 rounded-lg text-center font-mono font-black text-xs text-emerald-950"
                        />
                      </div>

                      <div className="space-y-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex flex-col justify-center text-right">
                        <span className="text-[9px] text-slate-400 block">
                          {isBoxMode ? `(${formatCurrency(unitPrice)}/ອັນ × ${mat.qtyPerItem})` : 'ຕົ້ນທຶນລວມ:'}
                        </span>
                        <span className="text-xs font-black text-emerald-700 font-mono">
                          {formatCurrency(totalMatCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => handleAddFinishingMaterial()}
            className="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{currentLang === 'lo' ? 'ເພີ່ມວັດຖຸດິບໃໝ່' : 'Add Custom Material'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
