import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

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
    lifespanYears: 5,
    printedPagesCapacity: 2000000,
    printedCount: 450000,
    calculatedCostPerPage: 90,
    category: 'Printer',
    printerType: 'Laser',
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
  { name: 'ສົມພອນ ສີວິໄລ', creditLimit: 2000000 },
  { name: 'ນາງ ແສງດາວ', creditLimit: 1000000 },
  { name: 'ຮ້ານອາຫານ ທ່າທາງ', creditLimit: 3000000 },
  { name: 'ໂຮງແຮມ ລ້ານຊ້າງ', creditLimit: 5000000 }
];

const initialOffcuts = [
  { id: 'off-1', name: 'ເສດເຈ້ຍ A3 Art Paper (200x297mm)', qty: 45, paperId: 'paper-a3-120', notes: 'ຕັດເຫຼືອຈາກງານເມນູຮ້ານທ່າທາງ' },
  { id: 'off-2', name: 'ເສດເຈ້ຍສະຕິກເກີ (150x150mm)', qty: 80, paperId: 'sticker-a4', notes: 'ຕັດເຫຼືອຈາກງານຕັດສະຕິກເກີ' }
];

const initialPurchaseOrders = [
  {
    poId: 'PO-260801-01',
    purchaseDate: '2026-08-01',
    itemType: 'Material',
    itemName: 'ເຈ້ຍ A4 Double A 80gsm',
    supplierName: 'Lao Paper Supplier',
    totalCost: 90000,
    qty: 2,
    unitName: 'Ream'
  },
  {
    poId: 'PO-260802-01',
    purchaseDate: '2026-08-02',
    itemType: 'Equipment',
    itemName: 'Epson L15150 Printer',
    supplierName: 'Epson Lao Outlet',
    totalCost: 15000000,
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
    paymentStatus: 'Deposit Paid',
    paidDateTime: getPastDateTimeString(2, 9, 45),
    paymentSlipNote: 'ໂອນ BCEL One - ໃບບິນ #8832',
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
    }
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
    paymentStatus: 'Fully Paid',
    paidDateTime: getPastDateTimeString(0, 8, 45),
    paymentSlipNote: 'ຈ່າຍເງິນສົດໜ້າຮ້ານ',
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
    }
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
    paymentStatus: 'Fully Paid',
    paidDateTime: getPastDateTimeString(3, 10, 10),
    paymentSlipNote: 'ໂອນຜ່ານ App - ໃບບິນ #1129',
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
    }
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

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'warning' }
  const [confirmDialog, setConfirmDialog] = useState(null); // { message: '', onConfirm: () => void, onCancel: () => void }

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
    return saved ? JSON.parse(saved) : initialInventory;
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
    return saved ? JSON.parse(saved) : initialCustomers;
  });
  const [offcuts, setOffcuts] = useState(() => {
    const saved = localStorage.getItem('ss_print_offcuts_v6');
    return saved ? JSON.parse(saved) : initialOffcuts;
  });
  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    const saved = localStorage.getItem('ss_print_purchase_orders_v6');
    return saved ? JSON.parse(saved) : initialPurchaseOrders;
  });

  // Sync to localstorage
  useEffect(() => {
    localStorage.setItem('ss_print_inventory_v6', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('ss_print_equipment_v6', JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem('ss_print_orders_v6', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('ss_print_spoilage_v6', JSON.stringify(spoilageLogs));
  }, [spoilageLogs]);

  useEffect(() => {
    localStorage.setItem('ss_print_customers_v6', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('ss_print_offcuts_v6', JSON.stringify(offcuts));
  }, [offcuts]);

  useEffect(() => {
    localStorage.setItem('ss_print_purchase_orders_v6', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

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

  // Add a new SKU/Material Definition
  const addInventorySku = (itemData) => {
    const newSku = {
      id: itemData.id || `${itemData.category.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      name: itemData.name,
      category: itemData.category,
      stockQty: 0,
      consumptionUnit: itemData.consumptionUnit || 'Sheet',
      purchaseUnit: itemData.purchaseUnit || 'Pack',
      purchaseMultiplier: Number(itemData.purchaseMultiplier) || 1,
      costPerPurchaseUnit: Number(itemData.costPerPurchaseUnit) || 0,
      costPerConsumptionUnit: Number(itemData.costPerConsumptionUnit) || 0,
      reorderThreshold: Number(itemData.reorderThreshold) || 10,
      batches: [],
      ...itemData
    };
    setInventory(prev => [...prev, newSku]);
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

        return {
          ...ord,
          preflight: updatedPf
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
      ...orderData
    };
    
    if (autoDeduct) {
      orderData.items.forEach(orderedItem => {
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
        let updates = { status: newStatus };

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

        return {
          ...ord,
          ...updates
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

        return {
          ...ord,
          depositAmountPaid: newDeposit,
          remainingUnpaidBalance: newRemaining,
          paymentMethod: method,
          paymentSlipNote: slipNote || ord.paymentSlipNote,
          paymentStatus: fullyPaid ? 'Fully Paid' : 'Deposit Paid',
          paidDateTime: formatDateTime(),
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
    const calculatedCostPerPage = eqData.purchaseCost / eqData.printedPagesCapacity;
    const newEq = {
      id: `eq-${Date.now().toString().slice(-4)}`,
      printedCount: 0,
      calculatedCostPerPage,
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      components: eqData.components || [
        { name: 'Drum Unit', usage: 0, threshold: 90 },
        { name: 'Fuser Kit', usage: 0, threshold: 90 }
      ],
      ...eqData
    };
    setEquipment(prev => [...prev, newEq]);
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
    const newPo = {
      poId: poData.poId || `PO-${Date.now().toString().slice(-6)}`,
      purchaseDate: poData.purchaseDate || new Date().toISOString().split('T')[0],
      itemType: poData.itemType,
      itemName: poData.itemName,
      supplierName: poData.supplierName,
      totalCost: Number(poData.totalCost),
      qty: Number(poData.qty),
      unitName: poData.unitName || 'Unit'
    };
    setPurchaseOrders(prev => [newPo, ...prev]);
  };

  const resetToDefaultData = () => {
    setInventory(initialInventory);
    setEquipment(initialEquipment);
    setOrders(initialOrders);
    setSpoilageLogs(initialSpoilageLogs);
    setCustomers(initialCustomers);
    setOffcuts(initialOffcuts);
    setPurchaseOrders(initialPurchaseOrders);
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      inventory,
      equipment,
      orders,
      spoilageLogs,
      customers,
      offcuts,
      purchaseOrders,
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
      checkCreditLimit,
      addOffcut,
      consumeOffcut,
      updatePreflightCheck,
      addOrderVersion,
      addOrder,
      updateOrderStatus,
      settleOrderBalance,
      deleteOrder,
      addSpoilageLog,
      addStock,
      addEquipment,
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
