import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToastStore } from '@/shared/ui/Toast';
import {
  catalogApi,
  catalogKeys,
  type CategoryInput,
} from '../api/catalogApi';

export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: () => catalogApi.listCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (input: CategoryInput) => catalogApi.createCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.categories() });
      showToast('Category saved');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
      catalogApi.updateCategory(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.categories() });
      showToast('Category updated');
    },
  });
}
