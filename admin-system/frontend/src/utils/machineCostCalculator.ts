/**
 * Machine Cost Calculation Utility
 * Standardized across Som Sing Phim Machinery, Inventory Linker, and Product Spec Studio
 */

export interface MachineUnitCostInput {
  purchase_price_lak?: number;
  purchaseCost?: number;
  purchasePrice?: number;
  price?: number;
  MachinePrice?: number;
  unitPrice?: number;
  unitCost?: number;
  expected_life_pages?: number;
  expectedLifeA4Pages?: number;
  printedPagesCapacity?: number;
  TargetTotalPages?: number;
  lifetimePagesA4?: number;
  maintenance_rate_percent?: number;
  maintenanceRatePercent?: number;
  category?: string;
  calculatedCostPerPage?: number;
  costPerPage?: number;
  costPerConsumptionUnit?: number;
}

export interface MachineUnitCostResult {
  depreciation: number;
  maintenance: number;
  totalMachineCost: number;
}

export function calculateMachineUnitCost(spec: MachineUnitCostInput): MachineUnitCostResult {
  const price = Number(
    spec.purchase_price_lak ??
    spec.purchaseCost ??
    spec.purchasePrice ??
    spec.price ??
    spec.MachinePrice ??
    spec.unitPrice ??
    spec.unitCost ??
    0
  );

  const targetPages = Number(
    spec.expected_life_pages ??
    spec.expectedLifeA4Pages ??
    spec.printedPagesCapacity ??
    spec.TargetTotalPages ??
    spec.lifetimePagesA4 ??
    0
  );

  const maintRate = Number(
    spec.maintenance_rate_percent ??
    spec.maintenanceRatePercent ??
    15
  );

  if (!targetPages || targetPages <= 0 || price <= 0) {
    if (spec.calculatedCostPerPage || spec.costPerPage || spec.costPerConsumptionUnit) {
      const fallbackVal = Number(spec.calculatedCostPerPage || spec.costPerPage || spec.costPerConsumptionUnit);
      return {
        depreciation: Math.round(fallbackVal * 100) / 100,
        maintenance: 0,
        totalMachineCost: Math.round(fallbackVal * 100) / 100,
      };
    }
    return { depreciation: 0, maintenance: 0, totalMachineCost: 0 };
  }

  const depreciation = price / targetPages;
  const maintenance = depreciation * (maintRate / 100);

  return {
    depreciation: Math.round(depreciation * 100) / 100,
    maintenance: Math.round(maintenance * 100) / 100,
    totalMachineCost: Math.round((depreciation + maintenance) * 100) / 100,
  };
}

export interface FormattedMachineCost {
  depreciation: number;
  maintenance: number;
  totalMachineCost: number;
  inkCost: number;
  grandTotalCost: number;
  unitLabel: string; // 'ໜ້າ' | 'ແຜ່ນ' | 'ຮອບຕັດ' | 'ແມັດ' | 'ຫົວ'
  unitLabelEn: string; // 'page' | 'sheet' | 'cut' | 'meter' | 'book'
  isPrinter: boolean;
}

/**
 * Resolves the display image of a machine from all potential sources
 */
export function resolveMachineImage(machine: any): string | null {
  if (!machine) return null;
  return (
    machine.imageUrl ||
    machine.itemPhoto ||
    machine.productPhoto ||
    machine.image ||
    machine.docs?.productPhoto ||
    machine.specs?.productPhoto ||
    machine.specs?.productImage ||
    (Array.isArray(machine.actual_images) && machine.actual_images[0]) ||
    (Array.isArray(machine.specs?.actual_images) && machine.specs?.actual_images[0]) ||
    null
  );
}

/**
 * Computes exact itemized wear parts rate per unit from Data Material specification
 */
