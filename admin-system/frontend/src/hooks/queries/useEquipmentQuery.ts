import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '@utils/authHeaders';

/**
 * Fetch all equipment and machinery directly from PostgreSQL database
 */
export function useEquipmentQuery() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      let res = await fetch('/api/v1/equipment', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        res = await fetch('/api/equipment', {
          headers: getAuthHeaders(),
        });
      }
      if (!res.ok) {
        return [];
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
