import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout';
import CalendarGrid from '../components/calendar/CalendarGrid';
import CalendarHeader from '../components/calendar/CalendarHeader';
import TaskDetailModal from '../components/calendar/TaskDetailModal';
import TaskFormModal from '../components/tasks/TaskFormModal';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Plus, Loader2 } from 'lucide-react';
import { 
  generateCalendarMonth, 
  getPreviousMonth, 
  getNextMonth,
  formatDate,
  formatDateForApi
} from '../utils/calendar';
import { Task, CreateTaskRequest, UpdateTaskRequest, todoApiService } from '../services/todoApi';

const Calendar: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch tasks for the current month
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks', year, month],
    queryFn: async () => {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      
      const response = await todoApiService.getTasks({
        start_date: formatDateForApi(startOfMonth),
        end_date: formatDateForApi(endOfMonth)
      });
      return response.data.results;
    },
    staleTime: 30000, // 30 seconds
  });

  const tasks = tasksData || [];

  // Generate calendar data
  const calendar = generateCalendarMonth(year, month, tasks);

  // Navigation handlers
  const handlePrevMonth = () => {
    const { year: prevYear, month: prevMonth } = getPreviousMonth(year, month);
    setCurrentDate(new Date(prevYear, prevMonth, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    const { year: nextYear, month: nextMonth } = getNextMonth(year, month);
    setCurrentDate(new Date(nextYear, nextMonth, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Task interaction handlers
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
  };

  const handleCreateTask = () => {
    setIsCreateTaskModalOpen(true);
  };

  const handleTaskCreated = async (taskData: any) => {
    setIsTaskFormLoading(true);
    try {
      const createData: CreateTaskRequest = {
        todo_list: '', // You'll need to handle todo list selection - for now we'll create without a list
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        start_date: taskData.startDate || undefined,
        end_date: taskData.endDate || undefined,
      };
      await todoApiService.createTask(createData);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateTaskModalOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    } finally {
      setIsTaskFormLoading(false);
    }
  };

  const handleTaskUpdated = async (taskId: string, updates: UpdateTaskRequest) => {
    try {
      await todoApiService.updateTask(taskId, updates);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const handleTaskDeleted = async (taskId: string) => {
    try {
      await todoApiService.deleteTask(taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const [isTaskFormLoading, setIsTaskFormLoading] = useState(false);

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading calendar data</p>
            <p className="text-sm text-gray-500">Please try refreshing the page</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              View and manage your tasks in a calendar format
            </p>
            {selectedDate && (
              <p className="text-sm text-blue-600 mt-1">
                Selected: {formatDate(selectedDate)}
              </p>
            )}
          </div>
          <Button onClick={handleCreateTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Calendar Header with Navigation */}
        <CalendarHeader
          year={year}
          month={month}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          onViewChange={setView}
          currentView={view}
        />

        {/* Calendar Content */}
        {isLoading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
              <span className="text-lg">Loading calendar...</span>
            </div>
          </Card>
        ) : (
          <CalendarGrid
            calendar={calendar}
            onDateClick={handleDateClick}
            onTaskClick={handleTaskClick}
            selectedDate={selectedDate}
          />
        )}

        {/* Task Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-gray-500">Total Tasks</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'done').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {tasks.filter(t => t.status === 'ongoing').length}
              </div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {tasks.filter(t => t.is_overdue).length}
              </div>
              <div className="text-sm text-gray-500">Overdue</div>
            </div>
          </Card>
        </div>

        {/* Task Detail Modal */}
        <TaskDetailModal
          isOpen={isTaskDetailModalOpen}
          onClose={() => {
            setIsTaskDetailModalOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onUpdateTask={handleTaskUpdated}
          onDeleteTask={handleTaskDeleted}
        />

        {/* Create Task Modal */}
        <TaskFormModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          onSave={handleTaskCreated}
          isLoading={isTaskFormLoading}
        />
      </div>
    </MainLayout>
  );
};

export default Calendar;