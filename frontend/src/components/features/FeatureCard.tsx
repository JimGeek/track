import React, { memo, useMemo, useCallback } from 'react';
import { FeatureListItem } from '../../services/api';

interface FeatureCardProps {
  feature: FeatureListItem;
  onEdit: (feature: FeatureListItem) => void;
  onDelete: (feature: FeatureListItem) => void;
  onStatusChange: (feature: FeatureListItem) => void;
  onViewDetails: (feature: FeatureListItem) => void;
}

const FeatureCard: React.FC<FeatureCardProps> = memo(({
  feature,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'idea':
        return { 
          bg: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-200 shadow-gray-200', 
          icon: '💡', 
          label: 'Idea' 
        };
      case 'specification':
        return { 
          bg: 'bg-gradient-to-r from-info-500 to-info-600 text-white border-info-200 shadow-info-200', 
          icon: '📋', 
          label: 'Specification' 
        };
      case 'development':
        return { 
          bg: 'bg-gradient-to-r from-warning-500 to-warning-600 text-white border-warning-200 shadow-warning-200', 
          icon: '⚡', 
          label: 'Development' 
        };
      case 'testing':
        return { 
          bg: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-200 shadow-orange-200', 
          icon: '🧪', 
          label: 'Testing' 
        };
      case 'live':
        return { 
          bg: 'bg-gradient-to-r from-success-500 to-success-600 text-white border-success-200 shadow-success-200', 
          icon: '🚀', 
          label: 'Live' 
        };
      default:
        return { 
          bg: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-200 shadow-gray-200', 
          icon: '📌', 
          label: 'Unknown' 
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { bg: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-200 shadow-red-200', icon: '🚨', label: 'Critical' };
      case 'high':
        return { bg: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-200 shadow-orange-200', icon: '🔥', label: 'High' };
      case 'medium':
        return { bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-200 shadow-yellow-200', icon: '⚡', label: 'Medium' };
      case 'low':
        return { bg: 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-200 shadow-green-200', icon: '🌱', label: 'Low' };
      default:
        return { bg: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-200 shadow-gray-200', icon: '📌', label: 'Unknown' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(feature);
  }, [onEdit, feature]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(feature);
  }, [onDelete, feature]);

  const handleStatusChange = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onStatusChange(feature);
  }, [onStatusChange, feature]);

  const handleViewDetails = useCallback(() => {
    onViewDetails(feature);
  }, [onViewDetails, feature]);

  const statusConfig = useMemo(() => getStatusConfig(feature.status), [feature.status]);
  const priorityConfig = useMemo(() => getPriorityConfig(feature.priority), [feature.priority]);
  const formattedDueDate = useMemo(() => 
    feature.due_date ? formatDate(feature.due_date) : null,
    [feature.due_date]
  );

  return (
    <div 
      onClick={handleViewDetails}
      className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-large border border-gray-200/60 p-6 hover:shadow-xl hover:border-accent-200/80 transform hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
      style={{ marginLeft: feature.hierarchy_level > 0 ? `${feature.hierarchy_level * 24}px` : '0' }}
    >
      {/* Hierarchy and Priority Indicators */}
      {feature.hierarchy_level > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-400 to-accent-600 rounded-l-3xl"></div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center mr-3 shadow-large group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-lg font-bold">
                {statusConfig.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate">
                {feature.title}
              </h3>
              {feature.hierarchy_level > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-xs text-accent-600 font-medium">Sub-feature</span>
                </div>
              )}
            </div>
          </div>
          {feature.description && (
            <p className="text-gray-600 text-sm leading-relaxed font-medium line-clamp-2">
              {feature.description}
            </p>
          )}
        </div>
        
        <span
          className={`inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold shadow-medium hover:shadow-large transition-all duration-200 ${priorityConfig.bg}`}
        >
          <span className="mr-1">{priorityConfig.icon}</span>
          {priorityConfig.label}
        </span>
      </div>

      {/* Progress Section */}
      {feature.progress_percentage > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gray-700 flex items-center tracking-wide">
              <span className="mr-1">📊</span>
              Progress
            </span>
            <span className="text-sm font-bold text-accent-600">
              {feature.progress_percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner-soft">
            <div
              className="bg-gradient-to-r from-accent-500 to-accent-600 h-3 rounded-full shadow-medium transition-all duration-500 ease-out group-hover:from-accent-400 group-hover:to-accent-500"
              style={{ width: `${feature.progress_percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Assignee */}
        {feature.assignee && (
          <div className="bg-gradient-to-br from-info-50 to-info-100/80 p-4 rounded-2xl border border-info-200/60 shadow-soft hover:shadow-medium transition-all duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-info-500 to-info-600 rounded-xl flex items-center justify-center mr-3 text-white text-xs font-bold">
                {feature.assignee.first_name.charAt(0)}{feature.assignee.last_name.charAt(0)}
              </div>
              <div>
                <span className="block text-xs font-bold text-info-600 tracking-wide">Assignee</span>
                <span className="text-sm font-bold text-info-800">
                  {feature.assignee.first_name}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Effort */}
        <div className="bg-gradient-to-br from-warning-50 to-warning-100/80 p-4 rounded-2xl border border-warning-200/60 shadow-soft hover:shadow-medium transition-all duration-200">
          <div className="flex items-center">
            <span className="text-xl mr-3">⏱️</span>
            <div>
              <span className="block text-xs font-bold text-warning-600 tracking-wide">Effort</span>
              <span className="text-sm font-bold text-warning-800">
                {feature.estimated_hours ? `${feature.estimated_hours}h` : 'TBD'}
              </span>
            </div>
          </div>
        </div>

        {/* Due Date */}
        {feature.due_date && (
          <div className={`col-span-2 p-4 rounded-2xl border shadow-soft hover:shadow-medium transition-all duration-200 ${
            feature.is_overdue 
              ? 'bg-gradient-to-br from-danger-50 to-danger-100/80 border-danger-200/60' 
              : 'bg-gradient-to-br from-primary-50 to-primary-100/80 border-primary-200/60'
          }`}>
            <div className="flex items-center">
              <span className="text-xl mr-3">{feature.is_overdue ? '⏰' : '📅'}</span>
              <div>
                <span className={`block text-xs font-bold tracking-wide ${
                  feature.is_overdue ? 'text-danger-600' : 'text-primary-600'
                }`}>
                  Due Date
                </span>
                <span className={`text-sm font-bold ${
                  feature.is_overdue ? 'text-danger-800' : 'text-primary-800'
                }`}>
                  {formattedDueDate}
                  {feature.is_overdue && ' (Overdue!)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {(feature.sub_features_count > 0 || feature.comments_count > 0 || feature.attachments_count > 0) && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200/60">
          {feature.sub_features_count > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-lg">🌳</span>
              <div>
                <span className="block text-xs font-bold text-gray-600">Sub-features</span>
                <span className="text-sm font-bold text-gray-800">{feature.sub_features_count}</span>
              </div>
            </div>
          )}
          {feature.comments_count > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <div>
                <span className="block text-xs font-bold text-gray-600">Comments</span>
                <span className="text-sm font-bold text-gray-800">{feature.comments_count}</span>
              </div>
            </div>
          )}
          {feature.attachments_count > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-lg">📎</span>
              <div>
                <span className="block text-xs font-bold text-gray-600">Files</span>
                <span className="text-sm font-bold text-gray-800">{feature.attachments_count}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200/60">
        <div className="flex items-center text-sm text-gray-500 font-medium">
          <span className="mr-2 text-base">{statusConfig.icon}</span>
          {statusConfig.label}
        </div>
        
        {feature.can_edit && (
          <div className="flex space-x-2">
            <button
              onClick={handleStatusChange}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-accent-50 to-accent-100 text-accent-600 hover:from-accent-100 hover:to-accent-200 hover:text-accent-800 text-sm font-bold transition-all duration-200 border border-accent-200/60 shadow-soft hover:shadow-medium hover:scale-105"
            >
              <span className="mr-2">🔄</span>
              Toggle
            </button>
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 text-primary-600 hover:from-primary-100 hover:to-primary-200 hover:text-primary-800 text-sm font-bold transition-all duration-200 border border-primary-200/60 shadow-soft hover:shadow-medium hover:scale-105"
            >
              <span className="mr-2">✏️</span>
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-danger-50 to-danger-100 text-danger-600 hover:from-danger-100 hover:to-danger-200 hover:text-danger-800 text-sm font-bold transition-all duration-200 border border-danger-200/60 shadow-soft hover:shadow-medium hover:scale-105"
            >
              <span className="mr-2">🗑️</span>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

FeatureCard.displayName = 'FeatureCard';

export default FeatureCard;