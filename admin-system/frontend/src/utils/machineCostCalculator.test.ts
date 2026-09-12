import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateMachineUnitCost, calculateTotalJobMachineCost, getEquipmentAccurateCost, calculateEquipmentPrintCost, calculateMachineWearPartsRate, resolveMachineImage, formatUnitPrecisionLAK } from './machineCostCalculator.ts';

describe('machineCostCalculator Unit Tests', () => {
  it('correctly calculates depreciation and maintenance per sheet for printer', () => {
    // Machine Price = 50,000,000 LAK, Target Pages = 1,000,000, Maint Rate = 20%
    // Depreciation = 50,000,000 / 1,000,000 = 50 LAK/sheet
    // Maintenance = 50 * 0.20 = 10 LAK/sheet
    // Total Machine Cost = 60 LAK/sheet
    const result = calculateMachineUnitCost({
      purchase_price_lak: 50000000,
      expected_life_pages: 1000000,
      maintenance_rate_percent: 20
    });

    assert.strictEqual(result.depreciation, 50);
    assert.strictEqual(result.maintenance, 10);
    assert.strictEqual(result.totalMachineCost, 60);
  });

  it('handles zero maintenance rate correctly', () => {
    const result = calculateMachineUnitCost({
      purchase_price_lak: 30000000,
      expected_life_pages: 500000,
      maintenance_rate_percent: 0
    });

    assert.strictEqual(result.depreciation, 60);
    assert.strictEqual(result.maintenance, 0);
    assert.strictEqual(result.totalMachineCost, 60);
  });

  it('safely handles zero or negative expected life pages without division by zero', () => {
    const resultZero = calculateMachineUnitCost({
      purchase_price_lak: 50000000,
      expected_life_pages: 0,
      maintenance_rate_percent: 20
    });

    assert.strictEqual(resultZero.depreciation, 0);
    assert.strictEqual(resultZero.maintenance, 0);
    assert.strictEqual(resultZero.totalMachineCost, 0);
  });

  it('correctly computes total job machine overhead for 500 sheets', () => {
    const totalCost = calculateTotalJobMachineCost({
      purchase_price_lak: 50000000,
      expected_life_pages: 1000000,
      maintenance_rate_percent: 20
    }, 500);

    // 60 LAK/sheet * 500 sheets = 30,000 LAK
    assert.strictEqual(totalCost, 30000);
  });

  it('correctly resolves accurate machinery cost and unit labels using getEquipmentAccurateCost', () => {
    // 1. Digital Press: Fuji Xerox Versant 180
    const press = getEquipmentAccurateCost({
      name: 'Fuji Xerox Versant 180 Press',
      category: 'Printer',
      purchaseCost: 450000000,
      printedPagesCapacity: 1500000,
      maintenanceRatePercent: 15
    });
    assert.strictEqual(press.depreciation, 300);
    assert.strictEqual(press.maintenance, 45);
    assert.strictEqual(press.totalMachineCost, 345);
    assert.strictEqual(press.unitLabel, 'ໜ້າ');
    assert.strictEqual(press.isPrinter, true);

    // 2. Cutter: QZYK920 Hydraulic Paper Guillotine
    const cutter = getEquipmentAccurateCost({
      name: 'QZYK920 Hydraulic Paper Guillotine',
      category: 'Cutter',
      purchaseCost: 85000000,
      printedPagesCapacity: 3000000,
      maintenanceRatePercent: 15
    });
    assert.strictEqual(cutter.depreciation, 28.33);
    assert.strictEqual(cutter.maintenance, 4.25);
    assert.strictEqual(cutter.totalMachineCost, 32.58);
    assert.strictEqual(cutter.unitLabel, 'ຮອບຕັດ');
    assert.strictEqual(cutter.unitLabelEn, 'cut');
    assert.strictEqual(cutter.inkCost, 0);
    assert.strictEqual(cutter.isPrinter, false);

    // 3. Binder: WD-50A Perfect Glue Thermal Binder
    const binder = getEquipmentAccurateCost({
      name: 'WD-50A Perfect Glue Thermal Binder',
      category: 'Binder',
      purchaseCost: 35000000,
      printedPagesCapacity: 600000,
      maintenanceRatePercent: 15
    });
    assert.strictEqual(binder.depreciation, 58.33);
    assert.strictEqual(binder.maintenance, 8.75);
    assert.strictEqual(binder.totalMachineCost, 67.08);
    assert.strictEqual(binder.unitLabel, 'ຫົວ');
    assert.strictEqual(binder.unitLabelEn, 'book');
    assert.strictEqual(binder.inkCost, 0);

    // 4. Laminator: FM-360 Roll Laminator
    const lam = getEquipmentAccurateCost({
      name: 'FM-360 Roll Laminator Hot & Cold',
      category: 'Laminator',
      purchaseCost: 22000000,
      printedPagesCapacity: 800000,
      maintenanceRatePercent: 15
    });
    assert.strictEqual(lam.depreciation, 27.5);
    assert.strictEqual(lam.maintenance, 4.13);
    assert.strictEqual(lam.totalMachineCost, 31.63);
    assert.strictEqual(lam.unitLabel, 'ແມັດ');
    assert.strictEqual(lam.unitLabelEn, 'meter');
    assert.strictEqual(lam.inkCost, 0);
  });

  it('correctly calculates exact itemized wear parts rate from Data Material specifications', () => {
    // Inkjet: Maintenance Box (450k / 25k = 18) + Printhead (4.5M / 100k = 45) + Pickup Roller (150k / 30k = 5) + Carriage Belt (500k / 50k = 10) = 78 LAK/page
    const inkjetEq = {
      name: 'Epson L15150 EcoTank',
      category: 'Printer',
      postPressSubtype: 'inkjet',
      specs: {
        wearMaintBoxCost: 450000,
        wearMaintBoxLife: 25000,
        wearPrintheadCost: 4500000,
        wearPrintheadLife: 100000,
        wearPickupRollerCost: 150000,
        wearPickupRollerLife: 30000,
        wearCarriageBeltCost: 500000,
        wearCarriageBeltLife: 50000,
      }
    };
    const inkjetWear = calculateMachineWearPartsRate(inkjetEq);
    assert.strictEqual(inkjetWear, 78);

    // Guillotine Cutter: Sharpening (150k / 10k = 15) + Cutting Stick (100k / 20k = 5) = 20 LAK/cut
    const guillotineEq = {
      name: 'QZYK920 Hydraulic Paper Guillotine',
      category: 'Cutter',
      postPressSubtype: 'guillotine',
      specs: {
        wearSharpeningCost: 150000,
        wearSharpeningIntervalCuts: 10000,
        wearCuttingStickCost: 100000,
        wearCuttingStickLifeCuts: 20000,
      }
    };
    const guillotineWear = calculateMachineWearPartsRate(guillotineEq);
    assert.strictEqual(guillotineWear, 20);
  });

  it('correctly calculates print cost matching EquipmentTable for Epson L15150 and Brother MFC-J2740DW', () => {
    const epson = {
      id: 'INB-5266',
      name: 'Epson L15150',
      category: 'Printer',
      postPressSubtype: 'guillotine', // Edge case where test DB had guillotine cutter tag
      price: 3125000,
      lifespanYears: 5,
      estMonthlyVolume: 50000,
      maintenanceRatePercent: 15,
      oemBaselineInks: [
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemPrice: 450000, oemStandardIsoYieldA4: 7500 },
      ]
    };

    const epsonCost = calculateEquipmentPrintCost(epson, [], [], 'Printer');
    // baseCost = (3125000 / 60) / 50000 = 1.0416...
    // wear = 1.0416 * 0.15 = 0.156...
    // net = 1.042 + 0.156 = 1.198 ~ 1.20
    // ink = 450000 / 7500 = 60
    // total = 61.20 -> LAK 61
    assert.strictEqual(epsonCost.formattedTotal, 'LAK 61');
    assert.strictEqual(epsonCost.formattedMachine, 'LAK 1.20');
    assert.strictEqual(epsonCost.formattedInk, 'LAK 60');
    assert.strictEqual(epsonCost.unitLabel, 'ໜ້າ');
    assert.strictEqual(epsonCost.isPostPress, false);

    const brother = {
      id: 'INB-5465',
      name: 'Brother MFC-J2740DW',
      category: 'Printer',
      price: 7300000,
      lifespanYears: 5,
      estMonthlyVolume: 50000,
      maintenanceRatePercent: 15,
      oemBaselineInks: [
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemPrice: 940000, oemStandardIsoYieldA4: 1000 },
      ]
    };

    const brotherCost = calculateEquipmentPrintCost(brother, [], [], 'Printer');
    assert.strictEqual(brotherCost.formattedTotal, 'LAK 943');
    assert.strictEqual(brotherCost.formattedMachine, 'LAK 2.80');
    assert.strictEqual(brotherCost.formattedInk, 'LAK 940');
  });

  it('correctly calculates depreciation and print cost for equipment with explicit expectedLifeA4Pages from DB', () => {
    // Epson L15150 from materials DB: 18,000,000 LAK, 200,000 pages, 20% maintenance
    // Depreciation = 18,000,000 / 200,000 = 90 LAK/page
    // Maintenance = 90 * 0.20 = 18 LAK/page
    // Total Machine = 108 LAK/page
    const epsonDb = {
      id: 'PRN-9614',
      name: 'Epson L15150',
      category: 'PRINTER',
      totalPrice: 18000000,
      expectedLifeA4Pages: 200000,
      maintenanceRatePercent: 20,
      oemBaselineInks: [
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemPrice: 450000, oemStandardIsoYieldA4: 7500 }, // 60
        { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemPrice: 320000, oemStandardIsoYieldA4: 6000 },   // 53.33
        { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemPrice: 320000, oemStandardIsoYieldA4: 6000 }, // 53.33
        { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemPrice: 320000, oemStandardIsoYieldA4: 6000 },  // 53.33
      ]
    };

    const cost = calculateEquipmentPrintCost(epsonDb, [], [], 'Printer');
    assert.strictEqual(cost.baseCostPerUnit, 90);
    assert.strictEqual(cost.wearAllowancePerUnit, 18);
    assert.strictEqual(cost.netCostPerUnit, 108);
    assert.strictEqual(cost.formattedMachine, 'LAK 108');
    // Ink = 60 + 53.33 + 53.33 + 53.33 = 220 LAK
    // Total = 108 + 220 = 328 LAK
    assert.strictEqual(cost.formattedInk, 'LAK 220');
    assert.strictEqual(cost.formattedTotal, 'LAK 328');
  });

  it('correctly calculates linked actual ink cost and breakdown for Epson L15150 matching inventory linker', () => {
    const epsonMachine = {
      id: 'MAC-5707',
      name: 'Epson EcoTank L15150',
      category: 'Printer',
      price: 18500057,
      expectedLifeA4Pages: 300000,
      wearPickupRollerCost: 600000,
      wearPickupRollerLife: 50000, // 12
      wearMaintBoxCost: 700000,
      wearMaintBoxLife: 50000, // 14
      wearCarriageBeltCost: 600000,
      wearCarriageBeltLife: 50000, // 12
      wearPrintheadCost: 4000000,
      wearPrintheadLife: 100000, // 40
      // Itemized wear = 12 + 14 + 12 + 40 = 78 LAK
      oemBaselineInks: [
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500, oemPrice: 450000 },
        { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
        { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
        { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
      ]
    };

    const printerColorLinks = [
      { assetId: 'MAC-5707', slotPosition: 'Slot 1 (K - Black)', inkCode: 'INK-9826', colorGroup: 'Black' },
      { assetId: 'MAC-5707', slotPosition: 'Slot 2 (C - Cyan)', inkCode: 'INK-8713', colorGroup: 'Cyan' },
      { assetId: 'MAC-5707', slotPosition: 'Slot 3 (M - Magenta)', inkCode: 'INK-0365', colorGroup: 'Magenta' },
      { assetId: 'MAC-5707', slotPosition: 'Slot 4 (Y - Yellow)', inkCode: 'INK-6588', colorGroup: 'Yellow' },
    ];

    const inventory = [
      { id: 'INB-7677', sku: 'INB-7677', specs: { sku: 'INK-9826', volume: 127 }, unitPrice: 95000, volume: 127 },
      { id: 'INK-8713', sku: 'INK-8713', specs: { volume: 70 }, unitPrice: 95000, volume: 70 },
      { id: 'INK-0365', sku: 'INK-0365', specs: { volume: 70 }, unitPrice: 95000, volume: 70 },
      { id: 'INK-6588', sku: 'INK-6588', specs: { volume: 70 }, unitPrice: 95000, volume: 70 },
    ];

    const result = calculateEquipmentPrintCost(epsonMachine, printerColorLinks, inventory, 'Printer');
    
    // Slot 1: 95,000 / 7,500 = 12.67 LAK
    // Slot 2: 95,000 / 6,000 = 15.83 LAK
    // Slot 3: 95,000 / 6,000 = 15.83 LAK
    // Slot 4: 95,000 / 6,000 = 15.83 LAK
    // Total Ink = 12.67 + 15.83 * 3 = 60.17 LAK
    assert.strictEqual(result.linkedInkRatePerPage, 60.17);
    assert.strictEqual(result.inkSlotsBreakdown.length, 4);
    assert.strictEqual(result.inkSlotsBreakdown[0].costPerPage, 12.67);
    assert.strictEqual(result.inkSlotsBreakdown[1].costPerPage, 15.83);
    assert.strictEqual(result.inkSlotsBreakdown[2].costPerPage, 15.83);
    assert.strictEqual(result.inkSlotsBreakdown[3].costPerPage, 15.83);
    assert.strictEqual(result.inkSlotsBreakdown[0].isLinked, true);
    assert.strictEqual(result.inkSlotsBreakdown[1].isLinked, true);
    
    // Precision formatters
    assert.strictEqual(formatUnitPrecisionLAK(result.linkedInkRatePerPage), 'LAK 60.17');
    assert.strictEqual(formatUnitPrecisionLAK(result.inkSlotsBreakdown[0].costPerPage), 'LAK 12.67');
    assert.strictEqual(formatUnitPrecisionLAK(result.inkSlotsBreakdown[1].costPerPage), 'LAK 15.83');
    assert.strictEqual(formatUnitPrecisionLAK(result.baseCostPerUnit), 'LAK 61.67');
    assert.strictEqual(formatUnitPrecisionLAK(result.wearAllowancePerUnit), 'LAK 78');
  });

  it('correctly calculates 1,000ml bulk refill ink (INK-2376) and adopts direct colorInkCost field yielding 195.76 LAK', () => {
    const epsonMachine = {
      id: 'MAC-5707',
      name: 'Epson EcoTank L15150',
      category: 'Printer',
      price: 18500057,
      expectedLifeA4Pages: 300000,
      specs: {
        wearPickupRollerCost: 600000,
        wearPickupRollerLife: 50000, // 12
        wearMaintBoxCost: 700000,
        wearMaintBoxLife: 50000, // 14
        wearCarriageBeltCost: 600000,
        wearCarriageBeltLife: 50000, // 12
        wearPrintheadCost: 4000000,
        wearPrintheadLife: 100000, // 40
      },
      oemBaselineInks: [
        { slotPosition: 'Slot 1 (K - Black)', colorGroup: 'Black', oemInkCode: 'EPSON-008-BK', oemStandardVolumeMl: 127, oemStandardIsoYieldA4: 7500, oemPrice: 450000 },
        { slotPosition: 'Slot 2 (C - Cyan)', colorGroup: 'Cyan', oemInkCode: 'EPSON-008-C', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
        { slotPosition: 'Slot 3 (M - Magenta)', colorGroup: 'Magenta', oemInkCode: 'EPSON-008-M', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
        { slotPosition: 'Slot 4 (Y - Yellow)', colorGroup: 'Yellow', oemInkCode: 'EPSON-008-Y', oemStandardVolumeMl: 70, oemStandardIsoYieldA4: 6000, oemPrice: 320000 },
      ]
    };

    const printerColorLinks = [
      { assetId: 'MAC-5707', slotPosition: 'Slot 1 (K - Black)', inkCode: 'INK-2376', colorGroup: 'Black' },
      { assetId: 'MAC-5707', slotPosition: 'Slot 2 (C - Cyan)', inkCode: 'INK-8713', colorGroup: 'Cyan' },
      { assetId: 'MAC-5707', slotPosition: 'Slot 3 (M - Magenta)', inkCode: 'INK-0365', colorGroup: 'Magenta' },
      { assetId: 'MAC-5707', slotPosition: 'Slot 4 (Y - Yellow)', inkCode: 'INK-6588', colorGroup: 'Yellow' },
    ];

    // 1000ml bulk ink bottle INK-2376 at 507,500 LAK
    const inventory = [
      { id: 'INK-2376', sku: 'INK-2376', name: 'ໝຶກ Epson Inktec-Black (Pigment)', unitPrice: 507500, volume: 1000 },
      { id: 'INK-8713', sku: 'INK-8713', specs: { volume: 70 }, unitPrice: 95000, volume: 70 },
      { id: 'INK-0365', sku: 'INK-0365', specs: { volume: 70 }, unitPrice: 95000, volume: 70 },
      { id: 'INK-6588', sku: 'INK-6588', specs: { volume: 70 }, unitPrice: 95000, volume: 70 },
    ];

    const result = calculateEquipmentPrintCost(epsonMachine, printerColorLinks, inventory, 'Printer');
    
    // Slot 1 (Black 1000ml): 507,500 / 1000 * (127 / 7500) = 8.59 LAK
    // Slot 2, 3, 4 (Cyan, Magenta, Yellow 70ml): 95,000 / 6000 = 15.83 LAK
    // Total Ink = 8.59 + 15.83 * 3 = 56.09 LAK
    // Machine = 61.67 (depr) + 78 (wear) = 139.67 LAK
    // Grand Total = 139.67 + 56.09 = 195.76 LAK
    assert.strictEqual(result.inkSlotsBreakdown[0].costPerPage, 8.59);
    assert.strictEqual(result.inkSlotsBreakdown[1].costPerPage, 15.83);
    assert.strictEqual(result.linkedInkRatePerPage, 56.09);
    assert.strictEqual(result.netCostPerUnit, 139.67);
    assert.strictEqual(result.finalCostPerPage, 195.76);
    assert.strictEqual(formatUnitPrecisionLAK(result.finalCostPerPage), 'LAK 195.76');

    // Direct Field Verification: when machine already has colorInkCost = 56.09 directly stored
    const machineWithDirectField = {
      ...epsonMachine,
      colorInkCost: 56.09,
      bwInkCost: 8.59,
      totalPrintCostPerPage: 195.76,
    };
    const directResult = calculateEquipmentPrintCost(machineWithDirectField, [], [], 'Printer');
    assert.strictEqual(directResult.linkedInkRatePerPage, 56.09);
    assert.strictEqual(directResult.finalCostPerPage, 195.76);
    assert.strictEqual(formatUnitPrecisionLAK(directResult.finalCostPerPage), 'LAK 195.76');
  });
});

