/**
 * Machine Cost Calculation Utility
 * Standardized across Som Sing Phim Machinery, Inventory Linker, and Product Spec Studio
 */

export interface MachineUnitCostInput {
  purchase_price_lak?: number;
  purchaseCost?: number;
  price?: number;
  expected_life_pages?: number;
  printedPagesCapacity?: number;
  maintenance_rate_percent?: number;
  maintenanceRatePercent?: number;
}

export interface MachineUnitCostResult {
  depreciation: number;
  maintenance: number;
  totalMachineCost: number;
}

export function calculateMachineUnitCost(spec: MachineUnitCostInput): MachineUnitCostResult {
  const price = Number(spec.purchase_price_lak ?? spec.purchaseCost ?? spec.price ?? 0);
  const targetPages = Number(spec.expected_life_pages ?? spec.printedPagesCapacity ?? 0);
  const maintRate = Number(spec.maintenance_rate_percent ?? spec.maintenanceRatePercent ?? 0);

  if (!targetPages || targetPages <= 0 || price <= 0) {
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
