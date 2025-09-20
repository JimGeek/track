import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApiService, TodoListListItem, CreateTodoListRequest, UpdateTodoListRequest } from '../services/todoApi';

// Query keys for better cache management
export const todoListsQueryKeys = {
  all: ['todoLists'] as const,
  lists: () => [...todoListsQueryKeys.all, 'list'] as const,
  list: (id: string) => [...todoListsQueryKeys.lists(), id] as const,
  filtered: (filters: Record<string, any>) => [...todoListsQueryKeys.lists(), 'filtered', filters] as const,
};

// Custom hook for fetching todo lists with caching
export function useTodoListsQuery(params?: {
  search?: string;
  ordering?: string;
}) {
  return useQuery({
    queryKey: todoListsQueryKeys.filtered(params || {}),
    queryFn: async () => {
      const response = await todoApiService.getTodoLists({
        search: params?.search,
        ordering: params?.ordering || '-updated_at'
      });
      return response.data;
    },
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    staleTime: 2 * 60 * 1000, // 2 minutes for todo lists
  });
}

// Custom hook for fetching a single todo list
export function useTodoListQuery(id: string) {
  return useQuery({
    queryKey: todoListsQueryKeys.list(id),
    queryFn: async () => {
      const response = await todoApiService.getTodoList(id);
      return response.data;
    },
    enabled: !!id, // Only run if id is provided
  });
}

// Custom hook for creating todo lists with optimistic updates
export function useCreateTodoListMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTodoListRequest) => {
      const response = await todoApiService.createTodoList(data);
      return response.data;
    },
    onSuccess: (newList) => {
      // Invalidate and refetch todo lists
      queryClient.invalidateQueries({ queryKey: todoListsQueryKeys.lists() });
      
      // Optimistically add to all filtered queries
      queryClient.setQueriesData(
        { queryKey: todoListsQueryKeys.lists() },
        (oldData: any) => {
          if (oldData?.results) {
            return {
              ...oldData,
              results: [newList, ...oldData.results],
              count: oldData.count + 1
            };
          }
          return oldData;
        }
      );
    },
  });
}

// Custom hook for updating todo lists with optimistic updates
export function useUpdateTodoListMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTodoListRequest }) => {
      const response = await todoApiService.updateTodoList(id, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoListsQueryKeys.list(id) });
      await queryClient.cancelQueries({ queryKey: todoListsQueryKeys.lists() });

      // Snapshot previous values
      const previousList = queryClient.getQueryData(todoListsQueryKeys.list(id));
      const previousLists = queryClient.getQueriesData({ queryKey: todoListsQueryKeys.lists() });

      // Optimistically update single list
      if (previousList) {
        queryClient.setQueryData(todoListsQueryKeys.list(id), {
          ...previousList,
          ...data,
          updated_at: new Date().toISOString()
        });
      }

      // Optimistically update lists
      queryClient.setQueriesData(
        { queryKey: todoListsQueryKeys.lists() },
        (oldData: any) => {
          if (oldData?.results) {
            return {
              ...oldData,
              results: oldData.results.map((list: TodoListListItem) =>
                list.id === id ? { ...list, ...data, updated_at: new Date().toISOString() } : list
              )
            };
          }
          return oldData;
        }
      );

      return { previousList, previousLists };
    },
    onError: (err, { id }, context) => {
      // Rollback optimistic updates on error
      if (context?.previousList) {
        queryClient.setQueryData(todoListsQueryKeys.list(id), context.previousList);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success to ensure sync
      queryClient.invalidateQueries({ queryKey: todoListsQueryKeys.list(id) });
      queryClient.invalidateQueries({ queryKey: todoListsQueryKeys.lists() });
    },
  });
}

// Custom hook for deleting todo lists
export function useDeleteTodoListMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await todoApiService.deleteTodoList(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: todoListsQueryKeys.list(deletedId) });
      
      // Update lists by removing the deleted item
      queryClient.setQueriesData(
        { queryKey: todoListsQueryKeys.lists() },
        (oldData: any) => {
          if (oldData?.results) {
            return {
              ...oldData,
              results: oldData.results.filter((list: TodoListListItem) => list.id !== deletedId),
              count: Math.max(0, oldData.count - 1)
            };
          }
          return oldData;
        }
      );
    },
  });
}

// Background sync hook - prefetches data
export function usePrefetchTodoLists() {
  const queryClient = useQueryClient();

  const prefetchTodoLists = async (params?: { search?: string; ordering?: string }) => {
    await queryClient.prefetchQuery({
      queryKey: todoListsQueryKeys.filtered(params || {}),
      queryFn: async () => {
        const response = await todoApiService.getTodoLists({
          search: params?.search,
          ordering: params?.ordering || '-updated_at'
        });
        return response.data;
      },
      staleTime: 2 * 60 * 1000,
    });
  };

  return { prefetchTodoLists };
}