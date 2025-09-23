import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import TodoListFormModal from '../components/todo-lists/TodoListFormModal';
import { TodoListEditModal } from '../components/TodoListEditModal';
import { TodoListListItem, CreateTodoListRequest, UpdateTodoListRequest } from '../services/todoApi';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Calendar,
  CheckCircle2,
  Circle,
  Users,
  Loader2,
  AlertCircle,
  Star
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { 
  useTodoListsQuery, 
  useCreateTodoListMutation, 
  useUpdateTodoListMutation, 
  useDeleteTodoListMutation,
  usePrefetchTodoLists
} from '../hooks/useTodoListsQuery';
import { useDebounce } from '../hooks/useDebounce';

// Memoized list card component to prevent unnecessary re-renders
const TodoListCard = React.memo(({ 
  list, 
  onEdit, 
  onDelete, 
  onToggleFavorite 
}: {
  list: TodoListListItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) => {
  const getCompletionPercentage = useCallback((completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, []);

  const getProgressColor = useCallback((percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  }, []);

  const completionPercentage = useMemo(() => 
    getCompletionPercentage(list.completed_tasks || 0, list.task_count || 0), 
    [list.completed_tasks, list.task_count, getCompletionPercentage]
  );

  const progressColor = useMemo(() => 
    getProgressColor(completionPercentage), 
    [completionPercentage, getProgressColor]
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          {/* Top row: Color indicator, title and favorite/menu */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: list.color }}
              />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg leading-tight">
                  <Link 
                    to={`/todo-lists/${list.id}`}
                    className="hover:text-primary transition-colors break-words"
                  >
                    {list.name}
                  </Link>
                </CardTitle>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 flex-shrink-0">
              {list.is_favorite && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onToggleFavorite(list.id)}>
                    <Star className="mr-2 h-4 w-4" />
                    {list.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(list.id)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/todo-lists/${list.id}`}>
                      <Users className="mr-2 h-4 w-4" />
                      View Tasks
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(list.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Description row */}
          {list.description && (
            <CardDescription className="text-sm leading-relaxed">
              {list.description.length > 120 
                ? `${list.description.substring(0, 120)}...` 
                : list.description
              }
            </CardDescription>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Task Stats and Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{list.completed_tasks || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Circle className="h-4 w-4 text-gray-400" />
                  <span>{(list.task_count || 0) - (list.completed_tasks || 0)}</span>
                </div>
              </div>
              <span className="font-semibold text-base">{completionPercentage}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Meta Information */}
          <div className="space-y-1">
            {/* Deadline */}
            {list.deadline && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span>Due: {new Date(list.deadline).toLocaleDateString()}</span>
              </div>
            )}

            {/* Last Updated and Task Count */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Updated {new Date(list.updated_at).toLocaleDateString()}</span>
              <span className="font-medium">{list.task_count} {list.task_count === 1 ? 'task' : 'tasks'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TodoListCard.displayName = 'TodoListCard';

const TodoLists: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingList, setEditingList] = useState<TodoListListItem | null>(null);

  // Debounce search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // React Query hooks with caching and background refetching
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useTodoListsQuery({
    search: debouncedSearchTerm,
    ordering: '-updated_at'
  });

  const createMutation = useCreateTodoListMutation();
  const updateMutation = useUpdateTodoListMutation();
  const deleteMutation = useDeleteTodoListMutation();
  const { prefetchTodoLists } = usePrefetchTodoLists();

  const todoLists = data?.results || [];

  // Memoized filtered lists to prevent unnecessary recalculations
  const { favoriteLists, regularLists } = useMemo(() => {
    // Filter is now done on server-side via search, but we still separate favorites
    const favorites = todoLists.filter(list => list.is_favorite);
    const regular = todoLists.filter(list => !list.is_favorite);
    return { favoriteLists: favorites, regularLists: regular };
  }, [todoLists]);

  // Optimized handlers with useCallback to prevent re-renders
  const handleCreateList = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleEditList = useCallback((listId: string) => {
    const list = todoLists.find(l => l.id === listId);
    if (list) {
      setEditingList(list);
      setShowEditModal(true);
    }
  }, [todoLists]);

  const handleToggleFavorite = useCallback(async (listId: string) => {
    const list = todoLists.find(l => l.id === listId);
    if (!list) return;

    // Optimistic update with React Query
    updateMutation.mutate({
      id: listId,
      data: { is_favorite: !list.is_favorite }
    });
  }, [todoLists, updateMutation]);

  const handleDeleteList = useCallback(async (listId: string) => {
    if (!window.confirm('Are you sure you want to delete this todo list? This action cannot be undone.')) {
      return;
    }

    deleteMutation.mutate(listId);
  }, [deleteMutation]);

  const handleSaveList = useCallback(async (listData: any) => {
    try {
      if (editingList?.id) {
        // Update existing list
        await updateMutation.mutateAsync({
          id: editingList.id,
          data: {
            name: listData.name,
            description: listData.description,
            color: listData.color,
            deadline: listData.deadline
          }
        });
      } else {
        // Create new list
        await createMutation.mutateAsync({
          name: listData.name,
          description: listData.description,
          color: listData.color,
          deadline: listData.deadline
        });
      }
      
      // Close modals
      setShowCreateModal(false);
      setShowEditModal(false);
      setEditingList(null);
    } catch (error) {
      // Error handling is done by React Query
      console.error('Error saving list:', error);
    }
  }, [editingList, createMutation, updateMutation]);

  const handleEditSave = useCallback(async (listData: any) => {
    if (!editingList) return;
    
    try {
      await updateMutation.mutateAsync({
        id: editingList.id,
        data: {
          name: listData.name,
          description: listData.description,
          color: listData.color,
          deadline: listData.deadline
        }
      });
      
      // Close modal
      setShowEditModal(false);
      setEditingList(null);
    } catch (error) {
      // Re-throw to let modal handle the error
      throw error;
    }
  }, [editingList, updateMutation]);

  const handleCloseModal = useCallback(() => {
    if (!createMutation.isPending && !updateMutation.isPending) {
      setShowCreateModal(false);
      setShowEditModal(false);
      setEditingList(null);
    }
  }, [createMutation.isPending, updateMutation.isPending]);

  // Prefetch related data on hover
  const handlePrefetchList = useCallback((listId: string) => {
    prefetchTodoLists();
  }, [prefetchTodoLists]);

  // Memoized list sections to prevent unnecessary re-renders
  const favoritesSection = useMemo(() => {
    if (favoriteLists.length === 0) return null;

    return (
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Star className="h-5 w-5 text-yellow-500 mr-2 fill-yellow-500" />
          Favorites ({favoriteLists.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {favoriteLists.map(list => (
            <div key={list.id} onMouseEnter={() => handlePrefetchList(list.id)}>
              <TodoListCard 
                list={list}
                onEdit={handleEditList}
                onDelete={handleDeleteList}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }, [favoriteLists, handleEditList, handleDeleteList, handleToggleFavorite, handlePrefetchList]);

  const regularSection = useMemo(() => {
    if (regularLists.length === 0) return null;

    return (
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          All Lists ({regularLists.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {regularLists.map(list => (
            <div key={list.id} onMouseEnter={() => handlePrefetchList(list.id)}>
              <TodoListCard 
                list={list}
                onEdit={handleEditList}
                onDelete={handleDeleteList}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }, [regularLists, handleEditList, handleDeleteList, handleToggleFavorite, handlePrefetchList]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Todo Lists</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Organize your tasks with custom lists
            </p>
          </div>
          <Button onClick={handleCreateList} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create List
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load todo lists. Please try again.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search todo lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 sm:h-9"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Todo Lists Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading todo lists...</span>
            </div>
          </div>
        ) : todoLists.length > 0 ? (
          <div className="space-y-8">
            {favoritesSection}
            {regularSection}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {debouncedSearchTerm ? 'No lists found' : 'No todo lists yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {debouncedSearchTerm 
                ? `No lists match "${debouncedSearchTerm}". Try a different search term.`
                : 'Get started by creating your first todo list to organize your tasks.'
              }
            </p>
            {!debouncedSearchTerm && (
              <Button onClick={handleCreateList}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First List
              </Button>
            )}
          </div>
        )}

        {/* Modals */}
        <TodoListFormModal
          isOpen={showCreateModal}
          onClose={handleCloseModal}
          onSave={handleSaveList}
          isLoading={createMutation.isPending}
        />

        {editingList && (
          <TodoListEditModal
            isOpen={showEditModal}
            onClose={handleCloseModal}
            todoList={editingList}
            onSave={handleEditSave}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default TodoLists;