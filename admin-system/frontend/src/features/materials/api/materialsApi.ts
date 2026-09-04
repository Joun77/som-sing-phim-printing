import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ProductMaterial,
  CreateMaterialInput,
  ProductFAQ,
  CreateFAQInput,
  MaterialCategory,
  CreateMaterialCategoryInput,
} from '../types';

const API = '/api/v1';

// ---- Materials ----

async function fetchMaterialsAdmin(): Promise<ProductMaterial[]> {
  const res = await fetch(`${API}/materials`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch materials');
  return json.data ?? [];
}

export function useMaterials() {
  return useQuery({ queryKey: ['admin-materials'], queryFn: fetchMaterialsAdmin });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMaterialInput) => {
      const res = await fetch(`${API}/admin/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create material');
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-materials'] }),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProductMaterial }) => {
      const res = await fetch(`${API}/admin/materials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update material');
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-materials'] }),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/admin/materials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-materials'] }),
  });
}

export function useReorderMaterials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      const res = await fetch(`${API}/admin/materials/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!res.ok) throw new Error('Reorder failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-materials'] }),
  });
}

// ---- FAQs ----

async function fetchFAQsAdmin(): Promise<ProductFAQ[]> {
  const res = await fetch(`${API}/faqs`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch FAQs');
  return json.data ?? [];
}

export function useFAQs() {
  return useQuery({ queryKey: ['admin-faqs'], queryFn: fetchFAQsAdmin });
}

export function useCreateFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateFAQInput) => {
      const res = await fetch(`${API}/admin/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create FAQ');
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-faqs'] }),
  });
}

export function useUpdateFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProductFAQ }) => {
      const res = await fetch(`${API}/admin/faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update FAQ');
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-faqs'] }),
  });
}

export function useDeleteFAQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/admin/faqs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-faqs'] }),
  });
}

export function useReorderFAQs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      const res = await fetch(`${API}/admin/faqs/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!res.ok) throw new Error('Reorder failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-faqs'] }),
  });
}

// ---- Categories ----

async function fetchMaterialCategoriesAdmin(): Promise<MaterialCategory[]> {
  const res = await fetch(`${API}/admin/material-categories`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch categories');
  return json.data ?? [];
}

export function useMaterialCategories() {
  return useQuery({
    queryKey: ['admin-material-categories'],
    queryFn: fetchMaterialCategoriesAdmin,
  });
}

export function useCreateMaterialCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMaterialCategoryInput) => {
      const res = await fetch(`${API}/admin/material-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create category');
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-material-categories'] });
      qc.invalidateQueries({ queryKey: ['storefront-material-categories'] });
    },
  });
}

export function useUpdateMaterialCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: MaterialCategory }) => {
      const res = await fetch(`${API}/admin/material-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update category');
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-material-categories'] });
      qc.invalidateQueries({ queryKey: ['storefront-material-categories'] });
    },
  });
}

export function useDeleteMaterialCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/admin/material-categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-material-categories'] });
      qc.invalidateQueries({ queryKey: ['storefront-material-categories'] });
    },
  });
}

export function useReorderMaterialCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; sortOrder: number }[]) => {
      const res = await fetch(`${API}/admin/material-categories/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!res.ok) throw new Error('Reorder failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-material-categories'] });
      qc.invalidateQueries({ queryKey: ['storefront-material-categories'] });
    },
  });
}
