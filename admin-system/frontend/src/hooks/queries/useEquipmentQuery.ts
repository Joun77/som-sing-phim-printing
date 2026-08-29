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
 * Fetch all equipment and machinery
 */
export function useEquipmentQuery() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const res = await fetch('/api/v1/equipment', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        // Fallback for mock/local
        const local = localStorage.getItem('somsing_equipment_v1');
        return local ? JSON.parse(local) : [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : data.data || [];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Equipment mutations (Create, Update, Meter Log, Maintenance)
 */
export function useEquipmentMutations() {
  const queryClient = useQueryClient();

  const updateEquipment = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/v1/equipment/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Failed to update equipment');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });

  return {
    updateEquipment,
  };
}
