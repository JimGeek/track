import React from 'react';
import { ProjectListItem } from '../../services/api';

interface ProjectCardProps {
  project: ProjectListItem;
  onEdit: (project: ProjectListItem) => void;
  onDelete: (project: ProjectListItem) => void;
  onArchive: (project: ProjectListItem) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onArchive,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {project.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            {project.description || 'No description provided'}
          </p>
        </div>
        
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
            project.priority
          )}`}
        >
          {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-900">
            {project.progress_percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full"
            style={{ width: `${project.progress_percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
        <div>
          <span className="block font-medium">Features</span>
          <span>{project.total_features}</span>
        </div>
        <div>
          <span className="block font-medium">Team</span>
          <span>{project.team_members_count} member{project.team_members_count !== 1 ? 's' : ''}</span>
        </div>
        {project.deadline && (
          <div className="col-span-2">
            <span className="block font-medium">Deadline</span>
            <span className={project.is_overdue ? 'text-red-600' : ''}>
              {formatDate(project.deadline)}
              {project.is_overdue && ' (Overdue)'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Created {formatDate(project.created_at)}
        </div>
        
        {project.can_edit && (
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(project)}
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => onArchive(project)}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              {project.is_archived ? 'Unarchive' : 'Archive'}
            </button>
            <button
              onClick={() => onDelete(project)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;