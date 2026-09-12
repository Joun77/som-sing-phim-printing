import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SystemLookup, CreateLookupInput, UpdateLookupInput } from '../types';

const API = '/api/v1';

// Fetch lookups from API
export async function fetchLookups(type?: string, activeOnly = false): Promise<SystemLookup[]> {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (activeOnly) params.append('active_only', 'true');

  const res = await fetch(`${API}/lookups?${params.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch system lookups');
  return json.data ?? [];
}

// Hook to query lookups by type with cache
export function useLookups(type?: string, activeOnly = true) {
  return useQuery({
    queryKey: ['system-lookups', type || 'all', activeOnly],
    queryFn: () => fetchLookups(type, activeOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
  });
}

// Create lookup mutation
export function useCreateLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLookupInput) => {
      const res = await fetch(`${API}/admin/lookups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to create lookup');
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-lookups'] });
    },
  });
}

// Update lookup mutation
export function useUpdateLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateLookupInput }) => {
      const res = await fetch(`${API}/admin/lookups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to update lookup');
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-lookups'] });
    },
  });
}

// Deactivate/Delete lookup mutation
export function useDeleteLookup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/admin/lookups/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to deactivate lookup');
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-lookups'] });
    },
  });
}