export function calculateMachineWearPartsRate(eq: any): number {
  if (!eq) return 0;
  const specs = eq.specs || {};
  const cat = String(eq.category || eq.printerCategory || '').toLowerCase();
  const sub = String(eq.postPressSubtype || specs.postPressSubtype || '').toLowerCase();
  const name = String(eq.name || eq.model || '').toLowerCase();

  const isCutter = cat.includes('cutter') || sub.includes('cutter') || sub.includes('guillotine') || sub.includes('plotter') || name.includes('cutter');
  const isBinder = cat.includes('binder') || sub.includes('binder') || name.includes('binder');
  const isLaminator = cat.includes('laminat') || sub.includes('laminat') || name.includes('laminat');
  const isInkjet = sub.includes('inkjet') || cat.includes('inkjet') || specs.feedType !== undefined || (!isCutter && !isBinder && !isLaminator && (name.includes('tank') || name.includes('ecotank') || name.includes('l15150')));
  const isLaser = !isCutter && !isBinder && !isLaminator && !isInkjet;

  let totalWear = 0;

  if (isInkjet) {
    // 4 Wear parts for Inkjet from Data Material
    const maintBoxCost = Number(specs.wearMaintBoxCost || eq.wearMaintBoxCost || 0);
    const maintBoxLife = Number(specs.wearMaintBoxLife || eq.wearMaintBoxLife || 0);
    if (maintBoxCost > 0 && maintBoxLife > 0) totalWear += (maintBoxCost / maintBoxLife);

    const rollerCost = Number(specs.wearPickupRollerCost || eq.wearPickupRollerCost || 0);
    const rollerLife = Number(specs.wearPickupRollerLife || eq.wearPickupRollerLife || 0);
    if (rollerCost > 0 && rollerLife > 0) totalWear += (rollerCost / rollerLife);

    const beltCost = Number(specs.wearCarriageBeltCost || eq.wearCarriageBeltCost || 0);
    const beltLife = Number(specs.wearCarriageBeltLife || eq.wearCarriageBeltLife || 0);
    if (beltCost > 0 && beltLife > 0) totalWear += (beltCost / beltLife);

    const headCost = Number(specs.wearPrintheadCost || eq.wearPrintheadCost || 0);
    const headLife = Number(specs.wearPrintheadLife || eq.wearPrintheadLife || 0);
    if (headCost > 0 && headLife > 0) totalWear += (headCost / headLife);
  } else if (isLaser) {
    // 5 Wear parts for Laser from Data Material
    const drumCost = Number(specs.wearDrumUnitCost || eq.wearDrumUnitCost || 0);
    const drumLife = Number(specs.wearDrumUnitLife || eq.wearDrumUnitLife || 0);
    if (drumCost > 0 && drumLife > 0) totalWear += (drumCost / drumLife);

    const fuserCost = Number(specs.wearFuserUnitCost || eq.wearFuserUnitCost || 0);
    const fuserLife = Number(specs.wearFuserUnitLife || eq.wearFuserUnitLife || 0);
    if (fuserCost > 0 && fuserLife > 0) totalWear += (fuserCost / fuserLife);

    const itbCost = Number(specs.wearTransferBeltCost || eq.wearTransferBeltCost || 0);
    const itbLife = Number(specs.wearTransferBeltLife || eq.wearTransferBeltLife || 0);
    if (itbCost > 0 && itbLife > 0) totalWear += (itbCost / itbLife);

    const rollerCost = Number(specs.wearPickupRollerCost || eq.wearPickupRollerCost || 0);
    const rollerLife = Number(specs.wearPickupRollerLife || eq.wearPickupRollerLife || 0);
    if (rollerCost > 0 && rollerLife > 0) totalWear += (rollerCost / rollerLife);

    const wasteBoxCost = Number(specs.wearWasteTonerBoxCost || eq.wearWasteTonerBoxCost || 0);
    const wasteBoxLife = Number(specs.wearWasteTonerBoxLife || eq.wearWasteTonerBoxLife || 0);
    if (wasteBoxCost > 0 && wasteBoxLife > 0) totalWear += (wasteBoxCost / wasteBoxLife);
  } else if (isCutter) {
    const isGuillotine = sub.includes('guillotine') || name.includes('guillotine') || cat.includes('guillotine');
    if (isGuillotine) {
      const sharpCost = Number(specs.wearSharpeningCost || eq.wearSharpeningCost || 0);
      const sharpLife = Number(specs.wearSharpeningIntervalCuts || eq.wearSharpeningIntervalCuts || 0);
      if (sharpCost > 0 && sharpLife > 0) totalWear += (sharpCost / sharpLife);

      const stickCost = Number(specs.wearCuttingStickCost || eq.wearCuttingStickCost || 0);
      const stickLife = Number(specs.wearCuttingStickLifeCuts || eq.wearCuttingStickLifeCuts || 0);
      if (stickCost > 0 && stickLife > 0) totalWear += (stickCost / stickLife);
    } else {
      const bladeCost = Number(specs.wearBladeCost || eq.wearBladeCost || 0);
      const bladeLife = Number(specs.wearBladeLifeMeters || eq.wearBladeLifeMeters || 0);
      if (bladeCost > 0 && bladeLife > 0) totalWear += (bladeCost / bladeLife);

      const teflonCost = Number(specs.wearTeflonStripCost || eq.wearTeflonStripCost || 0);
      const teflonLife = Number(specs.wearTeflonStripLifeMeters || eq.wearTeflonStripLifeMeters || 0);
      if (teflonCost > 0 && teflonLife > 0) totalWear += (teflonCost / teflonLife);
    }
  } else if (isLaminator) {
    const rollerCost = Number(specs.wearSiliconeRollerCost || eq.wearSiliconeRollerCost || 0);
    const rollerLife = Number(specs.wearSiliconeRollerLifeMeters || eq.wearSiliconeRollerLifeMeters || 0);
    if (rollerCost > 0 && rollerLife > 0) totalWear += (rollerCost / rollerLife);
  } else if (isBinder) {
    const millCost = Number(specs.wearMillingCutterCost || eq.wearMillingCutterCost || 0);
    const millLife = Number(specs.wearMillingCutterLifeBooks || eq.wearMillingCutterLifeBooks || 0);
    if (millCost > 0 && millLife > 0) totalWear += (millCost / millLife);

    const punchCost = Number(specs.wearPunchingPinsCost || eq.wearPunchingPinsCost || 0);
    const punchLife = Number(specs.wearPunchingPinsLifePunches || eq.wearPunchingPinsLifePunches || 0);
    if (punchCost > 0 && punchLife > 0) totalWear += (punchCost / punchLife);
  }

  return Math.round(totalWear * 1000) / 1000;
}

/**
 * Standardized Canonical Cost Resolver for Som Sing Phim Machinery
 * Computes Depreciation + Maintenance Wear (+ ISO baseline ink for printers)
 */
