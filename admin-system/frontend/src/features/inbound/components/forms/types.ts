import { ColorSlot, STANDARD_PRESETS } from '@features/inventory/components/forms/common/ColorSlotConfigurator';
import { 
  FileText, 
  Droplet, 
  Printer, 
  Film, 
  BookOpen, 
  Scissors,
  Maximize2,
  Package,
  Wrench
} from 'lucide-react';
import React from 'react';

export interface InboundItemFormData {
  id: string;
  importType: string; // 'MACHINERY' | 'PAPER' | 'INK' | 'LAMINATION' | 'BINDING' | 'CUTTING_SUPPLIES' | 'RIGID_SUBSTRATES' | 'PACKAGING'
  importQty: number;
  importUnit: string;
  importCost: string;
  totalLotCost?: string;
  costInputMode?: 'UNIT' | 'TOTAL';
  importCurrency: string;
  importVendor: string;
  importDate: string;
  paymentMethod: string;
  productImage: string;
  paymentSlip: string;
  taxInvoice: string;
  customFields: Array<{ key: string; value: string }>;
  
  // ==========================================
  // FORM 1: MACHINERY & PRINTERS (WITH BUILT-IN WEAR PARTS)
  // ==========================================
  machineryTypeCategory: 'laser' | 'inkjet' | 'guillotine' | 'plotter' | 'laminator' | 'binder';
  machineBrand: string;
  machineModel: string;
  machineSn: string;
  machinePriceCost: number;
  machineExpectedLife: number; // pages, cuts, meters, books
  machineLifeUnit: string; // 'pages', 'cuts', 'meters', 'books'
  machineOperatingWatts: number;
  warmUpTimeMins: number;

  // Printer specific specs (Laser & Inkjet)
  printerMaxPaperSize: string;
  printerSupportedGsmMin: number;
  printerSupportedGsmMax: number;
  printerDuplexMode: 'auto' | 'manual';
  printerSpeedMonoPpm: number;
  printerSpeedColorPpm: number;
  printerColorCapability?: 'monochrome' | 'color';
  printerFeedType?: 'cut_sheet' | 'roll' | 'both';
  printerInkType?: string;
  postPressSubtype?: string;
  colorSchemeType: string;
  colorSlots: ColorSlot[];
  totalColorSlots: number;
  printerInkSlots: any[];
  actualImages: string[];
  supplierPhone: string;
  purchaseLink: string;
  printerLocation: string;
  printerWarrantyYear: number;

  // Laser Wear Parts (in machine)
  wearDrumUnitCost: number;
  wearDrumUnitLife: number;
  wearFuserUnitCost: number;
  wearFuserUnitLife: number;
  wearTransferBeltCost: number;
  wearTransferBeltLife: number;
  wearPickupRollerCost: number;
  wearPickupRollerLife: number;
  wearWasteTonerBoxCost: number;
  wearWasteTonerBoxLife: number;

  // Inkjet Wear Parts (in machine)
  wearMaintBoxCost: number;
  wearMaintBoxLife: number;
  wearCarriageBeltCost: number;
  wearCarriageBeltLife: number;
  wearPrintheadCost: number;
  wearPrintheadLife: number;
  wasteLossCleaningPct: number;

  // Cutter Specs & Wear Parts
  cutterMaxWidthMm: number;
  cutterMaxSpeedMms: number;
  cutterDownforceG: number;
  wearBladeCost: number;
  wearBladeLifeMeters: number;
  wearTeflonStripCost: number;
  wearTeflonStripLifeMeters: number;
  wearPinchRollersCost: number;
  wearSharpeningCost: number;
  wearSharpeningIntervalCuts: number;
  wearCuttingStickCost: number;
  wearCuttingStickLifeCuts: number;

  // Laminator Specs & Wear Parts
  laminatorMaxWidthMm: number;
  laminatorMaxSpeedMmin: number;
  laminatorMaxTempC: number;
  wearSiliconeRollerCost: number;
  wearSiliconeRollerLifeMeters: number;
  wearHeatingElementCost: number;
  wearHeatingElementHours: number;

