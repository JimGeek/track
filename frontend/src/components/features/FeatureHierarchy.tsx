import React, { useState } from 'react';
import { FeatureListItem } from '../../services/api';

interface FeatureHierarchyProps {
  features: FeatureListItem[];
  onFeatureClick?: (feature: FeatureListItem) => void;
  onCreateSubFeature?: (parentFeature: FeatureListItem) => void;
  showActions?: boolean;
}

interface FeatureTreeNode extends FeatureListItem {
  children: FeatureTreeNode[];
}

const FeatureHierarchy: React.FC<FeatureHierarchyProps> = ({
  features,
  onFeatureClick,
  onCreateSubFeature,
  showActions = true
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure from flat list
  const buildTree = (features: FeatureListItem[]): FeatureTreeNode[] => {
    const nodeMap = new Map<string, FeatureTreeNode>();
    const rootNodes: FeatureTreeNode[] = [];

    // Initialize all nodes
    features.forEach(feature => {
      nodeMap.set(feature.id, { ...feature, children: [] });
    });

    // Build parent-child relationships
    features.forEach(feature => {
      const node = nodeMap.get(feature.id)!;
      if (feature.parent) {
        const parent = nodeMap.get(feature.parent);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent not in current list, treat as root
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort children by order
    const sortChildren = (node: FeatureTreeNode) => {
      node.children.sort((a, b) => a.order - b.order);
      node.children.forEach(sortChildren);
    };

    rootNodes.forEach(sortChildren);
    return rootNodes.sort((a, b) => a.order - b.order);
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'idea': '#9CA3AF',
      'specification': '#3B82F6',
      'development': '#F59E0B',
      'testing': '#8B5CF6',
      'live': '#10B981'
    };
    return colors[status as keyof typeof colors] || '#9CA3AF';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': '#10B981',
      'medium': '#F59E0B',
      'high': '#EF4444',
      'critical': '#DC2626'
    };
    return colors[priority as keyof typeof colors] || '#9CA3AF';
  };

  const renderFeatureNode = (node: FeatureTreeNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indent = level * 24;

    return (
      <div key={node.id} className="feature-node">
        {/* Main Feature Row */}
        <div 
          className="flex items-center py-2 hover:bg-gray-50 border-b border-gray-100"
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          {/* Expand/Collapse Button */}
          <div className="w-6 flex justify-center">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(node.id)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {isExpanded ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ) : (
              <span className="w-4 h-4 flex items-center justify-center">
                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
              </span>
            )}
          </div>

          {/* Feature Content */}
          <div 
            className="flex-1 flex items-center min-w-0 cursor-pointer"
            onClick={() => onFeatureClick?.(node)}
          >
            {/* Status Indicator */}
            <div 
              className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
              style={{ backgroundColor: getStatusColor(node.status) }}
            ></div>

            {/* Title and Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {node.title}
                </h4>
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${getPriorityColor(node.priority)}20`,
                    color: getPriorityColor(node.priority)
                  }}
                >
                  {node.priority}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">
                {node.description}
              </p>
            </div>

            {/* Progress and Stats */}
            <div className="flex items-center gap-4 ml-4">
              {node.progress_percentage > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${node.progress_percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{node.progress_percentage}%</span>
                </div>
              )}

              {node.sub_features_count > 0 && (
                <span className="text-xs text-gray-500">
                  {node.sub_features_count} sub-features
                </span>
              )}

              {node.estimated_hours && (
                <span className="text-xs text-gray-500">
                  {node.estimated_hours}h
                </span>
              )}

              {node.assignee && (
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-700">
                      {node.assignee.first_name[0]}{node.assignee.last_name[0]}
                    </span>
                  </div>
                </div>
              )}

              {node.is_overdue && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                  Overdue
                </span>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-2 ml-4">
                {onCreateSubFeature && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateSubFeature(node);
                    }}
                    className="text-gray-400 hover:text-primary-600 focus:outline-none"
                    title="Add sub-feature"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Children (if expanded) */}
        {hasChildren && isExpanded && (
          <div className="children">
            {node.children.map(child => renderFeatureNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const treeNodes = buildTree(features);

  if (features.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
        <p className="text-gray-500">Create your first feature to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Feature Hierarchy</h3>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{features.length} features total</span>
            <button
              onClick={() => setExpandedNodes(new Set(features.map(f => f.id)))}
              className="text-primary-600 hover:text-primary-800"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="text-primary-600 hover:text-primary-800"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {treeNodes.map(node => renderFeatureNode(node))}
      </div>
    </div>
  );
};

export default FeatureHierarchy;