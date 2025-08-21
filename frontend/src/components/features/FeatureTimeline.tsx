import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FeatureListItem, WorkflowHistory } from '../../services/api';
import apiService from '../../services/api';

interface TimelineEvent {
  id: string;
  type: 'feature_created' | 'status_changed' | 'assigned' | 'due_date' | 'completed';
  title: string;
  description: string;
  date: string;
  feature: FeatureListItem;
  user?: string;
  metadata?: Record<string, any>;
}

interface FeatureTimelineProps {
  projectId?: string;
  featureId?: string;
  limit?: number;
  showFilters?: boolean;
}

const FeatureTimeline: React.FC<FeatureTimelineProps> = ({
  projectId,
  featureId,
  limit = 50,
  showFilters = true
}) => {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['feature_created', 'status_changed', 'assigned', 'completed']));
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch features
  const { data: featuresData } = useQuery({
    queryKey: ['features', { project: projectId }],
    queryFn: () => apiService.getFeatures({ project: projectId }),
  });

  // Fetch workflow history
  const { data: historyData } = useQuery({
    queryKey: ['workflow-history', { entity_type: 'feature', entity_id: featureId }],
    queryFn: () => apiService.getWorkflowHistory({
      entity_type: 'feature',
      entity_id: featureId
    }),
    enabled: !!featureId
  });

  const features = featuresData?.data?.results || [];
  const workflowHistory = historyData?.data?.results || [];

  // Generate timeline events
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add feature creation events
    features.forEach(feature => {
      events.push({
        id: `feature-created-${feature.id}`,
        type: 'feature_created',
        title: 'Feature Created',
        description: `"${feature.title}" was created`,
        date: feature.created_at,
        feature,
        user: feature.reporter.first_name + ' ' + feature.reporter.last_name
      });

      // Add assignment events
      if (feature.assignee) {
        events.push({
          id: `feature-assigned-${feature.id}`,
          type: 'assigned',
          title: 'Feature Assigned',
          description: `"${feature.title}" was assigned to ${feature.assignee.first_name} ${feature.assignee.last_name}`,
          date: feature.updated_at,
          feature,
        });
      }

      // Add completion events
      if (feature.is_completed && feature.completed_date) {
        events.push({
          id: `feature-completed-${feature.id}`,
          type: 'completed',
          title: 'Feature Completed',
          description: `"${feature.title}" was completed`,
          date: feature.completed_date,
          feature,
        });
      }

      // Add due date events for overdue items
      if (feature.is_overdue && feature.due_date) {
        events.push({
          id: `feature-overdue-${feature.id}`,
          type: 'due_date',
          title: 'Feature Overdue',
          description: `"${feature.title}" is overdue`,
          date: feature.due_date,
          feature,
        });
      }
    });

    // Add workflow history events
    workflowHistory.forEach(history => {
      const feature = features.find(f => f.id === history.entity_id);
      if (feature) {
        events.push({
          id: `status-change-${history.id}`,
          type: 'status_changed',
          title: 'Status Changed',
          description: `"${feature.title}" moved from ${history.from_state_name || 'initial'} to ${history.to_state_name}`,
          date: history.created_at,
          feature,
          user: history.changed_by_name,
          metadata: history.metadata
        });
      }
    });

    // Filter by selected types
    const filteredEvents = events.filter(event => selectedTypes.has(event.type));

    // Filter by date range
    const now = new Date();
    const dateFilteredEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      switch (dateRange) {
        case '7d':
          return (now.getTime() - eventDate.getTime()) <= (7 * 24 * 60 * 60 * 1000);
        case '30d':
          return (now.getTime() - eventDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);
        case '90d':
          return (now.getTime() - eventDate.getTime()) <= (90 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    });

    // Sort by date (newest first)
    return dateFilteredEvents
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [features, workflowHistory, selectedTypes, dateRange, limit]);

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'feature_created':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'status_changed':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      case 'assigned':
        return (
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'due_date':
        return (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const toggleEventType = (type: string) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {featureId ? 'Feature Timeline' : 'Project Timeline'}
          </h3>
          <div className="text-sm text-gray-500">
            {timelineEvents.length} events
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 space-y-3">
            {/* Event Type Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Types</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { type: 'feature_created', label: 'Created', color: 'bg-green-100 text-green-800' },
                  { type: 'status_changed', label: 'Status Changed', color: 'bg-blue-100 text-blue-800' },
                  { type: 'assigned', label: 'Assigned', color: 'bg-purple-100 text-purple-800' },
                  { type: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
                  { type: 'due_date', label: 'Due/Overdue', color: 'bg-red-100 text-red-800' },
                ].map(({ type, label, color }) => (
                  <button
                    key={type}
                    onClick={() => toggleEventType(type)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedTypes.has(type)
                        ? color
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
              <div className="flex gap-2">
                {[
                  { range: '7d', label: '7 days' },
                  { range: '30d', label: '30 days' },
                  { range: '90d', label: '90 days' },
                  { range: 'all', label: 'All time' },
                ].map(({ range, label }) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range as any)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      dateRange === range
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="p-6">
        {timelineEvents.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more events.</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {timelineEvents.map((event, eventIndex) => (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {eventIndex !== timelineEvents.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">{event.title}</p>
                            <span 
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: getStatusColor(event.feature.status) }}
                            ></span>
                            <span className="text-xs text-gray-500 capitalize">
                              {event.feature.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{event.description}</p>
                          {event.user && (
                            <p className="text-xs text-gray-400 mt-1">by {event.user}</p>
                          )}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <div>{formatDate(event.date)}</div>
                          <div className="text-xs text-gray-400">
                            {event.feature.project_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeatureTimeline;