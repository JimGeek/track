import React from 'react';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { getMonthName } from '../../utils/calendar';

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
  currentView?: 'month' | 'week' | 'day';
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
  onViewChange,
  currentView = 'month'
}) => {
  const monthName = getMonthName(month);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* Left side - Month/Year and Navigation */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevMonth}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-semibold text-gray-900 min-w-[180px] text-center">
            {monthName} {year}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNextMonth}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="flex items-center space-x-2"
        >
          <Clock className="h-4 w-4" />
          <span>Today</span>
        </Button>
      </div>

      {/* Right side - View Controls */}
      <div className="flex items-center space-x-2">
        {onViewChange && (
          <>
            <Button
              variant={currentView === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewChange('month')}
            >
              Month
            </Button>
            <Button
              variant={currentView === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewChange('week')}
            >
              Week
            </Button>
            <Button
              variant={currentView === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewChange('day')}
            >
              Day
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarHeader;