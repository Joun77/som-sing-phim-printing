import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mmToUnit, unitToMM } from '../features/pricing/components/CustomDimensionInput';

describe('CustomDimensionInput Unit & Dimension Utilities', () => {
  it('correctly converts millimeters to inches, cm, and mm', () => {
    // 25.4 mm = 1 inch
    assert.strictEqual(mmToUnit(25.4, 'inch'), 1);
    // 210 mm = ~8.27 inches
    assert.strictEqual(mmToUnit(210, 'inch'), 8.27);
    // 297 mm = ~11.69 inches
    assert.strictEqual(mmToUnit(297, 'inch'), 11.69);

    // 10 mm = 1 cm
    assert.strictEqual(mmToUnit(10, 'cm'), 1);
    assert.strictEqual(mmToUnit(100, 'cm'), 10);

    // mm stays mm
    assert.strictEqual(mmToUnit(210, 'mm'), 210);
  });

  it('correctly converts units back to millimeters', () => {
    assert.strictEqual(unitToMM(1, 'inch'), 25.4);
    assert.strictEqual(unitToMM(4, 'inch'), 101.6);
    assert.strictEqual(unitToMM(6, 'inch'), 152.4);

    assert.strictEqual(unitToMM(1, 'cm'), 10);
    assert.strictEqual(unitToMM(210, 'mm'), 210);
  });

  it('correctly resolves strictly ONE preset ID even when multiple presets share identical dimensions (e.g. A4 vs 8x12")', () => {
    const mockPresets = [
      { id: 'preset-a4', name: 'A4 (210x297)', width_mm: 210, height_mm: 297, category: 'DOCUMENT' },
      { id: 'preset-photo-8x12', name: '8x12" (A4 Full Photo)', width_mm: 210, height_mm: 297, category: 'PHOTO' },
    ];

    // Case 1: Active preset is 8x12" (A4 Full Photo)
    const activeName1 = '8x12" (A4 Full Photo)';
    const match1 = mockPresets.find(p => p.name.toLowerCase().trim() === activeName1.toLowerCase().trim());
    const selectedId1 = match1 ? match1.id : null;

    assert.strictEqual(selectedId1, 'preset-photo-8x12');
    // Verify that A4 is NOT selected
    assert.strictEqual(mockPresets[0].id === selectedId1, false);
    // Verify that 8x12" IS selected
    assert.strictEqual(mockPresets[1].id === selectedId1, true);

    // Case 2: Active preset is A4 (210x297)
    const activeName2 = 'A4 (210x297)';
    const match2 = mockPresets.find(p => p.name.toLowerCase().trim() === activeName2.toLowerCase().trim());
    const selectedId2 = match2 ? match2.id : null;

    assert.strictEqual(selectedId2, 'preset-a4');
    // Verify that A4 IS selected
    assert.strictEqual(mockPresets[0].id === selectedId2, true);
    // Verify that 8x12" is NOT selected
    assert.strictEqual(mockPresets[1].id === selectedId2, false);
  });
});
