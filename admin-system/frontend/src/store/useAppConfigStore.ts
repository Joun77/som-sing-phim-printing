import { create } from 'zustand';

export interface ExchangeRateDetail {
  buy: number;
  sell: number;
}

export interface AppConfigStoreState {
  currency: 'LAK' | 'THB' | 'USD' | string;
  exchangeRates: Record<string, ExchangeRateDetail>;
  rateMode: 'buy' | 'sell';
  ratesUpdatedAt: string;
  activeTab: string;
  toast: { message: string; type: 'success' | 'warning' | 'info' | 'error' } | null;

  setCurrency: (currency: string) => void;
  setExchangeRates: (rates: Record<string, ExchangeRateDetail>) => void;
  updateExchangeRate: (code: string, side: 'buy' | 'sell', rate: number) => void;
  setRateMode: (mode: 'buy' | 'sell') => void;
  setActiveTab: (tab: string) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  clearToast: () => void;
}

const DEFAULT_RATES: Record<string, ExchangeRateDetail> = {
  THB: { buy: 680, sell: 700 },
  USD: { buy: 21000, sell: 21800 },
};

export const useAppConfigStore = create<AppConfigStoreState>((set) => ({
  currency: localStorage.getItem('ss_print_currency_v6') || 'LAK',
  exchangeRates: (() => {
    const saved = localStorage.getItem('ss_print_rates_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_RATES;
  })(),
  rateMode: (localStorage.getItem('ss_print_rate_mode_v1') as 'buy' | 'sell') || 'sell',
  ratesUpdatedAt: localStorage.getItem('ss_print_rates_updated_v1') || '',
  activeTab: 'dashboard',
  toast: null,

  setCurrency: (currency) => {
    localStorage.setItem('ss_print_currency_v6', currency);
    set({ currency });
  },

  setExchangeRates: (exchangeRates) => {
    localStorage.setItem('ss_print_rates_v1', JSON.stringify(exchangeRates));
    set({ exchangeRates });
  },

  updateExchangeRate: (code, side, rate) => {
    const num = Math.max(1, Math.round(Number(rate) || 0));
    set((state) => {
      const current = state.exchangeRates[code] || { buy: 1, sell: 1 };
      const updatedRates = {
        ...state.exchangeRates,
        [code]: { ...current, [side]: num },
      };
      const now = new Date().toISOString();
      localStorage.setItem('ss_print_rates_v1', JSON.stringify(updatedRates));
      localStorage.setItem('ss_print_rates_updated_v1', now);
      return { exchangeRates: updatedRates, ratesUpdatedAt: now };
    });
  },

  setRateMode: (rateMode) => {
    localStorage.setItem('ss_print_rate_mode_v1', rateMode);
    set({ rateMode });
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  showToast: (message, type = 'success') => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
}));