  // Binder Specs & Wear Parts
  binderMaxThicknessMm: number;
  binderMaxSpineLengthMm: number;
  binderSpeedBooksHr: number;
  wearMillingCutterCost: number;
  wearMillingCutterLifeBooks: number;
  wearPunchingPinsCost: number;
  wearPunchingPinsLifePunches: number;
  preheatTimeMins: number;

  // ==========================================
  // FORM 2: PAPER & MEDIA CATALOG
  // ==========================================
  paperCode: string;
  paperName: string;
  paperBrand: string;
  paperType?: string;
  paperSurface: string;
  paperFormat: string; // 'cut_sheet' | 'parent_sheet' | 'roll'
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
  thicknessMetric: 'gsm' | 'mm';
  boardThicknessMm: number;
  parentSheetWidthMm: number;
  parentSheetHeightMm: number;
  cutWastePct: number;
  grainDirection: 'LG' | 'SG';
  compatibilities: string[];

  // ==========================================
  // FORM 3: INK & TONER
  // ==========================================
  inkCode: string;
  inkColorName: string;
  inkColorGroup: string;
  inkVolume: string;
  inkBaseType: string;
  isCompatible: boolean;
  inkTargetPrinter: string;
  inkKind: 'inkjet' | 'laser';
  inkGrade: 'genuine' | 'compatible';
  inkPackageForm: 'bottle' | 'cartridge' | 'pouch' | 'liter';
  inkWeightGrams?: number;

  // ==========================================
  // FORM 4: LAMINATION FILMS & LIQUID
  // ==========================================
  laminationName: string;
  laminationFormat: string;
  laminationSize: string;
  laminationThickness: string;
  laminationMethod: string;
  laminationFinish: string;
  laminationWidthMm?: number;
  laminationLengthM?: number;
  laminationWastePct?: number;

  // ==========================================
  // FORM 5: BINDING & FINISHING MATERIALS
  // ==========================================
  bindingName: string;
  bindingType: string;
  bindingDiameter: string;
  bindingPitch: string;
  bindingPageCapacity: string;
  bindingSpineColor?: string;
  glueType?: string;
  tapeWidthMm?: number;
  tapeLengthM?: number;
  stapleSize?: string;
  foilColor?: string;

  // ==========================================
  // FORM 6: CUTTING & APPLICATION MATERIALS
  // ==========================================
  cuttingSupplyType?: string;
  transferTapeType?: string;
  transferTapeTack?: string;
  transferTapeWidthMm?: number;
  transferTapeLengthM?: number;
  cuttingMatGrip?: string;
  cuttingMatSize?: string;
  cuttingMatCycles?: number;

  // ==========================================
  // FORM 7: RIGID SUBSTRATES & MOUNTING
  // ==========================================
  rigidSubstrateType?: string;
  rigidBoardThicknessMm?: number;
  rigidSheetWidthMm?: number;
  rigidSheetHeightMm?: number;
  rigidWasteFactorPct?: number;
  rigidColorSurface?: string;

  // ==========================================
  // FORM 8: PACKAGING CONSUMABLES
  // ==========================================
  packagingCategory?: string;
  packagingDimensions?: string;
  bubbleRollWidthCm?: number;
  bubbleRollLengthM?: number;
  packagingTapeWidthMm?: number;
  packagingTapeLengthM?: number;

  // ==========================================
  // FORM 9: SPARE PARTS RESTOCK
  // ==========================================
  sparePartName?: string;
  sparePartCategory?: string;
  assignedPrinterId?: string;
  sparePartExpectedLife?: number;
  sparePartUnitType?: string;
  sparePartModelRef?: string;

  // Calculator preview helpers
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
}

