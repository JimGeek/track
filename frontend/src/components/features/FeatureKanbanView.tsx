import React, { useMemo } from 'react';
import { FeatureListItem } from '../../services/api';
import FeatureCard from './FeatureCard';

interface FeatureKanbanViewProps {
  features: FeatureListItem[];
  onEdit: (feature: FeatureListItem) => void;
  onDelete: (feature: FeatureListItem) => void;
  onStatusChange: (feature: FeatureListItem) => void;
  onViewDetails: (feature: FeatureListItem) => void;
}

const FeatureKanbanView: React.FC<FeatureKanbanViewProps> = ({
  features,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
}) => {
  const statusColumns = useMemo(() => {
    const columns = [
      { id: 'idea', title: 'Ideas', icon: '💡', color: 'from-gray-500 to-gray-600' },
      { id: 'specification', title: 'Specification', icon: '📋', color: 'from-info-500 to-info-600' },
      { id: 'development', title: 'Development', icon: '⚡', color: 'from-warning-500 to-warning-600' },
      { id: 'testing', title: 'Testing', icon: '🧪', color: 'from-orange-500 to-orange-600' },
      { id: 'live', title: 'Live', icon: '🚀', color: 'from-success-500 to-success-600' },
    ];

    return columns.map(column => ({
      ...column,
      features: features.filter(feature => feature.status === column.id)
    }));
  }, [features]);

  return (
    <div className="flex space-x-6 overflow-x-auto pb-4">
      {statusColumns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/60 overflow-hidden"
        >
          {/* Column Header */}
          <div className={`bg-gradient-to-r ${column.color} p-4`}>
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{column.icon}</span>
                <h3 className="font-bold text-lg">{column.title}</h3>
              </div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-bold">
                {column.features.length}
              </div>
            </div>
          </div>

          {/* Column Content */}
          <div className="p-4 space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto">
            {column.features.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl mb-2">{column.icon}</div>
                <p className="text-sm font-medium">No features</p>
              </div>
            ) : (
              column.features.map((feature) => (
                <div key={feature.id} className="transform hover:scale-105 transition-transform duration-200">
                  <FeatureCard
                    feature={feature}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                    onViewDetails={onViewDetails}
                  />
                </div>
              ))
            )}
          </div>

          {/* Add Feature Button */}
          <div className="p-4 border-t border-gray-200/60">
            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-accent-400 hover:text-accent-600 transition-colors duration-200 font-medium">
              + Add Feature
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeatureKanbanView;