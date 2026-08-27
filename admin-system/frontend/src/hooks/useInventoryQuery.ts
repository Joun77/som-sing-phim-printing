import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@store/useAuthStore';

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export function useInventoryItems() {
  return useQuery({
    queryKey: ['inventory', 'items'],
    queryFn: async () => {
      let res = await fetch('/api/inventory/items', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        res = await fetch('/api/inventory', {
          headers: getAuthHeaders(),
        });
      }
      if (!res.ok) {
        throw new Error('Failed to fetch inventory items');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 30,
  });
}

export function useInventoryBatches() {
  return useQuery({
    queryKey: ['inventory', 'batches'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/batches', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch inventory batches');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 30,
  });
}

export function useInboundHistory() {
  return useQuery({
    queryKey: ['inbound', 'history'],
    queryFn: async () => {
      const res = await fetch('/api/inbound', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch inbound history');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 30,
  });
}

export function useOffcuts() {
  return useQuery({
    queryKey: ['inventory', 'offcuts'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/offcuts', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch offcuts scrap inventory');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 30,
  });
}

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const res = await fetch('/api/equipment', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch equipment list');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60,
  });
}

export function useSaveInventorySKU() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save inventory SKU' }));
        throw new Error(err.error || 'Failed to save inventory SKU');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCreateInboundTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/inbound', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to record inbound transaction' }));
        throw new Error(err.error || 'Failed to record inbound transaction');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inbound'] });
    },
  });
}
