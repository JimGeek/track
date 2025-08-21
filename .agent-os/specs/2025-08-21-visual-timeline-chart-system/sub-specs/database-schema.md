# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-visual-timeline-chart-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### New Tables

#### TimelineItem
```sql
CREATE TABLE timeline_items (
    id SERIAL PRIMARY KEY,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('feature', 'milestone', 'project', 'task')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration_days INTEGER GENERATED ALWAYS AS (EXTRACT(days FROM (end_date - start_date))) STORED,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    color_code VARCHAR(7) DEFAULT '#3498db',
    
    -- Relationships
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    feature_request_id INTEGER REFERENCES feature_requests(id) ON DELETE CASCADE,
    parent_timeline_item_id INTEGER REFERENCES timeline_items(id) ON DELETE SET NULL,
    
    -- Display properties
    row_position INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_milestone BOOLEAN DEFAULT FALSE,
    is_critical_path BOOLEAN DEFAULT FALSE,
    is_collapsed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    
    CONSTRAINT valid_date_range CHECK (start_date < end_date),
    CONSTRAINT milestone_duration CHECK (NOT is_milestone OR (end_date - start_date) <= INTERVAL '1 day')
);
```

#### TimelineItemAssignment
```sql
CREATE TABLE timeline_item_assignments (
    id SERIAL PRIMARY KEY,
    timeline_item_id INTEGER NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'assignee',
    allocation_percentage DECIMAL(5,2) DEFAULT 100.00 CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_timeline_user_assignment UNIQUE (timeline_item_id, user_id),
    CONSTRAINT valid_assignment_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);
```

#### TimelineItemDependency
```sql
CREATE TABLE timeline_item_dependencies (
    id SERIAL PRIMARY KEY,
    predecessor_id INTEGER NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    successor_id INTEGER NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'finish_to_start' CHECK (
        dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')
    ),
    lag_days INTEGER DEFAULT 0,
    is_critical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT no_self_dependency CHECK (predecessor_id != successor_id),
    CONSTRAINT unique_dependency UNIQUE (predecessor_id, successor_id, dependency_type)
);
```

#### TimelineConflict
```sql
CREATE TABLE timeline_conflicts (
    id SERIAL PRIMARY KEY,
    conflict_type VARCHAR(20) NOT NULL CHECK (conflict_type IN ('overlap', 'resource', 'dependency', 'constraint')),
    severity VARCHAR(10) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Items involved in conflict
    primary_item_id INTEGER NOT NULL REFERENCES timeline_items(id) ON DELETE CASCADE,
    secondary_item_id INTEGER REFERENCES timeline_items(id) ON DELETE CASCADE,
    
    -- Conflict details
    description TEXT NOT NULL,
    suggested_resolution TEXT,
    impact_assessment TEXT,
    
    -- Resolution tracking
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by_id INTEGER REFERENCES users(id),
    resolution_notes TEXT,
    
    -- Conflict detection metadata
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    auto_resolved BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### TimelineView
```sql
CREATE TABLE timeline_views (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- View owner and sharing
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- View configuration
    view_config JSONB NOT NULL DEFAULT '{}',
    filter_config JSONB DEFAULT '{}',
    layout_config JSONB DEFAULT '{}',
    
    -- Date range settings
    date_range_type VARCHAR(20) DEFAULT 'custom' CHECK (
        date_range_type IN ('custom', 'current_month', 'current_quarter', 'current_year', 'project_duration')
    ),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    
    -- Display settings
    zoom_level VARCHAR(20) DEFAULT 'week' CHECK (zoom_level IN ('day', 'week', 'month', 'quarter')),
    row_height INTEGER DEFAULT 40,
    show_dependencies BOOLEAN DEFAULT TRUE,
    show_progress BOOLEAN DEFAULT TRUE,
    show_conflicts BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_custom_date_range CHECK (
        date_range_type != 'custom' OR (start_date IS NOT NULL AND end_date IS NOT NULL)
    )
);
```

#### TimelineSnapshot
```sql
CREATE TABLE timeline_snapshots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Snapshot metadata
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    snapshot_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Snapshot data
    timeline_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Comparison capabilities
    baseline_snapshot_id INTEGER REFERENCES timeline_snapshots(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_timeline_snapshots_project ON timeline_snapshots(project_id, snapshot_date DESC)
);
```

### Indexes for Performance

```sql
-- Timeline item queries
CREATE INDEX idx_timeline_items_project_date ON timeline_items(project_id, start_date, end_date);
CREATE INDEX idx_timeline_items_date_range ON timeline_items USING GIST (tstzrange(start_date, end_date));
CREATE INDEX idx_timeline_items_type_project ON timeline_items(item_type, project_id);
CREATE INDEX idx_timeline_items_critical_path ON timeline_items(is_critical_path) WHERE is_critical_path = TRUE;
CREATE INDEX idx_timeline_items_milestones ON timeline_items(is_milestone, project_id, start_date) WHERE is_milestone = TRUE;

