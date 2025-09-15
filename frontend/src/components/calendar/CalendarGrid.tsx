import React from 'react';
import { Task } from '../../services/todoApi';
import { CalendarMonth, getDayName, getTaskStatusColor } from '../../utils/calendar';

interface CalendarGridProps {
  calendar: CalendarMonth;
  onDateClick?: (date: Date) => void;
  onTaskClick?: (task: Task) => void;
  selectedDate?: Date | null;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  calendar,
  onDateClick,
  onTaskClick,
  selectedDate
}) => {
  const handleDateClick = (date: Date) => {
    onDateClick?.(date);
  };

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    onTaskClick?.(task);
  };

  const isSelectedDate = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.getTime() === selectedDate.getTime();
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-0 border-b">
        {[0, 1, 2, 3, 4, 5, 6].map(day => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-700 border-r last:border-r-0"
          >
            {getDayName(day)}
          </div>
        ))}
      </div>

      {/* Calendar Body */}
      <div className="grid grid-cols-7 gap-0">
        {calendar.weeks.map((week, weekIndex) =>
          week.days.map((day, dayIndex) => {
            const isSelected = isSelectedDate(day.date);
            const hasTask = day.tasks.length > 0;
            const todayClass = day.isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : '';

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`
                  min-h-[100px] sm:min-h-[120px] p-2 border-r border-b last:border-r-0 cursor-pointer
                  transition-all duration-200 hover:bg-gray-50 hover:shadow-sm relative
                  ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                  ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
                  ${isSelected ? 'bg-blue-100 border-blue-300 shadow-md' : ''}
                  ${todayClass}
                `}
                onClick={() => handleDateClick(day.date)}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`
                      text-sm font-medium
                      ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                      ${day.isToday ? 'text-blue-600 font-semibold' : ''}
                    `}
                  >
                    {day.date.getDate()}
                  </span>
                  {hasTask && (
                    <div className={`
                      w-2 h-2 rounded-full bg-blue-500
                      ${day.tasks.length > 3 ? 'animate-pulse' : ''}
                    `} />
                  )}
                </div>

                {/* Tasks */}
                <div className="space-y-1 max-h-[60px] sm:max-h-[80px] overflow-hidden">
                  {day.tasks.slice(0, 3).map((task, taskIndex) => (
                    <div
                      key={task.id}
                      className={`
                        px-2 py-1 text-xs rounded truncate cursor-pointer
                        transition-all duration-200 hover:shadow-md hover:scale-105
                        ${getTaskStatusColor(task.status)} text-white shadow-sm
                        font-medium
                      `}
                      onClick={(e) => handleTaskClick(task, e)}
                      title={`${task.title} - ${task.priority} priority - ${task.status}`}
                    >
                      <div className="flex items-center space-x-1">
                        {task.is_overdue && (
                          <span className="text-red-200">⚠</span>
                        )}
                        <span className="truncate">{task.title}</span>
                        {task.priority === 'urgent' && (
                          <span className="text-yellow-200">🔥</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* More tasks indicator */}
                  {day.tasks.length > 3 && (
                    <div 
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded text-center cursor-pointer hover:bg-gray-300 transition-colors"
                      onClick={() => handleDateClick(day.date)}
                    >
                      +{day.tasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CalendarGrid;