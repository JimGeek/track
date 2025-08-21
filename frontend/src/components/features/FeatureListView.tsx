import React, { memo, useCallback } from 'react';
import { FeatureListItem } from '../../services/api';

interface FeatureListViewProps {
  features: FeatureListItem[];
  onEdit: (feature: FeatureListItem) => void;
  onDelete: (feature: FeatureListItem) => void;
  onStatusChange: (feature: FeatureListItem) => void;
  onViewDetails: (feature: FeatureListItem) => void;
}

interface FeatureRowProps {
  feature: FeatureListItem;
  onEdit: (feature: FeatureListItem) => void;
  onDelete: (feature: FeatureListItem) => void;
  onStatusChange: (feature: FeatureListItem) => void;
  onViewDetails: (feature: FeatureListItem) => void;
}

const FeatureRow: React.FC<FeatureRowProps> = memo(({
  feature,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
}) => {
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'idea':
        return { bg: 'bg-gray-500', icon: '💡', label: 'Idea' };
      case 'specification':
        return { bg: 'bg-info-500', icon: '📋', label: 'Specification' };
      case 'development':
        return { bg: 'bg-warning-500', icon: '⚡', label: 'Development' };
      case 'testing':
        return { bg: 'bg-orange-500', icon: '🧪', label: 'Testing' };
      case 'live':
        return { bg: 'bg-success-500', icon: '🚀', label: 'Live' };
      default:
        return { bg: 'bg-gray-400', icon: '📌', label: 'Unknown' };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { bg: 'bg-danger-500', icon: '🚨' };
      case 'high':
        return { bg: 'bg-warning-500', icon: '🔥' };
      case 'medium':
        return { bg: 'bg-yellow-500', icon: '⚡' };
      case 'low':
        return { bg: 'bg-success-500', icon: '🌱' };
      default:
        return { bg: 'bg-gray-400', icon: '📌' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const statusConfig = getStatusConfig(feature.status);
  const priorityConfig = getPriorityConfig(feature.priority);

  return (
    <div 
      className="group relative bg-white border border-gray-200 rounded-lg p-3 hover:border-accent-300 hover:shadow-sm transition-all duration-200 cursor-pointer max-w-4xl"
      onClick={handleViewDetails}
    >
      {/* Priority Stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${priorityConfig.bg} rounded-l-lg`}></div>
      
      <div className="flex items-center gap-3">
        {/* Hierarchy Indicator */}
        {feature.hierarchy_level > 0 && (
          <div className="text-accent-400 flex-shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        <div className={`flex-shrink-0 w-2 h-2 rounded-full ${statusConfig.bg}`}></div>
        
        {/* Title */}
        <h3 className="font-medium text-gray-900 group-hover:text-accent-600 transition-colors flex-1 min-w-0 truncate">
          {feature.title}
        </h3>
        
        {/* Assignee */}
        {feature.assignee && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-6 h-6 bg-info-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {feature.assignee.first_name.charAt(0)}
            </div>
          </div>
        )}
        
        {/* Priority Icon */}
        <div className="flex-shrink-0 text-sm" title={`${priorityConfig.icon} ${feature.priority}`}>
          {priorityConfig.icon}
        </div>
        
        {/* Due Date */}
        {feature.due_date && (
          <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${feature.is_overdue ? 'text-danger-600' : 'text-gray-500'}`}>
            <span>{feature.is_overdue ? '⏰' : '📅'}</span>
            <span>{formatDate(feature.due_date)}</span>
          </div>
        )}
        
        {/* Effort */}
        <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
          <span>⏱️</span>
          <span>{feature.estimated_hours ? `${feature.estimated_hours}h` : 'TBD'}</span>
        </div>
        
        {/* Progress */}
        {feature.progress_percentage > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-12 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-accent-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${feature.progress_percentage}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-accent-600">
              {feature.progress_percentage}%
            </span>
          </div>
        )}

        {/* Quick Stats */}
        {(feature.sub_features_count > 0 || feature.comments_count > 0 || feature.attachments_count > 0) && (
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
            {feature.sub_features_count > 0 && <span>🌳{feature.sub_features_count}</span>}
            {feature.comments_count > 0 && <span>💬{feature.comments_count}</span>}
            {feature.attachments_count > 0 && <span>📎{feature.attachments_count}</span>}
          </div>
        )}

        {/* Actions */}
        {feature.can_edit && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={handleEdit}
              className="p-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
              title="Edit"
            >
              ✏️
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

FeatureRow.displayName = 'FeatureRow';

const FeatureListView: React.FC<FeatureListViewProps> = ({
  features,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
}) => {
  return (
    <div className="space-y-2">
      {features.map((feature) => (
        <FeatureRow
          key={feature.id}
          feature={feature}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};

export default memo(FeatureListView);