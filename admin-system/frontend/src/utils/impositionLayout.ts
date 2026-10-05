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

/** Read only structured selected-stock geometry; the server owns snapshots/version. */
export function preCutStockDimensions(paper: any): { sheetWidth: number; sheetHeight: number } | undefined {
  if (!paper?.id || (paper.category && String(paper.category).toLowerCase() !== 'paper') || paper.is_active === false) return;
  const raw = paper.technical_specs ?? paper.specs ?? {};
  const sources = [raw, raw.specs].filter(Boolean);
  let dimensions: number[] | undefined;
  for (const specs of sources) {
    if (specs.unit !== undefined && specs.unit !== 'mm') return;
    if (['roll', 'parent_sheet', '31x43', 'rigid'].includes(String(specs.paperFormat || specs.paper_format || '').toLowerCase())) return;
    const candidates: number[][] = [];
    for (const [wk, hk] of [['width_mm', 'height_mm'], ['width', 'height']]) {
      if (specs[wk] !== undefined || specs[hk] !== undefined) {
        if (typeof specs[wk] !== 'number' || typeof specs[hk] !== 'number') return;
        candidates.push([specs[wk], specs[hk]]);
      }
    }
    if (specs.standardSize !== undefined) {
      const preset = ({ A3: [297, 420], A4: [210, 297], A5: [148, 210] } as Record<string, number[]>)[String(specs.standardSize).toUpperCase()];
      if (!preset) return;
      candidates.push(preset);
    }
    for (const candidate of candidates) {
      if (!candidate.every(n => Number.isFinite(n) && n > 0) || (dimensions && (dimensions[0] !== candidate[0] || dimensions[1] !== candidate[1]))) return;
      dimensions = candidate;
    }
  }
  return dimensions ? { sheetWidth: dimensions[0], sheetHeight: dimensions[1] } : undefined;
}
export function preCutStockMatches(paper: any, width: number, height: number) {
  const dimensions = preCutStockDimensions(paper);
  return !!dimensions && Number.isFinite(width) && Number.isFinite(height) && ((dimensions.sheetWidth === width && dimensions.sheetHeight === height) || (dimensions.sheetWidth === height && dimensions.sheetHeight === width));
}
