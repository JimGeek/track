import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiService from '../../services/api';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, value, change, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface ChartData {
  labels: string[];
  data: number[];
  colors: string[];
}

interface SimpleBarChartProps {
  data: ChartData;
  title: string;
  height?: number;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, title, height = 200 }) => {
  const maxValue = Math.max(...data.data);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3" style={{ height }}>
        {data.labels.map((label, index) => {
          const value = data.data[index];
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const color = data.colors[index] || '#3B82F6';
          
          return (
            <div key={label} className="flex items-center gap-3">
              <div className="w-20 text-sm text-gray-600 flex-shrink-0">{label}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-6 relative">
                  <div
                    className="h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                    style={{ 
                      width: `${Math.max(percentage, 5)}%`,
                      backgroundColor: color 
                    }}
                  >
                    <span className="text-xs font-medium text-white">{value}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ProjectAnalyticsProps {
  projectId?: string;
}

const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ projectId }) => {
  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiService.getDashboardStats(),
  });

  // Fetch feature dashboard stats
  const { data: featureStats, isLoading: featureStatsLoading } = useQuery({
    queryKey: ['feature-dashboard-stats'],
    queryFn: () => apiService.getFeatureDashboardStats(),
  });

  // Fetch projects for overview
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.getProjects(),
  });

  if (statsLoading || featureStatsLoading || projectsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboardStats?.data;
  const features = featureStats?.data;
  const projects = projectsData?.data?.results || [];

  // Prepare chart data
  const statusChartData: ChartData = {
    labels: features?.status_distribution?.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1)) || [],
    data: features?.status_distribution?.map(item => item.count) || [],
    colors: [
      '#9CA3AF', // idea
      '#3B82F6', // specification
      '#F59E0B', // development
      '#8B5CF6', // testing
      '#10B981'  // live
    ]
  };

  const priorityChartData: ChartData = {
    labels: features?.priority_distribution?.map(item => item.priority.charAt(0).toUpperCase() + item.priority.slice(1)) || [],
    data: features?.priority_distribution?.map(item => item.count) || [],
    colors: [
      '#10B981', // low
      '#F59E0B', // medium
      '#EF4444', // high
      '#DC2626'  // critical
    ]
  };

  const projectStatusData: ChartData = {
    labels: ['Active', 'Planning', 'On Hold', 'Completed'],
    data: [
      projects.filter(p => p.status === 'active').length,
      projects.filter(p => p.status === 'planning').length,
      projects.filter(p => p.status === 'on_hold').length,
      projects.filter(p => p.status === 'completed').length,
    ],
    colors: ['#F59E0B', '#6B7280', '#EF4444', '#10B981']
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Projects"
          value={stats?.projects_count || 0}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          color="bg-blue-500"
        />

        <AnalyticsCard
          title="Total Features"
          value={stats?.features_count || 0}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          color="bg-green-500"
        />

        <AnalyticsCard
          title="My Assignments"
          value={features?.my_assignments_count || 0}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          color="bg-purple-500"
        />

        <AnalyticsCard
          title="Overdue Items"
          value={features?.overdue_count || 0}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="bg-red-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          data={statusChartData}
          title="Features by Status"
        />
        
        <SimpleBarChart
          data={priorityChartData}
          title="Features by Priority"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          data={projectStatusData}
          title="Projects by Status"
        />

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">New feature "User Dashboard" created</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">Feature "Login System" moved to testing</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">Project "Mobile App" completed</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-900">3 features assigned to you</p>
                <p className="text-xs text-gray-500">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {Math.round(((stats?.features_count || 0) / Math.max((stats?.projects_count || 1), 1)) * 10) / 10}
            </div>
            <div className="text-sm text-gray-600">Features per Project</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {features?.status_distribution?.find(s => s.status === 'live')?.count || 0}
            </div>
            <div className="text-sm text-gray-600">Completed Features</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">
              {projects.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;