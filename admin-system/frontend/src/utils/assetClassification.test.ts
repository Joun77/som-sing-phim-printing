import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAssetItem,
  resolveCanonicalEquipmentCategory,
  resolvePrinterSubtype,
  isMaterialItem,
} from './assetClassification';

describe('Asset Classification Canonical Rules', () => {
  it('correctly identifies equipment assets from category and keywords', () => {
    // Standard asset types
    assert.equal(isAssetItem('PRINTER'), true);
    assert.equal(isAssetItem('MACHINERY'), true);
    assert.equal(isAssetItem('EQUIPMENT'), true);
    assert.equal(isAssetItem('CUTTER'), true);
    assert.equal(isAssetItem('BINDER'), true);
    assert.equal(isAssetItem('LAMINATOR'), true);
    assert.equal(isAssetItem('press'), true);
    assert.equal(isAssetItem('guillotine'), true);

    // Lao / Thai keywords
    assert.equal(isAssetItem('ເຄື່ອງຈັກ'), true);
    assert.equal(isAssetItem('ເຄື່ອງພິມ'), true);
    assert.equal(isAssetItem('เครื่องตัด'), true);
    assert.equal(isAssetItem('เครื่องเข้าเล่ม'), true);

    // Asset ID prefixes
    assert.equal(isAssetItem('', { id: 'MAC-5707' }), true);
    assert.equal(isAssetItem('', { id: 'PRN-1002' }), true);
    assert.equal(isAssetItem('', { sku: 'CUT-920' }), true);
    assert.equal(isAssetItem('', { id: 'BIN-4190' }), true);
    assert.equal(isAssetItem('', { id: 'LAM-650' }), true);

    // Structural machinery attributes
    assert.equal(isAssetItem('UNKNOWN', { printerInkSlots: [{ slot: 1 }] }), true);
    assert.equal(isAssetItem('UNKNOWN', { machineryTypeCategory: 'laser' }), true);
    assert.equal(isAssetItem('UNKNOWN', { expectedLifeA4Pages: 300000 }), true);
  });

  it('correctly rejects raw materials and consumables from being classified as assets', () => {
    assert.equal(isAssetItem('PAPER'), false);
    assert.equal(isAssetItem('INK'), false);
    assert.equal(isAssetItem('LAMINATION'), false);
    assert.equal(isAssetItem('BINDING'), false);
    assert.equal(isAssetItem('CUTTING_SUPPLIES'), false);
    assert.equal(isAssetItem('RIGID_SUBSTRATES'), false);
    assert.equal(isAssetItem('PACKAGING'), false);
    assert.equal(isAssetItem('SPARE_PARTS'), false);

    assert.equal(isMaterialItem({ category: 'PAPER', name: 'Art Card 300gsm' }), true);
    assert.equal(isMaterialItem({ category: 'INK', name: 'Epson 008 Black' }), true);
    assert.equal(isMaterialItem({ category: 'LAMINATION', name: 'Gloss Film 32mic' }), true);
    assert.equal(isMaterialItem({ category: 'PRINTER', name: 'Epson L15150' }), false);
  });

  it('accurately resolves the 4 primary canonical equipment categories', () => {
    // Cutter
    assert.equal(
      resolveCanonicalEquipmentCategory('CUTTER', { name: 'QZYK 920 Programmed Paper Cutter' }),
      'Cutter'
    );
    assert.equal(
      resolveCanonicalEquipmentCategory('MACHINERY', { name: 'Polar 115 Hydraulic Guillotine' }),
      'Cutter'
    );
    assert.equal(
      resolveCanonicalEquipmentCategory('EQUIPMENT', { id: 'CUT-001', name: 'Auto Creaser and Slitter' }),
      'Cutter'
    );

    // Binder
    assert.equal(
      resolveCanonicalEquipmentCategory('BINDER', { name: 'Boway K5 Perfect Glue Binder' }),
      'Binder'
    );
    assert.equal(
      resolveCanonicalEquipmentCategory('MACHINERY', { name: 'Heavy Duty Wire-O Stitcher Binder' }),
      'Binder'
    );

    // Laminator
    assert.equal(
      resolveCanonicalEquipmentCategory('LAMINATOR', { name: 'Thermal Roll Laminator 650' }),
      'Laminator'
    );
    assert.equal(
      resolveCanonicalEquipmentCategory('MACHINERY', { name: 'Cold Roll Film Laminating Machine' }),
      'Laminator'
    );

    // Printer
    assert.equal(
      resolveCanonicalEquipmentCategory('PRINTER', { name: 'Epson EcoTank L15150' }),
      'Printer'
    );
    assert.equal(
      resolveCanonicalEquipmentCategory('MACHINERY', { name: 'Fuji Xerox AltaLink C8055 Production Press' }),
      'Printer'
    );
  });

  it('accurately resolves printer subtypes', () => {
    assert.equal(
      resolvePrinterSubtype({ printerCategory: 'Laser', name: 'Fuji Xerox DocuCentre C5005' }),
      'Laser'
    );
    assert.equal(
      resolvePrinterSubtype({ machineryTypeCategory: 'laser', name: 'ApeosPort C7070' }),
      'Laser'
    );
    assert.equal(
      resolvePrinterSubtype({ printerCategory: 'Inkjet', name: 'Epson EcoTank L15150' }),
      'Inkjet'
    );
    assert.equal(
      resolvePrinterSubtype({ name: 'HP DesignJet T650 CAD Plotter' }),
      'Plotter'
    );
    assert.equal(
      resolvePrinterSubtype({ name: 'Roland TrueVIS Flatbed UV Printer' }),
      'UV'
    );
    assert.equal(
      resolvePrinterSubtype({ name: 'Epson SureColor F-Series Sublimation' }),
      'Sublimation'
    );
  });
});
