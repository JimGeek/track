import React, { useState, useMemo, memo, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from "../ui/button";
import { Badge } from '../ui/badge';
import { Task } from '../../services/todoApi';
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface GanttChartProps {
  tasks: Task[];
  onTaskEdit?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
}

const GanttChart: React.FC<GanttChartProps> = memo(({
  tasks,
  onTaskEdit,
  onTaskDelete
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');

  // Generate date range for the current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { start: weekStart, end: weekEnd };
    }
    
    return { start, end };
  }, [currentDate, viewMode]);

  // Generate date columns
  const dateColumns = useMemo(() => {
    const columns = [];
    const current = new Date(dateRange.start);
    
    while (current <= dateRange.end) {
      columns.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return columns;
  }, [dateRange]);

  // Filter tasks that have dates within our range
  const visibleTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.start_date && !task.end_date) return false;
      
      const taskStart = task.start_date ? new Date(task.start_date) : dateRange.start;
      const taskEnd = task.end_date ? new Date(task.end_date) : dateRange.end;
      
      return taskStart <= dateRange.end && taskEnd >= dateRange.start;
    });
  }, [tasks, dateRange]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return 'bg-green-600';
      case 'ongoing': return 'bg-blue-600';
      case 'todo': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const calculateTaskPosition = (task: Task) => {
    const taskStart = task.start_date ? new Date(task.start_date) : dateRange.start;
    const taskEnd = task.end_date ? new Date(task.end_date) : taskStart;
    
    const startIndex = dateColumns.findIndex(date => 
      date.toDateString() === taskStart.toDateString()
    );
    const endIndex = dateColumns.findIndex(date => 
      date.toDateString() === taskEnd.toDateString()
    );
    
    const startPos = Math.max(0, startIndex);
    const duration = Math.max(1, endIndex - startIndex + 1);
    
    return { startPos, duration };
  };

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  }, [currentDate, viewMode]);

  const formatDateHeader = (date: Date) => {
    if (viewMode === 'week') {
      return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    }
    return date.getDate().toString();
  };

  const getCurrentPeriodLabel = useCallback(() => {
    if (viewMode === 'week') {
      const start = dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} - ${end}`;
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewMode, dateRange, currentDate]);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold min-w-[200px] text-center">
              {getCurrentPeriodLabel()}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-[300px_1fr] border-b bg-muted/50">
                <div className="p-3 font-semibold border-r">Task</div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${dateColumns.length}, minmax(40px, 1fr))` }}>
                  {dateColumns.map((date, index) => (
                    <div
                      key={index}
                      className={`p-2 text-center text-xs font-medium border-r last:border-r-0 ${
                        date.toDateString() === new Date().toDateString()
                          ? 'bg-primary/10 text-primary'
                          : ''
                      }`}
                    >
                      {formatDateHeader(date)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Rows */}
              {visibleTasks.length > 0 ? (
                visibleTasks.map((task, taskIndex) => {
                  const { startPos, duration } = calculateTaskPosition(task);
                  
                  return (
                    <div key={task.id} className="grid grid-cols-[300px_1fr] border-b hover:bg-muted/30">
                      {/* Task Info Column */}
                      <div className="p-3 border-r flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{task.title}</h4>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getStatusColor(task.status)} text-white`}
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                              <span className="text-xs text-muted-foreground">{task.priority}</span>
                            </div>
                            {task.end_date && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(task.end_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
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

                      {/* Timeline Column */}
                      <div 
                        className="relative py-4 px-1"
                        style={{ 
                          display: 'grid',
                          gridTemplateColumns: `repeat(${dateColumns.length}, minmax(40px, 1fr))` 
                        }}
                      >
                        {/* Task Bar */}
                        <div
                          className={`absolute h-6 rounded ${getStatusColor(task.status)} ${getPriorityColor(task.priority)} opacity-80 flex items-center justify-center`}
                          style={{
                            left: `${(startPos / dateColumns.length) * 100}%`,
                            width: `${(duration / dateColumns.length) * 100}%`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            minWidth: '20px'
                          }}
                        >
                          <span className="text-xs text-white font-medium truncate px-1">
                            {task.title}
                          </span>
                        </div>

                        {/* Grid lines */}
                        {dateColumns.map((_, index) => (
                          <div key={index} className="border-r last:border-r-0 h-full"></div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tasks with dates</h3>
                  <p className="text-muted-foreground">
                    Add start and end dates to your tasks to see them in the Gantt chart
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

GanttChart.displayName = 'GanttChart';

export default GanttChart;