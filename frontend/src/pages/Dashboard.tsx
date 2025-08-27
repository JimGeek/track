import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { todoApiService, DashboardStats, Task, RecentActivity } from '../services/todoApi';
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  List,
  TrendingUp,
  Loader2,
  RefreshCw
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([]);
  const [thisWeekTasks, setThisWeekTasks] = useState<Task[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all dashboard data concurrently
      const [statsRes, todayRes, tomorrowRes, weekRes, activityRes] = await Promise.all([
        todoApiService.getDashboardStats(),
        todoApiService.getTasksDueToday(),
        todoApiService.getTasksDueTomorrow(),
        todoApiService.getTasksDueThisWeek(),
        todoApiService.getRecentActivity(5)
      ]);

      setDashboardStats(statsRes.data);
      setTodayTasks(todayRes.data.results);
      setTomorrowTasks(tomorrowRes.data.results);
      setThisWeekTasks(weekRes.data.results);
      setRecentActivity(activityRes.data.results);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good morning, {user?.first_name}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's on your agenda for today
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDashboardData}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  dashboardStats?.total_tasks || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all your lists
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  dashboardStats?.completed_tasks || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Great progress!
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  dashboardStats?.tasks_due_today || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Need attention today
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  dashboardStats?.overdue_tasks || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires immediate action
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's Tasks - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Today's Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Today's Tasks</span>
                  <Button asChild>
                    <Link to="/todo-lists">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Task
                    </Link>
                  </Button>
                </CardTitle>
                <CardDescription>
                  Focus on what matters most today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : todayTasks.length > 0 ? (
                  <div className="space-y-3">
                    {todayTasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50">
                        <input
                          type="checkbox"
                          checked={task.status === 'done'}
                          className="h-4 w-4 rounded border-border text-primary"
                          readOnly
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${
                            task.status === 'done' ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No tasks for today</p>
                    <p className="text-sm text-muted-foreground">You're all caught up!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>
                  Tasks due in the next few days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : tomorrowTasks.length > 0 || thisWeekTasks.length > 0 ? (
                  <div className="space-y-4">
                    {tomorrowTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Tomorrow</h4>
                        <div className="space-y-2">
                          {tomorrowTasks.slice(0, 3).map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{task.title}</p>
                                <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {thisWeekTasks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">This Week</h4>
                        <div className="space-y-2">
                          {thisWeekTasks.slice(0, 3).map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-2 rounded border">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{task.title}</p>
                                <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {task.end_date && new Date(task.end_date).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No upcoming tasks</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.title}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/todo-lists">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Todo List
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/calendar">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Calendar
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/todo-lists">
                      <List className="mr-2 h-4 w-4" />
                      All Lists
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;