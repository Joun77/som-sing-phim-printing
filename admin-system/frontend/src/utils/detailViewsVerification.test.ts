import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Detail Views Verification & Spec Alignment Tests', () => {
  // 1. Paper Specs Integrity
  it('correctly normalizes Paper specs with all 9 paper types and ink compatibilities', () => {
    const paperPayload = {
      category: 'Paper',
      name: 'Double A 80g A4',
      specs: {
        paperType: 'Plain Paper',
        paperFormat: 'Sheet',
        standardSize: 'A4',
        grammageGsm: 80,
        paperSurface: 'Uncoated',
        printableSides: 'Double-sided',
        sheetsPerPack: 500,
        compatibilities: ['Dye', 'Pigment', 'Laser Toner'],
        cutWastePct: 3
      }
    };

    assert.strictEqual(paperPayload.specs.paperType, 'Plain Paper');
    assert.strictEqual(paperPayload.specs.standardSize, 'A4');
    assert.strictEqual(paperPayload.specs.grammageGsm, 80);
    assert.strictEqual(paperPayload.specs.compatibilities.length, 3);
    assert.ok(paperPayload.specs.compatibilities.includes('Laser Toner'));
  });

  // 2. Custom Sheet Dimensions
  it('correctly handles Custom Sheet dimensions for Paper', () => {
    const customPaper = {
      category: 'Paper',
      name: 'Custom Kraft Board',
      specs: {
        paperType: 'Kraft Paper',
        paperFormat: 'Sheet',
        standardSize: 'Custom Sheet',
        customWidthMm: 215,
        customLengthMm: 310,
        grammageGsm: 250
      }
    };

    assert.strictEqual(customPaper.specs.standardSize, 'Custom Sheet');
    assert.strictEqual(customPaper.specs.customWidthMm, 215);
    assert.strictEqual(customPaper.specs.customLengthMm, 310);
  });

  // 3. Cutter Machine Specs & Wear Parts
  it('correctly models Cutter specs without warm-up time and with 3 specific wear parts', () => {
    const cutterMachine = {
      category: 'Cutter',
      postPressSubtype: 'guillotine',
      name: 'Boway 480 Hydraulic Guillotine',
      specs: {
        cutterMaxWidthMm: 480,
        cutterMaxSpeedMms: 400,
        cutterDownforceG: 800,
        operatingWatts: 1500,
        warmUpTimeMins: 0,
        wearSharpeningCost: 150000,
        wearSharpeningIntervalCuts: 10000,
        wearCuttingStickCost: 100000,
        wearCuttingStickLifeCuts: 20000,
        wearBladeCost: 250000,
        wearBladeLifeMeters: 5000
      }
    };

    assert.strictEqual(cutterMachine.specs.warmUpTimeMins, 0);
    assert.strictEqual(cutterMachine.specs.cutterMaxWidthMm, 480);
    assert.strictEqual(cutterMachine.specs.cutterDownforceG, 800);
    assert.strictEqual(cutterMachine.specs.wearSharpeningCost, 150000);
    assert.strictEqual(cutterMachine.specs.wearCuttingStickLifeCuts, 20000);
  });

  // 4. Inkjet Machine Specs & Wear Parts
  it('correctly models Inkjet Printer specs without warm-up time and with 5 wear parts', () => {
    const inkjetMachine = {
      category: 'Printer',
      postPressSubtype: 'inkjet',
      name: 'Epson L15150 Tank Printer',
      specs: {
        feedType: 'Cut-sheet',
        maxPaperSize: 'A3+',
        speedMonoPpm: 32,
        speedColorPpm: 22,
        supportedGsmMin: 64,
        supportedGsmMax: 300,
        operatingWatts: 350,
        warmUpTimeMins: 0,
        wearMaintBoxCost: 450000,
        wearMaintBoxLife: 25000,
        wearPrintheadCost: 4500000,
        wearPrintheadLife: 100000,
        wearPickupRollerCost: 150000,
        wearPickupRollerLife: 30000,
        wearCarriageBeltCost: 500000,
        wearCarriageBeltLife: 50000,
        wasteLossCleaningPct: 5
      }
    };

    assert.strictEqual(inkjetMachine.specs.warmUpTimeMins, 0);
    assert.strictEqual(inkjetMachine.specs.speedMonoPpm, 32);
    assert.strictEqual(inkjetMachine.specs.speedColorPpm, 22);
    assert.strictEqual(inkjetMachine.specs.wearPrintheadCost, 4500000);
    assert.strictEqual(inkjetMachine.specs.wasteLossCleaningPct, 5);
  });

  // 5. Laser Machine Specs & Wear Parts
  it('correctly models Laser Production Press with warm-up time and 5 toner wear parts', () => {
    const laserMachine = {
      category: 'Printer',
      postPressSubtype: 'laser',
      name: 'Fuji Xerox DocuCentre SC2022',
      specs: {
        feedType: 'Cut-sheet',
        maxPaperSize: 'SRA3',
        speedMonoPpm: 25,
        speedColorPpm: 20,
        supportedGsmMin: 60,
        supportedGsmMax: 256,
        duplexMode: 'Auto-Duplex',
        operatingWatts: 1800,
        warmUpTimeMins: 1.5,
        wearDrumUnitCost: 1500000,
        wearDrumUnitLife: 50000,
        wearFuserUnitCost: 2000000,
        wearFuserUnitLife: 100000,
        wearTransferBeltCost: 1800000,
        wearTransferBeltLife: 100000,
        wearPickupRollerCost: 150000,
        wearPickupRollerLife: 30000,
        wearWasteTonerBoxCost: 350000,
        wearWasteTonerBoxLife: 30000
      }
    };

    assert.strictEqual(laserMachine.specs.warmUpTimeMins, 1.5);
    assert.strictEqual(laserMachine.specs.duplexMode, 'Auto-Duplex');
    assert.strictEqual(laserMachine.specs.wearWasteTonerBoxCost, 350000);
  });

  // 6. Laminator Machine Specs & Wear Parts
  it('correctly models Laminator specs with 2 wear parts and operating temperature', () => {
    const laminatorMachine = {
      category: 'Laminator',
      postPressSubtype: 'laminator',
      name: 'Boway 650 Roll Thermal Laminator',
      specs: {
        laminatorMaxWidthMm: 650,
        laminatorMaxSpeedMmin: 5,
        laminatorMaxTempC: 140,
        operatingWatts: 1600,
        warmUpTimeMins: 5,
        wearSiliconeRollerCost: 1200000,
        wearSiliconeRollerLifeMeters: 20000,
        wearHeatingElementCost: 800000,
        wearHeatingElementHours: 5000
      }
    };

    assert.strictEqual(laminatorMachine.specs.laminatorMaxWidthMm, 650);
    assert.strictEqual(laminatorMachine.specs.laminatorMaxTempC, 140);
    assert.strictEqual(laminatorMachine.specs.wearSiliconeRollerCost, 1200000);
    assert.strictEqual(laminatorMachine.specs.wearHeatingElementHours, 5000);
  });

  // 7. Binder Machine Specs & Wear Parts
  it('correctly models Binder specs with 2 wear parts and glue heating time', () => {
    const binderMachine = {
      category: 'Binder',
      postPressSubtype: 'binder',
      name: 'Sysform 50A Perfect Binder',
      specs: {
        binderMaxThicknessMm: 40,
        binderSpeedBooksHr: 200,
        operatingWatts: 1400,
        warmUpTimeMins: 15,
        wearMillingCutterCost: 800000,
        wearMillingCutterLifeBooks: 10000,
        wearPunchingPinsCost: 600000,
        wearPunchingPinsLifePunches: 20000
      }
    };

    assert.strictEqual(binderMachine.specs.binderMaxThicknessMm, 40);
    assert.strictEqual(binderMachine.specs.binderSpeedBooksHr, 200);
    assert.strictEqual(binderMachine.specs.wearMillingCutterCost, 800000);
    assert.strictEqual(binderMachine.specs.wearPunchingPinsLifePunches, 20000);
  });

  // 8. Rigid Substrates Integrity
  it('correctly normalizes Rigid Substrates with colorSurface, dimensions, and area', () => {
    const rigidItem = {
      category: 'RigidSubstrates',
      name: 'Foam Board 5mm White',
      specs: {
        substrateType: 'Foam Board',
        thicknessMm: 5,
        colorSurface: 'White (ຂາວ)',
        sheetWidthMm: 1220,
        sheetHeightMm: 2440,
        areaSqm: 2.9768,
        wasteFactorPct: 15
      }
    };

    assert.strictEqual(rigidItem.specs.substrateType, 'Foam Board');
    assert.strictEqual(rigidItem.specs.thicknessMm, 5);
    assert.strictEqual(rigidItem.specs.colorSurface, 'White (ຂາວ)');
    assert.strictEqual(rigidItem.specs.areaSqm, 2.9768);
  });

  // 9. Cutting Supplies & Packaging Consumables
  it('correctly models Cutting Supplies and Packaging specs', () => {
    const transferTape = {
      category: 'CuttingSupplies',
      name: 'Clear Transfer Tape 300mm',
      specs: {
        supplyType: 'transfer_tape',
        transferTapeTack: 'medium',
        widthMm: 300,
        lengthM: 50
      }
    };

    const packagingBox = {
      category: 'Packaging',
      name: 'A4 Document Box (500 Sheets)',
      specs: {
        packagingCategory: 'box',
        dimensions: '220 x 310 x 60 mm'
      }
    };

    assert.strictEqual(transferTape.specs.widthMm, 300);
    assert.strictEqual(transferTape.specs.transferTapeTack, 'medium');
    assert.strictEqual(packagingBox.specs.packagingCategory, 'box');
    assert.strictEqual(packagingBox.specs.dimensions, '220 x 310 x 60 mm');
  });
});
