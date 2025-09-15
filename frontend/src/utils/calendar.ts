import { Task } from '../services/todoApi';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarWeek[];
  monthName: string;
}

/**
 * Get the name of a month
 */
export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
};

/**
 * Get the short name of a day
 */
export const getDayName = (day: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[day];
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Get the first day of the week for a given date
 */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

/**
 * Generate calendar data for a specific month and year
 */
export const generateCalendarMonth = (year: number, month: number, tasks: Task[] = []): CalendarMonth => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = getWeekStart(firstDay);
  const endDate = new Date(lastDay);
  
  // Ensure we have full weeks - extend to next Saturday if needed
  const endDay = endDate.getDay();
  if (endDay !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endDay));
  }

  const weeks: CalendarWeek[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const week: CalendarWeek = { days: [] };
    
    // Generate 7 days for this week
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(current);
      const dayTasks = getTasksForDate(dayDate, tasks);
      
      week.days.push({
        date: new Date(dayDate),
        isCurrentMonth: dayDate.getMonth() === month,
        isToday: isToday(dayDate),
        tasks: dayTasks
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    weeks.push(week);
  }

  return {
    year,
    month,
    weeks,
    monthName: getMonthName(month)
  };
};

/**
 * Get tasks for a specific date
 */
export const getTasksForDate = (date: Date, tasks: Task[]): Task[] => {
  return tasks.filter(task => {
    // Check if task has a due date that matches this date
    if (task.end_date) {
      const taskEndDate = new Date(task.end_date);
      return isSameDay(date, taskEndDate);
    }
    
    // Check if task has a start date that matches this date
    if (task.start_date) {
      const taskStartDate = new Date(task.start_date);
      return isSameDay(date, taskStartDate);
    }
    
    return false;
  });
};

/**
 * Get the priority color for a task
 */
export const getTaskPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Get the status color for a task
 */
export const getTaskStatusColor = (status: string): string => {
  switch (status) {
    case 'todo':
      return 'bg-blue-500';
    case 'ongoing':
      return 'bg-purple-500';
    case 'done':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Navigate to previous month
 */
export const getPreviousMonth = (year: number, month: number): { year: number; month: number } => {
  if (month === 0) {
    return { year: year - 1, month: 11 };
  }
  return { year, month: month - 1 };
};

/**
 * Navigate to next month
 */
export const getNextMonth = (year: number, month: number): { year: number; month: number } => {
  if (month === 11) {
    return { year: year + 1, month: 0 };
  }
  return { year, month: month + 1 };
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format date for API (YYYY-MM-DD)
 */
export const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};