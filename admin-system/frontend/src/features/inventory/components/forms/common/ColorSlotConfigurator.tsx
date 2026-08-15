import React, { useState } from 'react';
import { Layers, Plus, Trash, ArrowUp, ArrowDown, X, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ColorSlot {
  id: string;
  code: string;       // e.g., "K", "C", "M", "Y", "W", "V", "LC", "LM"
  name: string;       // e.g., "Black", "Cyan", "White", "Varnish"
  hexColor?: string;  // e.g., "#000000", "#00FFFF", "#FFFFFF"
}

export interface ColorSlotConfiguratorProps {
  colorScheme: string; // e.g., "CMYK", "CMYK+W", "CMYK+W+V", "CUSTOM"
  slots: ColorSlot[];
  onSchemeChange: (scheme: string) => void;
  onSlotsChange: (slots: ColorSlot[]) => void;
  readOnly?: boolean;
}

export const STANDARD_PRESETS: Record<string, ColorSlot[]> = {
  CMYK: [
    { id: 'k', code: 'K', name: 'Black', hexColor: '#000000' },
    { id: 'c', code: 'C', name: 'Cyan', hexColor: '#00FFFF' },
    { id: 'm', code: 'M', name: 'Magenta', hexColor: '#FF00FF' },
    { id: 'y', code: 'Y', name: 'Yellow', hexColor: '#FFFF00' },
  ],
  'CMYK+W': [
    { id: 'k', code: 'K', name: 'Black', hexColor: '#000000' },
    { id: 'c', code: 'C', name: 'Cyan', hexColor: '#00FFFF' },
    { id: 'm', code: 'M', name: 'Magenta', hexColor: '#FF00FF' },
    { id: 'y', code: 'Y', name: 'Yellow', hexColor: '#FFFF00' },
    { id: 'w', code: 'W', name: 'White', hexColor: '#FFFFFF' },
  ],
  'CMYK+W+V': [
    { id: 'k', code: 'K', name: 'Black', hexColor: '#000000' },
    { id: 'c', code: 'C', name: 'Cyan', hexColor: '#00FFFF' },
    { id: 'm', code: 'M', name: 'Magenta', hexColor: '#FF00FF' },
    { id: 'y', code: 'Y', name: 'Yellow', hexColor: '#FFFF00' },
    { id: 'w', code: 'W', name: 'White', hexColor: '#FFFFFF' },
    { id: 'v', code: 'V', name: 'Varnish', hexColor: '#E2E8F0' },
  ],
  'K-Only': [
    { id: 'k', code: 'K', name: 'Black', hexColor: '#000000' },
  ],
  'Photo (6-Color)': [
    { id: 'k', code: 'K', name: 'Black', hexColor: '#000000' },
    { id: 'c', code: 'C', name: 'Cyan', hexColor: '#00FFFF' },
    { id: 'm', code: 'M', name: 'Magenta', hexColor: '#FF00FF' },
    { id: 'y', code: 'Y', name: 'Yellow', hexColor: '#FFFF00' },
    { id: 'lc', code: 'LC', name: 'Light Cyan', hexColor: '#80DEEA' },
    { id: 'lm', code: 'LM', name: 'Light Magenta', hexColor: '#F48FB1' },
  ],
  'Plotter (10-12 Colors)': [
    { id: 'k', code: 'K', name: 'Black', hexColor: '#000000' },
    { id: 'c', code: 'C', name: 'Cyan', hexColor: '#00FFFF' },
    { id: 'm', code: 'M', name: 'Magenta', hexColor: '#FF00FF' },
    { id: 'y', code: 'Y', name: 'Yellow', hexColor: '#FFFF00' },
    { id: 'lc', code: 'LC', name: 'Light Cyan', hexColor: '#80DEEA' },
    { id: 'lm', code: 'LM', name: 'Light Magenta', hexColor: '#F48FB1' },
    { id: 'gy', code: 'GY', name: 'Gray', hexColor: '#9E9E9E' },
    { id: 'lgy', code: 'LGY', name: 'Light Gray', hexColor: '#E0E0E0' },
    { id: 'or', code: 'OR', name: 'Orange', hexColor: '#FF9800' },
    { id: 'gr', code: 'GR', name: 'Green', hexColor: '#4CAF50' },
  ]
};

const SWATCH_PRESETS = [
  '#000000', '#00FFFF', '#FF00FF', '#FFFF00',
  '#FFFFFF', '#E2E8F0', '#80DEEA', '#F48FB1',
  '#FF9800', '#4CAF50', '#9C27B0', '#795548'
];

export default function ColorSlotConfigurator({
  colorScheme,
  slots,
  onSchemeChange,
  onSlotsChange,
  readOnly = false
}: ColorSlotConfiguratorProps) {
  const { t } = useTranslation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [customHex, setCustomHex] = useState('#FF0055');

  const handleSchemeSelect = (scheme: string) => {
    onSchemeChange(scheme);
    if (STANDARD_PRESETS[scheme]) {
      onSlotsChange([...STANDARD_PRESETS[scheme]]);
    } else if (scheme === 'CUSTOM') {
      // Keep existing slots or default to empty
    }
  };

  const handleAddCustomColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCode.trim() || !customName.trim()) return;

    const newSlot: ColorSlot = {
      id: `custom-${Date.now()}`,
      code: customCode.trim().toUpperCase(),
      name: customName.trim(),
      hexColor: customHex
    };

    const updated = [...slots, newSlot];
    onSlotsChange(updated);
    if (colorScheme !== 'CUSTOM' && !STANDARD_PRESETS[colorScheme]) {
      onSchemeChange('CUSTOM');
    }

    setCustomCode('');
    setCustomName('');
    setCustomHex('#FF0055');
    setIsModalOpen(false);
  };

  const handleRemoveSlot = (index: number) => {
    if (readOnly) return;
    const updated = slots.filter((_, i) => i !== index);
    onSlotsChange(updated);
  };

  const handleMoveSlot = (index: number, direction: 'up' | 'down') => {
    if (readOnly) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slots.length) return;

    const updated = [...slots];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onSlotsChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Scheme Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
              {t('inbound.printer.color_scheme')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              {t('inbound.printer.total_color_slots')}:
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800">
              {slots.length} Slots
            </span>
          </div>
        </div>

        {/* Preset Selectors */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {Object.keys(STANDARD_PRESETS).map((presetKey) => (
              <button
                type="button"
                key={presetKey}
                onClick={() => handleSchemeSelect(presetKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  colorScheme === presetKey
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {presetKey}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('inbound.printer.add_custom_color')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Color Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {slots.map((slot, index) => (
          <div
            key={slot.id || index}
            className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0 shadow-xs flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: slot.hexColor || '#CBD5E1', color: slot.hexColor === '#FFFFFF' ? '#000000' : '#FFFFFF' }}>
              </span>
              <div className="truncate">
                <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-700">
                    {slot.code}
                  </span>
                  <span className="truncate">{slot.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Slot {index + 1} • {slot.hexColor || 'No Hex'}
                </div>
              </div>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMoveSlot(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveSlot(index, 'down')}
                  disabled={index === slots.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(index)}
                  className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                  title="Delete Slot"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Custom Color Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-600" />
                <span>{t('inbound.printer.add_color_modal.title')}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomColor} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  {t('inbound.printer.add_color_modal.code')} *
                </label>
                <input
                  type="text"
                  placeholder="e.g. W, OR, GR, LCL"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  {t('inbound.printer.add_color_modal.name')} *
                </label>
                <input
                  type="text"
                  placeholder="e.g. White, Orange, Light Cyan"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  {t('inbound.printer.add_color_modal.picker')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 font-mono font-semibold uppercase text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {SWATCH_PRESETS.map((swatch) => (
                    <button
                      type="button"
                      key={swatch}
                      onClick={() => setCustomHex(swatch)}
                      className="w-6 h-6 rounded-lg border border-slate-300 cursor-pointer shadow-2xs hover:scale-110 transition"
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  {t('inbound.printer.add_color_modal.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-xs"
                >
                  {t('inbound.printer.add_color_modal.add_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
