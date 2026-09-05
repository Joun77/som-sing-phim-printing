import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateMachineUnitCost, calculateTotalJobMachineCost, getEquipmentAccurateCost, calculateEquipmentPrintCost } from './machineCostCalculator.ts';

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
    assert.strictEqual(cutter.unitLabel, 'ແຜ່ນ');
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
    assert.strictEqual(lam.unitLabel, 'ແຜ່ນ');
    assert.strictEqual(lam.inkCost, 0);
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
});
