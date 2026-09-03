/**
 * Order Data Normalizer Utility
 * Maps backend / persistent order data structures into normalized ItemSpecConfigurator form state
 */

export interface NormalizedFormItem {
  id: string;
  name: string;
  quantity: number;
  jobWidth: number;
  jobHeight: number;
  paperSize: string;
  paperId: string;
  colorMode: string;
  colorPrintMode: 'COLOR_CMYK' | 'MONO_K';
  printerId: string;
  bindingMethod: string;
  coating: string;
  pagesPerBook: number;
  colorPages: number;
  bwPages: number;
  kCoverage: number;
  cCoverage: number;
  mCoverage: number;
  yCoverage: number;
  inkCoverage: number;
  unitPrice: number;
  totalPrice: number;
  targetMarginPercent: number;
  profitMargin: number;
  specs?: any;
  customFinishingOptions?: any[];
  artwork?: {
    file_url: string;
    file_name: string;
    file_size_bytes?: number;
    preview_thumbnail_url?: string;
    page_count?: number;
  };
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export function mapOrderToFormSpecs(order: any, inventory: any[] = [], equipment: any[] = []): NormalizedFormItem[] {
  if (!order) return [];

  const defaultPaper = inventory.length > 0 ? inventory[0].id : 'paper-a4-plain-70g';
  const defaultPrinter = equipment.length > 0 ? equipment[0].id : 'KM-C6085';

  if (Array.isArray(order.items) && order.items.length > 0) {
    // Filter out ghost items (e.g. standalone parent sheets or raw machinery equipment lines)
    const validItems = order.items.filter((it: any) => {
      const itName = it.name || it.item_name || it.job_name || '';
      const isParentSheet = itName.includes('(Parent Sheets)') || itName.includes('ແຜ່ນແມ່') || it.is_parent_sheet === true;
      const isMachineryRaw = equipment.some(e => e.id === it.id && itName.includes(e.name));
      return !isParentSheet && !isMachineryRaw;
    });

    const targetList = validItems.length > 0 ? validItems : order.items;

    return targetList.map((it: any, idx: number) => {
      const specs = it.specs || it.spec_details || it.spec || {};
      const qty = Number(it.quantity || it.quantity_required || it.printVolume || 1);
      const width = Number(it.jobWidth || it.job_width || it.width_mm || it.unfolded_width_mm || specs.width || specs.jobWidth || 210);
      const height = Number(it.jobHeight || it.job_height || it.height_mm || it.unfolded_height_mm || specs.height || specs.jobHeight || 297);
      
      const paper = it.paperId || it.paperSku || it.paper_sku || specs.paper_sku || specs.paperId || specs.paper || defaultPaper;
      const printer = it.printerId || it.printer || it.printer_asset_id || specs.printerId || specs.printer_asset_id || defaultPrinter;
      
      const colorPrintMode = (it.colorPrintMode || it.color_mode || specs.color_mode) === 'MONO_K' || (it.colorMode || specs.colorMode) === 'Monochrome' ? 'MONO_K' : 'COLOR_CMYK';
      const colorMode = colorPrintMode === 'MONO_K' ? 'Monochrome' : 'Color CMYK';

      const binding = it.bindingMethod || it.binding_type || it.binding || specs.binding || specs.binding_type || 'none';
      const coating = it.coating || it.lamination || it.lamination_type || specs.lamination || specs.lamination_type || 'none';

      const kCov = Number(it.kCoverage ?? it.ink_coverage_k_percent ?? specs.kCoverage ?? specs.ink_coverage_k_percent ?? (colorPrintMode === 'MONO_K' ? 10 : 5));
      const cCov = Number(it.cCoverage ?? specs.cCoverage ?? (colorPrintMode === 'MONO_K' ? 0 : 5));
      const mCov = Number(it.mCoverage ?? specs.mCoverage ?? (colorPrintMode === 'MONO_K' ? 0 : 5));
      const yCov = Number(it.yCoverage ?? specs.yCoverage ?? (colorPrintMode === 'MONO_K' ? 0 : 5));

      const unitPrice = Number(it.unitPrice ?? it.unit_price ?? it.unit_price_snapshot ?? it.unit_price_lak ?? (qty > 0 ? (Number(it.totalPrice || it.total_price || 0) / qty) : 0));
      const totalPrice = Number(it.totalPrice ?? it.total_price ?? it.total_price_lak ?? (unitPrice * qty));
      const margin = Number(it.targetMarginPercent ?? it.profitMargin ?? it.target_margin_percent ?? 35);

      const itArtworkUrl = it.artwork?.file_url || it.artworkUrl || it.artwork_url || it.fileUrl || it.file_url || it.cover_file_url || it.inner_file_url || order.artworkUrl || order.artwork_url || order.artworkLink || '';
      const itArtworkFileName = it.artwork?.file_name || it.artworkFileName || it.artwork_file_name || it.fileName || it.file_name || (itArtworkUrl ? itArtworkUrl.split('/').pop()?.split('?')[0] : '');
      const itArtworkFileSize = it.artwork?.file_size_bytes || it.artworkFileSize || it.artwork_file_size || it.fileSize || it.file_size || 0;
      const itPageCount = Number(it.pagesPerBook || it.pages || it.page_count || specs.pages || 1);

      return {
        id: it.id || `item-${idx + 1}`,
        name: it.name || it.item_name || it.job_name || `Job #${idx + 1}`,
        quantity: qty,
        jobWidth: width,
        jobHeight: height,
        paperSize: it.paperSize || it.paper_size || specs.size || 'A4',
        paperId: paper,
        colorMode: colorMode,
        colorPrintMode: colorPrintMode,
        printerId: printer,
        bindingMethod: binding,
        coating: coating,
        pagesPerBook: itPageCount,
        colorPages: Number(it.colorPages || it.color_pages || (colorPrintMode === 'COLOR_CMYK' ? 1 : 0)),
        bwPages: Number(it.bwPages || it.mono_pages || (colorPrintMode === 'MONO_K' ? 1 : 0)),
        kCoverage: kCov,
        cCoverage: cCov,
        mCoverage: mCov,
        yCoverage: yCov,
        inkCoverage: kCov + cCov + mCov + yCov,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        targetMarginPercent: margin,
        profitMargin: margin,
        specs: specs,
        customFinishingOptions: it.customFinishingOptions || it.custom_finishing_options || specs.custom_finishing_options || [],
        fileUrl: itArtworkUrl,
        fileName: itArtworkFileName,
        fileSize: itArtworkFileSize,
        artwork: {
          file_url: itArtworkUrl,
          file_name: itArtworkFileName,
          file_size_bytes: itArtworkFileSize,
          preview_thumbnail_url: itArtworkUrl,
          page_count: itPageCount
        }
      };
    });
  }

  // Fallback single item
  const specs = order.specs || order.spec_details || {};
  const qty = Number(order.quantity || 1);
  const total = Number(order.totalPriceCharged || order.totalAmount || order.total_amount_lak || order.total_price || 15000);
  const fallbackArtworkUrl = order.artworkUrl || order.artwork_url || order.artworkLink || order.googleDriveLink || '';
  const fallbackArtworkFileName = order.artworkFileName || order.artwork_file_name || (fallbackArtworkUrl ? fallbackArtworkUrl.split('/').pop()?.split('?')[0] : '');
  const fallbackArtworkFileSize = order.artworkFileSize || order.artwork_file_size || 0;
  const fallbackPages = Number(specs.pages || 1);

  return [{
    id: 'item-1',
    name: order.jobName || order.product_name || 'ງານພິມດິຈິຕອນ (Print Job)',
    quantity: qty,
    jobWidth: Number(specs.width || 210),
    jobHeight: Number(specs.height || 297),
    paperSize: specs.size || 'A4',
    paperId: defaultPaper,
    colorMode: 'Color CMYK',
    colorPrintMode: 'COLOR_CMYK',
    printerId: defaultPrinter,
    bindingMethod: specs.binding || 'none',
    coating: specs.lamination || 'none',
    pagesPerBook: fallbackPages,
    colorPages: 1,
    bwPages: 0,
    kCoverage: 5,
    cCoverage: 5,
    mCoverage: 5,
    yCoverage: 5,
    inkCoverage: 20,
    unitPrice: qty > 0 ? (total / qty) : total,
    totalPrice: total,
    targetMarginPercent: 35,
    profitMargin: 35,
    specs: specs,
    fileUrl: fallbackArtworkUrl,
    fileName: fallbackArtworkFileName,
    fileSize: fallbackArtworkFileSize,
    artwork: {
      file_url: fallbackArtworkUrl,
      file_name: fallbackArtworkFileName,
      file_size_bytes: fallbackArtworkFileSize,
      preview_thumbnail_url: fallbackArtworkUrl,
      page_count: fallbackPages
    }
  }];
}
