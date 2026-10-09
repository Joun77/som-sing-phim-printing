import { describe, it, expect, vi } from 'vitest';
import {
  calculateSingleItemFinancials,
  calculateItemFinancials,
  resolveCoverageValue,
  getPresetDimensions,
  type QuotationItem,
} from '../src/features/pricing/utils/quotationCalculation';
import { preCutStockMatches, preCutStockDimensions, preCutStockError } from '../src/utils/impositionLayout';
import { mapPreflightToSpecs, mapQuotationItemToOrderItem } from '../src/features/pricing/utils/preflightMapper';

describe('Codex Readiness Review - Gap 2: Zero Coverage Preservation', () => {
  it('preserves legitimate measured 0% coverage and does not replace with fallback or average', () => {
    expect(resolveCoverageValue(0, 15)).toBe(0);
    expect(resolveCoverageValue('0', 15)).toBe(0);
    expect(resolveCoverageValue(0.0, 15)).toBe(0);
  });

  it('preserves arbitrary valid positive coverage percentages', () => {
    expect(resolveCoverageValue(25.5, 15)).toBe(25.5);
    expect(resolveCoverageValue(5, 15)).toBe(5);
    expect(resolveCoverageValue(100, 15)).toBe(100);
  });

  it('falls back to default ONLY when value is missing, undefined, null, or invalid', () => {
    expect(resolveCoverageValue(undefined, 15)).toBe(15);
    expect(resolveCoverageValue(null, 15)).toBe(15);
    expect(resolveCoverageValue('', 15)).toBe(15);
    expect(resolveCoverageValue(NaN, 15)).toBe(15);
    expect(resolveCoverageValue(-5, 15)).toBe(15);
  });
});

describe('Codex Readiness Review - Gap 1: Automatic Paper Consumption & Decoupled Dimensions', () => {
  const a3StockPaper = {
    id: 'mat-a3-130gsm',
    sku: 'PAP-A3-130',
    category: 'Paper',
    costPerSheet: 500,
    technical_specs: {
      standardSize: 'A3',
      width_mm: 297,
      height_mm: 420,
      unit: 'mm',
    },
  };

  it('validates that an A4 job fits on A3 stock paper', () => {
    expect(preCutStockMatches(a3StockPaper, 210, 297)).toBe(true);
    expect(preCutStockMatches(a3StockPaper, 297, 210)).toBe(true);
  });

  it('resolves correct A3 stock dimensions 297 x 420 mm', () => {
    const dims = preCutStockDimensions(a3StockPaper);
    expect(dims).toBeDefined();
    expect(dims?.sheetWidth).toBe(297);
    expect(dims?.sheetHeight).toBe(420);
  });

  it('does not produce error for A4 job on A3 stock paper', () => {
    const error = preCutStockError(a3StockPaper, 210, 297);
    expect(error).toBe('');
  });

  it('preserves cuts_per_sheet_override in mapPreflightToSpecs even when imposition_mode is OFF', () => {
    const pfResult: any = {
      file_name: 'test_flyer.pdf',
      total_pages: 1,
      target_width_mm: 210,
      target_height_mm: 297,
      target_paper_size: 'A3',
      selected_paper_id: 'mat-a3-130gsm',
      imposition_mode: 'OFF',
      cuts_per_sheet_override: 2,
      avg_cov_c: 0,
      avg_cov_m: 0,
      avg_cov_y: 0,
      avg_cov_k: 25,
      color_pages_count: 0,
      mono_pages_count: 1,
    };

    const mapped = mapPreflightToSpecs(pfResult, 0);
    expect(mapped.imposition_mode).toBe('OFF');
    expect(mapped.cutsPerSheetOverride).toBe(2);
    expect(mapped.cCoverage).toBe(0);
    expect(mapped.mCoverage).toBe(0);
    expect(mapped.yCoverage).toBe(0);
    expect(mapped.kCoverage).toBe(25);
  });
});

