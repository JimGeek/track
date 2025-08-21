# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-21-visual-timeline-chart-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Technical Requirements

### Frontend Architecture
- **Timeline Library**: Vis.js Timeline for interactive timeline rendering
- **Chart Rendering**: D3.js for custom Gantt chart implementations
- **Canvas/SVG**: HTML5 Canvas for high-performance rendering of large datasets
- **Drag & Drop**: React DnD for timeline item manipulation
- **Zoom & Pan**: Custom zoom controls with smooth animations and viewport management

### Backend Architecture
- **Timeline Engine**: Efficient date range queries and overlap detection algorithms
- **Conflict Detection**: Automated analysis of resource and timeline conflicts
- **Data Processing**: Optimized queries for timeline data aggregation
- **Real-time Updates**: WebSocket integration for collaborative timeline editing
- **Export Service**: Server-side chart rendering for PDF/PNG export generation

### Performance Requirements
- **Rendering**: Handle 1000+ timeline items with smooth interactions
- **Memory**: Efficient memory usage with virtualization for large timelines
- **Response Time**: Timeline loading under 2 seconds for complex projects
- **Scroll Performance**: 60fps smooth scrolling and zooming
- **Conflict Detection**: Real-time conflict analysis with sub-second response

## Approach

### Timeline Data Models
```python
class TimelineItem(models.Model):
    ITEM_TYPES = [
        ('feature', 'Feature'),
        ('milestone', 'Milestone'),
        ('project', 'Project'),
        ('task', 'Task'),
    ]
    
    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    title = models.CharField(max_length=200)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    duration_days = models.IntegerField()
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    color_code = models.CharField(max_length=7, default='#3498db')
    
    # Relationships
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='timeline_items')
    assigned_to = models.ManyToManyField(User, blank=True)
    depends_on = models.ManyToManyField('self', symmetrical=False, blank=True)
    
    # Position and display
    row_position = models.IntegerField(default=0)
    is_milestone = models.BooleanField(default=False)
    is_critical_path = models.BooleanField(default=False)

class TimelineConflict(models.Model):
    CONFLICT_TYPES = [
        ('overlap', 'Schedule Overlap'),
        ('resource', 'Resource Conflict'),
        ('dependency', 'Dependency Violation'),
    ]
    
    conflict_type = models.CharField(max_length=20, choices=CONFLICT_TYPES)
    item1 = models.ForeignKey(TimelineItem, on_delete=models.CASCADE, related_name='conflicts_as_item1')
    item2 = models.ForeignKey(TimelineItem, on_delete=models.CASCADE, related_name='conflicts_as_item2')
    severity = models.CharField(max_length=10, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')])
    description = models.TextField()
    suggested_resolution = models.TextField()
    is_resolved = models.BooleanField(default=False)
```

### React Timeline Component Architecture
```javascript
// Main timeline container component
const TimelineChart = ({ projectIds, dateRange, viewMode = 'gantt' }) => {
  const [timelineData, setTimelineData] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [viewConfig, setViewConfig] = useState({
    zoomLevel: 'week',
    showDependencies: true,
    showConflicts: true
  });
  
  const timelineRef = useRef(null);
  
  useEffect(() => {
    loadTimelineData();
    detectConflicts();
  }, [projectIds, dateRange]);
  
  const handleItemDrop = useCallback((item, newStart, newEnd) => {
    updateTimelineItem(item.id, { start_date: newStart, end_date: newEnd });
    detectConflictsForItem(item.id);
  }, []);
  
  return (
    <TimelineContainer>
      <TimelineControls 
        viewConfig={viewConfig}
        onConfigChange={setViewConfig}
        onExport={handleExport}
      />
      <GanttChart
        ref={timelineRef}
        items={timelineData}
        conflicts={conflicts}
        viewConfig={viewConfig}
        onItemMove={handleItemDrop}
        onItemSelect={handleItemSelect}
      />
      <ConflictPanel 
        conflicts={conflicts}
        onResolve={handleConflictResolve}
      />
    </TimelineContainer>
  );
};

// Custom Gantt chart implementation
const GanttChart = forwardRef(({ items, conflicts, viewConfig, onItemMove }, ref) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    renderGanttChart(svg, items, conflicts, viewConfig, dimensions);
  }, [items, conflicts, viewConfig, dimensions]);
  
  return (
    <div className="gantt-chart-container">
      <svg 
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="gantt-svg"
      />
      <ZoomControls onZoom={handleZoom} onPan={handlePan} />
    </div>
  );
});
```

