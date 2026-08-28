import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import { CheckCircle2 } from 'lucide-react';

import { InboundItemFormData, createDefaultItem } from './forms/types';
import { BatchSidebar } from './forms/BatchSidebar';
import { PurchasingSection } from './forms/PurchasingSection';
import { PrinterSpecsForm } from './forms/PrinterSpecsForm';
import { InkSpecsForm } from './forms/InkSpecsForm';
import { PaperSpecsForm } from './forms/PaperSpecsForm';
import { 
  MachinerySpecsForm, 
  BindingSpecsForm, 
  LaminationSpecsForm, 
  SparePartsSpecsForm, 
  OffcutSpecsForm 
} from './forms/OtherSpecsForms';

interface ImportFormProps {
  onSubmit: (type: string, data: any, isBatch?: boolean) => void;
  onClose: () => void;
}

export default function ImportForm({ onSubmit, onClose }: ImportFormProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const { equipment, inventory, showToast, formatCurrency } = useApp();

  // Multi-Item Batch List & Active Index
  const [items, setItems] = useState<InboundItemFormData[]>([
    createDefaultItem('PAPER')
  ]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Active Item Helper
  const currentItem = items[activeIdx] || items[0];

  const updateCurrentItem = (field: keyof InboundItemFormData, value: any) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === activeIdx) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleAddNewItemTab = (type: string) => {
    const newItem = createDefaultItem(type);
    setItems(prev => [...prev, newItem]);
    setActiveIdx(items.length);
  };

  const handleRemoveItemTab = (indexToRemove: number) => {
    if (items.length <= 1) {
      showToast(currentLang === 'lo' ? 'ຕ້ອງມີຢ່າງໜ້ອຍ 1 ລາຍການ' : 'Must have at least 1 item', 'warning');
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (activeIdx >= indexToRemove && activeIdx > 0) {
      setActiveIdx(activeIdx - 1);
    }
  };

  // Currency Exchange Rates to LAK
  const exchangeRates = {
    LAK: 1,
    THB: 650,
    USD: 22000
  };

  // Live Calculations for current item (Machinery)
  const totalCostInLak = Number(currentItem.importCost || 0) * (exchangeRates[currentItem.importCurrency] || 1);
  const machineryTotalMonths = (Number(currentItem.machineryLifespanYears) || 1) * 12;
  const machineryMonthlyDepr = machineryTotalMonths > 0 ? (totalCostInLak / machineryTotalMonths) : 0;
  const machineryBaseCostPerUnit = (Number(currentItem.machineryEstMonthlyVolume) || 1) > 0 ? (machineryMonthlyDepr / Number(currentItem.machineryEstMonthlyVolume)) : 0;
  const machineryNetCostPerUnit = machineryBaseCostPerUnit * (1 + (Number(currentItem.machineryMaintenanceRatePct) || 0) / 100);
  const machineryFinalUnitCost = Math.round(machineryNetCostPerUnit * 100) / 100;

  // Convert a single InboundItemFormData to final API payload
  const transformItemToPayload = (item: InboundItemFormData) => {
    const rawCost = Number(item.importCost) || 0;
    const rate = exchangeRates[item.importCurrency] || 1;
    const unitPriceLak = rawCost * rate;

    let finalData: Record<string, any> = {
      isRestockMode: false,
      importQty: Number(item.importQty),
      unit: item.importUnit,
      unitPrice: unitPriceLak,
      rawImportCost: rawCost,
      currency: item.importCurrency,
      exchangeRate: rate,
      supplier: item.importVendor || null,
      importDate: item.importDate || null,
      paymentMethod: item.paymentMethod || null,
      imageUrl: item.productImage || null,
      receiptUrl: item.paymentSlip || null,
      taxInvoiceUrl: item.taxInvoice || null,
      actual_images: item.actualImages,
      payment_slip: item.paymentSlip,
      supplier_phone: item.supplierPhone,
      purchase_link: item.purchaseLink,
      customFields: (item.customFields || []).reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {})
    };

    if (item.importType === 'PRINTER') {
      const printerSpecsObj = {
        brand: item.printerBrand,
        model: item.printerModel,
        printerCategory: item.printerCategory,
        color_config: {
          colorScheme: item.colorSchemeType,
          slots: item.colorSlots
        },
        colorSchemeType: item.colorSchemeType,
        totalColorSlots: Number(item.totalColorSlots),
        expectedLifeA4Pages: Number(item.expectedLifeA4),
        maintenanceRatePercent: Number(item.maintenanceRatePct),
        oemBaselineInks: item.printerInkSlots,
        actual_images: item.actualImages,
        payment_slip: item.paymentSlip,
        supplier_phone: item.supplierPhone,
        purchase_link: item.purchaseLink,
        location: item.printerLocation,
        warrantyExpirationYear: item.printerWarrantyYear
      };

      finalData = {
        ...finalData,
        id: item.printerAssetId,
        name: `${item.printerBrand} ${item.printerModel}`,
        serialNumber: item.printerSn,
        brand: item.printerBrand,
        model: item.printerModel,
        category: 'Printer',
        printerCategory: item.printerCategory,
        color_config: {
          colorScheme: item.colorSchemeType,
          slots: item.colorSlots
        },
        colorSchemeType: item.colorSchemeType,
        totalColorSlots: Number(item.totalColorSlots),
        expectedLifeA4Pages: Number(item.expectedLifeA4),
        maintenanceRatePercent: Number(item.maintenanceRatePct),
        printerColorLinks: item.printerInkSlots,
        oemBaselineInks: item.printerInkSlots,
        actual_images: item.actualImages,
        payment_slip: item.paymentSlip,
        supplier_phone: item.supplierPhone,
        purchase_link: item.purchaseLink,
        functions: item.selectedFunctions,
        connectivity: item.selectedConnectivity,
        osCompatibility: item.selectedOS,
        purchaseDate: item.importDate,
        price: unitPriceLak,
        unitPrice: unitPriceLak,
        vendor: item.importVendor,
        location: item.printerLocation,
        warrantyExpirationYear: item.printerWarrantyYear,
        status: 'In Use',
        specs: printerSpecsObj,
        components: [
          { name: 'Drum Unit (ຊຸດດຣຳ)', usage: 0, threshold: 90 },
          { name: 'Fuser Kit (ຊຸດຄວາມຮ້ອນ)', usage: 0, threshold: 90 },
          { name: 'Waste Toner (ກ່ອງໝຶກເສຍ)', usage: 0, threshold: 95 }
        ]
      };
    } else if (item.importType === 'INK') {
      const inkSpecsObj = {
        inkCode: item.inkCode,
        colorName: item.inkColorName,
        colorGroup: item.inkColorGroup,
        volume: Number(item.inkVolume) || 100,
        inkBaseType: item.inkBaseType,
        isCompatible: item.isCompatible,
        targetPrinterId: item.inkTargetPrinter,
        supplier_phone: item.supplierPhone,
        purchase_link: item.purchaseLink,
        actual_images: item.actualImages,
        payment_slip: item.paymentSlip
      };

      finalData = {
        ...finalData,
        id: item.inkCode,
        name: `ໝຶກ ${item.inkColorName} (${item.inkBaseType})`,
        category: 'Ink',
        inkCode: item.inkCode,
        colorName: item.inkColorName,
        colorGroup: item.inkColorGroup,
        volume: Number(item.inkVolume) || 100,
        stockQty: Number(item.importQty),
        inkBaseType: item.inkBaseType,
        isCompatible: item.isCompatible,
        targetPrinterId: item.inkTargetPrinter,
        specs: inkSpecsObj
      };
    } else if (item.importType === 'PAPER') {
      const isSheet = item.paperFormat === 'Sheet';
      const sheetsPerPack = Number(item.sheetsPerPack) || 500;
      const totalSheetsCalculated = isSheet ? (Number(item.importQty) || 1) * sheetsPerPack : null;
      const totalSqmCalculated = !isSheet ? (Number(item.rollWidthM) || 0.61) * (Number(item.rollLengthM) || 30) * (Number(item.importQty) || 1) : null;

      finalData = {
        ...finalData,
        id: item.paperCode || `PAP-${Date.now().toString().slice(-4)}`,
        name: item.paperName,
        category: 'Paper',
        brand: item.paperBrand,
        paperSurface: item.paperSurface,
        stockQty: Number(item.importQty),
        totalSheetsCalculated,
        totalSqmCalculated,
        specs: {
          paperCode: item.paperCode,
          brand: item.paperBrand,
          paperSurface: item.paperSurface,
          paperFormat: item.paperFormat,
          standardSize: isSheet ? item.paperSize : null,
          customWidthMm: item.paperSize === 'Custom Sheet' ? item.customWidthMm : null,
          customLengthMm: item.paperSize === 'Custom Sheet' ? item.customLengthMm : null,
          packagingType: isSheet ? item.packagingType : null,
          sheetsPerPack: isSheet ? sheetsPerPack : null,
          sheets_per_pack: isSheet ? sheetsPerPack : null,
          sheets_per_ream: isSheet ? sheetsPerPack : null,
          rollWidthPreset: !isSheet ? item.rollWidthPreset : null,
          rollWidthM: !isSheet ? Number(item.rollWidthM) : null,
          rollLengthM: !isSheet ? Number(item.rollLengthM) : null,
          paperCore: !isSheet ? item.paperCore : null,
          coatingTech: item.coatingTech || null,
          surfaceFinish: item.surfaceFinish || null,
          printableSides: item.printableSides || null,
          grammageGsm: item.grammage || null,
          compatibilities: item.compatibilities
        }
      };
    } else if (item.importType === 'LAMINATION') {
      finalData = {
        ...finalData,
        id: `LAM-${Date.now().toString().slice(-4)}`,
        name: item.laminationName,
        category: 'Lamination',
        stockQty: Number(item.importQty),
        specs: {
          laminationFormat: item.laminationFormat,
          laminationSize: item.laminationFormat === 'Sheet' ? item.laminationSize : null,
          laminationThickness: item.laminationThickness || null,
          laminationMethod: item.laminationMethod || null,
          laminationFinish: item.laminationFinish || null
        }
      };
    } else if (item.importType === 'MACHINERY') {
      finalData = {
        ...finalData,
        id: `MAC-${Date.now().toString().slice(-4)}`,
        name: item.machineryName || `Paper Machine ${item.machineryModel}`,
        category: 'Cutter',
        postPressSubtype: item.postPressSubtype,
        serialNumber: item.machinerySn || null,
        purchaseCost: totalCostInLak,
        purchasePrice: totalCostInLak,
        MachinePrice: totalCostInLak,
        lifespanYears: Number(item.machineryLifespanYears),
        estMonthlyVolume: Number(item.machineryEstMonthlyVolume),
        maintenanceRatePercent: Number(item.machineryMaintenanceRatePct),
        costPerConsumptionUnit: machineryFinalUnitCost,
        calculatedCostPerPage: machineryFinalUnitCost,
        maintenanceCostPerPage: machineryFinalUnitCost,
        printedPagesCapacity: Number(item.machineryEstMonthlyVolume) * machineryTotalMonths,
        TargetTotalPages: Number(item.machineryEstMonthlyVolume) * machineryTotalMonths,
        specs: {
          postPressSubtype: item.postPressSubtype,
          lifespanYears: Number(item.machineryLifespanYears),
          estMonthlyVolume: Number(item.machineryEstMonthlyVolume),
          maintenanceRatePercent: Number(item.machineryMaintenanceRatePct),
          netCostPerUnit: machineryFinalUnitCost
        }
      };
    } else if (item.importType === 'BINDING') {
      finalData = {
        ...finalData,
        id: `BIN-${Date.now().toString().slice(-4)}`,
        name: item.bindingName,
        category: 'Binding',
        stockQty: Number(item.importQty),
        specs: {
          bindingType: item.bindingType,
          bindingDiameter: item.bindingDiameter || null,
          bindingPitch: item.bindingPitch || null,
          bindingPageCapacity: item.bindingPageCapacity || null
        }
      };
    } else if (item.importType === 'SPARE_PARTS') {
      finalData = {
        ...finalData,
        id: `PRT-${Date.now().toString().slice(-4)}`,
        name: item.sparePartName,
        category: 'SpareParts',
        stockQty: Number(item.importQty),
        specs: {
          partSubCategory: item.partSubCategory,
          partModelRef: item.partModelRef || null,
          partYield: item.partYield || null
        }
      };
    } else if (item.importType === 'OFFCUT') {
      finalData = {
        ...finalData,
        id: `OFF-${Date.now().toString().slice(-4)}`,
        name: item.offcutName || 'Paper Offcut',
        category: 'Offcut',
        stockQty: Number(item.importQty || item.offcutQty),
        unit: 'ແຜ່ນ',
        specs: {
          offcutParentSku: item.offcutParentSku,
          offcutWidthMm: Number(item.offcutWidthMm),
          offcutLengthMm: Number(item.offcutLengthMm),
          offcutQty: Number(item.offcutQty),
          offcutCostPerSheet: unitPriceLak,
          offcutLocation: item.offcutLocation
        }
      };
    }

    return { type: item.importType, finalData };
  };

  const handleSubmitAll = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast(currentLang === 'lo' ? 'ກະລຸນາເພີ່ມລາຍການສິນຄ້າ' : 'Please add at least 1 item', 'warning');
      return;
    }

    const transformedItems = items.map(item => transformItemToPayload(item));

    if (transformedItems.length === 1) {
      onSubmit(transformedItems[0].type, transformedItems[0].finalData, false);
    } else {
      onSubmit('BATCH', transformedItems, true);
    }
  };

  const grandTotalAllItemsLAK = items.reduce((sum, item) => {
    const rate = exchangeRates[item.importCurrency] || 1;
    return sum + ((Number(item.importCost) || 0) * (Number(item.importQty) || 1) * rate);
  }, 0);

  return (
    <div className="h-[78vh] flex flex-col font-sans">
      
      {/* Split-Pane Container with Independent Scrolling */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-6">
        
        {/* =========================================================================
            LEFT SIDEBAR: Independent Scroll Lock (ແຖບລາຍການສິນຄ້າໃນຊຸດ)
           ========================================================================= */}
        <BatchSidebar
          items={items}
          activeIdx={activeIdx}
          currentLang={currentLang}
          exchangeRates={exchangeRates}
          grandTotalAllItemsLAK={grandTotalAllItemsLAK}
          formatCurrency={formatCurrency}
          onSelectTab={setActiveIdx}
          onAddNewItemTab={handleAddNewItemTab}
          onRemoveItemTab={handleRemoveItemTab}
        />

        {/* =========================================================================
            RIGHT MAIN AREA: Independent Scroll Form (ຟອມສເປັກຂອງໄອເທມທີ່ເລືອກ)
           ========================================================================= */}
        <div className="flex-1 h-full overflow-y-auto pr-3 min-w-0 space-y-6">
          
          {/* Active Item Title Header (Clean and without duplicate switcher) */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                {activeIdx + 1}
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {currentLang === 'lo' ? 'ກຳລັງກຳນົດສະເປັກລາຍການທີ່' : 'Configuring Item'} #{activeIdx + 1}
                </span>
                <h3 className="font-black text-sm text-slate-900">
                  {currentItem.paperName || currentItem.inkColorName || currentItem.printerModel || currentItem.machineryName || currentItem.bindingName || currentItem.laminationName || currentItem.sparePartName || currentItem.offcutName || `${currentItem.importType} Item`}
                </h3>
              </div>
            </div>

            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-xs rounded-xl">
              {currentItem.importType}
            </span>
          </div>

          <form id="inbound-master-form" onSubmit={handleSubmitAll} className="space-y-6 text-xs font-semibold text-slate-700 pb-6">
            
            {/* PRINTER SPECS */}
            {currentItem.importType === 'PRINTER' && (
              <PrinterSpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* INK SPECS */}
            {currentItem.importType === 'INK' && (
              <InkSpecsForm item={currentItem} equipment={equipment} updateField={updateCurrentItem} />
            )}

            {/* PAPER SPECS */}
            {currentItem.importType === 'PAPER' && (
              <PaperSpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* MACHINERY SPECS */}
            {currentItem.importType === 'MACHINERY' && (
              <MachinerySpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* BINDING SPECS */}
            {currentItem.importType === 'BINDING' && (
              <BindingSpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* LAMINATION SPECS */}
            {currentItem.importType === 'LAMINATION' && (
              <LaminationSpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* SPARE PARTS SPECS */}
            {currentItem.importType === 'SPARE_PARTS' && (
              <SparePartsSpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* OFFCUT SPECS */}
            {currentItem.importType === 'OFFCUT' && (
              <OffcutSpecsForm item={currentItem} inventory={inventory} updateField={updateCurrentItem} />
            )}

            {/* PURCHASING & QUANTITY SECTION */}
            <PurchasingSection
              item={currentItem}
              currentLang={currentLang}
              updateField={updateCurrentItem}
            />

          </form>

        </div>
      </div>

      {/* Fixed Sticky Footer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80 shrink-0 bg-white/80 backdrop-blur-xs">
        <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
          <span>
            {currentLang === 'lo' ? 'ຈຳນວນໃນຊຸດ:' : 'Total Batch Items:'} <strong className="text-indigo-600 text-sm font-black">{items.length}</strong> {currentLang === 'lo' ? 'ລາຍການ' : 'items'}
          </span>
          <span className="text-slate-300">|</span>
          <span>
            {currentLang === 'lo' ? 'ຍອດລວມທັງໝົດ:' : 'Grand Total:'} <strong className="text-slate-900 text-base font-black">{formatCurrency(grandTotalAllItemsLAK)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {t('common.cancel')}
          </button>

          <button
            type="submit"
            form="inbound-master-form"
            className="px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {items.length > 1 
                ? (currentLang === 'lo' ? `ບັນທຶກທັງໝົດ (${items.length} ລາຍການ)` : `Save All (${items.length} Items)`)
                : t('common.save')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
