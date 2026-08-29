import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/useAuthStore';

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Fetch Purchase Orders
 */
export function usePurchaseOrdersQuery() {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const res = await fetch('/api/v1/suppliers/po', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const local = localStorage.getItem('somsing_purchase_orders');
        return local ? JSON.parse(local) : [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : data.data || [];
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Fetch Supplier Price Comparisons
 */
export function useSupplierPricesQuery() {
  return useQuery({
    queryKey: ['supplier-prices'],
    queryFn: async () => {
      const res = await fetch('/api/v1/suppliers/prices', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const local = localStorage.getItem('somsing_supplier_prices');
        return local ? JSON.parse(local) : [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : data.data || [];
    },
    staleTime: 1000 * 60,
  });
}

/**
 * Purchase Order Mutations
 */
export function usePOMutations() {
  const queryClient = useQueryClient();

  const createPO = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/v1/suppliers/po', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Failed to create purchase order');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  return {
    createPO,
  };
}
