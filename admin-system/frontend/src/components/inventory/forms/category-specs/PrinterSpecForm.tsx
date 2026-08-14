import React, { useState } from 'react';
import { Layers, Upload, X, ExternalLink, Phone, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ColorSlotConfigurator, { ColorSlot, STANDARD_PRESETS } from '../common/ColorSlotConfigurator';

export default function PrinterSpecForm({ formData, onChange }: { formData: any; onChange: (updated: any) => void }) {
  const { t } = useTranslation();

  const [assetId, setAssetId] = useState(formData.asset_id || formData.id || '');
  const [serialNumber, setSerialNumber] = useState(formData.serial_number || formData.serialNumber || '');
  const [brand, setBrand] = useState(formData.brand || '');
  const [model, setModel] = useState(formData.model || '');
  const [printerCategory, setPrinterCategory] = useState(formData.printer_category || formData.printerCategory || 'Laser');
  const [colorScheme, setColorScheme] = useState(formData.color_config?.colorScheme || formData.colorSchemeType || 'CMYK');

  const initialSlots: ColorSlot[] = formData.color_config?.slots || STANDARD_PRESETS[colorScheme] || STANDARD_PRESETS['CMYK'];
  const [colorSlots, setColorSlots] = useState<ColorSlot[]>(initialSlots);

  const [expectedLifeA4Pages, setExpectedLifeA4Pages] = useState(formData.expected_life_a4 || formData.expectedLifeA4Pages || 500000);
  const [maintenanceRatePercent, setMaintenanceRatePercent] = useState(formData.maintenance_rate || formData.maintenanceRatePercent || 20);
  const [location, setLocation] = useState(formData.location_dept || formData.location || 'Main Dept');

  // Purchasing & Proofs fields
  const [importQty, setImportQty] = useState(formData.import_qty || formData.importQty || 1);
  const [importCost, setImportCost] = useState(formData.import_cost || formData.rawImportCost || formData.price || '');
  const [importCurrency, setImportCurrency] = useState(formData.currency || 'LAK');
  const [actualImages, setActualImages] = useState<string[]>(formData.actual_images || []);
  const [paymentSlip, setPaymentSlip] = useState<string>(formData.payment_slip || formData.receiptUrl || '');
  const [supplierPhone, setSupplierPhone] = useState<string>(formData.supplier_phone || formData.supplierContact || '');
  const [purchaseLink, setPurchaseLink] = useState<string>(formData.purchase_link || '');

  // OEM baseline ink slots derived from color slots
  const [printerInkSlots, setPrinterInkSlots] = useState(() => {
    if (formData.printerColorLinks && formData.printerColorLinks.length > 0) {
      return formData.printerColorLinks;
    }
    return colorSlots.map((slot, index) => ({
      slotPosition: `Slot ${index + 1} (${slot.code} - ${slot.name})`,
      colorGroup: slot.name,
      oemInkCode: `OEM-${slot.code}-01`,
      oemStandardVolumeMl: 100,
      oemStandardIsoYieldA4: 6000
    }));
  });

  const updateParent = (override: any = {}) => {
    const updated = {
      asset_id: assetId,
      serial_number: serialNumber,
      brand,
      model,
      printer_category: printerCategory,
      printerCategory,
      color_config: {
        colorScheme,
        slots: colorSlots
      },
      colorSchemeType: colorScheme,
      totalColorSlots: colorSlots.length,
      expected_life_a4: Number(expectedLifeA4Pages),
      expectedLifeA4Pages: Number(expectedLifeA4Pages),
      maintenance_rate: Number(maintenanceRatePercent),
      maintenanceRatePercent: Number(maintenanceRatePercent),
      location_dept: location,
      location,
      printerColorLinks: printerInkSlots,
      oemBaselineInks: printerInkSlots,
      import_qty: Number(importQty),
      importQty: Number(importQty),
      import_cost: importCost,
      currency: importCurrency,
      actual_images: actualImages,
      payment_slip: paymentSlip,
      supplier_phone: supplierPhone,
      purchase_link: purchaseLink,
      ...override
    };
    onChange(updated);
  };

  const handleSlotsChange = (newSlots: ColorSlot[]) => {
    setColorSlots(newSlots);
    // Sync OEM baseline inks with new slots
    const updatedInkSlots = newSlots.map((slot, index) => {
      const existing = printerInkSlots[index];
      return {
        slotPosition: `Slot ${index + 1} (${slot.code} - ${slot.name})`,
        colorGroup: slot.name,
        oemInkCode: existing?.oemInkCode || `OEM-${slot.code}-01`,
        oemStandardVolumeMl: existing?.oemStandardVolumeMl || 100,
        oemStandardIsoYieldA4: existing?.oemStandardIsoYieldA4 || 6000
      };
    });
    setPrinterInkSlots(updatedInkSlots);
    updateParent({
      color_config: { colorScheme, slots: newSlots },
      totalColorSlots: newSlots.length,
      printerColorLinks: updatedInkSlots,
      oemBaselineInks: updatedInkSlots
    });
  };

  const handleSchemeChange = (newScheme: string) => {
    setColorScheme(newScheme);
    updateParent({ color_config: { colorScheme: newScheme, slots: colorSlots } });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const resultStr = uploadEvent.target.result as string;
          setActualImages(prev => {
            const next = [...prev, resultStr];
            updateParent({ actual_images: next });
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    const updated = actualImages.filter((_, i) => i !== index);
    setActualImages(updated);
    updateParent({ actual_images: updated });
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        const resultStr = uploadEvent.target.result as string;
        setPaymentSlip(resultStr);
        updateParent({ payment_slip: resultStr });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 text-xs font-semibold text-slate-700">
      {/* Group 1: Machine & Asset Profile */}
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
          Machine & Asset Profile
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              {t('inbound.printer.asset_id')} *
            </label>
            <input
              type="text"
              value={assetId}
              onChange={(e) => {
                setAssetId(e.target.value);
                updateParent({ asset_id: e.target.value });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
              placeholder="PRN-2172"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              {t('inbound.printer.serial_number')} *
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => {
                setSerialNumber(e.target.value);
                updateParent({ serial_number: e.target.value });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
              placeholder="Enter Unique S/N"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              {t('inbound.printer.brand')} *
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                updateParent({ brand: e.target.value });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
              placeholder="e.g. Epson, Roland"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              {t('inbound.printer.model')} *
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                updateParent({ model: e.target.value });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
              placeholder="e.g. TrueVIS VG3"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              {t('inbound.printer.category')}
            </label>
            <select
              value={printerCategory}
              onChange={(e) => {
                setPrinterCategory(e.target.value);
                updateParent({ printer_category: e.target.value, printerCategory: e.target.value });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            >
              {['Laser', 'Inkjet', 'MFP', 'Plotter', 'UV Flatbed', 'Sublimation'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              {t('inbound.printer.expected_life')}
            </label>
            <input
              type="number"
              value={expectedLifeA4Pages}
              onChange={(e) => {
                const val = Number(e.target.value);
                setExpectedLifeA4Pages(val);
                updateParent({ expected_life_a4: val, expectedLifeA4Pages: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              {t('inbound.printer.maintenance_rate')}
            </label>
            <input
              type="number"
              value={maintenanceRatePercent}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaintenanceRatePercent(val);
                updateParent({ maintenance_rate: val, maintenanceRatePercent: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              {t('inbound.printer.location_dept')}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                updateParent({ location_dept: e.target.value, location: e.target.value });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
            />
          </div>
        </div>

        {/* Color Slot Configurator Component Integration */}
        <div className="pt-2">
          <ColorSlotConfigurator
            colorScheme={colorScheme}
            slots={colorSlots}
            onSchemeChange={handleSchemeChange}
            onSlotsChange={handleSlotsChange}
          />
        </div>
      </div>

      {/* Group 2: OEM Baseline Specs Matrix */}
      <div className="bg-sky-50/50 p-4 rounded-2xl border border-sky-100 space-y-3">
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
          <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full shrink-0">
            {printerInkSlots.length} Slots
          </span>
        </div>

        <div className="space-y-2.5">
          {printerInkSlots.map((slot: any, index: number) => {
            const baseRate = slot.oemStandardIsoYieldA4 > 0 
              ? (slot.oemStandardVolumeMl / slot.oemStandardIsoYieldA4).toFixed(5) 
              : '0.00000';
            return (
              <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 font-bold">
                  <span className="text-slate-800 font-extrabold">{slot.slotPosition}</span>
                  <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    {t('inbound.printer.base_rate')}: {baseRate} ml/page
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      {t('inbound.printer.oem_sku')}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EPSON-008-BK"
                      value={slot.oemInkCode}
                      onChange={(e) => {
                        const newSlots = [...printerInkSlots];
                        newSlots[index].oemInkCode = e.target.value;
                        setPrinterInkSlots(newSlots);
                        updateParent({ printerColorLinks: newSlots, oemBaselineInks: newSlots });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      {t('inbound.printer.oem_vol')}
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 127"
                      value={slot.oemStandardVolumeMl}
                      onChange={(e) => {
                        const newSlots = [...printerInkSlots];
                        newSlots[index].oemStandardVolumeMl = Number(e.target.value);
                        setPrinterInkSlots(newSlots);
                        updateParent({ printerColorLinks: newSlots, oemBaselineInks: newSlots });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      {t('inbound.printer.oem_yield')}
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 7500"
                      value={slot.oemStandardIsoYieldA4}
                      onChange={(e) => {
                        const newSlots = [...printerInkSlots];
                        newSlots[index].oemStandardIsoYieldA4 = Number(e.target.value);
                        setPrinterInkSlots(newSlots);
                        updateParent({ printerColorLinks: newSlots, oemBaselineInks: newSlots });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Group 3: Purchasing, Proofs & Media */}
      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-4">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <span>{t('inbound.printer.purchasing_section')}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              {t('inbound.printer.import_qty')} *
            </label>
            <input
              type="number"
              min="1"
              value={importQty}
              onChange={(e) => {
                const val = Number(e.target.value);
                setImportQty(val);
                updateParent({ import_qty: val, importQty: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">
              {t('inbound.printer.import_cost')} *
            </label>
            <div className="relative">
              <input
                type="number"
                value={importCost}
                onChange={(e) => {
                  setImportCost(e.target.value);
                  updateParent({ import_cost: e.target.value, rawImportCost: e.target.value });
                }}
                className="w-full pl-3 pr-16 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                placeholder="0.00"
                required
              />
              <select
                value={importCurrency}
                onChange={(e) => {
                  setImportCurrency(e.target.value);
                  updateParent({ currency: e.target.value });
                }}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2 text-[10px] font-black"
              >
                <option value="LAK">LAK</option>
                <option value="THB">THB</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('inbound.printer.supplier_phone')}</span>
            </label>
            <input
              type="tel"
              value={supplierPhone}
              onChange={(e) => {
                setSupplierPhone(e.target.value);
                updateParent({ supplier_phone: e.target.value });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
              placeholder="e.g. +856 20 12345678"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('inbound.printer.purchase_link')}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={purchaseLink}
                onChange={(e) => {
                  setPurchaseLink(e.target.value);
                  updateParent({ purchase_link: e.target.value });
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                placeholder="https://..."
              />
              {purchaseLink && (
                <button
                  type="button"
                  onClick={() => window.open(purchaseLink, '_blank')}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('inbound.printer.open_link')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* File Uploads: Actual Product Images */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-black uppercase text-slate-400">
            {t('inbound.printer.actual_images')}
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-4 bg-white text-center transition cursor-pointer relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
              <Upload className="w-5 h-5 text-sky-600" />
              <p className="text-xs font-semibold">{t('inbound.printer.upload_placeholder')}</p>
            </div>
          </div>

          {actualImages.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {actualImages.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden group shadow-2xs">
                  <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded-full opacity-80 hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Upload: Payment Slip */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-black uppercase text-slate-400">
            {t('inbound.printer.payment_slip')}
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-4 bg-white text-center transition cursor-pointer relative">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleSlipUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
              <Upload className="w-5 h-5 text-emerald-600" />
              <p className="text-xs font-semibold">{t('inbound.printer.upload_placeholder')}</p>
            </div>
          </div>

          {paymentSlip && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 truncate">Payment Slip Uploaded</span>
              <button
                type="button"
                onClick={() => {
                  setPaymentSlip('');
                  updateParent({ payment_slip: '' });
                }}
                className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
              >
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