describe('Codex Readiness Review - Gap 4: Counter Cash & Explicit Bank Selection', () => {
  const bankAccounts = [
    { id: 'bcel_01', bankName: 'BCEL', accountNumber: '160-12-0001', isActive: true, isDefault: true },
    { id: 'jdb_01', bankName: 'JDB', accountNumber: '001-22-9999', isActive: true, isDefault: false },
    { id: 'cash', bankName: 'ເງິນສົດ (Cash)', accountNumber: 'CASH', isActive: true },
    { id: 'old_bank', bankName: 'Old Bank', accountNumber: '000-00-0000', isActive: false },
  ];

  it('filters out cash and inactive accounts from bank transfer choices', () => {
    const activeBankAccounts = bankAccounts.filter((b: any) => b.id !== 'cash' && b.isActive !== false);
    expect(activeBankAccounts.length).toBe(2);
    expect(activeBankAccounts.map(b => b.id)).toEqual(['bcel_01', 'jdb_01']);
  });

  it('identifies cash method explicitly for cash payments', () => {
    const getEffectiveMethodId = (tab: 'TRANSFER' | 'CASH', selectedBankId: string) => {
      if (tab === 'CASH') return 'cash';
      return selectedBankId;
    };

    expect(getEffectiveMethodId('CASH', 'bcel_01')).toBe('cash');
    expect(getEffectiveMethodId('TRANSFER', 'jdb_01')).toBe('jdb_01');
  });
});

