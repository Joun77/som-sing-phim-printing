import React, { createContext, useContext, useState, useEffect } from 'react';
import { sampleInboundData } from '../data/sampleInboundData';
import type { AppContextValue } from '../types';

const AppContext = createContext<AppContextValue | null>(null);

const getPastDateString = (daysAgo) => {
  const d = new Date('2026-08-04T09:00:00');
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const getPastDateTimeString = (daysAgo, hour = 9, minute = 30) => {
  const d = new Date('2026-08-04T00:00:00');
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const initialInventory = [
  {
    id: 'paper-a4-80',
    name: 'ເຈ້ຍ A4 Double A 80gsm',
    category: 'Paper',
    stockQty: 1200,
    consumptionUnit: 'Sheet',
    purchaseUnit: 'Ream (500 sheets)',
    purchaseMultiplier: 500,
    costPerPurchaseUnit: 45000,
    costPerConsumptionUnit: 90,
    reorderThreshold: 1000,
    batches: [
      {
        id: 'LOT-A4-001',
        purchaseDate: '2026-07-10',
        supplierName: 'Lao Paper Supplier',
        purchasePricePerReam: 45000,
        costPerSheet: 90,
        initialQty: 1000,
        currentQty: 400,
      },
      {
        id: 'LOT-A4-002',
        purchaseDate: '2026-07-28',
        supplierName: 'Vientiane Import',
        purchasePricePerReam: 50000,
        costPerSheet: 100,
        initialQty: 1000,
        currentQty: 800,
      }
    ]
  },
  {
    id: 'paper-a3-120',
    name: 'ເຈ້ຍ A3 Art Paper 120gsm',
    category: 'Paper',
    stockQty: 800,
    consumptionUnit: 'Sheet',
    purchaseUnit: 'Ream (500 sheets)',
    purchaseMultiplier: 500,
    costPerPurchaseUnit: 110000,
    costPerConsumptionUnit: 220,
    reorderThreshold: 500,
    batches: [
      {
        id: 'LOT-A3-001',
        purchaseDate: '2026-07-15',
        supplierName: 'Lao Paper Supplier',
        purchasePricePerReam: 110000,
        costPerSheet: 220,
        initialQty: 500,
        currentQty: 300,
      },
      {
        id: 'LOT-A3-002',
        purchaseDate: '2026-08-01',
        supplierName: 'Sengsavanh Stationery',
        purchasePricePerReam: 115000,
        costPerSheet: 230,
        initialQty: 500,
        currentQty: 500,
      }
    ]
  },
  {
    id: 'ink-konica-cyan-oem',
    name: 'ນ້ຳໝຶກ Konica Cyan OEM',
    category: 'Ink',
    inkSet: 'Konica C6085 OEM Set',
    stockQty: 120,
    consumptionUnit: 'ml',
    purchaseUnit: 'Bottle (100ml)',
    purchaseMultiplier: 100,
    costPerPurchaseUnit: 180000,
    costPerConsumptionUnit: 1800,
    reorderThreshold: 50,
    batches: [
      { id: 'LOT-KCY-OEM-01', purchaseDate: '2026-07-10', supplierName: 'Konica Lao', purchasePricePerReam: 180000, costPerSheet: 1800, initialQty: 100, currentQty: 60 },
      { id: 'LOT-KCY-OEM-02', purchaseDate: '2026-07-28', supplierName: 'Konica Lao', purchasePricePerReam: 180000, costPerSheet: 1800, initialQty: 100, currentQty: 60 }
    ]
  },
  {
    id: 'ink-konica-magenta-oem',
    name: 'ນ້ຳໝຶກ Konica Magenta OEM',
    category: 'Ink',
    inkSet: 'Konica C6085 OEM Set',
    stockQty: 85,
    consumptionUnit: 'ml',
    purchaseUnit: 'Bottle (100ml)',
    purchaseMultiplier: 100,
    costPerPurchaseUnit: 180000,
    costPerConsumptionUnit: 1800,
    reorderThreshold: 50,
    batches: [
      { id: 'LOT-KMG-OEM-01', purchaseDate: '2026-07-10', supplierName: 'Konica Lao', purchasePricePerReam: 180000, costPerSheet: 1800, initialQty: 100, currentQty: 85 }
    ]
  },
  {
    id: 'ink-konica-yellow-oem',
    name: 'ນ້ຳໝຶກ Konica Yellow OEM',
    category: 'Ink',
    inkSet: 'Konica C6085 OEM Set',
    stockQty: 140,
    consumptionUnit: 'ml',
    purchaseUnit: 'Bottle (100ml)',
    purchaseMultiplier: 100,
    costPerPurchaseUnit: 180000,
    costPerConsumptionUnit: 1800,
    reorderThreshold: 50,
    batches: [
      { id: 'LOT-KYL-OEM-01', purchaseDate: '2026-07-10', supplierName: 'Konica Lao', purchasePricePerReam: 180000, costPerSheet: 1800, initialQty: 100, currentQty: 100 },
      { id: 'LOT-KYL-OEM-02', purchaseDate: '2026-07-28', supplierName: 'Konica Lao', purchasePricePerReam: 180000, costPerSheet: 1800, initialQty: 100, currentQty: 40 }
    ]
  },
  {
    id: 'ink-konica-black-oem',
    name: 'ນ້ຳໝຶກ Konica Black OEM',
    category: 'Ink',
    inkSet: 'Konica C6085 OEM Set',
    stockQty: 45,
    consumptionUnit: 'ml',
    purchaseUnit: 'Bottle (100ml)',
    purchaseMultiplier: 100,
    costPerPurchaseUnit: 180000,
    costPerConsumptionUnit: 1800,
    reorderThreshold: 50,
    batches: [
      { id: 'LOT-KBK-OEM-01', purchaseDate: '2026-07-10', supplierName: 'Konica Lao', purchasePricePerReam: 180000, costPerSheet: 1800, initialQty: 100, currentQty: 45 }
    ]
  },
  {
    id: 'ink-konica-cyan-comp',
    name: 'ນ້ຳໝຶກ Konica Cyan Compatible',
    category: 'Ink',
    inkSet: 'Konica C6085 Compatible Set',
    stockQty: 200,
    consumptionUnit: 'ml',
    purchaseUnit: 'Bottle (100ml)',
    purchaseMultiplier: 100,
    costPerPurchaseUnit: 120000,
    costPerConsumptionUnit: 1200,
    reorderThreshold: 50,
    batches: [
      { id: 'LOT-KCY-COMP-01', purchaseDate: '2026-07-12', supplierName: 'Vientiane Supply', purchasePricePerReam: 120000, costPerSheet: 1200, initialQty: 200, currentQty: 200 }
    ]
  },
  {
    id: 'ink-konica-magenta-comp',
    name: 'ນ້ຳໝຶກ Konica Magenta Compatible',
    category: 'Ink',
    inkSet: 'Konica C6085 Compatible Set',
    stockQty: 190,
    consumptionUnit: 'ml',
    purchaseUnit: 'Bottle (100ml)',
    purchaseMultiplier: 100,
    costPerPurchaseUnit: 120000,
    costPerConsumptionUnit: 1200,
    reorderThreshold: 50,
    batches: [
      { id: 'LOT-KMG-COMP-01', purchaseDate: '2026-07-12', supplierName: 'Vientiane Supply', purchasePricePerReam: 120000, costPerSheet: 1200, initialQty: 200, currentQty: 190 }
    ]
  },
  {
    id: 'ink-konica-yellow-comp',
    name: 'ນ້ຳໝຶກ Konica Yellow Compatible',
    category: 'Ink',
    inkSet: 'Konica C6085 Compatible Set',
    stockQty: 210,
    consumptionUnit: 'ml',
    purchaseUnit: 'Bottle (100ml)',
    purchaseMultiplier: 100,
    costPerPurchaseUnit: 120000,
    costPerConsumptionUnit: 1200,
    reorderThreshold: 50,
    batches: [
      { id: 'LOT-KYL-COMP-01', purchaseDate: '2026-07-12', supplierName: 'Vientiane Supply', purchasePricePerReam: 120000, costPerSheet: 1200, initialQty: 220, currentQty: 210 }
    ]
  },
  {
    id: 'ink-konica-black-comp',
    name: 'ນ້ຳໝຶກ Konica Black Compatible',
    category: 'Ink',
    inkSet: 'Konica C6085 Compatible Set',
    stockQty: 180,
    consumptionUnit: 'ml',
    purchaseUnit: 'Bottle (100ml)',
    purchaseMultiplier: 100,
    costPerPurchaseUnit: 120000,
    costPerConsumptionUnit: 1200,
    reorderThreshold: 50,
    batches: [
      { id: 'LOT-KBK-COMP-01', purchaseDate: '2026-07-12', supplierName: 'Vientiane Supply', purchasePricePerReam: 120000, costPerSheet: 1200, initialQty: 200, currentQty: 180 }
    ]
  },
  {
    id: 'spiral-8',
    name: 'ກະດູກງູ Spiral 8mm',
    category: 'Finishing',
    stockQty: 150,
    consumptionUnit: 'piece',
    purchaseUnit: 'Box (100 pieces)',
    purchaseMultiplier: 100,
    costPerPurchaseUnit: 150000,
    costPerConsumptionUnit: 1500,
    reorderThreshold: 50,
    batches: []
  },
  {
    id: 'sticker-a4',
    name: 'ເຈ້ຍສະຕິກເກີ Glossy A4',
    category: 'Finishing',
    stockQty: 320,
    consumptionUnit: 'Sheet',
    purchaseUnit: 'Pack (100 sheets)',
    purchaseMultiplier: 100,
    costPerPurchaseUnit: 80000,
    costPerConsumptionUnit: 800,
    reorderThreshold: 200,
    batches: []
  }
];



const initialEquipment = [
  {
    id: 'eq-konica',
    name: 'ເຄື່ອງພິມ Konica Minolta C6085',
    purchaseCost: 180000000,
    MachinePrice: 180000000,
    lifespanYears: 5,
    printedPagesCapacity: 2000000,
    TargetTotalPages: 2000000,
    printedCount: 450000,
    calculatedCostPerPage: 90,
    category: 'Printer',
    printerType: 'Laser',
    inkConsumptionStandard: 0.05, // 0.05 ml per A4 @ 5% coverage
    inkUnitCostMl: 500, // 500 LAK per ml
    clickRateColor: 500,
    clickRateBW: 150,
    supportedInkSets: ['Konica C6085 OEM Set', 'Konica C6085 Compatible Set'],
    purchaseDate: '2024-05-15',
    warrantyExpiration: '2027-05-15',
    lastMaintenanceDate: '2026-07-10',
    components: [
      { name: 'Drum Unit (ຊຸດດຣຳ)', usage: 82, threshold: 90 },
      { name: 'Fuser Kit (ຊຸດຄວາມຮ້ອນ)', usage: 45, threshold: 90 },
      { name: 'Waste Toner (ກ່ອງໝຶກເສຍ)', usage: 30, threshold: 95 },
      { name: 'Pickup Rollers (ລູກກິ້ງດຶງເຈ້ຍ)', usage: 60, threshold: 90 }
    ]
  },
  {
    id: 'eq-eba-cutter',
    name: 'ເຄື່ອງຕັດໄຟຟ້າ EBA 5560 Cutter',
    purchaseCost: 45000000,
    lifespanYears: 8,
    printedPagesCapacity: 500000,
    printedCount: 82000,
    calculatedCostPerPage: 90,
    category: 'Cutter',
    printerType: 'Cutter',
    purchaseDate: '2023-11-20',
    warrantyExpiration: '2025-11-20',
    lastMaintenanceDate: '2026-06-15',
    components: [
      { name: 'Blade Lifespan (ໃບມີດ)', usage: 88, threshold: 95 },
      { name: 'Cutting Stick (ແທ່ງຮອງຕັດ)', usage: 50, threshold: 90 },
      { name: 'Hydraulic Oil (ນ້ຳມັນໄຮໂດຼລິກ)', usage: 40, threshold: 90 }
    ]
  },
  {
    id: 'eq-laminator',
    name: 'ເຄື່ອງເຄືອບ GMP 355',
    purchaseCost: 12000000,
    lifespanYears: 4,
    printedPagesCapacity: 150000,
    printedCount: 35000,
    calculatedCostPerPage: 80,
    category: 'Laminator',
    printerType: 'Inkjet',
    purchaseDate: '2025-02-10',
    warrantyExpiration: '2027-02-10',
    lastMaintenanceDate: '2026-05-12',
    components: [
      { name: 'Printhead Status (ຫົວພິມ)', usage: 65, threshold: 90 },
      { name: 'Maintenance Box (ກ່ອງຊັບໝຶກ)', usage: 30, threshold: 90 }
    ]
  }
];

const initialCustomers = [
  { id: 'cust-1', name: 'ສົມພອນ ສີວິໄລ', phone: '020 55667788', address: 'ບ້ານສີຫອມ, ເມືອງຈັນທະບູລີ, ນະຄອນຫຼວງວຽງຈັນ', creditLimit: 2000000, instagram: 'somphone_sivichai', line: 'somphone_sv', facebook: 'Somphone Sivichai' },
  { id: 'cust-2', name: 'ນາງ ແສງດາວ', phone: '020 22334455', address: 'ບ້ານທົ່ງຂັນຄຳ, ເມືອງທ່າແຂກ, ແຂວງຄຳມ່ວນ', creditLimit: 1000000, instagram: 'saengdao_lao', line: 'dao_saeng', facebook: 'Sengdao Lao' },
  { id: 'cust-3', name: 'ຮ້ານອາຫານ ທ່າທາງ', phone: '020 99887766', address: 'ບ້ານດົງໂດກ, ເມືອງໄຊທານີ, ນະຄອນຫຼວງວຽງຈັນ', creditLimit: 3000000, instagram: 'thatang_restaurant', line: 'thatang_res', facebook: 'Thatang Restaurant' },
  { id: 'cust-4', name: 'ໂຮງແຮມ ລ້ານຊ້າງ', phone: '020 77889900', address: 'ຖະໜົນລ້ານຊ້າງ, ເມືອງສີສັດຕະນາກ, ນະຄອນຫຼວງວຽງຈັນ', creditLimit: 5000000, instagram: 'lanexang_hotel_vte', line: 'lx_hotel', facebook: 'Lane Xang Hotel' }
];

const initialOffcuts = [
  { id: 'off-1', name: 'ເສດເຈ້ຍ A3 Art Paper (200x297mm)', qty: 45, paperId: 'paper-a3-120', notes: 'ຕັດເຫຼືອຈາກງານເມນູຮ້ານທ່າທາງ' },
  { id: 'off-2', name: 'ເສດເຈ້ຍສະຕິກເກີ (150x150mm)', qty: 80, paperId: 'sticker-a4', notes: 'ຕັດເຫຼືອຈາກງານຕັດສະຕິກເກີ' }
];

const initialPurchaseOrders = [
  {
    poId: 'PO-260801-01',
    id: 'PO-260801-01',
    date: '2026-08-01',
    purchaseDate: '2026-08-01',
    itemType: 'Material',
    categoryType: 'Materials',
    materialType: 'Paper',
    paperSpec: 'Inkjet Paper',
    itemName: 'ເຈ້ຍ A4 Double A 80gsm',
    supplierName: 'Lao Paper Supplier',
    supplierContact: '020 55667788',
    unitPrice: 45000,
    costPerUnit: 45000,
    totalCost: 90000,
    totalPrice: 90000,
    qty: 2,
    unitName: 'Ream'
  },
  {
    poId: 'PO-260802-01',
    id: 'PO-260802-01',
    date: '2026-08-02',
    purchaseDate: '2026-08-02',
    itemType: 'Equipment',
    categoryType: 'Machinery',
    itemName: 'Epson L15150 Printer',
    supplierName: 'Epson Lao Outlet',
    supplierContact: '020 99887766',
    unitPrice: 15000000,
    costPerUnit: 15000000,
    totalCost: 15000000,
    totalPrice: 15000000,
    qty: 1,
    unitName: 'Unit'
  }
];

const initialOrders = [
  {
    id: 'ord-1001',
    customerName: 'ສົມພອນ ສີວິໄລ',
    phone: '020 55667788',
    date: getPastDateString(2),
    items: [
      { id: 'paper-a4-80', name: 'ເຈ້ຍ A4 Double A 80gsm', quantity: 100, unitCost: 1200 },
      { id: 'spiral-8', name: 'ກະດູກງູ Spiral 8mm', quantity: 2, unitCost: 15000 }
    ],
    totalPriceCharged: 150000,
    depositAmountPaid: 70000,
    remainingUnpaidBalance: 80000,
    paymentMethod: 'BCEL One',
    bankName: 'BCEL',
    paymentStatus: 'Deposit Paid',
    paidDateTime: getPastDateTimeString(2, 9, 45),
    paymentSlipNote: 'ໂອນ BCEL One - ໃບບິນ #8832',
    paymentSlipUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
    status: 'Ready',
    artworkLink: 'https://drive.google.com/somphone-brochure.pdf',
    notes: 'ພິມສີຄຸນນະພາບສູງ ພັບເຄິ່ງ',
    createdTime: getPastDateTimeString(2, 9, 30),
    productionStartTime: getPastDateTimeString(2, 11, 15),
    productionEndTime: getPastDateTimeString(2, 16, 45),
    promisedDeliveryDate: getPastDateString(1),
    actualDeliveryTime: null,
    onTimeStatus: null,
    preflight: {
      cmyk: 'Pass',
      bleed: 'Pass',
      resolution: 'Pass',
      approvedTimestamp: getPastDateTimeString(2, 10, 15),
      versions: [
        { url: 'https://drive.google.com/somphone-brochure.pdf', version: 1, uploadedAt: getPastDateTimeString(2, 9, 30) }
      ]
    },
    activityLog: [
      { timestamp: getPastDateTimeString(2, 16, 45), description: 'ສໍາເລັດ: ກວດສອບ QC (Final QC)' },
      { timestamp: getPastDateTimeString(2, 11, 15), description: 'ປ່ຽນສະຖານະເປັນ: Printing' },
      { timestamp: getPastDateTimeString(2, 10, 15), description: 'ກວດຜ່ານໄຟລ໌ Pre-flight (CMYK, Bleed, Resolution) ແລ້ວ' },
      { timestamp: getPastDateTimeString(2, 9, 45), description: 'ຊຳຣະຍອດມັດຈຳ 70,000 LAK ສໍາເລັດ' },
      { timestamp: getPastDateTimeString(2, 9, 30), description: 'ເປີດອໍເດີໃໝ່ໃນລະบົບ' }
    ]
  },
  {
    id: 'ord-1002',
    customerName: 'ນາງ ແສງດາວ',
    phone: '020 22334455',
    date: getPastDateString(0),
    items: [
      { id: 'sticker-a4', name: 'ເຈ້ຍສະຕິກເກີ Glossy A4', quantity: 50, unitCost: 8000 }
    ],
    totalPriceCharged: 400000,
    depositAmountPaid: 400000,
    remainingUnpaidBalance: 0,
    paymentMethod: 'Cash',
    bankName: '',
    paymentStatus: 'Fully Paid',
    paidDateTime: getPastDateTimeString(0, 8, 45),
    paymentSlipNote: 'ຈ່າຍເງິນສົດໜ້າຮ້ານ',
    paymentSlipUrl: '',
    status: 'Printing',
    artworkLink: 'https://drive.google.com/sengdao-stickers.ai',
    notes: 'ຕັດຫຼ່ຽມມົນ ກັນນ້ຳ',
    createdTime: getPastDateTimeString(0, 8, 30),
    productionStartTime: getPastDateTimeString(0, 10, 0),
    productionEndTime: null,
    promisedDeliveryDate: getPastDateString(0),
    actualDeliveryTime: null,
    onTimeStatus: null,
    preflight: {
      cmyk: 'Pass',
      bleed: 'Fail',
      resolution: 'Pass',
      approvedTimestamp: null,
      versions: [
        { url: 'https://drive.google.com/sengdao-stickers.ai', version: 2, uploadedAt: getPastDateTimeString(0, 9, 15) },
        { url: 'https://drive.google.com/sengdao-stickers-v1.ai', version: 1, uploadedAt: getPastDateTimeString(0, 8, 30) }
      ]
    },
    activityLog: [
      { timestamp: getPastDateTimeString(0, 10, 0), description: 'ປ່ຽນສະຖານະເປັນ: Printing' },
      { timestamp: getPastDateTimeString(0, 9, 15), description: 'ອັບໂຫຼດໄຟລ໌ອາດເວີກເວີຊັນ 2' },
      { timestamp: getPastDateTimeString(0, 8, 45), description: 'ຊຳຣະຍອດມັດຈຳ 400,000 LAK ສໍາເລັດ' },
      { timestamp: getPastDateTimeString(0, 8, 30), description: 'ເປີດອໍເດີໃໝ່ໃນລະບົບ' }
    ]
  },
  {
    id: 'ord-1003',
    customerName: 'ຮ້ານອາຫານ ທ່າທາງ',
    phone: '020 99887766',
    date: getPastDateString(3),
    items: [
      { id: 'paper-a3-120', name: 'ເຈ້ຍ A3 Art Paper 120gsm', quantity: 30, unitCost: 15000 }
    ],
    totalPriceCharged: 450000,
    depositAmountPaid: 450000,
    remainingUnpaidBalance: 0,
    paymentMethod: 'BCEL One',
    bankName: 'BCEL',
    paymentStatus: 'Fully Paid',
    paidDateTime: getPastDateTimeString(3, 10, 10),
    paymentSlipNote: 'ໂອນຜ່ານ App - ໃບບິນ #1129',
    paymentSlipUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    status: 'Delivered',
    artworkLink: 'https://drive.google.com/menu-v2.pdf',
    notes: 'ປົກແຂງ ເຄືອບເງົາ',
    createdTime: getPastDateTimeString(3, 9, 30),
    productionStartTime: getPastDateTimeString(3, 11, 0),
    productionEndTime: getPastDateTimeString(3, 15, 0),
    promisedDeliveryDate: getPastDateString(2),
    actualDeliveryTime: getPastDateTimeString(2, 14, 0),
    onTimeStatus: 'Late',
    preflight: {
      cmyk: 'Pass',
      bleed: 'Pass',
      resolution: 'Pass',
      approvedTimestamp: getPastDateTimeString(3, 9, 45),
      versions: [
        { url: 'https://drive.google.com/menu-v2.pdf', version: 1, uploadedAt: getPastDateTimeString(3, 9, 30) }
      ]
    },
    activityLog: [
      { timestamp: getPastDateTimeString(2, 14, 0), description: 'ປ່ຽນສະຖານະເປັນ: Delivered (ຈັດສົ່ງສຳເລັດ)' },
      { timestamp: getPastDateTimeString(3, 15, 0), description: 'ສໍາເລັດ: ກວດສອບ QC (Final QC)' },
      { timestamp: getPastDateTimeString(3, 11, 0), description: 'ປ່ຽນສະຖານະເປັນ: Printing' },
      { timestamp: getPastDateTimeString(3, 10, 10), description: 'ຊຳຣະຍອດມັດຈຳ 450,000 LAK ສໍາເລັດ' },
      { timestamp: getPastDateTimeString(3, 9, 30), description: 'ເປີດອໍເດີໃໝ່ໃນລະບົບ' }
    ]
  }
];

const initialSpoilageLogs = [
  {
    id: 'sp-1',
    date: getPastDateString(2),
    materialId: 'paper-a4-80',
    materialName: 'ເຈ້ຍ A4 Double A 80gsm',
    quantity: 15,
    unitCost: 90,
    totalCost: 1350,
    cause: 'ເຈ້ຍຕິດຢູ່ໃນເຄື່ອງພິມ Konica',
  }
];

// Multi-Currency configuration (all internal values are stored in LAK base)
const CURRENCY_META = {
  LAK: { symbol: '₭', locale: 'lo-LA', currency: 'LAK', rate: 1 },
  THB: { symbol: '฿', locale: 'th-TH', currency: 'THB', rate: 700 },
  USD: { symbol: '$', locale: 'en-US', currency: 'USD', rate: 21000 }
};

const initialQuotations = [
  {
    id: 'quot-260801-01',
    quotationNumber: 'Q-260801-01',
    customerName: 'ສົມພອນ ສີວິໄລ',
    phone: '020 55667788',
    status: 'Accepted',
    version: 2,
    versions: [
      { version: 1, date: getPastDateString(6), total: 262500, note: 'ປະມານເບື້ອງຕົ້ນ (Initial estimate)' },
      { version: 2, date: getPastDateString(3), total: 232500, note: 'ປັບລົງ 5% (Revised -5% discount)' }
    ],
    items: [
      { name: 'ເຈ້ຍ A4 Double A 80gsm (ພິມ 100 ແຜ່ນ)', quantity: 100, unitPrice: 1200 },
      { name: 'ກະດູກງູ Spiral 8mm', quantity: 2, unitPrice: 15000 }
    ],
    subtotal: 150000,
    discountPercent: 5,
    taxEnabled: true,
    taxRate: 7,
    taxAmount: 9975,
    grandTotal: 232500,
    expiresAt: '2026-08-31',
    paymentTerms: '50% Deposit / 50% on Delivery',
    createdAt: getPastDateString(6),
    convertedOrderId: 'ord-1001',
    notes: 'ລູກຄ້າຮັບເຄີຍງານສີຄຸນນະພາບສູງ'
  },
  {
    id: 'quot-260802-02',
    quotationNumber: 'Q-260802-02',
    customerName: 'ຮ້ານອາຫານ ທ່າທາງ',
    phone: '020 99887766',
    status: 'Pending',
    version: 1,
    versions: [
      { version: 1, date: getPastDateString(2), total: 318500, note: 'ເມນູໃໝ່ ປົກແຂງ 50 ຊຸດ' }
    ],
    items: [
      { name: 'ເຈ້ຍ A3 Art Paper 120gsm (ເມນູ 30 ແຜ່ນ)', quantity: 30, unitPrice: 15000 }
    ],
    subtotal: 450000,
    discountPercent: 0,
    taxEnabled: true,
    taxRate: 7,
    taxAmount: 31500,
    grandTotal: 481500,
    expiresAt: '2026-08-20',
    paymentTerms: 'Immediate / Cash',
    createdAt: getPastDateString(2),
    convertedOrderId: null,
    notes: ''
  }
];

const initialEmployees = [
  {
    id: 'EMP-001',
    name: 'ສົມຈິດ ແກ້ວມະນີ',
    nameEn: 'Somchit Kaewmanee',
    role: 'press_operator',
    phone: '020-5551-0001',
    address: 'ບ້ານ ສາຍລົມ, ວຽງຈັນ',
    salary: 2500000,
    salaryType: 'monthly',
    startDate: '2024-01-15',
    status: 'active',
    attendance: { present: 22, absent: 1, late: 2 },
    skills: ['Digital Printing', 'CMYK Calibration', 'Mimaki Operation'],
    shift: 'morning',
    avatar: 'SC',
    rating: 4.8,
    assignedMachines: ['eq-konica'],
    pieceRatePerImpression: 15,
    impressionsProduced: 85000,
    salesCommissionRate: 0
  },
  {
    id: 'EMP-002',
    name: 'ນາງ ມາລີ ວົງສະຫວັນ',
    nameEn: 'Malee Vongsavanh',
    role: 'cutting_finishing',
    phone: '020-5551-0002',
    address: 'ບ້ານ ໂພນຕ້ອງ, ວຽງຈັນ',
    salary: 2200000,
    salaryType: 'monthly',
    startDate: '2024-03-10',
    status: 'active',
    attendance: { present: 23, absent: 0, late: 1 },
    skills: ['Guillotine Cutting', 'Lamination', 'Binding'],
    shift: 'morning',
    avatar: 'ML',
    rating: 4.9,
    assignedMachines: ['eq-eba-cutter'],
    pieceRatePerImpression: 0,
    impressionsProduced: 0,
    salesCommissionRate: 0
  },
  {
    id: 'EMP-003',
    name: 'ຄຳສອນ ພົມມະວົງ',
    nameEn: 'Khamson Phommavong',
    role: 'design_prepress',
    phone: '020-5551-0003',
    address: 'ບ້ານ ດົງໂດກ, ວຽງຈັນ',
    salary: 3000000,
    salaryType: 'monthly',
    startDate: '2023-11-01',
    status: 'active',
    attendance: { present: 21, absent: 2, late: 0 },
    skills: ['Adobe Illustrator', 'Photoshop', 'Prepress QC', 'Artwork'],
    shift: 'morning',
    avatar: 'KS',
    rating: 4.7,
    assignedMachines: [],
    pieceRatePerImpression: 0,
    impressionsProduced: 0,
    salesCommissionRate: 0
  },
  {
    id: 'EMP-004',
    name: 'ບຸນທ່ຽນ ໄຊຍະວົງ',
    nameEn: 'Bountien Xaiyavong',
    role: 'delivery_logistics',
    phone: '020-5551-0004',
    address: 'ບ້ານ ສີວິໄລ, ວຽງຈັນ',
    salary: 2000000,
    salaryType: 'monthly',
    startDate: '2024-06-01',
    status: 'active',
    attendance: { present: 20, absent: 2, late: 3 },
    skills: ['Kerry Lao', 'BCEL Express', 'Route Planning'],
    shift: 'afternoon',
    avatar: 'BT',
    rating: 4.3,
    assignedMachines: [],
    pieceRatePerImpression: 0,
    impressionsProduced: 0,
    salesCommissionRate: 0
  },
  {
    id: 'EMP-005',
    name: 'ນາງ ບົວທອງ ລາດຊາວົງ',
    nameEn: 'Bouathong Ratsavong',
    role: 'customer_service',
    phone: '020-5551-0005',
    address: 'ບ້ານ ທ່ານົກ, ວຽງຈັນ',
    salary: 2300000,
    salaryType: 'monthly',
    startDate: '2024-02-20',
    status: 'active',
    attendance: { present: 24, absent: 0, late: 0 },
    skills: ['Order Intake', 'WhatsApp/LINE CRM', 'Customer Follow-up'],
    shift: 'morning',
    avatar: 'BT2',
    rating: 5.0,
    assignedMachines: [],
    pieceRatePerImpression: 0,
    impressionsProduced: 0,
    salesCommissionRate: 2
  }
];

const initialMachineStatus = {
  'eq-konica': { status: 'running', lastChanged: getPastDateTimeString(0, 8, 0) },
  'eq-eba-cutter': { status: 'setup', lastChanged: getPastDateTimeString(0, 9, 0) },
  'eq-laminator': { status: 'running', lastChanged: getPastDateTimeString(0, 8, 30) }
};

const initialDowntimeLogs = [
  {
    id: 'dt-1',
    equipmentId: 'eq-konica',
    equipmentName: 'ເຄື່ອງພິມ Konica Minolta C6085',
    startTime: getPastDateTimeString(1, 10, 15),
    endTime: getPastDateTimeString(1, 11, 40),
    downtimeMinutes: 85,
    reason: 'No Material',
    description: 'ລໍຖ້າເຈ້ຍ A4 ເຂົ້າໃໝ່ (Waiting for A4 paper restock)'
  }
];

const initialPurchaseRequisitions = [
  {
    id: 'PR-260801-01',
    prNumber: 'PR-260801-01',
    date: getPastDateString(3),
    materialId: 'ink-konica-black-oem',
    materialName: 'ນ້ຳໝຶກ Konica Black OEM',
    category: 'Ink',
    qty: 2,
    unit: 'Bottle (100ml)',
    currentStock: 45,
    reorderThreshold: 50,
    reason: 'Reorder Point (ROP) alert',
    status: 'Open'
  }
];

const initialDeliveries = [
  {
    id: 'dlv-1',
    orderId: 'ord-1003',
    customerName: 'ຮ້ານອາຫານ ທ່າທາງ',
    courier: 'In-house Driver',
    trackingNumber: 'SOMSING-1003',
    dispatchedAt: getPastDateTimeString(2, 13, 0),
    status: 'Delivered',
    deliveredAt: getPastDateTimeString(2, 14, 0),
    podSignature: '',
    podPhoto: '',
    notes: ''
  }
];

const initialPrinterColorLinks = [
  { id: 'lnk-1', assetId: 'eq-konica', inkCode: 'ink-konica-cyan-oem', slotPosition: 'Cyan (C)', notes: 'OEM Ink for C6085' },
  { id: 'lnk-2', assetId: 'eq-konica', inkCode: 'ink-konica-magenta-oem', slotPosition: 'Magenta (M)', notes: 'OEM Ink for C6085' },
  { id: 'lnk-3', assetId: 'eq-konica', inkCode: 'ink-konica-yellow-oem', slotPosition: 'Yellow (Y)', notes: 'OEM Ink for C6085' },
  { id: 'lnk-4', assetId: 'eq-konica', inkCode: 'ink-konica-black-oem', slotPosition: 'Black (K)', notes: 'OEM Ink for C6085' }
];

const ROLE_OPTIONS = [
  { id: 'admin', labelLo: 'ຜູ້ບໍລິຫານ (Admin)', labelEn: 'Admin' },
  { id: 'sales', labelLo: 'ຝ່າຍຂາຍ (Sales)', labelEn: 'Sales' },
  { id: 'press_operator', labelLo: 'ຊ່າງພິມ (Press Operator)', labelEn: 'Press Operator' },
  { id: 'inventory_manager', labelLo: 'ຜູ້ຈັດການຄັງ (Inventory Manager)', labelEn: 'Inventory Manager' },
  { id: 'accountant', labelLo: 'ນັກບັນຊີ (Accountant)', labelEn: 'Accountant' }
];

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [focusOrderId, setFocusOrderId] = useState(null);
  const [preselectedCustomerName, setPreselectedCustomerName] = useState('');
  const [prefilledOrderSpecs, setPrefilledOrderSpecs] = useState(null);
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'warning' }
  const [confirmDialog, setConfirmDialog] = useState(null); // { message: '', onConfirm: () => void, onCancel: () => void }

  // ---- Multi-currency (internal values always stored in LAK base) ----
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('ss_print_currency_v6');
    return saved && CURRENCY_META[saved] ? saved : 'LAK';
  });

  useEffect(() => {
    safeSetItem('ss_print_currency_v6', currency);
  }, [currency]);

  // Daily exchange-rate table with BUY & SELL rates (LAK per 1 unit) for THB & USD.
  // LAK is the base currency and is always fixed at 1 / 1.
  const DEFAULT_RATES = {
    THB: { buy: 680, sell: 700 },
    USD: { buy: 21000, sell: 21800 },
  };

  // Normalize persisted (or legacy flat) rate values into { buy, sell } objects
  const normalizeRate = (val) => {
    if (val && typeof val === 'object' && 'buy' in val && 'sell' in val) {
      return { buy: Math.max(1, Math.round(Number(val.buy) || 0)), sell: Math.max(1, Math.round(Number(val.sell) || 0)) };
    }
    const flat = Math.max(1, Math.round(Number(val) || 0));
    return { buy: flat, sell: flat };
  };

  const [exchangeRates, setExchangeRates] = useState(() => {
    const saved = localStorage.getItem('ss_print_rates_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const out = {};
        ['THB', 'USD'].forEach(code => {
          out[code] = normalizeRate(parsed[code]);
        });
        return out;
      } catch (e) { /* fall through to defaults */ }
    }
    return DEFAULT_RATES;
  });

  // Which side of the rate is used to convert internal LAK amounts for display.
  // 'sell' = price shown in foreign currency uses the shop's sell rate (default).
  const [rateMode, setRateMode] = useState(() => {
    const saved = localStorage.getItem('ss_print_rate_mode_v1');
    return saved === 'buy' || saved === 'sell' ? saved : 'sell';
  });

  const [ratesUpdatedAt, setRatesUpdatedAt] = useState(() => {
    return localStorage.getItem('ss_print_rates_updated_v1') || '';
  });
  const [isRatesOpen, setIsRatesOpen] = useState(false);

  useEffect(() => {
    safeSetItem('ss_print_rates_v1', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  useEffect(() => {
    safeSetItem('ss_print_rate_mode_v1', rateMode);
  }, [rateMode]);

  useEffect(() => {
    safeSetItem('ss_print_rates_updated_v1', ratesUpdatedAt);
  }, [ratesUpdatedAt]);

  // Manual rate update for one side of a currency (buy / sell)
  const updateExchangeRate = (code, side, rate) => {
    const num = Math.max(1, Math.round(Number(rate) || 0));
    setExchangeRates(prev => {
      const cur = normalizeRate(prev[code]);
      return { ...prev, [code]: { buy: cur.buy, sell: cur.sell, [side]: num } };
    });
    setRatesUpdatedAt(new Date().toISOString());
  };

  const getRate = (code) => {
    if (code === 'LAK') return 1;
    const cur = normalizeRate(exchangeRates[code]);
    return rateMode === 'buy' ? cur.buy : cur.sell;
  };

  const formatCurrency = (num) => {
    const meta = CURRENCY_META[currency] || CURRENCY_META.LAK;
    const converted = (Number(num) || 0) / getRate(currency);
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: meta.currency,
      maximumFractionDigits: meta.currency === 'USD' ? 2 : 0,
      minimumFractionDigits: 0
    };
    try {
      return new Intl.NumberFormat(meta.locale, options).format(converted);
    } catch (e) {
      return `${meta.symbol}${converted.toLocaleString()}`;
    }
  };

  const convertToCurrency = (num) => {
    return (Number(num) || 0) / getRate(currency);
  };

  // ---- Quotations (versioning / expiry / convert-to-order) ----
  const [quotations, setQuotations] = useState(() => {
    const saved = localStorage.getItem('ss_print_quotations_v6');
    return saved ? JSON.parse(saved) : initialQuotations;
  });

  useEffect(() => {
    safeSetItem('ss_print_quotations_v6', quotations);
  }, [quotations]);

  // ---- Employees (persisted, includes machine assignments & incentives) ----
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('ss_print_employees_v6');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  useEffect(() => {
    safeSetItem('ss_print_employees_v6', employees);
  }, [employees]);

  // ---- Machine status widget (Running / Setup / Downtime / Maintenance) ----
  const [machineStatus, setMachineStatus] = useState(() => {
    const saved = localStorage.getItem('ss_print_machine_status_v6');
    return saved ? JSON.parse(saved) : initialMachineStatus;
  });

  useEffect(() => {
    safeSetItem('ss_print_machine_status_v6', machineStatus);
  }, [machineStatus]);

  const [downtimeLogs, setDowntimeLogs] = useState(() => {
    const saved = localStorage.getItem('ss_print_downtime_logs_v6');
    return saved ? JSON.parse(saved) : initialDowntimeLogs;
  });

  useEffect(() => {
    safeSetItem('ss_print_downtime_logs_v6', downtimeLogs);
  }, [downtimeLogs]);

  // ---- Purchase Requisitions (ROP generated) ----
  const [purchaseRequisitions, setPurchaseRequisitions] = useState(() => {
    const saved = localStorage.getItem('ss_print_purchase_requisitions_v6');
    return saved ? JSON.parse(saved) : initialPurchaseRequisitions;
  });

  useEffect(() => {
    safeSetItem('ss_print_purchase_requisitions_v6', purchaseRequisitions);
  }, [purchaseRequisitions]);

  // ---- Deliveries / Dispatch tracker ----
  const [deliveries, setDeliveries] = useState(() => {
    const saved = localStorage.getItem('ss_print_deliveries_v6');
    return saved ? JSON.parse(saved) : initialDeliveries;
  });

  useEffect(() => {
    safeSetItem('ss_print_deliveries_v6', deliveries);
  }, [deliveries]);

  // ---- Role-Based Access Control (simulation) ----
  const [activeRole, setActiveRole] = useState(() => {
    const saved = localStorage.getItem('ss_print_active_role_v6');
    return saved || 'admin';
  });

  useEffect(() => {
    safeSetItem('ss_print_active_role_v6', activeRole);
  }, [activeRole]);

  const canAccess = (permission) => {
    // Admin has all permissions; simple per-role capability map
    const capabilities = {
      admin: ['financials', 'pricing', 'approve', 'delete', 'maintenance', 'delivery', 'hr', 'inventory'],
      sales: ['orders', 'quotation', 'pricing', 'delivery', 'customers'],
      press_operator: ['orders', 'production', 'machineStatus', 'maintenance'],
      inventory_manager: ['inventory', 'inbound', 'purchaseRequisition', 'delivery'],
      accountant: ['financials', 'inventory', 'delivery']
    };
    const caps = capabilities[activeRole] || [];
    if (activeRole === 'admin') return true;
    return caps.includes(permission);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const askConfirmation = (message, onConfirm) => {
    setConfirmDialog({
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      },
      onCancel: () => {
        setConfirmDialog(null);
      }
    });
  };

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('ss_print_inventory_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const unique = [];
        const seen = new Set();
        for (const item of parsed) {
          if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
          }
        }
        return unique;
      } catch (e) {
        return initialInventory;
      }
    }
    return initialInventory;
  });
  const [equipment, setEquipment] = useState(() => {
    const saved = localStorage.getItem('ss_print_equipment_v6');
    return saved ? JSON.parse(saved) : initialEquipment;
  });
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('ss_print_orders_v6');
    return saved ? JSON.parse(saved) : initialOrders;
  });
  const [spoilageLogs, setSpoilageLogs] = useState(() => {
    const saved = localStorage.getItem('ss_print_spoilage_v6');
    return saved ? JSON.parse(saved) : initialSpoilageLogs;
  });
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('ss_print_customers_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((c, idx) => ({
          instagram: '',
          line: '',
          facebook: '',
          ...c,
          id: c.id || `cust-${idx}-${Date.now().toString().slice(-4)}`
        }));
      } catch (e) {
        return initialCustomers;
      }
    }
    return initialCustomers;
  });
  const [linkedInboundEntries, setLinkedInboundEntries] = useState(() => {
    const saved = localStorage.getItem('ss_print_inbound_entries_v6');
    return saved ? JSON.parse(saved) : sampleInboundData;
  });
  const [printerColorLinks, setPrinterColorLinks] = useState(() => {
    const saved = localStorage.getItem('ss_print_color_links_v6');
    return saved ? JSON.parse(saved) : initialPrinterColorLinks;
  });
  const [offcuts, setOffcuts] = useState(() => {
    const saved = localStorage.getItem('ss_print_offcuts_v6');
    return saved ? JSON.parse(saved) : initialOffcuts;
  });
  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    const saved = localStorage.getItem('ss_print_purchase_orders_v6');
    return saved ? JSON.parse(saved) : initialPurchaseOrders;
  });

  // Free up space by stripping base64 images from large keys
  const freeLocalStorageSpace = () => {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ss_print_')) {
          const val = localStorage.getItem(key);
          keys.push({ key, size: val ? val.length : 0, val });
        }
      }
      keys.sort((a, b) => b.size - a.size);
      for (const item of keys) {
        if (item.size > 15000) {
          try {
            const parsed = JSON.parse(item.val);
            const sanitizeValue = (val) => {
              if (typeof val === 'string' && val.length > 1000 && (val.startsWith('data:image/') || val.includes(';base64,'))) {
                return '[TRUNCATED_TO_FREE_SPACE]';
              }
              if (Array.isArray(val)) return val.map(sanitizeValue);
              if (val !== null && typeof val === 'object') {
                const res = {};
                for (const k in val) res[k] = sanitizeValue(val[k]);
                return res;
              }
              return val;
            };
            const sanitized = sanitizeValue(parsed);
            localStorage.setItem(item.key, JSON.stringify(sanitized));
            console.log(`[LocalStorage] Cleaned up large key to free space: "${item.key}"`);
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('[LocalStorage] Error during space recovery', err);
    }
  };

  // Safe LocalStorage setter with fallback to prevent QuotaExceededError when storing Base64 images
  const safeSetItem = (key, data) => {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    try {
      localStorage.setItem(key, serialized);
    } catch (err) {
      console.warn(`[LocalStorage] Quota exceeded on key "${key}". Attempting to free space...`, err);
      freeLocalStorageSpace();
      try {
        localStorage.setItem(key, serialized);
      } catch (retryErr) {
        console.error(`[LocalStorage] Still unable to write key "${key}" after freeing space.`, retryErr);
      }
    }
  };

  // Sync to localstorage safely
  useEffect(() => {
    safeSetItem('ss_print_inventory_v6', inventory);
  }, [inventory]);

  useEffect(() => {
    safeSetItem('ss_print_equipment_v6', equipment);
  }, [equipment]);

  useEffect(() => {
    safeSetItem('ss_print_orders_v6', orders);
  }, [orders]);

  useEffect(() => {
    safeSetItem('ss_print_spoilage_v6', spoilageLogs);
  }, [spoilageLogs]);

  useEffect(() => {
    safeSetItem('ss_print_customers_v6', customers);
  }, [customers]);

  useEffect(() => {
    safeSetItem('ss_print_offcuts_v6', offcuts);
  }, [offcuts]);

  useEffect(() => {
    safeSetItem('ss_print_purchase_orders_v6', purchaseOrders);
  }, [purchaseOrders]);

  useEffect(() => {
    safeSetItem('ss_print_inbound_entries_v6', linkedInboundEntries);
  }, [linkedInboundEntries]);

  useEffect(() => {
    safeSetItem('ss_print_color_links_v6', printerColorLinks);
  }, [printerColorLinks]);

  // Master Categories Registry & Specs Pool Persistence
  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem('ss_print_custom_categories_v6');
    return saved ? JSON.parse(saved) : [];
  });

  const [masterSpecsPool, setMasterSpecsPool] = useState(() => {
    const saved = localStorage.getItem('ss_print_master_specs_pool_v6');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    safeSetItem('ss_print_custom_categories_v6', customCategories);
  }, [customCategories]);

  useEffect(() => {
    safeSetItem('ss_print_master_specs_pool_v6', masterSpecsPool);
  }, [masterSpecsPool]);

  // Solver for overdue orders
  useEffect(() => {
    const todayStr = '2026-08-04';
    setOrders(prev => {
      let changed = false;
      const updated = prev.map(ord => {
        if (
          ord.status !== 'Delivered' &&
          ord.remainingUnpaidBalance > 0 &&
          ord.promisedDeliveryDate < todayStr &&
          ord.paymentStatus !== 'Overdue'
        ) {
          changed = true;
          return {
            ...ord,
            paymentStatus: 'Overdue'
          };
        }
        return ord;
      });
      return changed ? updated : prev;
    });
  }, []);

  // FIFO Paper Costing functions
  const getFIFOCostPerSheet = (itemId, sheetsNeeded) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return 0;
    if (!item.batches || item.batches.length === 0) {
      return item.costPerConsumptionUnit;
    }

    const sortedBatches = [...item.batches]
      .filter(b => b.currentQty > 0)
      .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));

    if (sortedBatches.length === 0) {
      return item.costPerConsumptionUnit;
    }

    let remainingNeeded = sheetsNeeded;
    let accumulatedCost = 0;

    for (let batch of sortedBatches) {
      const take = Math.min(remainingNeeded, batch.currentQty);
      accumulatedCost += take * batch.costPerSheet;
      remainingNeeded -= take;
      if (remainingNeeded <= 0) break;
    }

    if (remainingNeeded > 0) {
      accumulatedCost += remainingNeeded * item.costPerConsumptionUnit;
    }

    return accumulatedCost / sheetsNeeded;
  };

  const deductStockFIFO = (itemId, sheetsNeeded) => {
    setInventory(prev => {
      return prev.map(item => {
        if (item.id !== itemId) return item;
        
        if (!item.batches || item.batches.length === 0) {
          return {
            ...item,
            stockQty: Math.max(0, item.stockQty - sheetsNeeded)
          };
        }

        let remaining = sheetsNeeded;
        const updatedBatches = item.batches
          .map(b => ({ ...b }))
          .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));

        for (let batch of updatedBatches) {
          if (batch.currentQty > 0) {
            const take = Math.min(remaining, batch.currentQty);
            batch.currentQty -= take;
            remaining -= take;
            if (remaining <= 0) break;
          }
        }

        const newStockQty = updatedBatches.reduce((sum, b) => sum + b.currentQty, 0);

        return {
          ...item,
          batches: updatedBatches,
          stockQty: newStockQty,
          costPerConsumptionUnit: updatedBatches.find(b => b.currentQty > 0)?.costPerSheet || item.costPerConsumptionUnit
        };
      });
    });
  };

  // Add a new batch to inventory
  const addInventoryBatch = (itemId, batchData) => {
    setInventory(prev => {
      return prev.map(item => {
        if (item.id !== itemId) return item;

        const multiplier = item.purchaseMultiplier || 1;
        const sheetsToAdd = batchData.purchaseQty * multiplier;
        const costPerSheet = Math.round(batchData.purchasePrice / multiplier);

        const newBatch = {
          id: batchData.batchId || `LOT-${Date.now().toString().slice(-4)}`,
          purchaseDate: batchData.purchaseDate || new Date().toISOString().split('T')[0],
          supplierName: batchData.supplierName || 'Unknown Vendor',
          purchasePricePerReam: Number(batchData.purchasePrice),
          costPerSheet,
          initialQty: sheetsToAdd,
          currentQty: sheetsToAdd,
        };

        const updatedBatches = [...(item.batches || []), newBatch];
        const newStockQty = updatedBatches.reduce((sum, b) => sum + b.currentQty, 0);

        return {
          ...item,
          batches: updatedBatches,
          stockQty: newStockQty,
          costPerConsumptionUnit: costPerSheet
        };
      });
    });
  };

  // Add or Update a SKU/Material Definition with API persistence
  const addInventorySku = (itemData) => {
    const newSku = {
      id: itemData.id || `${itemData.category?.toLowerCase() || 'sku'}-${Date.now().toString().slice(-4)}`,
      name: itemData.name,
      category: itemData.category,
      stockQty: Number(itemData.stockQty) || 0,
      consumptionUnit: itemData.consumptionUnit || 'Sheet',
      purchaseUnit: itemData.purchaseUnit || 'Pack',
      purchaseMultiplier: Number(itemData.purchaseMultiplier) || 1,
      costPerPurchaseUnit: Number(itemData.costPerPurchaseUnit) || 0,
      costPerConsumptionUnit: Number(itemData.costPerConsumptionUnit) || 0,
      reorderThreshold: Number(itemData.reorderThreshold) || 10,
      technical_specs: itemData.technical_specs || itemData.specs || {},
      batches: [],
      ...itemData
    };

    setInventory(prev => {
      const idx = prev.findIndex(i => i.id === newSku.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...newSku };
        return next;
      }
      return [...prev, newSku];
    });

    // Send JSON payload to Backend API
    fetch(`/api/inventory/items/${newSku.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSku)
    }).catch(err => console.log('API persistence notice:', err));
  };

  const quickAdjustStock = (itemId, adjustment) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.stockQty + adjustment);
        return {
          ...item,
          stockQty: newQty
        };
      }
      return item;
    }));
  };

  const deleteInventoryBatch = (itemId, batchId) => {
    setInventory(prev => {
      return prev.map(item => {
        if (item.id !== itemId) return item;
        const updatedBatches = (item.batches || []).filter(b => b.id !== batchId);
        const newStockQty = updatedBatches.reduce((sum, b) => sum + b.currentQty, 0);
        return {
          ...item,
          batches: updatedBatches,
          stockQty: newStockQty
        };
      });
    });
  };

  const editInventoryBatch = (itemId, batchId, updatedFields) => {
    setInventory(prev => {
      return prev.map(item => {
        if (item.id !== itemId) return item;
        const updatedBatches = (item.batches || []).map(b => {
          if (b.id !== batchId) return b;
          const updated = { ...b, ...updatedFields };
          if (updatedFields.purchasePricePerReam !== undefined) {
            const multiplier = item.purchaseMultiplier || 1;
            updated.costPerSheet = Math.round(Number(updated.purchasePricePerReam) / multiplier);
          }
          return updated;
        });
        const newStockQty = updatedBatches.reduce((sum, b) => sum + b.currentQty, 0);
        return {
          ...item,
          batches: updatedBatches,
          stockQty: newStockQty
        };
      });
    });
  };
  const editInventorySku = (itemId, updatedFields) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, ...updatedFields };
      }
      return item;
    }));
  };

  // CRM Credit Limit Check
  const checkCreditLimit = (customerName, newOrderAmount) => {
    const cust = customers.find(c => c.name === customerName);
    const limit = cust ? cust.creditLimit : 1000000; // default 1,000,000 credit limit

    const currentUnpaid = orders
      .filter(o => o.customerName === customerName && o.status !== 'Delivered')
      .reduce((sum, o) => sum + o.remainingUnpaidBalance, 0);

    const totalPotential = currentUnpaid + newOrderAmount;

    return {
      exceeded: totalPotential > limit,
      limit,
      currentUnpaid,
      totalPotential
    };
  };

  // Offcut management
  const addOffcut = (offcutData) => {
    const newOffcut = {
      id: `off-${Date.now().toString().slice(-4)}`,
      name: offcutData.name,
      qty: Number(offcutData.qty),
      paperId: offcutData.paperId,
      notes: offcutData.notes || ''
    };
    setOffcuts(prev => [newOffcut, ...prev]);
  };

  const consumeOffcut = (offcutId, qtyToUse) => {
    setOffcuts(prev => {
      return prev.map(off => {
        if (off.id === offcutId) {
          return {
            ...off,
            qty: Math.max(0, off.qty - Number(qtyToUse))
          };
        }
        return off;
      }).filter(off => off.qty > 0); // remove if exhausted
    });
  };

  // Pre-flight checkers
  const updatePreflightCheck = (orderId, field, value) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const pf = ord.preflight || { cmyk: 'Not Checked', bleed: 'Not Checked', resolution: 'Not Checked', approvedTimestamp: null, versions: [] };
        let updatedPf = { ...pf, [field]: value };
        
        // Auto stamp approval if all fields pass or when approved manually
        if (field === 'approvedTimestamp' && value) {
          updatedPf.approvedTimestamp = value;
        } else if (updatedPf.cmyk === 'Pass' && updatedPf.bleed === 'Pass' && updatedPf.resolution === 'Pass' && !updatedPf.approvedTimestamp) {
          updatedPf.approvedTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
        }

        const logs = ord.activityLog || [];
        const newLog = {
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          description: `ກວດສອບອາດເວີກ Pre-flight: ${field} = ${value}`
        };

        return {
          ...ord,
          preflight: updatedPf,
          activityLog: [newLog, ...logs]
        };
      }
      return ord;
    }));
  };

  const updateProductionStep = (orderId, stepKey, isDone) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const steps = ord.productionStepsCompleted || {};
        const stepNames = {
          preflight: 'ກວດສອບໄຟລ໌ (File Validation)',
          printing: 'ພິມແຜ່ນງານ (Press Printing)',
          cutting: 'ຕັດແລະເຄືອບ (Cutting & Binding)',
          qc: 'ກວດສອບ QC (Final QC)'
        };
        const statusText = isDone ? 'ສໍາເລັດ (Completed)' : 'ຍົກເລີก (Cancelled)';
        const logDesc = `ຂັ້ນຕອນການຜະລິດ: ${stepNames[stepKey] || stepKey} ແມ່ນ ${statusText}`;
        
        const logs = ord.activityLog || [];
        const newLog = {
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          description: logDesc
        };

        return {
          ...ord,
          productionStepsCompleted: {
            ...steps,
            [stepKey]: isDone
          },
          activityLog: [newLog, ...logs]
        };
      }
      return ord;
    }));
  };

  const addOrderVersion = (orderId, url) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const pf = ord.preflight || { cmyk: 'Not Checked', bleed: 'Not Checked', resolution: 'Not Checked', approvedTimestamp: null, versions: [] };
        const newVerNum = (pf.versions?.length || 0) + 1;
        const newVer = {
          url,
          version: newVerNum,
          uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
        return {
          ...ord,
          preflight: {
            ...pf,
            versions: [newVer, ...(pf.versions || [])]
          }
        };
      }
      return ord;
    }));
  };

  // Equipment maintenance component triggers
  const updateEquipmentComponentUsage = (eqId, componentName, newUsage) => {
    setEquipment(prev => prev.map(eq => {
      if (eq.id === eqId) {
        const updatedComponents = eq.components.map(c => {
          if (c.name === componentName) {
            return { ...c, usage: Number(newUsage) };
          }
          return c;
        });
        return { ...eq, components: updatedComponents };
      }
      return eq;
    }));
  };

  const resetEquipmentComponent = (eqId, componentName) => {
    setEquipment(prev => prev.map(eq => {
      if (eq.id === eqId) {
        const updatedComponents = eq.components.map(c => {
          if (c.name === componentName) {
            return { ...c, usage: 0 };
          }
          return c;
        });
        return {
          ...eq,
          components: updatedComponents,
          lastMaintenanceDate: new Date().toISOString().split('T')[0]
        };
      }
      return eq;
    }));
  };

  // Calculations for dashboard
  const getDashboardStats = () => {
    // Realized Cashflow = Sum of depositPaid of all orders
    const totalRevenue = orders.reduce((sum, ord) => sum + ord.depositAmountPaid, 0); // realized cash
    
    // Pending Receivables
    const outstandingPayments = orders.reduce((sum, ord) => sum + ord.remainingUnpaidBalance, 0);

    let materialCostForOrders = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        const invItem = inventory.find(i => i.id === item.id);
        if (invItem) {
          materialCostForOrders += item.quantity * invItem.costPerConsumptionUnit;
        }
      });
    });

    const spoilageCost = spoilageLogs.reduce((sum, log) => sum + log.totalCost, 0);
    const directMaterialCost = materialCostForOrders + spoilageCost;
    
    let machineDepreciationFromOrders = 0;
    orders.forEach(order => {
      const pageCountItem = order.items.find(item => item.id.startsWith('paper'));
      if (pageCountItem) {
        machineDepreciationFromOrders += pageCountItem.quantity * 90;
      }
    });

    const totalCost = directMaterialCost + machineDepreciationFromOrders;
    
    // Net profit (nominal)
    const totalEarnedPrice = orders.reduce((sum, ord) => sum + ord.totalPriceCharged, 0);
    const netProfit = totalEarnedPrice - totalCost;
    
    const activeOrdersCount = orders.filter(ord => ord.status !== 'Delivered').length;

    // Material deadstock warnings: materials with zero consumption in active orders
    const activeOrderedIds = new Set();
    orders.forEach(o => o.items.forEach(i => activeOrderedIds.add(i.id)));
    const deadstockItems = inventory.filter(inv => !activeOrderedIds.has(inv.id));

    // Machine production efficiencies: calculated from print count vs limit ratio or mock index
    const machineEfficiencies = equipment.map(eq => {
      // simulate weekly efficiency based on component logs
      const avgWear = eq.components.reduce((sum, c) => sum + c.usage, 0) / (eq.components.length || 1);
      const efficiency = Math.round(100 - (avgWear * 0.25)); // wear decreases efficiency slightly
      return { id: eq.id, name: eq.name, efficiency };
    });

    return {
      totalRevenue, // Cash Realized
      totalCost,
      netProfit,
      activeOrdersCount,
      spoilageCost,
      outstandingPayments, // Pending Receivables
      deadstockItems,
      machineEfficiencies
    };
  };

  // State actions
  const addOrder = (orderData, autoDeduct = true) => {
    const formatDateTime = () => {
      const now = new Date('2026-08-04T09:30:00');
      const pad = (n) => n.toString().padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    const itemsWithLots = orderData.items.map(orderedItem => {
      const item = inventory.find(i => i.id === orderedItem.id);
      let remaining = orderedItem.quantity;
      const lotsUsed = [];
      if (item && item.batches && item.batches.length > 0) {
        const sorted = [...item.batches].sort((a,b) => a.purchaseDate.localeCompare(b.purchaseDate));
        for (let b of sorted) {
          if (b.currentQty > 0) {
            const take = Math.min(remaining, b.currentQty);
            lotsUsed.push({ lotId: b.id, qty: take, cost: b.costPerSheet });
            remaining -= take;
            if (remaining <= 0) break;
          }
        }
      }
      if (remaining > 0) {
        lotsUsed.push({ lotId: 'RESERVE', qty: remaining, cost: item ? item.costPerConsumptionUnit : 0 });
      }
      return {
        ...orderedItem,
        lotsUsed
      };
    });

    const newOrder = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      createdTime: formatDateTime(),
      productionStartTime: null,
      productionEndTime: null,
      actualDeliveryTime: null,
      onTimeStatus: null,
      preflight: {
        cmyk: 'Not Checked',
        bleed: 'Not Checked',
        resolution: 'Not Checked',
        approvedTimestamp: null,
        versions: [
          { url: orderData.artworkLink || 'https://drive.google.com/som-sing-proof.pdf', version: 1, uploadedAt: formatDateTime() }
        ]
      },
      activityLog: [
        { timestamp: formatDateTime(), description: 'ເປີດອໍເດີໃໝ່ໃນລະບົບ (New Order Created)' }
      ],
      ...orderData,
      items: itemsWithLots
    };
    
    if (autoDeduct) {
      newOrder.items.forEach(orderedItem => {
        deductStockFIFO(orderedItem.id, orderedItem.quantity);
      });

      // Update equipment pages printed count
      setEquipment(prev => {
        return prev.map(eq => {
          if (eq.category === 'Printer') {
            const paperOrdered = orderData.items.find(i => i.id.startsWith('paper'));
            const pagesCount = paperOrdered ? paperOrdered.quantity : 0;
            
            const updatedComponents = eq.components.map(c => {
              const increment = Math.round((pagesCount / 1000) * 10) / 10;
              return {
                ...c,
                usage: Math.min(100, Math.round((c.usage + increment) * 10) / 10)
              };
            });

            return {
              ...eq,
              printedCount: eq.printedCount + pagesCount,
              components: updatedComponents
            };
          }
          if (eq.category === 'Cutter') {
            const updatedComponents = eq.components.map(c => {
              if (c.name.includes('Blade')) {
                return { ...c, usage: Math.min(100, c.usage + 1) };
              }
              return c;
            });
            return {
              ...eq,
              printedCount: eq.printedCount + 1,
              components: updatedComponents
            };
          }
          return eq;
        });
      });
    }

    setOrders(prev => [newOrder, ...prev]);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const formatDateTime = () => {
      const now = new Date('2026-08-04T12:00:00');
      const pad = (n) => n.toString().padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const timeNow = formatDateTime();
        const updates: Record<string, any> = { status: newStatus };

        if (newStatus === 'Printing') {
          updates.productionStartTime = timeNow;
        } else if (newStatus === 'Ready') {
          updates.productionEndTime = timeNow;
        } else if (newStatus === 'Delivered') {
          updates.actualDeliveryTime = timeNow;
          const promDate = new Date(ord.promisedDeliveryDate);
          const actDate = new Date('2026-08-04');
          
          updates.onTimeStatus = actDate <= promDate ? 'On-Time' : 'Late';
          updates.paymentStatus = 'Fully Paid';
          updates.depositAmountPaid = ord.totalPriceCharged;
          updates.remainingUnpaidBalance = 0;
          updates.paidDateTime = timeNow;
        }

        const logs = ord.activityLog || [];
        const statusNames = {
          Received: 'ໄດ້ຮັບອໍເດີ (Received)',
          Printing: 'ເລີ່ມພິມແຜ່ນງານ (Press Printing)',
          Cutting: 'ຕັດແລະເຄືອບ (Cutting & Binding)',
          Ready: 'ຜະລິດສຳເລັດ/ກຽມຈັດສົ່ງ (Ready for Delivery)',
          Delivered: 'ຈັດສົ່ງສຳເລັດ (Delivered)',
          Cancelled: 'ຍົກເລີກອໍເດີ (Cancelled)'
        };
        const statusText = statusNames[newStatus] || newStatus;
        const newLog = {
          timestamp: timeNow,
          description: `ປ່ຽນສະຖານະອໍເດີເປັນ: ${statusText}`
        };

        return {
          ...ord,
          ...updates,
          activityLog: [newLog, ...logs]
        };
      }
      return ord;
    }));
  };

  const settleOrderBalance = (orderId, amountPaid, method, slipNote) => {
    const formatDateTime = () => {
      const now = new Date('2026-08-04T10:00:00');
      const pad = (n) => n.toString().padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const newDeposit = ord.depositAmountPaid + amountPaid;
        const newRemaining = Math.max(0, ord.totalPriceCharged - newDeposit);
        const fullyPaid = newRemaining === 0;
        const timeNow = formatDateTime();

        const logs = ord.activityLog || [];
        const newLog = {
          timestamp: timeNow,
          description: `ຊຳຣະຍອດຄ້າງຈຳນວນ ${amountPaid.toLocaleString()} LAK ຜ່ານ ${method} (${slipNote || 'ບໍ່ມີໝາຍເຫດ'})`
        };

        return {
          ...ord,
          depositAmountPaid: newDeposit,
          remainingUnpaidBalance: newRemaining,
          paymentMethod: method,
          paymentSlipNote: slipNote || ord.paymentSlipNote,
          paymentStatus: fullyPaid ? 'Fully Paid' : 'Deposit Paid',
          paidDateTime: timeNow,
          activityLog: [newLog, ...logs]
        };
      }
      return ord;
    }));
  };

  const deleteOrder = (orderId) => {
    setOrders(prev => prev.filter(ord => ord.id !== orderId));
  };

  const addSpoilageLog = (logData) => {
    const invItem = inventory.find(i => i.id === logData.materialId);
    if (!invItem) return;

    const unitCost = invItem.costPerConsumptionUnit;
    const totalCost = logData.quantity * unitCost;

    const newLog = {
      id: `sp-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      materialName: invItem.name,
      unitCost,
      totalCost,
      ...logData
    };

    deductStockFIFO(logData.materialId, logData.quantity);
    setSpoilageLogs(prev => [newLog, ...prev]);

    if (logData.orderId) {
      setOrders(prev => prev.map(ord => {
        if (ord.id === logData.orderId) {
          const logs = ord.activityLog || [];
          const actLog = {
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            description: `ລາຍງານງານເສຍ: ${invItem.name} ຈຳນວນ ${logData.quantity} ໜ່ວຍ. ສາເຫດ: ${logData.cause || 'ບໍ່ລະບຸ'}`
          };
          return {
            ...ord,
            activityLog: [actLog, ...logs]
          };
        }
        return ord;
      }));
    }
  };

  const addStock = (itemId, purchaseQty) => {
    addInventoryBatch(itemId, {
      batchId: `LOT-RESTOCK-${Date.now().toString().slice(-4)}`,
      purchaseDate: new Date().toISOString().split('T')[0],
      supplierName: 'System Restock',
      purchasePrice: 45000,
      purchaseQty: Number(purchaseQty)
    });
  };

  const addEquipment = (eqData) => {
    const calculatedCostPerPage = eqData.purchaseCost / (eqData.printedPagesCapacity || 500000);
    
    let defaultComponents = [
      { name: 'Drum Unit (ຊຸດດຣຳ)', usage: 0, threshold: 90 },
      { name: 'Fuser Kit (ຊຸດຄວາມຮ້ອນ)', usage: 0, threshold: 90 }
    ];
    if (eqData.category === 'Cutter') {
      defaultComponents = [
        { name: 'Blade Lifespan (ໃບມີດ)', usage: 0, threshold: 95 },
        { name: 'Cutting Stick (ແທ່ງຮອງຕັດ)', usage: 0, threshold: 90 },
        { name: 'Hydraulic Oil (ນ້ຳມັນໄຮໂດຼລິກ)', usage: 0, threshold: 90 }
      ];
    } else if (eqData.category === 'Laminator') {
      defaultComponents = [
        { name: 'Printhead Status (ຫົວພิມ)', usage: 0, threshold: 90 },
        { name: 'Maintenance Box (ກ່ອງຊັບໝຶກ)', usage: 0, threshold: 90 }
      ];
    } else if (eqData.category === 'Binder') {
      defaultComponents = [
        { name: 'Glue Roller (ລູກກິ້ງກາວ)', usage: 0, threshold: 90 },
        { name: 'Clamp Wear (ຊຸດໜີບ)', usage: 0, threshold: 90 }
      ];
    }

    const newEq = {
      id: eqData.id || `eq-${Date.now().toString().slice(-4)}`,
      printedCount: 0,
      calculatedCostPerPage,
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      components: eqData.components || defaultComponents,
      oem_baseline_specs: eqData.oem_baseline_specs || { slots: eqData.printerColorLinks },
      ...eqData
    };

    setEquipment(prev => {
      const idx = prev.findIndex(e => e.id === newEq.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...newEq };
        return next;
      }
      return [...prev, newEq];
    });

    // Send JSON payload to Equipment Backend API
    fetch(`/api/equipment/${newEq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEq)
    }).catch(err => console.log('API equipment sync notice:', err));
  };

  const addPrinterColorLink = (linkData) => {
    const newLink = {
      id: linkData.id || `lnk-${Date.now().toString().slice(-4)}`,
      assetId: linkData.assetId,
      inkCode: linkData.inkCode,
      slotPosition: linkData.slotPosition || 'CMYK Slot',
      oemStandardVolumeMl: Number(linkData.oemStandardVolumeMl) || 100,
      oemStandardIsoYieldA4: Number(linkData.oemStandardIsoYieldA4) || 5000,
      baseConsumptionRateMl: Number(linkData.baseConsumptionRateMl) || 0.01693,
      isoPageYieldA4: Number(linkData.isoPageYieldA4) || 4000,
      notes: linkData.notes || ''
    };
    setPrinterColorLinks(prev => [...prev, newLink]);
  };

  const deletePrinterColorLink = (linkId) => {
    setPrinterColorLinks(prev => prev.filter(lnk => lnk.id !== linkId));
  };

  const addInboundEntry = (entry) => {
    setLinkedInboundEntries(prev => [entry, ...prev]);
  };

  const editInboundEntry = (id, updatedFields) => {
    setLinkedInboundEntries(prev => prev.map(item => item.id === id ? { ...item, ...updatedFields } : item));
  };

  const deleteInboundEntry = (id) => {
    setLinkedInboundEntries(prev => prev.filter(item => item.id !== id));
  };

  const updateEquipmentMaintenance = (eqId) => {
    setEquipment(prev => prev.map(eq => {
      if (eq.id === eqId) {
        const resetComps = eq.components.map(c => ({ ...c, usage: 0 }));
        return {
          ...eq,
          components: resetComps,
          lastMaintenanceDate: new Date().toISOString().split('T')[0]
        };
      }
      return eq;
    }));
  };

  const addPurchaseOrder = (poData) => {
    // Spread ALL fields from poData so Detail Views can render every submitted field
    const newPo = {
      ...poData,
      poId: poData.poId || `PO-${Date.now().toString().slice(-6)}`,
      purchaseDate: poData.purchaseDate || new Date().toISOString().split('T')[0],
      totalCost: Number(poData.totalCost || 0),
      qty: Number(poData.qty || 1),
      unitName: poData.unitName || ''
    };
    setPurchaseOrders(prev => [newPo, ...prev]);
  };

  const deletePurchaseOrder = (targetId) => {
    setPurchaseOrders(prev => prev.filter(p => (p.poId !== targetId && p.id !== targetId)));
  };

  // ---- Quotation actions (versioning, expiry, convert) ----
  const addQuotation = (quotationData) => {
    const now = new Date().toISOString().split('T')[0];
    const newQuote = {
      id: `quot-${Date.now().toString().slice(-6)}`,
      quotationNumber: quotationData.quotationNumber || `Q-${now.replace(/-/g, '').slice(2)}-${Date.now().toString().slice(-2)}`,
      status: quotationData.status || 'Pending',
      version: 1,
      versions: [{ version: 1, date: now, total: Number(quotationData.grandTotal) || 0, note: 'Initial estimate' }],
      createdAt: now,
      convertedOrderId: null,
      ...quotationData
    };
    setQuotations(prev => [newQuote, ...prev]);
    return newQuote;
  };

  const reviseQuotation = (quotationId, newTotal, note) => {
    setQuotations(prev => prev.map(q => {
      if (q.id !== quotationId) return q;
      const nextVersion = (q.version || 0) + 1;
      const newVersionEntry = {
        version: nextVersion,
        date: new Date().toISOString().split('T')[0],
        total: Number(newTotal),
        note: note || `Revision v${nextVersion}`
      };
      return {
        ...q,
        version: nextVersion,
        grandTotal: Number(newTotal),
        versions: [newVersionEntry, ...(q.versions || [])],
        status: 'Pending'
      };
    }));
  };

  const updateQuotation = (quotationId, updatedFields) => {
    setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, ...updatedFields } : q));
  };

  const deleteQuotation = (quotationId) => {
    setQuotations(prev => prev.filter(q => q.id !== quotationId));
  };

  // Convert an accepted quotation into a production order + job ticket
  const convertQuotationToOrder = (quotationId) => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) return null;

    const orderItems = (quotation.items || []).map(item => {
      const invItem = inventory.find(i => i.id === item.id || i.name === item.name);
      return {
        id: invItem ? invItem.id : item.id,
        name: item.name || invItem?.name || 'Custom Print Job',
        quantity: Number(item.quantity) || 1,
        unitCost: Number(item.unitPrice) || 0
      };
    });

    const newOrder = {
      customerName: quotation.customerName,
      phone: quotation.phone || '',
      items: orderItems,
      totalPriceCharged: Number(quotation.grandTotal) || 0,
      depositAmountPaid: Math.round((Number(quotation.grandTotal) || 0) * 0.5),
      remainingUnpaidBalance: Math.round((Number(quotation.grandTotal) || 0) * 0.5),
      paymentMethod: 'BCEL One',
      paymentStatus: 'Deposit Paid',
      status: 'Received',
      promisedDeliveryDate: quotation.expiresAt || new Date().toISOString().split('T')[0],
      artworkLink: quotation.artworkLink || '',
      notes: `Converted from quotation ${quotation.quotationNumber} (v${quotation.version}). ${quotation.notes || ''}`,
      sourceQuotationId: quotation.id
    };

    let createdId = null;
    setOrders(prev => {
      const id = `ord-${Date.now().toString().slice(-4)}`;
      createdId = id;
      return [{ ...newOrder, id }, ...prev];
    });

    setQuotations(prev => prev.map(q => q.id === quotationId ? { ...q, status: 'Accepted', convertedOrderId: createdId } : q));
    return createdId;
  };

  // ---- Employee actions (CRUD + shift/machine assignment + incentives) ----
  const addEmployee = (empData) => {
    const newEmp = {
      id: `EMP-${String(Date.now()).slice(-3).padStart(3, '0')}`,
      attendance: { present: 0, absent: 0, late: 0 },
      rating: 5.0,
      assignedMachines: empData.assignedMachines || [],
      pieceRatePerImpression: Number(empData.pieceRatePerImpression) || 0,
      impressionsProduced: 0,
      salesCommissionRate: Number(empData.salesCommissionRate) || 0,
      ...empData
    };
    setEmployees(prev => [newEmp, ...prev]);
  };

  const updateEmployee = (empId, updatedFields) => {
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, ...updatedFields } : e));
  };

  const deleteEmployee = (empId) => {
    setEmployees(prev => prev.filter(e => e.id !== empId));
  };

  const assignEmployeeToMachine = (empId, machineId, shift) => {
    setEmployees(prev => prev.map(e => {
      if (e.id !== empId) return e;
      const assigned = new Set(e.assignedMachines || []);
      if (machineId) assigned.add(machineId);
      return { ...e, assignedMachines: [...assigned], shift: shift || e.shift };
    }));
  };

  const recordImpressions = (empId, impressions) => {
    setEmployees(prev => prev.map(e => {
      if (e.id !== empId) return e;
      return {
        ...e,
        impressionsProduced: (Number(e.impressionsProduced) || 0) + Number(impressions)
      };
    }));
  };

  // ---- Machine status & downtime log actions ----
  const setMachineOperationalStatus = (eqId, status, opts: Record<string, any> = {}) => {
    setMachineStatus(prev => ({
      ...prev,
      [eqId]: {
        status,
        lastChanged: opts.lastChanged || new Date().toISOString().replace('T', ' ').slice(0, 16),
        reason: opts.reason || ''
      }
    }));

    if (status === 'downtime') {
      const equipmentItem = equipment.find(e => e.id === eqId);
      const newLog = {
        id: `dt-${Date.now().toString().slice(-4)}`,
        equipmentId: eqId,
        equipmentName: equipmentItem?.name || eqId,
        startTime: opts.lastChanged || new Date().toISOString().replace('T', ' ').slice(0, 16),
        endTime: null,
        downtimeMinutes: 0,
        reason: opts.reason || 'No Material',
        description: opts.description || ''
      };
      setDowntimeLogs(prev => [newLog, ...prev]);
    }
  };

  const resolveDowntime = (logId, endTime) => {
    setDowntimeLogs(prev => prev.map(log => {
      if (log.id !== logId) return log;
      const end = endTime || new Date().toISOString().replace('T', ' ').slice(0, 16);
      const minutes = Math.max(1, Math.round((new Date(end.replace(' ', 'T')).getTime() - new Date(log.startTime.replace(' ', 'T')).getTime()) / 60000));
      return { ...log, endTime: end, downtimeMinutes: minutes };
    }));
  };

  // ---- Purchase Requisition actions ----
  const addPurchaseRequisition = (prData) => {
    const newPR = {
      id: `PR-${Date.now().toString().slice(-6)}`,
      prNumber: prData.prNumber || `PR-${Date.now().toString().slice(-6)}`,
      date: prData.date || new Date().toISOString().split('T')[0],
      reason: prData.reason || 'Reorder Point (ROP) alert',
      status: prData.status || 'Open',
      ...prData
    };
    setPurchaseRequisitions(prev => [newPR, ...prev]);
    return newPR;
  };

  const updatePurchaseRequisition = (prId, updatedFields) => {
    setPurchaseRequisitions(prev => prev.map(pr => pr.id === prId ? { ...pr, ...updatedFields } : pr));
  };

  // ---- Delivery / dispatch actions ----
  const addDelivery = (deliveryData) => {
    const newDelivery = {
      id: `dlv-${Date.now().toString().slice(-4)}`,
      status: deliveryData.status || 'Dispatched',
      ...deliveryData
    };
    setDeliveries(prev => [newDelivery, ...prev]);
  };

  const updateDelivery = (deliveryId, updatedFields) => {
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, ...updatedFields } : d));
  };

  const addCustomer = (customerData) => {
    const newCust = {
      id: `cust-${Date.now().toString().slice(-4)}`,
      name: customerData.name,
      phone: customerData.phone || '-',
      address: customerData.address || '-',
      creditLimit: Number(customerData.creditLimit) || 1000000,
      instagram: customerData.instagram || '',
      line: customerData.line || '',
      facebook: customerData.facebook || ''
    };
    setCustomers(prev => [...prev, newCust]);
  };

  const updateCustomer = (customerId, updatedFields) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...updatedFields } : c));
  };

  const deleteCustomer = (customerId) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
  };

  const resetToDefaultData = () => {
    setInventory(initialInventory);
    setEquipment(initialEquipment);
    setPrinterColorLinks(initialPrinterColorLinks);
    setOrders(initialOrders);
    setSpoilageLogs(initialSpoilageLogs);
    setCustomers(initialCustomers);
    setOffcuts(initialOffcuts);
    setPurchaseOrders(initialPurchaseOrders);
    setQuotations(initialQuotations);
    setEmployees(initialEmployees);
    setMachineStatus(initialMachineStatus);
    setDowntimeLogs(initialDowntimeLogs);
    setPurchaseRequisitions(initialPurchaseRequisitions);
    setDeliveries(initialDeliveries);
    setExchangeRates(DEFAULT_RATES);
    setRatesUpdatedAt('');
    setRateMode('sell');
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      focusOrderId,
      setFocusOrderId,
      preselectedCustomerName,
      setPreselectedCustomerName,
      prefilledOrderSpecs,
      setPrefilledOrderSpecs,
      currency,
      setCurrency,
      formatCurrency,
      convertToCurrency,
      exchangeRates,
      ratesUpdatedAt,
      updateExchangeRate,
      rateMode,
      setRateMode,
      isRatesOpen,
      setIsRatesOpen,
      quotations,
      setQuotations,
      addQuotation,
      reviseQuotation,
      updateQuotation,
      deleteQuotation,
      convertQuotationToOrder,
      employees,
      setEmployees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      assignEmployeeToMachine,
      recordImpressions,
      machineStatus,
      setMachineStatus,
      setMachineOperationalStatus,
      downtimeLogs,
      setDowntimeLogs,
      resolveDowntime,
      purchaseRequisitions,
      setPurchaseRequisitions,
      addPurchaseRequisition,
      updatePurchaseRequisition,
      deliveries,
      setDeliveries,
      addDelivery,
      updateDelivery,
      activeRole,
      setActiveRole,
      canAccess,
      inventory,
      equipment,
      orders,
      spoilageLogs,
      customers,
      offcuts,
      purchaseOrders,
      setPurchaseOrders,
      deletePurchaseOrder,
      linkedInboundEntries,
      customCategories,
      setCustomCategories,
      masterSpecsPool,
      setMasterSpecsPool,
      toast,
      setToast,
      confirmDialog,
      showToast,
      askConfirmation,
      getDashboardStats,
      getFIFOCostPerSheet,
      addInventoryBatch,
      addInventorySku,
      deleteInventoryBatch,
      editInventoryBatch,
      editInventorySku,
      checkCreditLimit,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addOffcut,
      consumeOffcut,
      updatePreflightCheck,
      updateProductionStep,
      addOrderVersion,
      addOrder,
      updateOrderStatus,
      settleOrderBalance,
      deleteOrder,
      addSpoilageLog,
      addStock,
      addEquipment,
      addInboundEntry,
      printerColorLinks,
      setPrinterColorLinks,
      addPrinterColorLink,
      deletePrinterColorLink,
      quickAdjustStock,
      editInboundEntry,
      deleteInboundEntry,
      addPurchaseOrder,
      updateEquipmentComponentUsage,
      resetEquipmentComponent,
      updateEquipmentMaintenance,
      resetToDefaultData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
