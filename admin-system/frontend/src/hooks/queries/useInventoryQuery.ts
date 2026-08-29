import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchMaterials, 
  fetchInboundHistory, 
  createInbound, 
  cancelInbound, 
  updateMaterial, 
  fetchInkBottles, 
  deductInkBottle 
} from '../../features/inventory/api/inventoryApi';
import { 
  MaterialMaster, 
  CreateInboundPayload, 
  CancelInboundPayload, 
  DeductInkBottlePayload 
} from '../../features/inventory/types';

/**
 * Fetch all master inventory materials
 */
export function useMaterialsQuery() {
  return useQuery<MaterialMaster[]>({
    queryKey: ['materials'],
    queryFn: fetchMaterials,
    staleTime: 1000 * 30, // 30s fresh cache
  });
}

/**
 * Fetch stock inbound transaction history
 */
export function useInboundHistoryQuery() {
  return useQuery({
    queryKey: ['inbound-history'],
    queryFn: fetchInboundHistory,
    staleTime: 1000 * 30,
  });
}

/**
 * Fetch ink bottles inventory
 */
export function useInkBottlesQuery() {
  return useQuery({
    queryKey: ['ink-bottles'],
    queryFn: fetchInkBottles,
    staleTime: 1000 * 30,
  });
}

/**
 * Inventory Mutations (Inbound, Cancel Inbound, Direct Edit, Deduct Ink)
 */
export function useInventoryMutations() {
  const queryClient = useQueryClient();

  const inboundMutation = useMutation({
    mutationFn: (payload: CreateInboundPayload) => createInbound(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inbound-history'] });
    },
  });

  const cancelInboundMutation = useMutation({
    mutationFn: (payload: CancelInboundPayload) => cancelInbound(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inbound-history'] });
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<MaterialMaster> }) => 
      updateMaterial(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const deductInkMutation = useMutation({
    mutationFn: (payload: DeductInkBottlePayload) => deductInkBottle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ink-bottles'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  return {
    inboundMutation,
    cancelInboundMutation,
    updateMaterialMutation,
    deductInkMutation,
  };
}