-- Assignment queries
CREATE INDEX idx_timeline_assignments_user_date ON timeline_item_assignments(user_id, start_date, end_date);
CREATE INDEX idx_timeline_assignments_item ON timeline_item_assignments(timeline_item_id);

-- Dependency queries
CREATE INDEX idx_timeline_dependencies_predecessor ON timeline_item_dependencies(predecessor_id);
CREATE INDEX idx_timeline_dependencies_successor ON timeline_item_dependencies(successor_id);
CREATE INDEX idx_timeline_dependencies_critical ON timeline_item_dependencies(is_critical) WHERE is_critical = TRUE;

-- Conflict detection
CREATE INDEX idx_timeline_conflicts_unresolved ON timeline_conflicts(is_resolved, severity, detected_at) WHERE NOT is_resolved;
CREATE INDEX idx_timeline_conflicts_items ON timeline_conflicts(primary_item_id, secondary_item_id);

-- View queries
CREATE INDEX idx_timeline_views_owner ON timeline_views(owner_id, is_default);
CREATE INDEX idx_timeline_views_public ON timeline_views(is_public) WHERE is_public = TRUE;
```

### Materialized Views

#### TimelineOverlapView
```sql
CREATE MATERIALIZED VIEW timeline_overlap_view AS
SELECT 
    t1.id as item1_id,
    t2.id as item2_id,
    t1.title as item1_title,
    t2.title as item2_title,
    t1.project_id,
    GREATEST(t1.start_date, t2.start_date) as overlap_start,
    LEAST(t1.end_date, t2.end_date) as overlap_end,
    EXTRACT(days FROM (LEAST(t1.end_date, t2.end_date) - GREATEST(t1.start_date, t2.start_date))) as overlap_days,
    array_agg(DISTINCT u.id) as shared_users
FROM timeline_items t1
JOIN timeline_items t2 ON t1.id < t2.id 
    AND t1.project_id = t2.project_id
    AND tstzrange(t1.start_date, t1.end_date) && tstzrange(t2.start_date, t2.end_date)
JOIN timeline_item_assignments a1 ON t1.id = a1.timeline_item_id
JOIN timeline_item_assignments a2 ON t2.id = a2.timeline_item_id AND a1.user_id = a2.user_id
JOIN users u ON a1.user_id = u.id
GROUP BY t1.id, t2.id, t1.title, t2.title, t1.project_id, 
         t1.start_date, t1.end_date, t2.start_date, t2.end_date;

CREATE UNIQUE INDEX idx_timeline_overlap_items ON timeline_overlap_view(item1_id, item2_id);
```

#### CriticalPathView
```sql
CREATE MATERIALIZED VIEW critical_path_view AS
WITH RECURSIVE path_calculation AS (
    -- Start with items that have no predecessors
    SELECT 
        ti.id,
        ti.title,
        ti.start_date,
        ti.end_date,
        ti.duration_days,
        0 as path_level,
        ti.duration_days as total_duration,
        ARRAY[ti.id] as path_items
    FROM timeline_items ti
    WHERE NOT EXISTS (
        SELECT 1 FROM timeline_item_dependencies tid 
        WHERE tid.successor_id = ti.id
    )
    
    UNION ALL
    
    -- Recursively add dependent items
    SELECT 
        ti.id,
        ti.title,
        ti.start_date,
        ti.end_date,
        ti.duration_days,
        pc.path_level + 1,
        pc.total_duration + ti.duration_days,
        pc.path_items || ti.id
    FROM timeline_items ti
    JOIN timeline_item_dependencies tid ON ti.id = tid.successor_id
    JOIN path_calculation pc ON tid.predecessor_id = pc.id
)
SELECT 
    id,
    title,
    start_date,
    end_date,
    duration_days,
    path_level,
    total_duration,
    path_items,
    RANK() OVER (ORDER BY total_duration DESC) as path_rank
FROM path_calculation;

CREATE INDEX idx_critical_path_rank ON critical_path_view(path_rank, total_duration DESC);
```

### Triggers

#### Auto-Update Timeline Conflicts
```sql
CREATE OR REPLACE FUNCTION update_timeline_conflicts()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark existing conflicts as needing review
    UPDATE timeline_conflicts 
    SET last_checked_at = NOW()
    WHERE (primary_item_id = NEW.id OR secondary_item_id = NEW.id)
      AND NOT is_resolved;
    
    -- Trigger conflict detection for updated item
    INSERT INTO conflict_detection_queue (timeline_item_id, detection_type)
    VALUES (NEW.id, 'schedule_change');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_timeline_conflict_update
    AFTER UPDATE OF start_date, end_date ON timeline_items
    FOR EACH ROW
    WHEN (OLD.start_date != NEW.start_date OR OLD.end_date != NEW.end_date)
    EXECUTE FUNCTION update_timeline_conflicts();
