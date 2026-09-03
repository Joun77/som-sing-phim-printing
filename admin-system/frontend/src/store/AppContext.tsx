import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { AppContextValue, EarningRecord } from '../types';

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

const initialInventory: any[] = [
  {
    id: 'PAP-ART-260',
    sku: 'PAP-ART-260',
    name: 'Art Card Paper 260gsm (A3+ 320x480mm)',
    category: 'Paper',
    supplier: 'SCG Paper Thailand',
    stockQty: 2500,
    minStockThreshold: 500,
    costPerPurchaseUnit: 950000,
    costPerConsumptionUnit: 1900,
    purchaseMultiplier: 500,
    purchaseUnit: 'ແພັກ',
    consumptionUnit: 'ແຜ່ນ',
    specs: {
      brand: 'Double A / SCG Premium',
      paperType: 'Art Card Gloss',
      grammage: '260 gsm',
      size: 'A3+ (320 x 480 mm)',
      sheetsPerPack: '500'
    },
    batches: [
      {
        id: 'LOT-260-01',
        purchaseDate: '2026-08-01',
        supplierName: 'SCG Paper Thailand',
        purchasePricePerReam: 950000,
        costPerSheet: 1900,
        initialQty: 2500,
        currentQty: 2500
      }
    ]
  },
  {
    id: 'PAP-WF-80',
    sku: 'PAP-WF-80',
    name: 'Woodfree Bond Paper 80gsm (A4 210x297mm)',
    category: 'Paper',
    supplier: 'Double A Lao Distributor',
    stockQty: 5000,
    minStockThreshold: 1000,
    costPerPurchaseUnit: 190000,
    costPerConsumptionUnit: 380,
    purchaseMultiplier: 500,
    purchaseUnit: 'ແພັກ',
    consumptionUnit: 'ແຜ່ນ',
    specs: {
      brand: 'Double A 80g',
      paperType: 'Woodfree Bond',
      grammage: '80 gsm',
      size: 'A4 (210 x 297 mm)',
      sheetsPerPack: '500'
    },
    batches: [
      {
        id: 'LOT-80-01',
        purchaseDate: '2026-08-02',
        supplierName: 'Double A Lao Distributor',
        purchasePricePerReam: 190000,
        costPerSheet: 380,
        initialQty: 5000,
        currentQty: 5000
      }
    ]
  },
  {
    id: 'INK-FUJI-CMYK',
    sku: 'INK-FUJI-CMYK',
    name: 'Fuji Xerox EA-Eco Toner Set (CMYK)',
    category: 'Ink',
    supplier: 'FujiFilm Business Innovation',
    stockQty: 4,
    minStockThreshold: 1,
    costPerPurchaseUnit: 6800000,
    costPerConsumptionUnit: 1700000,
    purchaseMultiplier: 1,
    purchaseUnit: 'ຂວດ',
    consumptionUnit: 'ຂວດ',
    specs: {
      brand: 'Fuji Xerox OEM',
      colorSystem: '4 Colors (C, M, Y, K)'
    },
    batches: [
      {
        id: 'LOT-INK-01',
        purchaseDate: '2026-08-03',
        supplierName: 'FujiFilm Business Innovation',
        purchasePricePerReam: 6800000,
        costPerSheet: 1700000,
        initialQty: 4,
        currentQty: 4
      }
    ]
  },
  {
    id: 'PKG-BOX-01',
    sku: 'PKG-BOX-01',
    name: 'ກ່ອງພັດສະດຸເບີ 00 (Box Size 00 9.7x14x6cm)',
    category: 'Packaging',
    supplier: 'Lao Packaging Solution',
    stockQty: 250,
    minStockThreshold: 50,
    costPerPurchaseUnit: 1500,
    costPerConsumptionUnit: 1500,
    purchaseMultiplier: 1,
    purchaseUnit: 'ກ່ອງ',
    consumptionUnit: 'ກ່ອງ',
    specs: {
      brand: 'Standard Carton',
      size: 'Size 00 (9.7 x 14 x 6 cm)'
    },
    batches: [
      {
        id: 'LOT-BOX-01',
        purchaseDate: '2026-08-01',
        supplierName: 'Lao Packaging Solution',
        purchasePricePerReam: 1500,
        costPerSheet: 1500,
        initialQty: 250,
        currentQty: 250
      }
    ]
  },
  {
    id: 'PKG-BOX-02',
    sku: 'PKG-BOX-02',
    name: 'ກ່ອງພັດສະດຸເບີ A (Box Size A 14x20x6cm)',
    category: 'Packaging',
    supplier: 'Lao Packaging Solution',
    stockQty: 180,
    minStockThreshold: 40,
    costPerPurchaseUnit: 2500,
    costPerConsumptionUnit: 2500,
    purchaseMultiplier: 1,
    purchaseUnit: 'ກ່ອງ',
    consumptionUnit: 'ກ່ອງ',
    specs: {
      brand: 'Standard Carton',
      size: 'Size A (14 x 20 x 6 cm)'
    },
    batches: [
      {
        id: 'LOT-BOX-02',
        purchaseDate: '2026-08-01',
        supplierName: 'Lao Packaging Solution',
        purchasePricePerReam: 2500,
        costPerSheet: 2500,
        initialQty: 180,
        currentQty: 180
      }
    ]
  },
  {
    id: 'PKG-ENV-01',
    sku: 'PKG-ENV-01',
    name: 'ຊອງກັນກະແທກ Bubble Envelope (A5 18x23cm)',
    category: 'Packaging',
    supplier: 'Lao Packaging Solution',
    stockQty: 120,
    minStockThreshold: 30,
    costPerPurchaseUnit: 2000,
    costPerConsumptionUnit: 2000,
    purchaseMultiplier: 1,
    purchaseUnit: 'ຊອງ',
    consumptionUnit: 'ຊອງ',
    specs: {
      brand: 'Bubble Safe',
      size: 'A5 (18 x 23 cm)'
    },
    batches: [
      {
        id: 'LOT-ENV-01',
        purchaseDate: '2026-08-01',
        supplierName: 'Lao Packaging Solution',
        purchasePricePerReam: 2000,
        costPerSheet: 2000,
        initialQty: 120,
        currentQty: 120
      }
    ]
  },
  {
    id: 'OFF-ART-260-A5',
    sku: 'OFF-ART-260-A5',
    name: 'ເສດເຈ້ຍ Art Card 260gsm (A5 148×210mm)',
    category: 'Offcut',
    supplier: 'Production Scrap Reclaim',
    stockQty: 120,
    minStockThreshold: 20,
    costPerPurchaseUnit: 450,
    costPerConsumptionUnit: 450,
    purchaseMultiplier: 1,
    purchaseUnit: 'ແຜ່ນ',
    consumptionUnit: 'ແຜ່ນ',
    isOffcut: true,
    specs: {
      widthMm: 148,
      heightMm: 210,
      dimensionFormatted: '148 × 210 mm (A5)',
      grammageGsm: 260,
      paperType: 'Art Card',
      usableFor: ['Namecards', 'Hangtags', 'Small Prints']
    },
    batches: [
      {
        id: 'LOT-OFF-01',
        purchaseDate: '2026-08-15',
        supplierName: 'Production Scrap Reclaim',
        purchasePricePerReam: 450,
        costPerSheet: 450,
        initialQty: 120,
        currentQty: 120
      }
    ]
  },
  {
    id: 'OFF-KRAFT-150-A6',
    sku: 'OFF-KRAFT-150-A6',
    name: 'ເສດເຈ້ຍ Kraft 150gsm (A6 105×148mm)',
    category: 'Offcut',
    supplier: 'Production Scrap Reclaim',
    stockQty: 80,
    minStockThreshold: 15,
    costPerPurchaseUnit: 250,
    costPerConsumptionUnit: 250,
    purchaseMultiplier: 1,
    purchaseUnit: 'ແຜ່ນ',
    consumptionUnit: 'ແຜ່ນ',
    isOffcut: true,
    specs: {
      widthMm: 105,
      heightMm: 148,
      dimensionFormatted: '105 × 148 mm (A6)',
      grammageGsm: 150,
      paperType: 'Kraft Paper',
      usableFor: ['Tags', 'Mini Envelopes']
    },
    batches: [
      {
        id: 'LOT-OFF-02',
        purchaseDate: '2026-08-18',
        supplierName: 'Production Scrap Reclaim',
        purchasePricePerReam: 250,
        costPerSheet: 250,
        initialQty: 80,
        currentQty: 80
      }
    ]
  }
];
const initialEquipment: any[] = [
  {
    id: 'PRN-FUJI-V180',
    name: 'Fuji Xerox Versant 180 Press',
    brand: 'Fuji Xerox',
    model: 'Versant 180',
    serialNumber: 'FXV180-202401',
    category: 'Printer',
    printerCategory: 'Digital Color Press',
    status: 'In Use',
    location: 'Main Press Floor (Room A)',
    purchaseCost: 450000000,
    lifespanYears: 5,
    printedPagesCapacity: 1500000,
    printedCount: 234500,
    calculatedCostPerPage: 300,
    purchaseDate: '2024-01-15',
    warrantyExpiration: '2027-01-15',
    lastMaintenanceDate: '2026-07-20',
    components: [
      { name: 'Drum Unit Black', usage: 35, threshold: 90 },
      { name: 'Drum Unit Color (CMY)', usage: 42, threshold: 90 },
      { name: 'Fuser Unit 220V', usage: 50, threshold: 90 },
      { name: 'Transfer Belt Assembly', usage: 28, threshold: 85 }
    ]
  },
  {
    id: 'PRN-EPSON-L1800',
    name: 'Epson L1800 6-Color Photo',
    brand: 'Epson',
    model: 'L1800',
    serialNumber: 'EP-L1800-8832',
    category: 'Printer',
    printerCategory: 'Inkjet Photo',
    status: 'In Use',
    location: 'Digital Finishing Room',
    purchaseCost: 18500000,
    lifespanYears: 3,
    printedPagesCapacity: 200000,
    printedCount: 42100,
    calculatedCostPerPage: 92.5,
    purchaseDate: '2024-06-10',
    warrantyExpiration: '2026-06-10',
    lastMaintenanceDate: '2026-08-01',
    components: [
      { name: 'MicroPiezo Printhead', usage: 25, threshold: 85 },
      { name: 'Waste Ink Pad', usage: 48, threshold: 90 }
    ]
  },
  {
    id: 'MAC-CUTTER-920',
    name: 'QZYK920 Hydraulic Paper Guillotine',
    brand: 'QZYK',
    model: '920-Program Control',
    serialNumber: 'QZ-920-1102',
    category: 'Cutter',
    postPressSubtype: 'guillotine',
    status: 'In Use',
    location: 'Cutting & Binding Section',
    purchaseCost: 85000000,
    lifespanYears: 10,
    printedPagesCapacity: 3000000,
    printedCount: 520000,
    calculatedCostPerPage: 28.3,
    purchaseDate: '2023-03-20',
    warrantyExpiration: '2028-03-20',
    lastMaintenanceDate: '2026-08-10',
    components: [
      { name: 'High-Speed Steel Blade (ໃບມີດ)', usage: 30, threshold: 95 },
      { name: 'Cutting Stick (ແທ່ງຮອງຕັດ)', usage: 45, threshold: 90 },
      { name: 'Hydraulic Oil Pressure (ນ້ຳມັນໄຮໂດຼລິກ)', usage: 20, threshold: 90 }
    ]
  },
  {
    id: 'MAC-LAM-FM360',
    name: 'FM-360 Roll Laminator Hot & Cold',
    brand: 'Boway',
    model: 'FM-360',
    serialNumber: 'BW-FM360-449',
    category: 'Laminator',
    postPressSubtype: 'laminator',
    status: 'In Use',
    location: 'Lamination Bay',
    purchaseCost: 22000000,
    lifespanYears: 5,
    printedPagesCapacity: 800000,
    printedCount: 115000,
    calculatedCostPerPage: 27.5,
    purchaseDate: '2024-02-01',
    warrantyExpiration: '2027-02-01',
    lastMaintenanceDate: '2026-07-15',
    components: [
      { name: 'Silicon Heating Roller (ລູກກິ້ງຄວາມຮ້ອນ)', usage: 22, threshold: 85 },
      { name: 'Temperature Sensor SLA', usage: 15, threshold: 90 }
    ]
  },
  {
    id: 'MAC-BIND-WD50',
    name: 'WD-50A Perfect Glue Thermal Binder',
    brand: 'Superbind',
    model: 'WD-50A',
    serialNumber: 'SB-WD50-992',
    category: 'Binder',
    postPressSubtype: 'binder',
    status: 'In Use',
    location: 'Book Binding Workshop',
    purchaseCost: 35000000,
    lifespanYears: 6,
    printedPagesCapacity: 600000,
    printedCount: 78000,
    calculatedCostPerPage: 58.3,
    purchaseDate: '2023-11-10',
    warrantyExpiration: '2026-11-10',
    lastMaintenanceDate: '2026-08-05',
    components: [
      { name: 'Milling Cutter Head (ຫົວປາດສັນປຶ້ມ)', usage: 28, threshold: 90 },
      { name: 'Hot Melt Glue Tank (ໝໍ້ຕົ້ມກາວ)', usage: 35, threshold: 90 },
      { name: 'Side Glue Roller (ລູກກິ້ງກາວຂ້າງ)', usage: 20, threshold: 85 }
    ]
  }
];
const initialCustomers: any[] = [];
const initialOffcuts: any[] = [
  {
    id: 'OFF-ART-260-A5',
    name: 'ເສດເຈ້ຍ Art Card 260gsm (A5 148×210mm)',
    qty: 120,
    paperId: 'PAP-ART-260',
    costPerSheet: 450,
    widthMm: 148,
    heightMm: 210,
    dimensionFormatted: '148 × 210 mm (A5)',
    grammageGsm: 260,
    paperType: 'Art Card',
    notes: 'ຊັ້ນວາງເສດເຈ້ຍ A-01'
  },
  {
    id: 'OFF-KRAFT-150-A6',
    name: 'ເສດເຈ້ຍ Kraft 150gsm (A6 105×148mm)',
    qty: 80,
    paperId: 'PAP-KRAFT-150',
    costPerSheet: 250,
    widthMm: 105,
    heightMm: 148,
    dimensionFormatted: '105 × 148 mm (A6)',
    grammageGsm: 150,
    paperType: 'Kraft Paper',
    notes: 'ຊັ້ນວາງເສດເຈ້ຍ B-02'
  }
];
const initialPurchaseOrders: any[] = [];
const initialOrders: any[] = [];
const initialSpoilageLogs: any[] = [];
const initialQuotations: any[] = [];
const initialEmployees: any[] = [];
const initialMachineStatus: any = {};
const initialDowntimeLogs: any[] = [];
const initialPurchaseRequisitions: any[] = [];
const initialDeliveries: any[] = [];
const initialPrinterColorLinks: any[] = [];

const initialCouriers = [
  {
    id: 'anousith_express',
    name: 'Anousith Express (ອະນຸສິດ ເອັກສະເປຣັສ)',
    shortName: 'Anousith',
    logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=150',
    fee: 15000,
    eta: '1-2 ວັນ (1-2 Days)',
    freeAbove: 300000,
    color: '#d97706',
    isActive: true,
    isDefault: true,
  },
  {
    id: 'hal_logistics',
    name: 'HAL Logistics (ຮົງອາລຸນ ຂົນສົ່ງ)',
    shortName: 'HAL',
    logoUrl: '/api/v1/orders/files/logo_1787356736419680000.png',
    fee: 20000,
    eta: '1-2 ວັນ (1-2 Days)',
    freeAbove: 350000,
    color: '#2563eb',
    isActive: true,
    isDefault: false,
  },
];

const initialPaymentMethods = [
  {
    id: 'bcel_one',
    bankName: 'BCEL (ທະນາຄານການຄ້າຕ່າງປະເທດລາວ ມະຫາຊົນ)',
    accountName: 'Som-Sing Phim Printing Shop',
    accountNumber: '160-12-00-01234567-001',
    branch: 'Vientiane Head Office',
    qrCodeUrl: '/assets/images/bcel-qr-placeholder.png',
    promptpayName: 'Som-Sing Phim',
    isActive: true,
    isDefault: true,
  },
  {
    id: 'ldb_trust',
    bankName: 'LDB (ທະນາຄານ ພັດທະນາລາວ)',
    accountName: 'Som-Sing Phim Printing Shop',
    accountNumber: '010-00-11-98765432-001',
    branch: 'Lane Xang Branch',
    qrCodeUrl: '/assets/images/bcel-qr-placeholder.png',
    promptpayName: 'Som-Sing Phim',
    isActive: true,
    isDefault: false,
  },
];

