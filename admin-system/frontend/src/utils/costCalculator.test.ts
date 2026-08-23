import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculatePaperUnitCost, calculateInkUnitCost, formatCompositeItemName } from './costCalculator';

describe('costCalculator Unit Tests', () => {
  it('correctly calculates paper unit cost for 5 packs of 500 sheets with total 460,000 LAK', () => {
    // 5 packs * 500 sheets = 2500 sheets. Total cost = 460,000 LAK
    // Unit cost = 460,000 / 2500 = 184 LAK/sheet
    const result = calculatePaperUnitCost({
      totalCost: 460000,
      packCount: 5,
      sheetsPerPack: 500
    });
    assert.strictEqual(result, 184);
  });

  it('correctly calculates paper unit cost when totalSheets is explicitly provided', () => {
    const result = calculatePaperUnitCost({
      totalCost: 460000,
      totalSheets: 2500
    });
    assert.strictEqual(result, 184);
  });

  it('correctly calculates ink unit cost per ml', () => {
    // 4 bottles * 1000 ml = 4000 ml. Total cost = 800,000 LAK
    // Unit cost = 800,000 / 4000 = 200 LAK/ml
    const result = calculateInkUnitCost({
      totalCost: 800000,
      bottleCount: 4,
      volumePerBottleMl: 1000
    });
    assert.strictEqual(result, 200);
  });

  it('formats composite item name for ink and paper', () => {
    const inkItem = {
      category: 'Ink',
      brand: 'Compute',
      colorName: 'Cyan Blue',
      colorGroup: 'Cyan'
    };
    assert.ok(formatCompositeItemName(inkItem).includes('Compute - Cyan Blue'));

    const paperItem = {
      category: 'Paper',
      name: 'Art Card',
      specs: {
        grammageGsm: 300,
        paperFormat: 'Sheet'
      }
    };
    assert.strictEqual(formatCompositeItemName(paperItem), 'Art Card - 300gsm (Sheet)');
  });
});
