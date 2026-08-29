import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface UIState {
  // Sidebar & Navigation
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  activeModule: string;
  activeSubTab: string;

  // Modals & Overlays
  toasts: ToastMessage[];
  confirmDialog: ConfirmDialogState | null;
  lightboxUrl: string | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveModule: (module: string, subTab?: string) => void;
  setActiveSubTab: (subTab: string) => void;

  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
  removeToast: (id: string) => void;
  showConfirmDialog: (dialog: Omit<ConfirmDialogState, 'isOpen'>) => void;
  closeConfirmDialog: () => void;
  setLightboxUrl: (url: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModule: 'orders',
  activeSubTab: 'all',

  toasts: [],
  confirmDialog: null,
  lightboxUrl: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActiveModule: (module, subTab = 'all') => set({ activeModule: module, activeSubTab: subTab }),
  setActiveSubTab: (subTab) => set({ activeSubTab: subTab }),

  showToast: (message, type = 'info', title) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, title, message }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  showConfirmDialog: (dialog) =>
    set({
      confirmDialog: { ...dialog, isOpen: true },
    }),

  closeConfirmDialog: () =>
    set({
      confirmDialog: null,
    }),

  setLightboxUrl: (url) => set({ lightboxUrl: url }),
}));
