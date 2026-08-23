export interface MachineUnitCostInput {
  purchase_price_lak?: number;
  expected_life_pages?: number;
  maintenance_rate_percent?: number;
}

export interface MachineUnitCostResult {
  depreciation: number;
  maintenance: number;
  totalMachineCost: number;
}

/**
 * Calculates Machine Overhead Unit Cost (Depreciation + Maintenance Reserve) per Sheet/Page
 * 
 * Canonical Formulas:
 * Depreciation per Sheet = Purchase Price (LAK) / Expected Life Pages
 * Maintenance Reserve per Sheet = Depreciation per Sheet * (Maintenance Rate % / 100)
 * Machine Cost per Sheet = Depreciation per Sheet + Maintenance Reserve per Sheet
 */
export function calculateMachineUnitCost(spec: MachineUnitCostInput): MachineUnitCostResult {
  const purchasePrice = Number(spec.purchase_price_lak) || 0;
  const lifePages = Number(spec.expected_life_pages) || 0;
  const maintRate = Number(spec.maintenance_rate_percent) || 0;

  if (lifePages <= 0 || purchasePrice <= 0) {
    return { depreciation: 0, maintenance: 0, totalMachineCost: 0 };
  }

  const depreciation = purchasePrice / lifePages;
  const maintenance = depreciation * (maintRate / 100);
  const totalMachineCost = depreciation + maintenance;

  return {
    depreciation: Math.round(depreciation * 100) / 100,
    maintenance: Math.round(maintenance * 100) / 100,
    totalMachineCost: Math.round(totalMachineCost * 100) / 100,
  };
}

/**
 * Calculates total machine cost for a print job given total sheets / pages
 */
export function calculateTotalJobMachineCost(spec: MachineUnitCostInput, totalSheets: number): number {
  const { totalMachineCost } = calculateMachineUnitCost(spec);
  return Math.round(totalMachineCost * Math.max(0, totalSheets));
}
