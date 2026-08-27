import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/useAuthStore';

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      let res = await fetch('/api/v1/orders', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        res = await fetch('/api/orders', {
          headers: getAuthHeaders(),
        });
      }
      if (!res.ok) {
        throw new Error('Failed to fetch orders from server');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 30, // 30 seconds fresh cache
  });
}

export function useOrderByNo(orderNo?: string) {
  return useQuery({
    queryKey: ['order', orderNo],
    queryFn: async () => {
      if (!orderNo) return null;
      const res = await fetch(`/api/v1/orders/track/${encodeURIComponent(orderNo)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Order ${orderNo} not found`);
      }
      return await res.json();
    },
    enabled: Boolean(orderNo),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderPayload: any) => {
      let res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderPayload),
      });
      if (!res.ok) {
        res = await fetch('/api/orders', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(orderPayload),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create order' }));
        throw new Error(err.error || 'Failed to create order');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      let res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update order status' }));
        throw new Error(err.error || 'Failed to update order status');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateOrderItemStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, step, waste_sheets }: { itemId: string; step: string; waste_sheets?: number }) => {
      const res = await fetch(`/api/v1/orders/items/${itemId}/step`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ step, waste_sheets: waste_sheets || 0 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update step' }));
        throw new Error(err.error || 'Failed to update step');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['spoilage'] });
    },
  });
}

export function useRecordDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, deposit_lak }: { orderId: string; deposit_lak: number }) => {
      const res = await fetch(`/api/orders/${orderId}/deposit`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deposit_lak }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to record deposit' }));
        throw new Error(err.error || 'Failed to record deposit');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}

export function useApproveQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quotationId: string) => {
      const res = await fetch(`/api/v1/quotations/${quotationId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to approve quotation' }));
        throw new Error(err.error || 'Failed to approve quotation');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}

export function useRejectQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quotationId: string) => {
      const res = await fetch(`/api/v1/quotations/${quotationId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to reject quotation' }));
        throw new Error(err.error || 'Failed to reject quotation');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });
}
