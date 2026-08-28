import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Wrench, FileText, Cpu, Gauge } from 'lucide-react';
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
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const printerCategories = ['Inkjet', 'Laser', 'MFP', 'Plotter', 'UV Flatbed', 'Sublimation'];

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
        oemStandardVolumeMl: existing?.oemStandardVolumeMl || (slot.code === 'K' || slot.code === 'BK' ? 127 : 70),
        oemStandardIsoYieldA4: existing?.oemStandardIsoYieldA4 || (slot.code === 'K' || slot.code === 'BK' ? 7500 : 6000)
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
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>{currentLang === 'lo' ? 'ຂໍ້ມູນເຄື່ອງພິມ & ສະເປັກເຕັກນິກ (Printer Specifications)' : 'Printer Specifications'}</span>
        </h4>
        <span className="text-[10px] font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
          {item.printerCategory}
        </span>
      </div>

      {/* 1. Core Profile Identifiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ລະຫັດຊັບສິນ (Asset ID) *' : 'Asset ID *'}
          </label>
          <input 
            type="text" 
            value={item.printerAssetId} 
            onChange={(e) => updateField('printerAssetId', e.target.value)} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-mono font-bold text-slate-900" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ໝາຍເລກຊີຣຽວ (S/N) *' : 'Serial Number (S/N) *'}
          </label>
          <input 
            type="text" 
            value={item.printerSn} 
            onChange={(e) => updateField('printerSn', e.target.value)} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-mono font-bold text-slate-900" 
            placeholder="e.g. SN-8839210" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ແບຣນ / ຍີ່ຫໍ້ (Brand) *' : 'Brand *'}
          </label>
          <input 
            type="text" 
            value={item.printerBrand} 
            onChange={(e) => updateField('printerBrand', e.target.value)} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-bold text-slate-900" 
            placeholder="e.g. Epson" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ລຸ້ນໂມເດວ (Model) *' : 'Model *'}
          </label>
          <input 
            type="text" 
            value={item.printerModel} 
            onChange={(e) => updateField('printerModel', e.target.value)} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-bold text-slate-900" 
            placeholder="e.g. EcoTank Pro L15160" 
            required 
          />
        </div>
      </div>

      {/* 2. Financial & Depreciation Parameters */}
      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-emerald-600" />
          <span>{currentLang === 'lo' ? 'ພາຣາມິເຕີຄ່າເສື່ອມລາຄາ & ເປົ້າໝາຍການຜະລິດ (Depreciation & Capacity Target)' : 'Depreciation & Capacity Target'}</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
              {currentLang === 'lo' ? 'ອາຍຸງານ (ປີ)' : 'Lifespan (Yrs)'}
            </label>
            <input 
              type="number" 
              min={1}
              max={30}
              value={item.printerLifespanYears || 5} 
              onChange={(e) => {
                const years = Math.max(1, Number(e.target.value));
                updateField('printerLifespanYears', years);
                updateField('expectedLifeA4', years * 12 * (item.printerEstMonthlyVolume || 50000));
              }} 
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs font-mono font-bold" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
              {currentLang === 'lo' ? 'ເປົ້າໝາຍ/ເດືອນ (ໜ້າ)' : 'Monthly Vol (Pages)'}
            </label>
            <input 
              type="number" 
              min={100}
              value={item.printerEstMonthlyVolume || 50000} 
              onChange={(e) => {
                const vol = Math.max(1, Number(e.target.value));
                updateField('printerEstMonthlyVolume', vol);
                updateField('expectedLifeA4', (item.printerLifespanYears || 5) * 12 * vol);
              }} 
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs font-mono font-bold" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
              {currentLang === 'lo' ? 'ບຳລຸງຮັກສາ (%)' : 'Maint Rate (%)'}
            </label>
            <input 
              type="number" 
              min={0}
              max={100}
              value={item.maintenanceRatePct || 15} 
              onChange={(e) => updateField('maintenanceRatePct', Number(e.target.value))} 
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs font-mono font-bold" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
              {currentLang === 'lo' ? 'ເປົ້າໝາຍຕະຫຼອດອາຍຸ (ໜ້າ)' : 'Lifetime Pages'}
            </label>
            <input 
              type="number" 
              value={item.expectedLifeA4 || 3000000} 
              onChange={(e) => updateField('expectedLifeA4', Number(e.target.value))} 
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none bg-white text-xs font-mono font-bold text-emerald-700" 
            />
          </div>
        </div>
      </div>

      {/* 3. Technical & Operational Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ໝວດໝູ່ເຄື່ອງພິມ' : 'Category'}
          </label>
          <select 
            value={item.printerCategory} 
            onChange={(e) => updateField('printerCategory', e.target.value)} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-bold text-slate-900"
          >
            {printerCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ຄວາມໄວໃນການພິມ (PPM)' : 'Print Speed (PPM)'}
          </label>
          <input 
            type="text" 
            value={item.printerSpeedPpm || '25 ppm (A4)'} 
            onChange={(e) => updateField('printerSpeedPpm', e.target.value)} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-bold" 
            placeholder="e.g. 25 ppm (A4)"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ຂະໜາດເຈ້ຍສູງສຸດ' : 'Max Paper Size'}
          </label>
          <input 
            type="text" 
            value={item.printerMaxWidth || 'A3+ (329 x 483 mm)'} 
            onChange={(e) => updateField('printerMaxWidth', e.target.value)} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-bold" 
            placeholder="e.g. A3+ (329 x 483 mm)"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ສະຖານທີ່ຕັ້ງ / ພະແນກ' : 'Location / Dept'}
          </label>
          <input 
            type="text" 
            value={item.printerLocation || 'Main Dept'} 
            onChange={(e) => updateField('printerLocation', e.target.value)} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-bold" 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ປະເພດໝຶກພິມ (Ink Type)' : 'Ink Type'}
          </label>
          <input 
            type="text" 
            value={item.printerInkType || 'Pigment Ink (DURABrite Pro)'} 
            onChange={(e) => updateField('printerInkType', e.target.value)} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-bold" 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ເທັກໂນໂລຢີການພິມ' : 'Print Tech'}
          </label>
          <input 
            type="text" 
            value={item.printerPrintTech || 'PrecisionCore Heat-Free'} 
            onChange={(e) => updateField('printerPrintTech', e.target.value)} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-bold" 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ປະລິມານພິມໝຶກດຳ ISO' : 'Black ISO Yield'}
          </label>
          <input 
            type="number" 
            value={item.printerBlackYield || 7500} 
            onChange={(e) => updateField('printerBlackYield', Number(e.target.value))} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-mono font-bold" 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-400 mb-2">
            {currentLang === 'lo' ? 'ປະລິມານພິມໝຶກສີ ISO' : 'Color ISO Yield'}
          </label>
          <input 
            type="number" 
            value={item.printerColorYield || 6000} 
            onChange={(e) => updateField('printerColorYield', Number(e.target.value))} 
            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none bg-white text-xs font-mono font-bold" 
          />
        </div>
      </div>

      {/* 4. Color Scheme & Slot Configurator */}
      <div className="pt-2">
        <ColorSlotConfigurator
          colorScheme={item.colorSchemeType}
          slots={item.colorSlots}
          onSchemeChange={handleColorSchemeChange}
          onSlotsChange={handleColorSlotsChange}
        />
      </div>

      {/* 5. OEM Baseline Inks Mappings */}
      <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 space-y-3 mt-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>{currentLang === 'lo' ? 'ຂໍ້ມູນໝຶກມາດຕະຖານ OEM ປະຈຳ Slot' : 'OEM Baseline Ink Specifications'}</span>
            </h4>
            <p className="text-[11px] text-slate-500 font-normal">
              {currentLang === 'lo' 
                ? 'ກຳນົດລະຫັດ SKU ໝຶກແທ້, ຄວາມຈຸ (ml) ແລະ ປະລິມານໜ້າພິມມາດຕະຖານ ISO A4' 
                : 'Configure OEM standard SKU, volume (ml), and ISO A4 yield'}
            </p>
          </div>
          <span className="text-[10px] text-sky-700 font-bold bg-sky-100 px-2.5 py-0.5 rounded-full shrink-0">
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
                    {currentLang === 'lo' ? 'ອັດຕາສິ້ນເປືອງ' : 'Rate'}: {baseRate} ml/p
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      {currentLang === 'lo' ? 'ລະຫັດ SKU ໝຶກ OEM' : 'OEM SKU Code'}
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      {currentLang === 'lo' ? 'ຄວາມຈຸ (ml)' : 'Volume (ml)'}
                    </label>
                    <input
                      type="number"
                      value={slot.oemStandardVolumeMl}
                      onChange={(e) => {
                        const newSlots = [...(item.printerInkSlots || [])];
                        newSlots[index].oemStandardVolumeMl = Number(e.target.value);
                        updateField('printerInkSlots', newSlots);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      {currentLang === 'lo' ? 'ປະລິມານພິມ ISO A4' : 'ISO A4 Yield'}
                    </label>
                    <input
                      type="number"
                      value={slot.oemStandardIsoYieldA4}
                      onChange={(e) => {
                        const newSlots = [...(item.printerInkSlots || [])];
                        newSlots[index].oemStandardIsoYieldA4 = Number(e.target.value);
                        updateField('printerInkSlots', newSlots);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold font-mono"
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
