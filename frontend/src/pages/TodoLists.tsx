import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import TodoListFormModal from '../components/todo-lists/TodoListFormModal';
import { TodoListEditModal } from '../components/TodoListEditModal';
import { todoApiService, TodoListListItem, CreateTodoListRequest, UpdateTodoListRequest } from '../services/todoApi';
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

const TodoLists: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingList, setEditingList] = useState<TodoListListItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [todoLists, setTodoLists] = useState<TodoListListItem[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredTodoLists = todoLists.filter(list =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate favorites and non-favorites
  const favoriteLists = filteredTodoLists.filter(list => list.is_favorite);
  const regularLists = filteredTodoLists.filter(list => !list.is_favorite);

  const fetchTodoLists = useCallback(async () => {
    setIsLoadingLists(true);
    setError(null);
    try {
      const response = await todoApiService.getTodoLists({
        search: searchTerm,
        ordering: '-updated_at'
      });
      setTodoLists(response.data.results);
    } catch (error: any) {
      console.error('Error fetching todo lists:', error);
      setError('Failed to load todo lists. Please try again.');
    } finally {
      setIsLoadingLists(false);
    }
  }, [searchTerm]);

  // Fetch todo lists on component mount
  useEffect(() => {
    fetchTodoLists();
  }, [fetchTodoLists]);

  // Refetch when search term changes
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchTerm.trim() || searchTerm === '') {
        fetchTodoLists();
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, fetchTodoLists]);

  const getCompletionPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const handleCreateList = () => {
    setShowCreateModal(true);
  };

  const handleEditList = (listId: string) => {
    const list = todoLists.find(l => l.id === listId);
    if (list) {
      setEditingList(list);
      setShowEditModal(true);
    }
  };

  const handleToggleFavorite = async (listId: string) => {
    try {
      const list = todoLists.find(l => l.id === listId);
      if (!list) return;

      const updateData: UpdateTodoListRequest = {
        is_favorite: !list.is_favorite
      };
      const response = await todoApiService.updateTodoList(listId, updateData);
      
      // Update the list in state
      setTodoLists(prev => prev.map(l => 
        l.id === listId 
          ? { ...l, is_favorite: !l.is_favorite }
          : l
      ));
    } catch (error: any) {
      console.error('Error updating favorite:', error);
      setError('Failed to update favorite. Please try again.');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!window.confirm('Are you sure you want to delete this todo list? This action cannot be undone.')) {
      return;
    }

    try {
      await todoApiService.deleteTodoList(listId);
      setTodoLists(prev => prev.filter(list => list.id !== listId));
    } catch (error: any) {
      console.error('Error deleting todo list:', error);
      setError('Failed to delete todo list. Please try again.');
    }
  };

  const handleSaveList = async (listData: any) => {
    setIsLoading(true);
    try {
      if (editingList?.id) {
        // Update existing list
        const updateData: UpdateTodoListRequest = {
          name: listData.name,
          description: listData.description,
          color: listData.color,
          deadline: listData.deadline
        };
        const response = await todoApiService.updateTodoList(editingList.id, updateData);
        
        // Update the list in state
        setTodoLists(prev => prev.map(list => 
          list.id === editingList.id 
            ? { ...list, ...response.data }
            : list
        ));
      } else {
        // Create new list
        const createData: CreateTodoListRequest = {
          name: listData.name,
          description: listData.description,
          color: listData.color,
          deadline: listData.deadline
        };
        const response = await todoApiService.createTodoList(createData);
        
        // Add the new list to state
        setTodoLists(prev => [response.data, ...prev]);
      }
      
      // Close modals
      setShowCreateModal(false);
      setEditingList(null);
    } catch (error: any) {
      console.error('Error saving list:', error);
      setError('Failed to save todo list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSave = async (listData: any) => {
    if (!editingList) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateTodoListRequest = {
        name: listData.name,
        description: listData.description,
        color: listData.color,
        deadline: listData.deadline
      };
      const response = await todoApiService.updateTodoList(editingList.id, updateData);
      
      // Update the list in state
      setTodoLists(prev => prev.map(list => 
        list.id === editingList.id 
          ? { ...list, ...response.data }
          : list
      ));
      
      // Close modal
      setShowEditModal(false);
      setEditingList(null);
    } catch (error: any) {
      console.error('Error updating list:', error);
      throw error; // Re-throw to let modal handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (!isLoading) {
      setShowCreateModal(false);
      setShowEditModal(false);
      setEditingList(null);
    }
  };

  const renderListCard = (list: TodoListListItem) => {
    const completionPercentage = getCompletionPercentage(list.completed_tasks || 0, list.task_count || 0);
    
    return (
      <Card key={list.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: list.color }}
              />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg truncate">
                  <Link 
                    to={`/todo-lists/${list.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {list.name}
                  </Link>
                </CardTitle>
                {list.description && (
                  <CardDescription className="line-clamp-2">
                    {list.description}
                  </CardDescription>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleToggleFavorite(list.id)}>
                  <Star className="mr-2 h-4 w-4" />
                  {list.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditList(list.id)}>
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
                  onClick={() => handleDeleteList(list.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Task Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{list.completed_tasks || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Circle className="h-4 w-4 text-gray-400" />
                  <span>{(list.task_count || 0) - (list.completed_tasks || 0)}</span>
                </div>
              </div>
              <span className="font-medium">{completionPercentage}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(completionPercentage)}`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {/* Deadline */}
            {list.deadline && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Due: {new Date(list.deadline).toLocaleDateString()}</span>
              </div>
            )}

            {/* Last Updated */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>Updated {new Date(list.updated_at).toLocaleDateString()}</span>
              </div>
              <span>{list.task_count} {list.task_count === 1 ? 'task' : 'tasks'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Todo Lists</h1>
            <p className="text-muted-foreground">
              Organize your tasks with custom lists
            </p>
          </div>
          <Button onClick={handleCreateList}>
            <Plus className="mr-2 h-4 w-4" />
            Create List
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTodoLists}
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
              className="pl-10"
              disabled={isLoadingLists}
            />
          </div>
        </div>

        {/* Todo Lists Grid */}
        {isLoadingLists ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading todo lists...</span>
            </div>
          </div>
        ) : filteredTodoLists.length > 0 ? (
          <div className="space-y-8">
            {/* Favorites Section */}
            {favoriteLists.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-2 fill-yellow-500" />
                  Favorites ({favoriteLists.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteLists.map(renderListCard)}
                </div>
              </div>
            )}

            {/* All Other Lists Section */}
            {regularLists.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  All Lists ({regularLists.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularLists.map(renderListCard)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'No lists found' : 'No todo lists yet'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {searchTerm 
                ? `No lists match "${searchTerm}". Try a different search term.`
                : 'Get started by creating your first todo list to organize your tasks.'
              }
            </p>
            {!searchTerm && (
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
          isLoading={isLoading}
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