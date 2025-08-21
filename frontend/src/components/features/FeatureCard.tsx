import React from 'react';
import { FeatureListItem } from '../../services/api';

interface FeatureCardProps {
  feature: FeatureListItem;
  onEdit: (feature: FeatureListItem) => void;
  onDelete: (feature: FeatureListItem) => void;
  onStatusChange: (feature: FeatureListItem) => void;
  onViewDetails: (feature: FeatureListItem) => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idea':
        return 'bg-gray-100 text-gray-800';
      case 'specification':
        return 'bg-blue-100 text-blue-800';
      case 'development':
        return 'bg-yellow-100 text-yellow-800';
      case 'testing':
        return 'bg-orange-100 text-orange-800';
      case 'live':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const getIndentStyle = () => {
    return {
      paddingLeft: `${feature.hierarchy_level * 16 + 24}px`,
    };
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
      style={feature.hierarchy_level > 0 ? getIndentStyle() : {}}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {feature.hierarchy_level > 0 && (
                <span className="text-xs text-gray-500">
                  {'└ '.repeat(1)}
                </span>
              )}
              <h3 
                className="text-sm font-medium text-gray-900 hover:text-primary-600 cursor-pointer"
                onClick={() => onViewDetails(feature)}
              >
                {feature.title}
              </h3>
            </div>
            
            {feature.parent_title && (
              <p className="text-xs text-gray-500 mb-1">
                Parent: {feature.parent_title}
              </p>
            )}
            
            <p className="text-xs text-gray-600 line-clamp-2">
              {feature.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                feature.status
              )}`}
            >
              {feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                feature.priority
              )}`}
            >
              {feature.priority.charAt(0).toUpperCase() + feature.priority.slice(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-4">
            {feature.assignee && (
              <div>
                <span className="font-medium">Assignee:</span> {feature.assignee.first_name} {feature.assignee.last_name}
              </div>
            )}
            <div>
              <span className="font-medium">Reporter:</span> {feature.reporter.first_name} {feature.reporter.last_name}
            </div>
            {feature.estimated_hours && (
              <div>
                <span className="font-medium">Est:</span> {feature.estimated_hours}h
              </div>
            )}
          </div>
          
          {feature.due_date && (
            <div className={feature.is_overdue ? 'text-red-600 font-medium' : ''}>
              Due: {formatDate(feature.due_date)}
              {feature.is_overdue && ' (Overdue)'}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {feature.progress_percentage > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-12 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary-600 h-1.5 rounded-full"
                    style={{ width: `${feature.progress_percentage}%` }}
                  ></div>
                </div>
                <span>{feature.progress_percentage}%</span>
              </div>
            )}
            
            {feature.sub_features_count > 0 && (
              <span>{feature.sub_features_count} sub-features</span>
            )}
            
            {feature.comments_count > 0 && (
              <span>{feature.comments_count} comments</span>
            )}
            
            {feature.attachments_count > 0 && (
              <span>{feature.attachments_count} attachments</span>
            )}
          </div>

          {feature.can_edit && (
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(feature);
                }}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                Status
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(feature);
                }}
                className="text-primary-600 hover:text-primary-800 text-xs font-medium"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(feature);
                }}
                className="text-red-600 hover:text-red-800 text-xs font-medium"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;