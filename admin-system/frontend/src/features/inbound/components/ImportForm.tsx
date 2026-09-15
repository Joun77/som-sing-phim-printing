import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import { CheckCircle2 } from 'lucide-react';

import { InboundItemFormData, createDefaultItem } from './forms/types';
import { BatchSidebar } from './forms/BatchSidebar';
import { PurchasingSection } from './forms/PurchasingSection';
import { InkSpecsForm } from './forms/InkSpecsForm';
import { PaperSpecsForm } from './forms/PaperSpecsForm';
import { 
  MachinerySpecsForm, 
  BindingSpecsForm, 
  LaminationSpecsForm, 
  RigidSubstratesSpecsForm,
  CuttingSuppliesSpecsForm,
  PackagingSpecsForm,
  SparePartsSpecsForm
} from './forms/OtherSpecsForms';
import { InboundExcelModal } from './modals/InboundExcelModal';

interface ImportFormProps {
  initialType?: string;
  onSubmit: (type: string, data: any, isBatch?: boolean) => void;
  onClose: () => void;
}

export default function ImportForm({ initialType, onSubmit, onClose }: ImportFormProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const { equipment, inventory, showToast, formatCurrency } = useApp();

  // Multi-Item Batch List & Active Index
  const [items, setItems] = useState<InboundItemFormData[]>([
    createDefaultItem(initialType || 'PAPER')
  ]);
  const [activeIdx, setActiveIdx] = useState(0);

  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

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

  const handleDuplicateItemTab = (indexToDuplicate: number) => {
    const sourceItem = items[indexToDuplicate];
    if (!sourceItem) return;

    const rand = Math.floor(100 + Math.random() * 900);
    const duplicatedItem: InboundItemFormData = {
      ...JSON.parse(JSON.stringify(sourceItem)),
      id: `ITEM-${Date.now()}-${rand}`,
      // Append duplicate marker to identifiable fields
      paperName: sourceItem.paperName ? `${sourceItem.paperName} (ສຳເນົາ)` : sourceItem.paperName,
      inkColorName: sourceItem.inkColorName ? `${sourceItem.inkColorName} (ສຳເນົາ)` : sourceItem.inkColorName,
      machineModel: sourceItem.machineModel ? `${sourceItem.machineModel} (ສຳເນົາ)` : sourceItem.machineModel,
      bindingName: sourceItem.bindingName ? `${sourceItem.bindingName} (ສຳເນົາ)` : sourceItem.bindingName,
      laminationName: sourceItem.laminationName ? `${sourceItem.laminationName} (ສຳເນົາ)` : sourceItem.laminationName,
      sparePartName: sourceItem.sparePartName ? `${sourceItem.sparePartName} (ສຳເນົາ)` : sourceItem.sparePartName,
    };

    setItems(prev => [...prev, duplicatedItem]);
    setActiveIdx(items.length);
    showToast(currentLang === 'lo' ? 'ຄັດລອກລາຍການສຳເລັດ' : 'Item duplicated successfully', 'success');
  };

  const handleBulkAddItems = (newItems: InboundItemFormData[]) => {
    if (!newItems || newItems.length === 0) return;
    setItems(prev => [...prev, ...newItems]);
    setActiveIdx(items.length); // switch to first imported item
    showToast(
      currentLang === 'lo' 
        ? `ເພີ່ມສິນຄ້າຈາກ Excel ຈຳນວນ ${newItems.length} ລາຍການຮຽບຮ້ອຍແລ້ວ` 
        : `Added ${newItems.length} items from Excel`,
      'success'
    );
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
  const machineLife = Number(currentItem.machineExpectedLife) || 200000;
  const machineryNetCostPerUnit = machineLife > 0 ? (totalCostInLak / machineLife) : 0;
  const machineryFinalUnitCost = Math.round(machineryNetCostPerUnit * 100) / 100;

  // Convert a single InboundItemFormData to final API payload
  const transformItemToPayload = (item: InboundItemFormData) => {
    const qty = Number(item.importQty) || 1;
    const rate = exchangeRates[item.importCurrency] || 1;
    
    let rawUnitCost = Number(item.importCost) || 0;
    let rawTotalCost = Number(item.totalLotCost) || 0;

    if (item.costInputMode === 'TOTAL' && rawTotalCost > 0) {
      rawUnitCost = qty > 0 ? (rawTotalCost / qty) : rawTotalCost;
    } else {
      rawTotalCost = rawUnitCost * qty;
    }

    const unitPriceLak = Math.round(rawUnitCost * rate * 100) / 100;
    const totalPriceLak = Math.round(rawTotalCost * rate * 100) / 100;
    const defaultImg = (Array.isArray(item.actualImages) && item.actualImages[0]) || item.productImage || null;

    let finalData: Record<string, any> = {
      isRestockMode: false,
      importQty: qty,
      unit: item.importUnit,
      unitPrice: unitPriceLak,
      totalPrice: totalPriceLak,
      price: totalPriceLak,
      costInputMode: item.costInputMode || 'UNIT',
      totalLotCost: rawTotalCost,
      rawImportCost: rawUnitCost,
      rawTotalCost: rawTotalCost,
      currency: item.importCurrency,
      exchangeRate: rate,
      supplier: item.importVendor || null,
      importDate: item.importDate || null,
      paymentMethod: item.paymentMethod || null,
      imageUrl: defaultImg,
      itemPhoto: defaultImg,
      productPhoto: defaultImg,
      receiptUrl: item.paymentSlip || null,
      taxInvoiceUrl: item.taxInvoice || null,
      actual_images: item.actualImages,
      payment_slip: item.paymentSlip,
      docs: {
        productPhoto: defaultImg,
        paymentSlip: item.paymentSlip || null,
      },
      supplier_phone: item.supplierPhone,
      purchase_link: item.purchaseLink,
      customFields: (item.customFields || []).reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {})
    };

    if (item.importType === 'MACHINERY' || item.importType === 'PRINTER') {
      const machineType = item.machineryTypeCategory || 'laser';
      const isGuillotine = machineType === 'guillotine';
      const isPlotter = machineType === 'plotter';
      const isLaminator = machineType === 'laminator';
      const isPrinter = machineType === 'laser' || machineType === 'inkjet';

      const machineExpectedLife = Number(item.machineExpectedLife) || (
        machineType === 'laser' ? 500000 :
        machineType === 'inkjet' ? 200000 :
        machineType === 'guillotine' ? 100000 :
        machineType === 'binder' ? 30000 : 20000
      );
      const machineDeprRate = machineExpectedLife > 0 ? (unitPriceLak / machineExpectedLife) : 0;
      const finalCostPerUnit = Math.round(machineDeprRate * 100) / 100;

      const machineResolvedPhoto = (Array.isArray(item.actualImages) && item.actualImages[0]) || item.productImage || null;
      const machineSpecsObj = {
        category: machineType,
        postPressSubtype: machineType,
        brand: item.machineBrand,
        model: item.machineModel,
        serialNumber: item.machineSn || `EQ-${machineType.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
        operatingWatts: item.machineOperatingWatts,
        warmUpTimeMins: (machineType === 'guillotine' || machineType === 'inkjet') ? 0 : item.warmUpTimeMins,
        expectedLife: machineExpectedLife,
        lifeUnit: item.machineLifeUnit || (isPrinter ? 'pages' : isGuillotine ? 'cuts' : (isPlotter || isLaminator) ? 'meters' : 'books'),
        productPhoto: machineResolvedPhoto,
        
        // Printer specific
        color_config: {
          colorScheme: item.colorSchemeType,
          slots: item.colorSlots
        },
        colorSchemeType: item.colorSchemeType,
        totalColorSlots: Number(item.totalColorSlots || (item.colorSlots ? item.colorSlots.length : 4)),
        oemBaselineInks: item.printerInkSlots,
        speedMonoPpm: item.printerSpeedMonoPpm,
        speedColorPpm: item.printerSpeedColorPpm,
        feedType: item.printerFeedType,
        supportedGsmMin: item.printerSupportedGsmMin,
        supportedGsmMax: item.printerSupportedGsmMax,
        maxPaperSize: item.printerMaxPaperSize,
        duplexMode: item.printerDuplexMode,
        inkType: item.printerInkType,

        printerCategory: isPrinter ? (machineType === 'inkjet' ? 'Inkjet Printer' : 'Laser Printer') : undefined,
        machineryTypeCategory: machineType,

        // Wear parts embedded - strictly isolated by machine type
        wearDrumUnitCost: machineType === 'laser' ? item.wearDrumUnitCost : undefined,
        wearDrumUnitLife: machineType === 'laser' ? item.wearDrumUnitLife : undefined,
        wearFuserUnitCost: machineType === 'laser' ? item.wearFuserUnitCost : undefined,
        wearFuserUnitLife: machineType === 'laser' ? item.wearFuserUnitLife : undefined,
        wearTransferBeltCost: machineType === 'laser' ? item.wearTransferBeltCost : undefined,
        wearTransferBeltLife: machineType === 'laser' ? item.wearTransferBeltLife : undefined,
        wearPickupRollerCost: (machineType === 'laser' || machineType === 'inkjet') ? item.wearPickupRollerCost : undefined,
        wearPickupRollerLife: (machineType === 'laser' || machineType === 'inkjet') ? item.wearPickupRollerLife : undefined,
        wearWasteTonerBoxCost: machineType === 'laser' ? item.wearWasteTonerBoxCost : undefined,
        wearWasteTonerBoxLife: machineType === 'laser' ? item.wearWasteTonerBoxLife : undefined,

        wearMaintBoxCost: machineType === 'inkjet' ? item.wearMaintBoxCost : undefined,
        wearMaintBoxLife: machineType === 'inkjet' ? item.wearMaintBoxLife : undefined,
        wearCarriageBeltCost: machineType === 'inkjet' ? item.wearCarriageBeltCost : undefined,
        wearCarriageBeltLife: machineType === 'inkjet' ? item.wearCarriageBeltLife : undefined,
        wearPrintheadCost: machineType === 'inkjet' ? item.wearPrintheadCost : undefined,
        wearPrintheadLife: machineType === 'inkjet' ? item.wearPrintheadLife : undefined,

        cutterMaxWidthMm: item.cutterMaxWidthMm,
        cutterMaxSpeedMms: item.cutterMaxSpeedMms,
        cutterDownforceG: item.cutterDownforceG,
        wearBladeCost: item.wearBladeCost,
        wearBladeLifeMeters: item.wearBladeLifeMeters,
        wearTeflonStripCost: item.wearTeflonStripCost,
        wearTeflonStripLifeMeters: item.wearTeflonStripLifeMeters,
        wearSharpeningCost: item.wearSharpeningCost,
        wearSharpeningIntervalCuts: item.wearSharpeningIntervalCuts,
        wearCuttingStickCost: item.wearCuttingStickCost,
        wearCuttingStickLifeCuts: item.wearCuttingStickLifeCuts,

        laminatorMaxWidthMm: item.laminatorMaxWidthMm,
        laminatorMaxSpeedMmin: item.laminatorMaxSpeedMmin,
        wearSiliconeRollerCost: item.wearSiliconeRollerCost,
        wearSiliconeRollerLifeMeters: item.wearSiliconeRollerLifeMeters,

        binderMaxThicknessMm: item.binderMaxThicknessMm,
        binderSpeedBooksHr: item.binderSpeedBooksHr,
        wearMillingCutterCost: item.wearMillingCutterCost,
        wearMillingCutterLifeBooks: item.wearMillingCutterLifeBooks,

        actual_images: item.actualImages,
        payment_slip: item.paymentSlip,
        supplier_phone: item.supplierPhone,
        purchase_link: item.purchaseLink,
        location: item.printerLocation,
        warrantyExpirationYear: item.printerWarrantyYear
      };

      const resolvedCategory = isPrinter 
        ? 'Printer' 
        : (isLaminator ? 'Laminator' : (machineType === 'binder' ? 'Binder' : 'Cutter'));

      finalData = {
        ...finalData,
        id: `MAC-${Date.now().toString().slice(-4)}`,
        name: `${item.machineBrand} ${item.machineModel}`.trim() || `Machine ${item.machineryTypeCategory}`,
        serialNumber: item.machineSn,
        brand: item.machineBrand,
        model: item.machineModel,
        category: resolvedCategory,
        printerCategory: isPrinter ? (machineType === 'inkjet' ? 'Inkjet Printer' : 'Laser Printer') : undefined,
        postPressSubtype: machineType,
        status: 'In Use',
        price: unitPriceLak,
        unitPrice: unitPriceLak,
        purchaseCost: unitPriceLak,
        purchasePrice: unitPriceLak,
        MachinePrice: unitPriceLak,
        costPerConsumptionUnit: finalCostPerUnit,
        calculatedCostPerPage: finalCostPerUnit,
        TargetTotalPages: machineExpectedLife,
        printedPagesCapacity: machineExpectedLife,
        expectedLifeA4Pages: isPrinter ? machineExpectedLife : undefined,
        imageUrl: machineResolvedPhoto,
        itemPhoto: machineResolvedPhoto,
        productPhoto: machineResolvedPhoto,
        docs: {
          productPhoto: machineResolvedPhoto,
          paymentSlip: item.paymentSlip || null,
        },
        specs: {
          ...machineSpecsObj,
          oemBaselineInks: item.printerInkSlots,
          printerInkSlots: item.printerInkSlots,
        },
        oemBaselineInks: item.printerInkSlots,
        printerInkSlots: item.printerInkSlots,
      };
    } else if (item.importType === 'INK') {
      const isToner = item.inkBaseType === 'Toner' || 
        (item.importUnit || '').toLowerCase().includes('kg') || 
        (item.importUnit || '').toLowerCase().includes('ກິໂລ') || 
        (item.importUnit || '').toLowerCase().includes('ກຣາມ') ||
        (item.importUnit || '').toLowerCase().includes('ຕລັບ') ||
        (item.importUnit || '').toLowerCase().includes('cartridge');

      const isKg = (item.importUnit || '').toLowerCase().includes('kg') || (item.importUnit || '').toLowerCase().includes('ກິໂລ');
      const isPureGram = (item.importUnit || '').toLowerCase().includes('gram') || (item.importUnit || '').toLowerCase().includes('ກຣາມ');
      
      const defaultInkVol = isToner ? 500 : 70;
      const inkVolumeVal = Number(item.inkVolume) || (isKg ? 1000 : defaultInkVol);
      const packCount = Number(item.importQty) || 1;
      const consumptionMultiplier = isKg ? 1000 : (isPureGram ? 1 : inkVolumeVal);
      const totalConsumptionStock = packCount * consumptionMultiplier;
      const consumptionUnit = isToner ? 'g' : 'ml';
      const costPerConsumption = totalConsumptionStock > 0 ? (totalPriceLak / totalConsumptionStock) : 0;

      const inkSpecsObj = {
        inkCode: item.inkCode,
        colorName: item.inkColorName,
        colorGroup: item.inkColorGroup,
        volume: inkVolumeVal,
        inkVolume: inkVolumeVal,
        netWeightGrams: isToner ? (isKg ? 1000 : inkVolumeVal) : undefined,
        consumptionUnit: consumptionUnit,
        costPerConsumptionUnit: costPerConsumption,
        purchaseMultiplier: consumptionMultiplier,
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
        name: isToner ? `ຜົງໝຶກ ${item.inkColorName} (${item.inkBaseType})` : `ໝຶກ ${item.inkColorName} (${item.inkBaseType})`,
        category: 'Ink',
        inkCode: item.inkCode,
        colorName: item.inkColorName,
        colorGroup: item.inkColorGroup,
        volume: inkVolumeVal,
        stockQty: totalConsumptionStock,
        consumptionUnit: consumptionUnit,
        purchaseUnit: item.importUnit || (isToner ? 'ກິໂລກຣາມ (kg)' : 'ຂວດ'),
        purchaseMultiplier: consumptionMultiplier,
        costPerConsumptionUnit: costPerConsumption,
        unitPrice: totalPriceLak / Math.max(1, packCount),
        costPerPurchaseUnit: totalPriceLak / Math.max(1, packCount),
        inkBaseType: item.inkBaseType,
        isCompatible: item.isCompatible,
        targetPrinterId: item.inkTargetPrinter,
        specs: inkSpecsObj
      };
    } else if (item.importType === 'PAPER') {
      const isRoll = (item.paperFormat || '').toLowerCase() === 'roll';
      const isSheet = !isRoll;
      const sheetsPerPack = Number(item.sheetsPerPack) || (item.importUnit?.includes('ລັງ') || item.importUnit?.includes('Carton') ? 2500 : 500);
      const totalSheetsCalculated = isSheet ? (Number(item.importQty) || 1) * sheetsPerPack : null;
      const totalSqmCalculated = isRoll ? (Number(item.rollWidthM) || 0.61) * (Number(item.rollLengthM) || 30) * (Number(item.importQty) || 1) : null;

      const costPerSheet = isSheet && totalSheetsCalculated && totalSheetsCalculated > 0
        ? Math.round((totalPriceLak / totalSheetsCalculated) * 100) / 100
        : (totalPriceLak / Math.max(1, Number(item.importQty) || 1));

      finalData = {
        ...finalData,
        id: item.paperCode || `PAP-${Date.now().toString().slice(-4)}`,
        name: item.paperName,
        category: 'Paper',
        brand: item.paperBrand,
        paperSurface: item.paperSurface || (item.paperType === 'Plain Paper' ? 'Plain Paper' : 'Glossy'),
        stockQty: isSheet ? (totalSheetsCalculated || Number(item.importQty)) : Number(item.importQty),
        totalSheetsCalculated,
        totalSqmCalculated,
        costPerPurchaseUnit: unitPriceLak,
        costPerConsumptionUnit: costPerSheet,
        costPerSheet,
        specs: {
          paperCode: item.paperCode || `PAP-${item.paperSize || 'A4'}-${item.grammage || '80'}-${Date.now().toString().slice(-4)}`,
          paperType: item.paperType || 'Plain Paper',
          brand: item.paperBrand,
          paperSurface: item.paperSurface || (item.paperType === 'Plain Paper' ? 'Plain Paper' : 'Glossy'),
          paperFormat: item.paperFormat || 'cut_sheet',
          standardSize: isSheet ? (item.paperSize || 'A4') : null,
          customWidthMm: item.paperSize === 'Custom Sheet' ? item.customWidthMm : null,
          customLengthMm: item.paperSize === 'Custom Sheet' ? item.customLengthMm : null,
          packagingType: isSheet ? (item.packagingType || (item.importUnit?.includes('ຣີມ') ? 'Ream' : 'Pack')) : null,
          sheetsPerPack: isSheet ? sheetsPerPack : null,
          sheets_per_pack: isSheet ? sheetsPerPack : null,
          sheets_per_ream: isSheet ? sheetsPerPack : null,
          rollWidthPreset: isRoll ? item.rollWidthPreset : null,
          rollWidthM: isRoll ? Number(item.rollWidthM) : null,
          rollLengthM: isRoll ? Number(item.rollLengthM) : null,
          paperCore: isRoll ? item.paperCore : null,
          coatingTech: item.coatingTech || null,
          surfaceFinish: isSheet ? (item.paperSurface || 'Uncoated') : (item.surfaceFinish || null),
          printableSides: item.printableSides || 'double',
          grammageGsm: item.grammage || '80',
          compatibilities: item.compatibilities || ['Inkjet', 'Laser']
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
        name: item.sparePartName || 'Spare Part',
        category: 'SpareParts',
        stockQty: Number(item.importQty),
        unit: item.importUnit || 'ອັນ',
        consumptionUnit: item.importUnit || 'ອັນ',
        purchaseUnit: item.importUnit || 'ອັນ',
        assigned_printer_id: item.assignedPrinterId || null,
        costPerPurchaseUnit: unitPriceLak,
        costPerConsumptionUnit: unitPriceLak,
        specs: {
          partName: item.sparePartName,
          partCategory: item.sparePartCategory || 'drum',
          assignedPrinterId: item.assignedPrinterId || null,
          expectedLifespanUnits: Number(item.sparePartExpectedLife) || 50000,
          unitType: item.sparePartUnitType || 'pages',
          modelRef: item.sparePartModelRef || null
        },
        technical_specs: {
          partName: item.sparePartName,
          partCategory: item.sparePartCategory || 'drum',
          assigned_printer_id: item.assignedPrinterId || null,
          expectedLifespanUnits: Number(item.sparePartExpectedLife) || 50000,
          unitType: item.sparePartUnitType || 'pages',
          modelRef: item.sparePartModelRef || null
        }
      };
    } else if (item.importType === 'OFFCUT') {
      finalData = {
        ...finalData,
        id: `OFF-${Date.now().toString().slice(-4)}`,
        name: 'Paper Offcut',
        category: 'Offcut',
        stockQty: Number(item.importQty),
        unit: 'ແຜ່ນ',
      };
    } else if (item.importType === 'RIGID_SUBSTRATES') {
      finalData = {
        ...finalData,
        id: `RIG-${Date.now().toString().slice(-4)}`,
        name: `${item.rigidSubstrateType || 'Rigid Board'} ${item.rigidBoardThicknessMm || 5}mm`,
        category: 'RigidSubstrates',
        stockQty: Number(item.importQty),
        unit: 'ແຜ່ນ',
        specs: {
          substrateType: item.rigidSubstrateType,
          thicknessMm: Number(item.rigidBoardThicknessMm || 5),
          colorSurface: item.rigidColorSurface || 'White',
          sheetWidthMm: Number(item.rigidSheetWidthMm || 1220),
          sheetHeightMm: Number(item.rigidSheetHeightMm || 2440),
          areaSqm: ((Number(item.rigidSheetWidthMm || 1220) * Number(item.rigidSheetHeightMm || 2440)) / 1000000),
          wasteFactorPct: Number(item.rigidWasteFactorPct || 15)
        }
      };
    } else if (item.importType === 'CUTTING_SUPPLIES') {
      finalData = {
        ...finalData,
        id: `CUT-${Date.now().toString().slice(-4)}`,
        name: item.cuttingSupplyType === 'cutting_mat' ? 'Cutting Mat' : 'Transfer Tape',
        category: 'CuttingSupplies',
        stockQty: Number(item.importQty),
        specs: {
          supplyType: item.cuttingSupplyType,
          transferTapeType: item.transferTapeType,
          transferTapeTack: item.transferTapeTack,
          widthMm: item.transferTapeWidthMm,
          lengthM: item.transferTapeLengthM,
          cuttingMatGrip: item.cuttingMatGrip,
          cuttingMatSize: item.cuttingMatSize,
          cuttingMatCycles: item.cuttingMatCycles
        }
      };
    } else if (item.importType === 'PACKAGING') {
      finalData = {
        ...finalData,
        id: `PCK-${Date.now().toString().slice(-4)}`,
        name: item.packagingDimensions || `Packaging ${item.packagingCategory}`,
        category: 'Packaging',
        stockQty: Number(item.importQty),
        specs: {
          packagingCategory: item.packagingCategory,
          dimensions: item.packagingDimensions,
          bubbleRollWidthCm: item.bubbleRollWidthCm,
          bubbleRollLengthM: item.bubbleRollLengthM,
          tapeWidthMm: item.tapeWidthMm,
          tapeLengthM: item.tapeLengthM
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
    const qty = Number(item.importQty) || 1;
    const rawTotal = (item.costInputMode === 'TOTAL' && Number(item.totalLotCost) > 0)
      ? Number(item.totalLotCost)
      : (Number(item.importCost) || 0) * qty;
    return sum + (rawTotal * rate);
  }, 0);

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 font-sans">
      
      {/* Split-Pane Container with Independent Scrolling */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-4 lg:gap-5 min-h-0">
        
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
          onDuplicateItem={handleDuplicateItemTab}
          onRemoveItemTab={handleRemoveItemTab}
          onOpenExcelModal={() => setIsExcelModalOpen(true)}
        />

        {/* =========================================================================
            RIGHT MAIN AREA: Independent Scroll Form (ຟອມສເປັກຂອງໄອເທມທີ່ເລືອກ)
           ========================================================================= */}
        <div className="flex-1 h-full overflow-y-auto pr-1.5 sm:pr-3 min-w-0 space-y-5 min-h-0">
          
          {/* Active Item Title Header (Clean and without duplicate switcher) */}
          <div className="flex items-center justify-between bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center shadow-xs shrink-0">
                {activeIdx + 1}
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  {currentLang === 'lo' ? 'ກຳລັງກຳນົດສະເປັກລາຍການທີ່' : 'Configuring Item'} #{activeIdx + 1}
                </span>
                <h3 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                  {(() => {
                    if (currentItem.importType === 'PAPER') return currentItem.paperName || 'Paper Item';
                    if (currentItem.importType === 'INK') {
                      const isTnr = currentItem.inkBaseType === 'Toner' || (currentItem.importUnit || '').toLowerCase().includes('kg');
                      return currentItem.inkColorName 
                        ? (isTnr ? `ຜົງໝຶກ ${currentItem.inkColorName}` : `ໝຶກ ${currentItem.inkColorName}`) 
                        : (isTnr ? 'Laser Toner Item' : 'Ink Item');
                    }
                    if (currentItem.importType === 'MACHINERY' || currentItem.importType === 'MACHINERY_INKJET') return currentItem.machineModel || currentItem.machineBrand || 'Machine Item';
                    if (currentItem.importType === 'BINDING_SUPPLY') return currentItem.bindingName || 'Binding Supply';
                    if (currentItem.importType === 'LAMINATION_FILM') return currentItem.laminationName || 'Lamination Film';
                    if (currentItem.importType === 'SPARE_PART') return currentItem.sparePartName || 'Spare Part';
                    if (currentItem.importType === 'RIGID_SUBSTRATE') return currentItem.rigidSubstrateType ? `Rigid ${currentItem.rigidSubstrateType}` : 'Rigid Board';
                    if (currentItem.importType === 'PACKAGING') return currentItem.packagingCategory ? `Packaging ${currentItem.packagingCategory}` : 'Packaging Item';
                    if (currentItem.importType === 'CUTTING_BLADE') return currentItem.cuttingSupplyType ? `Cutting ${currentItem.cuttingSupplyType}` : 'Cutting Supply';
                    return `${currentItem.importType} Item`;
                  })()}
                </h3>
              </div>
            </div>

            <span className={`px-2.5 sm:px-3 py-1 font-extrabold text-[11px] sm:text-xs rounded-xl shrink-0 ml-2 border ${
              currentItem.importType === 'INK' && (currentItem.inkBaseType === 'Toner' || (currentItem.importUnit || '').toLowerCase().includes('kg'))
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}>
              {currentItem.importType === 'INK'
                ? (currentItem.inkBaseType === 'Toner' || (currentItem.importUnit || '').toLowerCase().includes('kg') ? 'TONER' : 'INK')
                : currentItem.importType}
            </span>
          </div>

          <form id="inbound-master-form" onSubmit={handleSubmitAll} className="space-y-5 text-xs font-semibold text-slate-700 pb-4">
            
            {/* 1. MACHINERY & PRINTERS (ALL MACHINES WITH WEAR PARTS) */}
            {(currentItem.importType === 'MACHINERY' || currentItem.importType === 'PRINTER') && (
              <MachinerySpecsForm
                item={currentItem}
                updateField={updateCurrentItem}
              />
            )}

            {/* 2. PAPER & MEDIA */}
            {currentItem.importType === 'PAPER' && (
              <PaperSpecsForm
                item={currentItem}
                updateField={updateCurrentItem}
              />
            )}

            {/* 3. INK & TONER */}
            {currentItem.importType === 'INK' && (
              <InkSpecsForm
                item={currentItem}
                updateField={updateCurrentItem}
                equipment={equipment}
              />
            )}

            {/* 4. LAMINATION */}
            {currentItem.importType === 'LAMINATION' && (
              <LaminationSpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* 5. BINDING */}
            {currentItem.importType === 'BINDING' && (
              <BindingSpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* 6. CUTTING SUPPLIES */}
            {currentItem.importType === 'CUTTING_SUPPLIES' && (
              <CuttingSuppliesSpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* 7. RIGID SUBSTRATES */}
            {currentItem.importType === 'RIGID_SUBSTRATES' && (
              <RigidSubstratesSpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* 8. PACKAGING CONSUMABLES */}
            {currentItem.importType === 'PACKAGING' && (
              <PackagingSpecsForm item={currentItem} updateField={updateCurrentItem} />
            )}

            {/* 9. SPARE PARTS RESTOCK */}
            {currentItem.importType === 'SPARE_PARTS' && (
              <SparePartsSpecsForm item={currentItem} updateField={updateCurrentItem} />
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/80 shrink-0 bg-white/95 backdrop-blur-xs">
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-bold text-slate-600 w-full sm:w-auto justify-between sm:justify-start">
          <span>
            {currentLang === 'lo' ? 'ຈຳນວນໃນຊຸດ:' : 'Total Batch Items:'} <strong className="text-indigo-600 text-sm font-black">{items.length}</strong> {currentLang === 'lo' ? 'ລາຍການ' : 'items'}
          </span>
          <span className="text-slate-300">|</span>
          <span>
            {currentLang === 'lo' ? 'ຍອດລວມທັງໝົດ:' : 'Grand Total:'} <strong className="text-slate-900 text-base font-black">{formatCurrency(grandTotalAllItemsLAK)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer text-center"
          >
            {t('common.cancel')}
          </button>

          <button
            type="submit"
            form="inbound-master-form"
            className="flex-1 sm:flex-initial px-5 sm:px-7 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {items.length > 1 
                ? (currentLang === 'lo' ? `ບັນທຶກທັງໝົດ (${items.length} ລາຍການ)` : `Save All (${items.length} Items)`)
                : t('common.save')}
            </span>
          </button>
        </div>
      </div>

      {/* Excel Template & Bulk Import Modal */}
      <InboundExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportSuccess={handleBulkAddItems}
        currentLang={currentLang}
      />
    </div>
  );
}