// Multi-Currency configuration (all internal values are stored in LAK base)
const CURRENCY_META = {
  LAK: { symbol: '₭', locale: 'lo-LA', currency: 'LAK', rate: 1 },
  THB: { symbol: '฿', locale: 'th-TH', currency: 'THB', rate: 700 },
  USD: { symbol: '$', locale: 'en-US', currency: 'USD', rate: 21000 }
};

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
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    };
    try {
      return new Intl.NumberFormat(meta.locale, options).format(converted);
    } catch (e) {
      return `${meta.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  // ---- Technician Earning Records (Piece-rate & Incentives) ----
  const [earningRecords, setEarningRecords] = useState<EarningRecord[]>(() => {
    const saved = localStorage.getItem('ss_print_earning_records_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'EARN-101',
        employeeId: 'EMP-001',
        employeeName: 'ສົມສິດ ອິນທິລາດ',
        orderId: 'ORD-20260804-001',
        orderNumber: 'ORD-20260804-001',
        customerName: 'ບໍລິສັດ ຈະເລີນພອນ',
        stepId: 'step_default_print',
        stepName: 'Digital / Offset Printing',
        impressions: 2500,
        ratePerImpression: 5,
        earnedAmount: 12500,
        recordedAt: '2026-08-04T10:30:00.000Z'
      },
      {
        id: 'EARN-102',
        employeeId: 'EMP-002',
        employeeName: 'ຄຳຜັນ ວົງວິໄລ',
        orderId: 'ORD-20260804-002',
        orderNumber: 'ORD-20260804-002',
        customerName: 'ຮ້ານອາຫານ ດາວຄຳ',
        stepId: 'step_default_cut',
        stepName: 'Guillotine Precision Cutting',
        impressions: 1200,
        ratePerImpression: 5,
        earnedAmount: 6000,
        recordedAt: '2026-08-04T11:15:00.000Z'
      }
    ];
  });

  useEffect(() => {
    safeSetItem('ss_print_earning_records_v1', earningRecords);
  }, [earningRecords]);

  const addEarningRecord = (record: Omit<EarningRecord, 'id' | 'recordedAt'>) => {
    const newRecord: EarningRecord = {
      ...record,
      id: `EARN-${Date.now().toString().slice(-6)}`,
      recordedAt: new Date().toISOString()
    };
    setEarningRecords(prev => [newRecord, ...prev]);

    fetch('/api/v1/hr/earnings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    }).catch(err => console.warn('Add technician earning API notice:', err));

    showToast('ບັນທຶກຄ່າຕອບແທນຊ່າງພິມຮຽບຮ້ອຍແລ້ວ!', 'success');

    // Also update impressionsProduced on the employee
    setEmployees((prev: any[]) => prev.map(emp => {
      if (emp.id === record.employeeId) {
        return {
          ...emp,
          impressionsProduced: (Number(emp.impressionsProduced) || 0) + Number(record.impressions || 0)
        };
      }
      return emp;
    }));
  };

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

  // ---- Couriers & Logistics Master Data ----
  const [couriers, setCouriers] = useState(() => {
    const saved = localStorage.getItem('ss_print_couriers_v1');
    return saved ? JSON.parse(saved) : initialCouriers;
  });

  useEffect(() => {
    safeSetItem('ss_print_couriers_v1', couriers);
    if (couriers && couriers.length > 0) {
      syncCouriersToBackend(couriers);
    }
  }, [couriers]);

  // ---- Payment Methods / Bank Accounts Master Data ----
  const [bankAccounts, setBankAccounts] = useState(() => {
    const saved = localStorage.getItem('ss_print_bank_accounts_v1');
    return saved ? JSON.parse(saved) : initialPaymentMethods;
  });

  useEffect(() => {
    safeSetItem('ss_print_bank_accounts_v1', bankAccounts);
    if (bankAccounts && bankAccounts.length > 0) {
      syncBankAccountsToBackend(bankAccounts);
    }
  }, [bankAccounts]);

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

  const askConfirmation = (msgOrOptions: any, onConfirmCallback?: () => void) => {
    if (typeof msgOrOptions === 'object' && msgOrOptions !== null) {
      const message = msgOrOptions.message || msgOrOptions.title || '';
      const cb = msgOrOptions.onConfirm || onConfirmCallback || (() => {});
      setConfirmDialog({
        message: typeof message === 'string' ? message : JSON.stringify(message),
        onConfirm: () => {
          cb();
          setConfirmDialog(null);
        },
        onCancel: () => {
          setConfirmDialog(null);
        }
      });
      return;
    }

    setConfirmDialog({
      message: String(msgOrOptions || ''),
      onConfirm: () => {
        if (onConfirmCallback) onConfirmCallback();
        setConfirmDialog(null);
      },
      onCancel: () => {
        setConfirmDialog(null);
      }
    });
  };

  const sanitizeInventoryItem = (item: any) => {
    if (!item) return item;
    const cat = (item.category || '').toLowerCase();
    const nameLower = (item.name || '').toLowerCase();
    const isPaper = cat === 'paper' || cat === 'material' || nameLower.includes('paper') || nameLower.includes('ເຈ້ຍ') || nameLower.includes('double a') || nameLower.includes('green read') || nameLower.includes('idea');
    let multiplier = Number(item.purchaseMultiplier || item.purchase_multiplier || item.specs?.sheetsPerPack || item.specs?.sheets_per_pack || item.specs?.sheets_per_ream || 500);
    if (isPaper && (!multiplier || multiplier <= 1)) {
      multiplier = 500;
    }
    
    let currentStockSheets = Number(item.stockQty) || Number(item.currentStock) || 0;
    if (isPaper && currentStockSheets > 0 && currentStockSheets <= 100) {
      currentStockSheets = currentStockSheets * multiplier;
    } else if (isPaper && currentStockSheets === 0) {
      currentStockSheets = multiplier;
    }

    const costPerPurchase = Number(item.costPerPurchaseUnit || item.cost_per_purchase_unit || item.price || 95000);
    const rawCostPerCons = Number(item.costPerConsumptionUnit || item.cost_per_consumption_unit || 0);
    const costPerConsumption = isPaper 
      ? ((rawCostPerCons > 0 && rawCostPerCons < (costPerPurchase / 2)) ? rawCostPerCons : (multiplier > 0 ? (costPerPurchase / multiplier) : costPerPurchase))
      : (rawCostPerCons > 0 ? rawCostPerCons : costPerPurchase);

    let rawBatches = (item.batches || []).filter((b: any) => b.id && !b.id.includes('-EMPTY'));
    let realBatches: any[] = [];
    const seenBatchKeys = new Set();

    for (const b of rawBatches) {
      const key = b.id || b.poNumber || b.batchId;
      if (key && !seenBatchKeys.has(key)) {
        seenBatchKeys.add(key);
        let bQty = Number(b.currentQty || b.initialQty || 0);
        if (isPaper && bQty > 0 && bQty <= 100) {
          bQty = bQty * multiplier;
        }
        let bInit = Number(b.initialQty || bQty);
        if (isPaper && bInit > 0 && bInit <= 100) {
          bInit = bInit * multiplier;
        }
        const bPurchasePrice = Number(b.purchasePricePerReam || b.purchasePrice || costPerPurchase);
        const bCostPerSheet = isPaper
          ? (Number(b.costPerSheet) > 0 && Number(b.costPerSheet) < (bPurchasePrice / 2) ? Number(b.costPerSheet) : (multiplier > 0 ? bPurchasePrice / multiplier : costPerConsumption))
          : Number(b.costPerSheet || costPerConsumption);

        realBatches.push({
          ...b,
          initialQty: bInit,
          currentQty: bQty,
          purchasePricePerReam: bPurchasePrice,
          costPerSheet: bCostPerSheet
        });
      }
    }

    if (realBatches.length === 0) {
      const lotId = `LOT-${(item.id || 'SKU').replace('PAP-', '').slice(-4)}`;
      realBatches = [
        {
          id: lotId,
          purchaseDate: item.receiptDate || item.importDate || new Date().toISOString().split('T')[0],
          supplierName: item.supplier || item.supplierName || item.vendor || '',
          purchasePricePerReam: costPerPurchase,
          costPerSheet: costPerConsumption,
          initialQty: currentStockSheets,
          currentQty: currentStockSheets
        }
      ];
    }

    const calculatedStock = realBatches.reduce((sum: number, b: any) => sum + Number(b.currentQty || 0), 0);

    return {
      ...item,
      stockQty: calculatedStock,
      purchaseMultiplier: multiplier,
      costPerPurchaseUnit: costPerPurchase,
      costPerConsumptionUnit: costPerConsumption,
      consumptionUnit: isPaper ? 'ແຜ່ນ' : (item.consumptionUnit === 'แผ่น' ? 'ແຜ່ນ' : (item.consumptionUnit || 'Units')),
      purchaseUnit: isPaper ? 'ແພັກ' : (item.purchaseUnit === 'แพ็ก' ? 'ແພັກ' : (item.purchaseUnit || 'Units')),
      batches: realBatches
    };
  };


  const getDeletedIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem('som_sing_deleted_item_ids');
      if (raw) return new Set(JSON.parse(raw));
    } catch (e) {}
    return new Set();
  };

  const recordDeletedId = (id: string) => {
    if (!id) return;
    try {
      const set = getDeletedIds();
      set.add(id);
      set.add(id.toLowerCase());
      localStorage.setItem('som_sing_deleted_item_ids', JSON.stringify(Array.from(set)));
    } catch (e) {}
  };

  const unrecordDeletedId = (id: string) => {
    if (!id) return;
    try {
      const set = getDeletedIds();
      set.delete(id);
      set.delete(id.toLowerCase());
      localStorage.setItem('som_sing_deleted_item_ids', JSON.stringify(Array.from(set)));
    } catch (e) {}
  };

  const [inventory, setInventory] = useState(() => {
    const deletedIds = getDeletedIds();
    const saved = localStorage.getItem('ss_print_inventory_v6');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const unique = [];
          const seen = new Set();
          for (const item of parsed) {
            if (item && item.id && !seen.has(item.id) && !deletedIds.has(item.id) && !deletedIds.has(item.id.toLowerCase())) {
              seen.add(item.id);
              unique.push(sanitizeInventoryItem(item));
            }
          }
          return unique;
        }
      } catch (e) {}
    }
    return [];
  });

  const [equipment, setEquipment] = useState(() => {
    const deletedIds = getDeletedIds();
    const saved = localStorage.getItem('ss_print_equipment_v6');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(i => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase()));
        }
      } catch (e) {}
    }
    return [];
  });

  const refreshData = async () => {
    const deletedIds = getDeletedIds();
    let inbItems: any[] = [];

    // Pre-fetch inbound transactions for assets & inventory merging
    try {
      const inbRes = await fetch('/api/inbound');
      if (inbRes && inbRes.ok) {
        const inbData = await inbRes.json();
        inbItems = Array.isArray(inbData) ? inbData : (inbData?.data || []);
      }
    } catch (e) {}

    // 1. Assets / Equipment & Inbound Printers (Database Fetch)
    try {
      let res = await fetch('/api/equipment');
      if (!res.ok) {
        res = await fetch('/api/v1/assets');
      }
      const resData = (res && res.ok) ? await res.json() : null;
      const rawItems = Array.isArray(resData) ? resData : (resData?.data || []);

      const printerInbounds = inbItems.filter((i: any) => {
        const c = (i.category || '').toUpperCase();
        const sku = (i.skuCode || i.id || '').toUpperCase();
        return c === 'PRINTER' || c === 'MACHINERY' || c === 'EQUIPMENT' || sku.startsWith('PRN');
      }).map((p: any) => ({
        id: p.id || p.skuCode,
        name: p.itemName || p.name || `${p.specs?.brand || ''} ${p.specs?.model || ''}`.trim() || p.id,
        brand: p.specs?.brand || p.brand || '',
        model: p.specs?.model || p.model || '',
        serialNumber: p.specs?.serialNumber || p.serialNumber || p.skuCode || '',
        category: 'Printer',
        printerCategory: p.specs?.printerCategory || p.printerCategory || 'Digital Press',
        colorSchemeType: p.specs?.colorSchemeType || p.colorSchemeType || 'CMYK',
        totalColorSlots: Number(p.specs?.totalColorSlots || p.totalColorSlots || 4),
        purchaseCost: Number(p.totalPrice || p.price || p.purchaseCost || 0),
        expectedLifeA4Pages: Number(p.specs?.expectedLifeA4Pages || p.expectedLifeA4Pages || 3000000),
        TargetTotalPages: Number(p.specs?.expectedLifeA4Pages || p.TargetTotalPages || 3000000),
        printedPagesCapacity: Number(p.specs?.expectedLifeA4Pages || p.printedPagesCapacity || 3000000),
        lifespanYears: Number(p.specs?.lifespanYears || p.lifespanYears || 5),
        maintenanceRatePercent: Number(p.specs?.maintenanceRatePercent || p.maintenanceRatePercent || 15),
        costPerConsumptionUnit: Number(p.specs?.costPerConsumptionUnit || p.calculatedCostPerPage || 0),
        calculatedCostPerPage: Number(p.specs?.calculatedCostPerPage || p.calculatedCostPerPage || 0),
        status: 'In Use',
        location: p.specs?.location || p.location || 'Main Press Floor',
        specs: p.specs || {}
      }));

      const combinedAssets = [...rawItems, ...printerInbounds];

      if (combinedAssets.length > 0) {
        setEquipment(prevEq => {
          const mapById = new Map();
          (prevEq || []).filter(i => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase())).forEach(item => mapById.set(item.id, item));
          combinedAssets.filter((i: any) => !deletedIds.has(i.id) && !deletedIds.has(i.id?.toLowerCase())).forEach((item: any) => {
            const formattedItem = {
              ...item,
              name: item.name || `${item.brand || ''} ${item.model || ''}`.trim() || item.id,
              purchaseCost: Number(item.price || item.purchaseCost || item.purchasePrice || item.priceCost || 0),
              printedPagesCapacity: Number(item.expectedLifeA4Pages || item.printedPagesCapacity || item.TargetTotalPages || 3000000),
              maintenanceRatePercent: Number(item.maintenanceRatePercent || 15),
              colorSchemeType: item.colorSchemeType || item.specs?.colorScheme || 'CMYK'
            };
            if (mapById.has(item.id)) {
              mapById.set(item.id, { ...mapById.get(item.id), ...formattedItem });
            } else {
              mapById.set(item.id, formattedItem);
            }
          });
          const merged = Array.from(mapById.values());
          safeSetItem('ss_print_equipment_v6', merged);
          return merged;
        });
      }
    } catch (e) {}

    // 2. Inventory Items
    try {
      const res = await fetch('/api/inventory/items');
      let dbInventory: any[] = [];
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data) && resData.data.length > 0) {
          dbInventory = resData.data.map(sanitizeInventoryItem);
        }
      }

      // Merge Inbound items (Inks, Consumables, Raw Materials, Paper) directly from PostgreSQL inbound transactions
      const inboundMaterials = inbItems.filter((i: any) => {
        const c = (i.category || '').toUpperCase();
        const sku = (i.skuCode || i.id || '').toUpperCase();
        const name = (i.itemName || i.name || '').toUpperCase();
        return c.includes('INK') || c.includes('PAPER') || c.includes('CONSUMABLE') || c.includes('MATERIAL') || 
               name.includes('INK') || name.includes('TONER') || sku.startsWith('INK') || sku.startsWith('PAP') || sku.startsWith('MAT');
      }).map((m: any) => {
        const c = (m.category || '').toUpperCase();
        const isPaper = c.includes('PAPER') || c.includes('MATERIAL') || (m.itemName || m.name || '').toLowerCase().includes('paper');
        let multiplier = Number(m.specs?.sheets_per_pack || m.specs?.sheets_per_ream || m.specs?.sheetsPerPack || m.purchaseMultiplier || m.purchase_multiplier);
        if (isPaper && (!multiplier || multiplier <= 1)) {
          multiplier = 500;
        }
        const qty = Number(m.quantity || m.importQty || 1);
        const totalSheets = isPaper ? (qty > 0 && qty <= 100 ? qty * multiplier : qty) : qty;
        const pPrice = m.totalPrice && qty ? (Number(m.totalPrice) / qty) : Number(m.unitPrice || m.totalPrice || 95000);
        const cPrice = isPaper ? (pPrice / multiplier) : pPrice;

        return sanitizeInventoryItem({
          id: m.skuCode || m.id,
          sku: m.skuCode || m.id,
          skuCode: m.skuCode || m.id,
          name: m.itemName || m.name || m.skuCode || m.id,
          category: isPaper ? 'Paper' : (m.category || 'Consumable'),
          supplier: m.supplierName || m.supplier || 'Supplier',
          supplierName: m.supplierName || m.supplier || 'Supplier',
          stockQty: totalSheets,
          unitPrice: pPrice,
          costPerPurchaseUnit: pPrice,
          costPerConsumptionUnit: cPrice,
          consumptionUnit: isPaper ? 'ແຜ່ນ' : (m.unit || 'ຕຸກ'),
          purchaseUnit: isPaper ? 'ແພັກ' : (m.unit || 'ຕຸກ'),
          purchaseMultiplier: multiplier,
          imageUrl: m.specs?.productImage || m.imageUrl || m.productImage || (m.actual_images && m.actual_images[0]) || null,
          productImage: m.specs?.productImage || m.imageUrl || m.productImage || (m.actual_images && m.actual_images[0]) || null,
          brand: m.specs?.brand || m.brand || '',
          volume: Number(m.specs?.volume || m.specs?.volume_ml || 140),
          specs: m.specs || {}
        });
      });


      const combinedInventory = [...dbInventory, ...inboundMaterials];

      if (combinedInventory.length > 0) {
        setInventory(prevInv => {
          const mapById = new Map();
          (prevInv || []).filter(i => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase())).forEach(item => mapById.set(item.id, item));
          combinedInventory.filter((i: any) => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase())).forEach((item: any) => {
            if (mapById.has(item.id)) {
              mapById.set(item.id, { ...mapById.get(item.id), ...item });
            } else {
              mapById.set(item.id, item);
            }
          });
          const merged = Array.from(mapById.values());
          safeSetItem('ss_print_inventory_v6', merged);
          return merged;
        });
      }
    } catch (e) {}


    // 3. Orders (Safe Merge Strategy)
    try {
      let res = await fetch('/api/v1/orders');
      if (!res.ok) res = await fetch('/api/orders');
      if (res && res.ok) {
        const data = await res.json();
        const serverList = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
        if (serverList.length > 0) {
          setOrders(prev => {
            const mapById = new Map();
            // 1. Put backend orders
            serverList.forEach((item: any) => {
              const id = item.id || item.orderNo || item.order_no;
              if (id) mapById.set(id, item);
            });
            // 2. Put local orders (local state takes precedence so newly created orders and status changes are preserved)
            prev.forEach((item: any) => {
              const id = item.id || item.orderNo || item.order_no;
              if (id) mapById.set(id, item);
            });
            const merged = Array.from(mapById.values());
            safeSetItem('ss_print_orders_v6', merged);
            return merged;
          });
        }
      }
    } catch (e) {}

    // 3.5. Quotations (Safe Merge Strategy)
    try {
      let res = await fetch('/api/v1/quotations');
      if (!res.ok) res = await fetch('/api/quotations');
      if (res && res.ok) {
        const data = await res.json();
        const serverList = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
        if (serverList.length > 0) {
          setQuotations(prev => {
            const mapById = new Map();
            serverList.forEach((item: any) => {
              const id = item.id || item.quotation_no;
              if (id) mapById.set(id, item);
            });
            prev.forEach((item: any) => {
              const id = item.id || item.quotation_no;
              if (id) mapById.set(id, item);
            });
            const merged = Array.from(mapById.values());
            safeSetItem('ss_print_quotations_v6', merged);
            return merged;
          });
        }
      }
    } catch (e) {}

    // 4. Customers
    try {
      const res = await fetch('/api/customers');
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data)) {
          setCustomers(resData.data);
        }
      }
    } catch (e) {}

    // 5. Spoilage
    try {
      const res = await fetch('/api/spoilage');
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data)) {
          setSpoilageLogs(resData.data);
        }
      }
    } catch (e) {}

    // 6. Inbound Transactions
    try {
      const res = await fetch('/api/inbound');
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data)) {
          const mappedInbound = resData.data.map((item: any) => ({
            id: item.id,
            poNumber: item.poNumber || item.id,
            receiptDate: item.inboundDate || new Date().toISOString().split('T')[0],
            importDate: item.inboundDate || new Date().toISOString().split('T')[0],
            category: item.category,
            name: item.itemName,
            sku: item.skuCode,
            skuCode: item.skuCode,
            importQty: item.quantity || 1,
            unit: item.unit || 'แพ็ก',
            supplier: item.supplierName || 'Supplier',
            totalPrice: item.totalPrice || 0,
            unitPrice: item.totalPrice && item.quantity ? Math.round(item.totalPrice / item.quantity) : item.totalPrice,
            paymentMethod: item.paymentMethod || 'TRANSFER',
            origin: item.origin || 'TH',
            specs: item.specs || {}
          }));
          setLinkedInboundEntries(prev => {
            const mapById = new Map();
            (prev || []).forEach(item => mapById.set(item.id, item));
            mappedInbound.forEach((item: any) => mapById.set(item.id, item));
            const merged = Array.from(mapById.values());
            safeSetItem('ss_print_inbound_entries_v6', merged);
            return merged;
          });
        }
      }
    } catch (e) {}

    // 7. Technician Earnings
    try {
      const res = await fetch('/api/v1/hr/earnings');
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data) && resData.data.length > 0) {
          setEarningRecords(resData.data);
        }
      }
    } catch (e) {}

    // 8. Machine Downtime Logs
    try {
      const res = await fetch('/api/v1/production/downtime');
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data) && resData.data.length > 0) {
          setDowntimeLogs(resData.data);
        }
      }
    } catch (e) {}

    // 9. Deliveries / Dispatches
    try {
      const res = await fetch('/api/v1/orders/deliveries');
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data) && resData.data.length > 0) {
          setDeliveries(resData.data);
        }
      }
    } catch (e) {}

    const localCouriers = localStorage.getItem('ss_print_couriers_v1');
    if (localCouriers) {
      try {
        const parsed = JSON.parse(localCouriers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          fetch('/api/v1/admin/couriers/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }).catch(err => console.warn('Couriers sync notice:', err));
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      fetch('/api/v1/couriers')
        .then(res => (res && res.ok ? res.json() : null))
        .then(resData => {
          if (resData && resData.status === 'success' && Array.isArray(resData.data) && resData.data.length > 0) {
            setCouriers(resData.data);
          }
        })
        .catch(err => console.warn('Couriers fetch notice:', err));
    }

    const localBanks = localStorage.getItem('ss_print_bank_accounts_v1');
    if (localBanks) {
      try {
        const parsed = JSON.parse(localBanks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          fetch('/api/v1/admin/payment-methods/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }).catch(err => console.warn('Payment methods sync notice:', err));
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      fetch('/api/v1/payment-methods')
        .then(res => (res && res.ok ? res.json() : null))
        .then(resData => {
          if (resData && resData.status === 'success' && Array.isArray(resData.data) && resData.data.length > 0) {
            setBankAccounts(resData.data);
          }
        })
        .catch(err => console.warn('Payment methods fetch notice:', err));
    }

    // 4. Offcuts Scrap Registry (Backend Sync)
    try {
      let offRes = await fetch('/api/inventory/offcuts');
      if (!offRes.ok) offRes = await fetch('/api/inventory/offcuts');
      if (offRes && offRes.ok) {
        const offList = await offRes.json();
        if (Array.isArray(offList) && offList.length > 0) {
          const mappedOffcuts = offList.map((o: any) => ({
            id: o.id || `OFF-${Date.now()}`,
            sku: o.id,
            name: o.name || 'Offcut Remnant',
            category: 'Offcut',
            stockQty: Number(o.quantity || 0),
            consumptionUnit: 'ແຜ່ນ',
            purchaseUnit: 'ແຜ່ນ',
            purchaseMultiplier: 1,
            costPerPurchaseUnit: 400,
            costPerConsumptionUnit: 400,
            paperId: o.parent_material_id || o.parentMaterialId || '',
            isOffcut: true,
            location: o.location || 'Main Stock',
            notes: o.location ? `Location: ${o.location}` : '',
            specs: {
              widthMm: Number(o.width_mm || o.widthMm || 148),
              heightMm: Number(o.length_mm || o.lengthMm || o.heightMm || 210),
              dimensionFormatted: `${o.width_mm || 148} × ${o.length_mm || 210} mm`,
              grammageGsm: 130,
              paperType: 'Art Paper',
              location: o.location || 'Main Stock',
              parentMaterialId: o.parent_material_id || ''
            }
          }));
          setOffcuts(prev => {
            const mapById = new Map();
            (prev || []).forEach(item => mapById.set(item.id, item));
            mappedOffcuts.forEach(item => mapById.set(item.id, item));
            const merged = Array.from(mapById.values());
            safeSetItem('ss_print_offcuts_v6', merged);
            return merged;
          });
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshData();
  }, []);
  const normalizeCustomerOrder = (raw: any) => {
    if (!raw) return null;
    const items = Array.isArray(raw.items) && raw.items.length > 0
      ? raw.items.map((it: any, idx: number) => ({
          id: it.id || `item-${idx + 1}`,
          name: it.product_name || it.name || 'ງານສິ່ງພິມ (Custom Print)',
          quantity: Number(it.quantity) || 1,
          pageCount: Number(it.page_count) || 1,
          paperSize: it.specs?.size || it.paperSize || 'A4',
          paperType: it.specs?.paper || it.paperType || 'Art 80g',
          finishing: it.specs?.finishing || it.finishing || 'None',
          unitPrice: Number(it.unit_price) || 0,
          totalPrice: Number(it.total_price) || Number(raw.total_price) || 0,
          driveLink: it.drive_link || raw.drive_link || '',
        }))
      : [{
          id: 'item-1',
          name: raw.product_name || (raw.specs && raw.specs.size ? `ງານພິມ (${raw.specs.size})` : 'Custom Print Item'),
          quantity: Number(raw.quantity) || 1,
          pageCount: 1,
          paperSize: raw.specs?.size || 'A4',
          paperType: raw.specs?.paper || 'Art 80g',
          finishing: raw.specs?.finishing || 'None',
          unitPrice: Number(raw.total_price) / (Number(raw.quantity) || 1),
          totalPrice: Number(raw.total_price) || 0,
          driveLink: raw.drive_link || '',
        }];

    return {
      id: raw.order_id || raw.id || `SSP-${Math.floor(10000 + Math.random() * 90000)}`,
      orderNo: raw.order_id || raw.id || raw.order_no,
      customerName: raw.customer_name || raw.customerName || 'ລູກຄ້າທົ່ວໄປ (Customer)',
      phone: raw.phone || raw.customer_phone || '',
      email: raw.email || raw.customer_email || '',
      address: raw.address || '',
      items,
      status: raw.status === 'PAID_PREPRESS' ? 'Pending' : (raw.status || 'Pending'),
      paymentStatus: raw.payment_slip_url || raw.status === 'PAID_PREPRESS' ? 'Paid' : 'Unpaid',
      paymentMethod: 'BCEL OnePay QR',
      paymentSlipUrl: raw.payment_slip_url || '',
      driveLink: raw.drive_link || '',
      totalAmount: Number(raw.total_price) || Number(raw.total_amount_lak) || 0,
      paidAmount: raw.payment_slip_url || raw.status === 'PAID_PREPRESS' ? (Number(raw.total_price) || 0) : 0,
      remainingAmount: 0,
      shippingCourier: raw.shipping_courier_id || 'Anousith Express',
      shippingFee: Number(raw.shipping_fee) || 0,
      createdAt: raw.created_at || new Date().toISOString(),
      promisedDeliveryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0],
    };
  };

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('ss_print_orders_v6');
    let baseList = saved ? JSON.parse(saved) : initialOrders;
    
    // Merge any customer-service placed orders
    try {
      const existingIds = new Set(baseList.map((o: any) => o.id || o.orderNo));

      // 1. Check ssp_orders array
      const sspOrdersRaw = localStorage.getItem('ssp_orders') || localStorage.getItem('ssp_orders_v1');
      if (sspOrdersRaw) {
        const sspList = JSON.parse(sspOrdersRaw);
        if (Array.isArray(sspList)) {
          for (const sspOrd of sspList) {
            const norm = normalizeCustomerOrder(sspOrd);
            if (norm && !existingIds.has(norm.id) && !existingIds.has(norm.orderNo)) {
              baseList = [norm, ...baseList];
              existingIds.add(norm.id);
            }
          }
        }
      }

      // 2. Check ssp_placed_order single object
      const sspPlacedRaw = localStorage.getItem('ssp_placed_order');
      if (sspPlacedRaw) {
        const placed = JSON.parse(sspPlacedRaw);
        const norm = normalizeCustomerOrder(placed);
        if (norm && !existingIds.has(norm.id) && !existingIds.has(norm.orderNo)) {
          baseList = [norm, ...baseList];
          existingIds.add(norm.id);
        }
      }
    } catch {
      // ignore
    }
    return baseList;
  });

  // Listen for storage events across tabs to instantly sync newly placed customer orders
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'ssp_orders' || e.key === 'ssp_placed_order' || e.key === 'ssp_orders_v1') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          setOrders((prev: any[]) => {
            const existingIds = new Set(prev.map(o => o.id || o.orderNo));
            let updated = [...prev];
            for (const sspOrd of list) {
              const norm = normalizeCustomerOrder(sspOrd);
              if (norm && !existingIds.has(norm.id) && !existingIds.has(norm.orderNo)) {
                updated = [norm, ...updated];
                existingIds.add(norm.id);
              }
            }
            return updated;
          });
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
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
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    const rawLocal = localStorage.getItem('som_sing_inbound_list');
    if (rawLocal !== null) {
      try {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });
  const [printerColorLinks, setPrinterColorLinks] = useState(() => {
    const saved = localStorage.getItem('ss_print_color_links_v6');
    return saved ? JSON.parse(saved) : initialPrinterColorLinks;
  });
  const [meterReadings, setMeterReadings] = useState(() => {
    const saved = localStorage.getItem('ss_print_meter_readings_v6');
    return saved ? JSON.parse(saved) : [];
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

  useEffect(() => {
    safeSetItem('ss_print_meter_readings_v6', meterReadings);
  }, [meterReadings]);

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

  // Auto-sync & repair inventory stock & batches from inbound procurement logs
  useEffect(() => {
    const rawInboundList = localStorage.getItem('som_sing_inbound_list');
    let inboundLogs: any[] = [];
    if (rawInboundList) {
      try { inboundLogs = JSON.parse(rawInboundList); } catch (e) {}
    }
    const allInboundEntries = [...(linkedInboundEntries || []), ...inboundLogs];
    if (allInboundEntries.length === 0) return;

    setInventory(prev => {
      let updated = false;
      const existingIds = new Set(prev.map(item => item.id.toLowerCase()));
      const existingNames = new Set(prev.map(item => item.name.toLowerCase()));

      const newInv = prev.map(item => {
        const matches = allInboundEntries.filter(
          (e: any) => e && (
            (e.sku && e.sku.toLowerCase() === item.id.toLowerCase()) || 
            (e.id && e.id.toLowerCase() === item.id.toLowerCase()) || 
            (e.skuCode && e.skuCode.toLowerCase() === item.id.toLowerCase()) || 
            (e.name && e.name.toLowerCase() === item.name.toLowerCase()) ||
            (e.itemName && e.itemName.toLowerCase() === item.name.toLowerCase())
          )
        );
        if (matches.length === 0) return item;

        const sheetsPerPack = item.purchaseMultiplier || matches[0].sheetsPerPack || matches[0].specs?.sheetsPerPack || 500;
        const totalSheetsFromInbound = matches.reduce((sum, e) => {
          const packQty = Number(e.importQty || e.quantity || e.currentQty || 1);
          return sum + (packQty * sheetsPerPack);
        }, 0);

        const latestPrice = Number(matches[0].totalPrice || matches[0].unitPrice || item.costPerPurchaseUnit || 95000);
        const perSheetPrice = Math.round(latestPrice / sheetsPerPack);

        const constructedBatches = matches.map(e => ({
          id: e.poNumber || e.id || `LOT-${item.id}`,
          purchaseDate: e.receiptDate || e.importDate || new Date().toISOString().split('T')[0],
          supplierName: e.supplier || e.vendor || e.supplierName || '',
          purchasePricePerReam: Number(e.totalPrice || e.unitPrice || latestPrice),
          costPerSheet: perSheetPrice,
          initialQty: Number(e.importQty || e.quantity || 1) * sheetsPerPack,
          currentQty: Number(e.importQty || e.quantity || 1) * sheetsPerPack
        }));

        const hasRealBatches = (item.batches || []).some(b => b.id && !b.id.includes('-EMPTY'));
        if (item.stockQty !== totalSheetsFromInbound || !hasRealBatches) {
          updated = true;
          return {
            ...item,
            stockQty: totalSheetsFromInbound,
            costPerPurchaseUnit: latestPrice,
            costPerConsumptionUnit: perSheetPrice,
            batches: constructedBatches
          };
        }
        return item;
      });

      // Find any inbound item not yet represented in inventory
      const newlyDiscoveredItems: any[] = [];
      const deletedIds = getDeletedIds();
      allInboundEntries.forEach((e: any) => {
        if (!e) return;
        const isMachinery = e.category === 'PRINTER' || e.category === 'CUTTER' || e.category === 'MACHINERY';
        if (isMachinery) return;

        const sku = (e.sku || e.skuCode || e.id || '').trim();
        const name = (e.name || e.itemName || sku).trim();
        if (!sku && !name) return;
        if (deletedIds.has(sku) || deletedIds.has(sku.toLowerCase()) || deletedIds.has(name) || deletedIds.has(name.toLowerCase())) return;
        if (e.id && (deletedIds.has(e.id) || deletedIds.has(e.id.toLowerCase()))) return;
        if (e.poNumber && (deletedIds.has(e.poNumber) || deletedIds.has(e.poNumber.toLowerCase()))) return;

        const alreadyExists = (sku && existingIds.has(sku.toLowerCase())) || 
                              (name && existingNames.has(name.toLowerCase())) ||
                              newlyDiscoveredItems.some(it => it.id.toLowerCase() === sku.toLowerCase() || it.name.toLowerCase() === name.toLowerCase());

        if (!alreadyExists) {
          const isPaper = e.category === 'Paper' || e.category === 'PAPER' || e.category === 'MATERIAL';
          const sheetsPerPack = Number(e.sheetsPerPack || e.specs?.sheetsPerPack || (isPaper ? 500 : 1));
          const packQty = Number(e.importQty || e.quantity || e.currentQty || 1);
          const totalStock = isPaper ? packQty * sheetsPerPack : packQty;
          const price = Number(e.totalPrice || e.unitPrice || 95000);
          const unitPrice = isPaper ? Math.round(price / sheetsPerPack) : price;

          newlyDiscoveredItems.push(sanitizeInventoryItem({
            id: sku || `SKU-${Date.now()}`,
            name: name,
            category: isPaper ? 'Paper' : (e.category === 'INK' ? 'Ink' : (e.category || 'Finishing')),
            stockQty: totalStock,
            consumptionUnit: isPaper ? 'ແຜ່ນ' : (e.unit || 'Units'),
            purchaseUnit: isPaper ? 'ແພັກ' : (e.unit || 'Units'),
            purchaseMultiplier: sheetsPerPack,
            costPerPurchaseUnit: price,
            costPerConsumptionUnit: unitPrice,
            reorderThreshold: 50,
            specs: e.specs || {},
            batches: [
              {
                id: `LOT-${sku || Date.now()}`,
                purchaseDate: e.receiptDate || e.importDate || new Date().toISOString().split('T')[0],
                supplierName: e.supplier || e.vendor || e.supplierName || '',
                purchasePricePerReam: price,
                costPerSheet: unitPrice,
                initialQty: totalStock,
                currentQty: totalStock
              }
            ]
          }));
          if (sku) existingIds.add(sku.toLowerCase());
          if (name) existingNames.add(name.toLowerCase());
        }
      });

      if (newlyDiscoveredItems.length > 0) {
        updated = true;
        return [...newInv, ...newlyDiscoveredItems];
      }

      return updated ? newInv : prev;
    });

    // Auto-sync machinery and printers from inbound logs into equipment
    const machineryEntries = allInboundEntries.filter((e: any) => {
      if (!e) return false;
      const cat = (e.category || '').toUpperCase();
      return cat === 'PRINTER' || cat === 'MACHINERY' || cat === 'CUTTER' || cat === 'LAMINATOR' || cat === 'BINDER';
    });

    if (machineryEntries.length > 0) {
      setEquipment(prevEq => {
        let eqUpdated = false;
        const currentEqIds = new Set(prevEq.map(m => (m.id || '').toLowerCase()));
        const currentEqNames = new Set(prevEq.map(m => (m.name || '').toLowerCase()));
        const currentEqSerials = new Set(prevEq.map(m => (m.serialNumber || '').toLowerCase()));
        const deletedIds = getDeletedIds();
        const toAdd: any[] = [];

        machineryEntries.forEach((m: any) => {
          const skuCode = (m.sku || m.skuCode || '').trim();
          const inboundId = (m.id || m.poNumber || '').trim();
          const targetId = skuCode || inboundId || `MAC-${Date.now()}`;
          const targetName = (m.name || m.itemName || '').trim();
          const targetSn = (m.serialNumber || m.sn || '').trim();

          if (deletedIds.has(targetId) || deletedIds.has(targetId.toLowerCase())) return;
          if (inboundId && (deletedIds.has(inboundId) || deletedIds.has(inboundId.toLowerCase()))) return;
          if (targetSn && (deletedIds.has(targetSn) || deletedIds.has(targetSn.toLowerCase()))) return;

          // Check if this equipment already exists by SKU, Inbound ID, Serial Number, or exact Name
          const alreadyExists = (targetId && currentEqIds.has(targetId.toLowerCase())) ||
                                (skuCode && currentEqIds.has(skuCode.toLowerCase())) ||
                                (inboundId && currentEqIds.has(inboundId.toLowerCase())) ||
                                (targetSn && currentEqSerials.has(targetSn.toLowerCase())) ||
                                (targetName && currentEqNames.has(targetName.toLowerCase())) ||
                                toAdd.some(it => it.id.toLowerCase() === targetId.toLowerCase() || (targetName && it.name.toLowerCase() === targetName.toLowerCase()));

          if (!alreadyExists) {
            currentEqIds.add(targetId.toLowerCase());
            if (skuCode) currentEqIds.add(skuCode.toLowerCase());
            if (targetName) currentEqNames.add(targetName.toLowerCase());
            if (targetSn) currentEqSerials.add(targetSn.toLowerCase());
            eqUpdated = true;

            const isPrn = m.category === 'PRINTER' || m.category === 'Printer';
            const brand = m.brand || (targetName.split(' ')[0]) || 'Industrial';
            const model = m.model || (targetName.split(' ').slice(1).join(' ')) || targetId;

            toAdd.push({
              id: targetId,
              name: targetName || `${brand} ${model}`,
              brand: brand,
              model: model,
              serialNumber: targetSn || targetId,
              category: isPrn ? 'Printer' : (m.category === 'CUTTER' ? 'Cutter' : (m.category === 'LAMINATOR' ? 'Laminator' : 'Binder')),
              printerCategory: isPrn ? (m.printerCategory || 'Inkjet') : undefined,
              status: 'In Use',
              location: m.location || 'Main Dept',
              purchaseCost: Number(m.totalPrice || m.price || 0),
              lifespanYears: Number(m.lifespanYears || 5),
              printedPagesCapacity: Number(m.printedPagesCapacity || 1000000),
              printedCount: 0,
              calculatedCostPerPage: Number(m.calculatedCostPerPage || 0),
              purchaseDate: m.receiptDate || m.importDate || new Date().toISOString().split('T')[0],
              warrantyExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
              lastMaintenanceDate: new Date().toISOString().split('T')[0],
              components: [
                { name: isPrn ? 'Drum Unit SLA' : 'Main Blade / Roller', usage: 0, threshold: 90 },
                { name: isPrn ? 'Fuser Kit' : 'Motor System', usage: 0, threshold: 90 }
              ]
            });
          }
        });

        return eqUpdated ? [...prevEq, ...toAdd] : prevEq;
      });
    }
  }, [linkedInboundEntries]);

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
    if (!itemId) return 0;
    const item = inventory.find(i => 
      i.id === itemId || 
      i.sku === itemId || 
      i.id?.toLowerCase() === itemId?.toLowerCase() || 
      (i.sku && i.sku.toLowerCase() === itemId.toLowerCase()) || 
      i.name === itemId
    );
    if (!item) return 0;

    const mult = Number(item.purchaseMultiplier || item.purchase_multiplier || 500);
    const pCost = Number(item.costPerPurchaseUnit || item.cost_per_purchase_unit || 95000);
    const rawCostPerCons = Number(item.costPerConsumptionUnit || item.cost_per_consumption_unit || 0);
    const baseCost = (rawCostPerCons > 0 && (mult <= 1 || rawCostPerCons < (pCost / 2)))
      ? rawCostPerCons
      : (mult > 0 && pCost > 0 ? (pCost / mult) : rawCostPerCons);

    if (!item.batches || item.batches.length === 0) {
      return baseCost;
    }

    const sortedBatches = [...item.batches]
      .filter(b => Number(b.currentQty) > 0)
      .sort((a, b) => (a.purchaseDate || '').localeCompare(b.purchaseDate || ''));

    if (sortedBatches.length === 0) {
      return baseCost;
    }

    let remainingNeeded = Number(sheetsNeeded) || 1;
    let accumulatedCost = 0;

    for (let batch of sortedBatches) {
      const bQty = Number(batch.currentQty) || 0;
      const bReamPrice = Number(batch.purchasePricePerReam || batch.purchasePrice || pCost);
      const rawBatchCost = Number(batch.costPerSheet || batch.cost_per_sheet || 0);
      const bCost = (rawBatchCost > 0 && (mult <= 1 || rawBatchCost < (bReamPrice / 2)))
        ? rawBatchCost
        : (mult > 0 && bReamPrice > 0 ? (bReamPrice / mult) : baseCost);

      const take = Math.min(remainingNeeded, bQty);
      accumulatedCost += take * bCost;
      remainingNeeded -= take;
      if (remainingNeeded <= 0) break;
    }

    if (remainingNeeded > 0) {
      accumulatedCost += remainingNeeded * baseCost;
    }

    return (Number(sheetsNeeded) || 1) > 0 ? (accumulatedCost / (Number(sheetsNeeded) || 1)) : baseCost;
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

  const dischargeInventoryStock = (skuId: string, qtyNeeded: number, reason: string = 'MANUAL_DISCHARGE', remarks: string = '') => {
    deductStockFIFO(skuId, qtyNeeded);

    fetch(`/api/inventory/${skuId}/discharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skuId, quantity: qtyNeeded, reason, remarks })
    }).catch(err => console.log('Inventory discharge backend sync notice:', err));
  };

  const deductStockForOrder = (orderData: any) => {
    if (!orderData) return;
    const itemsArr = orderData.items || orderData.orderItems || [orderData];
    itemsArr.forEach((ordItem: any) => {
      const paperSkus = [
        ordItem.paperCode,
        ordItem.paperId,
        ordItem.cover_paper_id,
        ordItem.inner_paper_id,
        ordItem.sku,
        ordItem.materialId,
        ordItem.specs?.paper_id,
        ordItem.specs?.inventory_material_id
      ].filter(Boolean);

      const pagesCount = Number(ordItem.pages) || Number(ordItem.page_count) || Number(ordItem.pagesPerItem) || 1;
      const printQty = Number(ordItem.quantity) || Number(ordItem.qty) || 1;
      const totalSheets = printQty * pagesCount;

      if (paperSkus.length > 0) {
        const uniqueSkus = Array.from(new Set(paperSkus));
        uniqueSkus.forEach((sku: any) => {
          dischargeInventoryStock(sku, totalSheets, 'PRINT_PRODUCTION', `Order #${orderData.id || orderData.orderNo || 'Job'}`);
        });
      }

      if (ordItem.ink_bottle_id || ordItem.inkSku || ordItem.specs?.ink_sku) {
        const inkSku = ordItem.ink_bottle_id || ordItem.inkSku || ordItem.specs?.ink_sku;
        const avgCoverage = ((Number(ordItem.avg_cov_c || 0) + Number(ordItem.avg_cov_m || 0) + Number(ordItem.avg_cov_y || 0) + Number(ordItem.avg_cov_k || 0)) / 100) || 0.15;
        const inkMlNeeded = Math.ceil(totalSheets * avgCoverage * 0.05);
        if (inkMlNeeded > 0) {
          dischargeInventoryStock(inkSku, inkMlNeeded, 'PRINT_PRODUCTION', `Ink deduction for Order #${orderData.id || orderData.orderNo || 'Job'}`);
        }
      }
    });
  };

  const saveInventoryToBackend = (item: any) => {
    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).catch(err => console.log('Inventory save backend sync notice:', err));
  };

  const deleteInventoryFromBackend = (id: string) => {
    recordDeletedId(id);
    setInventory(prev => {
      const target = prev.find(item => item.id === id || item.id.toLowerCase() === id.toLowerCase() || item.sku === id || (item.sku || '').toLowerCase() === id.toLowerCase());
      if (target) {
        recordDeletedId(target.id);
        if (target.name) recordDeletedId(target.name);
        if (target.sku) recordDeletedId(target.sku);
        (target.batches || []).forEach(b => {
          if (b.id) recordDeletedId(b.id);
          if (b.poNumber) recordDeletedId(b.poNumber);
        });
      }
      const next = prev.filter(item => item.id !== id && item.id.toLowerCase() !== id.toLowerCase() && item.sku !== id && (item.sku || '').toLowerCase() !== id.toLowerCase());
      safeSetItem('ss_print_inventory_v6', next);
      return next;
    });

    // Remove matching inbound records from local cache
    setLinkedInboundEntries(prev => prev.filter(e => e.id !== id && e.sku !== id && e.skuCode !== id && e.poNumber !== id));
    try {
      const rawInbound = localStorage.getItem('som_sing_inbound_list');
      if (rawInbound) {
        const parsed = JSON.parse(rawInbound);
        const filtered = parsed.filter((e: any) => e.id !== id && e.sku !== id && e.skuCode !== id && e.poNumber !== id);
        localStorage.setItem('som_sing_inbound_list', JSON.stringify(filtered));
      }
    } catch (e) {}

    fetch(`/api/inventory/${id}`, {
      method: 'DELETE'
    }).catch(err => console.log('Inventory delete backend sync notice:', err));
    fetch(`/api/inventory/items/${id}`, {
      method: 'DELETE'
    }).catch(err => console.log('Inventory items delete backend sync notice:', err));
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

        const updatedItem = {
          ...item,
          batches: updatedBatches,
          stockQty: newStockQty,
          costPerPurchaseUnit: Number(batchData.purchasePrice),
          costPerConsumptionUnit: costPerSheet
        };
        saveInventoryToBackend(updatedItem);
        return updatedItem;
      });
    });
  };

  // Add or Update a SKU/Material Definition with API persistence
  const addInventorySku = (itemData) => {
    unrecordDeletedId(itemData.id);
    if (itemData.sku) unrecordDeletedId(itemData.sku);
    if (itemData.name) unrecordDeletedId(itemData.name);

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
        safeSetItem('ss_print_inventory_v6', next);
        return next;
      }
      const next = [...prev, newSku];
      safeSetItem('ss_print_inventory_v6', next);
      return next;
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

  const deleteInventoryBatch = (itemId: string, batchId: string) => {
    recordDeletedId(batchId);
    recordDeletedId(batchId.replace('LOT-', ''));

    // Remove matching inbound records if any
    const rawBatchKey = batchId.replace('LOT-', '');
    setLinkedInboundEntries(prev => prev.filter(e => e.id !== batchId && e.id !== rawBatchKey && e.poNumber !== batchId && e.poNumber !== rawBatchKey));
    try {
      const rawInbound = localStorage.getItem('som_sing_inbound_list');
      if (rawInbound) {
        const parsed = JSON.parse(rawInbound);
        const filtered = parsed.filter((e: any) => e.id !== batchId && e.id !== rawBatchKey && e.poNumber !== batchId && e.poNumber !== rawBatchKey);
        localStorage.setItem('som_sing_inbound_list', JSON.stringify(filtered));
      }
    } catch (e) {}

    setInventory(prev => {
      const target = prev.find(item => item.id === itemId || item.id.toLowerCase() === itemId.toLowerCase());
      if (!target) return prev;

      const remainingBatches = (target.batches || []).filter(b => 
        b.id !== batchId && 
        b.id !== `LOT-${batchId}` && 
        b.poNumber !== batchId &&
        b.id !== batchId.replace('LOT-', '')
      );

      if (remainingBatches.length === 0 || (target.batches || []).length <= 1) {
        deleteInventoryFromBackend(target.id);
        return prev.filter(item => item.id !== target.id);
      }

      return prev.map(item => {
        if (item.id !== target.id) return item;
        const newStockQty = remainingBatches.reduce((sum, b) => sum + Number(b.currentQty || 0), 0);
        const updatedItem = {
          ...item,
          batches: remainingBatches,
          stockQty: newStockQty
        };
        saveInventoryToBackend(updatedItem);
        return updatedItem;
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
    setInventory(prev => {
      const next = prev.map(item => {
        if (item.id === itemId || item.id?.toLowerCase() === itemId?.toLowerCase() || item.sku === itemId) {
          const updatedItem = sanitizeInventoryItem({ ...item, ...updatedFields });
          return updatedItem;
        }
        return item;
      });
      safeSetItem('ss_print_inventory_v6', next);
      return next;
    });

    const payload = { id: itemId, ...updatedFields };
    fetch(`/api/inventory/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.log('API inventory items update notice:', err));
    fetch(`/api/inventory/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.log('API inventory update notice:', err));
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

  // Computed Low-Stock Alerts (Threshold <= reorderPoint / minStockThreshold, default 100)
  const lowStockAlerts = useMemo(() => {
    if (!inventory || !Array.isArray(inventory)) return [];
    return inventory.filter(item => {
      if (!item) return false;
      const cat = (item.category || '').toLowerCase();
      if (['printer', 'cutter', 'laminator', 'binder', 'equipment', 'machinery'].includes(cat)) return false;
      const threshold = Number(item.minStockThreshold ?? item.reorder_threshold ?? item.reorderPoint ?? 100);
      const currentQty = Number(item.stockQty ?? item.quantity ?? 0);
      return currentQty <= threshold;
    });
  }, [inventory]);

  const updateMaterialReorderPoint = (skuId: string, threshold: number) => {
    setInventory(prev => {
      const next = prev.map(item => {
        if (item.id === skuId || item.sku === skuId) {
          const updated = { 
            ...item, 
            minStockThreshold: threshold, 
            reorder_threshold: threshold, 
            reorderPoint: threshold,
            reorderThreshold: threshold
          };
          saveInventoryToBackend(updated);
          return updated;
        }
        return item;
      });
      safeSetItem('ss_print_inventory_v6', next);
      return next;
    });
    const currentLang = localStorage.getItem('i18nextLng') || 'lo';
    showToast(
      currentLang === 'en' 
        ? `Reorder point updated to ${threshold.toLocaleString()} units` 
        : `ອັບເດດຈຸດສັ່ງຊື້ຂັ້ນຕ່ຳ (Reorder Point: ${threshold.toLocaleString()}) ສຳເລັດ!`, 
      'success'
    );
  };

  // Offcut management
  const addOffcut = (offcutData: any) => {
    const offcutId = offcutData.id || `OFF-${Date.now().toString().slice(-6)}`;
    const costPerSheet = Number(offcutData.costPerSheet || offcutData.costPerConsumptionUnit || 400);
    const qty = Number(offcutData.qty || offcutData.stockQty || offcutData.quantity || 0);

    const newOffcut = {
      id: offcutId,
      sku: offcutId,
      name: offcutData.name,
      category: 'Offcut',
      stockQty: qty,
      consumptionUnit: 'ແຜ່ນ',
      purchaseUnit: 'ແຜ່ນ',
      purchaseMultiplier: 1,
      costPerPurchaseUnit: costPerSheet,
      costPerConsumptionUnit: costPerSheet,
      reorderThreshold: 10,
      paperId: offcutData.paperId || offcutData.parent_material_id || '',
      isOffcut: true,
      location: offcutData.location || 'Main Shelf',
      notes: offcutData.notes || (offcutData.location ? `Location: ${offcutData.location}` : ''),
      specs: {
        widthMm: Number(offcutData.widthMm || offcutData.width_mm || 148),
        heightMm: Number(offcutData.heightMm || offcutData.length_mm || 210),
        dimensionFormatted: offcutData.dimensionFormatted || `${offcutData.widthMm || offcutData.width_mm || 148} × ${offcutData.heightMm || offcutData.length_mm || 210} mm`,
        grammageGsm: Number(offcutData.grammageGsm || offcutData.grammage || 130),
        paperType: offcutData.paperType || 'Standard',
        paperSurface: offcutData.paperSurface || '',
        parentMaterialId: offcutData.paperId || offcutData.parent_material_id || '',
        location: offcutData.location || 'Main Shelf',
        usableFor: offcutData.usableFor || ['Namecards', 'Hangtags', 'Small Prints', 'Flyers']
      },
      batches: [
        {
          id: `LOT-${offcutId}`,
          purchaseDate: new Date().toISOString().split('T')[0],
          supplierName: 'Internal Production Offcut',
          purchasePricePerReam: costPerSheet,
          costPerSheet: costPerSheet,
          initialQty: qty,
          currentQty: qty
        }
      ]
    };

    setOffcuts(prev => [newOffcut, ...prev]);

    // Also add/sync to inventory
    setInventory(prev => {
      const idx = prev.findIndex(i => i.id === offcutId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...newOffcut, stockQty: next[idx].stockQty + qty };
        safeSetItem('ss_print_inventory_v6', next);
        return next;
      }
      const next = [newOffcut, ...prev];
      safeSetItem('ss_print_inventory_v6', next);
      return next;
    });

    // Backend sync
    fetch('/api/inventory/offcuts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: offcutId,
        parent_material_id: offcutData.paperId || offcutData.parent_material_id || '',
        name: offcutData.name,
        width_mm: Number(offcutData.widthMm || offcutData.width_mm || 148),
        length_mm: Number(offcutData.heightMm || offcutData.length_mm || 210),
        quantity: qty,
        location: offcutData.location || 'Main Shelf'
      })
    }).catch(err => console.warn('Backend offcut sync notice:', err));
  };

  const consumeOffcut = (offcutId: string, qtyToUse: number) => {
    setOffcuts(prev => {
      return prev.map(off => {
        if (off.id === offcutId) {
          const rem = Math.max(0, Number(off.stockQty || off.qty || 0) - Number(qtyToUse));
          return {
            ...off,
            stockQty: rem,
            qty: rem
          };
        }
        return off;
      }).filter(off => Number(off.stockQty || off.qty || 0) > 0);
    });

    // Also deduct from inventory stock
    dischargeInventoryStock(offcutId, qtyToUse, 'OFFCUT_CONSUMPTION', 'Used for small job print');
  };

  const deleteOffcut = (offcutId: string) => {
    setOffcuts(prev => {
      const next = prev.filter(o => o.id !== offcutId);
      safeSetItem('ss_print_offcuts_v6', next);
      return next;
    });
    setInventory(prev => {
      const next = prev.filter(i => i.id !== offcutId);
      safeSetItem('ss_print_inventory_v6', next);
      return next;
    });
    deleteInventoryFromBackend(offcutId);
    showToast('ລຶບລາຍການເສດເຈ້ຍສຳເລັດ!', 'success');
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
        const stepNames: Record<string, string> = {
          preflight: 'ກວດສອບໄຟລ໌ (File Validation)',
          printing: 'ພິມແຜ່ນງານ (Press Printing)',
          cutting: 'ຕັດແລະເຄືອບ (Cutting & Binding)',
          qc: 'ກວດສອບ QC (Final QC)'
        };
        const statusText = isDone ? 'ສໍາເລັດ (Completed)' : 'ຍົກເລີກ (Cancelled)';
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
        const comps = Array.isArray(eq.components) ? eq.components : [];
        const updatedComponents = comps.map(c => {
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
        const comps = Array.isArray(eq.components) ? eq.components : [];
        const updatedComponents = comps.map(c => {
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

  const swapEquipmentInk = (equipmentId: string, slotPosition: string, inkSku: string, qty: number = 1, remarks?: string): boolean => {
    const targetItem = inventory.find(i => i.id === inkSku || i.skuCode === inkSku || i.sku === inkSku);
    const availableStock = targetItem ? Number(targetItem.stockQty || 0) : 0;

    if (!targetItem || availableStock < qty) {
      showToast(
        `ໝຶກໃນສາງບໍ່ພຽງພໍ! (ມີເຫຼືອ: ${availableStock} ຕຸກ, ຕ້ອງການ: ${qty} ຕຸກ)`,
        'warning'
      );
      return false;
    }

    dischargeInventoryStock(inkSku, qty, 'INK_SWAP', remarks || `ປ່ຽນໝຶກໃໝ່ Slot ${slotPosition} ເຄື່ອງຈັກ #${equipmentId}`);

    const eq = equipment.find(e => e.id === equipmentId);
    const eqName = eq?.name || equipmentId;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    addDowntimeLog({
      equipmentId,
      equipmentName: eqName,
      startTime: timeNow,
      endTime: timeNow,
      downtimeMinutes: 5,
      reason: `ປ່ຽນໝຶກຕຸກໃໝ່ (${slotPosition})`,
      description: `ປ່ຽນຕຸກໝຶກໃໝ່ລະຫັດ ${inkSku} (${targetItem.name}) ຈຳນວນ ${qty} ຕຸກ`,
      actionTaken: `ຕັດສະຕັອກ ${qty} ຕຸກ ແລະ ຕື່ມໝຶກໃສ່ Slot ${slotPosition}`,
      status: 'Completed'
    });

    showToast(`ປ່ຽນໝຶກໃໝ່ສຳເລັດ! ຕັດສະຕັອກ ${qty} ຕຸກຮຽບຮ້ອຍ`, 'success');
    return true;
  };

  const replaceEquipmentComponent = (equipmentId: string, componentName: string, deductSparePartSku?: string, qty: number = 1, remarks?: string): boolean => {
    if (deductSparePartSku) {
      const targetItem = inventory.find(i => i.id === deductSparePartSku || i.skuCode === deductSparePartSku || i.sku === deductSparePartSku);
      const availableStock = targetItem ? Number(targetItem.stockQty || 0) : 0;

      if (!targetItem || availableStock < qty) {
        showToast(
          `ອະໄຫຼ່ໃນສາງບໍ່ພຽງພໍ! (ມີເຫຼືອ: ${availableStock} ອັນ, ຕ້ອງການ: ${qty} ອັນ)`,
          'warning'
        );
        return false;
      }

      dischargeInventoryStock(deductSparePartSku, qty, 'SPARE_PART_REPLACE', remarks || `ປ່ຽນອະໄຫຼ່ ${componentName} ເຄື່ອງຈັກ #${equipmentId}`);
    }

    resetEquipmentComponent(equipmentId, componentName);

    const eq = equipment.find(e => e.id === equipmentId);
    const eqName = eq?.name || equipmentId;
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    addDowntimeLog({
      equipmentId,
      equipmentName: eqName,
      startTime: timeNow,
      endTime: timeNow,
      downtimeMinutes: 15,
      reason: `ປ່ຽນອະໄຫຼ່ ${componentName}`,
      description: deductSparePartSku ? `ປ່ຽນອະໄຫຼ່ ${componentName} ແລະ ຕັດສະຕັອກ ${deductSparePartSku} (${qty} ອັນ)` : `ປ່ຽນອະໄຫຼ່ ${componentName}`,
      actionTaken: `ຣີເຊັດອາຍຸການໃຊ້ງານຂອງ ${componentName} ເປັນ 0%`,
      status: 'Completed'
    });

    showToast(`ປ່ຽນອະໄຫຼ່ ${componentName} ສຳເລັດ ແລະ ຣີເຊັດອາຍຸການໃຊ້ງານ 0%`, 'success');
    return true;
  };

  // Calculations for dashboard
  const getDashboardStats = () => {
    // Realized Cashflow = Sum of depositPaid of all orders
    const totalRevenue = orders.reduce((sum, ord) => sum + ord.depositAmountPaid, 0); // realized cash
    
    // Pending Receivables
    const outstandingPayments = orders.reduce((sum, ord) => sum + ord.remainingUnpaidBalance, 0);

    let paperCostTotal = 0;
    let inkCostTotal = 0;
    let materialCostForOrders = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        const invItem = inventory.find(i => i.id === item.id);
        const itemCost = item.quantity * (invItem?.costPerConsumptionUnit || item.unitCost || 0);
        
        const cat = (invItem?.category || item.category || '').toLowerCase();
        const name = (invItem?.name || item.name || '').toLowerCase();
        
        if (cat === 'paper' || name.includes('a4') || name.includes('a3') || name.includes('card') || name.includes('ເຈ້ຍ')) {
          paperCostTotal += itemCost;
        } else if (cat === 'ink' || name.includes('ink') || name.includes('ໝຶກ') || name.includes('cmyk')) {
          inkCostTotal += itemCost;
        }
        materialCostForOrders += itemCost;
      });
    });

    // Fallback baseline for paper & ink if item categories are generic
    if (paperCostTotal === 0 && materialCostForOrders > 0) {
      paperCostTotal = Math.round(materialCostForOrders * 0.65);
      inkCostTotal = Math.round(materialCostForOrders * 0.35);
    }

    const spoilageCostImpact = spoilageLogs.reduce((sum, log) => sum + (log.totalCost || log.costImpact || (log.quantity * 450)), 0);
    const directMaterialCost = materialCostForOrders + spoilageCostImpact;
    
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
    
    // Executive Gross Profit Margin %
    const totalRevenueBase = Math.max(1, totalEarnedPrice || totalRevenue);
    const grossProfitMargin = Math.max(0, Math.min(100, Math.round(((totalRevenueBase - paperCostTotal - inkCostTotal) / totalRevenueBase) * 1000) / 10));

    const activeOrdersCount = orders.filter(ord => ord.status !== 'Delivered').length;

    // Material deadstock warnings: materials with zero consumption in active orders
    const activeOrderedIds = new Set();
    orders.forEach(o => o.items.forEach(i => activeOrderedIds.add(i.id)));
    const deadstockItems = inventory.filter(inv => !activeOrderedIds.has(inv.id));

    // Machine production efficiencies: calculated from print count vs limit ratio or mock index
    const machineEfficiencies = equipment.map(eq => {
      // simulate weekly efficiency based on component logs
      const comps = Array.isArray(eq.components) ? eq.components : [];
      const avgWear = comps.length > 0 ? comps.reduce((sum, c) => sum + (Number(c?.usage) || 0), 0) / comps.length : 0;
      const efficiency = Math.round(100 - (avgWear * 0.25)); // wear decreases efficiency slightly
      return { id: eq.id, name: eq.name, efficiency };
    });

    return {
      totalRevenue, // Cash Realized
      totalCost,
      netProfit,
      activeOrdersCount,
      spoilageCost: spoilageCostImpact,
      spoilageCostImpact,
      paperCostTotal,
      inkCostTotal,
      grossProfitMargin,
      totalEarnedPrice,
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

    const resolvedArtworkUrl = orderData.artworkUrl || orderData.artwork_url || orderData.artworkLink || (orderData.items && orderData.items[0]?.artworkUrl) || (orderData.items && orderData.items[0]?.inner_file_url) || '';
    const resolvedArtworkFileName = orderData.artworkFileName || orderData.artwork_file_name || (orderData.items && orderData.items[0]?.artworkFileName) || (resolvedArtworkUrl ? resolvedArtworkUrl.split('/').pop()?.split('?')[0] : '');
    const resolvedArtworkFileSize = orderData.artworkFileSize || orderData.artwork_file_size || (orderData.items && orderData.items[0]?.artworkFileSize) || 0;

    const newOrder = {
      id: `ord-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      createdTime: formatDateTime(),
      productionStartTime: null,
      productionEndTime: null,
      actualDeliveryTime: null,
      onTimeStatus: null,
      artworkUrl: resolvedArtworkUrl,
      artwork_url: resolvedArtworkUrl,
      artworkFileName: resolvedArtworkFileName,
      artwork_file_name: resolvedArtworkFileName,
      artworkFileSize: resolvedArtworkFileSize,
      artwork_file_size: resolvedArtworkFileSize,
      artworkLink: resolvedArtworkUrl || orderData.artworkLink,
      googleDriveLink: resolvedArtworkUrl || orderData.artworkLink || orderData.googleDriveLink,
      driveLink: resolvedArtworkUrl || orderData.artworkLink || orderData.driveLink,
      preflight: {
        cmyk: 'Not Checked',
        bleed: 'Not Checked',
        resolution: 'Not Checked',
        approvedTimestamp: null,
        versions: [
          { url: resolvedArtworkUrl || orderData.artworkLink || 'https://drive.google.com/som-sing-proof.pdf', version: 1, uploadedAt: formatDateTime() }
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
          const comps = Array.isArray(eq.components) ? eq.components : [];
          if (eq.category === 'Printer') {
            const paperOrdered = orderData.items.find(i => i.id.startsWith('paper'));
            const pagesCount = paperOrdered ? paperOrdered.quantity : 0;
            
            const updatedComponents = comps.map(c => {
              const increment = Math.round((pagesCount / 1000) * 10) / 10;
              return {
                ...c,
                usage: Math.min(100, Math.round((c.usage + increment) * 10) / 10)
              };
            });

            return {
              ...eq,
              printedCount: (eq.printedCount || 0) + pagesCount,
              components: updatedComponents
            };
          }
          if (eq.category === 'Cutter') {
            const updatedComponents = comps.map(c => {
              if (c.name?.includes('Blade')) {
                return { ...c, usage: Math.min(100, c.usage + 1) };
              }
              return c;
            });
            return {
              ...eq,
              printedCount: (eq.printedCount || 0) + 1,
              components: updatedComponents
            };
          }
          return eq;
        });
      });
    }

    setOrders(prev => {
      const updated = [newOrder, ...prev];
      safeSetItem('ss_print_orders_v6', updated);
      return updated;
    });

    // Sync to Go Backend DB
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    }).catch(err => console.log('Order DB sync background notice:', err));
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

  const startOrderProduction = (orderId: string): boolean => {
    let orderToDeduct: any = null;
    let alreadyDeducted = false;

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        if (ord.stockDeducted || ord.status === 'Printing' || ord.status === 'IN_PRODUCTION') {
          alreadyDeducted = true;
          return ord;
        }
        orderToDeduct = ord;
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const logs = ord.activityLog || [];
        const newLog = {
          timestamp: timeNow,
          description: 'ສັ່ງພິມ ແລະ ຕັດສະຕັອກວັດຖຸດິບ (Order sent to press & stock deducted)'
        };
        return {
          ...ord,
          status: 'Printing',
          stockDeducted: true,
          stockDeductedAt: timeNow,
          productionStartTime: timeNow,
          activityLog: [newLog, ...logs]
        };
      }
      return ord;
    }));

    if (alreadyDeducted) {
      showToast('ອໍເດີນີ້ໄດ້ຕັດສະຕັອກໄປແລ້ວ', 'info');
      return false;
    }

    if (orderToDeduct) {
      deductStockForOrder(orderToDeduct);
      showToast('ສັ່ງພິມ ແລະ ຕັດສະຕັອກກະດາດ/ນ້ຳມຶກຮຽບຮ້ອຍແລ້ວ!', 'success');

      fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PRODUCTION' })
      }).catch(err => console.log('Order status sync notice:', err));

      return true;
    }
    return false;
  };

  const updateOrderTracking = async (orderId: string, courierName: string, trackingNo: string, shippingFee?: number, branchCode?: string) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId || ord.orderNo === orderId || ord.orderNumber === orderId) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeNow = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const logs = ord.activityLog || [];
        const branchTxt = branchCode ? ` (ສາຂາ: ${branchCode})` : '';
        const newLog = {
          timestamp: timeNow,
          description: `ອັບເດດຂໍ້ມູນການຈັດສົ່ງ: ${courierName}${branchTxt} (ເລກພັດສະດຸ: ${trackingNo || 'ບໍ່ມີ'})`
        };
        return {
          ...ord,
          deliveryMethod: courierName,
          courier: courierName,
          courier_name: courierName,
          trackingNumber: trackingNo,
          internal_tracking_code: trackingNo,
          tracking_code: trackingNo,
          branchCode: branchCode || ord.branchCode,
          branch_code: branchCode || ord.branch_code,
          courierBranch: branchCode || ord.courierBranch,
          shippingFee: shippingFee !== undefined ? shippingFee : (ord.shippingFee || 0),
          status: 'SHIPPED',
          overall_status: 'SHIPPED',
          activityLog: [newLog, ...logs]
        };
      }
      return ord;
    }));

    showToast(`ບັນທຶກເລກພັດສະດຸ ${trackingNo || ''} ສຳເລັດແລ້ວ!`, 'success');

    try {
      await fetch(`/api/v1/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier_name: courierName,
          courier: courierName,
          internal_tracking_code: trackingNo,
          tracking_number: trackingNo,
          tracking_code: trackingNo,
          shipping_fee: shippingFee,
          branch_code: branchCode,
          status: 'SHIPPED',
          overall_status: 'SHIPPED'
        })
      });
    } catch (err) {
      console.log('Order tracking sync notice:', err);
    }
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
          paidDateTime: fullyPaid ? timeNow : ord.paidDateTime,
          activityLog: [newLog, ...logs]
        };
      }
      return ord;
    }));
  };

  const updateOrderPaymentStatus = (orderId, newPaymentStatus, depositAmount, remainingBalance, slipUrl) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const total = Number(ord.totalPriceCharged || ord.totalAmount || ord.total_amount_lak || 0);
        const dep = depositAmount !== undefined ? depositAmount : (newPaymentStatus === 'Paid' ? total : (newPaymentStatus === 'Deposit' ? Math.round(total / 2) : 0));
        const rem = remainingBalance !== undefined ? remainingBalance : (newPaymentStatus === 'Paid' ? 0 : (total - (dep || 0)));
        return {
          ...ord,
          paymentStatus: newPaymentStatus,
          depositAmountPaid: dep,
          remainingUnpaidBalance: rem,
          ...(slipUrl ? { paymentSlipUrl: slipUrl } : {})
        };
      }
      return ord;
    }));
  };

  const updateOrderDetails = (orderId: string, updatedOrder: any) => {
    setOrders(prev => {
      const updated = prev.map(ord => (ord.id === orderId || ord.orderNo === orderId || ord.orderNumber === orderId) ? { ...ord, ...updatedOrder } : ord);
      safeSetItem('ss_print_orders_v6', updated);
      return updated;
    });

    // PostgreSQL Backend Sync
    fetch(`/api/v1/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedOrder)
    }).catch(err => console.log('Order update DB notice:', err));

    showToast(`ອັບເດດອໍເດີ #${updatedOrder.orderNo || orderId} ຮຽບຮ້ອຍແລ້ວ!`, 'success');
  };

  const deleteOrder = (orderId: string) => {
    setOrders(prev => {
      const updated = prev.filter(ord => ord.id !== orderId && ord.orderNo !== orderId && ord.orderNumber !== orderId);
      safeSetItem('ss_print_orders_v6', updated);
      return updated;
    });
    fetch(`/api/v1/orders/${orderId}`, { method: 'DELETE' }).catch(() => {});
    showToast(`ລົບອໍເດີ #${orderId} ອອກຈາກລະບົບຮຽບຮ້ອຍແລ້ວ`, 'info');
  };

  const addSpoilageLog = async (logData: any) => {
    const invItem = inventory.find(i => i.id === logData.materialId);
    const unitCost = invItem ? (invItem.costPerConsumptionUnit || invItem.unitCost || 0) : 0;
    const totalCost = (Number(logData.quantity) || 0) * (unitCost || Number(logData.unitCost) || 0);

    const newLog = {
      id: `sp-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      materialName: invItem?.name || logData.materialName || 'Material',
      materialId: logData.materialId || '',
      machineId: logData.machineId || '',
      orderId: logData.orderId || '',
      quantity: Number(logData.quantity) || 1,
      unit: logData.unit || 'Sheet',
      cause: logData.cause || logData.reason || 'ບໍ່ລະບຸ',
      reason: logData.cause || logData.reason || 'ບໍ່ລະບຸ',
      unitCost,
      totalCost: totalCost || Number(logData.costImpact) || 0,
      costImpact: totalCost || Number(logData.costImpact) || 0,
      ...logData
    };

    if (logData.materialId) {
      deductStockFIFO(logData.materialId, Number(logData.quantity) || 1);
    }
    setSpoilageLogs(prev => [newLog, ...prev]);

    if (logData.orderId) {
      setOrders(prev => prev.map(ord => {
        if (ord.id === logData.orderId || ord.orderNo === logData.orderId || ord.orderNumber === logData.orderId) {
          const logs = ord.activityLog || [];
          const actLog = {
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            description: `ລາຍງານງານເສຍ: ${invItem?.name || 'ວັດສະດຸ'} ຈຳນວນ ${logData.quantity} ໜ່ວຍ. ສາເຫດ: ${logData.cause || logData.reason || 'ບໍ່ລະບຸ'}`
          };
          return {
            ...ord,
            activityLog: [actLog, ...logs]
          };
        }
        return ord;
      }));
    }

    try {
      const res = await fetch('/api/v1/production/spoilage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newLog.id,
          order_id: newLog.orderId,
          machine_id: newLog.machineId,
          material_id: newLog.materialId,
          paper_sku: newLog.materialId,
          spoilage_qty: newLog.quantity,
          unit: newLog.unit,
          reason: newLog.reason,
          cost_impact: newLog.costImpact
        })
      });
      if (res.ok) {
        showToast('ບັນທຶກລາຍງານງານເສຍສຳເລັດແລ້ວ', 'success');
      } else {
        showToast('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກລາຍງານງານເສຍ', 'error');
      }
    } catch (err) {
      console.error('Failed to persist spoilage log:', err);
      showToast('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ', 'error');
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
        { name: 'Lamination Roller (ລູກກິ້ງເຄືອບ)', usage: 0, threshold: 90 },
        { name: 'Heating Element (ຊຸດຄວາມຮ້ອນ)', usage: 0, threshold: 90 }
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

    unrecordDeletedId(newEq.id);
    if (newEq.serialNumber) unrecordDeletedId(newEq.serialNumber);
    if (newEq.name) unrecordDeletedId(newEq.name);

    setEquipment(prev => {
      const idx = prev.findIndex(e => e.id === newEq.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...newEq };
        safeSetItem('ss_print_equipment_v6', next);
        return next;
      }
      const next = [...prev, newEq];
      safeSetItem('ss_print_equipment_v6', next);
      return next;
    });

    // Send JSON payload to Equipment Backend API
    fetch(`/api/equipment/${newEq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEq)
    }).catch(err => console.log('API equipment sync notice:', err));
  };

  const updateEquipment = (eqId: string, updatedFields: Record<string, any>) => {
    setEquipment(prev => {
      const next = prev.map(eq => {
        if (eq.id === eqId || eq.id?.toLowerCase() === eqId?.toLowerCase() || eq.serialNumber === eqId) {
          const merged = { ...eq, ...updatedFields };
          if (merged.purchaseCost && merged.printedPagesCapacity) {
            merged.calculatedCostPerPage = merged.purchaseCost / merged.printedPagesCapacity;
          }
          return merged;
        }
        return eq;
      });
      safeSetItem('ss_print_equipment_v6', next);
      return next;
    });

    const payload = { id: eqId, ...updatedFields };
    fetch(`/api/equipment/${eqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.log('API equipment update notice:', err));
    fetch(`/api/v1/assets/${eqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.log('API assets update notice:', err));
  };

  const deleteEquipment = (eqId: string) => {
    recordDeletedId(eqId);
    setEquipment(prev => {
      const next = prev.filter(eq => eq.id !== eqId && eq.serialNumber !== eqId && eq.id.toLowerCase() !== eqId.toLowerCase());
      safeSetItem('ss_print_equipment_v6', next);
      return next;
    });
    fetch(`/api/equipment/${eqId}`, {
      method: 'DELETE'
    }).catch(err => console.log('API equipment delete notice:', err));
    fetch(`/api/v1/assets/${eqId}`, {
      method: 'DELETE'
    }).catch(err => console.log('API assets delete notice:', err));
  };

  const addMeterReading = (readingData: {
    equipmentId: string;
    meterCount: number;
    date?: string;
    time?: string;
    recordedBy?: string;
    notes?: string;
  }) => {
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Calculate diffCount from previous meter reading for this machine
    const eqReadings = meterReadings.filter((m: any) => m.equipmentId === readingData.equipmentId);
    const lastReading = eqReadings.length > 0 
      ? Math.max(...eqReadings.map((m: any) => m.meterCount || 0))
      : 0;

    const diffCount = Math.max(0, readingData.meterCount - lastReading);

    const newReading = {
      id: `mtr-${Date.now().toString().slice(-5)}`,
      equipmentId: readingData.equipmentId,
      date: readingData.date || today,
      time: readingData.time || timeNow,
      meterCount: Number(readingData.meterCount),
      diffCount,
      recordedBy: readingData.recordedBy || 'Operator',
      notes: readingData.notes || ''
    };

    setMeterReadings((prev: any[]) => [newReading, ...prev]);

    // Update equipment printedCount and currentMeterCount
    updateEquipment(readingData.equipmentId, {
      printedCount: Number(readingData.meterCount),
      currentMeterCount: Number(readingData.meterCount),
      lastMeterDate: readingData.date || today
    });
  };

  const addDowntimeLog = (logData: {
    equipmentId: string;
    equipmentName: string;
    startTime: string;
    endTime?: string | null;
    downtimeMinutes?: number;
    reason: string;
    description?: string;
    actionTaken?: string;
    technician?: string;
    cost?: number;
    status?: 'Pending' | 'In Progress' | 'Completed';
  }) => {
    const newLog = {
      id: `dt-${Date.now().toString().slice(-5)}`,
      equipmentId: logData.equipmentId,
      equipmentName: logData.equipmentName,
      startTime: logData.startTime || new Date().toISOString(),
      endTime: logData.endTime || null,
      downtimeMinutes: Number(logData.downtimeMinutes) || 0,
      reason: logData.reason,
      description: logData.description || '',
      actionTaken: logData.actionTaken || '',
      technician: logData.technician || '',
      cost: Number(logData.cost) || 0,
      status: logData.status || 'Pending'
    };

    setDowntimeLogs((prev: any[]) => [newLog, ...prev]);

    fetch('/api/v1/production/downtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newLog.id,
        machineId: newLog.equipmentId,
        machineName: newLog.equipmentName,
        status: (newLog.status || 'Pending').toUpperCase(),
        reason: newLog.reason,
        technicianId: newLog.technician,
        startTime: newLog.startTime,
        endTime: newLog.endTime,
        durationMinutes: newLog.downtimeMinutes
      })
    }).catch(err => console.warn('Downtime log API notice:', err));

    showToast('ບັນທຶກລາຍງານການຢຸດທຳງານເຄື່ອງຈັກຮຽບຮ້ອຍແລ້ວ!', 'success');

    // Update machine status if downtime is pending/in progress
    if (logData.status !== 'Completed') {
      updateEquipment(logData.equipmentId, { status: 'Under Repair' });
    }
  };

  const updateDowntimeLog = (logId: string, updatedFields: Record<string, any>) => {
    setDowntimeLogs((prev: any[]) => prev.map(log => {
      if (log.id === logId) {
        const merged = { ...log, ...updatedFields };
        if (merged.status === 'Completed' && log.equipmentId) {
          updateEquipment(log.equipmentId, { status: 'In Use' });
        }
        fetch('/api/v1/production/downtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: merged.id,
            machineId: merged.equipmentId,
            machineName: merged.equipmentName,
            status: (merged.status || 'Completed').toUpperCase(),
            reason: merged.reason,
            technicianId: merged.technician,
            startTime: merged.startTime,
            endTime: merged.endTime,
            durationMinutes: merged.downtimeMinutes
          })
        }).catch(err => console.warn('Update downtime log API notice:', err));
        return merged;
      }
      return log;
    }));
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

  const deleteInboundEntry = (id: string) => {
    if (!id) return;
    recordDeletedId(id);
    recordDeletedId(`LOT-${id}`);
    recordDeletedId(id.toLowerCase());
    recordDeletedId(`LOT-${id}`.toLowerCase());

    // Find the inbound entry to get SKU, category, and name
    let targetEntry = (linkedInboundEntries || []).find(e => e.id === id || e.poNumber === id || e.id?.toLowerCase() === id.toLowerCase());
    if (!targetEntry) {
      try {
        const raw = localStorage.getItem('som_sing_inbound_list');
        if (raw) {
          const parsed = JSON.parse(raw);
          targetEntry = parsed.find((e: any) => e.id === id || e.poNumber === id || e.id?.toLowerCase() === id.toLowerCase());
        }
      } catch (e) {}
    }

    const targetSku = targetEntry?.sku || targetEntry?.skuCode || targetEntry?.id || id;
    const targetName = targetEntry?.name || targetEntry?.itemName || '';
    const cat = (targetEntry?.category || '').toUpperCase();
    const isEquip = cat === 'PRINTER' || cat === 'MACHINERY' || cat === 'CUTTER' || cat === 'LAMINATOR' || cat === 'BINDER';

    // 1. Update Inbound State & Storage
    setLinkedInboundEntries(prev => {
      const next = prev.filter(item => item.id !== id && item.poNumber !== id && item.id?.toLowerCase() !== id?.toLowerCase());
      safeSetItem('ss_print_inbound_entries_v6', next);
      return next;
    });

    try {
      const rawInbound = localStorage.getItem('som_sing_inbound_list');
      if (rawInbound) {
        const parsed = JSON.parse(rawInbound);
        const filtered = parsed.filter((e: any) => e.id !== id && e.poNumber !== id && e.id?.toLowerCase() !== id?.toLowerCase());
        localStorage.setItem('som_sing_inbound_list', JSON.stringify(filtered));
      }
    } catch (e) {}

    // 2. Cascade Rollback in Inventory (Paper, Ink, Material, etc.)
    setInventory(prev => {
      let invUpdated = false;
      const nextInv: any[] = [];

      for (const item of prev) {
        const isMatch = item.id === targetSku ||
                        item.id === id ||
                        item.sku === targetSku ||
                        item.id?.toLowerCase() === targetSku?.toLowerCase() ||
                        (targetName && item.name && item.name.toLowerCase() === targetName.toLowerCase());

        if (isMatch) {
          invUpdated = true;
          // Filter out the batch matching this inbound ID
          const remainingBatches = (item.batches || []).filter(b =>
            b.id !== id &&
            b.id !== `LOT-${id}` &&
            b.poNumber !== id &&
            b.id !== id.replace('LOT-', '') &&
            b.poNumber !== targetEntry?.poNumber
          );

          const multiplier = Number(item.purchaseMultiplier) || 1;
          const qtyInPacks = Number(targetEntry?.quantity || targetEntry?.importQty || targetEntry?.currentQty || 1);
          const sheetsToDeduct = qtyInPacks * multiplier;

          const calculatedStockFromBatches = remainingBatches.reduce((sum, b) => sum + Number(b.currentQty || 0), 0);
          const newStockQty = remainingBatches.length > 0 
            ? calculatedStockFromBatches 
            : Math.max(0, (Number(item.stockQty) || 0) - sheetsToDeduct);

          // If the item ID was literally the inbound ID itself (a temporary standalone item), remove it
          if (item.id === id && remainingBatches.length === 0) {
            recordDeletedId(item.id);
            if (item.sku) recordDeletedId(item.sku);
            if (item.name) recordDeletedId(item.name);
            deleteInventoryFromBackend(item.id);
            continue;
          }

          const updatedItem = {
            ...item,
            batches: remainingBatches,
            stockQty: newStockQty
          };
          saveInventoryToBackend(updatedItem);
          nextInv.push(updatedItem);
        } else {
          nextInv.push(item);
        }
      }

      if (invUpdated) {
        safeSetItem('ss_print_inventory_v6', nextInv);
        return nextInv;
      }
      return prev;
    });

    // 3. Cascade Delete in Equipment (Printers & Machinery)
    if (isEquip || targetSku.startsWith('PRN-') || targetSku.startsWith('MAC-')) {
      setEquipment(prev => {
        const matchingEq = prev.find(eq =>
          eq.id === targetSku ||
          eq.id === id ||
          eq.serialNumber === targetSku ||
          (targetName && eq.name && eq.name.toLowerCase() === targetName.toLowerCase())
        );

        if (matchingEq) {
          recordDeletedId(matchingEq.id);
          deleteEquipment(matchingEq.id);
          return prev.filter(eq => eq.id !== matchingEq.id);
        }
        return prev;
      });
    }

    // 4. Send API DELETE to Backend
    fetch(`/api/inbound/${id}`, {
      method: 'DELETE'
    }).catch(err => console.log('API inbound delete notice:', err));
  };

  const updateEquipmentMaintenance = (eqId) => {
    setEquipment(prev => prev.map(eq => {
      if (eq.id === eqId) {
        const comps = Array.isArray(eq.components) ? eq.components : [];
        const resetComps = comps.map(c => ({ ...c, usage: 0 }));
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
    setQuotations(prev => {
      const updated = [newQuote, ...prev];
      safeSetItem('ss_print_quotations_v6', updated);
      return updated;
    });

    // PostgreSQL Backend Sync
    fetch('/api/v1/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newQuote.id,
        quotation_no: newQuote.quotationNumber,
        title: newQuote.title || newQuote.quotationTitle || 'ໃບສະເໜີລາຄາງານພິມ',
        customer_name: newQuote.customerName || 'General Customer',
        customer_phone: newQuote.customerPhone || '',
        customer_address: newQuote.customerAddress || '',
        status: newQuote.status || 'Draft',
        total_cost: Number(newQuote.totalCost || newQuote.grandNetCost || 0),
        total_selling_price: Number(newQuote.grandTotal || newQuote.finalGrandTotal || 0),
        overall_profit_percent: Number(newQuote.profitMargin || newQuote.quotationProfitMargin || 40),
        discount_percent: Number(newQuote.discountPercent || newQuote.quotationDiscountPercent || 0),
        setup_fee: Number(newQuote.setupFee || newQuote.quotationSetupFee || 0),
        packaging_cost: Number(newQuote.packagingCost || newQuote.quotationPackagingCost || 0),
        shipping_fee: Number(newQuote.shippingFee || 0),
        expiry_date: newQuote.expiryDate || newQuote.quotationExpiry || '',
        notes: newQuote.notes || newQuote.quotationNote || '',
        items: newQuote.items || []
      })
    }).catch(err => console.log('Quotation DB sync notice:', err));

    return newQuote;
  };

  const reviseQuotation = (quotationId, newTotal, note) => {
    setQuotations(prev => {
      const updated = prev.map(q => {
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
      });
      safeSetItem('ss_print_quotations_v6', updated);
      return updated;
    });
  };

  const updateQuotation = (quotationId: string, updatedFields: Record<string, any>) => {
    let updatedQuote: any = null;
    setQuotations(prev => {
      const updated = prev.map(q => {
        if (q.id === quotationId || q.quotationNumber === quotationId) {
          updatedQuote = { ...q, ...updatedFields, updatedAt: new Date().toISOString().split('T')[0] };
          return updatedQuote;
        }
        return q;
      });
      safeSetItem('ss_print_quotations_v6', updated);
      return updated;
    });

    if (updatedQuote) {
      fetch(`/api/v1/quotations/${quotationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatedQuote.id,
          quotation_no: updatedQuote.quotationNumber || updatedQuote.quotation_no,
          title: updatedQuote.title || updatedQuote.quotationTitle || 'ໃບສະເໜີລາຄາງານພິມ',
          customer_name: updatedQuote.customerName || updatedQuote.customer_name || 'General Customer',
          customer_phone: updatedQuote.customerPhone || updatedQuote.customer_phone || '',
          customer_address: updatedQuote.customerAddress || updatedQuote.customer_address || '',
          status: updatedQuote.status || 'Draft',
          total_cost: Number(updatedQuote.totalCost || updatedQuote.grandNetCost || 0),
          total_selling_price: Number(updatedQuote.grandTotal || updatedQuote.finalGrandTotal || updatedQuote.total_selling_price || 0),
          overall_profit_percent: Number(updatedQuote.profitMargin || updatedQuote.quotationProfitMargin || updatedQuote.overall_profit_percent || 40),
          discount_percent: Number(updatedQuote.discountPercent || updatedQuote.quotationDiscountPercent || 0),
          setup_fee: Number(updatedQuote.setupFee || updatedQuote.quotationSetupFee || 0),
          packaging_cost: Number(updatedQuote.packagingCost || updatedQuote.quotationPackagingCost || 0),
          shipping_fee: Number(updatedQuote.shippingFee || 0),
          expiry_date: updatedQuote.expiryDate || updatedQuote.quotationExpiry || updatedQuote.expiresAt || '',
          notes: updatedQuote.notes || updatedQuote.quotationNote || '',
          items: updatedQuote.items || []
        })
      }).then(res => {
        if (res.ok) {
          showToast('ບັນທຶກໃບສະເໜີລາຄາສຳເລັດແລ້ວ', 'success');
        } else {
          showToast('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກໃບສະເໜີລາຄາ', 'error');
        }
      }).catch(err => {
        console.error('Quotation update sync error:', err);
        showToast('ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ', 'error');
      });
    }
  };

  const deleteQuotation = (quotationId: string) => {
    setQuotations(prev => {
      const updated = prev.filter(q => q.id !== quotationId && q.quotationNumber !== quotationId);
      safeSetItem('ss_print_quotations_v6', updated);
      return updated;
    });
    fetch(`/api/v1/quotations/${quotationId}`, { method: 'DELETE' }).catch(() => {});
    showToast('ລົບໃບສະເໜີລາຄາຮຽບຮ້ອຍແລ້ວ', 'info');
  };

  // Convert an accepted quotation into a production order + job ticket
  const convertQuotationToOrder = async (quotationId: string) => {
    const quotation = quotations.find(q => q.id === quotationId || q.quotationNumber === quotationId);
    if (!quotation) return null;

    const qArtworkUrl = quotation.artworkUrl || quotation.artwork_url || quotation.artworkLink || (quotation.items && quotation.items.find((it: any) => it.artworkUrl || it.fileUrl)?.artworkUrl) || '';
    const qArtworkFileName = quotation.artworkFileName || quotation.artwork_file_name || quotation.fileName || (quotation.items && quotation.items.find((it: any) => it.fileName)?.fileName) || (qArtworkUrl ? qArtworkUrl.split('/').pop()?.split('?')[0] : '');
    const qArtworkFileSize = quotation.artworkFileSize || quotation.artwork_file_size || (quotation.items && quotation.items.find((it: any) => it.fileSize)?.fileSize) || 0;

    const orderItems = (quotation.items || []).map((item: any, idx: number) => {
      const invItem = inventory.find(i => i.id === item.id || i.name === item.name);
      const itArtworkUrl = item.artworkUrl || item.artwork_url || item.fileUrl || item.file_url || qArtworkUrl;
      const itArtworkFileName = item.fileName || item.file_name || (itArtworkUrl ? itArtworkUrl.split('/').pop()?.split('?')[0] : '');
      const itArtworkFileSize = item.fileSize || item.file_size || 0;
      return {
        id: `item-${quotation.id}-${idx + 1}`,
        job_name: item.name || invItem?.name || item.jobName || 'Custom Print Job',
        item_name: item.name || invItem?.name || item.itemName || 'Custom Print Job',
        quantity: Number(item.quantity) || 1,
        page_count: Number(item.pageCount || item.pages || 1),
        paper_size: item.paperSize || item.size || 'A5',
        unit_price_lak: Number(item.unitPrice || item.unitPriceSnapshot || item.unitCost || 0),
        total_price_lak: Number(item.totalPrice || (Number(item.quantity || 1) * Number(item.unitPrice || 0))),
        unit_cost_lak: Number(item.unitCost || item.costPriceSnapshot || 0),
        cover_file_url: itArtworkUrl,
        inner_file_url: itArtworkUrl,
        artwork_url: itArtworkUrl,
        artworkUrl: itArtworkUrl,
        artwork_file_name: itArtworkFileName,
        artworkFileName: itArtworkFileName,
        artwork_file_size: itArtworkFileSize,
        artworkFileSize: itArtworkFileSize,
        specs: {
          ...(item.specs || item),
          artworkUrl: itArtworkUrl,
          artworkFileName: itArtworkFileName,
          artworkFileSize: itArtworkFileSize
        }
      };
    });

    const totalPrice = Number(quotation.grandTotal || quotation.total_selling_price || quotation.finalGrandTotal) || 0;
    const depositAmt = Math.round(totalPrice * 0.5);
    const orderNo = `ORD-${new Date().toISOString().replace(/\D/g, '').slice(2, 8)}-${Date.now().toString().slice(-3)}`;

    const orderPayload = {
      order_no: orderNo,
      order_number: orderNo,
      customer_name: quotation.customerName || quotation.customer_name || 'General Customer',
      customer_phone: quotation.customerPhone || quotation.customer_phone || quotation.phone || '',
      customer_address: quotation.customerAddress || quotation.customer_address || '',
      deposit_lak: depositAmt,
      deposit_amount: depositAmt,
      total_amount_lak: totalPrice,
      total_price: totalPrice,
      delivery_date: quotation.expiryDate || quotation.expiresAt || new Date().toISOString().split('T')[0],
      artwork_url: qArtworkUrl,
      artworkUrl: qArtworkUrl,
      artwork_file_name: qArtworkFileName,
      artworkFileName: qArtworkFileName,
      artwork_file_size: qArtworkFileSize,
      artworkFileSize: qArtworkFileSize,
      artwork_link: qArtworkUrl || quotation.artworkLink || '',
      google_drive_link: qArtworkUrl || quotation.artworkLink || '',
      status: 'WAITING_DEPOSIT',
      overall_status: 'WAITING_DEPOSIT',
      notes: `ແປງມາຈາກໃບສະເໜີລາຄາ #${quotation.quotationNumber || quotation.quotation_no || quotation.id}. ${quotation.notes || ''}`,
      source_quotation_id: quotation.id,
      items: orderItems
    };

    try {
      // 1. Create order in backend
      const orderRes = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      let createdOrder: any = null;
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        createdOrder = orderData.data || orderData;
      }

      const createdId = createdOrder?.id || `ord-${Date.now().toString().slice(-4)}`;

      // 2. Approve/Convert quotation in backend
      await fetch(`/api/v1/quotations/${quotationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: `Converted to Order ${orderNo}` })
      }).catch(() => {});

      // 3. Update local state
      const localOrderObj = {
        ...orderPayload,
        id: createdId,
        items: orderItems.map((it: any) => ({
          id: it.id,
          name: it.item_name,
          quantity: it.quantity,
          unitCost: it.unit_price_lak,
          artworkUrl: it.artwork_url,
          artworkFileName: it.artwork_file_name,
          artworkFileSize: it.artwork_file_size,
          inner_file_url: it.artwork_url,
          cover_file_url: it.artwork_url
        })),
        totalPriceCharged: totalPrice,
        depositAmountPaid: depositAmt,
        remainingUnpaidBalance: totalPrice - depositAmt,
        paymentMethod: 'BCEL One',
        paymentStatus: 'Deposit Paid',
        status: 'Received',
        promisedDeliveryDate: orderPayload.delivery_date,
        artworkLink: qArtworkUrl || orderPayload.artwork_link,
        artworkUrl: qArtworkUrl,
        artwork_url: qArtworkUrl,
        artworkFileName: qArtworkFileName,
        artwork_file_name: qArtworkFileName,
        artworkFileSize: qArtworkFileSize,
        artwork_file_size: qArtworkFileSize,
        sourceQuotationId: quotation.id
      };

      setOrders(prev => [localOrderObj, ...prev]);
      setQuotations(prev => prev.map(q => (q.id === quotationId || q.quotationNumber === quotationId) ? { ...q, status: 'Accepted', convertedOrderId: createdId } : q));

      showToast('ແປງໃບສະເໜີລາຄາເປັນອໍເດີຜະລິດຮຽບຮ້ອຍແລ້ວ', 'success');
      return createdId;
    } catch (err) {
      console.error('Failed to convert quotation to order:', err);
      showToast('ເກີດຂໍ້ຜິດພາດໃນການແປງໃບສະເໜີລາຄາ', 'error');
      return null;
    }
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
  const addDelivery = (deliveryData: any) => {
    const newDelivery = {
      id: `dlv-${Date.now().toString().slice(-4)}`,
      status: deliveryData.status || 'PENDING_PICKUP',
      ...deliveryData
    };
    setDeliveries(prev => [newDelivery, ...prev]);

    fetch('/api/v1/orders/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDelivery)
    }).catch(err => console.warn('Add delivery API notice:', err));

    showToast('ເພີ່ມລາຍການຈັດສົ່ງຮຽບຮ້ອຍແລ້ວ!', 'success');
  };

  const updateDelivery = (deliveryId: string, updatedFields: Record<string, any>) => {
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, ...updatedFields } : d));

    fetch(`/api/v1/orders/deliveries/${deliveryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    }).catch(err => console.warn('Update delivery API notice:', err));

    showToast('ອັບເດດສະຖານະການຈັດສົ່ງຮຽບຮ້ອຍແລ້ວ!', 'success');
  };

  const addCustomer = (customerData) => {
    const newCust = {
      id: customerData.id || `cust-${Date.now().toString().slice(-4)}`,
      name: customerData.name,
      phone: customerData.phone || '-',
      address: customerData.address || '-',
      creditLimit: Number(customerData.creditLimit) || 1000000,
      paymentTerms: customerData.paymentTerms || 'Net 30',
      instagram: customerData.instagram || '',
      line: customerData.line || '',
      facebook: customerData.facebook || ''
    };
    setCustomers(prev => [...prev, newCust]);

    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCust)
    }).catch(err => console.warn('Add customer API notice:', err));
  };

  const updateCustomer = (customerId, updatedFields) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const updated = { ...c, ...updatedFields };
        fetch(`/api/customers/${customerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(err => console.warn('Update customer API notice:', err));
        return updated;
      }
      return c;
    }));
  };

  const deleteCustomer = (customerId) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    fetch(`/api/customers/${customerId}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Delete customer API notice:', err));
  };

  const updateInboundEntry = (updatedEntry: any) => {
    setLinkedInboundEntries(prev => {
      const newList = prev.map(item => (item.id === updatedEntry.id || item.poNumber === updatedEntry.id) ? { ...item, ...updatedEntry } : item);
      safeSetItem('ss_print_inbound_entries_v6', newList);
      return newList;
    });

    const isRestock = updatedEntry.categoryPill === 'RESTOCK' || updatedEntry.specs?.isRestock || updatedEntry.id?.startsWith('INB-RESTOCK');
    const targetSku = updatedEntry.specs?.materialId || updatedEntry.specs?.skuCode || updatedEntry.specs?.sku || updatedEntry.skuCode || updatedEntry.sku || updatedEntry.originalSku || updatedEntry.id;
    const itemName = (updatedEntry.itemName || updatedEntry.name || '').trim();
    const cat = (updatedEntry.category || '').toLowerCase();
    const isPaper = cat === 'paper' || cat === 'material';
    const isEquip = cat === 'printer' || cat === 'machinery' || cat === 'cutter' || cat === 'laminator' || cat === 'binder';
    const sheetsPerPack = Number(updatedEntry.sheetsPerPack || updatedEntry.specs?.sheetsPerPack || updatedEntry.specs?.sheets_per_pack || updatedEntry.specs?.sheets_per_ream || 500);
    const packQty = Number(updatedEntry.quantity || updatedEntry.importQty || updatedEntry.currentQty || updatedEntry.initialQty || 1);
    const totalSheets = isPaper ? packQty * sheetsPerPack : packQty;
    const totalPrice = Number(updatedEntry.totalPrice || 95000);
    const costPerPurchase = Number(updatedEntry.unitPrice || (totalPrice / Math.max(1, packQty)));
    const costPerConsumption = isPaper ? Math.round(totalPrice / Math.max(1, totalSheets)) : costPerPurchase;

    fetch(`/api/inbound/${updatedEntry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEntry)
    }).catch(err => console.warn('Update Inbound API notice:', err));

    if (isEquip) {
      setEquipment(prev => {
        const next = prev.map(eq => {
          const isMatch = eq.id === targetSku || eq.id === updatedEntry.id || eq.serialNumber === targetSku || (itemName && eq.name && eq.name.toLowerCase() === itemName.toLowerCase());
          if (isMatch) {
            return {
              ...eq,
              name: itemName || eq.name,
              price: totalPrice,
              purchaseCost: totalPrice,
              vendor: updatedEntry.supplierName || updatedEntry.supplier || eq.vendor,
              specs: { ...(eq.specs || {}), ...(updatedEntry.specs || {}) }
            };
          }
          return eq;
        });
        safeSetItem('ss_print_equipment_v6', next);
        return next;
      });
      return;
    }

    setInventory(prev => {
      let matched = false;
      const originalName = (updatedEntry.originalName || '').trim();
      const originalSku = (updatedEntry.originalSku || '').trim();
      const originalId = (updatedEntry.originalId || updatedEntry.id || '').trim();

      const next = prev.map(invItem => {
        const isMatch = invItem.id === targetSku || 
                        invItem.sku === targetSku || 
                        invItem.id === updatedEntry.id || 
                        invItem.sku === updatedEntry.id || 
                        invItem.id === originalId || 
                        invItem.sku === originalId || 
                        (originalSku && (invItem.id === originalSku || invItem.sku === originalSku)) ||
                        invItem.id?.toLowerCase() === targetSku?.toLowerCase() || 
                        (invItem.sku && invItem.sku.toLowerCase() === targetSku?.toLowerCase()) || 
                        (itemName && invItem.name && invItem.name.toLowerCase() === itemName.toLowerCase()) ||
                        (originalName && invItem.name && invItem.name.toLowerCase() === originalName.toLowerCase()) ||
                        (invItem.batches || []).some((b: any) =>
                          b.id === updatedEntry.id ||
                          b.id === `LOT-${updatedEntry.id}` ||
                          b.id === originalId ||
                          b.id === `LOT-${originalId}` ||
                          b.poNumber === updatedEntry.poNumber ||
                          b.poNumber === updatedEntry.id ||
                          b.poNumber === originalId ||
                          (targetSku && (b.id === targetSku || b.id === `LOT-${targetSku}` || b.poNumber === targetSku)) ||
                          (originalSku && (b.id === originalSku || b.id === `LOT-${originalSku}` || b.poNumber === originalSku))
                        );

        if (isMatch) {
          matched = true;
          const existingBatches = invItem.batches || [];

          // Find index of existing batch lot
          const batchIndex = existingBatches.findIndex((b: any) =>
            b.id === updatedEntry.id ||
            b.id === `LOT-${updatedEntry.id}` ||
            b.id === originalId ||
            b.id === `LOT-${originalId}` ||
            b.poNumber === updatedEntry.poNumber ||
            b.poNumber === updatedEntry.id ||
            b.poNumber === originalId ||
            (existingBatches.length === 1 && !isRestock)
          );

          let updatedBatches = [...existingBatches];

          if (batchIndex !== -1) {
            updatedBatches[batchIndex] = {
              ...updatedBatches[batchIndex],
              id: updatedBatches[batchIndex].id || `LOT-${updatedEntry.id}`,
              poNumber: updatedEntry.poNumber || updatedEntry.id,
              purchaseDate: updatedEntry.inboundDate || updatedEntry.receiptDate || updatedBatches[batchIndex].purchaseDate,
              supplierName: updatedEntry.supplierName || updatedEntry.supplier || updatedBatches[batchIndex].supplierName,
              purchasePricePerReam: costPerPurchase,
              costPerSheet: costPerConsumption,
              initialQty: totalSheets,
              currentQty: totalSheets
            };
          } else {
            updatedBatches.push({
              id: `LOT-${updatedEntry.id}`,
              poNumber: updatedEntry.poNumber || updatedEntry.id,
              purchaseDate: updatedEntry.inboundDate || updatedEntry.receiptDate || new Date().toISOString().split('T')[0],
              supplierName: updatedEntry.supplierName || updatedEntry.supplier || 'Unknown Supplier',
              purchasePricePerReam: costPerPurchase,
              costPerSheet: costPerConsumption,
              initialQty: totalSheets,
              currentQty: totalSheets
            });
          }

          const newStockQty = updatedBatches.reduce((sum: number, b: any) => sum + Number(b.currentQty || 0), 0);
          const detectedColor = updatedEntry.specs?.colorName || (itemName.includes('Black') ? 'Black' : (itemName.includes('Cyan') ? 'Cyan' : (itemName.includes('Magenta') ? 'Magenta' : (itemName.includes('Yellow') ? 'Yellow' : invItem.colorName))));

          const newItem = {
            ...invItem,
            id: invItem.id,
            sku: invItem.sku || invItem.id,
            name: invItem.name || itemName,
            colorName: detectedColor,
            stockQty: newStockQty,
            purchaseMultiplier: isPaper ? sheetsPerPack : (invItem.purchaseMultiplier || 1),
            costPerPurchaseUnit: costPerPurchase,
            costPerConsumptionUnit: costPerConsumption,
            supplier: updatedEntry.supplierName || updatedEntry.supplier || invItem.supplier,
            specs: { 
              ...(invItem.specs || {}), 
              ...(updatedEntry.specs || {}),
              colorName: detectedColor
            },
            batches: updatedBatches
          };

          saveInventoryToBackend(newItem);
          return newItem;
        }
        return invItem;
      });

      if (!matched && !isRestock && !updatedEntry.id?.startsWith('INB-RESTOCK')) {
        const detectedColor = updatedEntry.specs?.colorName || (itemName.includes('Black') ? 'Black' : (itemName.includes('Cyan') ? 'Cyan' : (itemName.includes('Magenta') ? 'Magenta' : (itemName.includes('Yellow') ? 'Yellow' : undefined))));
        const newItem = {
          id: targetSku,
          sku: targetSku,
          name: itemName || targetSku,
          colorName: detectedColor,
          category: isPaper ? 'Paper' : (cat === 'ink' ? 'Ink' : 'Finishing'),
          stockQty: totalSheets,
          consumptionUnit: isPaper ? 'ແຜ່ນ' : (updatedEntry.unit || 'Units'),
          purchaseUnit: isPaper ? 'ແພັກ' : (updatedEntry.unit || 'Units'),
          purchaseMultiplier: isPaper ? sheetsPerPack : 1,
          costPerPurchaseUnit: costPerPurchase,
          costPerConsumptionUnit: costPerConsumption,
          reorderThreshold: 50,
          specs: {
            ...(updatedEntry.specs || {}),
            colorName: detectedColor
          },
          batches: [
            {
              id: `LOT-${updatedEntry.id}`,
              poNumber: updatedEntry.poNumber || updatedEntry.id,
              purchaseDate: updatedEntry.inboundDate || updatedEntry.receiptDate || new Date().toISOString().split('T')[0],
              supplierName: updatedEntry.supplierName || updatedEntry.supplier || '',
              purchasePricePerReam: costPerPurchase,
              costPerSheet: costPerConsumption,
              initialQty: totalSheets,
              currentQty: totalSheets
            }
          ]
        };
        saveInventoryToBackend(newItem);
        next.unshift(newItem);
      }

      safeSetItem('ss_print_inventory_v6', next);
      return next;
    });
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
    setCouriers(initialCouriers);
    setBankAccounts(initialPaymentMethods);
    setExchangeRates(DEFAULT_RATES);
    setRatesUpdatedAt('');
    setRateMode('sell');
  };

  // ---- Couriers CRUD Helpers ----
  const syncCouriersToBackend = async (list: any[]) => {
    try {
      await fetch('/api/v1/admin/couriers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list)
      });
    } catch (err) {
      console.warn('Sync couriers error:', err);
    }
  };

  const addCourier = async (newCourier: any) => {
    const courierObj = {
      id: newCourier.id || `courier_${Date.now()}`,
      name: newCourier.name,
      shortName: newCourier.shortName || newCourier.name,
      logoUrl: newCourier.logoUrl || '',
      fee: Number(newCourier.fee) || 0,
      eta: newCourier.eta || '1-2 ວັນ',
      freeAbove: Number(newCourier.freeAbove) || 0,
      color: newCourier.color || '#2563eb',
      isActive: newCourier.isActive !== false,
      isDefault: Boolean(newCourier.isDefault)
    };

    setCouriers(prev => {
      const nextList = [...prev.filter(c => c.id !== courierObj.id), courierObj];
      syncCouriersToBackend(nextList);
      return nextList;
    });
    return courierObj;
  };

  const updateCourier = async (id: string, updated: any) => {
    setCouriers(prev => {
      const nextList = prev.map(c => c.id === id ? { ...c, ...updated } : c);
      syncCouriersToBackend(nextList);
      return nextList;
    });
  };

  const deleteCourier = async (id: string) => {
    setCouriers(prev => {
      const nextList = prev.filter(c => c.id !== id);
      syncCouriersToBackend(nextList);
      return nextList;
    });
  };

  // ---- Bank Accounts CRUD Helpers ----
  const syncBankAccountsToBackend = async (list: any[]) => {
    try {
      await fetch('/api/v1/admin/payment-methods/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list)
      });
    } catch (err) {
      console.warn('Sync bank accounts error:', err);
    }
  };

  const addBankAccount = async (newBank: any) => {
    const bankObj = {
      id: newBank.id || `bank_${Date.now()}`,
      bankName: newBank.bankName,
      accountName: newBank.accountName,
      accountNumber: newBank.accountNumber,
      branch: newBank.branch || '',
      qrCodeUrl: newBank.qrCodeUrl || '',
      logoUrl: newBank.logoUrl || '',
      promptpayName: newBank.promptpayName || '',
      isActive: newBank.isActive !== false,
      isDefault: Boolean(newBank.isDefault)
    };

    setBankAccounts(prev => {
      const nextList = [...prev.filter(b => b.id !== bankObj.id), bankObj];
      syncBankAccountsToBackend(nextList);
      return nextList;
    });
    return bankObj;
  };

  const updateBankAccount = async (id: string, updated: any) => {
    setBankAccounts(prev => {
      const nextList = prev.map(b => b.id === id ? { ...b, ...updated } : b);
      syncBankAccountsToBackend(nextList);
      return nextList;
    });
  };

  const deleteBankAccount = async (id: string) => {
    setBankAccounts(prev => {
      const nextList = prev.filter(b => b.id !== id);
      syncBankAccountsToBackend(nextList);
      return nextList;
    });
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
      earningRecords,
      addEarningRecord,
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
      couriers,
      setCouriers,
      addCourier,
      updateCourier,
      deleteCourier,
      bankAccounts,
      setBankAccounts,
      addBankAccount,
      updateBankAccount,
      deleteBankAccount,
      activeRole,
      setActiveRole,
      canAccess,
      inventory,
      lowStockAlerts,
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
      updateMaterialReorderPoint,
      dischargeInventoryStock,
      deductStockForOrder,
      saveInventoryToBackend,
      deleteInventoryFromBackend,
      deleteInventoryBatch,
      editInventoryBatch,
      editInventorySku,
      updateInboundEntry,
      checkCreditLimit,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addOffcut,
      consumeOffcut,
      deleteOffcut,
      updatePreflightCheck,
      updateProductionStep,
      addOrderVersion,
      addOrder,
      updateOrderStatus,
      updateOrderDetails,
      startOrderProduction,
      updateOrderTracking,
      updateOrderPaymentStatus,
      settleOrderBalance,
      deleteOrder,
      addSpoilageLog,
      addStock,
      addEquipment,
      updateEquipment,
      deleteEquipment,
      meterReadings,
      addMeterReading,
      addDowntimeLog,
      updateDowntimeLog,
      addInboundEntry,
      printerColorLinks,
      setPrinterColorLinks,
      addPrinterColorLink,
      deletePrinterColorLink,
      quickAdjustStock,
      editInboundEntry,
      deleteInboundEntry,
      unrecordDeletedId,
      addPurchaseOrder,
      updateEquipmentComponentUsage,
      resetEquipmentComponent,
      swapEquipmentInk,
      replaceEquipmentComponent,
      updateEquipmentMaintenance,
      resetToDefaultData,
      refreshData
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
