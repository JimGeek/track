// Basic types for the Track application

export interface TodoList {
  id: string;
  name: string;
  description?: string;
  color: string;
  deadline?: string;
  task_count: number;
  completed_tasks: number;
  progress_percentage: number;
  overdue_count: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'ongoing' | 'done';
  start_date?: string;
  end_date?: string;
  todo_list: string;
  todo_list_name?: string;
  is_overdue: boolean;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}