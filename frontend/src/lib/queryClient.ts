import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // GC time - data kept in cache for 10 minutes after going stale
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: false,
      // Background refetch interval - 5 minutes
      refetchInterval: 5 * 60 * 1000,
      // Only refetch in background if window is focused
      refetchIntervalInBackground: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});