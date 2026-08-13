// Sample dataset for Inbound Procurement Entries synced with Warehouse Inventory
export const sampleInboundData = [
  {
    id: 'INB-2026-001',
    poNumber: 'PO-984210',
    sku: 'SKU-PAP-A4-80',
    name: 'ເຈ້ຍ A4 Double A 80gsm',
    category: 'MATERIAL',
    categoryPill: 'Paper',
    receiptDate: '2026-08-01',
    supplierName: 'Lao Paper Supplier',
    paymentMethod: 'TRANSFER',
    paymentStatus: 'PAID',
    initialQty: 20,
    unit: 'Ream',
    unitPrice: 45000,
    totalPrice: 900000,
    specs: {
      formFactor: 'ແຜ່ນ (Sheet)',
      grammage: '80 gsm',
      standardSize: 'A4 (210 x 297 mm)',
      packQty: '500 ແຜ່ນ/ຣີມ'
    },
    itemPhoto: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60',
    paymentSlip: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'INB-2026-002',
    poNumber: 'PO-984211',
    sku: 'SKU-INK-CYAN-1L',
    name: 'ນ້ຳໝຶກພິມ Konica Cyan 1000ml',
    category: 'INK',
    categoryPill: 'Ink',
    receiptDate: '2026-08-03',
    supplierName: 'Konica Minolta Lao',
    paymentMethod: 'TRANSFER',
    paymentStatus: 'PAID',
    initialQty: 10,
    unit: 'ຂວດ',
    unitPrice: 250000,
    totalPrice: 2500000,
    specs: {
      inkType: 'Pigment (ກັນນ້ຳ)',
      colorModel: 'Cyan (C)',
      volumePerBottle: '1000 ml',
      compatiblePrinter: 'Konica Minolta AccurioPress C6085'
    },
    itemPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
    paymentSlip: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 'INB-2026-003',
    poNumber: 'PO-984212',
    sku: 'SKU-HW-STAPLE-24',
    name: 'ລວດເຢັບແມັກ Max No.3-1M (24/6)',
    category: 'HARDWARE',
    categoryPill: 'Hardware',
    receiptDate: '2026-08-05',
    supplierName: 'Sengsavanh Stationery',
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    initialQty: 50,
    unit: 'ກ່ອງ',
    unitPrice: 12000,
    totalPrice: 600000,
    specs: {
      hwType: 'ລວດເຢັບແມັກ',
      hwSpec: 'No.3-1M (ເຢັບໄດ້ 30 ແຜ່ນ)',
      packCount: '1,000 ລວດ/ກ່ອງ'
    },
    itemPhoto: null,
    paymentSlip: null
  }
];
