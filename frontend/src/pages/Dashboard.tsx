import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import FeatureDetailModal from '../components/features/FeatureDetailModal';
import apiService, { FeatureListItem, Feature, RecentActivity, UpcomingFeature } from '../services/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [projectFilters, setProjectFilters] = useState({
    sortBy: 'name', // name, deadline, priority, progress
    priority: 'all',
    status: 'active'
  });
  
  const [selectedFeature, setSelectedFeature] = useState<FeatureListItem | null>(null);
  
  // Fetch dashboard summary
  const { data: summaryData } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => apiService.getDashboardSummary(),
  });

  // Fetch projects with filters
  const { data: projectsData } = useQuery({
    queryKey: ['myProjects', projectFilters],
    queryFn: () => apiService.getMyProjects(),
  });

  // Fetch recent activity
  const { data: activityData } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: () => apiService.getRecentActivity(),
  });

  // Fetch upcoming features (7, 15, 30 days)
  const { data: upcomingFeaturesData } = useQuery({
    queryKey: ['upcomingFeatures'],
    queryFn: () => apiService.getUpcomingFeatures(),
  });

  const summary = summaryData?.data;
  const projects = projectsData?.data;
  const activities = activityData?.data?.results || [];
  const upcomingFeatures = upcomingFeaturesData?.data || { next_7_days: [], next_15_days: [], next_30_days: [] };

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleFeatureClick = (feature: UpcomingFeature) => {
    // Convert UpcomingFeature to FeatureListItem for the modal
    const featureListItem: FeatureListItem = {
      id: feature.id,
      title: feature.title,
      description: '',
      status: feature.status,
      priority: feature.priority,
      assignee: feature.assignee,
      reporter: feature.assignee || { id: 0, email: '', first_name: 'System', last_name: 'User', full_name: 'System User', date_joined: '', is_email_verified: false },
      project_name: feature.project_name,
      parent: null,
      parent_title: feature.parent_title || null,
      estimated_hours: null,
      actual_hours: null,
      due_date: feature.due_date,
      completed_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order: 0,
      is_overdue: feature.is_overdue,
      is_completed: feature.status === 'live',
      hierarchy_level: feature.hierarchy_level,
      full_path: feature.title,
      progress_percentage: 0,
      can_edit: false,
      sub_features_count: 0,
      comments_count: 0,
      attachments_count: 0
    };
    setSelectedFeature(featureListItem);
  };

  const handleFeatureModalSave = (updatedFeature: Feature) => {
    setSelectedFeature(null);
    // Refresh data
  };

  const handleFeatureModalDelete = (featureId: string) => {
    setSelectedFeature(null);
    // Refresh data
  };

  const sortProjects = (projects: any[]) => {
    if (!projects) return [];
    
    return [...projects].sort((a, b) => {
      switch (projectFilters.sortBy) {
        case 'deadline':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority':
          const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'progress':
          return (b.progress_percentage || 0) - (a.progress_percentage || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  };

  const filterProjects = (projects: any[]) => {
    if (!projects) return [];
    
    return projects.filter(project => {
      if (projectFilters.priority !== 'all' && project.priority !== projectFilters.priority) {
        return false;
      }
      if (projectFilters.status === 'active' && project.is_archived) {
        return false;
      }
      if (projectFilters.status === 'archived' && !project.is_archived) {
        return false;
      }
      return true;
    });
  };

  const getFilteredAndSortedProjects = (projects: any[]) => {
    return sortProjects(filterProjects(projects));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'project_created': return '🎉';
      case 'project_updated': return '✏️';
      case 'feature_created': return '⚡';
      case 'feature_updated': return '🔄';
      case 'feature_completed': return '✅';
      case 'comment_added': return '💬';
      default: return '📌';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-600">Here's what's happening with your projects today.</p>
        </div>

        {/* Dashboard Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Projects</p>
                  <p className="text-3xl font-bold">{summary.total_projects}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Projects</p>
                  <p className="text-3xl font-bold">{summary.active_projects}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Features</p>
                  <p className="text-3xl font-bold">{0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <p className="text-red-100 text-sm font-medium">Overdue</p>
                  <p className="text-3xl font-bold">{summary.overdue_projects}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Projects Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Your Projects */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="mr-2">📁</span>
                    Your Projects
                  </h2>
                  <Link
                    to="/projects"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All →
                  </Link>
                </div>

                {/* Project Filters */}
                <div className="flex flex-wrap gap-3">
                  <select
                    value={projectFilters.sortBy}
                    onChange={(e) => setProjectFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="deadline">Sort by Deadline</option>
                    <option value="priority">Sort by Priority</option>
                    <option value="progress">Sort by Progress</option>
                  </select>

                  <select
                    value={projectFilters.priority}
                    onChange={(e) => setProjectFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    value={projectFilters.status}
                    onChange={(e) => setProjectFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active Projects</option>
                    <option value="archived">Archived Projects</option>
                    <option value="all">All Projects</option>
                  </select>
                </div>
              </div>

              <div className="p-6">
                {projects?.owned_projects?.length ? (
                  <div className="space-y-4">
                    {getFilteredAndSortedProjects(projects.owned_projects).slice(0, 6).map((project) => (
                      <div 
                        key={project.id} 
                        onClick={() => handleProjectClick(project.id)}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {project.name}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                project.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                project.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {project.priority}
                              </span>
                            </div>
                            
                            {project.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <span>📅</span>
                                {project.due_date ? (
                                  <span className={`${
                                    new Date(project.due_date) < new Date() ? 'text-red-600 font-medium' : ''
                                  }`}>
                                    Due {new Date(project.due_date).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span>No due date</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span>⚡</span>
                                <span>{project.feature_count || 0} features</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4 text-right">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {project.progress_percentage || 0}%
                            </div>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${project.progress_percentage || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-600 mb-6">No projects yet</p>
                    <Link
                      to="/projects"
                      className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <span className="mr-2">🚀</span>
                      Create Your First Project
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Features */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="mr-2">⏰</span>
                  Upcoming Features
                </h2>
                <p className="text-sm text-gray-600 mt-1">Features due in the next 30 days</p>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {/* Next 7 Days */}
                  {upcomingFeatures.next_7_days?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center">
                        <span className="mr-2">🚨</span>
                        Next 7 Days ({upcomingFeatures.next_7_days.length})
                      </h3>
                      <div className="space-y-2">
                        {upcomingFeatures.next_7_days.map((feature: UpcomingFeature) => (
                          <div 
                            key={feature.id}
                            onClick={() => handleFeatureClick(feature)}
                            className="p-3 bg-red-50 border border-red-200 rounded-lg hover:shadow-sm cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                                  {feature.title}
                                </p>
                                <p className="text-xs text-gray-600">{feature.project_name}</p>
                              </div>
                              <div className="text-xs text-red-600 font-medium">
                                {new Date(feature.due_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next 15 Days */}
                  {upcomingFeatures.next_15_days?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-orange-600 mb-3 flex items-center">
                        <span className="mr-2">⚠️</span>
                        Next 15 Days ({upcomingFeatures.next_15_days.length})
                      </h3>
                      <div className="space-y-2">
                        {upcomingFeatures.next_15_days.slice(0, 3).map((feature: UpcomingFeature) => (
                          <div 
                            key={feature.id}
                            onClick={() => handleFeatureClick(feature)}
                            className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:shadow-sm cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                                  {feature.title}
                                </p>
                                <p className="text-xs text-gray-600">{feature.project_name}</p>
                              </div>
                              <div className="text-xs text-orange-600 font-medium">
                                {new Date(feature.due_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        {upcomingFeatures.next_15_days.length > 3 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            +{upcomingFeatures.next_15_days.length - 3} more features
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Next 30 Days */}
                  {upcomingFeatures.next_30_days?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center">
                        <span className="mr-2">📅</span>
                        Next 30 Days ({upcomingFeatures.next_30_days.length})
                      </h3>
                      <div className="space-y-2">
                        {upcomingFeatures.next_30_days.slice(0, 3).map((feature: UpcomingFeature) => (
                          <div 
                            key={feature.id}
                            onClick={() => handleFeatureClick(feature)}
                            className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-sm cursor-pointer group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {feature.title}
                                </p>
                                <p className="text-xs text-gray-600">{feature.project_name}</p>
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                {new Date(feature.due_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        {upcomingFeatures.next_30_days.length > 3 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            +{upcomingFeatures.next_30_days.length - 3} more features
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {(!upcomingFeatures.next_7_days?.length && !upcomingFeatures.next_15_days?.length && !upcomingFeatures.next_30_days?.length) && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">🎉</div>
                      <p className="text-gray-600">No upcoming deadlines!</p>
                      <p className="text-sm text-gray-500">You're all caught up.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            
            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="mr-2">📈</span>
                  Recent Activity
                </h2>
              </div>

              <div className="p-6">
                {activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.slice(0, 8).map((activity: RecentActivity, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">{getActivityIcon(activity.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📱</div>
                    <p className="text-gray-600">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="mr-2">⚡</span>
                  Quick Actions
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  <Link
                    to="/projects?create=true"
                    className="flex items-center w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                  >
                    <span className="mr-3 text-xl">🚀</span>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-blue-600">Create Project</p>
                      <p className="text-xs text-gray-600">Start a new project</p>
                    </div>
                  </Link>

                  <Link
                    to="/features?create=true"
                    className="flex items-center w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                  >
                    <span className="mr-3 text-xl">⚡</span>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-purple-600">Add Feature</p>
                      <p className="text-xs text-gray-600">Create a new feature</p>
                    </div>
                  </Link>

                  <Link
                    to="/projects"
                    className="flex items-center w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                  >
                    <span className="mr-3 text-xl">📊</span>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-green-600">View Reports</p>
                      <p className="text-xs text-gray-600">Check project analytics</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        isOpen={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
        onSave={handleFeatureModalSave}
        onDelete={handleFeatureModalDelete}
      />
    </MainLayout>
  );
};

export default Dashboard;