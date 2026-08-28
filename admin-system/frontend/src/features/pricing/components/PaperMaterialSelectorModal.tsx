import React, { useState, useMemo } from 'react';
import { Search, Check, Filter, Layers, FileText, AlertCircle, ChevronDown, Package } from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import type { InventoryItem } from '../../../types';

interface PaperMaterialSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (paperId: string) => void;
  selectedPaperId?: string;
  papers: InventoryItem[];
  title?: string;
  targetType?: 'cover' | 'inner' | 'general';
  formatCurrency: (amount: number) => string;
  getFIFOCostPerSheet?: (paperId: string, qty: number) => number;
}

export const PaperMaterialSelectorModal: React.FC<PaperMaterialSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedPaperId,
  papers,
  title,
  targetType = 'general',
  formatCurrency,
  getFIFOCostPerSheet
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('ALL');

  // Dynamically extract categories and sizes from inventory papers
  const dynamicCategories = useMemo(() => {
    const defaultCats = [
      { id: 'ALL', label: 'ທຸກໝວດໝູ່ (All Categories)' },
      { id: 'GENERAL', label: 'ເຈ້ຍທົ່ວໄປ / ປອນ (Bond/Woodfree)' },
      { id: 'ART_GLOSS', label: 'ເຈ້ຍອາດມັນ (Art Glossy)' },
      { id: 'ART_MATTE', label: 'ເຈ້ຍອາດດ້ານ (Art Matte)' },
      { id: 'CARD_GLOSSY', label: 'ເຈ້ຍກາດ / ກລັອດຊີ (Card/Glossy)' },
      { id: 'STICKER', label: 'ເຈ້ຍສະຕິກເກີ (Sticker/Label)' },
      { id: 'ROLL', label: 'ເຈ້ຍມ້ວນ (Roll Substrate)' },
      { id: 'KRAFT_BOX', label: 'ເຈ້ຍຄຣາຟ / ກ່ອງ (Kraft/Boxboard)' },
    ];
    return defaultCats;
  }, []);

  const dynamicSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    papers.forEach(p => {
      const sz = p.specs?.size || p.specs?.standardSize;
      if (sz && typeof sz === 'string' && sz.trim()) {
        sizeSet.add(sz.toUpperCase().trim());
      }
    });

    const standardSizes = ['A4', 'A3', 'A3+', 'A5', '31X43', 'ROLL'];
    standardSizes.forEach(s => sizeSet.add(s));

    return [
      { id: 'ALL', label: 'ທຸກຂະໜາດ (All Sizes)' },
      ...Array.from(sizeSet).map(s => ({ id: s, label: s }))
    ];
  }, [papers]);

  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku || p.id || '').toLowerCase();
      const brand = (p.specs?.brand || p.brand || '').toLowerCase();
      const pType = (p.specs?.paperType || p.specs?.paper_type || '').toLowerCase();
      const pSize = (p.specs?.size || p.specs?.standardSize || '').toLowerCase();
      const gsmStr = `${p.gsm || p.specs?.grammageGsm || p.specs?.grammage || ''}`;

      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = name.includes(q) || sku.includes(q) || brand.includes(q) || pType.includes(q) || pSize.includes(q) || gsmStr.includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Category Dropdown Filter
      if (selectedCategory !== 'ALL') {
        const combinedType = `${name} ${pType} ${p.category || ''}`.toLowerCase();
        if (selectedCategory === 'GENERAL') {
          if (!combinedType.includes('bond') && !combinedType.includes('woodfree') && !combinedType.includes('ປອນ') && !combinedType.includes('double a 80') && !combinedType.includes('70g') && !combinedType.includes('80g') && !combinedType.includes('ທົ່ວໄປ')) return false;
        } else if (selectedCategory === 'ART_GLOSS') {
          if (!combinedType.includes('art') && !combinedType.includes('gloss') && !combinedType.includes('ອາດມັນ') && !combinedType.includes('ອາດ')) return false;
        } else if (selectedCategory === 'ART_MATTE') {
          if (!combinedType.includes('matte') && !combinedType.includes('ດ້ານ') && !combinedType.includes('ອາດດ້ານ')) return false;
        } else if (selectedCategory === 'CARD_GLOSSY') {
          if (!combinedType.includes('card') && !combinedType.includes('photo') && !combinedType.includes('glossy') && !combinedType.includes('ກາດ') && !combinedType.includes('260') && !combinedType.includes('300')) return false;
        } else if (selectedCategory === 'STICKER') {
          if (!combinedType.includes('sticker') && !combinedType.includes('label') && !combinedType.includes('ສະຕິກເກີ') && !combinedType.includes('pp')) return false;
        } else if (selectedCategory === 'ROLL') {
          if (!combinedType.includes('roll') && !combinedType.includes('ມ້ວນ') && p.specs?.paper_format !== 'roll') return false;
        } else if (selectedCategory === 'KRAFT_BOX') {
          if (!combinedType.includes('kraft') && !combinedType.includes('box') && !combinedType.includes('duplex') && !combinedType.includes('ຄຣາຟ') && !combinedType.includes('ກ່ອງ')) return false;
        }
      }

      // 3. Size Dropdown Filter
      if (selectedSizeFilter !== 'ALL') {
        const combinedSize = `${name} ${pSize}`.toUpperCase();
        if (selectedSizeFilter === 'A4' && !combinedSize.includes('A4')) return false;
        if (selectedSizeFilter === 'A3' && !combinedSize.includes('A3') && !combinedSize.includes('297X420')) return false;
        if (selectedSizeFilter === 'A3+' && !combinedSize.includes('A3+') && !combinedSize.includes('320X480') && !combinedSize.includes('330X483')) return false;
        if (selectedSizeFilter === 'A5' && !combinedSize.includes('A5')) return false;
        if (selectedSizeFilter === '31X43' && !combinedSize.includes('31X43') && !combinedSize.includes('ຕັດ') && !combinedSize.includes('PARENT')) return false;
        if (selectedSizeFilter === 'ROLL' && !combinedSize.includes('ROLL') && !combinedSize.includes('ມ້ວນ') && p.specs?.paper_format !== 'roll') return false;
        if (!['A4', 'A3', 'A3+', 'A5', '31X43', 'ROLL'].includes(selectedSizeFilter)) {
          if (!combinedSize.includes(selectedSizeFilter)) return false;
        }
      }

      return true;
    });
  }, [papers, searchQuery, selectedCategory, selectedSizeFilter]);

  if (!isOpen) return null;

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<FileText className="w-5 h-5 text-white" />}
      title={title || (targetType === 'cover' ? 'ຄົ້ນຫາ & ເລືອກເຈ້ຍໜ້າປົກ' : 'ຄົ້ນຫາ & ເລືອກເຈ້ຍເນື້ອໃນ')}
      subtitle="ຄົ້ນຫາວັດຖຸດິບເຈ້ຍໃນສາງ ພ້ອມກວດສອບສະຕັອກ ແລະ ຕົ້ນທຶນ FIFO ແບບລະອຽດ"
      maxWidthClass="max-w-5xl"
      badgeText={`${filteredPapers.length} ລາຍການ`}
      footerActions={
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            ກົດເລືອກເຈ້ຍທີ່ຕ້ອງການ ເພື່ອນຳໄປໃຊ້ໃນການຄິດໄລ່ຕົ້ນທຶນທັນທີ
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
        {/* Search & Dynamic Filters Container */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາຊື່ເຈ້ຍ, ແກຣມ (gsm), ລະຫັດ SKU, ຫຼື ຍີ່ຫໍ້..."
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

          {/* Dynamic Dropdowns Row: Category + Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Category Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-sky-600" />
                <span>ໝວດໝູ່ເຈ້ຍ (Category):</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-accent-sky focus:bg-white transition appearance-none cursor-pointer"
                >
                  {dynamicCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Size Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>ຂະໜາດເຈ້ຍ (Paper Size):</span>
              </label>
              <div className="relative">
                <select
                  value={selectedSizeFilter}
                  onChange={(e) => setSelectedSizeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-accent-sky focus:bg-white transition appearance-none cursor-pointer"
                >
                  {dynamicSizes.map(sz => (
                    <option key={sz.id} value={sz.id}>
                      {sz.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        <div className="space-y-2.5">
          {filteredPapers.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">ບໍ່ພົບລາຍການເຈ້ຍທີ່ຕົງກັບເງື່ອນໄຂ</p>
              <p className="text-xs text-slate-400">ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ເລືອກໝວດໝູ່ທັງໝົດ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[52vh] overflow-y-auto pr-1">
              {filteredPapers.map((paper) => {
                const isSelected = selectedPaperId === paper.id;
                const mult = Number(paper.purchaseMultiplier || (paper as any).purchase_multiplier || 500);
                const rawStock = paper.stockQty !== undefined ? paper.stockQty : (paper.stock_qty || 0);
                const stock = (rawStock > 0 && rawStock <= 100) ? rawStock * mult : rawStock;
                const pCost = Number(paper.costPerPurchaseUnit || (paper as any).cost_per_purchase_unit || 95000);
                const rawCons = Number(paper.costPerConsumptionUnit || (paper as any).cost_per_consumption_unit || paper.costPerSheet || 0);
                const fallbackPrice = (rawCons > 0 && (mult <= 1 || rawCons < (pCost / 2)))
                  ? rawCons
                  : (mult > 0 && pCost > 0 ? (pCost / mult) : rawCons);

                const fifoCost = getFIFOCostPerSheet ? getFIFOCostPerSheet(paper.id, 1) : 0;
                const price = (fifoCost > 0 && (mult <= 1 || fifoCost < (pCost / 2))) ? fifoCost : fallbackPrice;
                const gsm = paper.gsm || paper.specs?.grammageGsm || paper.specs?.grammage;
                const size = paper.specs?.size || paper.specs?.standardSize || 'A4';
                const isLowStock = stock <= (paper.minStockThreshold || 100);


                return (
                  <div
                    key={paper.id}
                    onClick={() => {
                      onSelect(paper.id);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-50/90 border-sky-500 shadow-md ring-2 ring-sky-400/20'
                        : 'bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Row: Name + Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-slate-900 font-sans block">
                              {paper.name}
                            </span>
                            {gsm && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold font-sans">
                                {gsm} gsm
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                            ຂະໜາດ: <strong>{size}</strong> {paper.specs?.brand ? `• ຍີ່ຫໍ້: ${paper.specs.brand}` : ''} • SKU: {paper.sku || paper.id}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3" /> ເລືອກຢູ່
                          </span>
                        )}
                      </div>

                      {/* Middle Row: Stock Status */}
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-bold">
                        <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          <Package className="w-3 h-3 shrink-0" />
                          <span>ຄັງເຫຼືອ: {Number(stock).toLocaleString()} ແຜ່ນ</span>
                        </span>
                        {paper.category && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {paper.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Cost Price Breakdown */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {fifoCost > 0 ? 'ຕົ້ນທຶນ FIFO ຈິງ:' : 'ຕົ້ນທຶນ/ແຜ່ນ:'}
                      </span>
                      <span className="text-xs font-black text-slate-950 font-sans">
                        {formatCurrency(price)}
                      </span>
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