```

#### Timeline Item Validation
```sql
CREATE OR REPLACE FUNCTION validate_timeline_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that feature timeline aligns with project dates
    IF NEW.feature_request_id IS NOT NULL THEN
        -- Check project boundaries
        PERFORM 1 FROM projects p 
        JOIN feature_requests fr ON p.id = fr.project_id
        WHERE fr.id = NEW.feature_request_id
          AND (p.start_date IS NULL OR NEW.start_date >= p.start_date)
          AND (p.end_date IS NULL OR NEW.end_date <= p.end_date);
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Timeline item dates must fall within project boundaries';
        END IF;
    END IF;
    
    -- Validate dependency logic
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Check for circular dependencies would go here
        -- This is complex and might be better handled in application logic
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_timeline_item
    BEFORE INSERT OR UPDATE ON timeline_items
    FOR EACH ROW EXECUTE FUNCTION validate_timeline_item();
```

#### Auto-Calculate Critical Path
```sql
CREATE OR REPLACE FUNCTION update_critical_path_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh critical path materialized view
    REFRESH MATERIALIZED VIEW critical_path_view;
    
    -- Update critical path flags on timeline items
    UPDATE timeline_items SET is_critical_path = FALSE;
    
    UPDATE timeline_items SET is_critical_path = TRUE
    WHERE id IN (
        SELECT UNNEST(path_items) 
        FROM critical_path_view 
        WHERE path_rank = 1
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_critical_path
    AFTER INSERT OR UPDATE OR DELETE ON timeline_item_dependencies
    FOR EACH STATEMENT EXECUTE FUNCTION update_critical_path_status();
```

## Migrations

### Migration 1: Create Core Timeline Tables
```python
from django.db import migrations, models
import django.db.models.deletion
import django.contrib.postgres.fields

class Migration(migrations.Migration):
    dependencies = [
        ('timeline', '0001_initial'),
        ('projects', '0003_project_enhancements'),
        ('features', '0005_sub_feature_request'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='TimelineItem',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_type', models.CharField(choices=[('feature', 'Feature'), ('milestone', 'Milestone'), ('project', 'Project'), ('task', 'Task')], max_length=20)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('start_date', models.DateTimeField()),
                ('end_date', models.DateTimeField()),
                ('progress_percentage', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('color_code', models.CharField(default='#3498db', max_length=7)),
                ('row_position', models.IntegerField(default=0)),
                ('display_order', models.IntegerField(default=0)),
                ('is_milestone', models.BooleanField(default=False)),
                ('is_critical_path', models.BooleanField(default=False)),
                ('is_collapsed', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.User')),
                ('feature_request', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='features.FeatureRequest')),
                ('parent_timeline_item', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='timeline.TimelineItem')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='timeline_items', to='projects.Project')),
            ],
            options={
                'ordering': ['project', 'display_order', 'start_date'],
            },
        ),
        
        migrations.CreateModel(
            name='TimelineItemAssignment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(default='assignee', max_length=50)),
                ('allocation_percentage', models.DecimalField(decimal_places=2, default=100, max_digits=5)),
                ('start_date', models.DateTimeField(blank=True, null=True)),
                ('end_date', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('timeline_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assignments', to='timeline.TimelineItem')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='auth.User')),
            ],
            options={
                'unique_together': {('timeline_item', 'user')},
            },
        ),
    ]
```

### Migration 2: Create Dependencies and Conflicts
```python
class Migration(migrations.Migration):
    dependencies = [
        ('timeline', '0002_create_timeline_items'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='TimelineItemDependency',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dependency_type', models.CharField(choices=[('finish_to_start', 'Finish to Start'), ('start_to_start', 'Start to Start'), ('finish_to_finish', 'Finish to Finish'), ('start_to_finish', 'Start to Finish')], default='finish_to_start', max_length=20)),
                ('lag_days', models.IntegerField(default=0)),
                ('is_critical', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('predecessor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='successor_dependencies', to='timeline.TimelineItem')),
                ('successor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='predecessor_dependencies', to='timeline.TimelineItem')),
            ],
            options={
                'unique_together': {('predecessor', 'successor', 'dependency_type')},
            },
        ),
        
        migrations.CreateModel(
            name='TimelineConflict',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('conflict_type', models.CharField(choices=[('overlap', 'Schedule Overlap'), ('resource', 'Resource Conflict'), ('dependency', 'Dependency Violation'), ('constraint', 'Constraint Violation')], max_length=20)),
                ('severity', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', max_length=10)),
                ('description', models.TextField()),
                ('suggested_resolution', models.TextField(blank=True)),
                ('impact_assessment', models.TextField(blank=True)),
                ('is_resolved', models.BooleanField(default=False)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('resolution_notes', models.TextField(blank=True)),
                ('detected_at', models.DateTimeField(auto_now_add=True)),
                ('last_checked_at', models.DateTimeField(auto_now=True)),
                ('auto_resolved', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('primary_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='primary_conflicts', to='timeline.TimelineItem')),
                ('resolved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='auth.User')),
                ('secondary_item', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='secondary_conflicts', to='timeline.TimelineItem')),
            ],
        ),
    ]
```