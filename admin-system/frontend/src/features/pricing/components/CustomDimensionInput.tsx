import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Check, 
  Layers, 
  Sliders, 
  Sparkles,
  Star
} from 'lucide-react';
import type { DimensionUnit, DimensionPreset } from '../types';

interface CustomDimensionInputProps {
  widthMM: number;
  heightMM: number;
  onChangeMM: (widthMM: number, heightMM: number, presetName?: string) => void;
  currentLang?: string;
  selectedPresetId?: string;
  className?: string;
}

// Convert from mm to given unit
export function mmToUnit(mm: number, unit: DimensionUnit): number {
  if (unit === 'inch') {
    return Number((mm / 25.4).toFixed(2));
  } else if (unit === 'cm') {
    return Number((mm / 10).toFixed(2));
  }
  return Number(Math.round(mm));
}

// Convert from given unit to mm
export function unitToMM(val: number, unit: DimensionUnit): number {
  if (unit === 'inch') {
    return Number((val * 25.4).toFixed(1));
  } else if (unit === 'cm') {
    return Number((val * 10).toFixed(1));
  }
  return Number(val);
}

export const CustomDimensionInput: React.FC<CustomDimensionInputProps> = ({
  widthMM,
  heightMM,
  onChangeMM,
  currentLang = 'lo',
  selectedPresetId,
  className = '',
}) => {
  const [unit, setUnit] = useState<DimensionUnit>('inch');
  const [presets, setPresets] = useState<DimensionPreset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState('PHOTO');

  // Input states in currently selected unit
  const [inputW, setInputW] = useState<string>(() => mmToUnit(widthMM, 'inch').toString());
  const [inputH, setInputH] = useState<string>(() => mmToUnit(heightMM, 'inch').toString());

  // Fetch presets from backend DB
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
      console.warn('Failed to load dimension presets from server:', err);
    } finally {
      setIsLoadingPresets(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  // Update inputs whenever external mm changes or unit changes
  useEffect(() => {
    setInputW(mmToUnit(widthMM, unit).toString());
    setInputH(mmToUnit(heightMM, unit).toString());
  }, [widthMM, heightMM, unit]);

  // Handle switching unit
  const handleUnitChange = (newUnit: DimensionUnit) => {
    setUnit(newUnit);
    setInputW(mmToUnit(widthMM, newUnit).toString());
    setInputH(mmToUnit(heightMM, newUnit).toString());
  };

  // Handle width input change
  const handleWidthChange = (valStr: string) => {
    setInputW(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const calculatedMM = unitToMM(num, unit);
      onChangeMM(calculatedMM, heightMM, 'Custom');
    }
  };

  // Handle height input change
  const handleHeightChange = (valStr: string) => {
    setInputH(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const calculatedMM = unitToMM(num, unit);
      onChangeMM(widthMM, calculatedMM, 'Custom');
    }
  };

  // Save new preset to backend DB
  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    try {
      setIsSavingPreset(true);
      const wNum = parseFloat(inputW) || mmToUnit(widthMM, unit);
      const hNum = parseFloat(inputH) || mmToUnit(heightMM, unit);
      const wMM = unitToMM(wNum, unit);
      const hMM = unitToMM(hNum, unit);

      const res = await fetch('/api/v1/pricing/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPresetName.trim(),
          category: newPresetCategory,
          unit,
          width: wNum,
          height: hNum,
          width_mm: wMM,
          height_mm: hMM,
        }),
      });

      if (res.ok) {
        setShowSaveModal(false);
        setNewPresetName('');
        await fetchPresets();
      }
    } catch (err) {
      console.error('Failed to save preset:', err);
    } finally {
      setIsSavingPreset(false);
    }
  };

  // Delete preset
  const handleDeletePreset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(currentLang === 'lo' ? 'ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຂະໜາດນີ້?' : 'Delete this preset?')) return;
    try {
      const res = await fetch(`/api/v1/pricing/presets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPresets(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete preset:', err);
    }
  };

  // Select preset
  const handleSelectPreset = (p: DimensionPreset) => {
    onChangeMM(p.width_mm, p.height_mm, p.name);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Unit Switcher & Title */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Sliders className="w-3.5 h-3.5 text-sky-600" />
          <span>{currentLang === 'lo' ? 'ໜ່ວຍວັດແທກ (Unit)' : 'Measurement Unit'}:</span>
        </div>
        
        {/* Unit Pills */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {(['inch', 'cm', 'mm'] as DimensionUnit[]).map((u) => {
            const isSel = unit === u;
            const label = u === 'inch' ? 'ນິ້ວ (Inch)' : u === 'cm' ? 'ຊມ (cm)' : 'ມມ (mm)';
            return (
              <button
                key={u}
                type="button"
                onClick={() => handleUnitChange(u)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase transition cursor-pointer ${
                  isSel
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Chips (Horizontal Scrollable or Wrap) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>{currentLang === 'lo' ? 'ຂະໜາດມາດຕະຖານ / Presets ໃນລະບົບ' : 'Presets & Templates'}:</span>
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="text-[10px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200"
          >
            <Plus className="w-3 h-3" />
            <span>{currentLang === 'lo' ? '+ ບັນທຶກຂະໜາດໃໝ່' : '+ Save Preset'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {presets.map((p) => {
            // Check if active
            const isMatch = Math.abs(p.width_mm - widthMM) < 1.5 && Math.abs(p.height_mm - heightMM) < 1.5;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`group px-2.5 py-1 rounded-xl text-xs font-bold font-sans transition cursor-pointer flex items-center gap-1.5 border ${
                  isMatch
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50/50'
                }`}
              >
                <span>{p.name}</span>
                <span className={`text-[10px] ${isMatch ? 'text-sky-100' : 'text-slate-400'}`}>
                  {p.width}×{p.height}{p.unit === 'inch' ? '"' : p.unit}
                </span>
                {!p.is_default && (
                  <button
                    type="button"
                    onClick={(e) => handleDeletePreset(p.id, e)}
                    className={`opacity-0 group-hover:opacity-100 hover:text-rose-600 p-0.5 rounded transition ${
                      isMatch ? 'text-white hover:text-rose-200' : 'text-slate-400'
                    }`}
                    title="Delete preset"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Custom Dimensions Inputs */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
            <span>{currentLang === 'lo' ? 'ລວງກວ້າງ (Width)' : 'Width'}</span>
            <span className="text-[10px] text-slate-400 uppercase font-mono">[{unit}]</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step={unit === 'inch' ? '0.1' : unit === 'cm' ? '0.1' : '1'}
              min="0.1"
              value={inputW}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 border-2 border-slate-200 rounded-xl font-sans font-bold text-slate-900 focus:outline-none focus:border-sky-500 bg-white text-center shadow-2xs"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400 uppercase pointer-events-none">
              {unit === 'inch' ? '"' : unit}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block text-right font-mono">
            ≈ {Math.round(widthMM)} mm
          </span>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
            <span>{currentLang === 'lo' ? 'ລວງຍາວ (Height)' : 'Height'}</span>
            <span className="text-[10px] text-slate-400 uppercase font-mono">[{unit}]</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step={unit === 'inch' ? '0.1' : unit === 'cm' ? '0.1' : '1'}
              min="0.1"
              value={inputH}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 border-2 border-slate-200 rounded-xl font-sans font-bold text-slate-900 focus:outline-none focus:border-sky-500 bg-white text-center shadow-2xs"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400 uppercase pointer-events-none">
              {unit === 'inch' ? '"' : unit}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block text-right font-mono">
            ≈ {Math.round(heightMM)} mm
          </span>
        </div>
      </div>

      {/* Modal to Save Preset */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-sky-600" />
                <span>{currentLang === 'lo' ? 'ບັນທຶກ Preset ຂະໜາດໃໝ່' : 'Save Custom Preset'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePreset} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {currentLang === 'lo' ? 'ຊື່ຂະໜາດ / Preset Name' : 'Preset Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ເຊັ່ນ: ຮູບຕິດບັດ 2x3, ໂປສກາດ 4x6"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {currentLang === 'lo' ? 'ໝວດໝູ່ (Category)' : 'Category'}
                </label>
                <select
                  value={newPresetCategory}
                  onChange={(e) => setNewPresetCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-sky-500 bg-white"
                >
                  <option value="PHOTO">ຮູບພາບ (Photo)</option>
                  <option value="CARD">ນາມບັດ / ກາດ (Card)</option>
                  <option value="STICKER">ສະຕິກເກີ (Sticker)</option>
                  <option value="DOCUMENT">ເອກະສານ / ປຶ້ມ (Document)</option>
                  <option value="POSTER">ໂປສເຕີ (Poster)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-100 font-sans">
                <div className="flex justify-between">
                  <span>ຂະໜາດທີ່ບັນທຶກ:</span>
                  <span className="font-bold text-slate-900">
                    {inputW} × {inputH} {unit === 'inch' ? 'ນິ້ວ (inch)' : unit}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>ຄ່າ MM (ມມ):</span>
                  <span>{Math.round(unitToMM(parseFloat(inputW) || 0, unit))} × {Math.round(unitToMM(parseFloat(inputH) || 0, unit))} mm</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {currentLang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingPreset || !newPresetName.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingPreset ? 'ກຳລັງບັນທຶກ...' : (currentLang === 'lo' ? 'ບັນທຶກລົງລະບົບ' : 'Save to DB')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
