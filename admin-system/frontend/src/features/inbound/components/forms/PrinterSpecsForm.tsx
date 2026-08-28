import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers } from 'lucide-react';
import ColorSlotConfigurator, { ColorSlot, STANDARD_PRESETS } from '@features/inventory/components/forms/common/ColorSlotConfigurator';
import { InboundItemFormData } from './types';

interface PrinterSpecsFormProps {
  item: InboundItemFormData;
  updateField: (field: keyof InboundItemFormData, value: any) => void;
}

export const PrinterSpecsForm: React.FC<PrinterSpecsFormProps> = ({
  item,
  updateField
}) => {
  const { t } = useTranslation();
  const printerCategories = ['Laser', 'Inkjet', 'MFP', 'Plotter', 'UV Flatbed', 'Sublimation'];

  const handleColorSlotsChange = (newSlots: ColorSlot[]) => {
    updateField('colorSlots', newSlots);
    updateField('totalColorSlots', newSlots.length);
    const currentPrinterInkSlots = item.printerInkSlots || [];
    const updatedInkSlots = newSlots.map((slot, index) => {
      const existing = currentPrinterInkSlots[index];
      return {
        slotPosition: `Slot ${index + 1} (${slot.code} - ${slot.name})`,
        colorGroup: slot.name,
        oemInkCode: existing?.oemInkCode || `OEM-${slot.code}-01`,
        oemStandardVolumeMl: existing?.oemStandardVolumeMl || 100,
        oemStandardIsoYieldA4: existing?.oemStandardIsoYieldA4 || 6000
      };
    });
    updateField('printerInkSlots', updatedInkSlots);
  };

  const handleColorSchemeChange = (newScheme: string) => {
    updateField('colorSchemeType', newScheme);
    if (STANDARD_PRESETS[newScheme]) {
      handleColorSlotsChange(STANDARD_PRESETS[newScheme]);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
        {t('inbound.printer.title')}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {t('inbound.printer.asset_id')} *
          </label>
          <input 
            type="text" 
            value={item.printerAssetId} 
            onChange={(e) => updateField('printerAssetId', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {t('inbound.printer.serial_number')} *
          </label>
          <input 
            type="text" 
            value={item.printerSn} 
            onChange={(e) => updateField('printerSn', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="Enter Unique S/N" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {t('inbound.printer.brand')} *
          </label>
          <input 
            type="text" 
            value={item.printerBrand} 
            onChange={(e) => updateField('printerBrand', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. Epson" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {t('inbound.printer.model')} *
          </label>
          <input 
            type="text" 
            value={item.printerModel} 
            onChange={(e) => updateField('printerModel', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
            placeholder="e.g. TrueVIS VG3" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {t('inbound.printer.category')}
          </label>
          <select 
            value={item.printerCategory} 
            onChange={(e) => updateField('printerCategory', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
          >
            {printerCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {t('inbound.printer.expected_life')}
          </label>
          <input 
            type="number" 
            value={item.expectedLifeA4} 
            onChange={(e) => updateField('expectedLifeA4', Number(e.target.value))} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {t('inbound.printer.maintenance_rate')}
          </label>
          <input 
            type="number" 
            value={item.maintenanceRatePct} 
            onChange={(e) => updateField('maintenanceRatePct', Number(e.target.value))} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {t('inbound.printer.location_dept')}
          </label>
          <input 
            type="text" 
            value={item.printerLocation} 
            onChange={(e) => updateField('printerLocation', e.target.value)} 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" 
          />
        </div>
      </div>

      <div className="pt-2">
        <ColorSlotConfigurator
          colorScheme={item.colorSchemeType}
          slots={item.colorSlots}
          onSchemeChange={handleColorSchemeChange}
          onSlotsChange={handleColorSlotsChange}
        />
      </div>

      <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 space-y-3 mt-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>{t('inbound.printer.oem_specs_title')}</span>
            </h4>
            <p className="text-[11px] text-slate-500 font-normal">
              {t('inbound.printer.oem_specs_subtitle')}
            </p>
          </div>
          <span className="text-[10px] text-sky-700 font-bold bg-sky-100 px-2 py-0.5 rounded-full shrink-0">
            {item.printerInkSlots?.length || 0} Slots
          </span>
        </div>
        <div className="space-y-3 pt-1">
          {(item.printerInkSlots || []).map((slot, index) => {
            const baseRate = slot.oemStandardIsoYieldA4 > 0 
              ? (slot.oemStandardVolumeMl / slot.oemStandardIsoYieldA4).toFixed(5) 
              : '0.00000';
            return (
              <div key={index} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span>{slot.slotPosition}</span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">
                    {t('inbound.printer.base_rate')}: {baseRate} ml/p
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      {t('inbound.printer.oem_sku')}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EPSON-008-BK"
                      value={slot.oemInkCode}
                      onChange={(e) => {
                        const newSlots = [...(item.printerInkSlots || [])];
                        newSlots[index].oemInkCode = e.target.value;
                        updateField('printerInkSlots', newSlots);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      {t('inbound.printer.oem_volume')}
                    </label>
                    <input
                      type="number"
                      value={slot.oemStandardVolumeMl}
                      onChange={(e) => {
                        const newSlots = [...(item.printerInkSlots || [])];
                        newSlots[index].oemStandardVolumeMl = Number(e.target.value);
                        updateField('printerInkSlots', newSlots);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      {t('inbound.printer.oem_yield')}
                    </label>
                    <input
                      type="number"
                      value={slot.oemStandardIsoYieldA4}
                      onChange={(e) => {
                        const newSlots = [...(item.printerInkSlots || [])];
                        newSlots[index].oemStandardIsoYieldA4 = Number(e.target.value);
                        updateField('printerInkSlots', newSlots);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
