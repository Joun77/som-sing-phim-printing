import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '@store/AppContext';
import ColorSlotConfigurator, { ColorSlot, STANDARD_PRESETS } from '@features/inventory/components/forms/common/ColorSlotConfigurator';
import { 
  Upload, 
  X, 
  Plus, 
  Trash, 
  Layers, 
  Settings, 
  FileText, 
  Printer, 
  FileImage, 
  ShieldAlert,
  Calculator,
  RefreshCw,
  PackageCheck,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Phone,
  Link as LinkIcon
} from 'lucide-react';

export default function ImportForm({ onSubmit, onClose }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'lo';
  const { equipment, inventory, showToast, formatCurrency } = useApp();

  // Mode Selection: 'NEW' (New Master Item) vs 'RESTOCK' (Existing Stock Restock)
  const [inboundMode, setInboundMode] = useState('NEW');
  const [selectedRestockId, setSelectedRestockId] = useState('');

  const [importType, setImportType] = useState('PRINTER'); 
  // 'PRINTER' | 'INK' | 'PAPER' | 'LAMINATION' | 'MACHINERY' | 'BINDING' | 'SPARE_PARTS'

  // --- Dynamic Color Scheme Sub-Modal State ---
  const [colorSchemeOptions, setColorSchemeOptions] = useState([
    'CMYK',
    'Photo (6 Colors)',
    'Plotter (10-12 Colors)',
    'Monochrome'
  ]);
  const [isCustomSchemeModalOpen, setIsCustomSchemeModalOpen] = useState(false);
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemeSlots, setNewSchemeSlots] = useState(6);

  // --- Common Purchase Fields ---
  const [importQty, setImportQty] = useState(1);
  const [importUnit, setImportUnit] = useState('ແຜ່ນ');
  const [importCost, setImportCost] = useState('');
  const [importCurrency, setImportCurrency] = useState('LAK');
  const [importVendor, setImportVendor] = useState('');
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [productImage, setProductImage] = useState('');
  const [paymentSlip, setPaymentSlip] = useState('');
  const [taxInvoice, setTaxInvoice] = useState('');

  // Currency Exchange Rates to LAK
  const exchangeRates = {
    LAK: 1,
    THB: 650,
    USD: 22000
  };

  // --- Dynamic Custom Fields ---
  const [customFields, setCustomFields] = useState([]);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // --- 1. PRINTER Master Specs ---
  const [printerAssetId, setPrinterAssetId] = useState(`PRN-${Date.now().toString().slice(-4)}`);
  const [printerSn, setPrinterSn] = useState('');
  const [printerBrand, setPrinterBrand] = useState('');
  const [printerModel, setPrinterModel] = useState('');
  const [printerCategory, setPrinterCategory] = useState('Laser');
  const [colorSchemeType, setColorSchemeType] = useState('CMYK');
  const [colorSlots, setColorSlots] = useState<ColorSlot[]>(STANDARD_PRESETS['CMYK']);
  const [totalColorSlots, setTotalColorSlots] = useState(4);
  const [expectedLifeA4, setExpectedLifeA4] = useState(500000);
  const [maintenanceRatePct, setMaintenanceRatePct] = useState(20);
  const [selectedFunctions, setSelectedFunctions] = useState(['Print']);
  const [selectedConnectivity, setSelectedConnectivity] = useState(['USB', 'Wi-Fi']);
  const [selectedOS, setSelectedOS] = useState(['Windows', 'macOS']);
  const [printerLocation, setPrinterLocation] = useState('Main Dept');
  const [printerWarrantyYear, setPrinterWarrantyYear] = useState(new Date().getFullYear() + 2);

  // --- Purchasing & Proofs Fields ---
  const [actualImages, setActualImages] = useState<string[]>([]);
  const [supplierPhone, setSupplierPhone] = useState('');
  const [purchaseLink, setPurchaseLink] = useState('');

  // --- 2. INK Master Specs ---
  const [inkCode, setInkCode] = useState(`INK-${Date.now().toString().slice(-4)}`);
  const [inkColorName, setInkColorName] = useState('');
  const [inkColorGroup, setInkColorGroup] = useState('Cyan');
  const [inkVolume, setInkVolume] = useState('100');
  const [inkBaseType, setInkBaseType] = useState('Dye');
  const [isCompatible, setIsCompatible] = useState(false);
  const [inkTargetPrinter, setInkTargetPrinter] = useState('');

  // --- Dynamic Ink Slot Mapping for Printer Form (OEM Baseline Standard Specs) ---
  const [printerInkSlots, setPrinterInkSlots] = useState([
    { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500 },
    { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
    { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
    { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
  ]);

  const handleColorSlotsChange = (newSlots: ColorSlot[]) => {
    setColorSlots(newSlots);
    setTotalColorSlots(newSlots.length);
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
  };

  const handleColorSchemeChange = (newScheme: string) => {
    setColorSchemeType(newScheme);
    if (STANDARD_PRESETS[newScheme]) {
      handleColorSlotsChange(STANDARD_PRESETS[newScheme]);
    }
  };


  // --- 3. PAPER Master Specs ---
  const [paperCode, setPaperCode] = useState(`PAP-${Date.now().toString().slice(-4)}`);
  const [paperName, setPaperName] = useState('');
  const [paperBrand, setPaperBrand] = useState('');
  const [paperSurface, setPaperSurface] = useState('Glossy');
  const [paperFormat, setPaperFormat] = useState('Sheet');
  const [paperSize, setPaperSize] = useState('A4');
  const [customWidthMm, setCustomWidthMm] = useState('');
  const [customLengthMm, setCustomLengthMm] = useState('');
  const [packagingType, setPackagingType] = useState('Ream');
  const [sheetsPerPack, setSheetsPerPack] = useState(500);
  
  // Roll Paper Specs
  const [rollWidthPreset, setRollWidthPreset] = useState('24"');
  const [rollWidthM, setRollWidthM] = useState(0.610);
  const [rollLengthM, setRollLengthM] = useState(30);
  const [paperCore, setPaperCore] = useState('2"');
  
  const [coatingTech, setCoatingTech] = useState('');
  const [surfaceFinish, setSurfaceFinish] = useState('');
  const [printableSides, setPrintableSides] = useState('');
  const [grammage, setGrammage] = useState('80');
  const [compatibilities, setCompatibilities] = useState(['dye', 'pigment']);

  // --- 4. Live Calculator Preview State ---
  const [previewJobWidthMm, setPreviewJobWidthMm] = useState(210);
  const [previewJobLengthMm, setPreviewJobLengthMm] = useState(297);
  const [previewCoverageK, setPreviewCoverageK] = useState(5);
  const [previewCoverageC, setPreviewCoverageC] = useState(5);
  const [previewCoverageM, setPreviewCoverageM] = useState(5);
  const [previewCoverageY, setPreviewCoverageY] = useState(5);
  const [previewLaborCost, setPreviewLaborCost] = useState(1000);
  const [previewFinishingCost, setPreviewFinishingCost] = useState(500);
  const [previewWastePct, setPreviewWastePct] = useState(5);
  const [previewProfitPct, setPreviewProfitPct] = useState(30);

  // --- 5. LAMINATION State ---
  const [laminationName, setLaminationName] = useState('');
  const [laminationFormat, setLaminationFormat] = useState('Sheet');
  const [laminationSize, setLaminationSize] = useState('A4');
  const [laminationThickness, setLaminationThickness] = useState('125 Micron');
  const [laminationMethod, setLaminationMethod] = useState('');
  const [laminationFinish, setLaminationFinish] = useState('');

  // --- 6. MACHINERY / POST-PRESS State ---
  const [machineryName, setMachineryName] = useState('');
  const [machineryModel, setMachineryModel] = useState('');
  const [machinerySn, setMachinerySn] = useState('');
  const [postPressSubtype, setPostPressSubtype] = useState('guillotine');
  const [machineryLifespanYears, setMachineryLifespanYears] = useState(5);
  const [machineryEstMonthlyVolume, setMachineryEstMonthlyVolume] = useState(50000);
  const [machineryMaintenanceRatePct, setMachineryMaintenanceRatePct] = useState(15);

  // Streamlined Post-Press Machinery Cost Calculation for Inbound Procurement
  const totalCostInLak = Number(importCost || 0) * (exchangeRates[importCurrency] || 1);
  const machineryTotalMonths = (Number(machineryLifespanYears) || 1) * 12;
  const machineryMonthlyDepr = machineryTotalMonths > 0 ? (totalCostInLak / machineryTotalMonths) : 0;
  const machineryBaseCostPerUnit = (Number(machineryEstMonthlyVolume) || 1) > 0 ? (machineryMonthlyDepr / Number(machineryEstMonthlyVolume)) : 0;
  const machineryNetCostPerUnit = machineryBaseCostPerUnit * (1 + (Number(machineryMaintenanceRatePct) || 0) / 100);
  const machineryFinalUnitCost = Math.round(machineryNetCostPerUnit * 100) / 100;

  // --- 7. BINDING State ---
  const [bindingName, setBindingName] = useState('');
  const [bindingType, setBindingType] = useState('Wire-O');
  const [bindingDiameter, setBindingDiameter] = useState('');
  const [bindingPitch, setBindingPitch] = useState('');
  const [bindingPageCapacity, setBindingPageCapacity] = useState('');

  // --- 8. SPARE PARTS State ---
  const [sparePartName, setSparePartName] = useState('');
  const [partSubCategory, setPartSubCategory] = useState('Spare Parts');
  const [partModelRef, setPartModelRef] = useState('');
  const [partYield, setPartYield] = useState('');

  // --- 9. OFFCUT State ---
  const [offcutName, setOffcutName] = useState('');
  const [offcutParentSku, setOffcutParentSku] = useState('');
  const [offcutWidthMm, setOffcutWidthMm] = useState(100);
  const [offcutLengthMm, setOffcutLengthMm] = useState(150);
  const [offcutQty, setOffcutQty] = useState(100);
  const [offcutLocation, setOffcutLocation] = useState('Shelf A-1 (Offcuts)');

  // Constants
  const printerCategories = ['Laser', 'Inkjet', 'MFP', 'Plotter', 'UV Flatbed', 'Sublimation'];
  const functionOptions = ['Print', 'Scan', 'Copy', 'Fax'];
  const connectivityOptions = ['USB', 'Wi-Fi', 'Ethernet', 'Bluetooth'];
  const osOptions = ['Windows', 'macOS', 'Linux'];
  const colorGroups = ['Cyan', 'Magenta', 'Yellow', 'Black', 'Light Cyan', 'Light Magenta', 'White', 'Varnish', 'Other'];
  const inkBaseTypes = ['Dye', 'Pigment', 'Toner', 'UV Curable', 'Eco-Solvent'];
  const paperSurfaces = ['Glossy', 'Matte', 'Satin/Luster', 'Plain Paper', 'Canvas', 'Sticker/Vinyl'];
  const printersList = equipment.filter(eq => eq.category === 'Printer');

  const paperSizes = ['A4', 'A3', 'A3+', 'A5', 'B5', 'SRA3', 'Custom Sheet'];
  const rollWidthPresets = [
    { label: '12" (0.305m)', value: 0.305 },
    { label: '24" (0.610m)', value: 0.610 },
    { label: '36" (0.914m)', value: 0.914 },
    { label: '44" (1.118m)', value: 1.118 },
    { label: '60" (1.524m)', value: 1.524 }
  ];
  const coatingOptions = ['RC Coated', 'Cast Coated'];
  const finishOptions = ['Glossy', 'Luster/Satin', 'Matte', 'Silky', 'Canvas'];
  const sidesOptions = ['Single-Sided', 'Double-Sided'];
  const grammageOptions = ['70', '80', '100', '130', '160', '180', '210', '230', '260', '300'];
  const compatibilityOptions = [
    { id: 'dye', label: 'Inkjet - Dye Ink (ໝຶກນ້ຳທຳມະດາ)' },
    { id: 'pigment', label: 'Inkjet - Pigment Ink (ໝຶກກັນນ້ຳ)' },
    { id: 'toner', label: 'Laser / Digital Press (Toner) (ທົນຄວາມຮ້ອນ)' },
    { id: 'solvent', label: 'Eco-Solvent / UV / Latex (ສຳລັບ Plotter)' }
  ];

  const driveSystems = ['Manual', 'Electric', 'Hydraulic'];
  const bindingTypes = ['Wire-O', 'Plastic Comb', 'Hot Melt Glue Strip'];
  const pitchOptions = ['3:1', '2:1'];
  const partSubCategories = ['Spare Parts', 'Replacement Blades/Punches', 'Maintenance Chemicals', 'General Tools'];

  const handleRestockSelect = (id) => {
    setSelectedRestockId(id);
    const item = inventory.find(i => i.id === id);
    if (item) {
      setImportUnit(item.consumptionUnit || item.purchaseUnit || 'Unit');
      setImportCost(item.costPerPurchaseUnit ? String(item.costPerPurchaseUnit) : '');
      if (item.category === 'Ink') setImportType('INK');
      else if (item.category === 'Paper') setImportType('PAPER');
      else if (item.category === 'Lamination') setImportType('LAMINATION');
    }
  };

  const totalSheetsCalc = useMemo(() => {
    if (paperFormat !== 'Sheet') return 0;
    return (Number(importQty) || 0) * (Number(sheetsPerPack) || 1);
  }, [paperFormat, importQty, sheetsPerPack]);

  const totalSqmCalc = useMemo(() => {
    if (paperFormat !== 'Roll') return 0;
    return (Number(rollWidthM) || 0) * (Number(rollLengthM) || 0) * (Number(importQty) || 0);
  }, [paperFormat, rollWidthM, rollLengthM, importQty]);

  const costPreview = useMemo(() => {
    const rawCost = Number(importCost) || 0;
    const rate = exchangeRates[importCurrency] || 1;
    const costInLak = rawCost * rate;

    const jobAreaMm2 = (Number(previewJobWidthMm) || 210) * (Number(previewJobLengthMm) || 297);
    const factorS = jobAreaMm2 / 62370;

    let paperCostPerSheet = 0;
    if (paperFormat === 'Sheet') {
      const sheetsCount = (Number(sheetsPerPack) || 1);
      const costPerFullSheet = costInLak / sheetsCount;
      paperCostPerSheet = costPerFullSheet * factorS;
    } else {
      const rollSqm = (Number(rollWidthM) || 1) * (Number(rollLengthM) || 1);
      const costPerSqm = costInLak / (rollSqm || 1);
      const jobSqm = jobAreaMm2 / 1000000;
      paperCostPerSheet = costPerSqm * jobSqm;
    }

    const machinePriceLak = importType === 'PRINTER' ? costInLak : 50000000; 
    const maintenanceFactor = 1 + ((Number(maintenanceRatePct) || 20) / 100);
    const lifePages = Number(expectedLifeA4) || 500000;
    const machineCostPerJob = (machinePriceLak * maintenanceFactor / lifePages) * factorS;

    const inkUnitPrice = importType === 'INK' ? costInLak : 250000; 
    const inkYield = 4000;
    const inkCostPer5Pct = inkUnitPrice / inkYield;
    
    const inkCostK = inkCostPer5Pct * ((Number(previewCoverageK) || 5) / 5) * factorS;
    const inkCostC = inkCostPer5Pct * ((Number(previewCoverageC) || 5) / 5) * factorS;
    const inkCostM = inkCostPer5Pct * ((Number(previewCoverageM) || 5) / 5) * factorS;
    const inkCostY = inkCostPer5Pct * ((Number(previewCoverageY) || 5) / 5) * factorS;
    const totalInkCost = inkCostK + inkCostC + inkCostM + inkCostY;

    const subtotal = paperCostPerSheet + machineCostPerJob + totalInkCost + Number(previewLaborCost) + Number(previewFinishingCost);
    const wasteAmount = subtotal * ((Number(previewWastePct) || 5) / 100);
    const totalUnitCost = subtotal + wasteAmount;
    const sellingPrice = totalUnitCost * (1 + ((Number(previewProfitPct) || 30) / 100));

    return { factorS, paperCostPerSheet, machineCostPerJob, totalInkCost, subtotal, wasteAmount, totalUnitCost, sellingPrice };
  }, [
    importCost, importCurrency, paperFormat, sheetsPerPack, rollWidthM, rollLengthM,
    importType, maintenanceRatePct, expectedLifeA4,
    previewJobWidthMm, previewJobLengthMm, previewCoverageK, previewCoverageC, previewCoverageM, previewCoverageY,
    previewLaborCost, previewFinishingCost, previewWastePct, previewProfitPct
  ]);

  const handleFileUpload = (e, setUrlState) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setUrlState(uploadEvent.target.result);
      showToast('File uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomField = () => {
    if (!newFieldKey.trim() || !newFieldValue.trim()) {
      showToast('Please fill in both key and value for custom field', 'warning');
      return;
    }
    setCustomFields([...customFields, { key: newFieldKey.trim(), value: newFieldValue.trim() }]);
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const handleRemoveCustomField = (index) => {
    setCustomFields(customFields.filter((_, idx) => idx !== index));
  };

  const handleAddCustomScheme = (e) => {
    e.preventDefault();
    if (!newSchemeName.trim()) {
      showToast('Please enter a color scheme name', 'warning');
      return;
    }
    const name = newSchemeName.trim();
    const slots = Number(newSchemeSlots) || 1;
    if (!colorSchemeOptions.includes(name)) {
      setColorSchemeOptions([...colorSchemeOptions, name]);
    }
    setColorSchemeType(name);
    setTotalColorSlots(slots);
    setIsCustomSchemeModalOpen(false);
    setNewSchemeName('');
    setNewSchemeSlots(6);
    showToast('Custom color scheme added!', 'success');
  };

  const handleToggle = (item, list, setList) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const rawCost = Number(importCost) || 0;
    const rate = exchangeRates[importCurrency] || 1;
    const unitPriceLak = rawCost * rate;

    let finalData: Record<string, any> = {
      isRestockMode: inboundMode === 'RESTOCK',
      restockItemId: selectedRestockId || null,
      importQty: Number(importQty),
      unit: importUnit,
      unitPrice: unitPriceLak,
      rawImportCost: rawCost,
      currency: importCurrency,
      exchangeRate: rate,
      supplier: importVendor || null,
      importDate: importDate || null,
      paymentMethod: paymentMethod || null,
      imageUrl: productImage || null,
      receiptUrl: paymentSlip || null,
      taxInvoiceUrl: taxInvoice || null,
      actual_images: actualImages,
      payment_slip: paymentSlip,
      supplier_phone: supplierPhone,
      purchase_link: purchaseLink,
      customFields: customFields.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {})
    };

    if (importType === 'PRINTER') {
      const printerSpecsObj = {
        brand: printerBrand,
        model: printerModel,
        printerCategory,
        color_config: {
          colorScheme: colorSchemeType,
          slots: colorSlots
        },
        colorSchemeType,
        totalColorSlots: Number(totalColorSlots),
        expectedLifeA4Pages: Number(expectedLifeA4),
        maintenanceRatePercent: Number(maintenanceRatePct),
        oemBaselineInks: printerInkSlots,
        actual_images: actualImages,
        payment_slip: paymentSlip,
        supplier_phone: supplierPhone,
        purchase_link: purchaseLink,
        location: printerLocation,
        warrantyExpirationYear: printerWarrantyYear
      };

      finalData = {
        ...finalData,
        id: printerAssetId,
        name: `${printerBrand} ${printerModel}`,
        serialNumber: printerSn,
        brand: printerBrand,
        model: printerModel,
        category: 'Printer',
        printerCategory,
        color_config: {
          colorScheme: colorSchemeType,
          slots: colorSlots
        },
        colorSchemeType,
        totalColorSlots: Number(totalColorSlots),
        expectedLifeA4Pages: Number(expectedLifeA4),
        maintenanceRatePercent: Number(maintenanceRatePct),
        printerColorLinks: printerInkSlots,
        oemBaselineInks: printerInkSlots,
        actual_images: actualImages,
        payment_slip: paymentSlip,
        supplier_phone: supplierPhone,
        purchase_link: purchaseLink,
        functions: selectedFunctions,
        connectivity: selectedConnectivity,
        osCompatibility: selectedOS,
        purchaseDate: importDate,
        price: unitPriceLak,
        unitPrice: unitPriceLak,
        vendor: importVendor,
        location: printerLocation,
        warrantyExpirationYear: printerWarrantyYear,
        status: 'In Use',
        specs: printerSpecsObj,
        components: [
          { name: 'Drum Unit (ຊຸດດຣຳ)', usage: 0, threshold: 90 },
          { name: 'Fuser Kit (ຊຸດຄວາມຮ້ອນ)', usage: 0, threshold: 90 },
          { name: 'Waste Toner (ກ່ອງໝຶກເສຍ)', usage: 0, threshold: 95 }
        ]
      };
    } else if (importType === 'INK') {
      const inkSpecsObj = {
        inkCode,
        colorName: inkColorName,
        colorGroup: inkColorGroup,
        volume: Number(inkVolume) || 100,
        inkBaseType,
        isCompatible,
        targetPrinterId: inkTargetPrinter,
        supplier_phone: supplierPhone,
        purchase_link: purchaseLink,
        actual_images: actualImages,
        payment_slip: paymentSlip
      };

      finalData = {
        ...finalData,
        id: inkCode,
        name: `ໝຶກ ${inkColorName} (${inkBaseType})`,
        category: 'Ink',
        inkCode,
        colorName: inkColorName,
        colorGroup: inkColorGroup,
        volume: Number(inkVolume) || 100,
        stockQty: Number(importQty),
        inkBaseType,
        isCompatible,
        targetPrinterId: inkTargetPrinter,
        specs: inkSpecsObj
      };
    } else if (importType === 'PAPER') {
      finalData = {
        ...finalData,
        id: paperCode || `PAP-${Date.now().toString().slice(-4)}`,
        name: paperName,
        category: 'Paper',
        brand: paperBrand,
        paperSurface,
        stockQty: Number(importQty),
        totalSheetsCalculated: paperFormat === 'Sheet' ? totalSheetsCalc : null,
        totalSqmCalculated: paperFormat === 'Roll' ? totalSqmCalc : null,
        specs: {
          paperCode,
          brand: paperBrand,
          paperSurface,
          paperFormat,
          standardSize: paperFormat === 'Sheet' ? paperSize : null,
          customWidthMm: paperSize === 'Custom Sheet' ? customWidthMm : null,
          customLengthMm: paperSize === 'Custom Sheet' ? customLengthMm : null,
          packagingType: paperFormat === 'Sheet' ? packagingType : null,
          sheetsPerPack: paperFormat === 'Sheet' ? Number(sheetsPerPack) : null,
          sheets_per_pack: paperFormat === 'Sheet' ? Number(sheetsPerPack) : null,
          sheets_per_ream: paperFormat === 'Sheet' ? Number(sheetsPerPack) : null,
          rollWidthPreset: paperFormat === 'Roll' ? rollWidthPreset : null,
          rollWidthM: paperFormat === 'Roll' ? Number(rollWidthM) : null,
          rollLengthM: paperFormat === 'Roll' ? Number(rollLengthM) : null,
          paperCore: paperFormat === 'Roll' ? paperCore : null,
          coatingTech: coatingTech || null,
          surfaceFinish: surfaceFinish || null,
          printableSides: printableSides || null,
          grammageGsm: grammage || null,
          compatibilities
        }
      };
    } else if (importType === 'LAMINATION') {
      finalData = {
        ...finalData,
        id: `LAM-${Date.now().toString().slice(-4)}`,
        name: laminationName,
        category: 'Lamination',
        stockQty: Number(importQty),
        specs: {
          laminationFormat,
          laminationSize: laminationFormat === 'Sheet' ? laminationSize : null,
          laminationThickness: laminationThickness || null,
          laminationMethod: laminationMethod || null,
          laminationFinish: laminationFinish || null
        }
      };
    } else if (importType === 'MACHINERY') {
      finalData = {
        ...finalData,
        id: `MAC-${Date.now().toString().slice(-4)}`,
        name: machineryName || `Paper Machine ${machineryModel}`,
        category: 'Cutter',
        postPressSubtype,
        serialNumber: machinerySn || null,
        purchaseCost: totalCostInLak,
        purchasePrice: totalCostInLak,
        MachinePrice: totalCostInLak,
        lifespanYears: Number(machineryLifespanYears),
        estMonthlyVolume: Number(machineryEstMonthlyVolume),
        maintenanceRatePercent: Number(machineryMaintenanceRatePct),
        costPerConsumptionUnit: machineryFinalUnitCost,
        calculatedCostPerPage: machineryFinalUnitCost,
        maintenanceCostPerPage: machineryFinalUnitCost,
        printedPagesCapacity: Number(machineryEstMonthlyVolume) * machineryTotalMonths,
        TargetTotalPages: Number(machineryEstMonthlyVolume) * machineryTotalMonths,
        specs: {
          postPressSubtype,
          lifespanYears: Number(machineryLifespanYears),
          estMonthlyVolume: Number(machineryEstMonthlyVolume),
          maintenanceRatePercent: Number(machineryMaintenanceRatePct),
          netCostPerUnit: machineryFinalUnitCost
        }
      };
    } else if (importType === 'BINDING') {
      finalData = {
        ...finalData,
        id: `BIN-${Date.now().toString().slice(-4)}`,
        name: bindingName,
        category: 'Binding',
        stockQty: Number(importQty),
        specs: {
          bindingType,
          bindingDiameter: bindingDiameter || null,
          bindingPitch: bindingPitch || null,
          bindingPageCapacity: bindingPageCapacity || null
        }
      };
    } else if (importType === 'SPARE_PARTS') {
      finalData = {
        ...finalData,
        id: `PRT-${Date.now().toString().slice(-4)}`,
        name: sparePartName,
        category: 'SpareParts',
        stockQty: Number(importQty),
        specs: {
          partSubCategory,
          partModelRef: partModelRef || null,
          partYield: partYield || null
        }
      };
    } else if (importType === 'OFFCUT') {
      finalData = {
        ...finalData,
        id: `OFF-${Date.now().toString().slice(-4)}`,
        name: offcutName || 'Paper Offcut',
        category: 'Offcut',
        stockQty: Number(importQty || offcutQty),
        unit: 'ແຜ່ນ',
        specs: {
          offcutParentSku,
          offcutWidthMm: Number(offcutWidthMm),
          offcutLengthMm: Number(offcutLengthMm),
          offcutQty: Number(offcutQty),
          offcutCostPerSheet: unitPriceLak,
          offcutLocation
        }
      };

      fetch('http://localhost:8080/api/offcuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: finalData.id,
          parent_material_id: offcutParentSku || 'PAP-GENERAL',
          name: offcutName || 'Paper Offcut',
          width_mm: Number(offcutWidthMm),
          length_mm: Number(offcutLengthMm),
          quantity: Number(offcutQty),
          location: offcutLocation || 'Main Stock'
        })
      }).catch(err => console.log('Offcut API save error', err));
    }

    onSubmit(importType, finalData);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* SECTION 1.1: Mode Switcher */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-1.5 w-full">
          <button
            type="button"
            onClick={() => {
              setInboundMode('NEW');
              setSelectedRestockId('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              inboundMode === 'NEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4 text-sky-600" />
            <span>🆕 ເພີ່ມ Master ໃໝ່ (New Product Mode)</span>
          </button>
          <button
            type="button"
            onClick={() => setInboundMode('RESTOCK')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              inboundMode === 'RESTOCK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>📦 Restock (ເຕີມ Stock ສິນຄ້າເກົ່າ)</span>
          </button>
        </div>
      </div>

      {inboundMode === 'RESTOCK' && (
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-700" />
            <h4 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
              ເລືອກສິນຄ້າໃນຄັງທີ່ຕ້ອງການ Restock (Existing Item Mode)
            </h4>
          </div>
          <div>
            <select
              value={selectedRestockId}
              onChange={(e) => handleRestockSelect(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-emerald-300 bg-white text-sm font-bold text-slate-800 focus:outline-none"
            >
              <option value="">-- ເລືອກສິນຄ້າຈາກ Warehouse Catalog --</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.id}] {item.name} - Stock ປັດຈຸບັນ: {item.stockQty || 0} {item.consumptionUnit || item.purchaseUnit || 'Unit'} (ຕົ້ນທຶນ: {formatCurrency(item.costPerPurchaseUnit || 0)})
                </option>
              ))}
            </select>
          </div>
          {selectedRestockId && (
            <div className="p-3 bg-white rounded-xl border border-emerald-100 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">
                ສະຖານະ: ระบบจะทำการ **Overridden ทับราคาเดิม** ใน Master Catalog เป็นราคาซื้อล่าสุดอัตโนมัติ!
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          )}
        </div>
      )}

      {inboundMode === 'NEW' && (
        <div className="border-b border-slate-100 pb-4">
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl">
            {[
              { id: 'PRINTER', label: 'ເຄື່ອງພິມ (Printer)' },
              { id: 'INK', label: 'ໝຶກພິມ (Ink)' },
              { id: 'PAPER', label: 'ເຈ້ຍ (Paper)' },
              { id: 'OFFCUT', label: 'ເຈ້ຍເສດ (Paper Offcut)' },
              { id: 'LAMINATION', label: 'ຟີມເຄືອບ (Film)' },
              { id: 'MACHINERY', label: 'ເຄື່ອງຈັກ (Machinery)' },
              { id: 'BINDING', label: 'ເຂົ້າເລົ່ມ (Binding)' },
              { id: 'SPARE_PARTS', label: 'ອະໄຫຼ່ (Spare Parts)' }
            ].map(tab => (
              <button
                type="button"
                key={tab.id}
                onClick={() => {
                  setImportType(tab.id);
                  if (tab.id === 'PRINTER' || tab.id === 'MACHINERY') setImportUnit('ເຄື່ອງ');
                  else if (tab.id === 'INK') setImportUnit('ຂວດ');
                  else if (tab.id === 'PAPER' || tab.id === 'OFFCUT') setImportUnit('ແຜ່ນ');
                  else if (tab.id === 'LAMINATION') setImportUnit('ມ້ວນ');
                  else setImportUnit('ກ່ອງ');
                }}
                className={`px-3 py-2 text-[11px] font-black rounded-xl transition ${
                  importType === tab.id ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold text-slate-700">
        
        {importType === 'PRINTER' && inboundMode === 'NEW' && (
          <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {t('inbound.printer.title')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                  {t('inbound.printer.asset_id')} *
                </label>
                <input type="text" value={printerAssetId} onChange={(e) => setPrinterAssetId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                  {t('inbound.printer.serial_number')} *
                </label>
                <input type="text" value={printerSn} onChange={(e) => setPrinterSn(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="Enter Unique S/N" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                  {t('inbound.printer.brand')} *
                </label>
                <input type="text" value={printerBrand} onChange={(e) => setPrinterBrand(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="e.g. Epson" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                  {t('inbound.printer.model')} *
                </label>
                <input type="text" value={printerModel} onChange={(e) => setPrinterModel(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="e.g. TrueVIS VG3" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                  {t('inbound.printer.category')}
                </label>
                <select value={printerCategory} onChange={(e) => setPrinterCategory(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold">
                  {['Laser', 'Inkjet', 'MFP', 'Plotter', 'UV Flatbed', 'Sublimation'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                  {t('inbound.printer.expected_life')}
                </label>
                <input type="number" value={expectedLifeA4} onChange={(e) => setExpectedLifeA4(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                  {t('inbound.printer.maintenance_rate')}
                </label>
                <input type="number" value={maintenanceRatePct} onChange={(e) => setMaintenanceRatePct(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                  {t('inbound.printer.location_dept')}
                </label>
                <input type="text" value={printerLocation} onChange={(e) => setPrinterLocation(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" />
              </div>
            </div>

            {/* Custom Color Slot Configurator Integration */}
            <div className="pt-2">
              <ColorSlotConfigurator
                colorScheme={colorSchemeType}
                slots={colorSlots}
                onSchemeChange={handleColorSchemeChange}
                onSlotsChange={handleColorSlotsChange}
              />
            </div>

            {/* Dynamic Ink Slot Mapping Matrix for OEM Baseline Standard Specs */}
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
                  {printerInkSlots.length} Slots
                </span>
              </div>
              <div className="space-y-3 pt-1">
                {printerInkSlots.map((slot, index) => {
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
                              const newSlots = [...printerInkSlots];
                              newSlots[index].oemInkCode = e.target.value;
                              setPrinterInkSlots(newSlots);
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
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
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
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
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {importType === 'INK' && inboundMode === 'NEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Ink Code / SKU *</label>
              <input type="text" value={inkCode} onChange={(e) => setInkCode(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Color Name *</label>
              <input type="text" value={inkColorName} onChange={(e) => setInkColorName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Color Group</label>
              <select value={inkColorGroup} onChange={(e) => setInkColorGroup(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold">
                {colorGroups.map(grp => <option key={grp} value={grp}>{grp}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Volume per Bottle (ml)</label>
              <input type="text" value={inkVolume} onChange={(e) => setInkVolume(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Ink Base Type</label>
              <select value={inkBaseType} onChange={(e) => setInkBaseType(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold">
                {inkBaseTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input type="checkbox" checked={isCompatible} onChange={(e) => setIsCompatible(e.target.checked)} className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500" />
                <span>ໝຶກທຽບເທົ່າ (Compatible Ink) / OEM หมึกแท้</span>
              </label>
            </div>
          </div>
        )}

        {importType === 'PAPER' && inboundMode === 'NEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Paper Code *</label>
              <input type="text" value={paperCode} onChange={(e) => setPaperCode(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Paper Name *</label>
              <input type="text" value={paperName} onChange={(e) => setPaperName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Brand</label>
              <input type="text" value={paperBrand} onChange={(e) => setPaperBrand(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Surface</label>
              <select value={paperSurface} onChange={(e) => setPaperSurface(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold">
                {paperSurfaces.map(surf => <option key={surf} value={surf}>{surf}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                {currentLang === 'lo' ? 'ຄວາມໜາເຈ້ຍ (Grammage GSM/grm)' : 'Paper Grammage (GSM / grm)'}
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  min="1"
                  placeholder="e.g. 80, 130, 210, 300"
                  value={grammage} 
                  onChange={(e) => setGrammage(e.target.value)} 
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold pr-16" 
                />
                <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">gsm</span>
              </div>
            </div>
            <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase text-slate-800">Paper Format *</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5"><input type="radio" checked={paperFormat === 'Sheet'} onChange={() => setPaperFormat('Sheet')} /> Sheet</label>
                  <label className="flex items-center gap-1.5"><input type="radio" checked={paperFormat === 'Roll'} onChange={() => setPaperFormat('Roll')} /> Roll</label>
                </div>
              </div>
              {paperFormat === 'Sheet' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Standard Size</label>
                    <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold">
                      {paperSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                      {t('inbound.paper.sheets_per_ream')} *
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder={t('inbound.paper.sheets_per_ream_placeholder')} 
                      value={sheetsPerPack} 
                      onChange={(e) => setSheetsPerPack(e.target.value === '' ? 0 : Number(e.target.value))} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500" 
                    />
                    <p className="text-[10px] text-slate-400 font-normal mt-1">
                      {t('inbound.paper.sheets_per_ream_helper')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                      {t('inbound.paper.roll_width')} (m) *
                    </label>
                    <input 
                      type="number" 
                      step="0.001" 
                      placeholder={t('inbound.paper.roll_width_placeholder')} 
                      value={rollWidthM} 
                      onChange={(e) => setRollWidthM(Number(e.target.value))} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">
                      {t('inbound.paper.roll_length')} (m) *
                    </label>
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder={t('inbound.paper.roll_length_placeholder')} 
                      value={rollLengthM} 
                      onChange={(e) => setRollLengthM(Number(e.target.value))} 
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-sky-500" 
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-[10px] text-slate-400 font-normal">
                      {t('inbound.paper.roll_helper')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {importType === 'MACHINERY' && inboundMode === 'NEW' && (
          <div className="bg-sky-50/60 p-5 rounded-2xl border border-sky-100 space-y-4 animate-fade-in">
            <span className="text-xs font-black uppercase tracking-wider text-sky-800 block border-b border-sky-200 pb-2 flex items-center gap-2">
              <Printer className="w-4 h-4 text-sky-600" />
              <span>นำเข้าเครื่องจักรกระดาษ & เครื่องแปรรูป (Post-Press & Paper Machinery Import)</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  1. ชื่อเครื่องจักร (Machine Name) *
                </label>
                <input
                  type="text"
                  required
                  value={machineryName}
                  onChange={(e) => setMachineryName(e.target.value)}
                  placeholder="เช่น EBA 5560 Electric Cutter / Roland Plotter"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  2. ประเภทเครื่องแปรรูปกระดาษ (Subtype) *
                </label>
                <select
                  value={postPressSubtype}
                  onChange={(e) => setPostPressSubtype(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold font-sans"
                >
                  <option value="guillotine">✂️ เครื่องตัดกระดาษทั่วไป (Guillotine Cutter)</option>
                  <option value="sticker_plotter">🎯 เครื่องตัด/ไดคัทสติกเกอร์ (Sticker Plotter / Cutter)</option>
                  <option value="hole_drill">🔘 เครื่องเจาะรูกระดาษ/เจาะตาไก่ (Paper Hole Drill / Puncher)</option>
                  <option value="binder">📚 เครื่องเข้าเล่มกระดาษ (Perfect / Spiral Binder)</option>
                  <option value="folder">📄 เครื่องพับ/กดรอยพับ (Paper Folder / Creaser)</option>
                  <option value="laminator">✨ เครื่องเคลือบผิว/ฟิล์ม (Laminator / Coater)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  3. อายุการใช้งานเป้าหมาย (Lifespan Years) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={machineryLifespanYears}
                  onChange={(e) => setMachineryLifespanYears(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  4. ประมาณการผลิตเฉลี่ย (Est. Monthly Volume) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={machineryEstMonthlyVolume}
                  onChange={(e) => setMachineryEstMonthlyVolume(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  5. ค่าบำรุงรักษา & เปลี่ยนใบมีด (% Maintenance Rate) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={machineryMaintenanceRatePct}
                  onChange={(e) => setMachineryMaintenanceRatePct(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                  placeholder="15"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  Serial Number (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={machinerySn}
                  onChange={(e) => setMachinerySn(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
                  placeholder="SN-998822"
                />
              </div>
            </div>

            {/* Real-time Calculation Breakdown Card */}
            <div className="p-4 bg-sky-100/80 border border-sky-200 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-sky-900 font-black">
                <span>คำนวณอัตราต้นทุนต่อแผ่นอัตโนมัติ (Amortized Rate Preview):</span>
                <span className="text-base font-black text-sky-700 font-sans">
                  {machineryFinalUnitCost.toLocaleString()} LAK / Unit
                </span>
              </div>
              <div className="text-xs text-sky-800 space-y-0.5 font-medium">
                <p>• ราคาซื้อสุทธิ: {totalCostInLak.toLocaleString()} LAK ({importCost || 0} {importCurrency})</p>
                <p>• ค่าเสื่อมฐาน: {Math.round(machineryBaseCostPerUnit * 100) / 100} LAK / แผ่น ({machineryLifespanYears} ปี = {machineryTotalMonths} เดือน)</p>
                <p>• ค่าบำรุงรักษา & อะไหล่ใบมีด (+{machineryMaintenanceRatePct}%): +{Math.round((machineryNetCostPerUnit - machineryBaseCostPerUnit) * 100) / 100} LAK / แผ่น</p>
              </div>
            </div>
          </div>
        )}

        {importType === 'OFFCUT' && inboundMode === 'NEW' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຊື່ລາຍການເຈ້ຍເສດ (Offcut Item Name) *</label>
              <input type="text" value={offcutName} onChange={(e) => setOffcutName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="e.g. ເຈ້ຍເສດ Art Card 300gsm" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ເຈ້ຍຕົ້ນທາງ (Parent Paper SKU)</label>
              <select value={offcutParentSku} onChange={(e) => setOffcutParentSku(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold">
                <option value="">-- ไม่ระบุกระดาษต้นทาง --</option>
                {inventory.filter(i => i.category === 'Paper' || i.category === 'MATERIAL').map(pap => (
                  <option key={pap.id} value={pap.id}>[{pap.id}] {pap.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ໜ້າກວ້າງ (Width mm) *</label>
              <input type="number" value={offcutWidthMm} onChange={(e) => setOffcutWidthMm(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຄວາມຍາວ (Length mm) *</label>
              <input type="number" value={offcutLengthMm} onChange={(e) => setOffcutLengthMm(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຈຳນວນແຜ່ນເສດ (Available Sheets) *</label>
              <input type="number" value={offcutQty} onChange={(e) => setOffcutQty(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ບ່ອນຈັດເກັບ (Storage Location)</label>
              <input type="text" value={offcutLocation} onChange={(e) => setOffcutLocation(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="e.g. Shelf A-1 (Offcuts)" />
            </div>
          </div>
        )}



        <div className="border-t border-slate-100 pt-6">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-slate-500" />
            <span>{t('inbound.printer.purchasing_section')}</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-sky-50/20 p-5 rounded-2xl border border-sky-100/50">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                {t('inbound.printer.import_qty')} *
              </label>
              <input type="number" value={importQty} onChange={(e) => setImportQty(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" min="1" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                {t('inbound.printer.import_cost')} *
              </label>
              <div className="relative">
                <input type="number" value={importCost} onChange={(e) => setImportCost(e.target.value)} className="w-full pl-4 pr-16 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="0.00" required />
                <select value={importCurrency} onChange={(e) => setImportCurrency(e.target.value)} className="absolute right-2 top-2 bottom-2 bg-slate-100 border border-slate-200 rounded-xl px-2 text-[10px] font-black focus:outline-none">
                  <option value="LAK">LAK</option><option value="THB">THB</option><option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                {currentLang === 'lo' ? 'ຊ່ອງທາງຊຳລະເງິນ (Payment Method) *' : 'Payment Method *'}
              </label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)} 
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold"
              >
                <option value="TRANSFER">{currentLang === 'lo' ? 'ໂອນເງິນ (Bank Transfer)' : 'Bank Transfer (โอนจ่าย)'}</option>
                <option value="CASH">{currentLang === 'lo' ? 'ເງິນສົດ (Cash)' : 'Cash (เงินสด)'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('inbound.printer.supplier_phone')}</span>
              </label>
              <input type="tel" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="e.g. +856 20 12345678" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('inbound.printer.purchase_link')}</span>
              </label>
              <div className="flex gap-2">
                <input type="url" value={purchaseLink} onChange={(e) => setPurchaseLink(e.target.value)} className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="https://..." />
                {purchaseLink && (
                  <button type="button" onClick={() => window.open(purchaseLink, '_blank')} className="px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold flex items-center gap-1 cursor-pointer">
                    <ExternalLink className="w-4 h-4" />
                    <span>{t('inbound.printer.open_link')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Actual Product Images */}
            <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-black uppercase text-slate-400">
                {t('inbound.printer.actual_images')}
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-4 bg-white text-center transition cursor-pointer relative">
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
                          setActualImages(prev => [...prev, ev.target!.result as string]);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                  }}
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
                    <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setActualImages(actualImages.filter((_, i) => i !== idx))}
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
            <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-black uppercase text-slate-400">
                {t('inbound.printer.payment_slip')}
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
                      if (ev.target?.result) setPaymentSlip(ev.target.result as string);
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
              {paymentSlip && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700 truncate">Payment Slip Uploaded</span>
                  <button type="button" onClick={() => setPaymentSlip('')} className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer">
                    {t('common.delete')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition">{t('common.cancel')}</button>
          <button type="submit" className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-sky-600/10">{t('common.save')}</button>
        </div>
      </form>

      {isCustomSchemeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-fade-in space-y-4">
            <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5"><Layers className="w-4 h-4 text-sky-600" /><span>ເພີ່ມລະບົບສີໃໝ່ (Custom Color Scheme)</span></h4>
            <div className="space-y-4">
              <input type="text" value={newSchemeName} onChange={(e) => setNewSchemeName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold" placeholder="e.g. Hexachrome" />
              <input type="number" value={newSchemeSlots} onChange={(e) => setNewSchemeSlots(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold" min="1" max="12" />
              <div className="flex justify-end gap-2 pt-2 text-xs">
                <button type="button" onClick={() => setIsCustomSchemeModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl">ຍົກເລີກ</button>
                <button type="button" onClick={handleAddCustomScheme} className="px-4 py-2 bg-sky-600 text-white rounded-xl">ບັນທຶກ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
