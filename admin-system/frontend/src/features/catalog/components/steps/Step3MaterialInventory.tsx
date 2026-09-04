import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Check, 
  X, 
  LayoutGrid, 
  ListFilter, 
  Sliders, 
  Percent, 
  Layers, 
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  Tag,
  PackageSearch,
  Boxes
} from 'lucide-react';
import { SpecGroup, PublicProductOption, FeaturesConfig } from '../../types';
import { useApp } from '@store/AppContext';
import { fetchMaterials } from '@features/inventory/api/inventoryApi';
import { MaterialMaster } from '@features/inventory/types';
import { useQuery } from '@tanstack/react-query';

export interface Step3MaterialInventoryProps {
  specGroups: SpecGroup[];
  setSpecGroups: React.Dispatch<React.SetStateAction<SpecGroup[]>>;
  targetMarginPercent: number;
  featuresConfig?: FeaturesConfig;
  setFeaturesConfig?: React.Dispatch<React.SetStateAction<FeaturesConfig>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Step3MaterialInventory: React.FC<Step3MaterialInventoryProps> = ({
  specGroups,
  setSpecGroups,
  targetMarginPercent,
  featuresConfig,
  setFeaturesConfig,
  showToast,
}) => {
  const { inventory } = useApp();

  // Fetch backend materials
  const { data: backendMaterials = [] } = useQuery<MaterialMaster[]>({
    queryKey: ['materials'],
    queryFn: fetchMaterials,
  });

  // Unified materials merging Backend DB + AppContext Warehouse Inventory
  const materials: MaterialMaster[] = useMemo(() => {
    const map = new Map<string, MaterialMaster>();

    // 1. Load from AppContext warehouse inventory
    (inventory || []).forEach((inv: any) => {
      const sku = inv.sku || inv.id || '';
      if (sku) {
        // Multi-tier cost per consumption unit fallback
        let unitCost = Number(
          inv.costPerConsumptionUnit ?? 
          inv.cost_per_consumption_unit ?? 
          inv.costPerSheet ?? 
          inv.costPerUnit ?? 
          inv.unitPrice ?? 
          inv.batches?.[0]?.costPerSheet ??
          inv.technical_specs?.costPerSheet ??
          0
        );

        if (!unitCost && inv.costPerPurchaseUnit && inv.purchaseMultiplier && Number(inv.purchaseMultiplier) > 0) {
          unitCost = Math.round(Number(inv.costPerPurchaseUnit) / Number(inv.purchaseMultiplier));
        }

        map.set(sku, {
          id: inv.id || sku,
          sku: sku,
          name: inv.name || sku,
          category: inv.category || 'Paper',
          stock_qty: Number(inv.stockQty ?? inv.stock_qty ?? 0),
          consumption_unit: inv.consumptionUnit || inv.consumption_unit || 'ແຜ່ນ',
          purchase_unit: inv.purchaseUnit || inv.purchase_unit || 'ແພັກ',
          purchase_multiplier: Number(inv.purchaseMultiplier ?? inv.purchase_multiplier ?? 1),
          cost_per_purchase_unit: Number(inv.costPerPurchaseUnit ?? inv.cost_per_purchase_unit ?? 0),
          cost_per_consumption_unit: unitCost,
          reorder_threshold: Number(inv.reorderThreshold ?? inv.minStockThreshold ?? 10),
          min_stock_alert: Number(inv.minStockAlert ?? 10),
          stock_status: inv.stockStatus || 'IN_STOCK',
          is_active: inv.isActive !== false,
        } as any);
      }
    });

    // 2. Overlay backend database materials
    (backendMaterials || []).forEach((mat: any) => {
      if (mat.sku) {
        let unitCost = Number(
          mat.cost_per_consumption_unit ?? 
          mat.costPerConsumptionUnit ?? 
          mat.costPerSheet ?? 
          mat.costPerUnit ?? 
          mat.unitPrice ??
          mat.technical_specs?.costPerSheet ??
          0
        );

        if (!unitCost && mat.cost_per_purchase_unit && mat.purchase_multiplier && Number(mat.purchase_multiplier) > 0) {
          unitCost = Math.round(Number(mat.cost_per_purchase_unit) / Number(mat.purchase_multiplier));
        }

        const existing = map.get(mat.sku);
        map.set(mat.sku, {
          ...(existing || {}),
          ...mat,
          id: mat.id || existing?.id || mat.sku,
          sku: mat.sku,
          name: mat.name || existing?.name || mat.sku,
          category: mat.category || existing?.category || 'Paper',
          stock_qty: Number(mat.stock_qty ?? mat.stockQty ?? existing?.stock_qty ?? 0),
          consumption_unit: mat.consumption_unit || mat.consumptionUnit || existing?.consumption_unit || 'ແຜ່ນ',
          cost_per_consumption_unit: unitCost || existing?.cost_per_consumption_unit || 0,
        });
      }
    });

    return Array.from(map.values());
  }, [backendMaterials, inventory]);

  // Material Finder Modal State
  const [pickerTarget, setPickerTarget] = useState<{
    isOpen: boolean;
    groupId: string;
    optIdx: number;
    search: string;
    categoryTab: string;
  }>({
    isOpen: false,
    groupId: '',
    optIdx: -1,
    search: '',
    categoryTab: 'ALL',
  });

  // Filtered materials for picker
  const filteredPickerMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchText = (m.name || '').toLowerCase().includes(pickerTarget.search.toLowerCase()) ||
                        (m.sku || '').toLowerCase().includes(pickerTarget.search.toLowerCase());
      if (pickerTarget.categoryTab === 'ALL') return matchText;
      return matchText && (m.category || '').toUpperCase().includes(pickerTarget.categoryTab.toUpperCase());
    });
  }, [materials, pickerTarget.search, pickerTarget.categoryTab]);

  const materialGroups = useMemo(() => {
    return specGroups.filter(g => 
      g.groupType === 'material' || 
      g.groupType === 'cover_paper' || 
      g.groupType === 'inner_paper' ||
      g.id.includes('material') || 
      g.id.includes('paper') ||
      g.id.startsWith('group_mat') || 
      g.id.startsWith('group_art') || 
      g.id.startsWith('group_stk')
    );
  }, [specGroups]);

  // Ensure at least 1 material group exists in Step 3
  React.useEffect(() => {
    if (materialGroups.length === 0) {
      const defaultMatGroup: SpecGroup = {
        id: `group_mat_default`,
        titleLo: 'ເນື້ອເຈ້ຍ / ວັດສະດຸພື້ນຖານ (Paper Stock)',
        titleEn: 'Paper Material Stock',
        displayType: 'cards',
        groupType: 'material',
        options: [
          {
            optionType: 'material',
            label: 'Green Read Paper',
            labelLo: 'Green Read Paper (ເຈ້ຍຖະໜອມສາຍຕາ)',
            labelEn: 'Green Read Paper',
            value: 'green_read_paper',
            materialSku: 'PAP-4108',
            isDefault: true,
            extraCostRate: 200,
            addPrice: 0,
          }
        ]
      };
      setSpecGroups(prev => [...prev, defaultMatGroup]);
    }
  }, [materialGroups.length, setSpecGroups]);

  // Add a new Material Group
  const handleAddMaterialGroup = () => {
    const newGroup: SpecGroup = {
      id: `group_mat_${Date.now() % 10000}`,
      titleLo: 'ກຸ່ມວັດສະດຸໃໝ່ (Paper & Stock)',
      titleEn: 'Material / Paper Stock',
      displayType: 'cards',
      groupType: 'material',
      options: [
        {
          optionType: 'material',
          label: 'Option 1',
          labelLo: 'ຕົວເລືອກ 1',
          labelEn: 'Option 1',
          value: `mat_${Date.now() % 1000}`,
          isDefault: true,
          extraCostRate: 0,
          addPrice: 0,
        }
      ]
    };
    setSpecGroups(prev => [...prev, newGroup]);
    showToast('ເພີ່ມກຸ່ມວັດສະດຸໃໝ່ຮຽບຮ້ອຍ', 'success');
  };

  // Remove group by ID
  const handleRemoveGroup = (groupId: string) => {
    setSpecGroups(prev => prev.filter(g => g.id !== groupId));
  };

  // Update group fields by ID
  const handleGroupFieldChange = (groupId: string, field: string, val: any) => {
    setSpecGroups(prev => prev.map(g => g.id === groupId ? { ...g, [field]: val } : g));
  };

  // Add Option to Group by ID
  const handleAddOption = (groupId: string) => {
    setSpecGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        options: [
          ...g.options,
          {
            optionType: 'material',
            label: 'ຕົວເລືອກໃໝ່',
            labelLo: 'ຕົວເລືອກໃໝ່',
            labelEn: 'New Option',
            value: `opt_${Date.now() % 10000}`,
            isDefault: false,
            extraCostRate: 0,
            addPrice: 0,
          }
        ]
      };
    }));
  };

  // Remove Option by ID
  const handleRemoveOption = (groupId: string, oIdx: number) => {
    setSpecGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        options: g.options.filter((_, idx) => idx !== oIdx)
      };
    }));
  };

  // Update Option field by ID
  const handleOptionFieldChange = (groupId: string, oIdx: number, field: string, val: any) => {
    setSpecGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const nextOptions = [...g.options];
      const opt = { ...nextOptions[oIdx], [field]: val };
      if (field === 'isDefault' && val === true) {
        nextOptions.forEach((o, i) => {
          if (i !== oIdx) o.isDefault = false;
        });
      }
      nextOptions[oIdx] = opt;
      return {
        ...g,
        options: nextOptions,
      };
    }));
  };

  // Select Material from Warehouse SKU
  const handleApplyMaterial = (groupId: string, oIdx: number, mat: MaterialMaster) => {
    setSpecGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const nextOptions = [...g.options];
      const opt = {
        ...nextOptions[oIdx],
        materialSku: mat.sku,
        materialId: mat.id,
        extraCostRate: Number(mat.cost_per_consumption_unit || 0),
        costPerUnit: Number(mat.cost_per_consumption_unit || 0),
        stockQty: Number(mat.stock_qty || 0),
        labelLo: mat.name,
        label: mat.name,
        labelEn: nextOptions[oIdx]?.labelEn || mat.sku,
        addPrice: 0,
      };
      nextOptions[oIdx] = opt as any;
      return {
        ...g,
        options: nextOptions,
      };
    }));

    setPickerTarget(prev => ({ ...prev, isOpen: false }));
    showToast(`ຜູກ SKU ${mat.sku} (ຕົ້ນທຶນ: ${(mat.cost_per_consumption_unit || 0).toLocaleString()} ₭/ແຜ່ນ) ສຳເລັດ`, 'success');
  };

  // Quick Preset: Art Card Group
  const loadArtCardPreset = () => {
    const artGroup: SpecGroup = {
      id: `group_artcard_${Date.now() % 10000}`,
      titleLo: 'ກະດາດອາດກາດ (Art Card Paper)',
      titleEn: 'Art Card Paper Stock',
      displayType: 'cards',
      groupType: 'material',
      options: [
        { optionType: 'material', label: 'ອາດກາດ 260g (ມາດຕະຖານ)', labelLo: 'ອາດກາດ 260g (ມາດຕະຖານ)', labelEn: '260gsm Art Card', value: 'art_260', materialSku: 'MAT-ART-260', isDefault: true, extraCostRate: 850, addPrice: 0 },
        { optionType: 'material', label: 'ອາດກາດ 300g (ໜາພິເສດ)', labelLo: 'ອາດກາດ 300g (ໜາພິເສດ)', labelEn: '300gsm Art Card', value: 'art_300', materialSku: 'MAT-ART-300', isDefault: false, extraCostRate: 1100, addPrice: 0 },
        { optionType: 'material', label: 'ອາດກາດ 350g (ພຣີມ້ຽມ)', labelLo: 'ອາດກາດ 350g (ພຣີມ້ຽມ)', labelEn: '350gsm Art Card', value: 'art_350', materialSku: 'MAT-ART-350', isDefault: false, extraCostRate: 1400, addPrice: 0 },
      ]
    };
    setSpecGroups(prev => [...prev, artGroup]);
    showToast('ໂຫຼດເທມເພລດອາດກາດສຳເລັດ', 'info');
  };

  // Quick Preset: Sticker Stocks
  const loadStickerPreset = () => {
    const stickerGroup: SpecGroup = {
      id: `group_sticker_${Date.now() % 10000}`,
      titleLo: 'ປະເພດສະຕິກເກີ (Sticker Material)',
      titleEn: 'Sticker Material Stock',
      displayType: 'cards',
      groupType: 'material',
      options: [
        { optionType: 'material', label: 'ສະຕິກເກີເຈ້ຍ (Paper Sticker)', labelLo: 'ສະຕິກເກີເຈ້ຍ (Paper)', labelEn: 'Paper Sticker', value: 'stk_paper', materialSku: 'MAT-STK-PAPER', isDefault: true, extraCostRate: 900, addPrice: 0 },
        { optionType: 'material', label: 'ສະຕິກເກີ PP ຂາວເງົາ (PP Gloss)', labelLo: 'ສະຕິກເກີ PP ຂາວເງົາ ກັນນ້ຳ', labelEn: 'PP Gloss Waterproof', value: 'stk_pp_gloss', materialSku: 'MAT-STK-PP-G', isDefault: false, extraCostRate: 1500, addPrice: 0 },
        { optionType: 'material', label: 'ສະຕິກເກີ PP ຂາວດ້ານ (PP Matte)', labelLo: 'ສະຕິກເກີ PP ຂາວດ້ານ ກັນນ້ຳ', labelEn: 'PP Matte Waterproof', value: 'stk_pp_matte', materialSku: 'MAT-STK-PP-M', isDefault: false, extraCostRate: 1600, addPrice: 0 },
        { optionType: 'material', label: 'ສະຕິກເກີ PVC ໃສ (Clear PVC)', labelLo: 'ສະຕິກເກີ PVC ໃສ ກັນນ້ຳ 100%', labelEn: 'Clear PVC Waterproof', value: 'stk_pvc_clear', materialSku: 'MAT-STK-PVC-C', isDefault: false, extraCostRate: 2200, addPrice: 0 },
      ]
    };
    setSpecGroups(prev => [...prev, stickerGroup]);
    showToast('ໂຫຼດເທມເພລດສະຕິກເກີສຳເລັດ', 'info');
  };

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 bg-white border border-slate-200/90 rounded-3xl shadow-xs text-slate-900">
        <div className="space-y-1">
          <h2 className="text-base font-black flex items-center gap-2 text-slate-900">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <span>ຂັ້ນຕອນທີ 3: ຄັງວັດຖຸດິບ & ຜູກ SKU ສະຕັອກ (Raw Material & Inventory Linker)</span>
          </h2>
          <p className="text-xs text-slate-500">
            ຜູກ SKU ເຈ້ຍ ຫຼື ສະຕິກເກີ ຈາກຄັງສິນຄ້າຈິງ ເພື່ອດຶງຕົ້ນທຶນ ແລະ ຄຳນວອນສ່ວນຕ່າງລາຄາ (+₭ Delta Price) ຕາມ Margin {targetMarginPercent}%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-mono font-bold">
            {materials.length} Materials in Stock
          </span>
        </div>
      </div>

      {/* Quick Preset Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white border border-slate-200/90 rounded-3xl shadow-xs">
        <button
          type="button"
          onClick={loadArtCardPreset}
          className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 text-left transition flex items-center justify-between group shadow-xs cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-emerald-600">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>ເຈ້ຍອາດກາດ (Art Card 260g-350g)</span>
            </span>
            <span className="text-[11px] text-slate-400">ເໝາະສຳລັບໂປສເຕີ, ປົກປຶ້ມ, ນາມບັດ</span>
          </div>
          <Plus className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition" />
        </button>

        <button
          type="button"
          onClick={loadStickerPreset}
          className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 text-left transition flex items-center justify-between group shadow-xs cursor-pointer"
        >
          <div>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-emerald-600">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>ສະຕິກເກີ (PP, PVC, Paper)</span>
            </span>
            <span className="text-[11px] text-slate-400">ກັນນ້ຳ, ຂາວເງົາ, ຂາວດ້ານ, ໃສ</span>
          </div>
          <Plus className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition" />
        </button>

        <button
          type="button"
          onClick={handleAddMaterialGroup}
          className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ສ້າງກຸ່ມວັດສະດຸໃໝ່ເອງ</span>
        </button>
      </div>

      {/* Material Groups List (Render ONLY Material Groups) */}
      {materialGroups.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl p-8 space-y-3">
          <Package className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">ຍັງບໍ່ທັນມີກຸ່ມວັດສະດຸໃນສິນຄ້ານີ້</h3>
          <p className="text-xs text-slate-400">ກົດເລືອກໂຫຼດເທມເພລດດ້ານເທິງ ຫຼື ກົດປຸ່ມ + ສ້າງກຸ່ມວັດສະດຸໃໝ່ເອງ</p>
        </div>
      ) : (
        <div className="space-y-6">
          {materialGroups.map((group, gIdx) => (
            <div
              key={group.id || gIdx}
              className="p-6 bg-white border border-slate-200/90 rounded-3xl space-y-4 shadow-xs hover:border-slate-300 transition-all"
            >
              {/* Group Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-7 h-7 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black font-mono shadow-xs">
                    {gIdx + 1}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                    <input
                      type="text"
                      value={group.titleLo}
                      onChange={(e) => handleGroupFieldChange(group.id, 'titleLo', e.target.value)}
                      placeholder="ຊື່ກຸ່ມ (ພາສາລາວ) ເຊັ່ນ: ກະດາດປົກ"
                      className="px-3.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                    />
                    <input
                      type="text"
                      value={group.titleEn}
                      onChange={(e) => handleGroupFieldChange(group.id, 'titleEn', e.target.value)}
                      placeholder="Group Title (EN) e.g. Cover Stock"
                      className="px-3.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                    />
                  </div>
                </div>

                {/* Display Type & Delete Group */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => handleGroupFieldChange(group.id, 'displayType', 'cards')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                        group.displayType === 'cards'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Cards
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGroupFieldChange(group.id, 'displayType', 'dropdown')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                        group.displayType === 'dropdown'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      Dropdown
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(group.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="ລຶບກຸ່ມນີ້"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options Table / Rows */}
              <div className="space-y-3 pl-1">
                {group.options.map((opt, oIdx) => {
                  const selectedMat = materials.find(m => m.sku === opt.materialSku);

                  return (
                    <div
                      key={oIdx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-50/70 border border-slate-200 rounded-2xl items-center shadow-xs"
                    >
                      {/* Default Radio & Labels */}
                      <div className="sm:col-span-4">
                        <div className="flex gap-2 items-center">
                          <label className="flex items-center cursor-pointer" title="ຕັ້ງເປັນຕົວເລືອກເລີ່ມຕົ້ນ (Default Base)">
                            <input
                              type="radio"
                              name={`default_opt_${group.id}`}
                              checked={opt.isDefault ?? false}
                              onChange={() => handleOptionFieldChange(group.id, oIdx, 'isDefault', true)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </label>

                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={opt.labelLo || opt.label}
                              onChange={(e) => {
                                handleOptionFieldChange(group.id, oIdx, 'labelLo', e.target.value);
                                handleOptionFieldChange(group.id, oIdx, 'label', e.target.value);
                              }}
                              placeholder="ຊື່ຕົວເລືອກ (ລາວ) ເຊັ່ນ: ເຈ້ຍ Art 300g"
                              className="w-full px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                            />
                            <input
                              type="text"
                              value={opt.labelEn || ''}
                              onChange={(e) => handleOptionFieldChange(group.id, oIdx, 'labelEn', e.target.value)}
                              placeholder="Option (EN) e.g. 300gsm Art Card"
                              className="w-full px-2.5 py-0.5 text-[11px] bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Material SKU Linker & Live Stock */}
                      <div className="sm:col-span-4">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={opt.materialSku || ''}
                            onChange={(e) => {
                              const found = materials.find(m => m.sku === e.target.value);
                              if (found) handleApplyMaterial(group.id, oIdx, found);
                            }}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono font-medium text-slate-800 truncate cursor-pointer shadow-2xs focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                          >
                            <option value="">-- ເລືອກ SKU ວັດສະດຸຈາກຄັງ --</option>
                            {materials.map((m) => (
                              <option key={m.sku} value={m.sku}>
                                [{m.category}] {m.sku}: {m.name} ({m.cost_per_consumption_unit?.toLocaleString() || 0} ₭)
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => setPickerTarget({ isOpen: true, groupId: group.id, optIdx: oIdx, search: '', categoryTab: 'ALL' })}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex-shrink-0 transition shadow-xs cursor-pointer"
                            title="ຄົ້ນຫາວັດສະດຸລະອຽດ"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {selectedMat && (
                          <div className="flex items-center gap-2 mt-1 px-1 text-[10px] font-mono text-slate-500">
                            <span className={selectedMat.stock_qty <= (selectedMat.reorder_threshold ?? (selectedMat as any).reorder_point ?? 10) ? 'text-amber-500 font-bold' : 'text-emerald-600 font-medium'}>
                              ສະຕັອກ: {selectedMat.stock_qty.toLocaleString()} {selectedMat.consumption_unit || 'ແຜ່ນ'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actual Base Unit Cost & Imposition (ຕົ້ນທຶນ & ການຕັດແບ່ງ) */}
                      <div className="sm:col-span-3">
                        <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-600">
                            <span>ຕົ້ນທຶນແຜ່ນໃຫຍ່:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {(selectedMat?.cost_per_consumption_unit || opt.extraCostRate || 0).toLocaleString()} ₭
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-600">
                            <span>ແບ່ງໄດ້ (N-Up):</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px]">÷</span>
                              <input
                                type="number"
                                min={1}
                                value={(opt as any).cutsPerSheet || 1}
                                onChange={(e) => {
                                  const n = Math.max(1, parseInt(e.target.value) || 1);
                                  handleOptionFieldChange(group.id, oIdx, 'cutsPerSheet', n);
                                  const masterCost = selectedMat?.cost_per_consumption_unit || opt.extraCostRate || 0;
                                  handleOptionFieldChange(group.id, oIdx, 'extraCostRate', Math.round(masterCost / n));
                                }}
                                className="w-12 px-1 py-0.5 text-center text-xs font-mono font-bold bg-white border border-emerald-300 rounded-lg text-emerald-700"
                                title="1 ແຜ່ນໃຫຍ່ຕັດໄດ້ຈັກຊິ້ນງານ (Imposition Yield)"
                              />
                              <span className="text-[9px]">ຊິ້ນ</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
                            <span className="text-[10px] font-bold text-emerald-800">ຕົ້ນທຶນ/ຊິ້ນ:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={opt.extraCostRate ?? 0}
                                onChange={(e) => handleOptionFieldChange(group.id, oIdx, 'extraCostRate', parseFloat(e.target.value) || 0)}
                                className="w-16 px-1 py-0.5 text-xs font-mono font-black text-emerald-700 bg-transparent text-right border-b border-dashed border-emerald-400 focus:outline-none"
                                placeholder="0"
                              />
                              <span className="text-xs font-mono font-black text-emerald-700">₭</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Remove Option Button */}
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(group.id, oIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                          title="ລຶບຕົວເລືອກນີ້"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handleAddOption(group.id)}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-200 hover:border-emerald-400 rounded-2xl text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5 hover:bg-emerald-50/50 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ເພີ່ມແຖວຕົວເລືອກວັດສະດຸໃນກຸ່ມນີ້ (Add Material Row)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Universal Material Finder Modal */}
      {pickerTarget.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs border border-indigo-100">
                  <PackageSearch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    ຄົ້ນຫາ & ເລືອກວັດສະດຸຈາກຄັງ (Material Finder)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ເລືອກ SKU ວັດສະດຸເພື່ອຜູກກັບຕົວເລືອກ ແລະ ຄຳນວອນຕົ້ນທຶນອັດຕະໂນມັດ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerTarget(prev => ({ ...prev, isOpen: false }))}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar & Filter Tabs */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={pickerTarget.search}
                  onChange={(e) => setPickerTarget(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="ພິມຊື່ວັດສະດຸ ຫຼື SKU ເຊັ່ນ: Art 260g, MAT-STK-PP..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-sky/30 focus:border-accent-sky"
                  autoFocus
                />
                {pickerTarget.search && (
                  <button
                    type="button"
                    onClick={() => setPickerTarget(prev => ({ ...prev, search: '' }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['ALL', 'Paper', 'Sticker', 'Board', 'Ink', 'Other'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPickerTarget(prev => ({ ...prev, categoryTab: cat }))}
                    className={`px-3 py-1 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                      pickerTarget.categoryTab === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Materials List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
              {filteredPickerMaterials.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  ບໍ່ພົບລາຍການວັດສະດຸທີ່ກົງກັບຄຳຄົ້ນຫາ
                </div>
              ) : (
                filteredPickerMaterials.map((mat) => {
                  const isLowStock = mat.stock_qty <= 100;
                  return (
                    <div
                      key={mat.sku}
                      onClick={() => handleApplyMaterial(pickerTarget.groupId, pickerTarget.optIdx, mat)}
                      className="p-3.5 bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl flex items-center justify-between cursor-pointer transition group shadow-xs hover:shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                            {mat.sku}
                          </span>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                            {mat.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                            {mat.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>ສະຕັອກ:</span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {mat.stock_qty.toLocaleString()} {mat.consumption_unit || 'ແຜ່ນ'}
                            {isLowStock && ' (ໃກ້ໝົດ)'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div>
                          <span className="text-sm font-mono font-black text-slate-900 block">
                            {mat.cost_per_consumption_unit?.toLocaleString()} ₭
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            / {mat.consumption_unit || 'ແຜ່ນ'}
                          </span>
                        </div>
                        <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition">
                          ເລືອກ →
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
