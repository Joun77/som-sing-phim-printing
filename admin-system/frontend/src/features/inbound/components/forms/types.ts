import { ColorSlot, STANDARD_PRESETS } from '@features/inventory/components/forms/common/ColorSlotConfigurator';
import { 
  FileText, 
  Droplet, 
  Printer, 
  Cog, 
  Film, 
  BookOpen, 
  Wrench, 
  Scissors 
} from 'lucide-react';
import React from 'react';

export interface InboundItemFormData {
  id: string;
  importType: string;
  importQty: number;
  importUnit: string;
  importCost: string;
  importCurrency: string;
  importVendor: string;
  importDate: string;
  paymentMethod: string;
  productImage: string;
  paymentSlip: string;
  taxInvoice: string;
  customFields: Array<{ key: string; value: string }>;
  
  // Printer specs
  printerAssetId: string;
  printerSn: string;
  printerBrand: string;
  printerModel: string;
  printerCategory: string;
  colorSchemeType: string;
  colorSlots: ColorSlot[];
  totalColorSlots: number;
  expectedLifeA4: number;
  maintenanceRatePct: number;
  selectedFunctions: string[];
  selectedConnectivity: string[];
  selectedOS: string[];
  printerLocation: string;
  printerWarrantyYear: number;
  actualImages: string[];
  supplierPhone: string;
  purchaseLink: string;
  printerInkSlots: any[];

  // Ink specs
  inkCode: string;
  inkColorName: string;
  inkColorGroup: string;
  inkVolume: string;
  inkBaseType: string;
  isCompatible: boolean;
  inkTargetPrinter: string;

  // Paper specs
  paperCode: string;
  paperName: string;
  paperBrand: string;
  paperSurface: string;
  paperFormat: string;
  paperSize: string;
  customWidthMm: string;
  customLengthMm: string;
  packagingType: string;
  sheetsPerPack: number;
  rollWidthPreset: string;
  rollWidthM: number;
  rollLengthM: number;
  paperCore: string;
  coatingTech: string;
  surfaceFinish: string;
  printableSides: string;
  grammage: string;
  compatibilities: string[];

  // Live Calculator Preview
  previewJobWidthMm: number;
  previewJobLengthMm: number;
  previewCoverageK: number;
  previewCoverageC: number;
  previewCoverageM: number;
  previewCoverageY: number;
  previewLaborCost: number;
  previewFinishingCost: number;
  previewWastePct: number;
  previewProfitPct: number;

  // Lamination
  laminationName: string;
  laminationFormat: string;
  laminationSize: string;
  laminationThickness: string;
  laminationMethod: string;
  laminationFinish: string;

  // Machinery
  machineryName: string;
  machineryModel: string;
  machinerySn: string;
  postPressSubtype: string;
  machineryLifespanYears: number;
  machineryEstMonthlyVolume: number;
  machineryMaintenanceRatePct: number;

  // Binding
  bindingName: string;
  bindingType: string;
  bindingDiameter: string;
  bindingPitch: string;
  bindingPageCapacity: string;

  // Spare Parts
  sparePartName: string;
  partSubCategory: string;
  partModelRef: string;
  partYield: string;

  // Offcut
  offcutName: string;
  offcutParentSku: string;
  offcutWidthMm: number;
  offcutLengthMm: number;
  offcutQty: number;
  offcutLocation: string;
}

