import React, { useMemo, useState } from 'react';
import { FeatureListItem } from '../../services/api';

interface FeatureGanttViewProps {
  features: FeatureListItem[];
  projectId?: string;
  onFeatureClick?: (feature: FeatureListItem) => void;
}

const FeatureGanttView: React.FC<FeatureGanttViewProps> = ({ features, projectId, onFeatureClick }) => {
  const [hoveredFeature, setHoveredFeature] = useState<FeatureListItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const ganttData = useMemo(() => {
    if (!features.length) return { timeline: [], items: [] };

    // Get date range
    const now = new Date();
    const dates = features
      .map(f => f.due_date ? new Date(f.due_date) : null)
      .filter(Boolean)
      .sort((a, b) => a!.getTime() - b!.getTime());

    const startDate = dates.length > 0 ? dates[0]! : now;
    const endDate = dates.length > 0 ? dates[dates.length - 1]! : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Generate timeline (weeks)
    const timeline = [];
    const current = new Date(startDate);
    current.setDate(current.getDate() - current.getDay()); // Start from Sunday

    while (current <= endDate) {
      timeline.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }

    // Calculate feature positions
    const items = features.map(feature => {
      const dueDate = feature.due_date ? new Date(feature.due_date) : null;
      const estimatedDays = feature.estimated_hours ? Math.ceil(feature.estimated_hours / 8) : 7;
      const startPos = dueDate ? 
        Math.max(0, (dueDate.getTime() - estimatedDays * 24 * 60 * 60 * 1000 - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) : 0;
      const duration = estimatedDays / 7;

      return {
        ...feature,
        startPos: startPos * 100 / timeline.length,
        width: Math.max(duration * 100 / timeline.length, 5),
        dueDate
      };
    });

    return { timeline, items };
  }, [features]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idea':
        return 'bg-gray-500';
      case 'specification':
        return 'bg-info-500';
      case 'development':
        return 'bg-warning-500';
      case 'testing':
        return 'bg-orange-500';
      case 'live':
        return 'bg-success-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-danger-500';
      case 'high':
        return 'border-warning-500';
      case 'medium':
        return 'border-yellow-500';
      case 'low':
        return 'border-success-500';
      default:
        return 'border-gray-400';
    }
  };

  const formatWeek = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  if (!features.length) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Features to Display</h3>
        <p className="text-gray-600">Add features to see the Gantt chart timeline.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Project Timeline</h3>
        <p className="text-sm text-gray-600">Gantt chart view of features and their timelines</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1200px] flex flex-col">
          {/* Timeline Header */}
          <div className="flex bg-gray-50 border-b border-gray-200">
            <div className="w-80 p-4 font-bold text-gray-700 border-r border-gray-200 flex-shrink-0">
              Feature
            </div>
            <div className="flex min-w-[800px]">
              {ganttData.timeline.map((week, index) => (
                <div
                  key={index}
                  className="w-24 p-2 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0 flex-shrink-0"
                >
                  {formatWeek(week)}
                </div>
              ))}
            </div>
          </div>

          {/* Feature Rows Container with Today Marker */}
          <div className="relative">
            {/* Today marker - spans all rows but only within timeline area */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-danger-500 z-20 pointer-events-none"
              style={{
                left: `${320 + Math.max(0, Math.min(800, ((new Date().getTime() - ganttData.timeline[0]?.getTime() || 0) / (7 * 24 * 60 * 60 * 1000)) * 800 / ganttData.timeline.length))}px`
              }}
            >
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-danger-500 rounded-full"></div>
            </div>
            
            {/* Feature Rows */}
            <div className="divide-y divide-gray-200">
              {ganttData.items.map((item, index) => (
                <div key={item.id} className="flex hover:bg-gray-50 transition-colors duration-150">
                  {/* Feature Info */}
                  <div className="w-80 p-4 border-r border-gray-200 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                      {item.hierarchy_level > 0 && (
                        <div className="flex items-center text-accent-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-block w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></span>
                          <span className="text-xs text-gray-500">{item.status}</span>
                          {item.assignee && (
                            <span className="text-xs text-gray-500">
                              • {item.assignee.first_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative h-16 flex items-center min-w-[800px]">
                    {item.dueDate && (
                      <div
                        className={`absolute h-6 rounded-md ${getStatusColor(item.status)} ${getPriorityColor(item.priority)} border-l-4 opacity-80 hover:opacity-100 transition-all duration-200 flex items-center px-2 cursor-pointer hover:scale-105 hover:shadow-lg`}
                        style={{
                          left: `${item.startPos}%`,
                          width: `${item.width}%`,
                          minWidth: '80px'
                        }}
                        onMouseEnter={(e) => {
                          setHoveredFeature(item);
                          setTooltipPosition({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredFeature(null)}
                        onMouseMove={(e) => {
                          if (hoveredFeature) {
                            setTooltipPosition({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onClick={() => onFeatureClick?.(item)}
                      >
                        <span className="text-white text-xs font-medium truncate">
                          {item.title.length > 12 ? `${item.title.substring(0, 12)}...` : item.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-0.5 h-4 bg-danger-500"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Status:</span>
            {[
              { status: 'idea', color: 'bg-gray-500', label: 'Idea' },
              { status: 'development', color: 'bg-warning-500', label: 'Development' },
              { status: 'live', color: 'bg-success-500', label: 'Live' }
            ].map(({ status, color, label }) => (
              <div key={status} className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded ${color}`}></div>
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredFeature && (
        <div
          className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700 max-w-sm pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 80}px`,
          }}
        >
          <div className="font-bold text-sm mb-2">{hoveredFeature.title}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className="capitalize">{hoveredFeature.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Priority:</span>
              <span className="capitalize">{hoveredFeature.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Effort:</span>
              <span>{hoveredFeature.estimated_hours || 0}h</span>
            </div>
            {hoveredFeature.assignee && (
              <div className="flex justify-between">
                <span className="text-gray-300">Assignee:</span>
                <span>{hoveredFeature.assignee.first_name}</span>
              </div>
            )}
            {hoveredFeature.due_date && (
              <div className="flex justify-between">
                <span className="text-gray-300">Due:</span>
                <span>{new Date(hoveredFeature.due_date).toLocaleDateString()}</span>
              </div>
            )}
            {hoveredFeature.progress_percentage > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-300">Progress:</span>
                <span>{hoveredFeature.progress_percentage}%</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-2 italic">
            Click to view details
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureGanttView;