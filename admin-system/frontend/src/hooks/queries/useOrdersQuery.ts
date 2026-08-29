import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/useAuthStore';
import { Order } from '../../features/orders/types';

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Fetch all orders with 30s fresh staleTime and background sync
 */
export function useOrdersQuery() {
  return useQuery<Order[]>({
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
    staleTime: 1000 * 30,
  });
}

/**
 * Fetch single order by Order ID or Order No
 */
export function useOrderDetailsQuery(orderId?: string) {
  return useQuery<Order | null>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      let res = await fetch(`/api/v1/orders/${encodeURIComponent(orderId)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          headers: getAuthHeaders(),
        });
      }
      if (!res.ok) {
        throw new Error(`Order ${orderId} not found`);
      }
      const data = await res.json();
      return data;
    },
    enabled: Boolean(orderId),
  });
}

/**
 * Order Mutations (Create, Update Status, Update Deposit, Approve Proof)
 */
export function useOrderMutations() {
  const queryClient = useQueryClient();

  const createOrder = useMutation({
    mutationFn: async (payload: Partial<Order>) => {
      let res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        res = await fetch('/api/orders', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
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

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      let res = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        res = await fetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status }),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update order status' }));
        throw new Error(err.error || 'Failed to update order status');
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const recordDeposit = useMutation({
    mutationFn: async ({ orderId, amount, note }: { orderId: string; amount: number; note?: string }) => {
      const res = await fetch(`/api/v1/orders/${orderId}/deposit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, note }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to record deposit' }));
        throw new Error(err.error || 'Failed to record deposit');
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });

  const approveProof = useMutation({
    mutationFn: async ({ orderId, approvedBy }: { orderId: string; approvedBy?: string }) => {
      const res = await fetch(`/api/v1/orders/${orderId}/proof/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ approved_by: approvedBy || 'Staff' }),
      });
      if (!res.ok) {
        throw new Error('Failed to approve proof');
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
  });

  return {
    createOrder,
    updateStatus,
    recordDeposit,
    approveProof,
  };
}
