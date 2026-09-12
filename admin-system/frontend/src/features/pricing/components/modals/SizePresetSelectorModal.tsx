import React, { useState, useEffect, useMemo } from 'react';
import { 
  Maximize2, 
  Search, 
  Check, 
  Plus, 
  Trash2, 
  Sliders, 
  LayoutGrid, 
  FileText, 
  Image as ImageIcon, 
  CreditCard, 
  Tag, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { FormModalTemplate } from '@components/common/FormModalTemplate';
import type { DimensionUnit, DimensionPreset } from '../../types';
import { mmToUnit, unitToMM, type PresetCategoryFilter } from '../CustomDimensionInput';

interface SizePresetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWidthMM: number;
  currentHeightMM: number;
  currentPresetName?: string;
  currentLang?: string;
  onSelectSize: (widthMM: number, heightMM: number, presetName: string) => void;
}

const CATEGORY_TABS: { key: PresetCategoryFilter; labelLo: string; labelEn: string; icon: React.ElementType }[] = [
  { key: 'ALL', labelLo: 'ທັງໝົດ (All)', labelEn: 'All', icon: LayoutGrid },
  { key: 'DOCUMENT', labelLo: 'ເອກະສານ (A-Series)', labelEn: 'Documents', icon: FileText },
  { key: 'PHOTO', labelLo: 'ຮູບພາບ (Photos)', labelEn: 'Photos', icon: ImageIcon },
  { key: 'CARD', labelLo: 'ນາມບັດ & ກາດ (Cards)', labelEn: 'Cards', icon: CreditCard },
  { key: 'STICKER', labelLo: 'ສະຕິກເກີ (Stickers)', labelEn: 'Stickers', icon: Tag },
];

