export interface SheetGeometry { sheetWidth: number; sheetHeight: number; itemWidth: number; itemHeight: number; marginX: number; marginY: number; gap: number }
/** Same grid geometry as the existing imposed-PDF workflow, with explicit no-fit. */
export function impositionGrid(g: SheetGeometry) {
  if (![g.sheetWidth,g.sheetHeight,g.itemWidth,g.itemHeight].every(n => Number.isFinite(n) && n > 0) || ![g.marginX,g.marginY,g.gap].every(n => Number.isFinite(n) && n >= 0)) return { cols: 0, rows: 0, capacity: 0 };
  const cols = Math.max(0, Math.floor((g.sheetWidth - 2*g.marginX + g.gap)/(g.itemWidth+g.gap)));
  const rows = Math.max(0, Math.floor((g.sheetHeight - 2*g.marginY + g.gap)/(g.itemHeight+g.gap)));
  return { cols, rows, capacity: cols*rows };
}
/** Parent sheet resolution shared with the existing quotation formula. */
export function parentSheetDimensions(paper: any, parentSheetSize?: string) {
  if (parentSheetSize === '31x43' || paper?.name?.includes('31x43') || paper?.specs?.standardSize === '31x43' || paper?.category === 'parent_sheet') return {sheetWidth:787,sheetHeight:1092};
  if (paper?.name?.includes('A3') || paper?.specs?.standardSize === 'A3') return {sheetWidth:297,sheetHeight:420};
  if (paper?.name?.includes('A4') || paper?.specs?.standardSize === 'A4') return {sheetWidth:210,sheetHeight:297};
  if (paper?.name?.includes('A5') || paper?.specs?.standardSize === 'A5') return {sheetWidth:148,sheetHeight:210};
  return {sheetWidth:Number(paper?.specs?.width)||210,sheetHeight:Number(paper?.specs?.height)||297};
}

