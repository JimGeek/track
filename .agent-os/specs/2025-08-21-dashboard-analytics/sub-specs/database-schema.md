# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-dashboard-analytics/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### New Tables

#### ProjectMetrics
```sql
CREATE TABLE project_metrics (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed_features INTEGER DEFAULT 0,
    total_features INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    velocity DECIMAL(8,2) DEFAULT 0.00,
    cycle_time_avg DECIMAL(8,2) DEFAULT 0.00,
    active_contributors INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_project_date UNIQUE (project_id, date),
    CONSTRAINT valid_completion_pct CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);
```

#### FeatureAnalytics
```sql
CREATE TABLE feature_analytics (
    id SERIAL PRIMARY KEY,
    feature_request_id INTEGER NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
    status_entered_at TIMESTAMP NOT NULL,
    previous_status VARCHAR(20),
    current_status VARCHAR(20) NOT NULL,
    status_duration_seconds INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    priority_changes INTEGER DEFAULT 0,
    assignee_changes INTEGER DEFAULT 0,
    time_to_completion_seconds INTEGER,
    complexity_score DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### UserActivityLog
```sql
CREATE TABLE user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user_activity_user_date ON user_activity_log(user_id, created_at),
    INDEX idx_user_activity_entity ON user_activity_log(entity_type, entity_id)
);
```

#### DashboardConfiguration
```sql
CREATE TABLE dashboard_configurations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dashboard_name VARCHAR(100) NOT NULL,
    layout_config JSONB NOT NULL,
    widget_settings JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_dashboard_name UNIQUE (user_id, dashboard_name)
);
```

#### MetricAlerts
```sql
CREATE TABLE metric_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    threshold_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    alert_message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by_id INTEGER REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_metric_alerts_entity ON metric_alerts(entity_type, entity_id),
    INDEX idx_metric_alerts_severity ON metric_alerts(severity, is_acknowledged)
);
```

### Materialized Views

#### ProjectSummaryView
```sql
CREATE MATERIALIZED VIEW project_summary_view AS
SELECT 
    p.id as project_id,
    p.title as project_title,
    COUNT(fr.id) as total_features,
    COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) as completed_features,
    ROUND(
        (COUNT(CASE WHEN fr.status = 'completed' THEN 1 END)::decimal / 
         NULLIF(COUNT(fr.id), 0)) * 100, 2
    ) as completion_percentage,
    COUNT(DISTINCT fr.assigned_to_id) as active_contributors,
    MIN(fr.created_at) as project_start_date,
    MAX(fr.updated_at) as last_activity_date,
    COUNT(CASE WHEN fr.deadline < CURRENT_DATE AND fr.status != 'completed' THEN 1 END) as overdue_features
FROM projects p
LEFT JOIN feature_requests fr ON p.id = fr.project_id
GROUP BY p.id, p.title;

CREATE UNIQUE INDEX idx_project_summary_project_id ON project_summary_view(project_id);
```

#### WeeklyVelocityView
```sql
CREATE MATERIALIZED VIEW weekly_velocity_view AS
SELECT 
    fr.project_id,
    DATE_TRUNC('week', fr.completed_at) as week_start,
    COUNT(*) as features_completed,
    AVG(EXTRACT(epoch FROM (fr.completed_at - fr.created_at))/86400) as avg_cycle_time_days
FROM feature_requests fr
WHERE fr.status = 'completed' 
    AND fr.completed_at IS NOT NULL
    AND fr.completed_at >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY fr.project_id, DATE_TRUNC('week', fr.completed_at)
ORDER BY fr.project_id, week_start;

CREATE INDEX idx_weekly_velocity_project_week ON weekly_velocity_view(project_id, week_start);
```

### Indexes

```sql
-- Performance indexes for analytics queries
CREATE INDEX idx_project_metrics_project_date ON project_metrics(project_id, date DESC);
CREATE INDEX idx_feature_analytics_feature ON feature_analytics(feature_request_id);
CREATE INDEX idx_feature_analytics_status_duration ON feature_analytics(current_status, status_duration_seconds);
CREATE INDEX idx_user_activity_log_timestamp ON user_activity_log(created_at DESC);
CREATE INDEX idx_user_activity_log_action_type ON user_activity_log(action_type, created_at DESC);