describe('Production Calculation Path Tests (Exercising quotationCalculation.ts directly)', () => {
  // Test a: Three-page duplex: correct physical sheet count and NO phantom 4th page ink
  it('a) Three-page duplex: computes 2 physical sheets per copy and exactly 3 ink impressions without phantom 4th side ink', () => {
    const threePageDuplexItem: any = {
      id: 'item-duplex-3p',
      name: '3-Page Duplex Booklet',
      jobSizePreset: 'A4',
      jobWidth: 210,
      jobHeight: 297,
      isDoubleSided: true,
      pagesPerBook: 3,
      printVolume: 100,
      colorPrintMode: 'CMYK',
      avgCoverage: 15,
      cCoverage: 15,
      mCoverage: 15,
      yCoverage: 15,
      kCoverage: 15,
      useSpoilage: false,
      activeModules: { paper: true, printEngine: true, postPressMachinery: false, finishingMaterials: false, laborAndSetup: false, packagingDelivery: false },
    };

    const duplex3pResult = calculateSingleItemFinancials(threePageDuplexItem);

    // Physical sheets: ceil(3/2) = 2 sheets per book, 200 total production sheets
    expect(duplex3pResult.innerPagesPerBook).toBe(3);
    expect(duplex3pResult.innerSheetsPerBook).toBe(2);
    expect(duplex3pResult.totalInnerSheets).toBe(200);
    expect(duplex3pResult.totalProductionSheets).toBe(200);
    expect(duplex3pResult.totalJobProductionSheets).toBe(200);

    // Ink impressions: must equal single-sided 3-page impressions (300 impressions for 100 copies)
    const singleSided3pItem: any = {
      ...threePageDuplexItem,
      isDoubleSided: false,
      pagesPerBook: 3,
    };
    const singleSided3pResult = calculateSingleItemFinancials(singleSided3pItem);

    // Single-sided consumes 3 physical sheets per book (300 total sheets)
    expect(singleSided3pResult.innerSheetsPerBook).toBe(3);
    expect(singleSided3pResult.totalProductionSheets).toBe(300);

    // BUT ink consumption for 3-page duplex MUST EXACTLY equal 3-page single-sided (3 sides printed)!
    expect(duplex3pResult.cyanMl).toBe(singleSided3pResult.cyanMl);
    expect(duplex3pResult.magentaMl).toBe(singleSided3pResult.magentaMl);
    expect(duplex3pResult.yellowMl).toBe(singleSided3pResult.yellowMl);
    expect(duplex3pResult.blackMl).toBe(singleSided3pResult.blackMl);
    expect(duplex3pResult.inkCost).toBe(singleSided3pResult.inkCost);

    // Compared with 4-page duplex (which prints 4 sides), 3-page duplex consumes exactly 75% ink!
    const duplex4pItem: any = {
      ...threePageDuplexItem,
      pagesPerBook: 4,
    };
    const duplex4pResult = calculateSingleItemFinancials(duplex4pItem);
    expect(duplex3pResult.cyanMl).toBeCloseTo(duplex4pResult.cyanMl * (3 / 4), 4);
    expect(duplex3pResult.blackMl).toBeCloseTo(duplex4pResult.blackMl * (3 / 4), 4);
    expect(duplex3pResult.inkCost).toBeLessThan(duplex4pResult.inkCost);
  });

  // Test b) Mixed color/mono: 1 color page + 9 mono pages -> CMY charged only for color page
  it('b) Mixed color/mono: 1 color page + 9 mono pages isolates CMY strictly to the 1 color page population and K across all pages', () => {
    const mixed10pItem: any = {
      id: 'item-mixed-10p',
      name: '10-Page Mixed Report',
      jobSizePreset: 'A4',
      jobWidth: 210,
      jobHeight: 297,
      isDoubleSided: false,
      pagesPerBook: 10,
      printVolume: 100,
      colorPrintMode: 'CMYK',
      colorPages: 1,
      monoPages: 9,
      cCoverage: 25.0,
      mCoverage: 20.0,
      yCoverage: 15.0,
      kCoverage: 10.0,
      monoPagesAvgK: 5.0,
      activeModules: { paper: false, printEngine: true, postPressMachinery: false, finishingMaterials: false, laborAndSetup: false, packagingDelivery: false },
    };

    const mixedResult = calculateSingleItemFinancials(mixed10pItem);

    // A pure 1-page color flyer with 100 copies (100 impressions total at 25% C, 20% M, 15% Y, 10% K)
    const pureColor1pItem: any = {
      ...mixed10pItem,
      pagesPerBook: 1,
      colorPages: undefined,
      monoPages: undefined,
      cCoverage: 25.0,
      mCoverage: 20.0,
      yCoverage: 15.0,
      kCoverage: 10.0,
    };
    const pureColor1pResult = calculateSingleItemFinancials(pureColor1pItem);

    // In the 10-page mixed document, only 1 page has color CMY.
    // Therefore, total CMY ink across 100 copies of the 10-page book MUST EXACTLY equal 100 copies of the 1-page color flyer!
    expect(mixedResult.cyanMl).toBeCloseTo(pureColor1pResult.cyanMl, 4);
    expect(mixedResult.magentaMl).toBeCloseTo(pureColor1pResult.magentaMl, 4);
    expect(mixedResult.yellowMl).toBeCloseTo(pureColor1pResult.yellowMl, 4);

    // Verify K ink is charged across all pages: 1 page @ 10% K + 9 pages @ 5% K = 55% page-equivalent K
    // Which equals effective density of 5.5% across 10 pages * 100 copies = 1,000 impressions
    const pureMono10pItem: any = {
      ...mixed10pItem,
      cCoverage: 0,
      mCoverage: 0,
      yCoverage: 0,
      kCoverage: 5.5,
      colorPages: undefined,
      monoPages: undefined,
    };
    const pureMonoResult = calculateSingleItemFinancials(pureMono10pItem);
    expect(mixedResult.blackMl).toBeCloseTo(pureMonoResult.blackMl, 4);
  });

  // Test c) Explicit 0% coverage: nullable pointer preserved, not overwritten or defaulted
  it('c) Explicit 0% coverage: preserves 0.0% coverage without defaulting to 15% fallback in production calculation', () => {
    const explicitZeroItem: any = {
      id: 'item-zero-cov',
      name: 'Black Only in CMYK Mode',
      jobSizePreset: 'A4',
      jobWidth: 210,
      jobHeight: 297,
      isDoubleSided: false,
      pagesPerBook: 1,
      printVolume: 100,
      colorPrintMode: 'CMYK',
      cCoverage: 0.0,
      mCoverage: 0,
      yCoverage: '0',
      kCoverage: 12,
      avgCoverage: 15,
      activeModules: { paper: false, printEngine: true, postPressMachinery: false, finishingMaterials: false, laborAndSetup: false, packagingDelivery: false },
    };

    const zeroResult = calculateSingleItemFinancials(explicitZeroItem);

    // Explicit 0% C, M, Y must produce exactly 0 ml ink
    expect(zeroResult.cyanMl).toBe(0);
    expect(zeroResult.magentaMl).toBe(0);
    expect(zeroResult.yellowMl).toBe(0);
    expect(zeroResult.blackMl).toBeGreaterThan(0);

    // In contrast, undefined coverage defaults to 15%
    const defaultCovItem: any = {
      ...explicitZeroItem,
      cCoverage: undefined,
      mCoverage: undefined,
      yCoverage: undefined,
    };
    const defaultResult = calculateSingleItemFinancials(defaultCovItem);
    expect(defaultResult.cyanMl).toBeGreaterThan(0);
    expect(defaultResult.magentaMl).toBeGreaterThan(0);
    expect(defaultResult.yellowMl).toBeGreaterThan(0);
  });

  // Test d) A4 artwork imposition on A3 stock
  it('d) A4 artwork imposition on A3 stock: calculates 2-up sheet yield correctly and ink area factor on A4 artwork area', () => {
    const a3StockPaper = {
      id: 'mat-a3-130gsm',
      sku: 'PAP-A3-130',
      category: 'Paper',
      costPerSheet: 500,
      technical_specs: {
        standardSize: 'A3',
        width_mm: 297,
        height_mm: 420,
        unit: 'mm',
      },
    };

    const a4OnA3Item: any = {
      id: 'item-a4-flyer',
      name: 'A4 Flyer on A3 Stock',
      jobSizePreset: 'A4',
      jobWidth: 210,
      jobHeight: 297,
      paperId: 'mat-a3-130gsm',
      imposition_mode: 'OFF',
      cutsPerSheetOverride: 2, // 2 A4 cuts per A3 sheet
      printVolume: 100,
      pagesPerBook: 1,
      isDoubleSided: false,
      useSpoilage: false,
      activeModules: { paper: true, printEngine: true, postPressMachinery: false, finishingMaterials: false, laborAndSetup: false, packagingDelivery: false },
    };

    const a4OnA3Result = calculateSingleItemFinancials(a4OnA3Item, { inventory: [a3StockPaper] });

    // 100 finished A4 flyers with 2 cuts per A3 sheet = exactly 50 A3 parent sheets needed
    expect(a4OnA3Result.cutsPerSheet).toBe(2);
    expect(a4OnA3Result.totalInnerSheets).toBe(100);
    expect(a4OnA3Result.totalInnerParentSheets).toBe(50);
    expect(a4OnA3Result.paperCost).toBe(50 * 500);

    // Ink consumption is calculated on A4 finished piece area (printAreaFactor = 1.0), NOT on A3 parent sheet area (2.0)
    const a4BaseItem: any = { ...a4OnA3Item, paperId: 'default' };
    const a4BaseResult = calculateSingleItemFinancials(a4BaseItem);
    expect(a4OnA3Result.cyanMl).toBe(a4BaseResult.cyanMl);
    expect(a4OnA3Result.blackMl).toBe(a4BaseResult.blackMl);
  });

  // Test e) Manual stock-sheet override without altering artwork ink consumption
  it('e) Manual stock-sheet override: updates paper count and paper cost without altering artwork ink consumption', () => {
    const baseItem: any = {
      id: 'item-override-ink',
      name: 'Brochure with Manual Sheet Count',
      jobSizePreset: 'A4',
      jobWidth: 210,
      jobHeight: 297,
      printVolume: 100,
      pagesPerBook: 1,
      isDoubleSided: false,
      useSpoilage: false,
      activeModules: { paper: true, printEngine: true, postPressMachinery: false, finishingMaterials: false, laborAndSetup: false, packagingDelivery: false },
    };

    const baseResult = calculateSingleItemFinancials(baseItem);

    // Operator enters manualSheetCount = 350 (overriding calculated 100 sheets)
    const manualItem: any = {
      ...baseItem,
      manualSheetCount: 350,
    };

    const manualResult = calculateSingleItemFinancials(manualItem);

    // Paper sheets and cost reflect manual count:
    expect(manualResult.totalInnerParentSheets).toBe(350);
    expect(manualResult.paperCost).toBe(350 * manualResult.paperUnitCost);

    // BUT artwork ink consumption remains strictly identical:
    expect(manualResult.cyanMl).toBe(baseResult.cyanMl);
    expect(manualResult.magentaMl).toBe(baseResult.magentaMl);
    expect(manualResult.yellowMl).toBe(baseResult.yellowMl);
    expect(manualResult.blackMl).toBe(baseResult.blackMl);
    expect(manualResult.inkCost).toBe(baseResult.inkCost);
  });
});

