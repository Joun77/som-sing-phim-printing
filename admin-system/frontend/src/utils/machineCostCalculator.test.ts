import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateMachineUnitCost, calculateTotalJobMachineCost } from './machineCostCalculator';

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
});
