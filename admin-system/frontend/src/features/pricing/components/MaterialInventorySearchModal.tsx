import React, { useState, useMemo } from 'react';
import { Search, Package, AlertCircle, Plus, Filter } from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import type { InventoryItem } from '../../../types';
import type { FinishingMaterialItem } from '../data/defaultTemplates';

interface MaterialInventorySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (material: FinishingMaterialItem) => void;
  inventory: InventoryItem[];
  formatCurrency: (amount: number) => string;
}

export const MaterialInventorySearchModal: React.FC<MaterialInventorySearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  inventory,
  formatCurrency
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const consumableItems = useMemo(() => {
    return inventory.filter(item => {
      const cat = (item.category || '').toLowerCase();
      const isConsumable = cat.includes('raw_material') || cat.includes('consumable') || cat.includes('supply') || cat.includes('packaging') || cat.includes('finishing') || cat.includes('ink') || true;
      return isConsumable;
    });
  }, [inventory]);

  const filteredMaterials = useMemo(() => {
    return consumableItems.filter(item => {
      const name = (item.name || '').toLowerCase();
      const sku = (item.sku || item.id || '').toLowerCase();
      const brand = (item.specs?.brand || item.brand || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = name.includes(q) || sku.includes(q) || brand.includes(q) || cat.includes(q);
        if (!matches) return false;
      }

      if (selectedCategory !== 'ALL') {
        const combined = `${name} ${cat} ${brand}`.toLowerCase();
        if (selectedCategory === 'STAPLE' && !combined.includes('staple') && !combined.includes('ລວດ') && !combined.includes('ແມັກ')) return false;
        if (selectedCategory === 'WIRE' && !combined.includes('wire') && !combined.includes('ຫ່ວງ') && !combined.includes('ກະດູກງູ')) return false;
        if (selectedCategory === 'GLUE' && !combined.includes('glue') && !combined.includes('ກາວ') && !combined.includes('melt')) return false;
        if (selectedCategory === 'FILM' && !combined.includes('film') && !combined.includes('ຟິມ') && !combined.includes('bopp') && !combined.includes('ເຄືອບ')) return false;
        if (selectedCategory === 'BOX' && !combined.includes('box') && !combined.includes('ກ່ອງ') && !combined.includes('package')) return false;
      }

      return true;
    });
  }, [consumableItems, searchQuery, selectedCategory]);

  const handleSelectItem = (item: InventoryItem) => {
    const pkgPrice = Number(item.costPerPurchaseUnit || item.unitPrice || 50000);
    const multiplier = Number(item.purchaseMultiplier || 1);
    const unitPrice = multiplier > 1 ? Math.round(pkgPrice / multiplier) : (Number(item.costPerConsumptionUnit || item.unitCost || 50));

    const finishingItem: FinishingMaterialItem = {
      id: `mat-${Date.now()}-${Math.random().toString().slice(-4)}`,
      name: item.name,
      calcMode: multiplier > 1 ? 'box' : 'unit',
      packagePrice: pkgPrice,
      unitsPerPackage: multiplier > 1 ? multiplier : 100,
      unitCost: unitPrice,
      qtyPerItem: 1,
      unitName: item.consumptionUnit || 'ອັນ',
      category: (item.category as any) || 'other',
    };

    onSelect(finishingItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Package className="w-5 h-5 text-white" />}
      title="ຄົ້ນຫາວັດຖຸດິບ & ອຸປະກອນສິ້ນເປືອງຈາກຄັງ (Consumables Inventory)"
      subtitle="ດຶງວັດຖຸດິບຫຼັງພິມ (ລວດ, ຫ່ວງ, ກາວ, ຟິມ, ກ່ອງ) ຈາກຄັງມາຄຳນວນຕົ້ນທຶນອັດຕະໂນມັດ"
      maxWidthClass="max-w-5xl"
      badgeText={`${filteredMaterials.length} ລາຍການ`}
      footerActions={
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            ກົດເລືອກວັດຖຸດິບເພື່ອເພີ່ມເຂົ້າໃນລາຍການຄິດໄລ່ຕົ້ນທຶນ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            ປິດໜ້າຕ່າງ
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search & Category Filter */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາຊື່ວັດຖຸດິບ, ລະຫັດ SKU, ຍີ່ຫໍ້ (ລວດແມັກ, ຫ່ວງກະດູກງູ, ກາວຮ້ອນ, ຟິມເຄືອບ, ກ່ອງ...)"
              className="w-full pl-10 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-accent-sky focus:bg-white transition"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 bg-slate-200 rounded"
              >
                ລ້າງ
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-accent-sky" />
              <span>ໝວດໝູ່:</span>
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'ທັງໝົດ' },
                { id: 'STAPLE', label: 'ລວດແມັກ (Staple)' },
                { id: 'WIRE', label: 'ຫ່ວງກະດູກງູ (Wire-O)' },
                { id: 'GLUE', label: 'ກາວຮ້ອນ (Glue)' },
                { id: 'FILM', label: 'ຟິມເຄືອບ (Lamination Film)' },
                { id: 'BOX', label: 'ກ່ອງ/ບັນຈຸພັນ (Box/Pack)' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedCategory(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedCategory === t.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="space-y-2.5">
          {filteredMaterials.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">ບໍ່ພົບວັດຖຸດິບທີ່ຄົ້ນຫາ</p>
              <p className="text-xs text-slate-400">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກໝວດໝູ່ທັງໝົດ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[52vh] overflow-y-auto pr-1">
              {filteredMaterials.map(item => {
                const pkgPrice = Number(item.costPerPurchaseUnit || item.unitPrice || 0);
                const multiplier = Number(item.purchaseMultiplier || 1);
                const unitPrice = multiplier > 1 ? Math.round(pkgPrice / multiplier) : (Number(item.costPerConsumptionUnit || item.unitCost || 0));
                const stock = item.stockQty !== undefined ? item.stockQty : (item.stock_qty || 0);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="p-4 rounded-2xl border-2 border-slate-200/90 bg-white hover:border-accent-sky hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-slate-900 font-sans block">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            SKU: {item.sku || item.id} {item.specs?.brand ? `• ${item.specs.brand}` : ''}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 text-xs font-black flex items-center gap-1 hover:bg-sky-600 hover:text-white transition shrink-0">
                          <Plus className="w-3.5 h-3.5" /> ເພີ່ມ
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium flex-wrap">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-sans font-bold">
                          {item.category || 'Consumable'}
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold">
                          ຄົງເຫຼືອ: {Number(stock).toLocaleString()} {item.consumptionUnit || 'ໜ່ວຍ'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        {multiplier > 1 && (
                          <span className="text-[10px] text-slate-400 block">
                            {formatCurrency(pkgPrice)} / ກ່ອງ ({multiplier} {item.consumptionUnit})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">ຕົ້ນທຶນຕໍ່ໜ່ວຍ</span>
                        <span className="text-xs font-black text-slate-950 font-sans">
                          {formatCurrency(unitPrice)} / {item.consumptionUnit || 'ອັນ'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FormModalTemplate>
  );
};
