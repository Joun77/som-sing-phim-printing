import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Scissors, 
  Search, 
  FileText, 
  Calculator, 
  Layers, 
  AlertCircle, 
  Package, 
  Check,
  Sparkles,
  Archive
} from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';
import { FormModalTemplate } from '@components/common/FormModalTemplate';

interface AddOffcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialParentPaperId?: string;
}

const PRESET_SIZES = [
  { label: 'A5 (148 × 210 mm)', width: 148, height: 210 },
  { label: 'A6 (105 × 148 mm)', width: 105, height: 148 },
  { label: '13×19" Half (330 × 240 mm)', width: 330, height: 240 },
  { label: '10×15 cm (100 × 150 mm)', width: 100, height: 150 },
  { label: 'Custom (ກຳນົດເອງ)', width: 0, height: 0 },
];

export const AddOffcutModal: React.FC<AddOffcutModalProps> = ({
  isOpen,
  onClose,
  initialParentPaperId = '',
}) => {
  const { inventory, addOffcut, showToast, formatCurrency } = useApp();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const isLao = currentLang === 'lo';
  const formatLAK = formatCurrency;

  const papersOnly = useMemo(() => {
    return inventory.filter(i => {
      const cat = (i.category || '').toLowerCase();
      return cat === 'paper' || cat === 'material' || cat.includes('ເຈ້ຍ');
    });
  }, [inventory]);

  const [parentPaperId, setParentPaperId] = useState<string>(initialParentPaperId || papersOnly[0]?.id || '');
  const [name, setName] = useState<string>('');
  const [widthMm, setWidthMm] = useState<number>(148);
  const [heightMm, setHeightMm] = useState<number>(210);
  const [grammageGsm, setGrammageGsm] = useState<number>(260);
  const [paperType, setPaperType] = useState<string>('Art Card');
  const [paperSurface, setPaperSurface] = useState<string>('Gloss');
  const [qty, setQty] = useState<number>(50);
  const [costPerSheet, setCostPerSheet] = useState<number>(400);
  const [notes, setNotes] = useState<string>('ຊັ້ນວາງເສດເຈ້ຍ A-01');

  // Searchable Parent Paper State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Sync initial parent paper
  useEffect(() => {
    if (initialParentPaperId) {
      setParentPaperId(initialParentPaperId);
    } else if (!parentPaperId && papersOnly.length > 0) {
      setParentPaperId(papersOnly[0].id);
    }
  }, [initialParentPaperId, papersOnly]);

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

  // When parent paper changes, auto-fill specs and calculate pro-rated cost
  useEffect(() => {
    const parent = papersOnly.find(p => p.id === parentPaperId);
    if (parent) {
      const gsm = Number(parent.specs?.grammage || parent.specs?.grammageGsm || 260);
      const type = parent.specs?.paperType || parent.specs?.paper_type || 'Art Card';
      const surface = parent.specs?.paperSurface || 'Gloss';
      setGrammageGsm(gsm);
      setPaperType(type);
      setPaperSurface(surface);

      // Auto Pro-rated Cost Calculation:
      const parentWidth = Number(parent.specs?.width_mm || 320);
      const parentHeight = Number(parent.specs?.height_mm || 480);
      const parentArea = Math.max(1, parentWidth * parentHeight);
      const offcutArea = Math.max(1, widthMm * heightMm);
      const parentSheetCost = Number(parent.costPerConsumptionUnit || 1900);
      const proRatedCost = Math.round((offcutArea / parentArea) * parentSheetCost);

      setCostPerSheet(Math.max(50, proRatedCost));
      setName(`ເສດ ${type} ${gsm}gsm (${widthMm}x${heightMm}mm)`);
    }
  }, [parentPaperId, widthMm, heightMm, papersOnly]);

  const selectedParent = useMemo(() => {
    return papersOnly.find(p => p.id === parentPaperId) || papersOnly[0];
  }, [papersOnly, parentPaperId]);

  // Filtered Papers for Search
  const filteredPapers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return papersOnly;
    return papersOnly.filter(p => {
      const pName = (p.name || '').toLowerCase();
      const pSku = (p.sku || p.id || '').toLowerCase();
      const pBrand = (p.brand || p.specs?.brand || '').toLowerCase();
      const pGsm = String(p.specs?.grammage || p.specs?.grammageGsm || '');
      return pName.includes(q) || pSku.includes(q) || pBrand.includes(q) || pGsm.includes(q);
    });
  }, [papersOnly, searchQuery]);

  if (!isOpen) return null;

  const handleSelectParentPaper = (p: any) => {
    setParentPaperId(p.id);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleApplyPreset = (preset: typeof PRESET_SIZES[0]) => {
    if (preset.width > 0 && preset.height > 0) {
      setWidthMm(preset.width);
      setHeightMm(preset.height);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || qty <= 0 || widthMm <= 0 || heightMm <= 0) {
      showToast(isLao ? 'ກະລຸນາປ້ອນຂໍ້ມູນເສດເຈ້ຍໃຫ້ຄົບຖ້ວນ!' : 'Please fill all required offcut fields!', 'warning');
      return;
    }

    addOffcut({
      name,
      paperId: parentPaperId,
      qty: Number(qty),
      widthMm: Number(widthMm),
      heightMm: Number(heightMm),
      dimensionFormatted: `${widthMm} × ${heightMm} mm`,
      grammageGsm: Number(grammageGsm),
      paperType,
      paperSurface,
      costPerSheet: Number(costPerSheet),
      notes
    });

    showToast(isLao ? 'ບັນທຶກເສດເຈ້ຍເຂົ້າສາງສິນຄ້າສຳເລັດ!' : 'Offcut paper saved successfully!', 'success');
    onClose();
  };

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Scissors className="w-5 h-5 text-white" />}
      title={isLao ? 'ບັນທຶກເສດເຈ້ຍເຂົ້າສາງ (Save Offcut to Inventory)' : 'Save Offcut to Inventory'}
      subtitle={isLao ? 'ບັນທຶກເສດເຈ້ຍທີ່ເຫຼືອຈາກການຜະລິດເຂົ້າສາງ ເພື່ອນຳກັບມາໃຊ້ພິມງານຂະໜາດນ້ອຍ ຫຼື ງານດ່ວນ' : 'Catalog remnant sheets for small print jobs & scrap reuse'}
      badgeText="OFFCUT"
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
            disabled={qty <= 0 || widthMm <= 0 || heightMm <= 0}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2 ${
              qty <= 0 || widthMm <= 0 || heightMm <= 0
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white shadow-indigo-900/20'
            }`}
          >
            <Scissors className="w-4 h-4 text-indigo-400" />
            <span>{isLao ? 'ບັນທຶກເສດເຈ້ຍເຂົ້າສາງ' : 'Save Offcut to Inventory'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Origin Parent Paper Searchable Combobox */}
        <div className="space-y-1.5" ref={searchDropdownRef}>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isLao ? 'ເຈ້ຍຕົ້ນທາງ (Origin Parent Paper) *' : 'Origin Parent Paper *'}</span>
            </label>
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>{isSearchOpen ? (isLao ? 'ປິດການຄົ້ນຫາ' : 'Close Search') : (isLao ? 'ຄົ້ນຫາ / ປ່ຽນເຈ້ຍຕົ້ນທາງ' : 'Search / Change')}</span>
            </button>
          </div>

          {/* Search Box Input */}
          {isSearchOpen && (
            <div className="p-3 bg-white border border-sky-300 rounded-2xl shadow-md space-y-2.5 animate-fade-in">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isLao ? 'ຄົ້ນຫາຊື່ເຈ້ຍຕົ້ນທາງ, ລະຫັດ SKU, แกรม...' : 'Search parent paper name, SKU, GSM...'}
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

              {/* Dropdown Results List */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl bg-slate-50/50">
                {filteredPapers.length === 0 ? (
                  <div className="p-4 text-center text-xs font-bold text-slate-400 flex flex-col items-center gap-1">
                    <AlertCircle className="w-5 h-5 text-slate-300" />
                    <span>{isLao ? 'ບໍ່ພົບເຈ້ຍທີ່ກົງກັບຄຳຄົ້ນຫາ' : 'No paper matches your search'}</span>
                  </div>
                ) : (
                  filteredPapers.map(p => {
                    const isSelected = p.id === parentPaperId;
                    const stock = Number(p.stockQty ?? p.stock_qty ?? 0);
                    const cost = Number(p.costPerConsumptionUnit || 0);
                    const gsm = p.specs?.grammage || p.specs?.grammageGsm;

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectParentPaper(p)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500'
                            : 'hover:bg-white hover:shadow-2xs text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-amber-600 shadow-2xs">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs block text-slate-900 truncate">{p.name}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                              <span>SKU: {p.sku || p.id}</span>
                              {gsm && <span>• {gsm}gsm</span>}
                              {cost > 0 && <span>• {formatLAK(cost)}/ແຜ່ນ</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg inline-block ${
                            stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {stock.toLocaleString()} ແຜ່ນ
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Currently Selected Parent Paper Display Card */}
          {selectedParent && (
            <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900 text-sm">{selectedParent.name}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold rounded-md">
                      SKU: {selectedParent.sku || selectedParent.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium flex-wrap">
                    <span>
                      {isLao ? 'ຕົ້ນທຶນແຜ່ນໃຫຍ່:' : 'Parent Sheet Cost:'} <b className="text-slate-800 font-mono">{formatLAK(selectedParent.costPerConsumptionUnit || 0)}/ແຜ່ນ</b>
                    </span>
                    <span>•</span>
                    <span>
                      {isLao ? 'ສະຕ໋ອກຄົງເຫຼືອ:' : 'Stock:'} <b className="text-emerald-700 font-mono">{Number(selectedParent.stockQty ?? selectedParent.stock_qty ?? 0).toLocaleString()} ແຜ່ນ</b>
                    </span>
                  </div>
                </div>
              </div>

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

        {/* Preset Sizes Bar */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
            {isLao ? 'ເລືອກຂະໜາດເສດເຈ້ຍມາດຕະຖານ (Preset Sizes)' : 'Standard Offcut Preset Sizes'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PRESET_SIZES.map((preset) => {
              const isActive = widthMm === preset.width && heightMm === preset.height;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-2.5 rounded-xl border text-xs font-black transition cursor-pointer text-center truncate ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                  }`}
                >
                  {preset.label.split(' ')[0]}
                  {preset.width > 0 && (
                    <span className="block text-[10px] font-mono text-slate-400 font-semibold mt-0.5">
                      {preset.width}×{preset.height}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dimensions Width x Height Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              {isLao ? 'ຄວາມກວ້າງ (Width mm) *' : 'Width (mm) *'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                required
                value={widthMm}
                onChange={(e) => setWidthMm(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-black text-slate-900 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
              <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400">mm</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              {isLao ? 'ຄວາມຍາວ (Height mm) *' : 'Height (mm) *'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                required
                value={heightMm}
                onChange={(e) => setHeightMm(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-black text-slate-900 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
              <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400">mm</span>
            </div>
          </div>
        </div>

        {/* Offcut Description Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
            {isLao ? 'ຊື່ລາຍການເສດເຈ້ຍ (Offcut Title) *' : 'Offcut Title *'}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ເສດ Art Card 260gsm A5"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Quantity & Pro-rated Unit Cost Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              {isLao ? 'ຈຳນວນແຜ່ນເສດ (Sheets) *' : 'Offcut Quantity (Sheets) *'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-black text-slate-900 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
              <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400">ແຜ່ນ</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              {isLao ? 'ຕົ້ນທຶນປະເມີນ/ແຜ່ນ (LAK) *' : 'Pro-rated Cost / Sheet (LAK) *'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                required
                value={costPerSheet}
                onChange={(e) => setCostPerSheet(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-black text-emerald-700 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
              <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-400">LAK/ແຜ່ນ</span>
            </div>
          </div>
        </div>

        {/* Valuation Summary Card */}
        <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 text-emerald-950 font-bold">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black block">{isLao ? 'ມູນຄ່າເສດເຈ້ຍລວມ:' : 'Total Remnant Value:'}</span>
              <span className="text-[11px] text-emerald-700 font-medium">
                {qty} ແຜ່ນ × {formatLAK(costPerSheet)}
              </span>
            </div>
          </div>
          <span className="font-mono font-black text-emerald-800 text-base">
            {formatLAK(costPerSheet * qty)}
          </span>
        </div>

        {/* Notes / Storage Location */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
            {isLao ? 'ບ່ອນຈັດເກັບ / ໝາຍເຫດ (Storage Shelf & Notes)' : 'Storage Shelf & Notes'}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. ຊັ້ນວາງເສດເຈ້ຍ A-01"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </form>
    </FormModalTemplate>
  );
};

export default AddOffcutModal;
