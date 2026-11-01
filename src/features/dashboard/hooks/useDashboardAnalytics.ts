import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { dashboardApi, type DashboardAnalytics } from '../api/dashboardApi';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  analytics: (userId?: string | null) => [...dashboardKeys.all, 'analytics', userId ?? 'anonymous'] as const,
};

export function useDashboardAnalytics() {
  const userId = useAuthStore((s) => s.userId);
  return useQuery<DashboardAnalytics>({
    queryKey: dashboardKeys.analytics(userId),
    queryFn: () => dashboardApi.getAnalytics(),
    staleTime: 5_000,
  });
}
