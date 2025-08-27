import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import KanbanBoard from '../components/views/KanbanBoard';
import GanttChart from '../components/views/GanttChart';
import TaskFormModal from '../components/tasks/TaskFormModal';
import { todoApiService, Task, TodoList, CreateTaskRequest, UpdateTaskRequest } from '../services/todoApi';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Calendar,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Filter,
  SortAsc,
  Clock,
  Flag,
  Grid3X3,
  BarChart3,
  List as ListIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

type ViewMode = 'list' | 'kanban' | 'gantt';

const TodoListDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created');
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<Task['status']>('todo');
  const [todoList, setTodoList] = useState<TodoList | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch todo list and tasks on component mount
  useEffect(() => {
    if (id) {
      fetchTodoList(id);
      fetchTasks(id);
    }
  }, [id]);

  const fetchTodoList = async (todoListId: string) => {
    setIsLoadingList(true);
    setError(null);
    try {
      const response = await todoApiService.getTodoList(todoListId);
      setTodoList(response.data);
    } catch (error: any) {
      console.error('Error fetching todo list:', error);
      setError('Failed to load todo list. Please try again.');
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchTasks = async (todoListId: string) => {
    setIsLoadingTasks(true);
    setError(null);
    try {
      const response = await todoApiService.getTasksByTodoList(todoListId, {
        search: searchTerm,
        ordering: getApiOrderingParam(sortBy)
      });
      setTasks(response.data.results);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Refetch tasks when search or sort changes
  useEffect(() => {
    if (id) {
      const debounceTimeout = setTimeout(() => {
        fetchTasks(id);
      }, 300);
      return () => clearTimeout(debounceTimeout);
    }
  }, [searchTerm, sortBy, id]);

  const getApiOrderingParam = (sortBy: string) => {
    switch (sortBy) {
      case 'priority':
        return '-priority';
      case 'status':
        return 'status';
      case 'title':
        return 'title';
      case 'dueDate':
        return 'end_date';
      default:
        return '-created_at';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return 'text-green-600 bg-green-50 border-green-200';
      case 'ongoing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'todo': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'all' || task.priority.toLowerCase() === filterPriority;
      const matchesStatus = filterStatus === 'all' || task.status.toLowerCase() === filterStatus;
      
      return matchesSearch && matchesPriority && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
          return (priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder] || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'dueDate':
          if (!a.end_date && !b.end_date) return 0;
          if (!a.end_date) return 1;
          if (!b.end_date) return -1;
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
        default: // created
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bDate - aDate;
      }
    });

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    ongoing: tasks.filter(t => t.status === 'ongoing').length,
    done: tasks.filter(t => t.status === 'done').length
  };

  const completionPercentage = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  const handleTaskStatusUpdate = async (taskId: string, newStatus: Task['status']) => {
    try {
      const response = await todoApiService.updateTaskStatus(taskId, newStatus);
      // Update task in local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error: any) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status. Please try again.');
    }
  };

  const handleTaskEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await todoApiService.deleteTask(taskId);
      // Remove task from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error: any) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  const handleAddTask = (status?: Task['status']) => {
    setCreateTaskStatus(status || 'todo');
    setShowCreateTaskModal(true);
  };

  const handleSaveTask = async (taskData: any) => {
    if (!id) return;
    
    setIsTaskLoading(true);
    try {
      if (editingTask?.id) {
        // Update existing task
        const updateData: UpdateTaskRequest = {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          start_date: taskData.startDate || undefined,
          end_date: taskData.endDate || undefined
        };
        const response = await todoApiService.updateTask(editingTask.id, updateData);
        
        // Update task in local state
        setTasks(prev => prev.map(task => 
          task.id === editingTask.id ? response.data : task
        ));
      } else {
        // Create new task
        const createData: CreateTaskRequest = {
          todo_list: id,
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          start_date: taskData.startDate || undefined,
          end_date: taskData.endDate || undefined
        };
        const response = await todoApiService.createTask(createData);
        
        // Add new task to local state
        setTasks(prev => [response.data, ...prev]);
      }
      
      // Close modals
      setShowCreateTaskModal(false);
      setEditingTask(null);
    } catch (error: any) {
      console.error('Error saving task:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setIsTaskLoading(false);
    }
  };

  const handleCloseTaskModal = () => {
    if (!isTaskLoading) {
      setShowCreateTaskModal(false);
      setEditingTask(null);
    }
  };

  if (isLoadingList || !todoList) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading todo list...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => id && fetchTasks(id)}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/todo-lists">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Lists
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div 
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: todoList.color }}
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{todoList.name}</h1>
                {todoList.description && (
                  <p className="text-muted-foreground">{todoList.description}</p>
                )}
              </div>
            </div>
            <Button onClick={() => handleAddTask()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{taskStats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{taskStats.ongoing}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{taskStats.done}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80"
                disabled={isLoadingTasks}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Priority
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterPriority('all')}>All Priorities</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('urgent')}>Urgent</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('high')}>High</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('medium')}>Medium</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPriority('low')}>Low</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SortAsc className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('created')}>Date Created</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('title')}>Title</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('priority')}>Priority</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('status')}>Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('dueDate')}>Due Date</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-8 px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'gantt' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('gantt')}
              className="h-8 px-3"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Mode Content */}
        {viewMode === 'list' ? (
          /* List View */
          isLoadingTasks ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading tasks...</span>
              </div>
            </div>
          ) : filteredAndSortedTasks.length > 0 ? (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="border-b bg-gray-50/50 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-700">
                  <div className="col-span-1">Status</div>
                  <div className="col-span-4">Task</div>
                  <div className="col-span-2">Priority</div>
                  <div className="col-span-2">Due Date</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>
              </div>
              
              {/* Task List */}
              <div className="divide-y">
                {filteredAndSortedTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    onClick={() => handleTaskEdit(task.id)}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Status Checkbox */}
                      <div className="col-span-1">
                        <button 
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newStatus = task.status === 'done' ? 'todo' : 'done';
                            handleTaskStatusUpdate(task.id, newStatus);
                          }}
                        >
                          {task.status === 'done' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      
                      {/* Task Details */}
                      <div className="col-span-4 min-w-0">
                        <h3 className={`font-medium text-gray-900 ${
                          task.status === 'done' ? 'line-through text-gray-500' : ''
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Priority */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          <Flag className="h-3 w-3 mr-1" />
                          {task.priority}
                        </span>
                      </div>
                      
                      {/* Due Date */}
                      <div className="col-span-2 text-sm text-gray-600">
                        {task.end_date ? (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(task.end_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">No due date</span>
                        )}
                      </div>
                      
                      {/* Created Date */}
                      <div className="col-span-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="col-span-1 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleTaskEdit(task.id);
                            }}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskDelete(task.id);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || filterPriority !== 'all' || filterStatus !== 'all' 
                  ? 'No tasks match your criteria' 
                  : 'No tasks yet'
                }
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchTerm || filterPriority !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters to find tasks.'
                  : 'Get started by adding your first task to this list.'
                }
              </p>
              <Button onClick={() => handleAddTask()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
          )
        ) : viewMode === 'kanban' ? (
          /* Kanban View */
          isLoadingTasks ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading tasks...</span>
              </div>
            </div>
          ) : (
            <KanbanBoard
              tasks={filteredAndSortedTasks}
              onTaskUpdate={handleTaskStatusUpdate}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onAddTask={handleAddTask}
            />
          )
        ) : (
          /* Gantt View */
          isLoadingTasks ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading tasks...</span>
              </div>
            </div>
          ) : (
            <GanttChart
              tasks={filteredAndSortedTasks}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
            />
          )
        )}

        {/* Task Modals */}
        <TaskFormModal
          isOpen={showCreateTaskModal}
          onClose={handleCloseTaskModal}
          onSave={handleSaveTask}
          isLoading={isTaskLoading}
          defaultStatus={createTaskStatus}
        />

        <TaskFormModal
          isOpen={!!editingTask}
          onClose={handleCloseTaskModal}
          onSave={handleSaveTask}
          task={editingTask}
          isLoading={isTaskLoading}
        />
      </div>
    </MainLayout>
  );
};

export default TodoListDetail;