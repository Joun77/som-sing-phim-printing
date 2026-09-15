import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Coins, 
  Phone, 
  Link as LinkIcon, 
  Upload, 
  X, 
  Calculator, 
  Sparkles,
  Layers
} from 'lucide-react';
import { InboundItemFormData } from './types';

interface PurchasingSectionProps {
  item: InboundItemFormData;
  currentLang: string;
  updateField: (field: keyof InboundItemFormData, value: any) => void;
}

export const PurchasingSection: React.FC<PurchasingSectionProps> = ({
  item,
  currentLang,
  updateField
}) => {
  const { t } = useTranslation();

  const costMode = item.costInputMode || 'UNIT';
  const qty = Math.max(1, Number(item.importQty) || 1);
  const currency = item.importCurrency || 'LAK';

  // Exchange rate to LAK
  const exchangeRates: Record<string, number> = {
    LAK: 1,
    THB: 650,
    USD: 22000
  };
  const rate = exchangeRates[currency] || 1;

  // Derive unit cost and total cost
  let unitCostNum = Number(item.importCost) || 0;
  let totalCostNum = Number(item.totalLotCost) || 0;

  if (costMode === 'TOTAL') {
    if (totalCostNum > 0) {
      unitCostNum = totalCostNum / qty;
    } else if (unitCostNum > 0) {
      totalCostNum = unitCostNum * qty;
    }
  } else {
    if (unitCostNum > 0 && totalCostNum <= 0) {
      totalCostNum = unitCostNum * qty;
    }
  }

  // Handle Mode Switch
  const handleModeChange = (newMode: 'UNIT' | 'TOTAL') => {
    updateField('costInputMode', newMode);
    if (newMode === 'TOTAL') {
      const calcTotal = (unitCostNum * qty).toFixed(2);
      updateField('totalLotCost', calcTotal);
    } else {
      const calcUnit = totalCostNum > 0 ? (totalCostNum / qty).toFixed(2) : (unitCostNum > 0 ? unitCostNum.toString() : '');
      updateField('importCost', calcUnit);
    }
  };

  // Handle Quantity Change
  const handleQtyChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    updateField('importQty', validQty);
    if (costMode === 'TOTAL' && totalCostNum > 0) {
      const newUnit = (totalCostNum / validQty).toFixed(2);
      updateField('importCost', newUnit);
    } else if (costMode === 'UNIT' && unitCostNum > 0) {
      const newTotal = (unitCostNum * validQty).toFixed(2);
      updateField('totalLotCost', newTotal);
    }
  };

  // Handle Unit Price Input
  const handleUnitCostChange = (val: string) => {
    updateField('importCost', val);
    const num = Number(val) || 0;
    const computedTotal = (num * qty).toFixed(2);
    updateField('totalLotCost', computedTotal);
  };

  // Handle Total Cost Input
  const handleTotalCostChange = (val: string) => {
    updateField('totalLotCost', val);
    const num = Number(val) || 0;
    const computedUnit = (num / qty).toFixed(2);
    updateField('importCost', computedUnit);
  };

  // Available units based on category
  const isPaper = item.importType === 'PAPER';
  const isInk = item.importType === 'INK';
  const isToner = isInk && (
    item.inkBaseType === 'Toner' || 
    (item.importUnit || '').toLowerCase().includes('kg') || 
    (item.importUnit || '').toLowerCase().includes('ກິໂລ') || 
    (item.importUnit || '').toLowerCase().includes('ກຣາມ') ||
    (item.importUnit || '').toLowerCase().includes('ຕລັບ') ||
    (item.importUnit || '').toLowerCase().includes('cartridge')
  );

  const paperUnits = ['ແພັກ (Pack)', 'ຣີມ (Ream)', 'ກ່ອງ/ລັງ (Carton)', 'ແຜ່ນ (Sheet)', 'ມ້ວນ (Roll)'];
  const inkUnits = isToner
    ? [
        'ກິໂລກຣາມ (Kilogram / kg)',
        'ກຣາມ (Gram / g)',
        'ຕຸກ/ຂວດ (Bottle)',
        'ຕລັບ (Cartridge)',
        'ຖົງ (Bag)',
        'ລິດ (Litre)',
        'ຊຸດ (Set)'
      ]
    : [
        'ຂວດ (Bottle)',
        'ລິດ (Litre)',
        'ກິໂລກຣາມ (Kilogram / kg)',
        'ກຣາມ (Gram / g)',
        'ຊຸດ (Set)'
      ];

  // Sheet multiplier for paper
  const sheetsPerPack = Number(item.sheetsPerPack || 500);
  const totalSheets = isPaper ? qty * sheetsPerPack : 0;
  const totalCostLAK = totalCostNum * rate;
  const unitCostLAK = unitCostNum * rate;
  const costPerSheetLAK = totalSheets > 0 ? (totalCostLAK / totalSheets) : (isPaper ? unitCostLAK / sheetsPerPack : 0);

  // Ink/Toner volume/weight multiplier
  const isKg = (item.importUnit || '').toLowerCase().includes('kg') || (item.importUnit || '').toLowerCase().includes('ກິໂລ');
  const isPureGram = (item.importUnit || '').toLowerCase().includes('gram') || (item.importUnit || '').toLowerCase().includes('ກຣາມ');
  const defaultInkVol = isToner ? 500 : 70;
  const inkVolume = Number(item.inkVolume || (isKg ? 1000 : defaultInkVol));
  
  const consumptionMultiplier = isKg ? 1000 : (isPureGram ? 1 : inkVolume);
  const totalConsumptionStock = isInk ? qty * consumptionMultiplier : 0;
  const costPerConsumptionLAK = totalConsumptionStock > 0 ? (totalCostLAK / totalConsumptionStock) : (isInk ? unitCostLAK / consumptionMultiplier : 0);

  return (
    <div className="border-t border-slate-100 pt-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-indigo-600" />
          <span>{currentLang === 'lo' ? 'ຂໍ້ມູນການຈັດຊື້ & ຕົ້ນທຶນນຳເຂົ້າ (Purchasing & Pricing)' : 'Purchasing & Cost Engine'}</span>
        </h4>

        {/* Pricing Mode Toggle: Per Unit vs Total Cost */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleModeChange('UNIT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              costMode === 'UNIT'
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{currentLang === 'lo' ? 'ລາຄາຕໍ່ 1 ໜ່ວຍ (Per Unit)' : 'Price Per Unit'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('TOTAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              costMode === 'TOTAL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentLang === 'lo' ? 'ລາຄາລວມທັງບິນ (Total Bill)' : 'Total Bill / Lot'}</span>
          </button>
        </div>
      </div>

      {/* Main Purchasing Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 bg-indigo-50/40 p-4 sm:p-5 rounded-3xl border border-indigo-100/80">
        {/* 1. Quantity & Unit */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {t('inbound.printer.import_qty')} *
          </label>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={item.importQty} 
              onChange={(e) => handleQtyChange(Number(e.target.value))} 
              className="flex-1 px-3.5 h-[42px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white text-xs font-black font-mono min-w-0" 
              min="1" 
              required 
            />
            {/* Unit Selector */}
            <select
              value={item.importUnit}
              onChange={(e) => updateField('importUnit', e.target.value)}
              className="px-2.5 sm:px-3 h-[42px] rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none cursor-pointer shrink-0"
            >
              {isPaper && paperUnits.map(u => (
                <option key={u} value={u.split(' ')[0]}>{u}</option>
              ))}
              {isInk && inkUnits.map(u => (
                <option key={u} value={u.split(' ')[0]}>{u}</option>
              ))}
              {!isPaper && !isInk && (
                <>
                  <option value="ເຄື່ອງ">ເຄື່ອງ (Unit)</option>
                  <option value="ອັນ">ອັນ (Pcs)</option>
                  <option value="ມ້ວນ">ມ້ວນ (Roll)</option>
                  <option value="ກ່ອງ">ກ່ອງ (Box)</option>
                </>
              )}
            </select>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block truncate h-4 mt-1">
            {isPaper && `= ${(qty * sheetsPerPack).toLocaleString()} ແຜ່ນທັງໝົດ (${sheetsPerPack} ແຜ່ນ/ແພັກ)`}
            {isInk && (
              isToner
                ? `= ${(qty * (isKg ? 1000 : (isPureGram ? 1 : inkVolume))).toLocaleString()} g (ກຣາມສະຕ໋ອກຕັດໃຊ້ງານ${isKg ? ' 1 kg = 1,000 g' : ''})`
                : `= ${(qty * inkVolume).toLocaleString()} ml ທັງໝົດ (ສະຕ໋ອກຕັດໃຊ້ງານ)`
            )}
          </span>
        </div>

        {/* 2. Price Input (Switches dynamically based on costMode) */}
        <div>
          <div className="h-5 flex items-center justify-between gap-1 mb-1.5">
            <label className="text-xs font-bold uppercase text-slate-700 truncate">
              {costMode === 'TOTAL' ? (
                <span className="text-indigo-700 flex items-center gap-1 font-black truncate">
                  <Calculator className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{currentLang === 'lo' ? 'ລາຄາລວມບິນ (TOTAL COST) *' : 'Total Bill / Lot Cost *'}</span>
                </span>
              ) : (
                <span className="truncate">{currentLang === 'lo' ? `ລາຄາຕໍ່ 1 ${item.importUnit || 'ໜ່ວຍ'} (UNIT COST) *` : 'Unit Cost *'}</span>
              )}
            </label>
            <span className="text-[10px] text-indigo-600 font-mono font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
              {costMode === 'TOTAL' ? 'ສະເລ່ຍໃຫ້' : 'ຄູນລວມໃຫ້'}
            </span>
          </div>

          <div className="relative">
            {costMode === 'TOTAL' ? (
              <input 
                type="number" 
                step="any"
                value={item.totalLotCost !== undefined ? item.totalLotCost : (unitCostNum * qty || '')} 
                onChange={(e) => handleTotalCostChange(e.target.value)} 
                className="w-full pl-3.5 pr-16 h-[42px] rounded-xl border-2 border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white text-xs font-black font-mono text-indigo-950" 
                placeholder="0.00" 
                required 
              />
            ) : (
              <input 
                type="number" 
                step="any"
                value={item.importCost} 
                onChange={(e) => handleUnitCostChange(e.target.value)} 
                className="w-full pl-3.5 pr-16 h-[42px] rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-white text-xs font-black font-mono text-slate-900" 
                placeholder="0.00" 
                required 
              />
            )}
            <select 
              value={item.importCurrency} 
              onChange={(e) => updateField('importCurrency', e.target.value)} 
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2 text-[10px] font-black focus:outline-none cursor-pointer"
            >
              <option value="LAK">LAK</option>
              <option value="THB">THB</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <span className="text-[10px] text-slate-500 font-semibold block truncate h-4 mt-1">
            {costMode === 'TOTAL' 
              ? `ສະເລ່ຍ: ${unitCostNum > 0 ? unitCostNum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0} ${currency} / ${item.importUnit || 'ໜ່ວຍ'}`
              : `ລວມ: ${totalCostNum > 0 ? totalCostNum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 0} ${currency}`
            }
          </span>
        </div>

        {/* 3. Payment Method */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center truncate">
            {currentLang === 'lo' ? 'ຊ່ອງທາງຊຳລະເງິນ (Payment Method) *' : 'Payment Method *'}
          </label>
          <select 
            value={item.paymentMethod} 
            onChange={(e) => updateField('paymentMethod', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 focus:outline-none bg-white text-xs font-semibold cursor-pointer"
          >
            <option value="TRANSFER">{currentLang === 'lo' ? 'ໂອນເງິນ (Bank Transfer)' : 'Bank Transfer'}</option>
            <option value="CASH">{currentLang === 'lo' ? 'ເງິນສົດ (Cash)' : 'Cash'}</option>
          </select>
          <span className="block h-4 mt-1"></span>
        </div>

        {/* 4. Supplier Phone */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center gap-1 truncate">
            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{t('inbound.printer.supplier_phone')}</span>
          </label>
          <input 
            type="tel" 
            value={item.supplierPhone} 
            onChange={(e) => updateField('supplierPhone', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 focus:outline-none bg-white text-xs font-semibold" 
            placeholder="e.g. +856 20 12345678" 
          />
          <span className="block h-4 mt-1"></span>
        </div>

        {/* 5. Purchase URL Link */}
        <div className="sm:col-span-2 xl:col-span-1">
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 h-5 flex items-center gap-1 truncate">
            <LinkIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{currentLang === 'lo' ? 'ລິ້ງສັ່ງຊື້ສິນຄ້າ / ເວັບໄຊ (Purchase Link)' : 'Purchase / Order URL'}</span>
          </label>
          <input 
            type="url" 
            value={item.purchaseLink} 
            onChange={(e) => updateField('purchaseLink', e.target.value)} 
            className="w-full px-3.5 h-[42px] rounded-xl border border-slate-200 focus:outline-none bg-white text-xs font-semibold" 
            placeholder="https://..." 
          />
          <span className="block h-4 mt-1"></span>
        </div>
      </div>

      {/* Smart Live Cost Breakdown Card (ບລັອກສະຫຼຸບຕົ້ນທຶນ ແລະ ການສະເລ່ຍອັດຕະໂນມັດ) */}
      <div className="bg-white border-2 border-indigo-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 animate-fade-in">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <h5 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {currentLang === 'lo' ? 'ບລັອກສະຫຼຸບຕົ້ນທຶນ & ການສະເລ່ຍລາຄາ (Cost Breakdown & Average Summary)' : 'Live Cost Calculation Summary'}
            </h5>
          </div>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            AUTO CALCULATED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {/* Box 1: Total Lot Cost */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              {currentLang === 'lo' ? 'ຍອດເງິນລວມທັງໝົດ (Total Lot Cost)' : 'Total Lot Cost'}
            </span>
            <div className="text-base font-black font-mono text-slate-900">
              {totalCostNum > 0 ? totalCostNum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'} <span className="text-xs text-slate-500 font-bold">{currency}</span>
            </div>
            {currency !== 'LAK' && (
              <span className="text-[10px] font-mono text-emerald-700 block font-bold">
                ≈ {totalCostLAK.toLocaleString()} LAK
              </span>
            )}
          </div>

          {/* Box 2: Unit Cost */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              {currentLang === 'lo' ? `ຕົ້ນທຶນຕໍ່ 1 ${item.importUnit || 'ໜ່ວຍ'} (Average Unit Cost)` : 'Average Unit Cost'}
            </span>
            <div className="text-base font-black font-mono text-indigo-900">
              {unitCostNum > 0 ? unitCostNum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'} <span className="text-xs text-slate-500 font-bold">{currency}</span>
            </div>
            <span className="text-[10px] text-slate-500 block font-medium truncate">
              = ຍອດລວມ ÷ {qty} {item.importUnit || 'ໜ່ວຍ'}
            </span>
          </div>

          {/* Box 3: Consumption Unit Cost (Per Sheet / Per ml / Per g) */}
          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-0.5 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">
                {isPaper 
                  ? (currentLang === 'lo' ? 'ຕົ້ນທຶນຕົວຈິງຕໍ່ 1 ແຜ່ນ (Per Sheet)' : 'Cost Per Sheet') 
                  : isInk 
                    ? (isToner 
                        ? (currentLang === 'lo' ? 'ຕົ້ນທຶນຕໍ່ 1 g (Per Gram)' : 'Cost Per Gram') 
                        : (currentLang === 'lo' ? 'ຕົ້ນທຶນຕໍ່ 1 ml (Per ml)' : 'Cost Per ml'))
                    : 'Unit Cost in LAK'}
              </span>
            </span>
            <div className="text-base font-black font-mono text-emerald-950">
              {isPaper ? (
                <>
                  {costPerSheetLAK > 0 ? costPerSheetLAK.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '0'}{' '}
                  <span className="text-xs text-emerald-700 font-bold">LAK / ແຜ່ນ</span>
                </>
              ) : isInk ? (
                <>
                  {costPerConsumptionLAK > 0 ? costPerConsumptionLAK.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}{' '}
                  <span className="text-xs text-emerald-700 font-bold">LAK / {isToner ? 'g' : 'ml'}</span>
                </>
              ) : (
                <>
                  {unitCostLAK.toLocaleString()}{' '}
                  <span className="text-xs text-emerald-700 font-bold">LAK</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block truncate">
              {isPaper && `(ໃຊ້ໃນສູດຄຳນວນລາຄາງານພິມອັດຕະໂນມັດ)`}
              {isInk && isToner && `(ໃຊ້ຄຳນວນຕົ້ນທຶນຜົງໝຶກ Laser Toner CMYK)`}
              {isInk && !isToner && `(ໃຊ້ຄຳນວນຕົ້ນທຶນນ້ຳໝຶກ CMYK)`}
              {!isPaper && !isInk && `(ລາຄາຕົ້ນທຶນຕໍ່ໜ່ວຍໃນລະບົບ)`}
            </span>
          </div>
        </div>
      </div>

      {/* Uploads (Actual Photos & Payment Slip) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Actual Product Photos Upload (Multiple) */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-slate-400">
            {currentLang === 'lo' ? 'ຮູບພາບສິນຄ້າຕົວຈິງ (Product Photos)' : 'Actual Product Photos'}
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 bg-white text-center transition cursor-pointer relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                Array.from(files).forEach(file => {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) {
                      updateField('actualImages', [...(item.actualImages || []), ev.target!.result as string]);
                    }
                  };
                  reader.readAsDataURL(file);
                });
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
              <Upload className="w-5 h-5 text-indigo-600" />
              <p className="text-xs font-semibold">{t('inbound.printer.upload_placeholder')}</p>
            </div>
          </div>

          {item.actualImages && item.actualImages.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {item.actualImages.map((img, imgIdx) => (
                <div key={imgIdx} className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <img src={img} alt={`Product ${imgIdx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      updateField('actualImages', item.actualImages.filter((_, i) => i !== imgIdx));
                    }}
                    className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded-full opacity-80 hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Slip Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-slate-400">
            {currentLang === 'lo' ? 'ໃບບິນ / ສະລິບໂອນເງິນ (Payment Slip)' : 'Payment Slip / Receipt'}
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-4 bg-white text-center transition cursor-pointer relative">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  if (ev.target?.result) updateField('paymentSlip', ev.target.result as string);
                };
                reader.readAsDataURL(file);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
              <Upload className="w-5 h-5 text-emerald-600" />
              <p className="text-xs font-semibold">{t('inbound.printer.upload_placeholder')}</p>
            </div>
          </div>

          {item.paymentSlip && (
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 truncate">Payment Slip Uploaded</span>
              <button 
                type="button" 
                onClick={() => updateField('paymentSlip', '')} 
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
};
