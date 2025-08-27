import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';

const Calendar: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">
              View your tasks in a calendar format
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        {/* Placeholder Content */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Calendar View Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                The calendar view will show your tasks and deadlines in a monthly, weekly, 
                and daily format for better time management.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Calendar;