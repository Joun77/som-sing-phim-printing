import React, { useState, useEffect } from 'react';
import { X, Scissors, Layers, Check, Calculator, Sparkles, Archive, Plus } from 'lucide-react';
import { useApp } from '@store/AppContext';
import { useTranslation } from 'react-i18next';

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
  const formatLAK = formatCurrency;

  const papersOnly = inventory.filter(i => 
    (i.category || '').toLowerCase() === 'paper' ||
    (i.category || '').toLowerCase() === 'material'
  );

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
      // Standard A3+ = 320 x 480 mm = 153,600 mm2
      const parentWidth = Number(parent.specs?.width_mm || 320);
      const parentHeight = Number(parent.specs?.height_mm || 480);
      const parentArea = Math.max(1, parentWidth * parentHeight);
      const offcutArea = Math.max(1, widthMm * heightMm);
      const parentSheetCost = Number(parent.costPerConsumptionUnit || 1900);
      const proRatedCost = Math.round((offcutArea / parentArea) * parentSheetCost);

      setCostPerSheet(Math.max(50, proRatedCost));
      setName(`ເສດ ${type} ${gsm}gsm (${widthMm}x${heightMm}mm)`);
    }
  }, [parentPaperId, widthMm, heightMm]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_SIZES[0]) => {
    if (preset.width > 0 && preset.height > 0) {
      setWidthMm(preset.width);
      setHeightMm(preset.height);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || qty <= 0 || widthMm <= 0 || heightMm <= 0) {
      showToast('ກະລຸນາປ້ອນຂໍ້ມູນເສດເຈ້ຍໃຫ້ຄົບຖ້ວນ!', 'warning');
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

    showToast('ບັນທຶກເສດເຈ້ຍເຂົ້າຄັງສິນຄ້າສຳເລັດ!', 'success');
    onClose();
  };

  const selectedParent = papersOnly.find(p => p.id === parentPaperId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in text-slate-800">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Scissors className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                ບັນທຶກເສດເຈ້ຍເຂົ້າຄັງ (Save Offcut to Inventory)
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                Catalog remnant sheets for small print jobs & scrap reuse
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold">
          {/* Origin Paper */}
          <div className="space-y-1">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
              ເຈ້ຍຕົ້ນທາງ (Origin Parent Paper) *
            </label>
            <select
              value={parentPaperId}
              onChange={(e) => setParentPaperId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
            >
              {papersOnly.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku || p.id}) - ຕົ້ນທຶນ: {formatLAK(p.costPerConsumptionUnit || 0)}/ແຜ່ນ
                </option>
              ))}
            </select>
          </div>

          {/* Size Presets */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
              ເລືອກຂະໜາດເສດເຈ້ຍມາດຕະຖານ (Preset Sizes)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_SIZES.map((preset) => {
                const isActive = widthMm === preset.width && heightMm === preset.height;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2 rounded-xl border text-[11px] font-black transition cursor-pointer text-center truncate ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {preset.label.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dimensions Width x Height */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                ຄວາມກວ້າງ (Width mm) *
              </label>
              <input
                type="number"
                min="10"
                required
                value={widthMm}
                onChange={(e) => setWidthMm(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                ຄວາມຍາວ (Height mm) *
              </label>
              <input
                type="number"
                min="10"
                required
                value={heightMm}
                onChange={(e) => setHeightMm(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Offcut Description Name */}
          <div className="space-y-1">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
              ຊື່ລາຍການເສດເຈ້ຍ (Offcut Title) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ເສດ Art Card 260gsm A5"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Quantity & Pro-rated Unit Cost Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                ຈຳນວນແຜ່ນເສດ (Sheets) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                ຕົ້ນທຶນປະເມີນ/ແຜ່ນ (LAK)
              </label>
              <input
                type="number"
                min="0"
                required
                value={costPerSheet}
                onChange={(e) => setCostPerSheet(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-emerald-700 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Valuation Summary Card */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ມູນຄ່າເສດເຈ້ຍລວມ:</span>
            </div>
            <span className="font-mono font-black text-emerald-800 text-sm">
              {formatLAK(costPerSheet * qty)}
            </span>
          </div>

          {/* Notes / Shelf Location */}
          <div className="space-y-1">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
              ບ່ອນຈັດເກັບ / ໝາຍເຫດ (Storage Shelf & Notes)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. ຊັ້ນວາງເສດເຈ້ຍ A-01"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ບັນທຶກເສດເຈ້ຍເຂົ້າຄັງ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOffcutModal;