export const SizePresetSelectorModal: React.FC<SizePresetSelectorModalProps> = ({
  isOpen,
  onClose,
  currentWidthMM,
  currentHeightMM,
  currentPresetName = 'A4',
  currentLang = 'lo',
  onSelectSize,
}) => {
  const [unit, setUnit] = useState<DimensionUnit>('inch');
  const [presets, setPresets] = useState<DimensionPreset[]>([]);
  const [activeCategory, setActiveCategory] = useState<PresetCategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [selectedPresetName, setSelectedPresetName] = useState<string>(currentPresetName || 'A4');
  const [selectedWidthMM, setSelectedWidthMM] = useState<number>(currentWidthMM || 210);
  const [selectedHeightMM, setSelectedHeightMM] = useState<number>(currentHeightMM || 297);

  // Custom dimension states inside modal
  const [customW, setCustomW] = useState<string>(() => mmToUnit(currentWidthMM, 'inch').toString());
  const [customH, setCustomH] = useState<string>(() => mmToUnit(currentHeightMM, 'inch').toString());
  const [showSaveCustom, setShowSaveCustom] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState('DOCUMENT');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  // Fetch presets from server
  const fetchPresets = async () => {
    try {
      setIsLoadingPresets(true);
      const res = await fetch('/api/v1/pricing/presets');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setPresets(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load dimension presets:', err);
    } finally {
      setIsLoadingPresets(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPresets();

      // Resolve strictly SINGLE active preset by name first, or fallback to first matching dimensions
      const matchByName = presets.find(
        p => p.name.toLowerCase().trim() === (currentPresetName || '').toLowerCase().trim()
      );
      if (matchByName) {
        setSelectedPresetId(matchByName.id);
        setSelectedPresetName(matchByName.name);
        setSelectedWidthMM(matchByName.width_mm);
        setSelectedHeightMM(matchByName.height_mm);
      } else {
        const matchByDim = presets.find(
          p => Math.abs(p.width_mm - currentWidthMM) < 1.5 && Math.abs(p.height_mm - currentHeightMM) < 1.5
        );
        if (matchByDim) {
          setSelectedPresetId(matchByDim.id);
          setSelectedPresetName(matchByDim.name);
          setSelectedWidthMM(matchByDim.width_mm);
          setSelectedHeightMM(matchByDim.height_mm);
        } else {
          setSelectedPresetId(null);
          setSelectedPresetName(currentPresetName || 'Custom');
          setSelectedWidthMM(currentWidthMM);
          setSelectedHeightMM(currentHeightMM);
        }
      }

      setCustomW(mmToUnit(currentWidthMM, unit).toString());
      setCustomH(mmToUnit(currentHeightMM, unit).toString());
    }
  }, [isOpen, currentWidthMM, currentHeightMM, currentPresetName, presets.length]);

  // Filter presets
  const filteredPresets = useMemo(() => {
    return presets.filter(p => {
      // 1. Category filter
      if (activeCategory !== 'ALL' && p.category !== activeCategory) {
        return false;
      }
      // 2. Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDims = `${p.width}x${p.height} ${p.width_mm}x${p.height_mm}`.toLowerCase().includes(q);
        if (!matchName && !matchDims) return false;
      }
      return true;
    });
  }, [presets, activeCategory, searchQuery]);

  const handleUnitSwitch = (newUnit: DimensionUnit) => {
    setUnit(newUnit);
    setCustomW(mmToUnit(selectedWidthMM, newUnit).toString());
    setCustomH(mmToUnit(selectedHeightMM, newUnit).toString());
  };

  const handleSelectPreset = (p: DimensionPreset) => {
    setSelectedPresetId(p.id);
    setSelectedPresetName(p.name);
    setSelectedWidthMM(p.width_mm);
    setSelectedHeightMM(p.height_mm);
    setCustomW(mmToUnit(p.width_mm, unit).toString());
    setCustomH(mmToUnit(p.height_mm, unit).toString());
  };

  const handleConfirmAndApply = (widthMM?: number, heightMM?: number, name?: string) => {
    const finalW = widthMM !== undefined ? widthMM : selectedWidthMM;
    const finalH = heightMM !== undefined ? heightMM : selectedHeightMM;
    const finalName = name || selectedPresetName || 'Custom';
    onSelectSize(finalW, finalH, finalName);
    onClose();
  };

  const handleApplyCustomSize = () => {
    const valW = parseFloat(customW);
    const valH = parseFloat(customH);
    if (!valW || !valH || isNaN(valW) || isNaN(valH) || valW <= 0 || valH <= 0) return;

    const wMM = unitToMM(valW, unit);
    const hMM = unitToMM(valH, unit);
    const label = `${valW}×${valH} ${unit}`;
    handleConfirmAndApply(wMM, hMM, label);
  };

  const handleSaveAsNewPreset = async () => {
    if (!newPresetName.trim()) return;
    const valW = parseFloat(customW);
    const valH = parseFloat(customH);
    if (!valW || !valH || valW <= 0 || valH <= 0) return;

    try {
      setIsSavingPreset(true);
      const wMM = unitToMM(valW, unit);
      const hMM = unitToMM(valH, unit);

      const payload = {
        name: newPresetName.trim(),
        width: valW,
        height: valH,
        unit,
        width_mm: wMM,
        height_mm: hMM,
        category: newPresetCategory,
        is_default: false,
      };

      const res = await fetch('/api/v1/pricing/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPresets(prev => [...prev, json.data]);
          onSelectSize(wMM, hMM, json.data.name);
          setShowSaveCustom(false);
          setNewPresetName('');
          onClose();
        }
      }
    } catch (err) {
      console.error('Error saving preset:', err);
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(currentLang === 'lo' ? 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຂະໜາດນີ້?' : 'Delete this custom preset?')) return;
    try {
      const res = await fetch(`/api/v1/pricing/presets/${presetId}`, { method: 'DELETE' });
      if (res.ok) {
        setPresets(prev => prev.filter(p => p.id !== presetId));
      }
    } catch (err) {
      console.error('Error deleting preset:', err);
    }
  };

  function getCategoryBadge(cat: string) {
    switch (cat) {
      case 'DOCUMENT':
        return { labelLo: 'ເອກະສານ', labelEn: 'Doc', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'PHOTO':
        return { labelLo: 'ຮູບພາບ', labelEn: 'Photo', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CARD':
        return { labelLo: 'ນາມບັດ', labelEn: 'Card', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'STICKER':
        return { labelLo: 'ສະຕິກເກີ', labelEn: 'Sticker', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { labelLo: 'ທົ່ວໄປ', labelEn: 'Other', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  }

  if (!isOpen) return null;

  return (
    <FormModalTemplate
      isOpen={isOpen}
      onClose={onClose}
      icon={<Maximize2 className="w-5 h-5 text-white" />}
      title={currentLang === 'lo' ? 'ເລືອກຂະໜາດຊິ້ນງານ (Job Size & Preset)' : 'Select Job Size & Preset'}
      subtitle={currentLang === 'lo' 
        ? 'ເລືອກຂະໜາດມາດຕະຖານຕາມໝວດໝູ່ ຫຼື ກຳນົດຂະໜາດເອງໄດ້ຢ່າງວ່ອງໄວ' 
        : 'Browse standard print sizes or enter custom dimensions'}
      maxWidthClass="max-w-4xl"
      badgeText={`${presets.length} ຂະໜາດ`}
      footerActions={
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{currentLang === 'lo' ? 'ຂະໜາດທີ່ເລືອກ:' : 'Selected Size:'}</span>
            <strong className="text-slate-900 font-mono font-bold">
              {selectedPresetName} ({Math.round(selectedWidthMM)} × {Math.round(selectedHeightMM)} mm)
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => handleConfirmAndApply()}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <span>{currentLang === 'lo' ? 'ນຳໃຊ້ຂະໜາດນີ້' : 'Apply Selected'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-5">
        {/* Top Controls: Search Bar & Unit Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLang === 'lo' ? 'ຄົ້ນຫາຂະໜາດ ເຊັ່ນ: A4, A3, ນາມບັດ, 4x6"...' : 'Search size, e.g. A4, A3, Card, 4x6"...'}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Unit Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <span className="text-[10px] font-black uppercase text-slate-500 px-2">
              {currentLang === 'lo' ? 'ໜ່ວຍວັດ:' : 'Unit:'}
            </span>
            {(['inch', 'cm', 'mm'] as DimensionUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => handleUnitSwitch(u)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                  unit === u
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {u === 'inch' ? 'ນິ້ວ (INCH)' : u === 'cm' ? 'ຊມ (CM)' : 'ມມ (MM)'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((cat) => {
            const Icon = cat.icon;
            const isCatActive = activeCategory === cat.key;
            const count = cat.key === 'ALL' 
              ? presets.length 
              : presets.filter(p => p.category === cat.key).length;

            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                  isCatActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCatActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{currentLang === 'lo' ? cat.labelLo : cat.labelEn}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isCatActive ? 'bg-slate-800 text-sky-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Presets Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>{currentLang === 'lo' ? 'ລາຍການຂະໜາດມາດຕະຖານ (ກົດເພື່ອເລືອກ):' : 'Standard Presets (Click to select):'}</span>
            <span>ພົບ {filteredPresets.length} ຂະໜາດ</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[42vh] overflow-y-auto pr-1">
            {filteredPresets.map((p) => {
              const isSelected = p.id === selectedPresetId;
              const catBadge = getCategoryBadge(p.category);

              // Dimensions in active unit
              const displayW = mmToUnit(p.width_mm, unit);
              const displayH = mmToUnit(p.height_mm, unit);

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  onDoubleClick={() => handleConfirmAndApply(p.width_mm, p.height_mm, p.name)}
                  className={`group relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-50/90 border-sky-500 shadow-md ring-2 ring-sky-400/20'
                      : 'bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-extrabold text-xs text-slate-900 block truncate">
                        {p.name}
                      </span>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${catBadge.color}`}>
                          {catBadge.labelLo}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-0.5 font-mono">
                      <div className="text-xs font-black text-slate-800">
                        {displayW} × {displayH} <span className="text-[10px] text-slate-400 font-sans">{unit}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {Math.round(p.width_mm)} × {Math.round(p.height_mm)} mm
                      </div>
                    </div>
                  </div>

                  {!p.is_default && (
                    <button
                      type="button"
                      onClick={(e) => handleDeletePreset(p.id, e)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:text-rose-600 p-1 rounded-md bg-white border border-slate-200 shadow-2xs transition"
                      title="Delete custom preset"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Dimensions Drawer / Card */}
        <div className="bg-slate-100/90 p-4 rounded-2xl border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-sky-600" />
              <span>{currentLang === 'lo' ? 'ກຳນົດຂະໜາດເອງ (Custom Dimensions):' : 'Custom Dimensions:'}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowSaveCustom(!showSaveCustom)}
              className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showSaveCustom ? 'ເຊື່ອງການບັນທຶກ' : '+ ບັນທຶກເປັນຂະໜາດໃໝ່'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex justify-between">
                <span>{currentLang === 'lo' ? 'ລວງກວ້າງ (Width):' : 'Width:'}</span>
                <span className="font-mono text-slate-400">[{unit}]</span>
              </label>
              <input
                type="number"
                step={unit === 'inch' ? '0.1' : unit === 'cm' ? '0.1' : '1'}
                min="0.1"
                value={customW}
                onChange={(e) => setCustomW(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex justify-between">
                <span>{currentLang === 'lo' ? 'ລວງຍາວ (Height):' : 'Height:'}</span>
                <span className="font-mono text-slate-400">[{unit}]</span>
              </label>
              <input
                type="number"
                step={unit === 'inch' ? '0.1' : unit === 'cm' ? '0.1' : '1'}
                min="0.1"
                value={customH}
                onChange={(e) => setCustomH(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Optional Save Preset Form */}
          {showSaveCustom && (
            <div className="p-3 bg-white rounded-xl border border-sky-200 space-y-2.5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="ຊື່ຂະໜາດ ເຊັ່ນ: ກາດງານບວດ 4x6"
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                />
                <select
                  value={newPresetCategory}
                  onChange={(e) => setNewPresetCategory(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                >
                  <option value="DOCUMENT">ເອກະສານ (DOCUMENT)</option>
                  <option value="PHOTO">ຮູບພາບ (PHOTO)</option>
                  <option value="CARD">ນາມບັດ & ກາດ (CARD)</option>
                  <option value="STICKER">ສະຕິກເກີ (STICKER)</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleSaveAsNewPreset}
                disabled={isSavingPreset || !newPresetName.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSavingPreset ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກເຂົ້າຖານຂໍ້ມູນ (Save Preset)'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </FormModalTemplate>
  );
};
