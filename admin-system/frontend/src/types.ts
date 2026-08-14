import type { Dispatch, SetStateAction } from 'react';

export * from './types/inventory';
export * from './types/equipment';
export * from './types/customers';
export * from './types/orders';
export * from './types/hr';
export * from './types/inbound';
export * from './types/quotation';

import type { InventoryItem, Offcut, SpoilageLog } from './types/inventory';
import type { Equipment, MachineStatusEntry, DowntimeLog, PrinterColorLink } from './types/equipment';
import type { Customer } from './types/customers';
import type { Order, Delivery } from './types/orders';
import type { Employee } from './types/hr';
import type { InboundEntry, PurchaseOrder, PurchaseRequisition } from './types/inbound';
import type { Quotation } from './types/quotation';

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
  formatCurrency: (num: number) => string;
  convertToCurrency: (num: number) => number;
  exchangeRates: Record<string, any>;
  ratesUpdatedAt: string;
  updateExchangeRate: (code: string, side: string, rate: number) => void;
  rateMode: string;
  setRateMode: (mode: string) => void;
  isRatesOpen: boolean;
  setIsRatesOpen: (open: boolean) => void;

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
  addOffcut: (...args: any[]) => any;
  consumeOffcut: (...args: any[]) => any;

  updatePreflightCheck: (...args: any[]) => any;
  updateProductionStep: (...args: any[]) => any;
  addOrderVersion: (...args: any[]) => any;
  addOrder: (...args: any[]) => any;
  updateOrderStatus: (...args: any[]) => any;
  settleOrderBalance: (...args: any[]) => any;
  deleteOrder: (...args: any[]) => any;
  addSpoilageLog: (...args: any[]) => any;
  addStock: (...args: any[]) => any;
  addEquipment: (...args: any[]) => any;

  addInboundEntry: (...args: any[]) => any;
  printerColorLinks: PrinterColorLink[];
  setPrinterColorLinks: (...args: any[]) => any;
  addPrinterColorLink: (...args: any[]) => any;
  deletePrinterColorLink: (...args: any[]) => any;
  quickAdjustStock: (...args: any[]) => any;
  editInboundEntry: (...args: any[]) => any;
  deleteInboundEntry: (...args: any[]) => any;
  addPurchaseOrder: (...args: any[]) => any;
  updateEquipmentComponentUsage: (...args: any[]) => any;
  resetEquipmentComponent: (...args: any[]) => any;
  updateEquipmentMaintenance: (...args: any[]) => any;
  resetToDefaultData: (...args: any[]) => any;
}
