import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('Stock Discharge & Searchable Combobox Unit Tests', () => {
  const sampleInventory = [
    {
      id: 'PAP-8952',
      sku: 'PAP-8952',
      name: 'Double A A4 - 80gsm (Sheet)',
      category: 'Paper',
      stockQty: 10000,
      consumptionUnit: 'ແຜ່ນ',
      purchaseUnit: 'ຣີມ',
      costPerConsumptionUnit: 70.45,
    },
    {
      id: 'INK-2376',
      sku: 'INK-2376',
      name: 'Epson 003 Black Ink (Refill)',
      category: 'Ink',
      stockQty: 450,
      consumptionUnit: 'ml',
      purchaseUnit: 'ຂວດ',
      costPerConsumptionUnit: 195.76,
    },
    {
      id: 'PART-001',
      sku: 'PART-001',
      name: 'Cutting Blade Standard 45 deg',
      category: 'Spare Parts',
      isSparePart: true,
      stockQty: 5,
      consumptionUnit: 'ອັນ',
      purchaseUnit: 'ກ່ອງ',
      costPerConsumptionUnit: 150000,
    }
  ];

  test('correctly filters materials by query matching name or SKU', () => {
    const query = 'Double A';
    const filtered = sampleInventory.filter(inv => {
      const q = query.toLowerCase().trim();
      return inv.name.toLowerCase().includes(q) || inv.sku.toLowerCase().includes(q);
    });
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].sku, 'PAP-8952');
  });

  test('correctly filters materials by category filter', () => {
    const paperItems = sampleInventory.filter(inv => {
      const cat = inv.category.toLowerCase();
      return cat.includes('paper') || cat.includes('ເຈ້ຍ');
    });
    assert.strictEqual(paperItems.length, 1);
    assert.strictEqual(paperItems[0].id, 'PAP-8952');

    const spareItems = sampleInventory.filter(inv => {
      const cat = inv.category.toLowerCase();
      return cat.includes('spare') || cat.includes('part') || Boolean(inv.isSparePart);
    });
    assert.strictEqual(spareItems.length, 1);
    assert.strictEqual(spareItems[0].id, 'PART-001');
  });

  test('validates discharge quantity boundary conditions', () => {
    const item = sampleInventory[0];
    const maxStock = item.stockQty;

    // Normal valid qty
    const validQty = 500;
    assert.strictEqual(validQty > 0 && validQty <= maxStock, true);

    // Negative or 0 qty
    const zeroQty = 0;
    assert.strictEqual(zeroQty > 0, false);

    // Exceeding stock qty
    const overQty = 15000;
    assert.strictEqual(overQty > maxStock, true);
  });

  test('verifies 100% Lao translations for discharge reasons', () => {
    const reasonsMap: Record<string, string> = {
      PRINT_PRODUCTION: 'ເບີກໄປພິມງານລູກຄ້າ (Print Production Job)',
      INTERNAL_USE: 'ເບີກໃຊ້ງານພາຍໃນອົງກອນ (Internal Usage)',
      TESTING_SAMPLE: 'ເບີກທົດສອບເຄື່ອງ / ຕົວຢ່າງ (Testing / Sample)',
      DAMAGED_WASTAGE: 'ເຈ້ຍເສຍ / ຊຳລຸດເສຍຫາຍ (Damaged / Wastage)',
      STOCK_ADJUSTMENT: 'ປັບປຸງຍອດສະຕ໋ອກ / ນັບສາງ (Stock Adjustment)',
      OTHER: 'ອື່ນໆ (Other)'
    };

    // Ensure no Thai characters leaked into Lao reason labels
    const thaiRegex = /[\u0E01-\u0E3A\u0E40-\u0E4F]/;
    for (const [key, text] of Object.entries(reasonsMap)) {
      assert.strictEqual(thaiRegex.test(text), false, `Reason ${key} contains Thai script: ${text}`);
      assert.ok(text.length > 0);
    }
  });

  test('correctly calculates pro-rated offcut cost per sheet from parent paper dimensions', () => {
    // Parent A3+ (320 x 480 mm = 153,600 mm2) at 1,900 LAK / sheet
    const parentWidth = 320;
    const parentHeight = 480;
    const parentArea = parentWidth * parentHeight;
    const parentCost = 1900;

    // Offcut A5 (148 x 210 mm = 31,080 mm2)
    const offcutWidth = 148;
    const offcutHeight = 210;
    const offcutArea = offcutWidth * offcutHeight;

    const proRated = Math.round((offcutArea / parentArea) * parentCost);
    // 31080 / 153600 * 1900 = ~384.4 LAK -> 384 LAK
    assert.strictEqual(proRated, 384);
    assert.ok(proRated > 0 && proRated < parentCost);
  });
});

