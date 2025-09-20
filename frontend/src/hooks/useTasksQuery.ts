import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApiService, Task, CreateTaskRequest, UpdateTaskRequest } from '../services/todoApi';

// Query keys for tasks
export const tasksQueryKeys = {
  all: ['tasks'] as const,
  lists: () => [...tasksQueryKeys.all, 'list'] as const,
  list: (id: string) => [...tasksQueryKeys.lists(), id] as const,
  filtered: (filters: Record<string, any>) => [...tasksQueryKeys.lists(), 'filtered', filters] as const,
  byTodoList: (todoListId: string) => [...tasksQueryKeys.all, 'todoList', todoListId] as const,
};

// Custom hook for fetching tasks
export function useTasksQuery(params?: {
  todo_list?: string;
  status?: string;
  priority?: string;
  search?: string;
  ordering?: string;
  start_date?: string;
  end_date?: string;
  is_overdue?: boolean;
}) {
  return useQuery({
    queryKey: tasksQueryKeys.filtered(params || {}),
    queryFn: async () => {
      const response = await todoApiService.getTasks(params);
      return response.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000, // 30 seconds for tasks (more frequent updates)
  });
}

// Custom hook for fetching tasks by todo list
export function useTasksByTodoListQuery(todoListId: string, params?: {
  status?: string;
  priority?: string;
  search?: string;
  ordering?: string;
}) {
  return useQuery({
    queryKey: tasksQueryKeys.byTodoList(todoListId),
    queryFn: async () => {
      const response = await todoApiService.getTasksByTodoList(todoListId, params);
      return response.data;
    },
    enabled: !!todoListId,
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

// Custom hook for creating tasks with optimistic updates
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskRequest) => {
      const response = await todoApiService.createTask(data);
      return response.data;
    },
    onSuccess: (newTask) => {
      // Invalidate tasks queries
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.byTodoList(newTask.todo_list) });
      
      // Also invalidate todo lists to update task counts
      queryClient.invalidateQueries({ queryKey: ['todoLists'] });
    },
  });
}

// Custom hook for updating tasks with optimistic updates
export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskRequest }) => {
      const response = await todoApiService.updateTask(id, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tasksQueryKeys.list(id) });
      await queryClient.cancelQueries({ queryKey: tasksQueryKeys.lists() });

      // Snapshot previous values
      const previousTask = queryClient.getQueryData(tasksQueryKeys.list(id));
      const previousTasks = queryClient.getQueriesData({ queryKey: tasksQueryKeys.lists() });

      // Optimistically update task
      if (previousTask) {
        queryClient.setQueryData(tasksQueryKeys.list(id), {
          ...previousTask,
          ...data,
          updated_at: new Date().toISOString()
        });
      }

      // Optimistically update task lists
      queryClient.setQueriesData(
        { queryKey: tasksQueryKeys.lists() },
        (oldData: any) => {
          if (oldData?.results) {
            return {
              ...oldData,
              results: oldData.results.map((task: Task) =>
                task.id === id ? { ...task, ...data, updated_at: new Date().toISOString() } : task
              )
            };
          }
          return oldData;
        }
      );

      return { previousTask, previousTasks };
    },
    onError: (err, { id }, context) => {
      // Rollback optimistic updates on error
      if (context?.previousTask) {
        queryClient.setQueryData(tasksQueryKeys.list(id), context.previousTask);
      }
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.list(id) });
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.lists() });
      
      // Update todo list counts
      if (data) {
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.byTodoList(data.todo_list) });
        queryClient.invalidateQueries({ queryKey: ['todoLists'] });
      }
    },
  });
}

// Custom hook for updating task status with optimistic updates
export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'todo' | 'ongoing' | 'done' }) => {
      const response = await todoApiService.updateTaskStatus(id, status);
      return response.data;
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tasksQueryKeys.list(id) });
      await queryClient.cancelQueries({ queryKey: tasksQueryKeys.lists() });

      // Snapshot previous values
      const previousTask = queryClient.getQueryData(tasksQueryKeys.list(id));
      const previousTasks = queryClient.getQueriesData({ queryKey: tasksQueryKeys.lists() });

      // Optimistically update task status
      if (previousTask) {
        queryClient.setQueryData(tasksQueryKeys.list(id), {
          ...previousTask,
          status,
          updated_at: new Date().toISOString()
        });
      }

      // Optimistically update task lists
      queryClient.setQueriesData(
        { queryKey: tasksQueryKeys.lists() },
        (oldData: any) => {
          if (oldData?.results) {
            return {
              ...oldData,
              results: oldData.results.map((task: Task) =>
                task.id === id ? { ...task, status, updated_at: new Date().toISOString() } : task
              )
            };
          }
          return oldData;
        }
      );

      return { previousTask, previousTasks };
    },
    onError: (err, { id }, context) => {
      // Rollback optimistic updates on error
      if (context?.previousTask) {
        queryClient.setQueryData(tasksQueryKeys.list(id), context.previousTask);
      }
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.list(id) });
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.lists() });
      
      // Update todo list counts and task lists
      if (data) {
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.byTodoList(data.todo_list) });
        queryClient.invalidateQueries({ queryKey: ['todoLists'] });
      }
    },
  });
}

// Custom hook for deleting tasks
export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await todoApiService.deleteTask(id);
      return id;
    },
    onSuccess: (deletedId, variables) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: tasksQueryKeys.list(deletedId) });
      
      // Update task lists by removing the deleted item
      queryClient.setQueriesData(
        { queryKey: tasksQueryKeys.lists() },
        (oldData: any) => {
          if (oldData?.results) {
            return {
              ...oldData,
              results: oldData.results.filter((task: Task) => task.id !== deletedId),
              count: Math.max(0, oldData.count - 1)
            };
          }
          return oldData;
        }
      );

      // Invalidate todo lists to update counts
      queryClient.invalidateQueries({ queryKey: ['todoLists'] });
    },
  });
}

// Bulk operations
export function useBulkUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskIds, status }: { taskIds: string[]; status: 'Todo' | 'Ongoing' | 'Done' }) => {
      const response = await todoApiService.bulkUpdateTaskStatus(taskIds, status);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all task queries after bulk operations
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['todoLists'] });
    },
  });
}

export function useBulkDeleteTasksMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskIds: string[]) => {
      const response = await todoApiService.bulkDeleteTasks(taskIds);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all task queries after bulk operations
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['todoLists'] });
    },
  });
}