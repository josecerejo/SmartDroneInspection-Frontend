import { api } from '@/shared/api/client';

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface CategoryInput {
  code: string;
  name: string;
  description?: string | null;
}

export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
};

export const catalogApi = {
  listCategories: () => api.get<Category[]>('/asset-categories').then((r) => r.data),

  createCategory: (input: CategoryInput) =>
    api.post<Category>('/asset-categories', input).then((r) => r.data),

  updateCategory: (id: string, input: CategoryInput) =>
    api.put<Category>(`/asset-categories/${id}`, input).then((r) => r.data),
};