### Timeline Rendering Engine
```javascript
class TimelineRenderer {
  constructor(svgElement, options = {}) {
    this.svg = d3.select(svgElement);
    this.options = {
      rowHeight: 40,
      timeScale: 'week',
      showDependencies: true,
      ...options
    };
    
    this.xScale = d3.scaleTime();
    this.yScale = d3.scaleBand();
  }
  
  render(data) {
    this.setupScales(data);
    this.renderGrid();
    this.renderTimelineItems(data.items);
    this.renderDependencies(data.dependencies);
    this.renderConflicts(data.conflicts);
  }
  
  setupScales(data) {
    const timeExtent = d3.extent(data.items.flatMap(item => [item.start_date, item.end_date]));
    this.xScale.domain(timeExtent).range([0, this.options.width]);
    
    const rows = [...new Set(data.items.map(item => item.row_position))];
    this.yScale.domain(rows).range([0, rows.length * this.options.rowHeight]);
  }
  
  renderTimelineItems(items) {
    const itemGroups = this.svg.selectAll('.timeline-item')
      .data(items)
      .enter()
      .append('g')
      .attr('class', 'timeline-item')
      .attr('transform', d => `translate(0, ${this.yScale(d.row_position)})`);
    
    // Render item bars
    itemGroups.append('rect')
      .attr('class', 'item-bar')
      .attr('x', d => this.xScale(new Date(d.start_date)))
      .attr('width', d => this.xScale(new Date(d.end_date)) - this.xScale(new Date(d.start_date)))
      .attr('height', this.options.rowHeight - 4)
      .attr('fill', d => d.color_code)
      .attr('rx', 4);
    
    // Add progress overlay
    itemGroups.append('rect')
      .attr('class', 'progress-overlay')
      .attr('x', d => this.xScale(new Date(d.start_date)))
      .attr('width', d => (this.xScale(new Date(d.end_date)) - this.xScale(new Date(d.start_date))) * (d.progress_percentage / 100))
      .attr('height', this.options.rowHeight - 4)
      .attr('fill', 'rgba(0,0,0,0.3)')
      .attr('rx', 4);
  }
  
  renderDependencies(dependencies) {
    if (!this.options.showDependencies) return;
    
    const linkGenerator = d3.linkHorizontal()
      .x(d => d.x)
      .y(d => d.y);
    
    this.svg.selectAll('.dependency-link')
      .data(dependencies)
      .enter()
      .append('path')
      .attr('class', 'dependency-link')
      .attr('d', d => linkGenerator({
        source: { x: this.xScale(new Date(d.source.end_date)), y: this.yScale(d.source.row_position) + this.options.rowHeight/2 },
        target: { x: this.xScale(new Date(d.target.start_date)), y: this.yScale(d.target.row_position) + this.options.rowHeight/2 }
      }))
      .attr('stroke', '#666')
      .attr('stroke-width', 2)
      .attr('fill', 'none');
  }
}
```

### Conflict Detection Service
```python
class TimelineConflictService:
    @staticmethod
    def detect_all_conflicts(project_ids=None):
        """Detect all types of conflicts in timeline"""
        conflicts = []
        timeline_items = TimelineItem.objects.filter(project_id__in=project_ids) if project_ids else TimelineItem.objects.all()
        
        # Detect schedule overlaps
        conflicts.extend(TimelineConflictService._detect_schedule_overlaps(timeline_items))
        
        # Detect resource conflicts
        conflicts.extend(TimelineConflictService._detect_resource_conflicts(timeline_items))
        
        # Detect dependency violations
        conflicts.extend(TimelineConflictService._detect_dependency_violations(timeline_items))
        
        return conflicts
    
    @staticmethod
    def _detect_schedule_overlaps(items):
        """Find items with overlapping schedules for same resources"""
        conflicts = []
        
        for i, item1 in enumerate(items):
            for item2 in items[i+1:]:
                # Check if items have overlapping time ranges and shared resources
                if TimelineConflictService._has_time_overlap(item1, item2):
                    shared_resources = set(item1.assigned_to.all()) & set(item2.assigned_to.all())
                    if shared_resources:
                        conflicts.append({
                            'type': 'overlap',
                            'item1': item1,
                            'item2': item2,
                            'severity': 'high' if len(shared_resources) > 1 else 'medium',
                            'description': f'Resource conflict: {[u.username for u in shared_resources]}',
                            'suggested_resolution': 'Adjust schedules or reassign resources'
                        })
        
        return conflicts
    
    @staticmethod
    def _has_time_overlap(item1, item2):
        """Check if two timeline items have overlapping time periods"""
        return not (item1.end_date <= item2.start_date or item2.end_date <= item1.start_date)
    
    @staticmethod
    def suggest_resolution(conflict):
        """Generate resolution suggestions for conflicts"""
        if conflict.conflict_type == 'overlap':
            return TimelineConflictService._suggest_overlap_resolution(conflict)
        elif conflict.conflict_type == 'resource':
            return TimelineConflictService._suggest_resource_resolution(conflict)
        elif conflict.conflict_type == 'dependency':
            return TimelineConflictService._suggest_dependency_resolution(conflict)
```

### Export Service
```python
class TimelineExportService:
    @staticmethod
    def export_to_pdf(timeline_data, export_options):
        """Generate PDF export of timeline chart"""
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
        
        # Generate timeline visualization
        timeline_image = TimelineExportService._generate_timeline_image(timeline_data, export_options)
        
        # Build PDF content
        story = []
        story.append(timeline_image)
        
        doc.build(story)
        return buffer.getvalue()
    
    @staticmethod
    def _generate_timeline_image(timeline_data, options):
        """Generate timeline image using headless browser"""
        # Implementation would use tools like Puppeteer or Playwright
        # to render the timeline as an image
        pass
```

## External Dependencies

- **Vis.js Timeline**: Interactive timeline library with built-in zoom and pan
- **D3.js**: Custom chart rendering and data visualization
- **React DnD**: Drag and drop functionality for timeline editing
- **Puppeteer/Playwright**: Headless browser for server-side chart export
- **ReportLab**: PDF generation for timeline exports
- **Canvas API**: High-performance rendering for large datasets