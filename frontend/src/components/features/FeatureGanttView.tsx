import React, { useMemo, useState, useCallback, useRef } from 'react';
import { FeatureListItem } from '../../services/api';

interface FeatureGanttViewProps {
  features: FeatureListItem[];
  projectId?: string;
  onFeatureClick?: (feature: FeatureListItem) => void;
  onFeatureUpdate?: (featureId: string, updates: { start_date?: string; end_date?: string }) => void;
}

interface DragState {
  isDragging: boolean;
  featureId: string | null;
  dragType: 'move' | 'resize-left' | 'resize-right' | null;
  startX: number;
  startY: number;
  initialStartPos: number;
  initialWidth: number;
  dragOffset: number;
  isUpdating: boolean;
  clickStartTime: number;
  hasMoved: boolean;
}

interface HierarchicalFeature extends FeatureListItem {
  children: HierarchicalFeature[];
  startPos: number;
  width: number;
  startDate: Date | null;
  endDate: Date | null;
  dueDate: Date | null;
  actualStartDate?: Date | null;
  actualEndDate?: Date | null;
  hasChildren?: boolean;
  isExpanded?: boolean;
}

interface DependencyLine {
  fromFeatureId: string;
  toFeatureId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const FeatureGanttView: React.FC<FeatureGanttViewProps> = ({ 
  features, 
  projectId, 
  onFeatureClick, 
  onFeatureUpdate 
}) => {
  const [hoveredFeature, setHoveredFeature] = useState<FeatureListItem | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(features.map(f => f.id)));
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    featureId: null,
    dragType: null,
    startX: 0,
    startY: 0,
    initialStartPos: 0,
    initialWidth: 0,
    dragOffset: 0,
    isUpdating: false,
    clickStartTime: 0,
    hasMoved: false
  });
  const [cursorStyle, setCursorStyle] = useState<string>('');
  const ganttRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = useCallback((nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  }, [expandedNodes]);

  // Drag and drop helper functions
  const pixelToDate = useCallback((pixelX: number, timelineWidth: number, timeline: Date[]) => {
    if (timeline.length === 0) return new Date();
    
    const timelineStart = timeline[0];
    const timelineEnd = timeline[timeline.length - 1];
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
    const ratio = Math.max(0, Math.min(1, pixelX / timelineWidth));
    const targetTime = timelineStart.getTime() + (totalDuration * ratio);
    
    // Snap to day boundaries
    const date = new Date(targetTime);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const validateDateRange = useCallback((startDate: Date, endDate: Date, timeline: Date[]) => {
    if (timeline.length === 0) return { isValid: true };
    
    const timelineStart = timeline[0];
    const timelineEnd = timeline[timeline.length - 1];
    
    // Ensure start <= end
    if (startDate > endDate) {
      return { isValid: false, error: 'Start date must be before end date' };
    }
    
    // Ensure dates are within timeline bounds (with some buffer)
    const bufferDays = 7;
    const minDate = new Date(timelineStart.getTime() - bufferDays * 24 * 60 * 60 * 1000);
    const maxDate = new Date(timelineEnd.getTime() + bufferDays * 24 * 60 * 60 * 1000);
    
    if (startDate < minDate || endDate > maxDate) {
      return { isValid: false, error: 'Dates are outside project timeline bounds' };
    }
    
    return { isValid: true };
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent, feature: HierarchicalFeature) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onFeatureUpdate || !ganttRef.current) return;
    
    const rect = ganttRef.current.getBoundingClientRect();
    const timelineAreaStart = 320; // Width of sticky feature column
    const relativeX = e.clientX - rect.left - timelineAreaStart;
    
    // Determine drag zone with larger edge zones (15px instead of 8px)
    const barElement = e.currentTarget as HTMLElement;
    const barRect = barElement.getBoundingClientRect();
    const barRelativeX = e.clientX - barRect.left;
    const barWidth = barRect.width;
    const edgeZoneSize = 15; // Increased from 8px to 15px
    
    let dragType: 'move' | 'resize-left' | 'resize-right';
    if (barRelativeX <= edgeZoneSize && barWidth > edgeZoneSize * 2) {
      dragType = 'resize-left';
    } else if (barRelativeX >= barWidth - edgeZoneSize && barWidth > edgeZoneSize * 2) {
      dragType = 'resize-right';
    } else {
      dragType = 'move';
    }
    
    setDragState({
      isDragging: true,
      featureId: feature.id,
      dragType: dragType,
      startX: relativeX,
      startY: e.clientY,
      initialStartPos: feature.startPos,
      initialWidth: feature.width,
      dragOffset: 0,
      isUpdating: false,
      clickStartTime: Date.now(),
      hasMoved: false
    });
    
    // Set appropriate cursor style
    const cursor = dragType === 'move' ? 'grabbing' : 'ew-resize';
    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';
  }, [onFeatureUpdate]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !ganttRef.current) return;
    
    const rect = ganttRef.current.getBoundingClientRect();
    const timelineAreaStart = 320;
    const relativeX = e.clientX - rect.left - timelineAreaStart;
    const rawDragOffset = relativeX - dragState.startX;
    
    // Track movement for click vs drag detection
    const hasMovedThreshold = Math.abs(rawDragOffset) > 3 || Math.abs(e.clientY - dragState.startY) > 3;
    
    // Calculate different offset based on drag type
    let dragOffset = rawDragOffset;
    
    // For resize operations, we need different calculations
    // These offsets will be used for visual feedback and final calculations
    if (dragState.dragType === 'resize-left') {
      // For left resize, offset affects start position only
      dragOffset = rawDragOffset;
    } else if (dragState.dragType === 'resize-right') {
      // For right resize, offset affects end position (width) only
      dragOffset = rawDragOffset;
    } else if (dragState.dragType === 'move') {
      // For move, offset affects entire bar position
      dragOffset = rawDragOffset;
    }
    
    setDragState(prev => ({ 
      ...prev, 
      dragOffset,
      hasMoved: hasMovedThreshold
    }));
  }, [dragState.isDragging, dragState.startX, dragState.startY, dragState.dragType]);

  // We'll define handleDragEnd after ganttData is available

  // Build hierarchical tree structure
  const buildHierarchy = useCallback((features: FeatureListItem[]): HierarchicalFeature[] => {
    const nodeMap = new Map<string, HierarchicalFeature>();
    const rootNodes: HierarchicalFeature[] = [];
    const subFeatures: HierarchicalFeature[] = [];

    // Initialize all nodes
    features.forEach(feature => {
      nodeMap.set(feature.id, { 
        ...feature, 
        children: [],
        startPos: 0,
        width: 0,
        startDate: feature.start_date ? new Date(feature.start_date) : null,
        endDate: feature.end_date ? new Date(feature.end_date) : null,
        dueDate: feature.due_date ? new Date(feature.due_date) : null
      });
    });

    // Separate root features and sub-features
    features.forEach(feature => {
      const node = nodeMap.get(feature.id)!;
      if (feature.hierarchy_level > 0) {
        subFeatures.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Match sub-features to parent features
    subFeatures.forEach(subFeature => {
      let bestParent: HierarchicalFeature | null = null;
      const candidateParents = rootNodes.filter(parent => parent.sub_features_count > 0);
      
      if (candidateParents.length > 0) {
        for (const candidate of candidateParents) {
          if (candidate.children.length < candidate.sub_features_count) {
            bestParent = candidate;
            break;
          }
        }
        
        if (bestParent) {
          bestParent.children.push(subFeature);
        } else {
          rootNodes.push(subFeature);
        }
      } else {
        rootNodes.push(subFeature);
      }
    });

    // Sort children by order
    const sortChildren = (node: HierarchicalFeature) => {
      node.children.sort((a, b) => a.order - b.order);
      node.children.forEach(sortChildren);
    };

    rootNodes.forEach(sortChildren);
    return rootNodes.sort((a, b) => a.order - b.order);
  }, []);

  // Flatten tree for display
  const flattenHierarchy = useCallback((nodes: HierarchicalFeature[], level: number = 0): HierarchicalFeature[] => {
    let result: HierarchicalFeature[] = [];
    
    nodes.forEach(node => {
      const nodeWithLevel = { ...node, hierarchy_level: level };
      result.push(nodeWithLevel);
      
      if (node.children.length > 0 && expandedNodes.has(node.id)) {
        result.push(...flattenHierarchy(node.children, level + 1));
      }
    });

    return result;
  }, [expandedNodes]);

  // Helper function to find a node in hierarchy
  const findNodeInHierarchy = useCallback((node: HierarchicalFeature, id: string): HierarchicalFeature | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNodeInHierarchy(child, id);
      if (found) return found;
    }
    return null;
  }, []);

  // Helper function to check if a node has children
  const hasChildrenInHierarchy = useCallback((hierarchy: HierarchicalFeature, id: string): boolean => {
    const node = findNodeInHierarchy(hierarchy, id);
    return node ? node.children.length > 0 : false;
  }, [findNodeInHierarchy]);

  // Enhanced gantt data calculation with proper date handling
  const ganttData = useMemo(() => {
    if (!features.length) return { timeline: [], items: [], dependencyLines: [] };

    // Build hierarchy and flatten for display
    const hierarchy = buildHierarchy(features);
    const flatFeatures = flattenHierarchy(hierarchy);

    // Enhanced date range calculation
    const now = new Date();
    const allDates = features
      .flatMap(f => [
        f.start_date ? new Date(f.start_date) : null,
        f.end_date ? new Date(f.end_date) : null,
        f.due_date ? new Date(f.due_date) : null
      ])
      .filter(Boolean)
      .sort((a, b) => a!.getTime() - b!.getTime());

    // Add buffer to start and end dates for better visibility
    const buffer = 7 * 24 * 60 * 60 * 1000; // 1 week buffer
    const earliestDate = allDates.length > 0 
      ? new Date(allDates[0]!.getTime() - buffer)
      : new Date(now.getTime() - buffer);
    const latestDate = allDates.length > 0 
      ? new Date(allDates[allDates.length - 1]!.getTime() + buffer)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Generate daily timeline for better granularity
    const timeline: Date[] = [];
    const current = new Date(earliestDate);
    current.setHours(0, 0, 0, 0); // Start of day
    
    while (current <= latestDate) {
      timeline.push(new Date(current));
      current.setDate(current.getDate() + 1); // Daily increments
    }

    // Calculate feature positions with enhanced positioning
    const items: HierarchicalFeature[] = flatFeatures.map(feature => {
      const featureStartDate = feature.start_date ? new Date(feature.start_date) : null;
      const featureEndDate = feature.end_date ? new Date(feature.end_date) : null;
      const dueDate = feature.due_date ? new Date(feature.due_date) : null;
      
      // Enhanced date calculation logic
      let actualStartDate = featureStartDate;
      let actualEndDate = featureEndDate || dueDate;
      
      // Better fallback logic
      if (!actualStartDate && actualEndDate && feature.estimated_hours) {
        const estimatedDays = Math.ceil(feature.estimated_hours / 8);
        actualStartDate = new Date(actualEndDate.getTime() - estimatedDays * 24 * 60 * 60 * 1000);
      } else if (!actualStartDate && !actualEndDate) {
        // If no dates at all, place near current date
        actualStartDate = new Date(now);
        const estimatedDays = feature.estimated_hours ? Math.ceil(feature.estimated_hours / 8) : 7;
        actualEndDate = new Date(now.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
      }
      
      if (!actualEndDate && actualStartDate && feature.estimated_hours) {
        const estimatedDays = Math.ceil(feature.estimated_hours / 8);
        actualEndDate = new Date(actualStartDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
      }
      
      // Calculate positions with better precision
      let startPos = 0;
      let width = 1; // minimum width in percentage
      
      if (actualStartDate && actualEndDate && timeline.length > 0) {
        const timelineStart = timeline[0].getTime();
        const timelineEnd = timeline[timeline.length - 1].getTime();
        const totalDuration = timelineEnd - timelineStart;
        
        if (totalDuration > 0) {
          startPos = Math.max(0, (actualStartDate.getTime() - timelineStart) / totalDuration * 100);
          const endPos = Math.min(100, (actualEndDate.getTime() - timelineStart) / totalDuration * 100);
          width = Math.max(1, endPos - startPos);
        }
      }

      // Find children
      const hierarchyNode = hierarchy.find(node => findNodeInHierarchy(node, feature.id));
      const hasChildren = hierarchyNode ? hasChildrenInHierarchy(hierarchyNode, feature.id) : false;

      return {
        ...feature,
        startPos,
        width,
        startDate: featureStartDate,
        endDate: featureEndDate,
        dueDate,
        actualStartDate,
        actualEndDate,
        hasChildren,
        isExpanded: expandedNodes.has(feature.id)
      };
    });

    // Dependencies removed - no dependency lines needed
    const dependencyLines: DependencyLine[] = [];

    return { timeline, items, dependencyLines };
  }, [features, buildHierarchy, flattenHierarchy, expandedNodes, findNodeInHierarchy, hasChildrenInHierarchy]);

  // Define handleDragEnd after ganttData is available
  const handleDragEnd = useCallback(async (e: MouseEvent) => {
    const resetDragState = () => {
      setDragState({
        isDragging: false,
        featureId: null,
        dragType: null,
        startX: 0,
        startY: 0,
        initialStartPos: 0,
        initialWidth: 0,
        dragOffset: 0,
        isUpdating: false,
        clickStartTime: 0,
        hasMoved: false
      });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (!dragState.isDragging || !dragState.featureId || !onFeatureUpdate || !ganttRef.current) {
      resetDragState();
      return;
    }

    // If it wasn't a real drag (just a click), don't update dates
    if (!dragState.hasMoved) {
      resetDragState();
      return;
    }
    
    const rect = ganttRef.current.getBoundingClientRect();
    const timelineAreaStart = 320;
    const timelineWidth = rect.width - timelineAreaStart;
    
    // Get current feature dates
    const currentFeature = ganttData.items.find(item => item.id === dragState.featureId);
    if (!currentFeature) return;
    
    let newStartDate: Date;
    let newEndDate: Date;
    
    // Calculate new dates based on drag type
    const offsetPercent = (dragState.dragOffset / timelineWidth) * 100;
    
    if (dragState.dragType === 'move') {
      // Move: maintain duration, shift both dates
      const newStartPosPercent = Math.max(0, Math.min(95, dragState.initialStartPos + offsetPercent));
      const newStartPixel = (newStartPosPercent / 100) * timelineWidth;
      const newEndPixel = newStartPixel + (dragState.initialWidth / 100) * timelineWidth;
      
      newStartDate = pixelToDate(newStartPixel, timelineWidth, ganttData.timeline);
      newEndDate = pixelToDate(newEndPixel, timelineWidth, ganttData.timeline);
    } else if (dragState.dragType === 'resize-left') {
      // Resize left: change start date only, keep end date fixed
      const newStartPosPercent = Math.max(0, Math.min(dragState.initialStartPos + dragState.initialWidth - 2, dragState.initialStartPos + offsetPercent));
      const newStartPixel = (newStartPosPercent / 100) * timelineWidth;
      newStartDate = pixelToDate(newStartPixel, timelineWidth, ganttData.timeline);
      
      // Keep end date the same as original
      const originalEndPixel = ((dragState.initialStartPos + dragState.initialWidth) / 100) * timelineWidth;
      newEndDate = pixelToDate(originalEndPixel, timelineWidth, ganttData.timeline);
      
      // Ensure minimum duration (at least 1 day)
      const minEndDate = new Date(newStartDate.getTime() + 1 * 24 * 60 * 60 * 1000);
      if (newEndDate < minEndDate) {
        newEndDate = minEndDate;
      }
    } else if (dragState.dragType === 'resize-right') {
      // Resize right: keep start date fixed, change end date
      const originalStartPixel = (dragState.initialStartPos / 100) * timelineWidth;
      newStartDate = pixelToDate(originalStartPixel, timelineWidth, ganttData.timeline);
      
      // Calculate new end position - extend/shrink from the right
      const newWidth = Math.max(2, dragState.initialWidth + offsetPercent);
      const constrainedWidth = Math.min(newWidth, 100 - dragState.initialStartPos);
      const newEndPixel = ((dragState.initialStartPos + constrainedWidth) / 100) * timelineWidth;
      newEndDate = pixelToDate(newEndPixel, timelineWidth, ganttData.timeline);
      
      // Ensure minimum duration (at least 1 day)
      const minEndDate = new Date(newStartDate.getTime() + 1 * 24 * 60 * 60 * 1000);
      if (newEndDate < minEndDate) {
        newEndDate = minEndDate;
      }
    } else {
      return; // Invalid drag type
    }
    
    // Validate date range
    const validation = validateDateRange(newStartDate, newEndDate, ganttData.timeline);
    if (!validation.isValid) {
      console.error('Invalid date range:', validation.error);
      // Reset drag state
      setDragState({
        isDragging: false,
        featureId: null,
        dragType: null,
        startX: 0,
        startY: 0,
        initialStartPos: 0,
        initialWidth: 0,
        dragOffset: 0,
        isUpdating: false,
        clickStartTime: 0,
        hasMoved: false
      });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      return;
    }
    
    // Set updating state
    setDragState(prev => ({ ...prev, isUpdating: true }));
    
    try {
      // Call API to update feature
      await onFeatureUpdate(dragState.featureId, {
        start_date: newStartDate.toISOString().split('T')[0],
        end_date: newEndDate.toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Failed to update feature dates:', error);
    } finally {
      // Reset drag state
      resetDragState();
    }
  }, [dragState, onFeatureUpdate, pixelToDate, validateDateRange, ganttData.timeline, ganttData.items]);

  // Mouse event listeners for drag and drop
  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    return {
      formatted: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        ...(date.getDate() === 1 && { year: 'numeric' })
      }),
      isToday,
      isWeekend
    };
  };

  // Helper to group timeline dates for header display
  const getTimelineGroups = useMemo(() => {
    const groups: Date[][] = [];
    let currentWeek: Date[] = [];
    
    ganttData.timeline.forEach((date, index) => {
      if (index === 0 || date.getDay() === 1) { // Monday or first date
        if (currentWeek.length > 0) {
          groups.push(currentWeek);
        }
        currentWeek = [date];
      } else {
        currentWeek.push(date);
      }
    });
    
    if (currentWeek.length > 0) {
      groups.push(currentWeek);
    }
    
    return groups;
  }, [ganttData.timeline]);

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
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Project Timeline</h3>
            <p className="text-sm text-gray-600">
              Gantt chart view with enhanced date display. Click bars to view details.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {features.length} features • {ganttData.timeline.length} days
            </span>
            <button
              onClick={() => setExpandedNodes(new Set(features.map(f => f.id)))}
              className="text-primary-600 hover:text-primary-800 transition-colors font-medium"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="text-primary-600 hover:text-primary-800 transition-colors font-medium"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Main Gantt Container with synchronized scrolling */}
      <div className="overflow-auto max-h-[600px]" ref={ganttRef}>
        <div className="flex flex-col min-w-max">
          {/* Enhanced Timeline Header */}
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex">
              {/* Feature column header - sticky left */}
              <div className="sticky left-0 z-40 w-80 p-3 font-bold text-gray-700 border-r border-gray-200 bg-gray-50 shadow-sm">
                <div className="flex items-center justify-between">
                  <span>Feature</span>
                  <div className="flex items-center text-xs text-gray-500 gap-2">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded bg-blue-500"></div>
                      Progress
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Timeline header */}
              <div 
                className="flex bg-gray-50"
                style={{ minWidth: `${Math.max(800, ganttData.timeline.length * 24)}px` }}
              >
                {getTimelineGroups.map((week, weekIndex) => (
                  <div key={weekIndex} className="border-r border-gray-200 last:border-r-0">
                    {/* Week header */}
                    <div className="border-b border-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 text-center bg-gray-100">
                      Week {weekIndex + 1}
                    </div>
                    {/* Daily headers */}
                    <div className="flex">
                      {week.map((date, dayIndex) => {
                        const dateInfo = formatDate(date);
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={`w-6 min-w-[24px] p-1 text-center text-xs border-r border-gray-100 last:border-r-0 ${
                              dateInfo.isToday 
                                ? 'bg-red-100 text-red-800 font-bold' 
                                : dateInfo.isWeekend 
                                ? 'bg-gray-200 text-gray-600' 
                                : 'text-gray-700'
                            }`}
                            title={dateInfo.formatted}
                          >
                            <div className="transform -rotate-90 origin-center text-[10px] leading-none">
                              {date.getDate()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Rows Container */}
          <div className="relative">
            {/* Today marker line */}
            {ganttData.timeline.length > 0 && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none opacity-75"
                style={{
                  left: `${320 + ganttData.timeline.findIndex(date => 
                    date.toDateString() === new Date().toDateString()
                  ) * 24}px`
                }}
              >
                <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                <div className="absolute -top-6 -left-8 text-xs text-red-600 font-bold whitespace-nowrap">
                  Today
                </div>
              </div>
            )}

            {/* Dependency Lines SVG Layer */}
            {ganttData.dependencyLines && ganttData.dependencyLines.length > 0 && (
              <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                style={{ minHeight: `${ganttData.items.length * 56}px` }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 8 3, 0 6"
                      fill="#3b82f6"
                      opacity="0.8"
                    />
                  </marker>
                </defs>
                {ganttData.dependencyLines.map((line, index) => (
                  <g key={`dependency-${index}`}>
                    <path
                      d={`M ${line.fromX - 320} ${line.fromY} L ${line.toX - 320 - 8} ${line.toY}`}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      fill="none"
                      opacity="0.6"
                      markerEnd="url(#arrowhead)"
                      className="hover:opacity-100 transition-opacity"
                      strokeDasharray="5,5"
                    />
                  </g>
                ))}
              </svg>
            )}

            {/* Feature Rows */}
            <div className="divide-y divide-gray-100">
              {ganttData.items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="flex hover:bg-gray-50/50 transition-colors duration-150"
                >
                  {/* Feature Info Column - Sticky Left */}
                  <div 
                    className={`sticky left-0 z-20 w-80 p-3 border-r border-gray-200 flex-shrink-0 cursor-pointer bg-white shadow-sm ${
                      item.hierarchy_level === 0 ? 'bg-gray-50/50' : 'bg-white'
                    }`}
                    onClick={() => onFeatureClick?.(item)}
                  >
                    <div className="flex items-center h-full" style={{ paddingLeft: `${item.hierarchy_level * 16}px` }}>
                      {/* Expand/Collapse Button */}
                      <div className="w-5 flex justify-center mr-2">
                        {item.children.length > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(item.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-0.5"
                          >
                            {expandedNodes.has(item.id) ? (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"/>
                              </svg>
                            )}
                          </button>
                        ) : item.hierarchy_level > 0 ? (
                          <div className="w-3 h-3 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          </div>
                        ) : null}
                      </div>

                      {/* Feature Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`text-sm truncate leading-tight ${
                            item.hierarchy_level === 0 
                              ? 'font-semibold text-gray-900' 
                              : 'font-medium text-gray-700'
                          }`}>
                            {item.title}
                          </h4>
                          {item.sub_features_count > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                              {item.sub_features_count}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3 text-xs">
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`}></div>
                            <span className="text-gray-600 capitalize">{item.status}</span>
                          </div>
                          
                          {item.assignee && (
                            <span className="text-gray-500 truncate max-w-20">
                              {item.assignee.first_name}
                            </span>
                          )}
                          
                          {item.progress_percentage > 0 && (
                            <span className="text-blue-600 font-medium">
                              {item.progress_percentage}%
                            </span>
                          )}
                          
                          {item.estimated_hours && (
                            <span className="text-gray-500">
                              {item.estimated_hours}h
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Column */}
                  <div 
                    className="relative flex items-center h-14"
                    style={{ minWidth: `${Math.max(800, ganttData.timeline.length * 24)}px` }}
                  >
                    {/* Feature Bar */}
                    {(item.actualStartDate || item.actualEndDate) && (
                      <div
                        className={`absolute rounded-lg ${getStatusColor(item.status)} ${getPriorityColor(item.priority)} 
                          border-l-4 shadow-sm transition-all duration-200 flex items-center px-2 group
                          hover:shadow-md ${!dragState.isDragging ? 'hover:scale-105' : ''}
                          ${item.hierarchy_level === 0 ? 'h-8' : 'h-6'}
                          ${dragState.isDragging && dragState.featureId === item.id ? 'opacity-80 scale-105 shadow-lg z-30' : ''}
                          ${dragState.isUpdating && dragState.featureId === item.id ? 'animate-pulse' : ''}
                          ${cursorStyle ? cursorStyle : (onFeatureUpdate ? 'cursor-grab' : 'cursor-pointer')}
                        `}
                        style={(() => {
                          if (dragState.isDragging && dragState.featureId === item.id) {
                            const timelineWidth = Math.max(800, ganttData.timeline.length * 24);
                            const offsetPercent = (dragState.dragOffset / timelineWidth) * 100;
                            
                            if (dragState.dragType === 'move') {
                              const newStartPos = Math.max(0, Math.min(95, item.startPos + offsetPercent));
                              return {
                                left: `${newStartPos}%`,
                                width: `${Math.max(item.width, 2)}%`,
                                minWidth: '32px'
                              };
                            } else if (dragState.dragType === 'resize-left') {
                              const newStartPos = Math.max(0, Math.min(item.startPos + item.width - 2, item.startPos + offsetPercent));
                              const newWidth = Math.max(2, item.width - (newStartPos - item.startPos));
                              return {
                                left: `${newStartPos}%`,
                                width: `${newWidth}%`,
                                minWidth: '32px'
                              };
                            } else if (dragState.dragType === 'resize-right') {
                              const newWidth = Math.max(2, item.width + offsetPercent);
                              return {
                                left: `${item.startPos}%`,
                                width: `${Math.min(newWidth, 100 - item.startPos)}%`,
                                minWidth: '32px'
                              };
                            }
                          }
                          
                          return {
                            left: `${item.startPos}%`,
                            width: `${Math.max(item.width, 2)}%`,
                            minWidth: '32px'
                          };
                        })()}
                        onMouseEnter={(e) => {
                          if (!dragState.isDragging) {
                            setHoveredFeature(item);
                            setTooltipPosition({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseLeave={() => {
                          if (!dragState.isDragging) {
                            setHoveredFeature(null);
                            setCursorStyle('');
                          }
                        }}
                        onMouseMove={(e) => {
                          if (hoveredFeature && hoveredFeature.id === item.id && !dragState.isDragging) {
                            setTooltipPosition({ x: e.clientX, y: e.clientY });
                            
                            if (onFeatureUpdate) {
                              const barElement = e.currentTarget as HTMLElement;
                              const barRect = barElement.getBoundingClientRect();
                              const barRelativeX = e.clientX - barRect.left;
                              const barWidth = barRect.width;
                              const edgeZoneSize = 15;
                              
                              let dragZone: 'left' | 'right' | 'middle';
                              if (barRelativeX <= edgeZoneSize && barWidth > edgeZoneSize * 2) {
                                dragZone = 'left';
                              } else if (barRelativeX >= barWidth - edgeZoneSize && barWidth > edgeZoneSize * 2) {
                                dragZone = 'right';
                              } else {
                                dragZone = 'middle';
                              }
                              
                              if (dragZone === 'left' || dragZone === 'right') {
                                setCursorStyle('cursor-ew-resize');
                              } else {
                                setCursorStyle('cursor-grab');
                              }
                            } else {
                              setCursorStyle('cursor-pointer');
                            }
                          }
                        }}
                        onMouseDown={(e) => {
                          if (onFeatureUpdate && e.button === 0) {
                            handleDragStart(e, item);
                          }
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          if (!dragState.hasMoved && !dragState.isDragging && onFeatureClick) {
                            setTimeout(() => {
                              if (!dragState.hasMoved) {
                                onFeatureClick(item);
                              }
                            }, 10);
                          }
                        }}
                      >
                        {/* Progress indicator within bar */}
                        {item.progress_percentage > 0 && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-white bg-opacity-30 rounded-l-lg"
                            style={{ width: `${item.progress_percentage}%` }}
                          />
                        )}
                        
                        {/* Feature title */}
                        <span className={`text-white text-xs truncate leading-none ${
                          item.hierarchy_level === 0 ? 'font-semibold' : 'font-medium'
                        }`}>
                          {item.title.length > 20 
                            ? `${item.title.substring(0, 20)}...` 
                            : item.title}
                        </span>
                        
                        {/* Drag indicator */}
                        {onFeatureUpdate && (
                          <div className="absolute inset-0 flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="text-white text-xs">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6L6 10l4 4 4-4-4-4z"/>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-0.5 h-4 bg-red-500"></div>
            <span className="text-gray-600">Today</span>
          </div>
          
          {onFeatureUpdate && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6L6 10l4 4 4-4-4-4z"/>
                </svg>
                <span className="text-gray-600">Drag middle to move</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 10h14M3 10l4-4m-4 4l4 4"/>
                </svg>
                <span className="text-gray-600">Drag edges to resize</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Status:</span>
            {[
              { status: 'idea', color: 'bg-gray-500', label: 'Idea' },
              { status: 'specification', color: 'bg-info-500', label: 'Spec' },
              { status: 'development', color: 'bg-warning-500', label: 'Dev' },
              { status: 'testing', color: 'bg-orange-500', label: 'Test' },
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

      {/* Enhanced Tooltip */}
      {hoveredFeature && !dragState.isDragging && (
        <div
          className="fixed z-50 bg-gray-900 text-white p-4 rounded-lg shadow-xl border border-gray-700 max-w-xs pointer-events-none"
          style={{
            left: `${Math.min(tooltipPosition.x + 10, window.innerWidth - 300)}px`,
            top: `${Math.max(tooltipPosition.y - 120, 10)}px`,
          }}
        >
          <div className="font-bold text-sm mb-3 text-white">
            {hoveredFeature.title}
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-300">Status:</span>
                <div className="flex items-center space-x-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(hoveredFeature.status)}`}></div>
                  <span className="capitalize text-white">{hoveredFeature.status}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-300">Priority:</span>
                <div className="capitalize text-white mt-1">{hoveredFeature.priority}</div>
              </div>
            </div>
            
            {hoveredFeature.assignee && (
              <div>
                <span className="text-gray-300">Assignee:</span>
                <div className="text-white mt-1">{hoveredFeature.assignee.first_name} {hoveredFeature.assignee.last_name}</div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              {hoveredFeature.estimated_hours && (
                <div>
                  <span className="text-gray-300">Effort:</span>
                  <div className="text-white mt-1">{hoveredFeature.estimated_hours}h</div>
                </div>
              )}
              {hoveredFeature.progress_percentage > 0 && (
                <div>
                  <span className="text-gray-300">Progress:</span>
                  <div className="text-white mt-1">{hoveredFeature.progress_percentage}%</div>
                </div>
              )}
            </div>
            
            {(hoveredFeature.start_date || hoveredFeature.end_date) && (
              <div className="pt-2 border-t border-gray-600">
                {hoveredFeature.start_date && (
                  <div className="mb-1">
                    <span className="text-gray-300">Start:</span>
                    <span className="text-white ml-2">
                      {new Date(hoveredFeature.start_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {hoveredFeature.end_date && (
                  <div>
                    <span className="text-gray-300">End:</span>
                    <span className="text-white ml-2">
                      {new Date(hoveredFeature.end_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-600 italic">
            {onFeatureUpdate 
              ? 'Click to view details • Drag middle to move • Drag edges to resize' 
              : 'Click to view details'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureGanttView;