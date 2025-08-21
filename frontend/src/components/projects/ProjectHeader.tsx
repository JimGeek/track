import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../../services/api';

interface ProjectHeaderProps {
  project: Project;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { bg: 'from-danger-500 to-danger-600', icon: '🚨', label: 'Critical' };
      case 'high':
        return { bg: 'from-warning-500 to-warning-600', icon: '🔥', label: 'High' };
      case 'medium':
        return { bg: 'from-yellow-500 to-yellow-600', icon: '⚡', label: 'Medium' };
      case 'low':
        return { bg: 'from-success-500 to-success-600', icon: '🌱', label: 'Low' };
      default:
        return { bg: 'from-gray-500 to-gray-600', icon: '📌', label: 'Unknown' };
    }
  };

  const getStatusConfig = () => {
    // Default status for projects since status field doesn't exist
    return { bg: 'from-success-500 to-success-600', icon: '🚀', label: 'Active' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const priorityConfig = getPriorityConfig(project.priority);
  const statusConfig = getStatusConfig();

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      {/* Priority Stripe */}
      <div className={`h-1 bg-gradient-to-r ${priorityConfig.bg}`}></div>
      
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link to="/projects" className="hover:text-accent-600 transition-colors duration-200">
            Projects
          </Link>
          <span>›</span>
          <span className="text-gray-800 font-medium">{project.name}</span>
        </div>

        {/* Header Content */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Project Title */}
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {project.name}
              </h1>
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium text-white bg-gradient-to-r ${statusConfig.bg}`}>
                  <span className="mr-1">{statusConfig.icon}</span>
                  {statusConfig.label}
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium text-white bg-gradient-to-r ${priorityConfig.bg}`}>
                  <span className="mr-1">{priorityConfig.icon}</span>
                  {priorityConfig.label}
                </div>
              </div>
            </div>

            {/* Project Description */}
            <p className="text-gray-600 leading-relaxed mb-4 max-w-3xl">
              {project.description}
            </p>

            {/* Project Meta - Simplified */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              {/* Owner */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {project.owner.first_name.charAt(0)}{project.owner.last_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Owner</div>
                  <div className="font-medium text-gray-900">
                    {project.owner.first_name} {project.owner.last_name}
                  </div>
                </div>
              </div>

              {/* Team Size */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-info-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👥</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Team</div>
                  <div className="font-medium text-gray-900">
                    {project.team_members?.length || 1} members
                  </div>
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-success-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📅</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Created</div>
                  <div className="font-medium text-gray-900">
                    {formatDate(project.created_at)}
                  </div>
                </div>
              </div>

              {/* Deadline */}
              {project.deadline && (
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    project.is_overdue ? 'bg-danger-500' : 'bg-warning-500'
                  }`}>
                    <span className="text-white text-sm">{project.is_overdue ? '⏰' : '🎯'}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Deadline</div>
                    <div className={`font-medium ${project.is_overdue ? 'text-danger-600' : 'text-gray-900'}`}>
                      {formatDate(project.deadline)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center px-4 py-2 bg-accent-50 text-accent-600 hover:bg-accent-100 font-medium rounded-xl transition-all duration-200 text-sm">
              <span className="mr-1">✨</span>
              Add Feature
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 font-medium rounded-xl transition-all duration-200 text-sm">
              <span className="mr-1">✏️</span>
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;