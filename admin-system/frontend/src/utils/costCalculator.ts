/**
 * Som Sing Phim - Cost Engine & Unit Calculation Utilities
 * Standardizes unit cost calculations across Paper, Ink, and Consumables.
 */

export interface PaperCostInput {
  totalCost: number;
  packCount?: number;
  sheetsPerPack?: number;
  totalSheets?: number;
}

export interface InkCostInput {
  totalCost: number;
  bottleCount?: number;
  volumePerBottleMl?: number;
  totalVolumeMl?: number;
}

/**
 * Calculates Paper Unit Cost (LAK per Sheet)
 * Formula: Total Import Cost / Total Sheet Count
 * Total Sheet Count = Pack Count * Sheets Per Pack
 */
export function calculatePaperUnitCost(input: PaperCostInput): number {
  const totalCost = Number(input.totalCost) || 0;
  let totalSheets = Number(input.totalSheets) || 0;

  if (totalSheets <= 0) {
    const packCount = Number(input.packCount) || 1;
    const sheetsPerPack = Number(input.sheetsPerPack) || 500;
    totalSheets = packCount * sheetsPerPack;
  }

  if (totalSheets <= 0) return 0;
  return Math.round(totalCost / totalSheets);
}

/**
 * Calculates Ink Unit Cost (LAK per ml)
 * Formula: Total Import Cost / Total Volume (ml)
 * Total Volume = Bottle Count * Volume Per Bottle
 */
export function calculateInkUnitCost(input: InkCostInput): number {
  const totalCost = Number(input.totalCost) || 0;
  let totalVolume = Number(input.totalVolumeMl) || 0;

  if (totalVolume <= 0) {
    const bottleCount = Number(input.bottleCount) || 1;
    const volumePerBottle = Number(input.volumePerBottleMl) || 100;
    totalVolume = bottleCount * volumePerBottle;
  }

  if (totalVolume <= 0) return 0;
  return Math.round(totalCost / totalVolume);
}

/**
 * Formats composite item name for table display
 */
export function formatCompositeItemName(item: any): string {
  if (!item) return '-';

  const specs = item.specs || item.technical_specs || {};
  const cat = (item.category || item.categoryPill || '').toLowerCase();

  // Ink composite format: Brand - ColorName (ColorGroup)
  if (cat.includes('ink') || cat.includes('ໝຶກ')) {
    const brand = specs.brand || item.brand || '';
    const colorName = specs.colorName || specs.color_name || item.colorName || item.name || '';
    const colorGroup = specs.colorGroup || specs.color_group || item.colorGroup || '';

    let parts: string[] = [];
    if (brand) parts.push(brand);
    if (colorName && colorName !== brand) parts.push(colorName);

    let title = parts.join(' - ');
    if (!title) title = item.name || item.itemName || 'Ink Item';
    if (colorGroup && !title.toLowerCase().includes(colorGroup.toLowerCase())) {
      title = `${title} (${colorGroup})`;
    }
    return title;
  }

  // Paper composite format: Name - GrammageGsm (Format)
  if (cat.includes('paper') || cat.includes('material') || cat.includes('ເຈ້ຍ')) {
    const name = item.name || item.itemName || specs.paperName || 'Paper';
    const gsm = specs.grammageGsm || specs.grammage || item.grammageGsm;
    const format = specs.paperFormat || specs.standardSize || item.paperFormat;

    let subSpecs: string[] = [];
    if (gsm) subSpecs.push(`${gsm}gsm`);
    if (format) subSpecs.push(`(${format})`);

    if (subSpecs.length > 0 && !name.toLowerCase().includes(subSpecs[0].toLowerCase())) {
      return `${name} - ${subSpecs.join(' ')}`;
    }
    return name;
  }

  if (item.name && item.name.trim() !== '') return item.name;
  if (item.itemName && item.itemName.trim() !== '') return item.itemName;
  return 'Unspecified Item';
}
