import React, { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectListItem } from '../../services/api';

interface ProjectCardProps {
  project: ProjectListItem;
  onEdit: (project: ProjectListItem) => void;
  onDelete: (project: ProjectListItem) => void;
  onArchive: (project: ProjectListItem) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = memo(({
  project,
  onEdit,
  onDelete,
  onArchive,
}) => {
  const navigate = useNavigate();
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-200 shadow-red-200';
      case 'high':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-200 shadow-orange-200';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-200 shadow-yellow-200';
      case 'low':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-200 shadow-green-200';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-200 shadow-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '🚨';
      case 'high':
        return '🔥';
      case 'medium':
        return '⚡';
      case 'low':
        return '🌱';
      default:
        return '📌';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleEdit = useCallback(() => {
    onEdit(project);
  }, [onEdit, project]);

  const handleDelete = useCallback(() => {
    onDelete(project);
  }, [onDelete, project]);

  const handleArchive = useCallback(() => {
    onArchive(project);
  }, [onArchive, project]);

  const handleProjectClick = useCallback(() => {
    navigate(`/projects/${project.id}`);
  }, [navigate, project.id]);

  const priorityColor = useMemo(() => getPriorityColor(project.priority), [project.priority]);
  const formattedDeadline = useMemo(() => 
    project.deadline ? formatDate(project.deadline) : null,
    [project.deadline]
  );
  const formattedCreatedDate = useMemo(() => formatDate(project.created_at), [project.created_at]);

  return (
    <div 
      onClick={handleProjectClick}
      className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-large border border-gray-200/60 p-8 hover:shadow-xl hover:border-accent-200/80 transform hover:scale-[1.02] transition-all duration-300 group cursor-pointer">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center mr-4 shadow-large group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-xl font-bold tracking-wide">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                {project.name}
              </h3>
            </div>
          </div>
          <p className="text-gray-600 text-base leading-relaxed font-medium">
            {project.description || 'No description provided'}
          </p>
        </div>
        
        <span
          className={`inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold shadow-medium hover:shadow-large transition-all duration-200 ${priorityColor}`}
        >
          <span className="mr-1">{getPriorityIcon(project.priority)}</span>
          {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
        </span>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-bold text-gray-700 flex items-center tracking-wide">
            <span className="mr-1">📊</span>
            Progress
          </span>
          <span className="text-lg font-bold text-accent-600">
            {project.progress_percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner-soft">
          <div
            className="bg-gradient-to-r from-accent-500 to-accent-600 h-4 rounded-full shadow-medium transition-all duration-500 ease-out group-hover:from-accent-400 group-hover:to-accent-500"
            style={{ width: `${project.progress_percentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-info-50 to-info-100/80 p-4 rounded-2xl border border-info-200/60 shadow-soft hover:shadow-medium transition-all duration-200">
          <div className="flex items-center">
            <span className="text-xl mr-3">⚡</span>
            <div>
              <span className="block text-sm font-bold text-info-600 tracking-wide">Features</span>
              <span className="text-xl font-bold text-info-800">{project.total_features}</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-success-50 to-success-100/80 p-4 rounded-2xl border border-success-200/60 shadow-soft hover:shadow-medium transition-all duration-200">
          <div className="flex items-center">
            <span className="text-xl mr-3">👥</span>
            <div>
              <span className="block text-sm font-bold text-success-600 tracking-wide">Team</span>
              <span className="text-xl font-bold text-success-800">
                {project.team_members_count}
              </span>
            </div>
          </div>
        </div>
        {project.deadline && (
          <div className={`col-span-2 p-4 rounded-2xl border shadow-soft hover:shadow-medium transition-all duration-200 ${
            project.is_overdue 
              ? 'bg-gradient-to-br from-danger-50 to-danger-100/80 border-danger-200/60' 
              : 'bg-gradient-to-br from-primary-50 to-primary-100/80 border-primary-200/60'
          }`}>
            <div className="flex items-center">
              <span className="text-xl mr-3">{project.is_overdue ? '⏰' : '📅'}</span>
              <div>
                <span className={`block text-sm font-bold tracking-wide ${
                  project.is_overdue ? 'text-danger-600' : 'text-primary-600'
                }`}>
                  Deadline
                </span>
                <span className={`text-lg font-bold ${
                  project.is_overdue ? 'text-danger-800' : 'text-primary-800'
                }`}>
                  {formattedDeadline}
                  {project.is_overdue && ' (Overdue!)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-200/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-gray-500 font-medium">
            <span className="mr-2 text-base">📅</span>
            Created {formattedCreatedDate}
          </div>
        </div>
        
        {project.can_edit && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleEdit(); }}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 text-primary-600 hover:from-primary-100 hover:to-primary-200 hover:text-primary-800 text-xs font-bold transition-all duration-200 border border-primary-200/60 shadow-soft hover:shadow-medium hover:scale-105"
            >
              <span className="mr-1">✏️</span>
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleArchive(); }}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 hover:from-gray-100 hover:to-gray-200 hover:text-gray-800 text-xs font-bold transition-all duration-200 border border-gray-200/60 shadow-soft hover:shadow-medium hover:scale-105"
            >
              <span className="mr-1">{project.is_archived ? '📤' : '📁'}</span>
              {project.is_archived ? 'Unarchive' : 'Archive'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-gradient-to-r from-danger-50 to-danger-100 text-danger-600 hover:from-danger-100 hover:to-danger-200 hover:text-danger-800 text-xs font-bold transition-all duration-200 border border-danger-200/60 shadow-soft hover:shadow-medium hover:scale-105"
            >
              <span className="mr-1">🗑️</span>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;