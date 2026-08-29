import { useQuery } from '@tanstack/react-query';

export interface ExchangeRates {
  LAK: number;
  THB: number;
  USD: number;
  CNY: number;
  lastUpdated?: string;
}

const DEFAULT_RATES: ExchangeRates = {
  LAK: 678,
  THB: 1,
  USD: 0.029,
  CNY: 0.21,
};

/**
 * Fetch live multi-currency exchange rates with 5-minute background caching
 */
export function useExchangeRatesQuery() {
  return useQuery<ExchangeRates>({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/v1/public/exchange-rates');
        if (res.ok) {
          const data = await res.json();
          return data.rates || data;
        }
      } catch (err) {
        console.warn('Using fallback exchange rates:', err);
      }
      return DEFAULT_RATES;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
