import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
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
  DollarSign
} from 'lucide-react';

export default function ImportForm({ onSubmit, onClose }) {
  const { t } = useTranslation();
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
  const [totalColorSlots, setTotalColorSlots] = useState(4);
  const [expectedLifeA4, setExpectedLifeA4] = useState(500000);
  const [maintenanceRatePct, setMaintenanceRatePct] = useState(20);
  const [selectedFunctions, setSelectedFunctions] = useState(['Print']);
  const [selectedConnectivity, setSelectedConnectivity] = useState(['USB', 'Wi-Fi']);
  const [selectedOS, setSelectedOS] = useState(['Windows', 'macOS']);
  const [printerLocation, setPrinterLocation] = useState('Main Dept');
  const [printerWarrantyYear, setPrinterWarrantyYear] = useState(new Date().getFullYear() + 2);

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

  React.useEffect(() => {
    if (colorSchemeType === 'Monochrome') {
      setPrinterInkSlots([
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'OEM-001-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 10000 }
      ]);
    } else if (colorSchemeType === 'CMYK') {
      setPrinterInkSlots([
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500 },
        { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
      ]);
    } else if (colorSchemeType === 'Photo (6 Colors)') {
      setPrinterInkSlots([
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500 },
        { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 5 (LC - Light Cyan)', colorGroup: 'Light Cyan', oemInkCode: 'EPSON-008-LC', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
        { slotPosition: 'Slot 6 (LM - Light Magenta)', colorGroup: 'Light Magenta', oemInkCode: 'EPSON-008-LM', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
      ]);
    } else {
      const count = Number(totalColorSlots) || 4;
      const slots = Array.from({ length: count }, (_, i) => ({
        slotPosition: `Slot ${i + 1}`,
        colorGroup: 'Custom',
        oemInkCode: `OEM-INK-${i + 1}`,
        oemStandardVolumeMl: 100,
        oemStandardIsoYieldA4: 5000
      }));
      setPrinterInkSlots(slots);
    }
  }, [colorSchemeType, totalColorSlots]);

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

  // --- 6. MACHINERY State ---
  const [machineryName, setMachineryName] = useState('');
  const [machineryModel, setMachineryModel] = useState('');
  const [machinerySn, setMachinerySn] = useState('');
  const [machineryWidth, setMachineryWidth] = useState('');
  const [machineryCapacity, setMachineryCapacity] = useState('');
  const [machineryDrive, setMachineryDrive] = useState('');

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
      customFields: customFields.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {})
    };

    if (importType === 'PRINTER') {
      finalData = {
        ...finalData,
        id: printerAssetId,
        name: `${printerBrand} ${printerModel}`,
        serialNumber: printerSn,
        brand: printerBrand,
        model: printerModel,
        category: 'Printer',
        printerCategory,
        colorSchemeType,
        totalColorSlots: Number(totalColorSlots),
        expectedLifeA4Pages: Number(expectedLifeA4),
        maintenanceRatePercent: Number(maintenanceRatePct),
        printerColorLinks: printerInkSlots,
        functions: selectedFunctions,
        connectivity: selectedConnectivity,
        osCompatibility: selectedOS,
        purchaseDate: importDate,
        price: unitPriceLak,
        vendor: importVendor,
        location: printerLocation,
        warrantyExpirationYear: printerWarrantyYear,
        status: 'In Use',
        components: [
          { name: 'Drum Unit (ຊຸດດຣຳ)', usage: 0, threshold: 90 },
          { name: 'Fuser Kit (ຊຸດຄວາມຮ້ອນ)', usage: 0, threshold: 90 },
          { name: 'Waste Toner (ກ່ອງໝຶກເສຍ)', usage: 0, threshold: 95 }
        ]
      };
    } else if (importType === 'INK') {
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
        targetPrinterId: inkTargetPrinter
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
        name: `${machineryName} ${machineryModel}`,
        category: 'Machinery',
        serialNumber: machinerySn || null,
        specs: {
          machineryWidth: machineryWidth || null,
          machineryCapacity: machineryCapacity || null,
          machineryDrive: machineryDrive || null
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
    }

    onSubmit(importType, finalData);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 max-w-4xl mx-auto relative space-y-6">
      
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
                  else if (tab.id === 'PAPER') setImportUnit('ແຜ່ນ');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Asset ID *</label>
              <input type="text" value={printerAssetId} onChange={(e) => setPrinterAssetId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Serial Number (S/N) *</label>
              <input type="text" value={printerSn} onChange={(e) => setPrinterSn(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="Enter Unique S/N" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Brand *</label>
              <input type="text" value={printerBrand} onChange={(e) => setPrinterBrand(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="e.g. Epson" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Model *</label>
              <input type="text" value={printerModel} onChange={(e) => setPrinterModel(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="e.g. TrueVIS VG3" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Printer Category</label>
              <select value={printerCategory} onChange={(e) => setPrinterCategory(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold">
                {printerCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black uppercase text-slate-400">Color Scheme</label>
                  <button type="button" onClick={() => setIsCustomSchemeModalOpen(true)} className="text-[10px] font-black text-sky-600 hover:text-sky-800 flex items-center gap-0.5">
                    <Plus className="w-3 h-3" /> ເພີ່ມສີເອງ
                  </button>
                </div>
                <select value={colorSchemeType} onChange={(e) => setColorSchemeType(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold">
                  {colorSchemeOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Total Color Slots</label>
                <input type="number" value={totalColorSlots} onChange={(e) => setTotalColorSlots(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" min="1" max="12" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Expected Life A4 Pages</label>
              <input type="number" value={expectedLifeA4} onChange={(e) => setExpectedLifeA4(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Maintenance Rate %</label>
              <input type="number" value={maintenanceRatePct} onChange={(e) => setMaintenanceRatePct(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">Location / Dept</label>
              <input type="text" value={printerLocation} onChange={(e) => setPrinterLocation(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" />
            </div>

            {/* Dynamic Ink Slot Mapping Matrix for OEM Baseline Standard Specs */}
            <div className="col-span-1 md:col-span-2 bg-sky-50/50 p-4 rounded-2xl border border-sky-100 space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>💧 ສເປັກໝຶກແທ້标准 (OEM Baseline Standard Specs)</span>
                </h4>
                <span className="text-[10px] text-sky-700 font-bold bg-sky-100 px-2 py-0.5 rounded-full">
                  {printerInkSlots.length} Slots ({colorSchemeType})
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                ระบุสเปคหมึกแท้มาตรฐานประจำรุ่น (OEM Ink SKU, Volume ml, ISO A4 Yield) เพื่อคำนวณอัตรากินหมึกมาตรฐานต่อแผ่น (Base Consumption Rate ml/page)
              </p>
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
                          <span>{slot.slotPosition} ({slot.colorGroup})</span>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">
                          Base Rate: {baseRate} ml/แผ่น
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">1) OEM Ink SKU / Model</label>
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
                          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">2) OEM Standard Vol. (ml)</label>
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
                          <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">3) OEM Standard ISO Yield (Pages)</label>
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
            <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase text-slate-800">Paper Format *</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5"><input type="radio" checked={paperFormat === 'Sheet'} onChange={() => setPaperFormat('Sheet')} /> Sheet</label>
                  <label className="flex items-center gap-1.5"><input type="radio" checked={paperFormat === 'Roll'} onChange={() => setPaperFormat('Roll')} /> Roll</label>
                </div>
              </div>
              {paperFormat === 'Sheet' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <select value={paperSize} onChange={(e) => setPaperSize(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold">
                    {paperSizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="number" placeholder="Sheets/Pack" value={sheetsPerPack} onChange={(e) => setSheetsPerPack(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <input type="number" step="0.001" placeholder="Roll Width (m)" value={rollWidthM} onChange={(e) => setRollWidthM(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold" />
                  <input type="number" placeholder="Length (m)" value={rollLengthM} onChange={(e) => setRollLengthM(Number(e.target.value))} className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold" />
                </div>
              )}
            </div>
          </div>
        )}



        <div className="border-t border-slate-100 pt-6">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-slate-500" />
            <span>ຂໍ້ມູນຈັດຊື້ & ການຊຳລະເງິນ (Purchasing & Proofs)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-sky-50/20 p-5 rounded-2xl border border-sky-100/50">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຈຳນວນນຳເຂົ້າ (Import Qty) *</label>
              <input type="number" value={importQty} onChange={(e) => setImportQty(Number(e.target.value))} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" min="1" required />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2">ຕົ້ນທຶນນຳເຂົ້າ (Import Cost) *</label>
              <div className="relative">
                <input type="number" value={importCost} onChange={(e) => setImportCost(e.target.value)} className="w-full pl-4 pr-16 py-3 rounded-2xl border border-slate-200 focus:outline-none bg-white text-sm font-semibold" placeholder="0.00" required />
                <select value={importCurrency} onChange={(e) => setImportCurrency(e.target.value)} className="absolute right-2 top-2 bottom-2 bg-slate-100 border border-slate-200 rounded-xl px-2 text-[10px] font-black focus:outline-none">
                  <option value="LAK">LAK</option><option value="THB">THB</option><option value="USD">USD</option>
                </select>
              </div>
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