export function getEquipmentAccurateCost(eq: any): FormattedMachineCost {
  if (!eq) {
    return {
      depreciation: 0,
      maintenance: 0,
      totalMachineCost: 0,
      inkCost: 0,
      grandTotalCost: 0,
      unitLabel: 'ໜ້າ',
      unitLabelEn: 'page',
      isPrinter: true,
    };
  }

  const cat = String(eq.category || eq.printerCategory || '').toLowerCase();
  const sub = String(eq.postPressSubtype || eq.specs?.postPressSubtype || '').toLowerCase();
  const name = String(eq.name || eq.model || '').toLowerCase();

  const isExplicitPrinter = cat === 'printer' || cat === 'digital press' || cat === 'inkjet' || cat === 'laser';
  const isCutter = !isExplicitPrinter && (cat.includes('cutter') || sub.includes('cutter') || sub.includes('guillotine') || sub.includes('plotter') || name.includes('cutter') || name.includes('guillotine') || name.includes('qzyk') || name.includes('polar'));
  const isBinder = !isExplicitPrinter && (cat.includes('binder') || sub.includes('binder') || name.includes('binder') || name.includes('horizon') || name.includes('superbind'));
  const isLaminator = !isExplicitPrinter && (cat.includes('laminat') || sub.includes('laminat') || name.includes('laminat') || name.includes('foliant'));
  const isInkjet = isExplicitPrinter && (sub.includes('inkjet') || cat.includes('inkjet') || eq.specs?.feedType !== undefined || name.includes('tank') || name.includes('ecotank') || name.includes('l15150') || name.includes('epson'));
  const isPrinter = isExplicitPrinter || (!isCutter && !isBinder && !isLaminator);

  const isGuillotine = isCutter && (sub.includes('guillotine') || name.includes('guillotine') || cat.includes('guillotine'));
  const unitLabel = isGuillotine ? 'ຮອບຕັດ' : (isCutter || isLaminator) ? 'ແມັດ' : isBinder ? 'ຫົວ' : 'ໜ້າ';
  const unitLabelEn = isGuillotine ? 'cut' : (isCutter || isLaminator) ? 'meter' : isBinder ? 'book' : 'page';

  const assetValue = Number(
    eq.MachinePrice ??
    eq.price ??
    eq.unitPrice ??
    eq.purchaseCost ??
    eq.purchasePrice ??
    eq.unitCost ??
    eq.totalPrice ??
    eq.cost_per_purchase_unit ??
    eq.costPerPurchaseUnit ??
    eq.specs?.totalPrice ??
    eq.specs?.price ??
    eq.specs?.purchaseCost ??
    0
  );

  const lifespanYears = Number(eq.lifespanYears || eq.specs?.lifespanYears || 5);
  const totalMonths = lifespanYears * 12;
  const estMonthlyVolume = Number(eq.estMonthlyVolume || eq.specs?.estMonthlyVolume || 0);

  const explicitCapacity = Number(
    eq.expectedLife ||
    eq.specs?.expectedLife ||
    eq.expectedLifeA4Pages ||
    eq.specs?.expectedLifeA4Pages ||
    eq.TargetTotalPages ||
    eq.printedPagesCapacity ||
    eq.expected_life_pages ||
    eq.lifetimePagesA4 ||
    eq.specs?.printedPagesCapacity ||
    0
  );

  const fallbackCapacity = isPrinter 
    ? (isInkjet ? 200000 : 500000) 
    : isCutter 
    ? 100000 
    : isBinder 
    ? 30000 
    : 50000;

  const targetCapacity = explicitCapacity > 0 
    ? explicitCapacity 
    : (estMonthlyVolume > 0 && totalMonths > 0 ? estMonthlyVolume * totalMonths : fallbackCapacity);

  const maintRatePct = Number(
    eq.maintenanceRatePercent !== undefined
      ? eq.maintenanceRatePercent
      : (eq.maintenance_rate_percent !== undefined
          ? eq.maintenance_rate_percent
          : (eq.specs?.maintenanceRatePercent !== undefined ? eq.specs.maintenanceRatePercent : 15))
  );

  let baseDepreciation = 0;
  if (targetCapacity > 0 && assetValue > 0) {
    baseDepreciation = assetValue / targetCapacity;
  } else if (eq.calculatedCostPerPage || eq.costPerPage || eq.costPerConsumptionUnit) {
    baseDepreciation = Number(eq.calculatedCostPerPage || eq.costPerPage || eq.costPerConsumptionUnit);
  }

  // Exact Itemized Wear Parts Rate or fallback to Maintenance %
  const itemizedWear = calculateMachineWearPartsRate(eq);
  const maintWear = itemizedWear > 0 ? itemizedWear : (baseDepreciation * (maintRatePct / 100));
  const totalMachine = Math.round((baseDepreciation + maintWear) * 100) / 100;

  // Ink estimation for printers (ISO 5% standard ~150-200 LAK for standard inkjet/press)
  let inkEstimate = 0;
  if (isPrinter) {
    if (eq.totalColorCost && eq.deprPerPage) {
      inkEstimate = Math.max(0, eq.totalColorCost - eq.deprPerPage - (eq.maintenancePerPage || 0));
    } else if (eq.colorInkCost) {
      inkEstimate = Number(eq.colorInkCost);
    } else if (cat.includes('digital') || name.includes('versant') || name.includes('accurio')) {
      inkEstimate = 200; // Average digital toner per A4 page
    } else {
      inkEstimate = 150; // Average 4-color inkjet per A4 page
    }
  }

  const grandTotal = Math.round((totalMachine + inkEstimate) * 100) / 100;

  return {
    depreciation: Math.round(baseDepreciation * 100) / 100,
    maintenance: Math.round(maintWear * 100) / 100,
    totalMachineCost: totalMachine,
    inkCost: inkEstimate,
    grandTotalCost: grandTotal,
    unitLabel,
    unitLabelEn,
    isPrinter,
  };
}

