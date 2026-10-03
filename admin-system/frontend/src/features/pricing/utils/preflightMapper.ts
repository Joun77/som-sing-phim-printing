import type { ArtworkPart, PreflightResult } from '../../orders/types';

function sourcePart(role: ArtworkPart['role'], result: PreflightResult, paperId?: string): ArtworkPart {
  return {
    role,
    source: { url: result.file_url || '', fileId: result.file_id, name: result.file_name, size: result.file_size || 0, mimeType: result.file_type === 'IMAGE' ? 'image/*' : 'application/pdf' },
    pageCount: result.total_pages,
    paperId,
    paperSize: result.target_paper_size,
    widthMM: result.target_width_mm || 210,
    heightMM: result.target_height_mm || 297,
    colorMode: result.color_mode || 'CMYK',
    coverage: { c: result.avg_cov_c, m: result.avg_cov_m, y: result.avg_cov_y, k: result.avg_cov_k },
    thumbnailUrl: result.preview_thumbnail_url,
  };
}

export const mapPreflightToSpecs = (pfResult: PreflightResult, itemsLength: number) => {
  const rawName = pfResult.file_name ? pfResult.file_name.replace(/\.[^/.]+$/, '') : `ລາຍການທີ ${itemsLength + 1}`;
  const cleanName = rawName.replace(/_+/g, ' ');

  const isMonoOnly = (pfResult.color_pages_count || 0) === 0 && (pfResult.mono_pages_count || 0) > 0;
  const detectedColorMode = isMonoOnly ? 'MONO_K' : 'CMYK';

  const covC = pfResult.color_pages_avg_c !== undefined ? pfResult.color_pages_avg_c : (pfResult.avg_cov_c ?? 0);
  const covM = pfResult.color_pages_avg_m !== undefined ? pfResult.color_pages_avg_m : (pfResult.avg_cov_m ?? 0);
  const covY = pfResult.color_pages_avg_y !== undefined ? pfResult.color_pages_avg_y : (pfResult.avg_cov_y ?? 0);
  const covK = (pfResult.color_pages_count || 0) > 0
    ? (pfResult.color_pages_avg_k !== undefined ? pfResult.color_pages_avg_k : (pfResult.avg_cov_k ?? 0))
    : (pfResult.mono_pages_avg_k !== undefined ? pfResult.mono_pages_avg_k : (pfResult.avg_cov_k ?? 0));

  const isSplit = Boolean(pfResult.is_split_cover);
  const innerRes = pfResult.inner_result;
  const coverRes = pfResult.cover_result;

  const totalPages = isSplit ? ((innerRes?.total_pages || 0) + (coverRes?.total_pages || 4)) : (pfResult.total_pages || 1);

  const isBatch = Boolean((pfResult as any)?.is_batch_photo);
  const batchImp = (pfResult as any)?.batch_imposition;

  return {
    jobName: cleanName,
    artworkParts: isSplit && coverRes && innerRes ? [{ ...sourcePart('cover', coverRes, pfResult.cover_paper_id), cutsPerSheet: pfResult.cover_cuts_per_sheet_override }, { ...sourcePart('inner', innerRes, pfResult.selected_paper_id), cutsPerSheet: pfResult.cuts_per_sheet_override }] : undefined,
    fileName: innerRes?.file_name || pfResult.file_name,
    fileSize: innerRes?.file_size || pfResult.file_size,
    previewThumbnailUrl: innerRes?.preview_thumbnail_url || pfResult.preview_thumbnail_url,
    artworkUrl: pfResult.file_url,
    coverFileName: pfResult.cover_file_name || coverRes?.file_name,
    coverArtworkUrl: pfResult.cover_file_url || coverRes?.file_url,
    includeCover: isSplit,
    coverPagesCount: coverRes?.total_pages || 4,
    coverPrintMode: coverRes?.color_mode === 'MONO_K' ? 'MONO_K' : 'CMYK_1_SIDE',
    pageCount: totalPages,
    orderQuantity: 1,
    photoCount: isBatch ? totalPages : undefined,
    is_batch_photo: isBatch,
    printVolume: 1,
    colorPages: pfResult.color_pages_count || 0,
    monoPages: pfResult.mono_pages_count || 0,
    monoPagesAvgK: pfResult.mono_pages_avg_k || covK,
    jobWidth: pfResult.target_width_mm || 210,
    jobHeight: pfResult.target_height_mm || 297,
    suggestedPaper: pfResult.target_paper_size || 'A4',
    paperId: pfResult.selected_paper_id,
    coverPaperId: pfResult.cover_paper_id,
    cutsPerSheetOverride: pfResult.cuts_per_sheet_override !== undefined ? pfResult.cuts_per_sheet_override : (batchImp?.cuts_per_sheet ? Number(batchImp.cuts_per_sheet) : undefined),
    coverCutsPerSheetOverride: pfResult.cover_cuts_per_sheet_override,
    impositionSummary: pfResult.imposition_summary || batchImp?.summary_lao,
    colorPrintMode: detectedColorMode,
    cCoverage: covC,
    mCoverage: covM,
    yCoverage: covY,
    kCoverage: covK,
    preflightData: pfResult,
    batchFiles: (pfResult as any)?.batch_files || [],
    mimeType: isBatch ? 'image/jpeg' : (pfResult.file_name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
  };
};

export const mapQuotationItemToOrderItem = (item: any, idx: number, calc?: any, paperItem?: any, equipment: any[] = []) => {
  const parts: ArtworkPart[] | undefined = item.artworkParts ? structuredClone(item.artworkParts) : undefined;
  const batchFiles = item.batchFiles || item.preflightData?.batch_files;
  const batchSnapshot = batchFiles?.length ? structuredClone(batchFiles) : undefined;
  const innerPart = parts?.find(part => part.role === 'inner');
  const coverPart = parts?.find(part => part.role === 'cover');
  const innerCost = calc?.partCosts?.find((part: { role: string }) => part.role === 'inner');
  const cuttingTickets = parts?.map(part => {
    const cost = calc?.partCosts?.find((priced: { role: string }) => priced.role === part.role);
    return { role: part.role, paper_id: part.paperId, total_parent_sheets: cost?.parentSheets, cuts_per_parent: cost?.cutsPerSheet, wasted_sheets: cost?.wastedSheets, paper_unit_cost: cost?.paperUnitCost };
  });
  return {
    artworkParts: parts,
    id: item.id || `job-item-${idx + 1}`,
    name: item.name || item.jobName || `Job #${idx + 1}`,
    item_name: item.name || item.jobName,
    quantity: item.printVolume || 1,
    unitCost: Math.round(calc?.unitCost || 0),
    unit_cost_lak: Math.round(calc?.unitCost || 0),
    unit_price_lak: Math.round(calc?.unitPrice || 0),
    total_price_lak: Math.round(calc?.sellingPrice || 0),
    page_count: innerPart?.pageCount || item.pagesPerBook || item.pageCount || 1,
    paper_size: item.jobSizePreset || item.suggestedPaper || 'A4',
    cover_paper_id: coverPart?.paperId || item.coverPaperId,
    inner_paper_id: innerPart?.paperId || item.paperId,
    cover_file_url: item.includeCover ? (item.coverArtworkUrl || item.preflightData?.cover_file_url) : undefined,
    cover_file_name: item.includeCover ? (item.coverFileName || 'cover.pdf') : undefined,
    inner_file_url: item.artworkUrl,
    artworkUrl: item.artworkUrl,
    artwork_url: item.artworkUrl,
    artworkFileName: item.fileName,
    artwork_file_name: item.fileName,
    artworkFileSize: item.fileSize,
    artwork_file_size: item.fileSize,
    artwork: {
      file_url: item.artworkUrl || '',
      file_name: item.fileName || (item.artworkUrl ? item.artworkUrl.split('/').pop()?.split('?')[0] : ''),
      file_size_bytes: item.fileSize || 0,
      preview_thumbnail_url: item.previewThumbnailUrl || item.preflightData?.preview_thumbnail_url || '',
      page_count: innerPart?.pageCount || item.pagesPerBook || item.pageCount || 1,
      batch_files: batchSnapshot,
      artwork_files: batchSnapshot,
    },
    batch_files: batchSnapshot,
    drive_link: item.artworkUrl,
    avg_cov_c: item.cCoverage || 0,
    avg_cov_m: item.mCoverage || 0,
    avg_cov_y: item.yCoverage || 0,
    avg_cov_k: item.kCoverage || 0,
    specifications: {
      batch_files: structuredClone(batchSnapshot),
      multi_image_print: { enabled: !!item.multipleImagesPerSheet, images_per_sheet: item.imagesPerSheet || 4 },
      artwork_parts: parts,
      paper_cutting_tickets: cuttingTickets,
      price_components: calc?.partCosts ? { parts: calc.partCosts, shared: calc.sharedCosts } : undefined,
      part_pricing_status: parts?.length ? (calc?.partCosts ? 'separate_parts' : 'not_calculated') : undefined,
      pages: innerPart?.pageCount || item.pagesPerBook || item.pageCount || 1,
      paper_id: item.paperId,
      paper_name: paperItem?.name || 'Standard Paper',
      paper_cutting_ticket: paperItem ? {
        parent_paper_id: item.paperId,
        parent_paper_name: paperItem.name,
        total_parent_sheets: (innerCost?.parentSheets ?? calc?.totalParentSheets) || 1,
        cuts_per_parent: (innerCost?.cutsPerSheet ?? calc?.cutsPerSheet) || 1,
        wasted_sheets: (innerCost?.wastedSheets ?? calc?.wastedSheets) || 0,
        paper_unit_cost: (innerCost?.paperUnitCost ?? calc?.paperUnitCost) || 0
      } : null,
      materials: {
        paper: paperItem ? {
          id: item.paperId,
          name: paperItem.name,
          total_parent_sheets: (innerCost?.parentSheets ?? calc?.totalParentSheets) || 1,
          unit_cost: (innerCost?.paperUnitCost ?? calc?.paperUnitCost) || 0
        } : null,
        machinery: (item.selectedPostPressIds || []).map((machId: any) => {
          const mach = equipment.find((e: any) => e.id === machId);
          const rate = Number((mach as any)?.costPerPage) || Number((mach as any)?.calculatedCostPerPage) || 300;
          return {
            id: machId,
            name: mach?.name || machId,
            quantity: item.printVolume,
            unit_cost: rate
          };
        })
      },
      color_mode: item.colorPrintMode || 'CMYK',
      is_double_sided: item.isDoubleSided,
      printer_allocations: item.printerAllocations,
      file_name: item.fileName,
      artwork_url: item.artworkUrl,
      file_size: item.fileSize
    },
    specs: {
      commercial_cost_snapshot: calc ? { net_cost_lak: calc.netCost, labor_cost_lak: calc.laborCost, packaging_delivery_cost_lak: calc.packagingDeliveryCost, commercial_cost_lak: calc.netCost + calc.laborCost + calc.packagingDeliveryCost } : undefined,
      batch_files: structuredClone(batchSnapshot),
      multi_image_print: { enabled: !!item.multipleImagesPerSheet, images_per_sheet: item.imagesPerSheet || 4 },
      artwork_parts: parts,
      paper_cutting_tickets: cuttingTickets,
      price_components: calc?.partCosts ? { parts: calc.partCosts, shared: calc.sharedCosts } : undefined,
      part_pricing_status: parts?.length ? (calc?.partCosts ? 'separate_parts' : 'not_calculated') : undefined,
      pages: innerPart?.pageCount || item.pagesPerBook || item.pageCount || 1,
      paperName: paperItem?.name || 'Standard Paper',
      colorMode: item.colorPrintMode || 'CMYK',
      isDoubleSided: item.isDoubleSided,
      printerAllocations: item.printerAllocations,
      fileName: item.fileName,
      artworkUrl: item.artworkUrl,
      fileSize: item.fileSize,
      paper_cutting_ticket: paperItem ? {
        parent_paper_id: item.paperId,
        parent_paper_name: paperItem.name,
        total_parent_sheets: (innerCost?.parentSheets ?? calc?.totalParentSheets) || 1,
        cuts_per_parent: (innerCost?.cutsPerSheet ?? calc?.cutsPerSheet) || 1,
        wasted_sheets: (innerCost?.wastedSheets ?? calc?.wastedSheets) || 0,
        paper_unit_cost: (innerCost?.paperUnitCost ?? calc?.paperUnitCost) || 0
      } : null,
      materials: {
        paper: paperItem ? {
          id: item.paperId,
          name: paperItem.name,
          total_parent_sheets: (innerCost?.parentSheets ?? calc?.totalParentSheets) || 1,
          unit_cost: (innerCost?.paperUnitCost ?? calc?.paperUnitCost) || 0
        } : null,
        machinery: (item.selectedPostPressIds || []).map((machId: any) => {
          const mach = equipment.find((e: any) => e.id === machId);
          const rate = Number((mach as any)?.costPerPage) || Number((mach as any)?.calculatedCostPerPage) || 300;
          return {
            id: machId,
            name: mach?.name || machId,
            quantity: item.printVolume,
            unit_cost: rate
          };
        })
      }
    }
  };
};
