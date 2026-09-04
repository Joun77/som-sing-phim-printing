import type { Dispatch, SetStateAction } from 'react';

export * from './features/inventory/types';
export * from './features/equipment/types';
export * from './features/customers/types';
export * from './features/orders/types';
export * from './features/hr/types';
export * from './features/inbound/types';
export * from './features/pricing/types';

import type { InventoryItem, Offcut, SpoilageLog } from './features/inventory/types';
import type { Equipment, MachineStatusEntry, DowntimeLog, PrinterColorLink } from './features/equipment/types';
import type { Customer } from './features/customers/types';
import type { Order, Delivery } from './features/orders/types';
import type { Employee } from './features/hr/types';
import type { InboundEntry, PurchaseOrder, PurchaseRequisition } from './features/inbound/types';
import type { Quotation } from './features/pricing/types';

export interface ExchangeRate {
  buy: number;
  sell: number;
}

export interface ToastState {
  message: string;
  type: string;
}

export interface ConfirmDialogState {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface Courier {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  fee?: number;
  eta?: string;
  freeAbove?: number;
  color?: string;
  isActive?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentMethod {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  qrCodeUrl?: string;
  logoUrl?: string;
  promptpayName?: string;
  shopName?: string;
  isActive?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EarningRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  orderId: string;
  orderNumber?: string;
  customerName?: string;
  stepId: string;
  stepName: string;
  impressions: number;
  ratePerImpression: number;
  earnedAmount: number;
  recordedAt: string;
}

export interface AppContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  focusOrderId: string | null;
  setFocusOrderId: (id: string | null) => void;
  preselectedCustomerName: string;
  setPreselectedCustomerName: (name: string) => void;
  prefilledOrderSpecs: any;
  setPrefilledOrderSpecs: (specs: any) => void;
  currency: string;
  setCurrency: (code: string) => void;
  formatCurrency: (num: number, targetCurrency?: any) => string;
  convertToCurrency?: (num: number) => number;
  convertCurrency?: (amount: number, from: any, to: any) => number;
  exchangeRates: Record<string, any>;
  ratesUpdatedAt: string;
  updateExchangeRate: (code: string, side: string, rate: number) => void;
  rateMode: string;
  setRateMode: (mode: string) => void;
  isRatesOpen: boolean;
  setIsRatesOpen: (open: boolean) => void;
  rateSource?: string;
  lastUpdated?: string;
  autoRefresh?: boolean;
  setAutoRefresh?: (a: boolean) => void;
  fetchLiveRates?: () => Promise<void>;
  setExchangeRates?: (r: any) => void;
  isLive?: boolean;
  connectionStatus?: 'connected' | 'offline' | 'checking';

  quotations: Quotation[];
  setQuotations: Dispatch<SetStateAction<Quotation[]>>;
  addQuotation: (...args: any[]) => any;
  reviseQuotation: (...args: any[]) => any;
  updateQuotation: (...args: any[]) => any;
  deleteQuotation: (...args: any[]) => any;
  convertQuotationToOrder: (...args: any[]) => any;

  employees: Employee[];
  setEmployees: Dispatch<SetStateAction<Employee[]>>;
  addEmployee: (...args: any[]) => any;
  updateEmployee: (...args: any[]) => any;
  deleteEmployee: (...args: any[]) => any;
  assignEmployeeToMachine: (...args: any[]) => any;
  recordImpressions: (...args: any[]) => any;
  earningRecords: EarningRecord[];
  addEarningRecord: (record: Omit<EarningRecord, 'id' | 'recordedAt'>) => void;

  machineStatus: Record<string, MachineStatusEntry>;
  setMachineStatus: (...args: any[]) => any;
  setMachineOperationalStatus: (...args: any[]) => any;
  downtimeLogs: DowntimeLog[];
  setDowntimeLogs: (...args: any[]) => any;
  resolveDowntime: (...args: any[]) => any;

  purchaseRequisitions: PurchaseRequisition[];
  setPurchaseRequisitions: (...args: any[]) => any;
  addPurchaseRequisition: (...args: any[]) => any;
  updatePurchaseRequisition: (...args: any[]) => any;

  deliveries: Delivery[];
  setDeliveries: (...args: any[]) => any;
  addDelivery: (...args: any[]) => any;
  updateDelivery: (...args: any[]) => any;

  activeRole: string;
  setActiveRole: (role: string) => void;
  canAccess: (permission: string) => boolean;