export interface LinkedInkSlotDetail {
  slot: string;
  colorGroup: string;
  sku: string;
  name: string;
  bottlePrice: number;
  standardVolume: number;
  isoYield: number;
  costPerPage: number;
  isLinked: boolean;
}

export interface EquipmentPrintCostResult {
  assetValue: number;
  baseCostPerUnit: number;
  wearAllowancePerUnit: number;
  netCostPerUnit: number;
  linkedInkRatePerPage: number;
  bwRatePerPage: number;
  finalCostPerPage: number;
  isPostPress: boolean;
  unitLabel: string; // 'ໜ້າ' | 'ແຜ່ນ' | 'ຫົວ'
  unitLabelEn: string; // 'page' | 'sheet' | 'book'
  formattedTotal: string; // e.g. "LAK 61"
  formattedMachine: string; // e.g. "LAK 1.20"
  formattedInk: string; // e.g. "LAK 60"
  inkSlotsBreakdown: LinkedInkSlotDetail[];
}

export function formatUnitLAK(val: number): string {
  if (!val || isNaN(val)) return 'LAK 0';
  if (Math.abs(val) < 1) return `LAK ${val.toFixed(2)}`;
  if (Math.abs(val) < 10) return `LAK ${val.toFixed(2)}`;
  return `LAK ${Math.round(val).toLocaleString()}`;
}

export function formatUnitPrecisionLAK(val: number): string {
  if (!val || isNaN(val)) return 'LAK 0';
  const rounded = Math.round(val * 100) / 100;
  if (Math.abs(rounded) < 1000 && rounded % 1 !== 0) {
    return `LAK ${rounded.toFixed(2)}`;
  }
  return `LAK ${Math.round(val).toLocaleString()}`;
}