export interface CategoryMenuOption {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const CATEGORY_MENU_OPTIONS: CategoryMenuOption[] = [
  { id: 'PAPER', label: 'ເຈ້ຍ (Paper)', desc: 'ເຈ້ຍແຜ່ນ, ເຈ້ຍມ້ວນ, ແກຣມ, ຜິວເຈ້ຍ', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'INK', label: 'ໝຶກພິມ (Ink)', desc: 'ໝຶກແທ້ OEM, ໝຶກທຽບ, Dye, Pigment', icon: Droplet, color: 'text-sky-600 bg-sky-50' },
  { id: 'PRINTER', label: 'ເຄື່ອງພິມ (Printer)', desc: 'ຕັ້ງຄ່າ Slot ໝຶກ, ອາຍຸງານ, ຄ່າເສື່ອມ', icon: Printer, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'MACHINERY', label: 'ເຄື່ອງຈັກຫຼັງພິມ (Machinery)', desc: 'ເຄື່ອງຕັດ, ເຄື່ອງພັບ, ຄ່າບຳລຸງຮັກສາ', icon: Cog, color: 'text-amber-600 bg-amber-50' },
  { id: 'LAMINATION', label: 'ຟີມເຄືອບ (Lamination)', desc: 'ຟີມເງົາ, ຟີມດ້ານ, ຄວາມໜາ', icon: Film, color: 'text-purple-600 bg-purple-50' },
  { id: 'BINDING', label: 'ອຸປະກອນເຂົ້າເລົ່ມ (Binding)', desc: 'ສັນຫ່ວງ Wire-O, ກະດູກງູ', icon: BookOpen, color: 'text-rose-600 bg-rose-50' },
  { id: 'SPARE_PARTS', label: 'ອະໄຫຼ່ (Spare Parts)', desc: 'ໃບມີດ, ຊຸດດຣຳ, ອຸປະກອນສ້ອມແປງ', icon: Wrench, color: 'text-slate-600 bg-slate-100' },
  { id: 'OFFCUT', label: 'ເຈ້ຍເສດ (Offcuts)', desc: 'ຈັດການຂະໜາດ ແລະ ສະຕັອກເຈ້ຍເສດ', icon: Scissors, color: 'text-emerald-600 bg-emerald-50' }
];

export const createDefaultItem = (type: string = 'PAPER'): InboundItemFormData => {
  const timestamp = Date.now().toString().slice(-4);
  const rand = Math.floor(100 + Math.random() * 900);
  return {
    id: `ITEM-${Date.now()}-${rand}`,
    importType: type,
    importQty: 1,
    importUnit: type === 'PRINTER' || type === 'MACHINERY' ? 'ເຄື່ອງ' : type === 'INK' ? 'ຂວດ' : 'ແຜ່ນ',
    importCost: '',
    importCurrency: 'LAK',
    importVendor: '',
    importDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'TRANSFER',
    productImage: '',
    paymentSlip: '',
    taxInvoice: '',
    customFields: [],

    // Printer specs
    printerAssetId: `PRN-${timestamp}`,
    printerSn: '',
    printerBrand: '',
    printerModel: '',
    printerCategory: 'Laser',
    colorSchemeType: 'CMYK',
    colorSlots: STANDARD_PRESETS['CMYK'],
    totalColorSlots: 4,
    expectedLifeA4: 500000,
    maintenanceRatePct: 20,
    selectedFunctions: ['Print'],
    selectedConnectivity: ['USB', 'Wi-Fi'],
    selectedOS: ['Windows', 'macOS'],
    printerLocation: 'Main Dept',
    printerWarrantyYear: new Date().getFullYear() + 2,
    actualImages: [],
    supplierPhone: '',
    purchaseLink: '',
    printerInkSlots: [
      { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500 },
      { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
      { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
      { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000 },
    ],

    // Ink specs
    inkCode: `INK-${timestamp}`,
    inkColorName: '',
    inkColorGroup: 'Cyan',
    inkVolume: '100',
    inkBaseType: 'Dye',
    isCompatible: false,
    inkTargetPrinter: '',

    // Paper specs
    paperCode: `PAP-${timestamp}`,
    paperName: '',
    paperBrand: '',
    paperSurface: 'Glossy',
    paperFormat: 'Sheet',
    paperSize: 'A4',
    customWidthMm: '',
    customLengthMm: '',
    packagingType: 'Ream',
    sheetsPerPack: 500,
    rollWidthPreset: '24"',
    rollWidthM: 0.610,
    rollLengthM: 30,
    paperCore: '2"',
    coatingTech: '',
    surfaceFinish: '',
    printableSides: '',
    grammage: '80',
    compatibilities: ['dye', 'pigment'],

    // Calculator Preview
    previewJobWidthMm: 210,
    previewJobLengthMm: 297,
    previewCoverageK: 5,
    previewCoverageC: 5,
    previewCoverageM: 5,
    previewCoverageY: 5,
    previewLaborCost: 1000,
    previewFinishingCost: 500,
    previewWastePct: 5,
    previewProfitPct: 30,

    // Lamination
    laminationName: '',
    laminationFormat: 'Sheet',
    laminationSize: 'A4',
    laminationThickness: '125 Micron',
    laminationMethod: '',
    laminationFinish: '',

    // Machinery
    machineryName: '',
    machineryModel: '',
    machinerySn: '',
    postPressSubtype: 'guillotine',
    machineryLifespanYears: 5,
    machineryEstMonthlyVolume: 50000,
    machineryMaintenanceRatePct: 15,

    // Binding
    bindingName: '',
    bindingType: 'Wire-O',
    bindingDiameter: '',
    bindingPitch: '',
    bindingPageCapacity: '',

    // Spare Parts
    sparePartName: '',
    partSubCategory: 'Spare Parts',
    partModelRef: '',
    partYield: '',

    // Offcut
    offcutName: '',
    offcutParentSku: '',
    offcutWidthMm: 100,
    offcutLengthMm: 150,
    offcutQty: 100,
    offcutLocation: 'Shelf A-1 (Offcuts)'
  };
};