export interface CategoryMenuOption {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

/**
 * 8 FORMS ACCORDING TO SPECIFICATION GOOGLE DOC + SPARE PARTS RESTOCK:
 * 1. Machinery & Equipment (Inkjet, Laser, Cutter, Laminator, Binder + Built-in Wear Parts)
 * 2. Paper & Media Catalog
 * 3. Ink & Toner
 * 4. Lamination
 * 5. Binding & Finishing Materials
 * 6. Cutting & Application Materials
 * 7. Rigid Substrates & Mounting
 * 8. Packaging Consumables
 * 9. Spare Parts Restock
 */
export const CATEGORY_MENU_OPTIONS: CategoryMenuOption[] = [
  { id: 'MACHINERY', label: '1. ເຄື່ອງຈັກ & ເຄື່ອງພິມ (Machines & Equipment)', desc: 'Inkjet, Laser, ເຄື່ອງຕັດ, ເຄື່ອງເຄືອບ, ເຄື່ອງເຂົ້າເຫຼັ້ມ + ຊຸດອະໄຫຼ່', icon: Printer, color: 'text-indigo-600 bg-indigo-50' },
  { id: 'PAPER', label: '2. ເຈ້ຍ & ສື່ພິມ (Paper & Media Catalog)', desc: 'ແຜ່ນຕັດສຳເລັດ, ແຜ່ນໃຫຍ່ 31x43", ມ້ວນ, ແກຣມ GSM, ຈົ່ວປັງ mm', icon: FileText, color: 'text-sky-600 bg-sky-50' },
  { id: 'INK', label: '3. ໝຶກພິມ (Ink & Toner)', desc: 'Inkjet (ml), Laser Toner (g), ຊ່ອງສີ, ໝຶກແທ້/ທຽບ', icon: Droplet, color: 'text-blue-600 bg-blue-50' },
  { id: 'LAMINATION', label: '4. ຟີມເຄືອບ (Lamination)', desc: 'ເຄືອບຮ້ອນ, ເຄືອບເຢັນ, ໄມຄຣອນ, ຊອງແຂງ, ນ້ຳຢາ UV', icon: Film, color: 'text-purple-600 bg-purple-50' },
  { id: 'BINDING', label: '5. ອຸປະກອນເຂົ້າເຫຼັ້ມ (Binding & Finishing)', desc: 'ສັນຂົດລວດ Wire-O, ກາວຮ້ອນ EVA/PUR, ເທບຜ້າສັນ, ລວດຫຍິບ', icon: BookOpen, color: 'text-rose-600 bg-rose-50' },
  { id: 'CUTTING_SUPPLIES', label: '6. ວັດສະດຸຊ່ວຍຕັດ (Cutting & Application)', desc: 'ເທບຍົກສະຕິກເກີ, ແຜ່ນຮອງຕັດກາວ Cutting Mat', icon: Scissors, color: 'text-amber-600 bg-amber-50' },
  { id: 'RIGID_SUBSTRATES', label: '7. ແຜ່ນບອດ & ແຂງ (Rigid Substrates)', desc: 'ໂຟມບອດ, ຟິວເຈີບອດ, ພາດສະວູດ, ອາຄຣີລິກ 1.22x2.44m', icon: Maximize2, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'PACKAGING', label: '8. ບັນຈຸພັນ (Packaging Consumables)', desc: 'ກ່ອງນາມບັດ 100 ໃບ, ກ່ອງ A4, ຊອງ OPP, ບັບເບິ້ນ, ເທບກາວ', icon: Package, color: 'text-teal-600 bg-teal-50' },
  { id: 'SPARE_PARTS', label: '9. ອະໄຫຼ່ຊ້ອມບຳລຸງ (Spare Parts Restock)', desc: 'ດຣຳ, ຊຸດຄວາມຮ້ອນ, ໃບມີດ, ລູກຢາງ, ກ່ອງໝຶກເສຍ', icon: Wrench, color: 'text-violet-600 bg-violet-50' }
];

export const createDefaultItem = (type: string = 'PAPER'): InboundItemFormData => {
  const timestamp = Date.now().toString().slice(-4);
  const rand = Math.floor(100 + Math.random() * 900);
  return {
    id: `ITEM-${Date.now()}-${rand}`,
    importType: type === 'PRINTER' ? 'MACHINERY' : type,
    importQty: 1,
    importUnit: type === 'MACHINERY' || type === 'PRINTER' ? 'ເຄື່ອງ' : type === 'INK' ? 'ຂວດ' : type === 'PAPER' ? 'ຣີມ' : type === 'SPARE_PARTS' ? 'ອັນ' : 'ແຜ່ນ',
    importCost: '',
    totalLotCost: '',
    costInputMode: 'UNIT',
    importCurrency: 'LAK',
    importVendor: '',
    importDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'TRANSFER',
    productImage: '',
    paymentSlip: '',
    taxInvoice: '',
    customFields: [],

    // ==========================================
    // 1. MACHINERY & WEAR PARTS
    // ==========================================
    machineryTypeCategory: 'laser',
    machineBrand: '',
    machineModel: '',
    machineSn: '',
    machinePriceCost: 0,
    machineExpectedLife: 200000,
    machineLifeUnit: 'pages',
    machineOperatingWatts: 1200,
    warmUpTimeMins: 2,

    printerMaxPaperSize: 'SRA3',
    printerSupportedGsmMin: 60,
    printerSupportedGsmMax: 300,
    printerDuplexMode: 'auto',
    printerSpeedMonoPpm: 35,
    printerSpeedColorPpm: 30,
    printerColorCapability: 'color',
    printerFeedType: 'cut_sheet',
    colorSchemeType: 'CMYK',
    colorSlots: STANDARD_PRESETS['CMYK'],
    totalColorSlots: 4,
    printerInkSlots: [
      { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'DOCU-C5005-K', oemStandardVolumeMl: 100, oemStandardIsoYieldA4: 26000 },
      { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'DOCU-C5005-C', oemStandardVolumeMl: 100, oemStandardIsoYieldA4: 25000 },
      { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'DOCU-C5005-M', oemStandardVolumeMl: 100, oemStandardIsoYieldA4: 25000 },
      { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'DOCU-C5005-Y', oemStandardVolumeMl: 100, oemStandardIsoYieldA4: 25000 },
    ],
    actualImages: [],
    supplierPhone: '',
    purchaseLink: '',
    printerLocation: 'Printing Room A',
    printerWarrantyYear: new Date().getFullYear() + 2,

    // Laser Wear Parts (Default as per Google Doc)
    wearDrumUnitCost: 1500000,
    wearDrumUnitLife: 50000,
    wearFuserUnitCost: 2000000,
    wearFuserUnitLife: 100000,
    wearTransferBeltCost: 1800000,
    wearTransferBeltLife: 100000,
    wearPickupRollerCost: 150000,
    wearPickupRollerLife: 30000,
    wearWasteTonerBoxCost: 350000,
    wearWasteTonerBoxLife: 30000,

    // Inkjet Wear Parts
    wearMaintBoxCost: 450000,
    wearMaintBoxLife: 25000,
    wearCarriageBeltCost: 500000,
    wearCarriageBeltLife: 50000,
    wearPrintheadCost: 4500000,
    wearPrintheadLife: 100000,
    wasteLossCleaningPct: 5,

    // Cutter Wear Parts
    cutterMaxWidthMm: 920,
    cutterMaxSpeedMms: 500,
    cutterDownforceG: 600,
    wearBladeCost: 250000,
    wearBladeLifeMeters: 5000,
    wearTeflonStripCost: 150000,
    wearTeflonStripLifeMeters: 5000,
    wearPinchRollersCost: 200000,
    wearSharpeningCost: 150000,
    wearSharpeningIntervalCuts: 10000,
    wearCuttingStickCost: 100000,
    wearCuttingStickLifeCuts: 20000,

    // Laminator Wear Parts
    laminatorMaxWidthMm: 650,
    laminatorMaxSpeedMmin: 5,
    laminatorMaxTempC: 140,
    wearSiliconeRollerCost: 1200000,
    wearSiliconeRollerLifeMeters: 20000,
    wearHeatingElementCost: 800000,
    wearHeatingElementHours: 5000,

    // Binder Wear Parts
    binderMaxThicknessMm: 40,
    binderMaxSpineLengthMm: 320,
    binderSpeedBooksHr: 200,
    wearMillingCutterCost: 800000,
    wearMillingCutterLifeBooks: 10000,
    wearPunchingPinsCost: 600000,
    wearPunchingPinsLifePunches: 20000,
    preheatTimeMins: 15,

    // ==========================================
    // 2. PAPER SPECS
    // ==========================================
    paperCode: `PAP-${timestamp}`,
    paperName: '',
    paperBrand: '',
    paperType: 'Plain Paper',
    paperSurface: 'Plain Paper',
    paperFormat: 'cut_sheet',
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
    surfaceFinish: 'Uncoated',
    printableSides: 'double',
    grammage: '80',
    thicknessMetric: 'gsm',
    boardThicknessMm: 2.0,
    parentSheetWidthMm: 787,
    parentSheetHeightMm: 1092,
    cutWastePct: 5,
    grainDirection: 'LG',
    compatibilities: ['Inkjet', 'Laser'],

    // ==========================================
    // 3. INK SPECS
    // ==========================================
    inkCode: `INK-${timestamp}`,
    inkColorName: '',
    inkColorGroup: 'Cyan',
    inkVolume: '100',
    inkBaseType: 'Dye',
    isCompatible: true,
    inkTargetPrinter: '',
    inkKind: 'inkjet',
    inkGrade: 'compatible',
    inkPackageForm: 'bottle',
    inkWeightGrams: 250,

    // ==========================================
    // 4. LAMINATION
    // ==========================================
    laminationName: '',
    laminationFormat: 'Roll',
    laminationSize: 'A4',
    laminationThickness: '25μm',
    laminationMethod: 'Thermal (Heat)',
    laminationFinish: 'GLOSS_PVC',
    laminationWidthMm: 330,
    laminationLengthM: 100,
    laminationWastePct: 5,

    // ==========================================
    // 5. BINDING
    // ==========================================
    bindingName: '',
    bindingType: 'PERFECT_BIND',
    bindingDiameter: '10mm',
    bindingPitch: '3:1',
    bindingPageCapacity: '80',
    bindingSpineColor: 'Black',
    glueType: 'EVA',
    tapeWidthMm: 36,
    tapeLengthM: 50,
    stapleSize: '23/8',
    foilColor: 'Gold',

    // ==========================================
    // 6. CUTTING SUPPLIES
    // ==========================================
    cuttingSupplyType: 'transfer_tape',
    transferTapeType: 'paper',
    transferTapeTack: 'medium',
    transferTapeWidthMm: 600,
    transferTapeLengthM: 50,
    cuttingMatGrip: 'standard',
    cuttingMatSize: 'A3',
    cuttingMatCycles: 100,

    // ==========================================
    // 7. RIGID SUBSTRATES
    // ==========================================
    rigidSubstrateType: 'foam_board',
    rigidBoardThicknessMm: 5,
    rigidSheetWidthMm: 1220,
    rigidSheetHeightMm: 2440,
    rigidWasteFactorPct: 15,
    rigidColorSurface: 'White',

    // ==========================================
    // 8. PACKAGING CONSUMABLES
    // ==========================================
    packagingCategory: 'box_card',
    packagingDimensions: '100 Cards Box',
    bubbleRollWidthCm: 65,
    bubbleRollLengthM: 100,
    packagingTapeWidthMm: 48,
    packagingTapeLengthM: 100,

    // ==========================================
    // 9. SPARE PARTS RESTOCK
    // ==========================================
    sparePartName: '',
    sparePartCategory: 'drum',
    assignedPrinterId: '',
    sparePartExpectedLife: 50000,
    sparePartUnitType: 'pages',
    sparePartModelRef: '',

    // Previews
    previewJobWidthMm: 210,
    previewJobLengthMm: 297,
    previewCoverageK: 5,
    previewCoverageC: 5,
    previewCoverageM: 5,
    previewCoverageY: 5,
    previewLaborCost: 0,
    previewFinishingCost: 0,
    previewWastePct: 5,
    previewProfitPct: 30,
  };
};