export function calculateEquipmentPrintCost(
  eq: any,
  printerColorLinks: any[] = [],
  inventory: any[] = [],
  modalCategory?: string
): EquipmentPrintCostResult {
  if (!eq) {
    return {
      assetValue: 0,
      baseCostPerUnit: 0,
      wearAllowancePerUnit: 0,
      netCostPerUnit: 0,
      linkedInkRatePerPage: 0,
      bwRatePerPage: 0,
      finalCostPerPage: 0,
      isPostPress: false,
      unitLabel: 'ໜ້າ',
      unitLabelEn: 'page',
      formattedTotal: 'LAK 0',
      formattedMachine: 'LAK 0',
      formattedInk: 'LAK 0',
      inkSlotsBreakdown: [],
    };
  }

  const accurate = getEquipmentAccurateCost(eq);
  const isPrinterModal = modalCategory === 'Printer';
  const isCutterModal = modalCategory === 'Cutter';
  const isBinderModal = modalCategory === 'Binder';
  const isLaminatorModal = modalCategory === 'Laminator';

  const isPostPress = isPrinterModal 
    ? false 
    : (isCutterModal || isBinderModal || isLaminatorModal 
        ? true 
        : !accurate.isPrinter);

  const unitLabel = isCutterModal
    ? (accurate.unitLabel === 'ຮອບຕັດ' ? 'ຮອບຕັດ' : 'ແມັດ')
    : isLaminatorModal
    ? 'ແມັດ'
    : isBinderModal
    ? 'ຫົວ'
    : accurate.unitLabel;

  const unitLabelEn = isCutterModal
    ? (accurate.unitLabelEn === 'cut' ? 'cut' : 'meter')
    : isLaminatorModal
    ? 'meter'
    : isBinderModal
    ? 'book'
    : accurate.unitLabelEn;

  const assetValue = Number(
    eq.MachinePrice ?? 
    eq.price ?? 
    eq.unitPrice ?? 
    eq.purchaseCost ?? 
    eq.purchasePrice ?? 
    eq.unitCost ?? 
    eq.totalPrice ?? 
    eq.cost_per_purchase_unit ?? 
    eq.costPerPurchaseUnit ?? 
    eq.specs?.totalPrice ?? 
    eq.specs?.price ?? 
    eq.specs?.purchaseCost ?? 
    0
  );

  const baseCostPerUnit = accurate.depreciation;
  const wearAllowancePerUnit = accurate.maintenance;
  const netCostPerUnit = accurate.totalMachineCost;

  // 1. Direct Field Retrieval: prioritize authoritative persistent fields from equipment if already set
  const persistentColorInkCost = Number(
    eq.colorInkCost ?? 
    eq.linkedInkCostPerPage ?? 
    eq.inkCostPerPage ?? 
    eq.specs?.colorInkCost ?? 
    eq.specs?.linkedInkCostPerPage ?? 
    0
  );

  const persistentBwInkCost = Number(
    eq.bwInkCost ?? 
    eq.specs?.bwInkCost ?? 
    0
  );

  const persistentTotalCost = Number(
    eq.totalPrintCostPerPage ?? 
    eq.calculatedCostPerPage ?? 
    eq.costPerPage ?? 
    eq.specs?.totalPrintCostPerPage ?? 
    0
  );

  // Ink calculations for printer
  const links = (printerColorLinks || []).filter((lnk: any) => lnk.assetId === eq.id);
  let linkedInkRatePerPage = 0;
  const inkSlotsBreakdown: LinkedInkSlotDetail[] = [];

  if (!isPostPress) {
    const oemSlots = 
      eq.oem_baseline_specs?.slots || 
      eq.specs?.oem_baseline_specs?.slots || 
      eq.oemBaselineInks || 
      eq.specs?.oemBaselineInks || 
      [
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500, oemPrice: 450000 },
        { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
        { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
        { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 }
      ];

    if (oemSlots && oemSlots.length > 0) {
      oemSlots.forEach((oemSlot: any, idx: number) => {
        const slotPos = oemSlot.slotPosition || `Slot ${idx + 1}`;
        const isBlack = (oemSlot.colorGroup || '').toLowerCase().includes('black') || (oemSlot.colorGroup || '').toLowerCase().includes('k') || slotPos.toLowerCase().includes('black') || slotPos.toLowerCase().includes('slot 1');
        const colorGroupName = isBlack ? 'Black' : (oemSlot.colorGroup || (idx === 1 ? 'Cyan' : idx === 2 ? 'Magenta' : idx === 3 ? 'Yellow' : `Color ${idx + 1}`));
        const defaultYield = isBlack ? 7500 : 6000;
        const defaultPrice = isBlack ? 450000 : 320000;
        const defaultVol = isBlack ? 127 : 70;

        const activeLink = links.find((lnk: any) => 
          lnk.slotPosition === slotPos || 
          (lnk.slotPosition && slotPos && (lnk.slotPosition.includes(slotPos) || slotPos.includes(lnk.slotPosition))) ||
          (lnk.colorGroup && colorGroupName && lnk.colorGroup.toLowerCase() === colorGroupName.toLowerCase()) ||
          (idx === 0 && (lnk.slotPosition?.includes('Slot 1') || lnk.colorGroup?.toLowerCase() === 'black' || lnk.colorGroup?.toLowerCase() === 'k')) ||
          (idx === 1 && (lnk.slotPosition?.includes('Slot 2') || lnk.colorGroup?.toLowerCase() === 'cyan' || lnk.colorGroup?.toLowerCase() === 'c')) ||
          (idx === 2 && (lnk.slotPosition?.includes('Slot 3') || lnk.colorGroup?.toLowerCase() === 'magenta' || lnk.colorGroup?.toLowerCase() === 'm')) ||
          (idx === 3 && (lnk.slotPosition?.includes('Slot 4') || lnk.colorGroup?.toLowerCase() === 'yellow' || lnk.colorGroup?.toLowerCase() === 'y'))
        );
        const ink = activeLink ? (inventory || []).find((i: any) => 
          i.id === activeLink.inkCode || 
          i.skuCode === activeLink.inkCode || 
          i.sku === activeLink.inkCode ||
          i.specs?.inkCode === activeLink.inkCode ||
          i.specs?.sku === activeLink.inkCode
        ) : null;

        const oemVol = Number(oemSlot.oemStandardVolumeMl || oemSlot.volume || defaultVol);
        const rawYield = Number(oemSlot.oemStandardIsoYieldA4 || (oemSlot.colorGroup === 'Black' ? (eq.blackYieldPages || defaultYield) : (eq.colorYieldPages || defaultYield)));
        const yld = rawYield > 500 ? rawYield : defaultYield;
        const isoRate = yld > 0 ? (oemVol / yld) : 0.0169;
        
        let slotCost = yld > 0 ? (Number(oemSlot.oemPrice || defaultPrice) / yld) : ((Number(oemSlot.oemPrice || defaultPrice) / oemVol) * isoRate);
        let actualInkPrice = Number(oemSlot.oemPrice || defaultPrice);
        let actualVol = oemVol;
        let slotYield = yld;
        let isLinked = false;
        if (ink) {
          isLinked = true;
          actualInkPrice = Number(ink.unitPrice || ink.costPerPurchaseUnit || defaultPrice);
          const rawInkVol = Number(
            ink.volume || 
            ink.specs?.volume || 
            ink.specs?.volume_ml || 
            ink.specs?.oemStandardVolumeMl || 
            ink.specs?.oemVolumeMl || 
            ink.oemStandardVolumeMl || 
            (ink.purchaseMultiplier > 1 ? ink.purchaseMultiplier : null) ||
            defaultVol
          );
          actualVol = rawInkVol > 1 ? rawInkVol : defaultVol;

          const rawInkYield = Number(
            ink.yield || 
            ink.standard_page_yield || 
            ink.standardPageYield || 
            ink.specs?.yield || 
            ink.specs?.expectedYield || 
            ink.specs?.standard_page_yield || 
            ink.specs?.isoYield || 
            0
          );

          const actualCostPerMl = actualVol > 0 ? (actualInkPrice / actualVol) : 0;
          let actualRateMlPerSheet: number;
          if (rawInkYield > 500) {
            actualRateMlPerSheet = actualVol / rawInkYield;
            slotYield = rawInkYield;
          } else if (actualVol > oemVol * 1.5) {
            // Bulk ink refill container (e.g. 500ml, 1000ml) without explicit page yield
            // Consumes ink at printer's standard ISO baseline rate
            actualRateMlPerSheet = isoRate;
            slotYield = actualRateMlPerSheet > 0 ? Math.round(actualVol / actualRateMlPerSheet) : yld;
          } else {
            // Standard cartridge / bottle capacity matching OEM
            actualRateMlPerSheet = yld > 0 ? (actualVol / yld) : isoRate;
            slotYield = yld;
          }
          slotCost = actualCostPerMl * actualRateMlPerSheet;
        }
        
        const roundedSlotCost = Math.round(slotCost * 100) / 100;
        linkedInkRatePerPage += slotCost;

        inkSlotsBreakdown.push({
          slot: slotPos,
          colorGroup: colorGroupName,
          sku: activeLink?.inkCode || oemSlot.oemInkCode || 'OEM',
          name: ink?.name || oemSlot.oemInkCode || slotPos,
          bottlePrice: actualInkPrice,
          standardVolume: actualVol,
          isoYield: slotYield,
          costPerPage: roundedSlotCost,
          isLinked,
        });
      });
    }
  }

  // Direct Field Prioritization: If persistent color ink cost is stored on machine, adopt it
  if (persistentColorInkCost > 0) {
    linkedInkRatePerPage = persistentColorInkCost;
  } else {
    linkedInkRatePerPage = Math.round(linkedInkRatePerPage * 100) / 100;
  }

  const blackSlot = inkSlotsBreakdown.find(s => 
    (s.colorGroup || '').toLowerCase().includes('black') || 
    (s.slot || '').toLowerCase().includes('black') || 
    (s.slot || '').toLowerCase().includes('slot 1')
  );
  const bwRatePerPage = persistentBwInkCost > 0 ? persistentBwInkCost : (blackSlot ? blackSlot.costPerPage : 0);

  const finalCostPerPage = isPostPress 
    ? (eq.costPerConsumptionUnit || netCostPerUnit) 
    : (persistentTotalCost > 0 ? persistentTotalCost : (netCostPerUnit + linkedInkRatePerPage));

  return {
    assetValue,
    baseCostPerUnit: Math.round(baseCostPerUnit * 100) / 100,
    wearAllowancePerUnit: Math.round(wearAllowancePerUnit * 100) / 100,
    netCostPerUnit: Math.round(netCostPerUnit * 100) / 100,
    linkedInkRatePerPage: Math.round(linkedInkRatePerPage * 100) / 100,
    bwRatePerPage: Math.round(bwRatePerPage * 100) / 100,
    finalCostPerPage: Math.round(finalCostPerPage * 100) / 100,
    isPostPress,
    unitLabel,
    unitLabelEn,
    formattedTotal: formatUnitLAK(finalCostPerPage),
    formattedMachine: formatUnitLAK(netCostPerUnit),
    formattedInk: formatUnitLAK(linkedInkRatePerPage),
    inkSlotsBreakdown,
  };
}

export function calculateTotalJobMachineCost(spec: MachineUnitCostInput, totalSheets: number): number {
  const unit = calculateMachineUnitCost(spec);
  return Math.round(unit.totalMachineCost * (totalSheets || 0));
}

export interface MachineCalculationInput {
  equipment: any;
  printerColorLinks?: any[];
  inventory?: any[];
  coveragePercent?: number; // Default 5% (ISO standard)
}

export interface InkSlotCostBreakdown {
  slotName: string;
  colorGroup: string;
  inkName: string;
  inkCode: string;
  costPerPage: number;
  isLinked: boolean;
  isBlack: boolean;
  badgeBg: string;
  badgeText: string;
}

export interface CalculatedMachineCost {
  id: string;
  name: string;
  brand: string;
  model: string;
  type: string;
  location: string;
  serialNumber: string;
  status: string;
  deprPerPage: number;
  maintenancePerPage: number;
  electricityPerPage: number;
  colorInkCost: number;
  bwInkCost: number;
  totalColorCost: number;
  totalBwCost: number;
  isClickRate: boolean;
  linkedInks: InkSlotCostBreakdown[];
  components: any[];
}

export function calculateMachineFullCost({
  equipment: eq,
  printerColorLinks = [],
  inventory = [],
  coveragePercent = 5,
}: MachineCalculationInput): CalculatedMachineCost {
  const coverageMultiplier = coveragePercent / 5;

  // 1. Asset Value & Depreciation per page
  const assetValue = Number(
    eq.price || 
    eq.unitPrice || 
    eq.purchaseCost || 
    eq.purchasePrice || 
    eq.MachinePrice || 
    eq.unitCost || 
    0
  );

  const targetPages = Number(
    eq.expectedLifeA4Pages || 
    eq.lifetimePagesA4 || 
    eq.TargetTotalPages || 
    eq.printedPagesCapacity || 
    1000000
  );

  const maintenanceRatePct = Number(
    eq.maintenanceRatePercent !== undefined 
      ? eq.maintenanceRatePercent 
      : (eq.specs?.maintenanceRatePercent !== undefined ? eq.specs.maintenanceRatePercent : 15)
  );

  const deprPerPage = targetPages > 0 && assetValue > 0 
    ? Math.round((assetValue / targetPages) * 100) / 100 
    : Number(eq.calculatedCostPerPage || 0);

  const maintenancePerPage = Number(
    eq.maintenanceCostPerPage || 
    eq.MaintenanceCostPerPage || 
    Math.round(deprPerPage * (maintenanceRatePct / 100) * 100) / 100
  );

  const electricityPerPage = Number(eq.electricityPerPage || eq.specs?.electricityPerPage || 15);

  // 2. Click-Rate or Direct Toner check (Digital Press / Laser Production Printers)
  const clickRateColor = Number(eq.clickRateColor || 0);
  const clickRateBW = Number(eq.clickRateBW || 0);

  if (clickRateColor > 0 || clickRateBW > 0) {
    const colorInk = clickRateColor > 0 ? clickRateColor : (clickRateBW * 3);
    const bwInk = clickRateBW > 0 ? clickRateBW : Math.round(clickRateColor * 0.25);
    const totalColor = Math.round(deprPerPage + maintenancePerPage + electricityPerPage + colorInk);
    const totalBw = Math.round(deprPerPage + maintenancePerPage + electricityPerPage + bwInk);

    return {
      id: eq.id,
      name: eq.name,
      brand: eq.brand || 'Shop Equipment',
      model: eq.model || eq.name,
      type: eq.printerCategory || eq.category || 'Digital Press',
      location: eq.location || 'Main Press Floor',
      serialNumber: eq.serialNumber || eq.sn || '-',
      status: eq.status || 'In Use',
      deprPerPage: Math.round(deprPerPage),
      maintenancePerPage: Math.round(maintenancePerPage),
      electricityPerPage,
      colorInkCost: Math.round(colorInk),
      bwInkCost: Math.round(bwInk),
      totalColorCost: totalColor,
      totalBwCost: totalBw,
      isClickRate: true,
      linkedInks: [
        {
          slotName: 'Click Charge (Color)',
          colorGroup: 'Color',
          inkName: `Color Click Rate (${colorInk.toLocaleString()}₭)`,
          inkCode: 'CLICK-COLOR',
          costPerPage: Math.round(colorInk),
          isLinked: true,
          isBlack: false,
          badgeBg: 'bg-indigo-600',
          badgeText: 'text-white',
        },
        {
          slotName: 'Click Charge (B/W)',
          colorGroup: 'Black',
          inkName: `B/W Click Rate (${bwInk.toLocaleString()}₭)`,
          inkCode: 'CLICK-BW',
          costPerPage: Math.round(bwInk),
          isLinked: true,
          isBlack: true,
          badgeBg: 'bg-slate-800',
          badgeText: 'text-white',
        }
      ],
      components: eq.components || [],
    };
  }

  // 3. Ink Slot & Inventory Linker Calculation (Inkjet / Photo / Roll Printers)
  const activeLinks = (printerColorLinks || []).filter(lnk => lnk.assetId === eq.id);

  const fallbackSlots = 
    eq?.oem_baseline_specs?.slots || 
    eq?.specs?.oem_baseline_specs?.slots || 
    eq?.oemBaselineInks || 
    eq?.printerColorLinks || 
    (
      (eq.name?.includes('6-Color') || eq.model?.includes('L1800') || eq.specs?.colorSchemeType === '6-Color')
        ? [
            { slotPosition: 'Cyan (C)', colorGroup: 'Cyan', oemInkCode: 'EPSON-T673-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 185000 },
            { slotPosition: 'Magenta (M)', colorGroup: 'Magenta', oemInkCode: 'EPSON-T673-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 185000 },
            { slotPosition: 'Yellow (Y)', colorGroup: 'Yellow', oemInkCode: 'EPSON-T673-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 185000 },
            { slotPosition: 'Black (K)', colorGroup: 'Black', oemInkCode: 'EPSON-T673-BK', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 185000 },
            { slotPosition: 'Light Cyan (LC)', colorGroup: 'Cyan', oemInkCode: 'EPSON-T673-LC', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 185000 },
            { slotPosition: 'Light Magenta (LM)', colorGroup: 'Magenta', oemInkCode: 'EPSON-T673-LM', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 185000 },
          ]
        : [
            { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500, oemPrice: 450000 },
            { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
            { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
            { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 }
          ]
    );

  let totalColorInkCost = 0;
  let totalBwInkCost = 0;
  const processedInks: InkSlotCostBreakdown[] = [];

  fallbackSlots.forEach((slot: any, idx: number) => {
    const slotPos = slot.slotPosition || slot.name || `Slot ${idx + 1}`;
    const colorGroup = slot.colorGroup || (
      slotPos.toLowerCase().includes('black') || slotPos.includes('(k)') || slotPos.includes('(K)') ? 'Black' :
      slotPos.toLowerCase().includes('cyan') || slotPos.includes('(c)') || slotPos.includes('(C)') ? 'Cyan' :
      slotPos.toLowerCase().includes('magenta') || slotPos.includes('(m)') || slotPos.includes('(M)') ? 'Magenta' :
      slotPos.toLowerCase().includes('yellow') || slotPos.includes('(y)') || slotPos.includes('(Y)') ? 'Yellow' : 'Color'
    );

    const isBlack = colorGroup === 'Black' || slotPos.toLowerCase().includes('black') || slotPos.includes('(k)') || slotPos.includes('(K)');

    // OEM factory baseline specs
    const oemVol = Number(slot.oemStandardVolumeMl || slot.volume || (isBlack ? 127 : 70));
    const oemYield = Number(slot.oemStandardIsoYieldA4 || slot.isoYield || (isBlack ? 7500 : 6000));
    const oemPrice = Number(slot.oemPrice || (isBlack ? 450000 : 320000));

    const isoRateMlPerSheet = oemYield > 0 ? (oemVol / oemYield) : 0.0169;
    const scaledRateMl = isoRateMlPerSheet * coverageMultiplier;
    const oemCostPerMl = oemVol > 0 ? (oemPrice / oemVol) : 0;
    const oemCostPerPage = oemCostPerMl * scaledRateMl;

    // Check if there is an active link to real inventory
    const activeLink = activeLinks.find(lnk => 
      lnk.slotPosition === slotPos || 
      lnk.colorGroup === colorGroup || 
      (colorGroup && lnk.slotPosition?.toLowerCase().includes(colorGroup.toLowerCase()))
    );

    const linkedInkItem = activeLink 
      ? (inventory || []).find(inv => inv.id === activeLink.inkCode || inv.skuCode === activeLink.inkCode || inv.sku === activeLink.inkCode)
      : null;

    let actualCostPerPage = oemCostPerPage;
    let inkName = slot.oemInkCode ? `${eq.brand || ''} ${slot.oemInkCode}` : `${eq.brand || ''} OEM ${slotPos}`;
    let inkCode = slot.oemInkCode || 'OEM-INK';
    let isLinked = false;

    if (linkedInkItem) {
      isLinked = true;
      inkName = linkedInkItem.name || activeLink.inkCode;
      inkCode = linkedInkItem.sku || linkedInkItem.skuCode || activeLink.inkCode;
      const actualInkPrice = Number(linkedInkItem.unitPrice || linkedInkItem.costPerPurchaseUnit || linkedInkItem.costPerConsumptionUnit || 0);
      
      const resolvedVol = Number(
        linkedInkItem.volume || 
        linkedInkItem.specs?.volume || 
        linkedInkItem.specs?.volume_ml || 
        linkedInkItem.specs?.oemStandardVolumeMl || 
        linkedInkItem.specs?.oemVolumeMl || 
        linkedInkItem.oemStandardVolumeMl || 
        (linkedInkItem.purchaseMultiplier > 1 ? linkedInkItem.purchaseMultiplier : null) || 
        (isBlack ? 127 : 70)
      );

      const actualCostPerMl = resolvedVol > 0 ? (actualInkPrice / resolvedVol) : 0;

      const linkedYield = Number(
        linkedInkItem.yield ||
        linkedInkItem.standard_page_yield ||
        linkedInkItem.standardPageYield ||
        linkedInkItem.specs?.yield ||
        linkedInkItem.specs?.expectedYield ||
        linkedInkItem.specs?.standard_page_yield ||
        linkedInkItem.specs?.isoYield ||
        0
      );

      const actualRateMlPerSheet = linkedYield > 0 ? (resolvedVol / linkedYield) : isoRateMlPerSheet;
      const actualScaledRateMl = actualRateMlPerSheet * coverageMultiplier;
      actualCostPerPage = actualCostPerMl * actualScaledRateMl;
    }

    const roundedCost = Math.round(actualCostPerPage * 100) / 100;

    if (isBlack) {
      totalBwInkCost += roundedCost;
    }
    totalColorInkCost += roundedCost;

    let badgeBg = 'bg-slate-800';
    let badgeText = 'text-white';
    if (slotPos.toLowerCase().includes('cyan') || colorGroup === 'Cyan') {
      badgeBg = slotPos.toLowerCase().includes('light') ? 'bg-sky-400' : 'bg-cyan-500';
      badgeText = slotPos.toLowerCase().includes('light') ? 'text-slate-900' : 'text-white';
    } else if (slotPos.toLowerCase().includes('magenta') || colorGroup === 'Magenta') {
      badgeBg = slotPos.toLowerCase().includes('light') ? 'bg-pink-400' : 'bg-rose-500';
      badgeText = slotPos.toLowerCase().includes('light') ? 'text-slate-900' : 'text-white';
    } else if (slotPos.toLowerCase().includes('yellow') || colorGroup === 'Yellow') {
      badgeBg = 'bg-amber-400';
      badgeText = 'text-slate-900';
    }

    processedInks.push({
      slotName: slotPos,
      colorGroup,
      inkName,
      inkCode,
      costPerPage: roundedCost,
      isLinked,
      isBlack,
      badgeBg,
      badgeText,
    });
  });

  if (totalBwInkCost === 0) {
    totalBwInkCost = Math.round(totalColorInkCost * 0.25) || 30;
  }

  // Enforce invariant: 4-Color ink cost must be >= Monochrome (Black only) ink cost
  if (totalColorInkCost < totalBwInkCost) {
    totalColorInkCost = totalBwInkCost * 2.5;
  }

  const finalColorCost = Math.round(deprPerPage + maintenancePerPage + electricityPerPage + totalColorInkCost);
  const finalBwCost = Math.round(deprPerPage + maintenancePerPage + electricityPerPage + totalBwInkCost);

  return {
    id: eq.id,
    name: eq.name,
    brand: eq.brand || 'Shop Equipment',
    model: eq.model || eq.name,
    type: eq.printerCategory || eq.category || 'Printer',
    location: eq.location || 'Press Floor',
    serialNumber: eq.serialNumber || eq.sn || '-',
    status: eq.status || 'In Use',
    deprPerPage: Math.round(deprPerPage),
    maintenancePerPage: Math.round(maintenancePerPage),
    electricityPerPage,
    colorInkCost: Math.round(totalColorInkCost),
    bwInkCost: Math.round(totalBwInkCost),
    totalColorCost: Math.max(finalColorCost, finalBwCost),
    totalBwCost: Math.min(finalColorCost, finalBwCost),
    isClickRate: false,
    linkedInks: processedInks,
    components: eq.components || [],
  };
}

/**
 * Calculates preflight coverage surcharge for customer artwork
 * @param actualCoverage The combined CMYK coverage scanned from customer artwork (e.g., 35%)
 * @param baselineCoverage The product's baseline coverage (e.g., 15%)
 * @param inkCostAtBaseline The baseline ink cost (e.g., 200 LAK at 15%)
 * @returns Extra ink surcharge (0 if actual <= baseline)
 */
export function calculatePreflightCoverageSurcharge(
  actualCoverage: number,
  baselineCoverage: number,
  inkCostAtBaseline: number
): { surcharge: number; isSurchargeApplied: boolean; ratio: number } {
  if (actualCoverage <= baselineCoverage || baselineCoverage <= 0) {
    return { surcharge: 0, isSurchargeApplied: false, ratio: 1 };
  }

  const excessCoverage = actualCoverage - baselineCoverage;
  const inkRatePerPercent = inkCostAtBaseline / baselineCoverage;
  const surcharge = Math.round(excessCoverage * inkRatePerPercent);
  const ratio = actualCoverage / baselineCoverage;

  return { surcharge, isSurchargeApplied: true, ratio };
}
