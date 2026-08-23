import React, { createContext, useContext, useState, useEffect } from 'react';
import { sampleInboundData } from '@features/inbound/data/sampleInboundData';
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
const initialOffcuts: any[] = [];
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
    logoUrl: 'http://localhost:8080/api/v1/orders/files/logo_1787356736419680000.png',
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
    const isPaper = cat === 'paper' || cat === 'material';
    const multiplier = Number(item.purchaseMultiplier || item.specs?.sheetsPerPack || 500);
    
    let currentStockSheets = Number(item.stockQty) || Number(item.currentStock) || 0;
    if (isPaper && currentStockSheets > 0 && currentStockSheets <= 10) {
      currentStockSheets = currentStockSheets * multiplier;
    } else if (isPaper && currentStockSheets === 0) {
      currentStockSheets = multiplier;
    }

    const costPerPurchase = Number(item.costPerPurchaseUnit || item.price || 95000);
    const costPerConsumption = isPaper ? Math.round(costPerPurchase / multiplier) : Number(item.costPerConsumptionUnit || costPerPurchase);

    let rawBatches = (item.batches || []).filter((b: any) => b.id && !b.id.includes('-EMPTY'));
    let realBatches: any[] = [];
    const seenBatchKeys = new Set();

    for (const b of rawBatches) {
      const key = b.id || b.poNumber || b.batchId;
      if (key && !seenBatchKeys.has(key)) {
        seenBatchKeys.add(key);
        let bQty = Number(b.currentQty || b.initialQty || 0);
        if (isPaper && bQty > 0 && bQty <= 10) {
          bQty = bQty * multiplier;
        }
        realBatches.push({
          ...b,
          initialQty: b.initialQty <= 10 && isPaper ? b.initialQty * multiplier : b.initialQty,
          currentQty: bQty
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
      consumptionUnit: isPaper ? 'แผ่น' : (item.consumptionUnit || 'Units'),
      purchaseUnit: isPaper ? 'แพ็ก' : (item.purchaseUnit || 'Units'),
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

  const [inventory, setInventory] = useState(() => {
    const deletedIds = getDeletedIds();
    const saved = localStorage.getItem('ss_print_inventory_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const unique = [];
        const seen = new Set();
        for (const item of parsed) {
          if (item && item.id && !seen.has(item.id) && !deletedIds.has(item.id) && !deletedIds.has(item.id.toLowerCase())) {
            seen.add(item.id);
            unique.push(sanitizeInventoryItem(item));
          }
        }
        if (unique.length > 0) return unique;
        return initialInventory.filter(i => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase()));
      } catch (e) {
        return initialInventory.filter(i => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase()));
      }
    }
    return initialInventory.filter(i => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase()));
  });

  const [equipment, setEquipment] = useState(() => {
    const deletedIds = getDeletedIds();
    const saved = localStorage.getItem('ss_print_equipment_v6');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(i => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase()));
        }
      } catch (e) {}
    }
    return initialEquipment.filter(i => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase()));
  });

  const refreshData = async () => {
    const deletedIds = getDeletedIds();

    // 1. Assets / Equipment
    try {
      const res = await fetch('http://localhost:8080/api/v1/assets');
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data) && resData.data.length > 0) {
          setEquipment(prevEq => {
            const mapById = new Map();
            (prevEq || []).filter(i => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase())).forEach(item => mapById.set(item.id, item));
            resData.data.filter((i: any) => !deletedIds.has(i.id) && !deletedIds.has(i.id?.toLowerCase())).forEach((item: any) => {
              if (mapById.has(item.id)) {
                mapById.set(item.id, { ...mapById.get(item.id), ...item });
              } else {
                mapById.set(item.id, item);
              }
            });
            const merged = Array.from(mapById.values());
            safeSetItem('ss_print_equipment_v6', merged);
            return merged;
          });
        }
      }
    } catch (e) {}

    // 2. Inventory Items
    try {
      const res = await fetch('http://localhost:8080/api/inventory/items');
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data) && resData.data.length > 0) {
          const mapped = resData.data.map(sanitizeInventoryItem);
          setInventory(prevInv => {
            const mapById = new Map();
            (prevInv || []).filter(i => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase())).forEach(item => mapById.set(item.id, item));
            mapped.filter((i: any) => !deletedIds.has(i.id) && !deletedIds.has(i.id.toLowerCase())).forEach((item: any) => {
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
      }
    } catch (e) {}

    // 3. Orders
    try {
      const res = await fetch('http://localhost:8080/api/orders');
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (e) {}

    // 4. Customers
    try {
      const res = await fetch('http://localhost:8080/api/customers');
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data)) {
          setCustomers(resData.data);
        }
      }
    } catch (e) {}

    // 5. Spoilage
    try {
      const res = await fetch('http://localhost:8080/api/spoilage');
      if (res && res.ok) {
        const resData = await res.json();
        if (resData && resData.status === 'success' && Array.isArray(resData.data)) {
          setSpoilageLogs(resData.data);
        }
      }
    } catch (e) {}

    // 6. Inbound Transactions
    try {
      const res = await fetch('http://localhost:8080/api/inbound');
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
          setLinkedInboundEntries(mappedInbound);
        }
      }
    } catch (e) {}

    const localCouriers = localStorage.getItem('ss_print_couriers_v1');
    if (localCouriers) {
      try {
        const parsed = JSON.parse(localCouriers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          fetch('http://localhost:8080/api/v1/admin/couriers/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }).catch(err => console.warn('Couriers sync notice:', err));
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      fetch('http://localhost:8080/api/v1/couriers')
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
          fetch('http://localhost:8080/api/v1/admin/payment-methods/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }).catch(err => console.warn('Payment methods sync notice:', err));
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      fetch('http://localhost:8080/api/v1/payment-methods')
        .then(res => (res && res.ok ? res.json() : null))
        .then(resData => {
          if (resData && resData.status === 'success' && Array.isArray(resData.data) && resData.data.length > 0) {
            setBankAccounts(resData.data);
          }
        })
        .catch(err => console.warn('Payment methods fetch notice:', err));
    }
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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const rawLocal = localStorage.getItem('som_sing_inbound_list');
    if (rawLocal) {
      try {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return sampleInboundData;
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
      allInboundEntries.forEach((e: any) => {
        if (!e) return;
        const isMachinery = e.category === 'PRINTER' || e.category === 'CUTTER' || e.category === 'MACHINERY';
        if (isMachinery) return;

        const sku = (e.sku || e.skuCode || e.id || '').trim();
        const name = (e.name || e.itemName || sku).trim();
        if (!sku && !name) return;

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
            consumptionUnit: isPaper ? 'แผ่น' : (e.unit || 'Units'),
            purchaseUnit: isPaper ? 'แพ็ก' : (e.unit || 'Units'),
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
        const toAdd: any[] = [];

        machineryEntries.forEach((m: any) => {
          const id = (m.id || m.sku || `MAC-${Date.now()}`).trim();
          if (!currentEqIds.has(id.toLowerCase())) {
            currentEqIds.add(id.toLowerCase());
            eqUpdated = true;
            const isPrn = m.category === 'PRINTER' || m.category === 'Printer';
            toAdd.push({
              id,
              name: m.name || m.itemName || `${m.brand || 'Equipment'} ${m.model || id}`,
              brand: m.brand || 'Industrial',
              model: m.model || id,
              serialNumber: m.serialNumber || m.sn || id,
              category: isPrn ? 'Printer' : (m.category === 'CUTTER' ? 'Cutter' : (m.category === 'LAMINATOR' ? 'Laminator' : 'Binder')),
              printerCategory: isPrn ? (m.printerCategory || 'Digital Color Press') : undefined,
              status: 'In Use',
              location: m.location || 'Press Floor',
              purchaseCost: Number(m.totalPrice || m.price || 50000000),
              lifespanYears: Number(m.lifespanYears || 5),
              printedPagesCapacity: Number(m.printedPagesCapacity || 1000000),
              printedCount: 0,
              calculatedCostPerPage: Number(m.calculatedCostPerPage || 50),
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
    const baseCost = Number(item.costPerConsumptionUnit) || Number(item.costPerSheet) || (Number(item.costPerPurchaseUnit) && Number(item.purchaseMultiplier) ? Number(item.costPerPurchaseUnit) / Number(item.purchaseMultiplier) : 0) || Number(item.unitCost) || 0;
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
      const bCost = Number(batch.costPerSheet) || baseCost;
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

    fetch(`http://localhost:8080/api/inventory/${skuId}/discharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skuId, quantity: qtyNeeded, reason, remarks })
    }).catch(err => console.log('Inventory discharge backend sync notice:', err));
  };

  const deductStockForOrder = (orderData: any) => {
    if (!orderData) return;
    const itemsArr = orderData.items || orderData.orderItems || [orderData];
    itemsArr.forEach((ordItem: any) => {
      const paperSku = ordItem.paperCode || ordItem.paperId || ordItem.sku || ordItem.materialId;
      const pagesCount = Number(ordItem.pages) || Number(ordItem.pagesPerItem) || 1;
      const printQty = Number(ordItem.quantity) || Number(ordItem.qty) || 1;
      const totalSheets = printQty * pagesCount;

      if (paperSku) {
        dischargeInventoryStock(paperSku, totalSheets, 'PRINT_PRODUCTION', `Order #${orderData.id || orderData.orderNo || 'Job'}`);
      }
    });
  };

  const saveInventoryToBackend = (item: any) => {
    fetch('http://localhost:8080/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).catch(err => console.log('Inventory save backend sync notice:', err));
  };

  const deleteInventoryFromBackend = (id: string) => {
    recordDeletedId(id);
    setInventory(prev => {
      const next = prev.filter(item => item.id !== id && item.id.toLowerCase() !== id.toLowerCase() && item.sku !== id && (item.sku || '').toLowerCase() !== id.toLowerCase());
      safeSetItem('ss_print_inventory_v6', next);
      return next;
    });
    fetch(`http://localhost:8080/api/inventory/${id}`, {
      method: 'DELETE'
    }).catch(err => console.log('Inventory delete backend sync notice:', err));
    fetch(`http://localhost:8080/api/inventory/items/${id}`, {
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
    fetch(`http://localhost:8080/api/inventory/items/${newSku.id}`, {
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
    fetch(`http://localhost:8080/api/inventory/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.log('API inventory items update notice:', err));
    fetch(`http://localhost:8080/api/inventory/${itemId}`, {
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
    fetch(`http://localhost:8080/api/equipment/${newEq.id}`, {
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
    fetch(`http://localhost:8080/api/equipment/${eqId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.log('API equipment update notice:', err));
    fetch(`http://localhost:8080/api/v1/assets/${eqId}`, {
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
    fetch(`http://localhost:8080/api/equipment/${eqId}`, {
      method: 'DELETE'
    }).catch(err => console.log('API equipment delete notice:', err));
    fetch(`http://localhost:8080/api/v1/assets/${eqId}`, {
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

  const deleteInboundEntry = (id) => {
    recordDeletedId(id);
    setLinkedInboundEntries(prev => {
      const next = prev.filter(item => item.id !== id && item.poNumber !== id && item.id?.toLowerCase() !== id?.toLowerCase());
      safeSetItem('ss_print_inbound_entries_v6', next);
      return next;
    });
    fetch(`http://localhost:8080/api/inbound/${id}`, {
      method: 'DELETE'
    }).catch(err => console.log('API inbound delete notice:', err));
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

    fetch('http://localhost:8080/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCust)
    }).catch(err => console.warn('Add customer API notice:', err));
  };

  const updateCustomer = (customerId, updatedFields) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const updated = { ...c, ...updatedFields };
        fetch(`http://localhost:8080/api/customers/${customerId}`, {
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
  };

  const updateInboundEntry = (updatedEntry: any) => {
    setLinkedInboundEntries(prev => {
      const newList = prev.map(item => (item.id === updatedEntry.id || item.poNumber === updatedEntry.id) ? { ...item, ...updatedEntry } : item);
      safeSetItem('ss_print_inbound_entries_v6', newList);
      return newList;
    });

    const targetSku = updatedEntry.skuCode || updatedEntry.sku || updatedEntry.id;
    const itemName = updatedEntry.itemName || updatedEntry.name || '';
    const cat = (updatedEntry.category || '').toLowerCase();
    const isPaper = cat === 'paper' || cat === 'material';
    const isEquip = cat === 'printer' || cat === 'machinery' || cat === 'cutter' || cat === 'laminator' || cat === 'binder';
    const sheetsPerPack = Number(updatedEntry.sheetsPerPack || updatedEntry.specs?.sheetsPerPack || updatedEntry.specs?.sheets_per_pack || updatedEntry.specs?.sheets_per_ream || 500);
    const packQty = Number(updatedEntry.quantity || updatedEntry.importQty || updatedEntry.currentQty || updatedEntry.initialQty || 1);
    const totalSheets = isPaper ? packQty * sheetsPerPack : packQty;
    const totalPrice = Number(updatedEntry.totalPrice || 95000);
    const costPerPurchase = Number(updatedEntry.unitPrice || (totalPrice / Math.max(1, packQty)));
    const costPerConsumption = isPaper ? Math.round(totalPrice / Math.max(1, totalSheets)) : costPerPurchase;

    fetch(`http://localhost:8080/api/inbound/${updatedEntry.id}`, {
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
      const next = prev.map(invItem => {
        const isMatch = invItem.id === targetSku || 
                        invItem.sku === targetSku || 
                        invItem.id?.toLowerCase() === targetSku?.toLowerCase() || 
                        (invItem.sku && invItem.sku.toLowerCase() === targetSku?.toLowerCase()) || 
                        (itemName && invItem.name && invItem.name.toLowerCase() === itemName.toLowerCase());

        if (isMatch) {
          matched = true;
          const existingBatches = invItem.batches || [];

          // Find index of existing batch lot
          const batchIndex = existingBatches.findIndex((b: any) =>
            b.id === updatedEntry.id ||
            b.id === `LOT-${updatedEntry.id}` ||
            b.poNumber === updatedEntry.poNumber ||
            b.poNumber === updatedEntry.id ||
            (existingBatches.length === 1)
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

          const newItem = {
            ...invItem,
            name: itemName || invItem.name,
            stockQty: newStockQty,
            purchaseMultiplier: isPaper ? sheetsPerPack : (invItem.purchaseMultiplier || 1),
            costPerPurchaseUnit: costPerPurchase,
            costPerConsumptionUnit: costPerConsumption,
            supplier: updatedEntry.supplierName || updatedEntry.supplier || invItem.supplier,
            specs: { ...(invItem.specs || {}), ...(updatedEntry.specs || {}) },
            batches: updatedBatches
          };

          saveInventoryToBackend(newItem);
          return newItem;
        }
        return invItem;
      });

      if (!matched) {
        const newItem = {
          id: targetSku,
          sku: targetSku,
          name: itemName || targetSku,
          category: isPaper ? 'Paper' : (cat === 'ink' ? 'Ink' : 'Finishing'),
          stockQty: totalSheets,
          consumptionUnit: isPaper ? 'แผ่น' : (updatedEntry.unit || 'Units'),
          purchaseUnit: isPaper ? 'แพ็ก' : (updatedEntry.unit || 'Units'),
          purchaseMultiplier: isPaper ? sheetsPerPack : 1,
          costPerPurchaseUnit: costPerPurchase,
          costPerConsumptionUnit: costPerConsumption,
          reorderThreshold: 50,
          specs: updatedEntry.specs || {},
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
      await fetch('http://localhost:8080/api/v1/admin/couriers/sync', {
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
      await fetch('http://localhost:8080/api/v1/admin/payment-methods/sync', {
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
      updatePreflightCheck,
      updateProductionStep,
      addOrderVersion,
      addOrder,
      updateOrderStatus,
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
      addPurchaseOrder,
      updateEquipmentComponentUsage,
      resetEquipmentComponent,
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
