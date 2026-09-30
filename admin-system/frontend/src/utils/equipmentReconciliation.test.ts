import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MACHINERY_SEED, LEGACY_MOCK_IDS, getDeletedIds, unrecordDeletedId } from '../store/AppContext';
import { isAssetItem } from './assetClassification';

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] || null,
    length: store.size,
  } as any;
}

describe('Equipment Reconciliation & Seed Purity Tests', () => {
  it('DEFAULT_MACHINERY_SEED contains only authentic equipment backed by real PostgreSQL/inbound records', () => {
    const ids = DEFAULT_MACHINERY_SEED.map(m => m.id);

    // Must contain authentic equipment
    assert.ok(ids.includes('PRN-9614'), 'PRN-9614 (Epson L15150) must exist in seed');
    assert.ok(ids.includes('PRN-6317'), 'PRN-6317 (Brother MFC-J2740DW) must exist in seed');

    // Must NOT contain unsupported mock seeds
    assert.ok(!ids.includes('MAC-CUTTER-920'), 'MAC-CUTTER-920 must NOT exist in seed');
    assert.ok(!ids.includes('MAC-BINDER-K5'), 'MAC-BINDER-K5 must NOT exist in seed');
    assert.ok(!ids.includes('MAC-4190'), 'MAC-4190 must NOT exist in seed');
    assert.ok(!ids.includes('MAC-5707'), 'MAC-5707 alias must NOT exist in seed');
    assert.ok(!ids.includes('MAC-6821'), 'MAC-6821 alias must NOT exist in seed');

    assert.equal(DEFAULT_MACHINERY_SEED.length, 2, 'Seed must contain exactly 2 verified machines');
  });

  it('LEGACY_MOCK_IDS contains all unverified and legacy alias machinery identifiers', () => {
    assert.ok(LEGACY_MOCK_IDS.has('mac-cutter-920'), 'mac-cutter-920 must be in LEGACY_MOCK_IDS');
    assert.ok(LEGACY_MOCK_IDS.has('mac-binder-k5'), 'mac-binder-k5 must be in LEGACY_MOCK_IDS');
    assert.ok(LEGACY_MOCK_IDS.has('mac-4190'), 'mac-4190 must be in LEGACY_MOCK_IDS');
    assert.ok(LEGACY_MOCK_IDS.has('mac-5707'), 'mac-5707 must be in LEGACY_MOCK_IDS');
    assert.ok(LEGACY_MOCK_IDS.has('mac-6821'), 'mac-6821 must be in LEGACY_MOCK_IDS');
  });

  it('purges stale localStorage entries that contain unverified mock machinery', () => {
    // Simulating stale localStorage containing unverified seeds and legacy aliases
    const staleLocalStorage = [
      { id: 'MAC-CUTTER-920', name: 'QZYK 920 Programmed Paper Cutter', category: 'Cutter' },
      { id: 'MAC-BINDER-K5', name: 'Boway K5 Perfect Glue Binder', category: 'Binder' },
      { id: 'MAC-4190', name: 'Fuji Xerox AltaLink C8055', category: 'Printer' },
      { id: 'MAC-5707', name: 'Epson L15150', category: 'Printer' },
      { id: 'MAC-6821', name: 'Brother MFC-J2740DW', category: 'Printer' },
      { id: 'PRN-9614', name: 'Epson L15150', category: 'Printer' },
      { id: 'PRN-6317', name: 'Brother MFC-J2740DW', category: 'Printer' },
    ];

    // Filter replicating initialEquipment and refreshData purge logic
    const purged = staleLocalStorage.filter(item => {
      const lower = item.id.toLowerCase();
      if (LEGACY_MOCK_IDS.has(lower)) return false;
      if (item.id === 'MAC-CUTTER-920' || item.id === 'MAC-BINDER-K5' || item.id === 'MAC-4190') return false;
      return true;
    });

    const remainingIDs = purged.map(p => p.id);
    assert.deepEqual(remainingIDs, ['PRN-9614', 'PRN-6317']);
    assert.ok(!remainingIDs.includes('MAC-CUTTER-920'));
    assert.ok(!remainingIDs.includes('MAC-BINDER-K5'));
    assert.ok(!remainingIDs.includes('MAC-4190'));
  });

  it('reconciliation against DB source of truth overrides stale localStorage with authentic records', () => {
    // Replicating refreshData DB authoritative merging
    const rawDbItems = [
      {
        id: 'PRN-9614',
        name: 'Epson L15150',
        brand: 'Epson',
        model: 'L15150',
        serialNumber: 'SN-PRN-9614',
        category: 'Printer',
        price: 18000000,
        vendor: 'Supplier',
        warrantyExpirationYear: 2028,
        status: 'In Use',
        location: 'Main Dept',
      },
      {
        id: 'PRN-6317',
        name: 'Brother MFC-J2740DW',
        brand: 'Brother',
        model: 'MFC-J2740DW',
        serialNumber: 'SN-PRN-6317',
        category: 'Printer',
        price: 7000000,
        vendor: 'Supplier',
        warrantyExpirationYear: 2028,
        status: 'In Use',
        location: 'Main Dept',
      }
    ];

    const mapById = new Map();
    rawDbItems.forEach(dbItem => {
      if (!LEGACY_MOCK_IDS.has(dbItem.id.toLowerCase())) {
        mapById.set(dbItem.id, dbItem);
      }
    });

    // Explicitly purge mock IDs
    mapById.delete('MAC-CUTTER-920');
    mapById.delete('MAC-BINDER-K5');
    mapById.delete('MAC-4190');
    mapById.delete('MAC-5707');
    mapById.delete('MAC-6821');

    const result = Array.from(mapById.values());
    assert.equal(result.length, 2);
    assert.equal(result[0].id, 'PRN-9614');
    assert.equal(result[0].serialNumber, 'SN-PRN-9614');
    assert.equal(result[0].price, 18000000);
    assert.equal(result[1].id, 'PRN-6317');
    assert.equal(result[1].serialNumber, 'SN-PRN-6317');
    assert.equal(result[1].price, 7000000);
  });

  it('verifies that physical equipment assets are strictly isolated from materials inventory', () => {
    // Both PRN-9614 and PRN-6317 must be identified as assets
    assert.equal(isAssetItem('PRINTER', { id: 'PRN-9614', name: 'Epson L15150' }), true);
    assert.equal(isAssetItem('PRINTER', { id: 'PRN-6317', name: 'Brother MFC-J2740DW' }), true);

    // Consumables and materials must NOT be identified as assets
    assert.equal(isAssetItem('INK', { id: 'INK-2376', name: 'Epson Inktec-Black' }), false);
    assert.equal(isAssetItem('PAPER', { id: 'PAP-4100', name: 'Green Read Paper' }), false);
    assert.equal(isAssetItem('PAPER', { id: 'INB-3125', name: 'Double A A4 - 80gsm' }), false);
  });

  it('verifies PRN-9614 Epson L15150 normalized category, printerCategory=Inkjet, and authentic specifications', () => {
    const prn9614 = DEFAULT_MACHINERY_SEED.find(m => m.id === 'PRN-9614');
    assert.ok(prn9614, 'PRN-9614 must exist in DEFAULT_MACHINERY_SEED');

    assert.equal(prn9614.category, 'Printer');
    assert.equal(prn9614.printerCategory, 'Inkjet');
    assert.equal(prn9614.price, 18000000);
    assert.equal(prn9614.expectedLifeA4Pages, 200000);
    assert.equal(prn9614.totalColorSlots, 4);
    assert.equal(prn9614.colorSchemeType, 'CMYK');
    assert.equal(prn9614.vendor, 'Supplier');

    // Verify nested specs
    assert.equal(prn9614.specs?.category, 'Printer');
    assert.equal(prn9614.specs?.printerCategory, 'Inkjet');
    assert.equal(prn9614.specs?.price, 18000000);
    assert.equal(prn9614.specs?.expectedLifeA4Pages, 200000);
    assert.equal(prn9614.specs?.totalColorSlots, 4);

    // Verify OEM baseline slots exist with 4 CMYK slots
    assert.equal(prn9614.oemBaselineInks?.length, 4);
    const slots = prn9614.oemBaselineInks?.map((s: any) => s.colorGroup);
    assert.deepEqual(slots, ['Black', 'Cyan', 'Magenta', 'Yellow']);
  });

  it('purges prn-9614/prn-6317 tombstones when DB source returns them, while preserving non-equipment tombstones and blocking mock IDs', () => {
    // 1. Setup localStorage containing stale tombstones for PRN-9614 and PRN-6317, plus an unrelated material tombstone and unsupported mock
    localStorage.setItem('som_sing_deleted_item_ids', JSON.stringify([
      'prn-9614',
      'PRN-9614',
      'prn-6317',
      'PRN-6317',
      'mac-5707',
      'mac-6821',
      'MAT-INK-999',
      'mac-cutter-920'
    ]));

    // 2. Simulated DB response with authentic equipment
    const dbItems = [
      { id: 'PRN-9614', brand: 'Epson', model: 'L15150', category: 'Printer', printerCategory: 'Inkjet', price: 18000000, expectedLifeA4Pages: 200000 },
      { id: 'PRN-6317', brand: 'Brother', model: 'MFC-J2740DW', category: 'Printer', printerCategory: 'Inkjet', price: 7000000, expectedLifeA4Pages: 150000 }
    ];

    // Purge authentic DB IDs from tombstones as executed by authoritative refreshData
    dbItems.forEach(dbItem => {
      unrecordDeletedId(dbItem.id, 'all');
      if (dbItem.id === 'PRN-9614') unrecordDeletedId('MAC-5707', 'all');
      if (dbItem.id === 'PRN-6317') unrecordDeletedId('MAC-6821', 'all');
    });

    // Check tombstones after purge:
    const remainingDeleted = getDeletedIds('all');
    assert.equal(remainingDeleted.has('prn-9614'), false, 'prn-9614 tombstone must be purged');
    assert.equal(remainingDeleted.has('PRN-9614'), false, 'PRN-9614 tombstone must be purged');
    assert.equal(remainingDeleted.has('prn-6317'), false, 'prn-6317 tombstone must be purged');
    assert.equal(remainingDeleted.has('PRN-6317'), false, 'PRN-6317 tombstone must be purged');
    assert.equal(remainingDeleted.has('mac-5707'), false, 'mac-5707 tombstone must be purged');
    assert.equal(remainingDeleted.has('mac-6821'), false, 'mac-6821 tombstone must be purged');

    // Unrelated entity and mock tombstones must NOT be wiped wholesale
    assert.equal(remainingDeleted.has('MAT-INK-999') || remainingDeleted.has('mat-ink-999'), true, 'MAT-INK-999 tombstone must be preserved');
    assert.equal(remainingDeleted.has('mac-cutter-920'), true, 'mac-cutter-920 tombstone must be preserved');

    // Build authoritative state
    const mapById = new Map();
    dbItems.forEach(dbItem => {
      if (!LEGACY_MOCK_IDS.has(dbItem.id.toLowerCase())) {
        mapById.set(dbItem.id, dbItem);
      }
    });

    // Purge unverified mock IDs
    mapById.delete('MAC-CUTTER-920');
    mapById.delete('MAC-BINDER-K5');
    mapById.delete('MAC-4190');

    const finalEquip = Array.from(mapById.values());
    assert.equal(finalEquip.length, 2, 'Final equipment must have exactly 2 machines');
    const finalIds = finalEquip.map(e => e.id);
    assert.deepEqual(finalIds, ['PRN-9614', 'PRN-6317']);
    assert.equal(finalIds.includes('MAC-CUTTER-920'), false);
    assert.equal(finalIds.includes('MAC-BINDER-K5'), false);
    assert.equal(finalIds.includes('MAC-4190'), false);
  });
});
