/**
 * Canonical Asset & Equipment Classification Helper
 * Single source of truth for classifying equipment/assets vs materials/consumables
 * across Inbound, Inventory, and Equipment management modules.
 */

export type CanonicalEquipmentCategory = 'Printer' | 'Cutter' | 'Binder' | 'Laminator';
export type CanonicalPrinterSubtype = 'Laser' | 'Inkjet' | 'Plotter' | 'UV' | 'Sublimation';

const ASSET_TYPE_KEYWORDS = new Set([
  'PRINTER',
  'MACHINERY',
  'EQUIPMENT',
  'CUTTER',
  'BINDER',
  'LAMINATOR',
  'PRESS',
  'GUILLOTINE',
  'PLOTTER',
]);

const ASSET_ID_PREFIXES = ['MAC-', 'PRN-', 'EQ-', 'EQUIP-', 'CUT-', 'BIN-', 'LAM-'];

const POST_PRESS_SUBTYPES = new Set(['guillotine', 'cutter', 'binder', 'laminator']);

/**
 * Determines whether an inbound entry or inventory record is a physical Asset / Equipment
 * (Printer, Cutter, Binder, Laminator, or general Machinery) rather than a raw material or consumable.
 */
export function isAssetItem(categoryOrType?: string, item?: any): boolean {
  const cat = (categoryOrType || item?.category || item?.importType || item?.type || '').trim().toUpperCase();

  // 1. Direct category / type match
  if (ASSET_TYPE_KEYWORDS.has(cat)) {
    return true;
  }

  // 2. Lao / Thai classification keywords
  const laoThaiAssetKeywords = [
    'ເຄື່ອງຈັກ',
    'ເຄື່ອງພິມ',
    'ເຄື່ອງຕັດ',
    'ເຄື່ອງເຂົ້າເລັ້ມ',
    'ເຄື່ອງເຂົ້າເຫຼັ້ມ',
    'ເຄື່ອງເຄືອບ',
    'เครื่องพิมพ์',
    'เครื่องจักร',
    'เครื่องตัด',
    'เครื่องเข้าเล่ม',
    'เครื่องเคลือบ',
  ];
  if (laoThaiAssetKeywords.some(kw => cat.includes(kw.toUpperCase()))) {
    return true;
  }

  // 3. ID / SKU Prefix match
  const rawId = (item?.id || item?.sku || item?.skuCode || item?.asset_id || '').trim().toUpperCase();
  if (ASSET_ID_PREFIXES.some(prefix => rawId.startsWith(prefix))) {
    return true;
  }

  // 4. Machinery-specific structural attributes
  if (
    item?.printerInkSlots?.length > 0 ||
    item?.specs?.printerInkSlots?.length > 0 ||
    item?.specs?.oemBaselineInks?.length > 0 ||
    item?.machineryTypeCategory !== undefined ||
    item?.specs?.machineryTypeCategory !== undefined ||
    item?.printedPagesCapacity !== undefined ||
    item?.expectedLifeA4Pages !== undefined ||
    item?.components?.length > 0 ||
    item?.printerColorLinks?.length > 0
  ) {
    return true;
  }

  // 5. Post-press subtype in specs
  const postPressSubtype = (item?.postPressSubtype || item?.specs?.postPressSubtype || '').toLowerCase();
  if (POST_PRESS_SUBTYPES.has(postPressSubtype)) {
    return true;
  }

  // 6. Name / Model keyword inspection
  const nameAndModel = `${item?.name || ''} ${item?.itemName || ''} ${item?.model || ''} ${item?.machineModel || ''}`.toLowerCase();
  if (
    nameAndModel.includes('cutting machine') ||
    nameAndModel.includes('guillotine') ||
    nameAndModel.includes('perfect binder') ||
    nameAndModel.includes('glue binder') ||
    nameAndModel.includes('roll laminator') ||
    nameAndModel.includes('hydraulic cutter') ||
    nameAndModel.includes('auto binder')
  ) {
    return true;
  }

  return false;
}

/**
 * Resolves the canonical equipment category (one of 4 primary categories: 'Printer' | 'Cutter' | 'Binder' | 'Laminator').
 */