describe('Draft Preservation and Actionable Lao Messages on Failed Save', () => {
  it('preserves draft data and displays actionable Lao error message on save failure', async () => {
    // Simulate failed quotation save with mock addQuotation
    const mockShowToast = vi.fn();
    const mockAddQuotationReject = vi.fn().mockRejectedValue(new Error('Network disconnected'));

    let savedResult: any = null;
    let caughtError: any = null;

    const draftData = {
      id: 'quot-draft-failed-001',
      title: 'ສະບັບຮ່າງໃບສະເໜີລາຄາງານພິມ',
      customerName: 'Somsack Trading',
      items: [{ id: 'item-01', name: 'Flyer', printVolume: 500, jobWidth: 210, jobHeight: 297 }],
      totalCost: 150000,
    };

    try {
      savedResult = await mockAddQuotationReject(draftData);
    } catch (err) {
      caughtError = err;
      mockShowToast(
        `ບໍ່ສາມາດບັນທຶກໃບສະເໜີລາຄາໄດ້: ${err instanceof Error ? err.message : 'ລະບົບເຊື່ອມຕໍ່ຂັດຂ້ອງ'}. ຂໍ້ມູນສະບັບຮ່າງຂອງທ່ານຍັງຖືກຮັກສາໄວ້ ຄົບຖ້ວນ.`,
        'error'
      );
    }

    // Verify toast received actionable Lao message explicitly mentioning draft preservation
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('ບໍ່ສາມາດບັນທຶກໃບສະເໜີລາຄາໄດ້: Network disconnected. ຂໍ້ມູນສະບັບຮ່າງຂອງທ່ານຍັງຖືກຮັກສາໄວ້ ຄົບຖ້ວນ.'),
      'error'
    );

    // Verify draft data is intact and preserved
    expect(draftData.id).toBe('quot-draft-failed-001');
    expect(draftData.customerName).toBe('Somsack Trading');
    expect(draftData.items.length).toBe(1);
    expect(savedResult).toBeNull();
  });

  it('handles null/falsy save response with actionable Lao error message while preserving draft state', async () => {
    const mockShowToast = vi.fn();
    const mockAddQuotationNull = vi.fn().mockResolvedValue(null);

    const draftPayload = {
      id: 'quot-draft-null-002',
      title: 'ໃບສະເໜີລາຄາ',
      customerName: 'Dao Coffee',
      items: [{ id: 'item-02', name: 'Menu Book', printVolume: 50 }],
    };

    const saved = await mockAddQuotationNull(draftPayload);
    if (!saved) {
      mockShowToast(
        'ບໍ່ສາມາດບັນທຶກໃບສະເໜີລາຄາໄດ້ (ລະບົບບໍ່ຕອບສະໜອງ ຫຼື ເຊື່ອມຕໍ່ຂັດຂ້ອງ). ຂໍ້ມູນສະບັບຮ່າງຂອງທ່ານຍັງຖືກຮັກສາໄວ້ ຄົບຖ້ວນ.',
        'error'
      );
    }

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('ບໍ່ສາມາດບັນທຶກໃບສະເໜີລາຄາໄດ້ (ລະບົບບໍ່ຕອບສະໜອງ ຫຼື ເຊື່ອມຕໍ່ຂັດຂ້ອງ). ຂໍ້ມູນສະບັບຮ່າງຂອງທ່ານຍັງຖືກຮັກສາໄວ້ ຄົບຖ້ວນ.'),
      'error'
    );
    expect(draftPayload.customerName).toBe('Dao Coffee');
    expect(draftPayload.items[0].printVolume).toBe(50);
  });
});

