import { create } from 'zustand';

interface FilterState {
  // Orders Filters
  ordersSearchQuery: string;
  ordersStatusFilter: string;
  ordersPaymentFilter: string;
  ordersCourierFilter: string;
  ordersDateRangePreset: string;

  // Inventory Filters
  inventorySearchQuery: string;
  inventoryCategoryFilter: string;
  inventoryStockStatusFilter: string;

  // Suppliers Filters
  poSearchQuery: string;
  poStatusFilter: string;

  // Setters
  setOrdersSearchQuery: (query: string) => void;
  setOrdersStatusFilter: (status: string) => void;
  setOrdersPaymentFilter: (filter: string) => void;
  setOrdersCourierFilter: (courier: string) => void;
  setOrdersDateRangePreset: (preset: string) => void;
  resetOrderFilters: () => void;

  setInventorySearchQuery: (query: string) => void;
  setInventoryCategoryFilter: (category: string) => void;
  setInventoryStockStatusFilter: (status: string) => void;
  resetInventoryFilters: () => void;

  setPOSearchQuery: (query: string) => void;
  setPOStatusFilter: (status: string) => void;
  resetPOFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  // Orders
  ordersSearchQuery: '',
  ordersStatusFilter: 'ALL',
  ordersPaymentFilter: 'all',
  ordersCourierFilter: 'all',
  ordersDateRangePreset: 'all',

  // Inventory
  inventorySearchQuery: '',
  inventoryCategoryFilter: 'ALL',
  inventoryStockStatusFilter: 'ALL',

  // Suppliers
  poSearchQuery: '',
  poStatusFilter: 'ALL',

  // Actions
  setOrdersSearchQuery: (query) => set({ ordersSearchQuery: query }),
  setOrdersStatusFilter: (status) => set({ ordersStatusFilter: status }),
  setOrdersPaymentFilter: (filter) => set({ ordersPaymentFilter: filter }),
  setOrdersCourierFilter: (courier) => set({ ordersCourierFilter: courier }),
  setOrdersDateRangePreset: (preset) => set({ ordersDateRangePreset: preset }),
  resetOrderFilters: () =>
    set({
      ordersSearchQuery: '',
      ordersStatusFilter: 'ALL',
      ordersPaymentFilter: 'all',
      ordersCourierFilter: 'all',
      ordersDateRangePreset: 'all',
    }),

  setInventorySearchQuery: (query) => set({ inventorySearchQuery: query }),
  setInventoryCategoryFilter: (category) => set({ inventoryCategoryFilter: category }),
  setInventoryStockStatusFilter: (status) => set({ inventoryStockStatusFilter: status }),
  resetInventoryFilters: () =>
    set({
      inventorySearchQuery: '',
      inventoryCategoryFilter: 'ALL',
      inventoryStockStatusFilter: 'ALL',
    }),

  setPOSearchQuery: (query) => set({ poSearchQuery: query }),
  setPOStatusFilter: (status) => set({ poStatusFilter: status }),
  resetPOFilters: () =>
    set({
      poSearchQuery: '',
      poStatusFilter: 'ALL',
    }),
}));
