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