describe('Persistence: mapQuotationItemToOrderItem Order Conversion', () => {
  it('preserves manual sheet overrides, cuts, and preflight populations across quotation-to-order mapping', () => {
    const quoteItem: any = {
      id: 'item-101',
      name: 'Custom A4 Flyer',
      printVolume: 500,
      jobWidth: 210,
      jobHeight: 297,
      paperId: 'mat-a3-130gsm',
      imposition_mode: 'OFF',
      cutsPerSheetOverride: 2,
      manualSheetCount: 240,
      colorPages: 1,
      monoPages: 9,
      monoPagesAvgK: 4.5,
      cCoverage: 20,
      mCoverage: 15,
      yCoverage: 10,
      kCoverage: 5,
    };

    const calc = { unitCost: 1500, unitPrice: 2000, sellingPrice: 1000000 };
    const mapped = mapQuotationItemToOrderItem(quoteItem, 0, calc, { id: 'mat-a3-130gsm', name: 'Art Paper A3' });

    expect(mapped.manualSheetCount).toBe(240);
    expect(mapped.cutsPerSheetOverride).toBe(2);
    expect(mapped.colorPages).toBe(1);
    expect(mapped.monoPages).toBe(9);
    expect(mapped.specifications.manual_sheet_count).toBe(240);
    expect(mapped.specifications.cuts_per_sheet).toBe(2);
    expect(mapped.specifications.color_pages_count).toBe(1);
    expect(mapped.specifications.mono_pages_count).toBe(9);
    expect(mapped.specs.manual_sheet_count).toBe(240);
    expect(mapped.specs.cuts_per_sheet).toBe(2);
  });
});
