import type { ArtworkPart } from '../../orders/types';
import type { QuotationItem } from '../components/QuotationManager';

/** Feed each intact source into the existing print formula; shared job modules are excluded here. */
export function itemForArtworkPart(item: QuotationItem, part: ArtworkPart): QuotationItem {
  const mono = part.colorMode === 'MONO_K';
  return {
    ...item,
    ...part.printSettings,
    artworkParts: undefined,
    includeCover: false,
    pagesPerBook: part.pageCount,
    paperId: part.paperId || (part.role === 'cover' ? item.coverPaperId : item.paperId) || item.paperId,
    jobSizePreset: part.printSettings?.jobSizePreset || 'Custom', jobWidth: part.widthMM, jobHeight: part.heightMM,
    isDoubleSided: !!part.doubleSided,
    colorPrintMode: mono ? 'MONO_K' : 'CMYK',
    cCoverage: part.coverage.c, mCoverage: part.coverage.m, yCoverage: part.coverage.y, kCoverage: part.coverage.k,
    selectedPrinterId: part.printerId || item.selectedPrinterId,
    cutsPerSheetOverride: part.cutsPerSheet,
    printerAllocations: part.printSettings?.printerAllocations || [{
      ...item.printerAllocations[0],
      printer_id: part.printerId || item.selectedPrinterId,
      allocated_pages: Math.ceil(part.pageCount / (part.doubleSided ? 2 : 1)) * item.printVolume,
      color_mode: mono ? 'MONO_K' : 'CMYK', is_double_sided: !!part.doubleSided,
      color_channels: (mono ? ['K'] : ['C', 'M', 'Y', 'K']).map(channel => ({ channel_name: channel, density_pct: part.coverage[channel.toLowerCase() as keyof ArtworkPart['coverage']], is_spot_color: false })),
    }],
    activeModules: { ...item.activeModules, postPressMachinery: false, finishingMaterials: false, laborAndSetup: false, packagingDelivery: false },
    useOffcutRebate: false,
  };
}

/** Existing margin/discount and unit rounding, applied once to the combined job. */
export function commercialTotals(netCost: number, laborCost: number, packagingDeliveryCost: number, quantity: number, margin: number, discount: number) {
  const commercialBaseCost = netCost + laborCost + packagingDeliveryCost;
  const marginDec = Math.min(0.99, Math.max(0, Number(margin) / 100));
  const baseSellingPrice = Math.round(commercialBaseCost / (1.0 - marginDec));
  const discountAmt = Math.round(baseSellingPrice * (Number(discount) / 100));
  const sellingPrice = baseSellingPrice - discountAmt;
  return { baseSellingPrice, discountAmt, sellingPrice, unitPrice: Math.round(sellingPrice / Math.max(1, quantity)), unitCost: Math.round(netCost / Math.max(1, quantity)), profit: sellingPrice - commercialBaseCost, marginPercent: sellingPrice > 0 ? ((sellingPrice - commercialBaseCost) / sellingPrice) * 100 : 0 };
}

const FILE_FIELDS: (keyof QuotationItem)[] = ['paperId', 'jobSizePreset', 'jobWidth', 'jobHeight', 'isDoubleSided', 'colorPrintMode', 'coverageMode', 'avgCoverage', 'cCoverage', 'mCoverage', 'yCoverage', 'kCoverage', 'selectedPrinterId', 'selectedInkSet', 'printerAllocations', 'useSpoilage', 'spoilagePercent', 'cutsPerSheetOverride', 'parentSheetSize', 'selectedPaperName', 'impositionSummary'];

/** Route legacy editor patches without allowing source/page replacement. */
export function patchArtworkEditor(item: QuotationItem, part: ArtworkPart, patch: Partial<QuotationItem>): Partial<QuotationItem> {
  const filePatch: Partial<QuotationItem> = {};
  const jobPatch = { ...patch };
  for (const key of FILE_FIELDS) {
    if (key in patch) Object.assign(filePatch, { [key]: patch[key] });
    delete jobPatch[key];
  }
  for (const key of ['pagesPerBook', 'includeCover', 'coverPagesCount', 'artworkUrl', 'fileName', 'fileSize', 'mimeType', 'batchFiles', 'preflightData', 'artworkParts'] as const) delete jobPatch[key];
  const editor = { ...itemForArtworkPart(item, part), ...filePatch };
  if (filePatch.printerAllocations) {
    editor.selectedPrinterId = filePatch.printerAllocations[0]?.printer_id || editor.selectedPrinterId;
    editor.isDoubleSided = filePatch.printerAllocations.some(a => a.is_double_sided);
    const channels = filePatch.printerAllocations[0]?.color_channels || [];
    for (const [channel,key] of [['C','cCoverage'],['M','mCoverage'],['Y','yCoverage'],['K','kCoverage']] as const) { const value = channels.find(c => c.channel_name === channel)?.density_pct; if (value !== undefined) editor[key] = value; }
    editor.colorPrintMode = filePatch.printerAllocations.length > 0 && filePatch.printerAllocations.every(a => a.color_mode === 'MONO_K') ? 'MONO_K' : 'CMYK';
  }
  const changed: ArtworkPart = { ...part, printSettings: { ...part.printSettings, ...filePatch }, paperId: editor.paperId, paperName: editor.selectedPaperName || part.paperName, widthMM: editor.jobWidth, heightMM: editor.jobHeight, doubleSided: editor.isDoubleSided, colorMode: editor.colorPrintMode, printerId: editor.selectedPrinterId, cutsPerSheet: editor.cutsPerSheetOverride, coverage: { c: editor.cCoverage, m: editor.mCoverage, y: editor.yCoverage, k: editor.kCoverage } };
  return { ...jobPatch, artworkParts: item.artworkParts!.map(p => p.role === part.role ? changed : p) };
}

export function artworkEditorItem(item: QuotationItem, part: ArtworkPart): QuotationItem {
  return { ...itemForArtworkPart(item, part), activeModules: item.activeModules, artworkUrl: part.source.url, fileName: part.source.name, fileSize: part.source.size, mimeType: part.source.mimeType, batchFiles: undefined, isBatchPhoto: false, photoCount: undefined, preflightData: undefined };
}
