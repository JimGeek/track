import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Fetch dashboard summary
  const { data: summaryData } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => apiService.getDashboardSummary(),
  });

  // Fetch recent projects
  const { data: projectsData } = useQuery({
    queryKey: ['myProjects'],
    queryFn: () => apiService.getMyProjects(),
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const summary = summaryData?.data;
  const projects = projectsData?.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">Track</h1>
              <nav className="flex space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/projects"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Projects
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.first_name} {user?.last_name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
          
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">T</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Projects
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {summary.total_projects}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">A</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Projects
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {summary.active_projects}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">AR</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Archived Projects
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {summary.archived_projects}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">!</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Overdue Projects
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {summary.overdue_projects}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Owned Projects */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Projects</h3>
            </div>
            <div className="p-6">
              {projects?.owned_projects?.length ? (
                <div className="space-y-3">
                  {projects.owned_projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          {project.progress_percentage}% complete
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        project.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {project.priority}
                      </span>
                    </div>
                  ))}
                  {projects.owned_projects.length > 5 && (
                    <Link
                      to="/projects"
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      View all {projects.owned_projects.length} projects →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No projects yet</p>
                  <Link
                    to="/projects"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Create Your First Project
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Team Projects */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Team Projects</h3>
            </div>
            <div className="p-6">
              {projects?.team_projects?.length ? (
                <div className="space-y-3">
                  {projects.team_projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          Owner: {project.owner.first_name} {project.owner.last_name}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        project.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {project.priority}
                      </span>
                    </div>
                  ))}
                  {projects.team_projects.length > 5 && (
                    <Link
                      to="/projects"
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      View all {projects.team_projects.length} team projects →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No team projects</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;