import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  PackageMinus, 
  Search, 
  AlertCircle, 
  AlertTriangle, 
  Check, 
  Layers, 
  Droplet, 
  Wrench, 
  FileText, 
  Package,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { FormModalTemplate } from '@components/common/FormModalTemplate';

interface StockDischargeModalProps {
  item?: any;
  isOpen: boolean;
  onClose: () => void;
  onDischarged?: () => void;
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
  if (u === 'ml' || u === 'ມິນລິລິດ' || u === 'ມລ') return 'ml';
  if (u === 'ອັນ' || u === 'piece' || u === 'pcs' || u === 'ชิ้น') return 'ອັນ';
  return unit;
};

export default function StockDischargeModal({ item, isOpen, onClose, onDischarged }: StockDischargeModalProps) {
  const { inventory, dischargeInventoryStock, showToast } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const isLao = currentLang === 'lo';

  const [selectedSkuId, setSelectedSkuId] = useState(item?.id || (inventory[0]?.id || ''));
  const [dischargeQty, setDischargeQty] = useState<number>(1);
  const [reason, setReason] = useState('PRINT_PRODUCTION');
  const [remarks, setRemarks] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Sync selected item when prop changes
  useEffect(() => {
    if (item?.id) {
      setSelectedSkuId(item.id);
    } else if (!selectedSkuId && inventory.length > 0) {
      setSelectedSkuId(inventory[0].id);
    }
  }, [item, inventory]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  const targetItem = useMemo(() => {
    return inventory.find(i => i.id === selectedSkuId || i.sku === selectedSkuId) || item || inventory[0];
  }, [inventory, selectedSkuId, item]);

  const maxStock = targetItem ? Number(targetItem.stockQty ?? targetItem.stock_qty ?? 0) : 0;
  const isOutOfStock = maxStock <= 0;
  const unitLabel = normalizeLaoUnit(targetItem?.consumptionUnit || targetItem?.unit || targetItem?.purchaseUnit);

  // Filtered Inventory for Search
  const filteredInventory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return inventory.filter(inv => {
      const name = (inv.name || '').toLowerCase();
      const id = (inv.id || '').toLowerCase();
      const sku = (inv.sku || '').toLowerCase();
      const cat = (inv.category || '').toLowerCase();
      const brand = (inv.brand || inv.specs?.brand || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || id.includes(q) || sku.includes(q) || cat.includes(q) || brand.includes(q);
      if (!matchesSearch) return false;

      if (categoryFilter === 'ALL') return true;
      if (categoryFilter === 'PAPER') return cat.includes('paper') || cat.includes('ເຈ້ຍ') || cat.includes('material');
      if (categoryFilter === 'INK') return cat.includes('ink') || cat.includes('ໝຶກ') || cat.includes('toner');
      if (categoryFilter === 'SPARE_PARTS') return cat.includes('spare') || cat.includes('part') || cat.includes('ອະໄຫຼ່') || Boolean(inv.isSparePart);
      if (categoryFilter === 'OTHER') {
        const isPaper = cat.includes('paper') || cat.includes('ເຈ້ຍ') || cat.includes('material');
        const isInk = cat.includes('ink') || cat.includes('ໝຶກ') || cat.includes('toner');
        const isSpare = cat.includes('spare') || cat.includes('part') || cat.includes('ອະໄຫຼ່') || Boolean(inv.isSparePart);
        return !isPaper && !isInk && !isSpare;
      }
      return true;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const handleSelectMaterial = (invItem: any) => {
    setSelectedSkuId(invItem.id || invItem.sku);
    setDischargeQty(1);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleQuickQty = (amount: number) => {
    setDischargeQty(Math.min(maxStock, Math.max(1, amount)));
  };

  const handleMaxQty = () => {
    if (maxStock > 0) {
      setDischargeQty(maxStock);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetItem) {
      showToast(isLao ? 'ກະລຸນາເລືອກວັດຖຸດິບ' : 'Please select a material SKU', 'error');
      return;
    }

    if (dischargeQty <= 0) {
      showToast(isLao ? 'ຈຳນວນຕ້ອງຫຼາຍກວ່າ 0' : 'Discharge quantity must be greater than 0', 'error');
      return;
    }

    if (dischargeQty > maxStock) {
      showToast(isLao ? 'ຈຳນວນເບີກເກີນສະຕ໋ອກທີ່ມີຢູ່ໃນສາງ!' : 'Discharge quantity exceeds available stock!', 'error');
      return;
    }

    dischargeInventoryStock(targetItem.id || targetItem.sku, dischargeQty, reason, remarks);
    showToast(isLao ? 'ບັນທຶກການເບີກ ແລະ ຕັດສະຕ໋ອກຮຽບຮ້ອຍແລ້ວ!' : 'Stock discharged successfully!', 'success');

    if (onDischarged) onDischarged();
    onClose();
  };

  const getItemCategoryIcon = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('paper') || cat.includes('ເຈ້ຍ')) return <FileText className="w-4 h-4 text-amber-500" />;
    if (cat.includes('ink') || cat.includes('ໝຶກ')) return <Droplet className="w-4 h-4 text-sky-500" />;
    if (cat.includes('spare') || cat.includes('part') || cat.includes('ອະໄຫຼ່')) return <Wrench className="w-4 h-4 text-indigo-500" />;
    return <Package className="w-4 h-4 text-slate-500" />;
  };

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<PackageMinus className="w-5 h-5 text-white" />}
      title={isLao ? 'ເບີກໃຊ້ງານ / ຕັດສະຕ໋ອກວັດຖຸດິບ (Stock Discharge)' : 'Stock Discharge Form'}
      subtitle={isLao ? 'ບັນທຶກການເບີກວັດຖຸດິບອອກຈາກສາງ, ຕັດສະຕ໋ອກຕາມຈຳນວນຈິງ ແລະ ບັນທຶກປະຫວັດການເບີກ' : 'Deduct inventory stock with reason and audit trail'}
      badgeText="DISCHARGE"
      maxWidthClass="max-w-3xl"
      footerActions={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            {isLao ? 'ຍົກເລີກ' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isOutOfStock || dischargeQty <= 0 || dischargeQty > maxStock}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 ${
              isOutOfStock || dischargeQty <= 0 || dischargeQty > maxStock
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-slate-900 to-rose-950 hover:from-slate-800 hover:to-rose-900 text-white shadow-rose-900/20'
            }`}
          >
            <PackageMinus className="w-4 h-4 text-rose-400" />
            <span>{isLao ? 'ຢືນຢັນການເບີກ / ຕັດສະຕ໋ອກ' : 'Confirm Discharge'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Material SKU Search & Selection Combobox */}
        <div className="space-y-1.5" ref={searchDropdownRef}>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <span>{isLao ? 'ເລືອກວັດຖຸດິບ (Select Material SKU) *' : 'Select Material SKU *'}</span>
            </label>
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>{isSearchOpen ? (isLao ? 'ປິດການຄົ້ນຫາ' : 'Close Search') : (isLao ? 'ຄົ້ນຫາ / ປ່ຽນວັດຖຸດິບ' : 'Search / Change')}</span>
            </button>
          </div>

          {/* Search Box Input (Visible when search is opened or when no item selected) */}
          {isSearchOpen && (
            <div className="p-3 bg-white border border-sky-300 rounded-2xl shadow-md space-y-2.5 animate-fade-in">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isLao ? 'ຄົ້ນຫາຊື່ວັດຖຸດິບ, ລະຫັດ SKU, ໝວດໝູ່...' : 'Search material name, SKU, category...'}
                  autoFocus
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {[
                  { id: 'ALL', label: isLao ? 'ທັງໝົດ' : 'All' },
                  { id: 'PAPER', label: isLao ? 'ເຈ້ຍ' : 'Paper' },
                  { id: 'INK', label: isLao ? 'ນ້ຳມຶກ' : 'Ink' },
                  { id: 'SPARE_PARTS', label: isLao ? 'ອະໄຫຼ່' : 'Spare Parts' },
                  { id: 'OTHER', label: isLao ? 'ອື່ນໆ' : 'Others' },
                ].map(cat => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                      categoryFilter === cat.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Dropdown Results List */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl bg-slate-50/50">
                {filteredInventory.length === 0 ? (
                  <div className="p-4 text-center text-xs font-bold text-slate-400 flex flex-col items-center gap-1">
                    <AlertCircle className="w-5 h-5 text-slate-300" />
                    <span>{isLao ? 'ບໍ່ພົບວັດຖຸດິບທີ່ກົງກັບຄຳຄົ້ນຫາ' : 'No materials match your query'}</span>
                  </div>
                ) : (
                  filteredInventory.map(inv => {
                    const isSelected = (inv.id === selectedSkuId || inv.sku === selectedSkuId);
                    const stock = Number(inv.stockQty ?? inv.stock_qty ?? 0);
                    const unit = normalizeLaoUnit(inv.consumptionUnit || inv.unit || inv.purchaseUnit);

                    return (
                      <div
                        key={inv.id || inv.sku}
                        onClick={() => handleSelectMaterial(inv)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-sky-50 text-sky-900 border-l-4 border-sky-500'
                            : 'hover:bg-white hover:shadow-2xs text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                            {getItemCategoryIcon(inv.category)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs block text-slate-900 truncate">{inv.name}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                              <span>SKU: {inv.sku || inv.id}</span>
                              {inv.category && (
                                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-sans font-semibold">
                                  {inv.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg inline-block ${
                            stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {stock.toLocaleString()} {unit}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Currently Selected Material Display Card */}
          {targetItem && (
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                  {getItemCategoryIcon(targetItem.category)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900 text-sm">{targetItem.name}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold rounded-md">
                      SKU: {targetItem.sku || targetItem.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span className="text-slate-500 font-medium">
                      {isLao ? 'ໝວດໝູ່:' : 'Category:'} <b className="text-slate-700">{targetItem.category || '-'}</b>
                    </span>
                    {targetItem.costPerConsumptionUnit > 0 && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        • {Number(targetItem.costPerConsumptionUnit).toLocaleString()} LAK/{unitLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action to change */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(prev => !prev)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                {isLao ? 'ປ່ຽນ' : 'Change'}
              </button>
            </div>
          )}
        </div>

        {/* Current Stock Availability Info Banner */}
        {targetItem && (
          <div className={`p-3.5 rounded-2xl flex items-center justify-between border ${
            isOutOfStock
              ? 'bg-rose-50/90 border-rose-200 text-rose-950'
              : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-center gap-2.5">
              {isOutOfStock ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <Package className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <div>
                <span className="text-xs font-black block">
                  {isLao ? 'ສະຕ໋ອກທີ່ມີຢູ່ໃນສາງ (Available Stock):' : 'Available Stock in Warehouse:'}
                </span>
                {isOutOfStock && (
                  <span className="text-[11px] font-bold text-rose-600">
                    {isLao ? 'ວັດຖຸດິບໝົດສາງ ບໍ່ສາມາດເບີກໄດ້!' : 'Item is out of stock!'}
                  </span>
                )}
              </div>
            </div>
            <span className={`font-mono font-black text-base px-3 py-1 rounded-xl ${
              isOutOfStock ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {maxStock.toLocaleString()} {unitLabel}
            </span>
          </div>
        )}

        {/* Discharge Quantity and Reason Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Discharge Quantity Input & Quick Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                {isLao ? 'ຈຳນວນທີ່ຕ້ອງການເບີກ (Discharge Quantity) *' : 'Discharge Quantity *'}
              </label>
              {maxStock > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  {[1, 10, 50, 100].filter(n => n < maxStock).map(n => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => handleQuickQty(n)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono font-bold rounded cursor-pointer"
                    >
                      +{n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleMaxQty}
                    className="px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded cursor-pointer"
                  >
                    {isLao ? 'ເບີກໝົດ' : 'Max'}
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={maxStock > 0 ? maxStock : 1}
                value={dischargeQty}
                onChange={(e) => setDischargeQty(Math.max(1, Number(e.target.value)))}
                required
                disabled={isOutOfStock}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-black text-slate-900 text-base focus:bg-white focus:border-rose-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
              <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400">
                {unitLabel}
              </span>
            </div>
            {dischargeQty > maxStock && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{isLao ? 'ຈຳນວນເບີກເກີນສະຕ໋ອກທີ່ມີຢູ່ໃນສາງ!' : 'Discharge quantity exceeds available stock!'}</span>
              </p>
            )}
          </div>

          {/* Reason / Purpose Select (100% Lao) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              {isLao ? 'ສາເຫດ / ຈຸດປະສົງການເບີກ (Reason / Purpose) *' : 'Reason / Purpose *'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-none cursor-pointer h-[42px]"
            >
              <option value="PRINT_PRODUCTION">
                {isLao ? 'ເບີກໄປພິມງານລູກຄ້າ (Print Production Job)' : 'Print Production Job'}
              </option>
              <option value="INTERNAL_USE">
                {isLao ? 'ເບີກໃຊ້ງານພາຍໃນອົງກອນ (Internal Usage)' : 'Internal Usage'}
              </option>
              <option value="TESTING_SAMPLE">
                {isLao ? 'ເບີກທົດສອບເຄື່ອງ / ຕົວຢ່າງ (Testing / Sample)' : 'Testing / Sample'}
              </option>
              <option value="DAMAGED_WASTAGE">
                {isLao ? 'ເຈ້ຍເສຍ / ຊຳລຸດເສຍຫາຍ (Damaged / Wastage)' : 'Damaged / Wastage'}
              </option>
              <option value="STOCK_ADJUSTMENT">
                {isLao ? 'ປັບປຸງຍອດສະຕ໋ອກ / ນັບສາງ (Stock Adjustment)' : 'Stock Adjustment'}
              </option>
              <option value="OTHER">
                {isLao ? 'ອື່ນໆ (Other)' : 'Other'}
              </option>
            </select>
          </div>
        </div>

        {/* Remarks / Order Ref (100% Lao) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
            {isLao ? 'ໝາຍເຫດ / ເລກທີອໍເດີ (Remarks / Order Ref)' : 'Remarks / Order Ref'}
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={isLao ? 'ລະບຸເລກທີອໍເດີ ຫຼື ໝາຍເຫດເພີ່ມເຕີມ...' : 'Order ID or additional notes...'}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-xs text-slate-800 focus:bg-white focus:border-rose-500 focus:outline-none"
          />
        </div>
      </form>
    </FormModalTemplate>
  );
}