export function resolveCanonicalEquipmentCategory(categoryOrType?: string, item?: any): CanonicalEquipmentCategory {
  const cat = (categoryOrType || item?.category || item?.importType || item?.type || '').trim().toLowerCase();
  const nameAndModel = `${item?.name || ''} ${item?.itemName || ''} ${item?.brand || ''} ${item?.model || ''} ${item?.machineModel || ''}`.toLowerCase();
  const rawId = (item?.id || item?.sku || item?.skuCode || item?.asset_id || '').trim().toUpperCase();
  const postPressSubtype = (item?.postPressSubtype || item?.specs?.postPressSubtype || '').toLowerCase();

  // --- 1. Cutter Resolution ---
  if (
    cat === 'cutter' ||
    cat === 'guillotine' ||
    cat.includes('ເຄື່ອງຕັດ') ||
    cat.includes('เครื่องตัด') ||
    postPressSubtype === 'cutter' ||
    postPressSubtype === 'guillotine' ||
    rawId.startsWith('CUT-') ||
    nameAndModel.includes('cutter') ||
    nameAndModel.includes('guillotine') ||
    nameAndModel.includes('slitter') ||
    nameAndModel.includes('die-cut') ||
    nameAndModel.includes('qzyk') ||
    nameAndModel.includes('polar')
  ) {
    return 'Cutter';
  }

  // --- 2. Binder Resolution ---
  if (
    cat === 'binder' ||
    cat.includes('ເຄື່ອງເຂົ້າເລັ້ມ') ||
    cat.includes('ເຄື່ອງເຂົ້າເຫຼັ້ມ') ||
    cat.includes('เครื่องเข้าเล่ม') ||
    postPressSubtype === 'binder' ||
    rawId.startsWith('BIN-') ||
    nameAndModel.includes('binder') ||
    nameAndModel.includes('boway') ||
    nameAndModel.includes('perfect binder') ||
    nameAndModel.includes('stitcher') ||
    nameAndModel.includes('book binder') ||
    nameAndModel.includes('glue binder')
  ) {
    return 'Binder';
  }

  // --- 3. Laminator Resolution ---
  if (
    cat === 'laminator' ||
    cat.includes('ເຄື່ອງເຄືອບ') ||
    cat.includes('เครื่องเคลือบ') ||
    postPressSubtype === 'laminator' ||
    rawId.startsWith('LAM-') ||
    nameAndModel.includes('laminat') ||
    nameAndModel.includes('thermal laminator') ||
    nameAndModel.includes('roll laminator')
  ) {
    return 'Laminator';
  }

  // --- 4. Printer Resolution (Default for printing assets) ---
  return 'Printer';
}

/**
 * Resolves the specific printer subtype ('Laser' | 'Inkjet' | 'Plotter' | 'UV' | 'Sublimation').
 */
export function resolvePrinterSubtype(item?: any): CanonicalPrinterSubtype {
  const pCat = (
    item?.printerCategory ||
    item?.printerType ||
    item?.machineryTypeCategory ||
    item?.specs?.printerCategory ||
    item?.specs?.machineryTypeCategory ||
    item?.specs?.type ||
    ''
  ).toLowerCase();

  const nameAndModel = `${item?.name || ''} ${item?.itemName || ''} ${item?.brand || ''} ${item?.model || ''} ${item?.machineModel || ''}`.toLowerCase();

  if (
    pCat.includes('inkjet') ||
    nameAndModel.includes('l15150') ||
    nameAndModel.includes('ecotank') ||
    nameAndModel.includes('mfc-j') ||
    nameAndModel.includes('ink tank') ||
    nameAndModel.includes('maxify')
  ) {
    return 'Inkjet';
  }

  if (
    pCat.includes('laser') ||
    nameAndModel.includes('laser') ||
    nameAndModel.includes('xerox') ||
    nameAndModel.includes('c8055') ||
    nameAndModel.includes('c5005') ||
    nameAndModel.includes('docucentre') ||
    nameAndModel.includes('apeos') ||
    nameAndModel.includes('bizhub') ||
    nameAndModel.includes('imagepress')
  ) {
    return 'Laser';
  }

  if (pCat.includes('plotter') || nameAndModel.includes('plotter') || nameAndModel.includes('cad plotter')) {
    return 'Plotter';
  }

  if (pCat.includes('uv') || nameAndModel.includes('uv printer') || nameAndModel.includes('flatbed uv')) {
    return 'UV';
  }

  if (pCat.includes('sublimation') || nameAndModel.includes('sublimation')) {
    return 'Sublimation';
  }

  return 'Inkjet';
}

/**
 * Checks if a record is purely material / consumable (not an asset)
 */
export function isMaterialItem(item?: any): boolean {
  if (!item) return false;
  return !isAssetItem(item.category, item);
}
