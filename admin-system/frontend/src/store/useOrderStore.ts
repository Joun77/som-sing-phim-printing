import { create } from 'zustand';

export interface OrderStoreState {
  orders: any[];
  quotations: any[];
  customers: any[];
  deliveries: any[];
  purchaseOrders: any[];
  isLoading: boolean;
  error: string | null;

  setOrders: (orders: any[]) => void;
  addOrder: (order: any) => void;
  updateOrder: (id: string, updated: any) => void;
  updateOrderStatus: (id: string, status: string) => void;
  recordDeposit: (id: string, amount: number) => void;

  setQuotations: (quotations: any[]) => void;
  addQuotation: (quotation: any) => void;
  updateQuotation: (id: string, updated: any) => void;
  deleteQuotation: (id: string) => void;

  setCustomers: (customers: any[]) => void;
  addCustomer: (customer: any) => void;
  updateCustomer: (id: string, updated: any) => void;

  setDeliveries: (deliveries: any[]) => void;
  addDelivery: (delivery: any) => void;
  updateDelivery: (id: string, updated: any) => void;
}

export const useOrderStore = create<OrderStoreState>((set) => ({
  orders: [],
  quotations: [],
  customers: [],
  deliveries: [],
  purchaseOrders: [],
  isLoading: false,
  error: null,

  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (id, updated) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updated } : o)),
    })),
  updateOrderStatus: (id, status) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),
  recordDeposit: (id, amount) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id
          ? {
              ...o,
              depositPaid: (o.depositPaid || 0) + amount,
              paymentStatus:
                (o.depositPaid || 0) + amount >= (o.totalAmount || 0)
                  ? 'Paid'
                  : 'Deposit Paid',
            }
          : o
      ),
    })),

  setQuotations: (quotations) => set({ quotations }),
  addQuotation: (quotation) =>
    set((state) => ({ quotations: [quotation, ...state.quotations] })),
  updateQuotation: (id, updated) =>
    set((state) => ({
      quotations: state.quotations.map((q) =>
        q.id === id ? { ...q, ...updated } : q
      ),
    })),
  deleteQuotation: (id) =>
    set((state) => ({
      quotations: state.quotations.filter((q) => q.id !== id),
    })),

  setCustomers: (customers) => set({ customers }),
  addCustomer: (customer) =>
    set((state) => ({ customers: [customer, ...state.customers] })),
  updateCustomer: (id, updated) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...updated } : c
      ),
    })),

  setDeliveries: (deliveries) => set({ deliveries }),
  addDelivery: (delivery) =>
    set((state) => ({ deliveries: [delivery, ...state.deliveries] })),
  updateDelivery: (id, updated) =>
    set((state) => ({
      deliveries: state.deliveries.map((d) =>
        d.id === id ? { ...d, ...updated } : d
      ),
    })),
}));
