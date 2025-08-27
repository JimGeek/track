import React, { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from "../ui/button";
import { Task } from '../../services/todoApi';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar,
  Flag,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate?: (taskId: string, newStatus: Task['status']) => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onAddTask?: (status: Task['status']) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = memo(({
  tasks,
  onTaskUpdate,
  onTaskEdit,
  onTaskDelete,
  onAddTask
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const columns = [
    { 
      id: 'Todo', 
      title: 'To Do', 
      color: 'bg-gray-100 border-gray-200',
      tasks: tasks.filter(task => task.status === 'todo')
    },
    { 
      id: 'Ongoing', 
      title: 'In Progress', 
      color: 'bg-blue-50 border-blue-200',
      tasks: tasks.filter(task => task.status === 'ongoing')
    },
    { 
      id: 'Done', 
      title: 'Completed', 
      color: 'bg-green-50 border-green-200',
      tasks: tasks.filter(task => task.status === 'done')
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'text-red-700';
      case 'high': return 'text-orange-700';
      case 'medium': return 'text-blue-700';
      case 'low': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
    
    // Add some visual feedback
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the column entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    setDragOverColumn(null);
    setDraggedTaskId(null);
    
    // Only update if the status is actually different
    const draggedTask = tasks.find(task => task.id === taskId);
    if (draggedTask && draggedTask.status !== newStatus && onTaskUpdate) {
      onTaskUpdate(taskId, newStatus);
    }
  }, [tasks, onTaskUpdate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {columns.map((column) => (
        <div 
          key={column.id}
          className={`flex flex-col rounded-lg border-2 border-dashed ${column.color} min-h-[600px] transition-all duration-200 ${
            dragOverColumn === column.id 
              ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg' 
              : ''
          }`}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id as Task['status'])}
        >
          {/* Column Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {column.tasks.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTask && onAddTask(column.id as Task['status'])}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tasks */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {column.tasks.map((task) => (
              <Card
                key={task.id}
                className={`cursor-move hover:shadow-md transition-all duration-200 bg-background ${
                  draggedTaskId === task.id 
                    ? 'opacity-50 rotate-1 scale-95' 
                    : 'hover:scale-[1.02]'
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {task.title}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onTaskEdit && onTaskEdit(task.id)}>
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onTaskDelete && onTaskDelete(task.id)}
                          className="text-red-600"
                        >
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {task.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    {/* Priority Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                        <span className={`text-xs font-medium ${getPriorityTextColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Flag className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Due Date */}
                    {task.end_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className={`text-xs ${
                          new Date(task.end_date) < new Date() 
                            ? 'text-red-600 font-medium' 
                            : 'text-muted-foreground'
                        }`}>
                          {new Date(task.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State for Column */}
            {column.tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">No tasks in {column.title.toLowerCase()}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddTask && onAddTask(column.id as Task['status'])}
                  className="text-xs"
                >
                  Add a task
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

KanbanBoard.displayName = 'KanbanBoard';

export default KanbanBoard;