-- Composite indexes for dashboard queries
CREATE INDEX idx_feature_requests_project_status_date ON feature_requests(project_id, status, created_at);
CREATE INDEX idx_feature_requests_deadline_status ON feature_requests(deadline, status) WHERE deadline IS NOT NULL;
CREATE INDEX idx_feature_requests_assigned_status ON feature_requests(assigned_to_id, status, updated_at);
```

### Triggers

#### Update Project Metrics Trigger
```sql
CREATE OR REPLACE FUNCTION update_project_metrics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO project_metrics (project_id, date, completed_features, total_features, completion_percentage)
    SELECT 
        NEW.project_id,
        CURRENT_DATE,
        COUNT(CASE WHEN status = 'completed' THEN 1 END),
        COUNT(*),
        ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END)::decimal / COUNT(*)) * 100, 2)
    FROM feature_requests 
    WHERE project_id = NEW.project_id
    ON CONFLICT (project_id, date) DO UPDATE SET
        completed_features = EXCLUDED.completed_features,
        total_features = EXCLUDED.total_features,
        completion_percentage = EXCLUDED.completion_percentage,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_metrics
    AFTER INSERT OR UPDATE OF status ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION update_project_metrics();
```

#### Feature Analytics Tracking Trigger
```sql
CREATE OR REPLACE FUNCTION track_feature_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO feature_analytics (
            feature_request_id,
            status_entered_at,
            previous_status,
            current_status,
            status_duration_seconds
        ) VALUES (
            NEW.id,
            NOW(),
            OLD.status,
            NEW.status,
            EXTRACT(EPOCH FROM (NOW() - OLD.updated_at))
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_feature_status_change
    AFTER UPDATE OF status ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION track_feature_status_change();
```

## Migrations

### Migration 1: Create Analytics Tables
```python
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('analytics', '0001_initial'),
        ('features', '0005_sub_feature_request'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='ProjectMetrics',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('completed_features', models.IntegerField(default=0)),
                ('total_features', models.IntegerField(default=0)),
                ('completion_percentage', models.DecimalField(decimal_places=2, max_digits=5)),
                ('velocity', models.DecimalField(decimal_places=2, max_digits=8)),
                ('cycle_time_avg', models.DecimalField(decimal_places=2, max_digits=8)),
                ('active_contributors', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='metrics', to='projects.Project')),
            ],
            options={
                'unique_together': {('project', 'date')},
            },
        ),
        migrations.CreateModel(
            name='FeatureAnalytics',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status_entered_at', models.DateTimeField()),
                ('previous_status', models.CharField(max_length=20, blank=True)),
                ('current_status', models.CharField(max_length=20)),
                ('status_duration_seconds', models.IntegerField(default=0)),
                ('total_comments', models.IntegerField(default=0)),
                ('priority_changes', models.IntegerField(default=0)),
                ('assignee_changes', models.IntegerField(default=0)),
                ('time_to_completion_seconds', models.IntegerField(blank=True, null=True)),
                ('complexity_score', models.DecimalField(decimal_places=1, max_digits=3, blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('feature_request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='analytics', to='features.FeatureRequest')),
            ],
        ),
    ]
```

### Migration 2: Create Materialized Views
```python
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('analytics', '0002_create_analytics_tables'),
    ]
    
    operations = [
        migrations.RunSQL(
            """
            CREATE MATERIALIZED VIEW project_summary_view AS
            SELECT 
                p.id as project_id,
                p.title as project_title,
                COUNT(fr.id) as total_features,
                COUNT(CASE WHEN fr.status = 'completed' THEN 1 END) as completed_features,
                ROUND((COUNT(CASE WHEN fr.status = 'completed' THEN 1 END)::decimal / NULLIF(COUNT(fr.id), 0)) * 100, 2) as completion_percentage
            FROM projects_project p
            LEFT JOIN features_featurerequest fr ON p.id = fr.project_id
            GROUP BY p.id, p.title;
            
            CREATE UNIQUE INDEX idx_project_summary_project_id ON project_summary_view(project_id);
            """,
            reverse_sql="DROP MATERIALIZED VIEW IF EXISTS project_summary_view;"
        ),
    ]
```