/** Read only structured selected-stock geometry; never infer stock size from job/name. */
export function preCutStockValidation(paper: any): { dimensions?: { sheetWidth: number; sheetHeight: number }; error: string } {
  const invalid = (error: string) => ({ error });
  if (!paper?.id) return invalid('ກະລຸນາເລືອກເຈ້ຍຈາກສາງກ່ອນສົ່ງຂໍ້ມູນ (Imposition OFF).');
  if (paper.category && String(paper.category).toLowerCase() !== 'paper') return invalid('ລາຍການທີ່ເລືອກບໍ່ແມ່ນເຈ້ຍ (category: paper).');
  if (paper.is_active === false) return invalid('ເຈ້ຍທີ່ເລືອກຖືກປິດໃຊ້ງານ.');
  const raw = paper.technical_specs ?? paper.specs ?? {};
  const sources = [{ specs: raw, path: 'technical_specs' }, ...(raw.specs ? [{ specs: raw.specs, path: 'technical_specs.specs' }] : [])];
  let dimensions: number[] | undefined;
  for (const { specs, path } of sources) {
    const rawUnit = specs.unit !== undefined ? String(specs.unit).trim().toLowerCase() : '';
    const dimUnit = specs.dimension_unit !== undefined ? String(specs.dimension_unit).trim().toLowerCase() : '';
    const effectiveUnit = dimUnit || rawUnit;
    if (effectiveUnit && effectiveUnit !== 'mm') {
      const consumptionUnits = ['sheet', 'sheets', 'ແຜ່ນ', 'pack', 'ream', 'roll', 'box', 'ກ່ອງ', 'ລັງ', 'ມ້ວນ'];
      if (!consumptionUnits.includes(effectiveUnit)) {
        return invalid(`${path}.unit ຕ້ອງເປັນ mm.`);
      }
    }
    if (['roll', 'parent_sheet', '31x43', 'rigid'].includes(String(specs.paperFormat || specs.paper_format || '').toLowerCase())) return invalid('ເຈ້ຍມ້ວນ ຫຼື ເຈ້ຍແມ່ພິມບໍ່ຮອງຮັບ Imposition OFF. ກະລຸນາເລືອກເຈ້ຍຕັດສຳເລັດ.');
    const candidates: number[][] = [];
    for (const [wk, hk] of [['width_mm', 'height_mm'], ['width', 'height']]) {
      if (specs[wk] !== undefined || specs[hk] !== undefined) {
        if (typeof specs[wk] !== 'number' || typeof specs[hk] !== 'number') return invalid(`${path}.${wk}/${hk} ຕ້ອງຄົບຄູ່ ແລະ ເປັນຕົວເລກ.`);
        candidates.push([specs[wk], specs[hk]]);
      }
    }
    const standardSizeCandidate = specs.standardSize ?? paper?.standardSize ?? (paper?.name?.includes('A4') ? 'A4' : paper?.name?.includes('A3') ? 'A3' : paper?.name?.includes('A5') ? 'A5' : undefined);
    if (standardSizeCandidate !== undefined) {
      const preset = ({ A3: [297, 420], A4: [210, 297], A5: [148, 210] } as Record<string, number[]>)[String(standardSizeCandidate).toUpperCase()];
      if (!preset) return invalid(`${path}.standardSize ຕ້ອງເປັນ A3, A4 ຫຼື A5; ຫຼື ລະບຸ width_mm/height_mm.`);
      candidates.push(preset);
    }
    for (const candidate of candidates) {
      if (!candidate.every(n => Number.isFinite(n) && n > 0)) return invalid(`${path} ຂະໜາດເຈ້ຍຕ້ອງເປັນຕົວເລກໃຫຍ່ກວ່າ 0.`);
      if (dimensions && (dimensions[0] !== candidate[0] || dimensions[1] !== candidate[1])) return invalid('ຂໍ້ມູນຂະໜາດເຈ້ຍຂັດແຍ່ງກັນ (width_mm/height_mm, width/height, standardSize ຫຼື specs). ກະລຸນາກວດຂໍ້ມູນສາງ.');
      dimensions = candidate;
    }
  }
  return dimensions ? { dimensions: { sheetWidth: dimensions[0], sheetHeight: dimensions[1] }, error: '' } : invalid('ເຈ້ຍທີ່ເລືອກບໍ່ມີຂະໜາດໃບເຈ້ຍທີ່ໃຊ້ໄດ້. ກະລຸນາລະບຸ technical_specs.width_mm/height_mm ເປັນຕົວເລກ ຫຼື standardSize: A3/A4/A5.');
}
export function preCutStockDimensions(paper: any) {
  return preCutStockValidation(paper).dimensions;
}
export function preCutStockDescription(paper: any): string {
  const { dimensions, error } = preCutStockValidation(paper);
  return dimensions ? `ເຈ້ຍໃນສາງ: ${dimensions.sheetWidth} × ${dimensions.sheetHeight} mm` : error;
}
export function preCutStockMatches(paper: any, width: number, height: number) {
  const dimensions = preCutStockDimensions(paper);
  if (!dimensions || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return false;
  const fitsDirect = dimensions.sheetWidth >= width && dimensions.sheetHeight >= height;
  const fitsRotated = dimensions.sheetWidth >= height && dimensions.sheetHeight >= width;
  return fitsDirect || fitsRotated;
}

/** OFF keeps its size guard, with a reason specific to the selected inputs. */
export function preCutStockError(paper: any, width: number, height: number): string {
  const { error } = preCutStockValidation(paper);
  if (error) return error;
  if (![width, height].every(value => Number.isFinite(value) && value > 0)) return 'ກະລຸນາລະບຸຄວາມກວ້າງ ແລະ ຄວາມສູງຂອງວຽກເປັນ ມມ (mm).';
  return preCutStockMatches(paper, width, height) ? '' : 'ຂະໜາດງານໃຫຍ່ກວ່າຂະໜາດເຈ້ຍໃນສາງ. ກະລຸນາເລືອກເຈ້ຍທີ່ມີຂະໜາດໃຫຍ່ກວ່າ.';
}