  inventory: InventoryItem[];
  lowStockAlerts: any[];
  equipment: Equipment[];
  orders: Order[];
  spoilageLogs: SpoilageLog[];
  customers: Customer[];
  offcuts: Offcut[];
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: Dispatch<SetStateAction<PurchaseOrder[]>>;
  deletePurchaseOrder: (...args: any[]) => any;
  linkedInboundEntries: InboundEntry[];
  customCategories: any[];
  setCustomCategories: (...args: any[]) => any;
  masterSpecsPool: any[];
  setMasterSpecsPool: (...args: any[]) => any;

  toast: ToastState | null;
  setToast: (toast: ToastState | null) => void;
  confirmDialog: ConfirmDialogState | null;
  showToast: (message: string, type?: string) => void;
  askConfirmation: (message: string, onConfirm: () => void) => void;

  getDashboardStats: () => any;
  getFIFOCostPerSheet: (itemId: string, sheetsNeeded: number) => number;
  addInventoryBatch: (...args: any[]) => any;
  addInventorySku: (...args: any[]) => any;
  updateMaterialReorderPoint: (skuId: string, threshold: number) => void;
  dischargeInventoryStock: (...args: any[]) => any;
  deductStockForOrder: (...args: any[]) => any;
  saveInventoryToBackend: (...args: any[]) => any;
  deleteInventoryFromBackend: (...args: any[]) => any;
  deleteInventoryBatch: (...args: any[]) => any;
  editInventoryBatch: (...args: any[]) => any;
  editInventorySku: (...args: any[]) => any;
  updateInboundEntry: (...args: any[]) => any;
  checkCreditLimit: (...args: any[]) => any;

  addCustomer: (...args: any[]) => any;
  updateCustomer: (...args: any[]) => any;
  deleteCustomer: (...args: any[]) => any;
  bulkDeleteCustomers?: (...args: any[]) => any;
  customerCategories?: any[];
  fetchCustomerCategories?: () => Promise<void>;
  addCustomerCategory?: (category: any) => Promise<any>;
  updateCustomerCategory?: (id: string, category: any) => Promise<any>;
  deleteCustomerCategory?: (id: string) => Promise<any>;
  addOffcut: (...args: any[]) => any;
  consumeOffcut: (...args: any[]) => any;
  deleteOffcut?: (...args: any[]) => any;

  updatePreflightCheck: (...args: any[]) => any;
  updateProductionStep: (...args: any[]) => any;
  addOrderVersion: (...args: any[]) => any;
  addOrder: (...args: any[]) => any;
  updateOrderStatus: (...args: any[]) => any;
  updateOrderDetails?: (orderId: string, updatedOrder: any) => void;
  startOrderProduction?: (orderId: string) => boolean;
  updateOrderTracking?: (orderId: string, courierName: string, trackingNumber: string, shippingFee?: number, branchCode?: string) => void;
  settleOrderBalance: (...args: any[]) => any;
  deleteOrder: (...args: any[]) => any;
  addSpoilageLog: (...args: any[]) => any;
  addStock: (...args: any[]) => any;
  addEquipment: (...args: any[]) => any;
  updateEquipment?: (...args: any[]) => any;
  deleteEquipment?: (...args: any[]) => any;
  meterReadings?: any[];
  addMeterReading?: (...args: any[]) => any;
  addDowntimeLog?: (...args: any[]) => any;
  updateDowntimeLog?: (...args: any[]) => any;

  addInboundEntry: (...args: any[]) => any;
  printerColorLinks: PrinterColorLink[];
  setPrinterColorLinks: (...args: any[]) => any;
  addPrinterColorLink: (...args: any[]) => any;
  deletePrinterColorLink: (...args: any[]) => any;
  quickAdjustStock: (...args: any[]) => any;
  editInboundEntry: (...args: any[]) => any;
  deleteInboundEntry: (...args: any[]) => any;
  unrecordDeletedId?: (id: string) => void;
  addPurchaseOrder: (...args: any[]) => any;
  updateEquipmentComponentUsage: (...args: any[]) => any;
  resetEquipmentComponent: (...args: any[]) => any;
  swapEquipmentInk?: (equipmentId: string, slotPosition: string, inkSku: string, qty?: number, remarks?: string) => boolean;
  replaceEquipmentComponent?: (equipmentId: string, componentName: string, deductSparePartSku?: string, qty?: number, remarks?: string) => boolean;
  updateEquipmentMaintenance: (...args: any[]) => any;
  resetToDefaultData: (...args: any[]) => any;
  refreshData: () => Promise<void>;
  [key: string]: any;
}
