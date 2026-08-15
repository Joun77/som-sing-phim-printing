import { create } from 'zustand';

export interface InventoryStoreState {
  inventory: any[];
  inboundData: any[];
  equipment: any[];
  offcuts: any[];
  spoilageLogs: any[];
  printerColorLinks: any[];
  inventoryBatches: any[];
  isLoading: boolean;
  error: string | null;

  setInventory: (items: any[]) => void;
  addInventoryItem: (item: any) => void;
  updateInventoryItem: (id: string, updated: any) => void;
  deleteInventoryItem: (id: string) => void;

  setInboundData: (data: any[]) => void;
  addInboundTransaction: (transaction: any) => void;
  updateInboundTransaction: (id: string, updated: any) => void;
  deleteInboundTransaction: (id: string) => void;

  setEquipment: (eqList: any[]) => void;
  addEquipment: (eq: any) => void;
  updateEquipment: (id: string, updated: any) => void;
  deleteEquipment: (id: string) => void;

  setOffcuts: (offcuts: any[]) => void;
  addOffcut: (offcut: any) => void;
  deleteOffcut: (id: string) => void;

  setSpoilageLogs: (logs: any[]) => void;
  addSpoilageLog: (log: any) => void;

  setPrinterColorLinks: (links: any[]) => void;
  addPrinterColorLink: (link: any) => void;
  deletePrinterColorLink: (id: string) => void;
}

export const useInventoryStore = create<InventoryStoreState>((set) => ({
  inventory: [],
  inboundData: [],
  equipment: [],
  offcuts: [],
  spoilageLogs: [],
  printerColorLinks: [],
  inventoryBatches: [],
  isLoading: false,
  error: null,

  setInventory: (inventory) => set({ inventory }),
  addInventoryItem: (item) =>
    set((state) => ({ inventory: [item, ...state.inventory] })),
  updateInventoryItem: (id, updated) =>
    set((state) => ({
      inventory: state.inventory.map((item) =>
        item.id === id ? { ...item, ...updated } : item
      ),
    })),
  deleteInventoryItem: (id) =>
    set((state) => ({
      inventory: state.inventory.filter((item) => item.id !== id),
    })),

  setInboundData: (inboundData) => set({ inboundData }),
  addInboundTransaction: (transaction) =>
    set((state) => ({ inboundData: [transaction, ...state.inboundData] })),
  updateInboundTransaction: (id, updated) =>
    set((state) => ({
      inboundData: state.inboundData.map((tx) =>
        tx.id === id ? { ...tx, ...updated } : tx
      ),
    })),
  deleteInboundTransaction: (id) =>
    set((state) => ({
      inboundData: state.inboundData.filter((tx) => tx.id !== id),
    })),

  setEquipment: (equipment) => set({ equipment }),
  addEquipment: (eq) =>
    set((state) => ({ equipment: [eq, ...state.equipment] })),
  updateEquipment: (id, updated) =>
    set((state) => ({
      equipment: state.equipment.map((eq) =>
        eq.id === id ? { ...eq, ...updated } : eq
      ),
    })),
  deleteEquipment: (id) =>
    set((state) => ({
      equipment: state.equipment.filter((eq) => eq.id !== id),
    })),

  setOffcuts: (offcuts) => set({ offcuts }),
  addOffcut: (offcut) => set((state) => ({ offcuts: [offcut, ...state.offcuts] })),
  deleteOffcut: (id) =>
    set((state) => ({
      offcuts: state.offcuts.filter((o) => o.id !== id),
    })),

  setSpoilageLogs: (spoilageLogs) => set({ spoilageLogs }),
  addSpoilageLog: (log) =>
    set((state) => ({ spoilageLogs: [log, ...state.spoilageLogs] })),

  setPrinterColorLinks: (printerColorLinks) => set({ printerColorLinks }),
  addPrinterColorLink: (link) =>
    set((state) => ({ printerColorLinks: [link, ...state.printerColorLinks] })),
  deletePrinterColorLink: (id) =>
    set((state) => ({
      printerColorLinks: state.printerColorLinks.filter((l) => l.id !== id),
    })),
}));
