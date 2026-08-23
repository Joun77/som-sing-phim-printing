import { InboundEntry } from '../types';

export const sampleInboundData: InboundEntry[] = [
  {
    id: 'INB-2026-001',
    poNumber: 'PO-2026-0801',
    receiptDate: '2026-08-01',
    category: 'MATERIAL',
    categoryPill: 'MATERIAL',
    name: 'Art Card Paper 260gsm (A3+ 320x480mm)',
    itemName: 'Art Card Paper 260gsm (A3+ 320x480mm)',
    sku: 'PAP-ART-260',
    currentQty: 2500,
    initialQty: 2500,
    unit: 'ແຜ່ນ',
    subUnit: '(5 ແພັກ x 500 ແຜ່ນ)',
    supplier: 'SCG Paper Thailand',
    totalPrice: 4750000,
    paymentMethod: 'TRANSFER',
    origin: 'TH',
    specs: {
      brand: 'Double A / SCG Premium',
      paperType: 'Art Card Gloss',
      grammage: '260 gsm',
      size: 'A3+ (320 x 480 mm)',
      sheetsPerPack: '500',
      totalPacks: '5',
      costPerSheet: '1900'
    },
    docs: {
      productPhoto: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EArt Card 260g%3C/text%3E%3C/svg%3E",
      paymentSlip: ''
    }
  },
  {
    id: 'INB-2026-002',
    poNumber: 'PO-2026-0802',
    receiptDate: '2026-08-02',
    category: 'MATERIAL',
    categoryPill: 'MATERIAL',
    name: 'Woodfree Bond Paper 80gsm (A4 210x297mm)',
    itemName: 'Woodfree Bond Paper 80gsm (A4 210x297mm)',
    sku: 'PAP-WF-80',
    currentQty: 5000,
    initialQty: 5000,
    unit: 'ແຜ່ນ',
    subUnit: '(10 ແພັກ x 500 ແຜ່ນ)',
    supplier: 'Double A Lao Distributor',
    totalPrice: 1900000,
    paymentMethod: 'TRANSFER',
    origin: 'TH',
    specs: {
      brand: 'Double A 80g',
      paperType: 'Woodfree Bond',
      grammage: '80 gsm',
      size: 'A4 (210 x 297 mm)',
      sheetsPerPack: '500',
      totalPacks: '10',
      costPerSheet: '380'
    },
    docs: {
      productPhoto: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EWoodfree 80g%3C/text%3E%3C/svg%3E",
      paymentSlip: ''
    }
  },
  {
    id: 'INB-2026-003',
    poNumber: 'PO-2026-0803',
    receiptDate: '2026-08-03',
    category: 'INK',
    categoryPill: 'INK',
    name: 'Fuji Xerox EA-Eco Toner Set (CMYK)',
    itemName: 'Fuji Xerox EA-Eco Toner Set (CMYK)',
    sku: 'INK-FUJI-CMYK',
    currentQty: 4,
    initialQty: 4,
    unit: 'ຂວດ',
    subUnit: '(4 Cartridges Set)',
    supplier: 'FujiFilm Business Innovation',
    totalPrice: 6800000,
    paymentMethod: 'TRANSFER',
    origin: 'JP',
    specs: {
      brand: 'Fuji Xerox OEM',
      colorSystem: '4 Colors (C, M, Y, K)',
      capacity: '1000 ml / bottle',
      yieldA4: '35000 pages at 5%'
    },
    docs: {
      productPhoto: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EFuji Toner CMYK%3C/text%3E%3C/svg%3E",
      paymentSlip: ''
    }
  },
  {
    id: 'INB-2026-004',
    poNumber: 'PO-2026-0804',
    receiptDate: '2026-08-05',
    category: 'PRINTER',
    categoryPill: 'PRINTER',
    name: 'Fuji Xerox Versant 180 Press',
    itemName: 'Fuji Xerox Versant 180 Press',
    sku: 'PRN-FUJI-V180',
    currentQty: 1,
    initialQty: 1,
    unit: 'ເຄື່ອງ',
    subUnit: '(1 Unit Digital Color Press)',
    supplier: 'FujiFilm Direct Laos',
    totalPrice: 185000000,
    paymentMethod: 'TRANSFER',
    origin: 'JP',
    specs: {
      brand: 'Fuji Xerox',
      model: 'Versant 180 Press',
      serialNumber: 'FX-V180-202688',
      printerCategory: 'Digital Color Press',
      costPerPage: '50',
      printedPagesCapacity: '1500000'
    },
    docs: {
      productPhoto: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EVersant 180 Press%3C/text%3E%3C/svg%3E",
      paymentSlip: ''
    }
  },
  {
    id: 'INB-2026-005',
    poNumber: 'PO-2026-0805',
    receiptDate: '2026-08-06',
    category: 'CUTTER',
    categoryPill: 'CUTTER',
    name: 'QZYK920 Hydraulic Paper Guillotine',
    itemName: 'QZYK920 Hydraulic Paper Guillotine',
    sku: 'MAC-CUTTER-920',
    currentQty: 1,
    initialQty: 1,
    unit: 'ເຄື່ອງ',
    subUnit: '(1 Unit Heavy Guillotine)',
    supplier: 'Zhengzhou Industrial Equipment',
    totalPrice: 65000000,
    paymentMethod: 'TRANSFER',
    origin: 'CN',
    specs: {
      brand: 'QZYK Heavy Machinery',
      model: 'QZYK920 Program-Controlled',
      serialNumber: 'QZYK-920-8819',
      costPerPage: '30'
    },
    docs: {
      productPhoto: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3ECutter 920%3C/text%3E%3C/svg%3E",
      paymentSlip: ''
    }
  }
];
